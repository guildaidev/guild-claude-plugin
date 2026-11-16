import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, factualDigest, prepareRenderSnapshot, snapshotContract, factualReviewContract } from '../scripts/contracts.mjs';
import { bundle, snapshot } from './fixtures.mjs';

test('versioned bundle and checked snapshot accept representative context', async () => {
  assert.deepEqual(validate(bundle(), 'bundle'), { ok: true, errors: [] });
  assert.deepEqual(validate(await snapshot()), { ok: true, errors: [] });
});
test('reject malformed, stale, dangling, removed fields, non-independent and write reviews', async () => {
  const mutations = [
    d => { d.schema_version = '0.1'; },
    d => { d.timeline[0].actor_id = 'absent'; },
    d => { d.summary = 'Unreviewed new factual assertion.'; },
    d => { d.review.checker_id = d.editor_id; },
    d => { d.review.checks[0].operation = 'write'; },
    d => { d.review.data_origin = 'observed'; },
    d => { d.coverage.data_origin = 'synthetic'; },
    d => { d.review.checks[0].data_origin = 'synthetic'; },
    d => { d.coverage.gaps.push({ id: 'gap-1', description: 'Gap.', affected_refs: [], impact: 'Removed UI prose.' }); },
    d => { d.review.findings.pop(); },
    d => { d.artifact_claims = []; },
    d => { d.artifacts[0].source_url = 'https://example.test/?token=secret'; },
    d => { d.evidence[0].captured_at = '2026-02-30T12:00:00Z'; },
    d => { d.evidence[0].content = Infinity; },
    d => { d.sessions[0].parent_session_id = d.sessions[0].id; },
    d => { d.timeline[1].actor_id = 'mail'; },
  ];
  for (const mutate of mutations) {
    const doc = await snapshot(); mutate(doc);
    const result = validate(doc);
    assert.equal(result.ok, false);
    assert.ok(result.errors.every(e => e.path && e.code && e.repair));
  }
});

test('HTML input contract excludes origin and gap-impact fields; old checked inputs retain their original review', async () => {
  assert.equal(snapshotContract.fields.schema_version.values[0], '1.10');
  assert.equal(snapshotContract.fields.coverage.fields.data_origin, undefined);
  assert.equal(snapshotContract.fields.coverage.fields.gaps.items.fields.impact, undefined);
  assert.equal(factualReviewContract.fields.data_origin, undefined);
  assert.equal(factualReviewContract.fields.checks.items.fields.data_origin, undefined);
  const legacy = await snapshot();
  delete legacy.copy_review;
  delete legacy.copy_review_iterations;
  legacy.schema_version = '1.0';
  delete legacy.header_copy;
  legacy.coverage = { data_origin: 'synthetic', gaps: [{ id: 'gap-1', description: 'Stored history only.', affected_refs: [], impact: 'Old standalone note.' }] };
  legacy.review.data_origin = 'synthetic';
  legacy.review.checks.forEach(check => { check.data_origin = 'synthetic'; });
  legacy.review.factual_digest = factualDigest(legacy); // Construct a synthetic OLD fixture, not migrate a real review.
  const before = structuredClone(legacy);
  assert.equal(validate(legacy).ok, false);
  const prepared = prepareRenderSnapshot(legacy);
  assert.equal(prepared.ok, true);
  assert.deepEqual(legacy, before);
  assert.equal(prepared.snapshot.review.factual_digest, legacy.review.factual_digest);
  assert.equal(prepared.snapshot.coverage.data_origin, undefined);
  assert.equal(prepared.snapshot.coverage.gaps[0].impact, undefined);
  assert.equal(prepared.snapshot.review.data_origin, undefined);
  assert.ok(prepared.snapshot.review.checks.every(check => !Object.hasOwn(check, 'data_origin')));
  // A display projection is not a freshly checked document; do not restamp it.
  assert.equal(validate(prepared.snapshot).ok, false);
  legacy.summary = 'Unreviewed changed assertion.';
  assert.equal(prepareRenderSnapshot(legacy).ok, false);
  legacy.summary = before.summary;
  legacy.review.data_origin = 'observed';
  assert.equal(prepareRenderSnapshot(legacy).ok, false);
});
test('only nonfactual display changes preserve review; unknown level needs a gap', async () => {
  const doc = await snapshot(); const hash = factualDigest(doc);
  doc.display.compact = true;
  assert.equal(factualDigest(doc), hash);
  assert.equal(validate(doc).ok, true);
  const input = bundle(); input.sessions[0].level = 'unknown';
  assert.equal(validate(input, 'bundle').ok, false);
  input.coverage.gaps.push({ id: 'gap-1', description: 'Session level unavailable.', affected_refs: ['session-1'], impact: 'Cannot put lifecycle on the timeline.' });
  assert.equal(validate(input, 'bundle').ok, true);
});
test('credential diagnostics never echo secrets', async () => {
  const doc = await snapshot();
  const secret = 'sk-ant-FAKE-CREDENTIAL-1234567890';
  doc.evidence[0].content = { api_key: secret };
  const result = validate(doc);
  assert.equal(result.ok, false);
  assert.ok(!JSON.stringify(result).includes(secret));
  doc.evidence[0].content = { [secret]: `Bearer ${secret}` };
  assert.ok(!JSON.stringify(validate(doc)).includes(secret));
});
