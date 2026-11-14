import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect } from '../scripts/inspect.mjs';
import { factualDigest, validateCandidate } from '../scripts/contracts.mjs';
import { bundle, candidate, snapshot, fakeCopyReview, fakeChecker } from './fixtures.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('boundary utility validates, hashes and attaches review without authoring or changing facts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-inspect-'));
  try {
    const input = join(dir, 'candidate.json'), reviewPath = join(dir, 'review.json'), output = join(dir, 'reviewed.json');
    const doc = await snapshot();
    const { review, copy_review, copy_review_iterations, ...candidate } = doc;
    const copyPath = join(dir, 'copy.json');
    await writeFile(input, JSON.stringify(candidate));
    await writeFile(reviewPath, JSON.stringify(review));
    await writeFile(copyPath, JSON.stringify(copy_review));
    const budget = join(dir, 'budget.json');
    assert.equal((await inspect('claim-copy', input, budget)).ok, true);
    assert.deepEqual(await inspect('digest', input), { ok: true, factual_digest: factualDigest(candidate) });
    assert.equal((await inspect('inventory', input)).candidate_digest, factualDigest(candidate));
    assert.equal((await inspect('copy', input, copyPath)).ok, true);
    assert.equal((await inspect('attach', input, reviewPath, join(dir, 'missing-copy.json'))).ok, false);
    assert.equal((await inspect('attach', input, reviewPath, output, copyPath, budget)).ok, true);
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), doc);
    assert.equal((await inspect('attach', input, reviewPath, output, copyPath, budget)).ok, false, 'Never overwrite');
    candidate.summary += ' Changed.';
    await writeFile(input, JSON.stringify(candidate));
    const stale = await inspect('attach', input, reviewPath, join(dir, 'stale.json'), copyPath, budget);
    assert.ok(stale.errors.some(e => e.code === 'stale_review'));
    await writeFile(input, JSON.stringify(bundle()));
    assert.equal((await inspect('bundle', input)).ok, true);
    assert.equal((await inspect('unknown', input)).ok, false);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test('assembly CLI combines only authored draft fields with unchanged bundle metadata into a private new candidate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-assemble-cli-'));
  try {
    const input = bundle(), authored = candidate(input);
    const draft = { schema_version: '1.1', header_copy: authored.header_copy, snapshot_id: authored.snapshot_id,
      editor_id: authored.editor_id, parent_agent_id: authored.parent_agent_id,
      summary: authored.summary, claims: authored.claims,
      events: authored.timeline.map(e => ({ occurrence_id: e.id, description: e.description,
        claim_refs: e.claim_refs, supporting_detail: e.supporting_detail ?? '' })),
      artifact_claims: authored.artifact_claims, omitted_occurrences: authored.omitted_occurrences };
    const bundlePath = join(dir, 'bundle.json'), draftPath = join(dir, 'draft.json'), output = join(dir, 'candidate.json');
    await writeFile(bundlePath, JSON.stringify(input)); await writeFile(draftPath, JSON.stringify(draft));
    const before = await Promise.all([readFile(bundlePath, 'utf8'), readFile(draftPath, 'utf8')]);
    const cli = fileURLToPath(new URL('../scripts/inspect.mjs', import.meta.url));
    const run = spawnSync(process.execPath, [cli, 'assemble', bundlePath, draftPath, output], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stdout); assert.equal(run.stderr, '');
    const result = JSON.parse(run.stdout), assembled = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(result.candidate_path, output); assert.equal(result.candidate_digest, factualDigest(assembled));
    assert.equal(assembled.schema_version, '1.7'); assert.equal(validateCandidate(assembled).ok, true);
    for (const field of ['run', 'actors', 'sessions', 'evidence', 'artifacts', 'presentation']) assert.deepEqual(assembled[field], input[field], field);
    assert.equal(assembled.review, undefined); assert.equal(assembled.copy_review, undefined);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    const bytes = await readFile(output, 'utf8');
    assert.equal((await inspect('assemble', bundlePath, draftPath, output)).ok, false);
    assert.equal(await readFile(output, 'utf8'), bytes);
    assert.deepEqual(await Promise.all([readFile(bundlePath, 'utf8'), readFile(draftPath, 'utf8')]), before);
    draft.events[0].session_id = 'metadata-overwrite-attempt';
    await writeFile(draftPath, JSON.stringify(draft));
    assert.equal((await inspect('assemble', bundlePath, draftPath, join(dir, 'invalid.json'))).ok, false);
    await assert.rejects(stat(join(dir, 'invalid.json')));
  } finally { await rm(dir, { recursive: true }); }
});

test('two immutable copy dispatch claims survive resumed calls without overwrite or a third claim', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-copy-budget-'));
  try {
    const input = join(dir, 'candidate.json'), budget = join(dir, 'copy-review-budget.json');
    const doc = candidate(); await writeFile(input, JSON.stringify(doc));
    const claimed = await inspect('claim-copy', input, budget);
    assert.equal(claimed.ok, true); assert.equal(claimed.copy_reviews_consumed, 1);
    assert.equal((await stat(budget)).mode & 0o777, 0o600);
    const marker = await readFile(budget, 'utf8');
    assert.equal(JSON.parse(marker).candidate_digest, factualDigest(doc));
    const cli = fileURLToPath(new URL('../scripts/inspect.mjs', import.meta.url));
    doc.summary += ' Changed.'; await writeFile(input, JSON.stringify(doc));
    // A separate process claims the remaining iteration, never resets the first.
    const resumed = spawnSync(process.execPath, [cli, 'claim-copy', input, budget], { encoding: 'utf8' });
    assert.equal(resumed.status, 0); assert.equal(JSON.parse(resumed.stdout).copy_reviews_consumed, 2);
    assert.equal(JSON.parse(resumed.stdout).claim_path, `${budget}.iteration-2`);
    assert.equal(JSON.parse(await readFile(`${budget}.iteration-2`, 'utf8')).candidate_digest, factualDigest(doc));
    assert.equal((await stat(`${budget}.iteration-2`)).mode & 0o777, 0o600);
    doc.summary += ' Changed.'; await writeFile(input, JSON.stringify(doc));
    assert.equal((await inspect('claim-copy', input, budget)).errors[0].code, 'copy_review_limit');
    assert.equal(await readFile(budget, 'utf8'), marker);
    doc.timeline[0].actor_id = 'missing'; await writeFile(input, JSON.stringify(doc));
    assert.equal((await inspect('claim-copy', input, join(dir, 'invalid-budget.json'))).ok, false);
    await assert.rejects(stat(join(dir, 'invalid-budget.json')));
  } finally { await rm(dir, { recursive: true }); }
});

test('attachment derives iteration two from matching claims and retains a genuine nonpassing review', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-copy-attach-'));
  try {
    const input = join(dir, 'candidate.json'), budget = join(dir, 'budget.json');
    const copy = join(dir, 'copy.json'), fact = join(dir, 'fact.json');
    const doc = candidate(), review = fakeCopyReview(doc); review.verdict = 'revise';
    await writeFile(input, JSON.stringify(doc)); await writeFile(copy, JSON.stringify(review));
    await writeFile(fact, JSON.stringify(await fakeChecker().check(doc)));
    assert.equal((await inspect('claim-copy', input, budget)).ok, true);
    assert.equal((await inspect('attach', input, fact, join(dir, 'first.json'), copy, budget)).ok, false);
    assert.equal((await inspect('claim-copy', input, budget)).ok, true);
    const output = join(dir, 'second.json');
    assert.equal((await inspect('attach', input, fact, output, copy, budget)).ok, true);
    const saved = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(saved.copy_review_iterations, 2); assert.deepEqual(saved.copy_review, review);
    assert.equal((await inspect('claim-copy', input, budget)).errors[0].code, 'copy_review_limit');
    assert.equal((await inspect('attach', input, fact, join(dir, 'no-budget.json'), copy)).ok, false);
  } finally { await rm(dir, { recursive: true }); }
});

test('concurrent claims permit only two dispatches and reject legacy or malformed budgets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-copy-race-'));
  try {
    const input = join(dir, 'candidate.json'), budget = join(dir, 'budget.json');
    await writeFile(input, JSON.stringify(candidate()));
    const claims = await Promise.all(Array.from({ length: 8 }, () => inspect('claim-copy', input, budget)));
    assert.equal(claims.filter(result => result.ok).length, 2);
    assert.deepEqual(claims.filter(result => result.ok).map(result => result.copy_reviews_consumed).sort(), [1, 2]);
    for (const marker of [{ schema_version: '1.0', copy_reviews_consumed: 1, candidate_digest: factualDigest(candidate()) }, { schema_version: '1.1', max_copy_reviews: 2, copy_reviews_consumed: 0, candidate_digest: 'bad' }]) {
      const path = join(dir, `invalid-${marker.schema_version}.json`); await writeFile(path, JSON.stringify(marker));
      const bytes = await readFile(path, 'utf8');
      assert.equal((await inspect('claim-copy', input, path)).ok, false);
      assert.equal(await readFile(path, 'utf8'), bytes);
      await assert.rejects(stat(`${path}.iteration-2`));
    }
  } finally { await rm(dir, { recursive: true }); }
});
