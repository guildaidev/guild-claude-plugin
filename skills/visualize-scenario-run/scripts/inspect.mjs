// Deterministic boundary utilities only: no narrative, source calls or dispatch.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { validate, validateCandidate, validateFactualReview, factualDigest, validateCopyReview, copyFields, optionalReviewRecords } from './contracts.mjs';
import { reviewPacket, nativeReview, nativeHandbackReview, expandedReview, reviewSummary } from './review-io.mjs';
import { assembleCandidate } from './assemble.mjs';
import { claimCopy, copyBudget } from './copy-budget.mjs';
import { collectSessionEvidence } from './session-evidence.mjs';
import { packagePostrunFile } from './postrun-package.mjs';
import { createSourceGroundingReport, validateSourceGroundingReport, sourceGroundingAuthorFeedback } from './source-grounding.mjs';
import { ReviewCaptureError, parseReviewJSON } from './review-capture.mjs';

export async function inspect(command, inputPath, reviewPath, outputPath, copyReviewPath, budgetPath) {
  try {
    // The packager owns its stricter private file boundary and two-output commit.
    if (command === 'postrun-package' && reviewPath && outputPath) {
      return await packagePostrunFile(inputPath, reviewPath, outputPath);
    }
    // packet-handback CHILD_JSONL PARENT_JSONL NEW_CAPTURE [FORMAT]
    // Serialization only: no path discovery, native wait or dispatch authority.
    if (command === 'packet-handback' && reviewPath && outputPath) {
      const format = copyReviewPath ?? 'native-handback';
      if (!['native-handback', 'forwarded-handback'].includes(format)) throw new Error('format');
      const [child, parent] = await Promise.all([readFile(inputPath), readFile(reviewPath)]);
      if (child.length > 10 * 1024 * 1024 || parent.length > 10 * 1024 * 1024) throw new Error('size');
      const text = JSON.stringify({ capture_version: '1.0', format, transcript: child.toString('utf8'), correlation: parent.toString('utf8') });
      if (Buffer.byteLength(text) > 24 * 1024 * 1024) throw new Error('size');
      await writeFile(outputPath, `${text}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, capture_packet_path: resolve(outputPath), format, native_completion_validated: false };
    }
    const load = async (path) => {
      const bytes = await readFile(path);
      if (bytes.length > 10 * 1024 * 1024) throw new Error('size');
      return parseReviewJSON(bytes.toString('utf8'));
    };
    const doc = await load(inputPath);
    // preflight-source CANDIDATE ORIGINAL_BUNDLE NEW_PRIVATE_REPORT
    if (command === 'preflight-source' && reviewPath && outputPath) {
      const original = await load(reviewPath);
      const result = createSourceGroundingReport(doc, original);
      if (!result.ok) return result;
      const feedback = sourceGroundingAuthorFeedback(doc, original, result.report);
      if (!feedback.ok) return feedback;
      await writeFile(outputPath, `${JSON.stringify(result.report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, report_path: resolve(outputPath), candidate_digest: factualDigest(doc), author_feedback: feedback.feedback };
    }
    // session-evidence SESSION_EVENTS NEW_REPORT CAPTURED_AT_UTC
    // Postrun data conversion only, never polls or reads external systems.
    if (command === 'session-evidence' && reviewPath && outputPath) {
      const report = collectSessionEvidence(doc, { captured_at: outputPath });
      if (!report.ok) return report;
      await writeFile(reviewPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, evidence_path: resolve(reviewPath), records: report.evidence.length, gaps: report.gaps };
    }
    // finalize CANDIDATE NEW_SNAPSHOT [COPY_RECORD|-] [FACT_RECORD|-]
    // Files are private diagnostics, never repaired into approvals. In particular
    // an invalid JSON response is not an excuse to manufacture an empty pass.
    if (command === 'finalize' && reviewPath) {
      if (!['1.9', '1.10'].includes(doc.schema_version)) return { ok: false, errors: [{ path: '$.schema_version', code: 'workflow_version', message: 'Finalize requires a source-bound candidate.', repair: 'Assemble draft 1.4 from the original bundle; retain historical files unchanged.' }] };
      const checked = validateCandidate(doc);
      if (!checked.ok) return checked;
      const snapshot = structuredClone(doc), diagnostics = {};
      for (const [key, path] of [['copy_review', outputPath], ['review', copyReviewPath]]) {
        if (!path || path === '-') continue;
        try { snapshot[key] = await load(path); }
        catch { diagnostics[key] = { ok: false, errors: [{ code: 'invalid_review_file' }] }; }
      }
      const result = validate(snapshot);
      if (!result.ok) return result;
      Object.assign(diagnostics, optionalReviewRecords(snapshot).diagnostics);
      await writeFile(reviewPath, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, snapshot_path: resolve(reviewPath), factual_digest: factualDigest(snapshot), review_diagnostics: diagnostics };
    }
    if (command === 'bundle') return validate(doc, 'bundle');
    if (command === 'assemble' && reviewPath && outputPath) {
      // Optional collector-owned source references, never authored replacement
      // content. The assembler independently reproduces every version.
      const options = copyReviewPath && copyReviewPath !== '-'
        ? { artifactVersionSource: await load(copyReviewPath) } : {};
      const result = assembleCandidate(doc, await load(reviewPath), options);
      if (!result.ok) return result;
      await writeFile(outputPath, `${JSON.stringify(result.snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, candidate_path: resolve(outputPath), candidate_digest: factualDigest(result.snapshot) };
    }
    if (command === 'digest') return { ok: true, factual_digest: factualDigest(doc) };
    if (command === 'inventory') return { ok: true, candidate_digest: factualDigest(doc), fields: copyFields(doc) };
    if (command === 'claim-copy' && reviewPath) {
      const result = validateCandidate(doc);
      if (!result.ok) return result;
      // Source-bound authoring performs private preflight before consuming either
      // claim. Unresolved lexical findings are NOT an approval/render gate.
      if (['1.9', '1.10'].includes(doc.schema_version)) {
        if (!outputPath || !copyReviewPath) return { ok: false, errors: [{ path: '$preflight', code: 'source_grounding_required', message: 'Supply the original collector bundle and current private source-grounding report before a copy claim.', repair: 'Run preflight-source locally; inspect its authored-field locations without inventing support or consuming another model call.' }] };
        const current = validateSourceGroundingReport(doc, await load(outputPath), await load(copyReviewPath));
        if (!current.ok) return current;
      }
      return await claimCopy(reviewPath, factualDigest(doc));
    }
    if (['packet-copy', 'packet-fact', 'packet-copy-full', 'packet-fact-full'].includes(command) && reviewPath) {
      const result = validateCandidate(doc);
      if (!result.ok) return result;
      const kind = command.startsWith('packet-copy') ? 'copy' : 'fact';
      const packet = await reviewPacket(kind, doc, inputPath, { format: command.endsWith('-full') ? 'full' : 'compact', navigation: {
        candidate_document: { path: resolve(inputPath), text: await readFile(inputPath, 'utf8') },
      } });
      await writeFile(reviewPath, `${JSON.stringify(packet, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, packet_path: resolve(reviewPath), candidate_digest: packet.manifest?.candidate_digest ?? packet.candidate_digest, packet_format: packet.codec_version ? 'compact' : 'full' };
    }
    // expand-review CANDIDATE GENUINE_WIRE_REVIEW EXACT_PACKET NEW_FULL_REVIEW
    if (command === 'expand-review' && reviewPath && outputPath && copyReviewPath) {
      const checked = validateCandidate(doc);
      if (!checked.ok) return checked;
      const packet = await load(outputPath), record = expandedReview(await load(reviewPath), packet, doc);
      const kind = packet.kind;
      if (!['copy', 'fact'].includes(kind)) throw new Error('kind');
      const result = kind === 'copy' ? validateCopyReview(doc, record, { requirePass: false }) : validateFactualReview(doc, record);
      if (!result.ok) return result;
      await writeFile(copyReviewPath, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, review_path: resolve(copyReviewPath), candidate_digest: factualDigest(doc), ...reviewSummary(kind, record) };
    }
    // capture-native-copy|capture-native-fact CANDIDATE CAPTURE_PACKET NEW_REVIEW BINDING
    // The packet/binding come only from explicitly exposed completed host records.
    if (['capture-native-copy', 'capture-native-fact'].includes(command) && reviewPath && outputPath && copyReviewPath) {
      const checked = validateCandidate(doc);
      if (!checked.ok) return checked;
      const bytes = await readFile(reviewPath);
      if (bytes.length > 24 * 1024 * 1024) throw new Error('size');
      const kind = command.slice(15), binding = await load(copyReviewPath);
      if (binding.kind !== kind || binding.candidateDigest !== factualDigest(doc)) return { ok: false, errors: [{ path: '$binding', code: 'stale_review', message: 'The capture binding does not match this candidate and review role.', repair: 'Use the retained dispatch binding for the unchanged candidate; never restamp it.' }] };
      const captured = nativeHandbackReview(bytes.toString('utf8'), binding);
      const review = expandedReview(captured.review, budgetPath ? await load(budgetPath) : undefined, doc);
      const result = kind === 'copy' ? validateCopyReview(doc, review, { requirePass: false }) : validateFactualReview(doc, review);
      if (!result.ok) return result;
      await writeFile(outputPath, `${JSON.stringify(review, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { ok: true, review_path: resolve(outputPath), candidate_digest: factualDigest(doc), capture_provenance: captured.provenance, ...reviewSummary(kind, review) };
    }
    if (['capture-copy', 'capture-fact'].includes(command) && reviewPath && outputPath && copyReviewPath) {
      const preflight = validateCandidate(doc);
      if (!preflight.ok) return preflight;
      const bytes = await readFile(reviewPath);
      if (bytes.length > 10 * 1024 * 1024) throw new Error('size');
      const review = expandedReview(nativeReview(bytes.toString('utf8'), copyReviewPath), budgetPath ? await load(budgetPath) : undefined, doc);
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
    return { ok: false, errors: [{ path: '$command', code: 'usage', message: 'Expected postrun-package, session-evidence, bundle, assemble, preflight-source, digest, inventory, claim-copy, packet-copy, packet-fact, packet-copy-full, packet-fact-full, packet-handback, capture-copy, capture-fact, capture-native-copy, capture-native-fact, expand-review, copy, fact, finalize or historical attach.', repair: 'Use the documented direct Node invocation.' }] };
  } catch (error) {
    if (error instanceof ReviewCaptureError) return { ok: false, errors: [{ path: '$capture', code: `review_capture_${error.code}`, message: error.message,
      repair: 'Keep the genuine response privately. Use only the documented completed transport and retained identity binding; do not repeat this capture on unchanged input or obtain a formatting-only review.' }] };
    const codec = /^review_codec:([a-z_]{1,64})$/.exec(error?.message ?? '');
    if (codec || error?.message === 'compact_packet_required') return { ok: false, errors: [{ path: '$review', code: codec ? `review_codec_${codec[1]}` : 'compact_packet_required',
      message: 'The compact review or its exact retained packet did not satisfy the lossless binding contract.',
      repair: 'Keep the original feedback and packet unchanged. Do not invent missing judgments, restamp identities, downgrade formats or dispatch another reviewer for serialization.' }] };
    return { ok: false, errors: [{ path: '$file', code: 'input_output', message: 'Could not read JSON or create a new reviewed file.', repair: 'Check sanitized JSON, size, permissions and paths; never overwrite an existing file.' }] };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await inspect(...process.argv.slice(2));
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
