// Deterministic boundary utilities only: no narrative, source calls or dispatch.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { validate, validateCandidate, validateFactualReview, factualDigest, validateCopyReview, copyFields } from './contracts.mjs';
import { reviewPacket, nativeReview, reviewSummary } from './review-io.mjs';
import { assembleCandidate } from './assemble.mjs';
import { claimCopy, copyBudget } from './copy-budget.mjs';

export async function inspect(command, inputPath, reviewPath, outputPath, copyReviewPath, budgetPath) {
  try {
    const load = async (path) => {
      const bytes = await readFile(path);
      if (bytes.length > 10 * 1024 * 1024) throw new Error('size');
      return JSON.parse(bytes.toString('utf8'));
    };
    const doc = await load(inputPath);
    if (command === 'bundle') return validate(doc, 'bundle');
    if (command === 'assemble' && reviewPath && outputPath) {
      const result = assembleCandidate(doc, await load(reviewPath));
      if (!result.ok) return result;
      await writeFile(outputPath, `${JSON.stringify(result.snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, candidate_path: resolve(outputPath), candidate_digest: factualDigest(result.snapshot) };
    }
    if (command === 'digest') return { ok: true, factual_digest: factualDigest(doc) };
    if (command === 'inventory') return { ok: true, candidate_digest: factualDigest(doc), fields: copyFields(doc) };
    if (command === 'claim-copy' && reviewPath) {
      const result = validateCandidate(doc);
      if (!result.ok) return result;
      return await claimCopy(reviewPath, factualDigest(doc));
    }
    if (['packet-copy', 'packet-fact'].includes(command) && reviewPath) {
      const result = validateCandidate(doc);
      if (!result.ok) return result;
      const packet = await reviewPacket(command.slice(7), doc, inputPath);
      await writeFile(reviewPath, `${JSON.stringify(packet, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, packet_path: resolve(reviewPath), candidate_digest: packet.candidate_digest };
    }
    if (['capture-copy', 'capture-fact'].includes(command) && reviewPath && outputPath && copyReviewPath) {
      const preflight = validateCandidate(doc);
      if (!preflight.ok) return preflight;
      const bytes = await readFile(reviewPath);
      if (bytes.length > 10 * 1024 * 1024) throw new Error('size');
      const review = nativeReview(bytes.toString('utf8'), copyReviewPath);
      const kind = command.slice(8);
      const result = kind === 'copy' ? validateCopyReview(doc, review, { requirePass: false }) : validateFactualReview(doc, review);
      if (!result.ok) return result;
      await writeFile(outputPath, `${JSON.stringify(review, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, review_path: resolve(outputPath), candidate_digest: factualDigest(doc), ...reviewSummary(kind, review) };
    }
    if (command === 'copy' && reviewPath) return validateCopyReview(doc, await load(reviewPath), { requirePass: false });
    if (command === 'fact' && reviewPath) return validateFactualReview(doc, await load(reviewPath));
    if (command === 'attach' && reviewPath && outputPath) {
      const review = await load(reviewPath);
      const budget = await copyBudget(budgetPath);
      if (budget.candidate_digest !== factualDigest(doc)) return { ok: false, errors: [{ path: '$.copy_review', code: 'stale_review', message: 'Final candidate does not match the latest copy claim.', repair: 'Use the exact last reviewed candidate; never restamp reviews or budget claims.' }] };
      const checked = { ...doc, review, copy_review_iterations: budget.copy_reviews_consumed, ...(copyReviewPath ? { copy_review: await load(copyReviewPath) } : {}) };
      const result = validate(checked);
      if (!result.ok) return result;
      await writeFile(outputPath, `${JSON.stringify(checked, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, snapshot_path: resolve(outputPath), factual_digest: factualDigest(checked) };
    }
    return { ok: false, errors: [{ path: '$command', code: 'usage', message: 'Expected bundle, assemble, digest, inventory, claim-copy, packet-copy, packet-fact, capture-copy, capture-fact, copy, fact or attach.', repair: 'Use the documented direct Node invocation.' }] };
  } catch {
    return { ok: false, errors: [{ path: '$file', code: 'input_output', message: 'Could not read JSON or create a new reviewed file.', repair: 'Check sanitized JSON, size, permissions and paths; never overwrite an existing file.' }] };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await inspect(...process.argv.slice(2));
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
