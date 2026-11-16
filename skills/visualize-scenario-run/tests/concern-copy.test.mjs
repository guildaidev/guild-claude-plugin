import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { concernFixture, humanConcern, humanFix, technicalFix } from './concern-fixture.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { validate, validateCandidate, validateCopyReview, factualDigest, copyFields, prepareRenderSnapshot } from '../scripts/contracts.mjs';
import { reviewPacket } from '../scripts/review-io.mjs';
import { fakeCopyReview } from './fixtures.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { feedbackRuntime } from '../scripts/feedback.mjs';
import { validatedFeedbackContext as feedbackContext } from '../scripts/feedback-context.mjs';
import { inspect } from '../scripts/inspect.mjs';

const panel = html => html.match(/<details class="review-flag">[\s\S]*?<\/details>/)?.[0];

test('new authored concern, plain fix and technical prompt are separate source-bound fields', () => {
  const { input, draft, doc } = concernFixture(), original = structuredClone({ input, draft, doc });
  assert.equal(doc.schema_version, '1.10');
  assert.equal(validateCandidate(doc).ok, true);
  assert.equal(validate(doc).ok, true);
  assert.deepEqual(doc.source_bundle, input);
  const html = renderHtml(doc).html, body = panel(html);
  assert.ok(body.includes(humanConcern));
  assert.ok(body.includes(humanFix));
  assert.ok(!body.includes(technicalFix));
  assert.match(body, />Add suggested fix to prompt<\/button>/);
  assert.doesNotMatch(body, /Outcome:|Recorded problem|Recorded effect|Source detail|Workflow impact/);
  assert.equal((body.match(/<h3>/g) ?? []).length, 2);
  const fields = copyFields(doc).map(field => field.path ?? field.field_path);
  for (const path of ['$.timeline[1].concern.explanation', '$.timeline[1].suggested_feedback.explanation', '$.timeline[1].suggested_feedback.text']) assert.ok(fields.includes(path), path);
  const runtime = feedbackRuntime(), context = feedbackContext(doc);
  const items = runtime.add(context, [], 'fix', 'issue', 'draft-1', technicalFix);
  assert.equal(items[0].feedback, technicalFix);
  const prompt = runtime.compose(context, items);
  assert.ok(prompt.includes(technicalFix));
  assert.ok(!prompt.includes(humanFix));
  assert.deepEqual({ input, draft, doc }, original);
});

test('all three authored strings bind the digest and closed evidence references', () => {
  const { input, draft, doc } = concernFixture(), digest = factualDigest(doc);
  for (const mutate of [
    value => { value.timeline[1].concern.explanation += ' Clarify the result.'; },
    value => { value.timeline[1].suggested_feedback.explanation += ' Ask for the hours.'; },
    value => { value.timeline[1].suggested_feedback.text += ' Preserve current tests.'; },
  ]) { const changed = structuredClone(doc); mutate(changed); assert.notEqual(factualDigest(changed), digest); }
  for (const mutate of [
    value => { value.events[1].concern.evidence_refs = ['missing']; },
    value => { value.events[1].concern.claim_refs = ['missing']; },
    value => { delete value.events[1].concern; },
    value => { delete value.events[1].suggested_feedback.explanation; },
    value => { value.events[1].concern.extra = 'not allowed'; },
    value => { value.events[1].suggested_feedback.action_id = 'correct'; },
  ]) { const changed = structuredClone(draft); mutate(changed); assert.equal(assembleCandidate(input, changed).ok, false); }
  const changedSource = structuredClone(doc); changedSource.timeline[1].world_effect.change = 'Invented change.';
  assert.equal(validate(changedSource).ok, false);
});

test('review packets distinguish plain human fixes from technical prompts and enforce the requested human instruction route', async () => {
  const { doc } = concernFixture();
  for (const kind of ['copy', 'fact']) {
    const packet = await reviewPacket(kind, doc, 'candidate.json');
    assert.match(packet.concern_content_policy.concern, /stated application goal/);
    assert.match(packet.concern_content_policy.human_fix, /ASD-STE100/);
    assert.match(packet.concern_content_policy.human_fix, /20 words per instruction and 25 per description/);
    assert.match(packet.concern_content_policy.technical_fix, /Only this technical text enters the feedback cart/);
  }
  const review = fakeCopyReview(doc);
  assert.equal(validateCopyReview(doc, review).ok, true);
  const human = review.passages.find(p => p.field_path === '$.timeline[1].suggested_feedback.explanation');
  assert.equal(human.guide, 'asd-ste100');
  human.guide = 'economist';
  assert.equal(validateCopyReview(doc, review).ok, false);
  assert.equal(renderHtml({ ...doc, copy_review: review }).ok, true, 'Optional invalid diagnostics are not permission to render.');
});

test('current explanations do not require a failed status or optional reviewer approval', () => {
  const { input, draft } = concernFixture();
  input.occurrences[1].outcome = 'unconfirmed';
  const result = assembleCandidate(input, draft);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  result.snapshot.copy_review = { verdict: 'revise', findings: [{ field_path: '$.not-a-field' }] };
  result.snapshot.review = { incomplete: true };
  const prepared = prepareRenderSnapshot(result.snapshot);
  assert.equal(prepared.ok, true);
  assert.equal(renderHtml(result.snapshot).ok, true);
  assert.ok(panel(renderHtml(result.snapshot).html).includes(humanConcern));
});

test('old draft and snapshot shapes remain read-only and cannot pretend to contain the new explanations', () => {
  const { input, draft } = concernFixture(), old = structuredClone(draft);
  old.schema_version = '1.3';
  assert.equal(assembleCandidate(input, old).ok, false);
  delete old.events[1].concern;
  delete old.events[1].suggested_feedback.explanation;
  const result = assembleCandidate(input, old);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.snapshot.schema_version, '1.9');
  const legacyBody = panel(renderHtml(result.snapshot).html);
  assert.ok(!legacyBody.includes(technicalFix));
  assert.match(legacyBody, /disabled[^>]*>Add suggested fix to prompt/);
});

test('missing supported fix does not invent prose, a technical prompt or an enabled action', () => {
  const { input, draft } = concernFixture();
  delete draft.events[1].suggested_feedback;
  const result = assembleCandidate(input, draft);
  assert.equal(result.ok, true);
  const body = panel(renderHtml(result.snapshot).html);
  assert.ok(body.includes(humanConcern));
  assert.match(body, /does not support a specific application change/);
  assert.match(body, /disabled[^>]*>Add suggested fix to prompt/);
  assert.equal(feedbackContext(result.snapshot).events[1].suggested_feedback, undefined);
});

test('finalize accepts the new ordinary snapshot without manufacturing review records', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'concern-finalize-'));
  try {
    const { doc } = concernFixture(), path = join(directory, 'candidate.json'), output = join(directory, 'final.json');
    await writeFile(path, JSON.stringify(doc), { flag: 'wx', mode: 0o600 });
    const result = await inspect('finalize', path, output, '-', '-');
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    const saved = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(saved.schema_version, '1.10');
    assert.equal(saved.review, undefined);
    assert.equal(saved.copy_review, undefined);
    assert.ok(renderHtml(saved).ok);
    assert.equal((await inspect('finalize', path, output, '-', '-')).ok, false);
  } finally { await rm(directory, { recursive: true }); }
});
