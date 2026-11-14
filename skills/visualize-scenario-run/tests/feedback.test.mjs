import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackRuntime, feedbackContext } from '../scripts/feedback.mjs';
import { validate, validateCandidate, copyFields, factualDigest, prepareRenderSnapshot } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { snapshot, fakeChecker, fakeCopyReview, candidate } from './fixtures.mjs';

const runtime = feedbackRuntime();
const review = async doc => { doc.copy_review = fakeCopyReview(doc); doc.review = await fakeChecker().check(doc); if (['1.6', '1.7'].includes(doc.schema_version)) doc.copy_review_iterations = 1; return doc; };

test('cart starts empty; explicit items retain stable identities, deduplicate and preserve insertion order', async () => {
  const doc = await snapshot();
  const context = feedbackContext(doc);
  const before = structuredClone(doc);
  let items = [];
  assert.equal(runtime.compose(context, items), '');
  items = runtime.add(context, items, 'comment', 'issue', 'draft-1', '  Keep the draft unsent.\r\nPlease clarify.  ');
  assert.equal(items[0].feedback, 'Keep the draft unsent.\nPlease clarify.');
  items = runtime.add(context, items, 'correct', 'correct', undefined, 'Preserve this result.');
  const id = items[0].item_id;
  items = runtime.add(context, items, 'comment', 'issue', 'draft-1', 'Edited feedback.');
  assert.equal(items.length, 2);
  assert.equal(items[0].item_id, id);
  assert.equal(items[0].feedback, 'Edited feedback.');
  assert.equal(items[1].kind, 'correct');
  for (const value of items) {
    for (const name of ['snapshot_id', 'run_id', 'scenario_id', 'parent_conversation_ref', 'candidate_digest']) assert.equal(value[name], context[name]);
    assert.equal(value.scope, 'unspecified'); assert.equal(value.execution, 'not_performed');
  }
  assert.equal(items[0].event_id, 'draft-1');
  assert.equal(items[0].action_id, 'issue');
  assert.equal(items[1].event_id, undefined);
  assert.equal(runtime.compose(context, items), runtime.compose(context, structuredClone(items)));
  assert.deepEqual(runtime.remove(items, id), [items[1]]);
  assert.deepEqual(doc, before);
});

test('prompt includes only current included text, context, IDs, uncertainty and explicit non-execution', async () => {
  const context = feedbackContext(await snapshot());
  let items = runtime.add(context, [], 'comment', 'issue', 'draft-1', 'Do not send without asking.');
  items = runtime.add(context, items, 'correct', 'correct', undefined, 'Preserve draft-only behavior.');
  items = runtime.remove(items, items[1].item_id);
  const prompt = runtime.compose(context, items);
  assert.doesNotMatch(prompt, /Snapshot schema|Review scope|Reviewed candidate|Source review/);
  for (const limitation of context.limitations) assert.ok(prompt.includes(limitation));
  for (const value of [context.run_id, context.scenario_id, context.events[1].description, 'Do not send without asking.', 'Event: draft-1', 'Clarify ambiguous scope']) assert.ok(prompt.includes(value), value);
  for (const privateValue of [context.snapshot_id, context.parent_conversation_ref, context.candidate_digest]) assert.ok(!prompt.includes(privateValue));
  assert.doesNotMatch(prompt, /Preserve draft-only behavior\.|Berlin|chat:write|missing_scope|goldenRuns/);
  assert.equal(runtime.compose(context, runtime.remove(items, items[0].item_id)), '');
});

test('closed cart rejects blanks, unknown targets, wrong actions, forged/stale identities and duplicates', async () => {
  const context = feedbackContext(await snapshot());
  for (const [kind, action, event, text] of [
    ['comment', 'issue', 'draft-1', '  '], ['comment', 'issue', 'missing', 'x'],
    ['correct', 'issue', undefined, 'x'], ['correct', 'correct', 'draft-1', 'x'],
    ['comment', 'rerun', 'draft-1', 'x'], ['fix', 'issue', 'draft-1', 'x'],
    ['comment', 'issue', 'draft-1', 'x'.repeat(10001)], ['unknown', 'issue', 'draft-1', 'x'], ['constructor', 'issue', 'draft-1', 'x'],
  ]) assert.throws(() => runtime.add(context, [], kind, action, event, text));
  const items = runtime.add(context, [], 'comment', 'issue', 'draft-1', 'x');
  for (const change of [{ execution: 'performed' }, { candidate_digest: '0'.repeat(64) }, { scope: 'all' }, { action_id: 'correct' }, { event_id: 'end-1' }, { extra: true }, { feedback: ' x ' }]) {
    assert.throws(() => runtime.validate(context, { schema_version: '1.0', items: [{ ...items[0], ...change }] }));
  }
  assert.throws(() => runtime.validate(context, { schema_version: '1.0', items: [...items, ...items] }));
  assert.throws(() => runtime.validate(context, { schema_version: '1.0', items, extra: true }));
  assert.throws(() => runtime.validate({ ...context, run_id: 'different-run' }, { schema_version: '1.0', items }));
  const many = { ...context, events: Array.from({ length: 101 }, (_, i) => ({ ...context.events[0], id: `step-${i}` })) };
  let full = [];
  for (let i = 0; i < 100; i++) full = runtime.add(many, full, 'comment', 'issue', `step-${i}`, 'x');
  assert.throws(() => runtime.add(many, full, 'comment', 'issue', 'step-100', 'x'));
  assert.equal(runtime.add(many, full, 'comment', 'issue', 'step-0', 'Edited at limit.').length, 100);
});

test('suggested feedback is optional authored source/claim-bound copy included in both review digests', async () => {
  const doc = candidate();
  doc.timeline[1].outcome = 'failed';
  doc.timeline[1].suggested_feedback = { action_id: 'issue', text: 'Check the draft failure before trying again.', evidence_refs: ['e-draft'], claim_refs: ['claim-draft-1'] };
  assert.equal(validateCandidate(doc).ok, true);
  assert.ok(copyFields(doc).some(field => field.path === '$.timeline[1].suggested_feedback.text' || field.field_path === '$.timeline[1].suggested_feedback.text'));
  await review(doc);
  assert.equal(validate(doc).ok, true);
  assert.match(renderHtml(doc).html, /data-add-fix="true" data-action="issue" data-event="draft-1"/);
  const context = feedbackContext(doc);
  const items = runtime.add(context, [], 'fix', 'issue', 'draft-1', doc.timeline[1].suggested_feedback.text);
  assert.equal(items[0].kind, 'fix');
  const oldDigest = factualDigest(doc);
  doc.timeline[1].suggested_feedback.text += ' Clarify the scope.';
  assert.notEqual(factualDigest(doc), oldDigest);
  assert.equal(validate(doc).ok, false);
  for (const change of [{ action_id: 'correct' }, { evidence_refs: ['missing'] }, { claim_refs: ['missing'] }, { text: 'x'.repeat(10001) }, { extra: 'no' }]) {
    const altered = structuredClone(doc); Object.assign(altered.timeline[1].suggested_feedback, change);
    assert.equal(validateCandidate(altered).ok, false);
  }
  const success = structuredClone(doc); success.timeline[1].outcome = 'confirmed';
  assert.equal(validateCandidate(success).ok, false);
});

test('historical 1.4 remains original-digest read-only compatible, without invented suggested fixes', async () => {
  const old = candidate(); old.schema_version = '1.4'; delete old.header_copy; await review(old);
  const before = structuredClone(old);
  assert.equal(validate(old).ok, false);
  assert.equal(prepareRenderSnapshot(old).review_mode, 'legacy-dual-review');
  assert.equal(renderHtml(old).ok, true);
  assert.doesNotMatch(renderHtml(old).html, /data-add-fix data-action=/);
  assert.deepEqual(old, before);
  old.timeline[1].suggested_feedback = { action_id: 'issue', text: 'Invented.', evidence_refs: ['e-draft'], claim_refs: ['claim-draft-1'] };
  assert.equal(prepareRenderSnapshot(old).ok, false);
});
