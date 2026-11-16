import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { sourceBoundCandidate, fakeCopyReview, fakeChecker, snapshot } from './fixtures.mjs';
import { validate, validateCandidate, validateCopyReview, validateFactualReview, factualDigest, prepareRenderSnapshot } from '../scripts/contracts.mjs';
import { renderHtml, renderFile } from '../scripts/render.mjs';
import { feedbackRuntime } from '../scripts/feedback.mjs';
import { validatedFeedbackContext as feedbackContext } from '../scripts/feedback-context.mjs';
import { reviewLoop } from '../scripts/workflow.mjs';
import { inspect } from '../scripts/inspect.mjs';
import { beginProgress, changeProgress } from '../scripts/progress.mjs';

const temp = () => mkdtemp('/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode/normal-render-');
const save = (path, doc) => writeFile(path, JSON.stringify(doc), { flag: 'wx', mode: 0o600 });
const badCopy = doc => ({ ...fakeCopyReview(doc), verdict: 'revise', findings: [{
  field_path: '$.artifacts[0].after', field_digest: '0'.repeat(64),
  rule_group: 'economist', rule_id: 'clarity', severity: 'advisory',
  explanation: 'Private malformed protected-source finding.', semantic_risk: 'none',
}] });
const publicClean = (html, prompt) => {
  for (const value of [html.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<textarea id="feedback-context"[\s\S]*?<\/textarea>/g, ''), prompt]) {
    assert.doesNotMatch(value, /Private malformed|reviewer_id|checker_id|candidate_digest|field_digest|rule_versions|copy_review|limited.evidence|nonapproval|generation/i);
  }
};

test('source-bound 1.9 uses the full normal renderer without review records or a new display mode', () => {
  const doc = sourceBoundCandidate(), before = structuredClone(doc);
  assert.equal(validateCandidate(doc).ok, true);
  assert.equal(validate(doc).ok, true);
  const result = renderHtml(doc);
  assert.equal(result.ok, true);
  for (const token of ['inline-flex items-center justify-center', 'class="prompt-state" aria-label="Claude prompt"', 'id="comment-composer"', 'id="prompt-review"', 'scenario-intro', "connect-src &#39;none&#39;", "script-src &#39;sha256-"]) assert.ok(result.html.includes(token), token);
  assert.doesNotMatch(result.html, /unsafe-inline|unsafe-eval|<iframe|<img /);
  const context = feedbackContext(doc), runtime = feedbackRuntime();
  assert.equal(context.candidate_digest, factualDigest(doc));
  const items = runtime.add(context, [], 'comment', 'issue', 'draft-1', 'Keep this draft for review.');
  const prompt = runtime.compose(context, items);
  assert.match(prompt, /Keep this draft for review/);
  publicClean(result.html, prompt);
  assert.deepEqual(doc, before);
});

for (const second of ['protected-source', 'out-of-inventory', 'incomplete', 'malformed']) {
  test(`bounded ${second} second-copy response plus absent factual response renders normal HTML`, async () => {
    const doc = sourceBoundCandidate(), source = structuredClone(doc.source_bundle);
    let copies = 0, facts = 0, renders = 0, secondRecord;
    const result = await reviewLoop({ edit: async () => doc,
      copyCheck: async candidate => {
        copies++;
        if (copies === 1) return { ...fakeCopyReview(candidate), verdict: 'revise' };
        secondRecord = second === 'malformed' ? 'not JSON' : badCopy(candidate);
        if (second === 'out-of-inventory') secondRecord.findings[0].field_path = '$.not-a-field';
        if (second === 'incomplete') secondRecord.passages = [];
        return secondRecord;
      },
      check: async () => { facts++; return undefined; },
      render: async candidate => {
        renders++;
        assert.deepEqual(candidate.source_bundle, source);
        assert.deepEqual(candidate.artifacts, doc.artifacts);
        assert.deepEqual(candidate.copy_review, secondRecord);
        assert.equal(candidate.review, undefined);
        return renderHtml(candidate);
      },
    });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(copies, 2); assert.equal(facts, 1); assert.equal(renders, 1);
    assert.equal(result.diagnostics[1].validation.ok, false);
    assert.match(result.html, /id="prompt-review"/);
    publicClean(result.html, '');
    assert.deepEqual(doc.source_bundle, source);
  });
}

test('optional stale or non-independent reviews never become valid status or uncertainty', async () => {
  const doc = sourceBoundCandidate();
  doc.review = await fakeChecker({ finding: 'conflict', gap: 'Private stale conflicting judgment.' }).check(doc);
  doc.copy_review = fakeCopyReview(doc);
  const original = structuredClone(doc);
  doc.summary += ' Source-scoped clarification.';
  const prepared = prepareRenderSnapshot(doc);
  assert.equal(prepared.ok, true);
  assert.equal(prepared.review_diagnostics.fact.ok, false);
  assert.equal(prepared.review_diagnostics.copy.ok, false);
  assert.equal(prepared.snapshot.review, undefined);
  assert.equal(prepared.snapshot.copy_review, undefined);
  assert.equal(feedbackContext(doc).candidate_digest, factualDigest(doc));
  assert.doesNotMatch(renderHtml(doc).html, /Private stale|Sources conflict|event terminal/);
  assert.deepEqual(doc.review, original.review);
  assert.equal(validateFactualReview({ ...doc, review: undefined }, doc.review).ok, false);
  assert.equal(validateCopyReview(doc, doc.copy_review, { requirePass: false }).ok, false);
  delete doc.review; delete doc.copy_review;
  doc.review = await fakeChecker().check(doc); doc.copy_review = fakeCopyReview(doc);
  doc.copy_review.reviewer_id = doc.review.checker_id;
  const shared = prepareRenderSnapshot(doc);
  assert.equal(shared.snapshot.review, undefined);
  assert.equal(shared.snapshot.copy_review, undefined);
});

test('current source binding rejects source edits, dangling refs, secrets and schema downgrade shortcuts', async () => {
  const doc = sourceBoundCandidate();
  for (const change of [
    d => { d.artifacts[0].after = 'A forged payload'; },
    d => { d.timeline[0].outcome = 'failed'; },
    d => { d.run.id = 'another-run'; },
    d => { d.evidence[0].content.status = 'forged'; },
    d => { d.timeline[1].claim_refs = ['absent']; },
    d => { d.summary = 'Bearer abcdefghijklmnopqrstuvwxyz'; },
    d => { delete d.source_bundle; },
  ]) {
    const changed = structuredClone(doc); change(changed);
    assert.equal(renderHtml(changed).ok, false);
  }
  const historical = await snapshot();
  delete historical.review;
  assert.equal(renderHtml(historical).ok, false);
  historical.schema_version = '1.9';
  assert.equal(renderHtml(historical).ok, false); // no source proof/summary-header migration
});

test('matching genuine factual qualifications remain visible without exposing reviewer machinery', async () => {
  const doc = sourceBoundCandidate();
  doc.review = await fakeChecker({ finding: 'conflict', gap: 'The source records disagree about delivery.' }).check(doc);
  doc.copy_review = { ...fakeCopyReview(doc), verdict: 'revise' };
  const before = structuredClone(doc);
  const prepared = prepareRenderSnapshot(doc);
  assert.equal(prepared.review_diagnostics.fact.ok, true);
  assert.equal(prepared.review_diagnostics.copy.ok, true);
  assert.equal(prepared.snapshot.copy_review.verdict, 'revise');
  const result = renderHtml(doc);
  assert.match(result.html, /Sources conflict/);
  assert.match(result.html, /The source records disagree about delivery/);
  assert.doesNotMatch(result.html, /class="event terminal"/);
  const context = feedbackContext(doc), runtime = feedbackRuntime();
  const prompt = runtime.compose(context, runtime.add(context, [], 'comment', 'issue', 'draft-1', 'Check delivery.'));
  assert.match(prompt, /source records disagree about delivery/);
  publicClean(result.html, prompt);
  assert.deepEqual(doc, before);
});

test('finalize preserves invalid originals and progress-ready verifies exact normal HTML without a fake pass', async () => {
  const root = await temp(), doc = sourceBoundCandidate();
  const progress = await beginProgress(root, { workspace_id: doc.run.workspace_id, profile_id: 'profile-1', scenario_id: doc.scenario.id,
    run_id: doc.run.id, session_ids: doc.sessions.map(s => s.id), agent_version_ids: doc.run.agent_version_ids,
    application_version: doc.run.application_version, parent_conversation_ref: doc.presentation.parent_conversation_ref });
  const dir = progress.directory, input = join(dir, 'candidate.json'), copy = join(dir, 'copy.json'), final = join(dir, 'final.json'), html = join(dir, 'final.html');
  await save(input, doc); await save(copy, badCopy(doc));
  const original = await readFile(copy);
  const finalized = await inspect('finalize', input, final, copy, '-');
  assert.equal(finalized.ok, true, JSON.stringify(finalized));
  assert.equal(finalized.review_diagnostics.copy.ok, false);
  assert.deepEqual(await readFile(copy), original);
  assert.equal((await stat(final)).mode & 0o777, 0o600);
  assert.equal((await renderFile(final, html)).ok, true);
  const ready = await changeProgress(progress.manifest_path, progress.writer_path, 1, 'ready', { snapshot: 'final.json', html: 'final.html' });
  assert.equal(ready.state, 'ready');
  assert.deepEqual(await readFile(ready.artifact_path), await readFile(html));
  assert.equal((await inspect('finalize', input, final, copy, '-')).ok, false);
  const other = join(dir, 'non-json.txt'); await writeFile(other, 'actual invalid response', { flag: 'wx' });
  const absent = await inspect('finalize', input, join(dir, 'no-review.json'), other, '-');
  assert.equal(absent.ok, true);
  assert.equal(absent.review_diagnostics.copy_review.ok, false);
});

test('pending native receipts still block dependent stages, while completed reviewer failure does not', async () => {
  let facts = 0, renders = 0;
  const result = await reviewLoop({ edit: async () => sourceBoundCandidate(), copyCheck: async () => ({ status: 'running' }),
    check: async () => { facts++; }, render: async doc => { renders++; return renderHtml(doc); } });
  assert.equal(result.ok, false); assert.equal(result.pending, true);
  assert.equal(facts + renders, 0);
});

test('render retries cannot reopen frozen copy editing or spend a third copy', async () => {
  let copies = 0, renders = 0;
  const result = await reviewLoop({
    edit: async ({ previous }) => {
      if (!previous) return sourceBoundCandidate();
      previous.summary += ' Unauthorized extra polishing.';
      return previous;
    },
    copyCheck: async doc => { copies++; return badCopy(doc); },
    check: async () => undefined,
    render: async () => { renders++; return { ok: false, errors: [{ code: 'display-repair' }] }; },
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'content_frozen');
  assert.equal(copies, 2); assert.equal(renders, 1);
});
