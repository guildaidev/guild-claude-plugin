import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleCandidate, draftContract } from '../scripts/assemble.mjs';
import { validate, validateCandidate, factualDigest, copyFields, prepareRenderSnapshot } from '../scripts/contracts.mjs';
import { bundle, fakeChecker, fakeCopyReview } from './fixtures.mjs';

// Explicit editorial input, not candidate(), an event-selection algorithm, a
// fabricated review, or an independent source-verification fixture.
function draft() {
  return {
    schema_version: '1.1', snapshot_id: 'assembled-1', editor_id: 'author-1', parent_agent_id: 'parent-1',
    header_copy: { application_name: 'Reply Desk', workflow_purpose: 'Prepare replies for review.', scenario_name: 'Draft saved for review', starting_context: 'A customer asks about opening hours.', observed_result: 'The assistant saved a draft for review.', claim_refs: ['context', 'draft'] },
    summary: 'A reply draft was saved for review; delivery was not observed.',
    claims: [
      { id: 'context', text: 'The supplied session record describes the run.', evidence_refs: ['e-session'] },
      { id: 'draft', text: 'A reply draft exists in Sandbox Mail.', evidence_refs: ['e-draft'] },
    ],
    events: [
      { occurrence_id: 'start-1', description: 'The top-level session started.', claim_refs: ['context'], supporting_detail: 'The supplied session record identifies the session.' },
      { occurrence_id: 'draft-1', description: 'The assistant saved a reply draft.', claim_refs: ['draft'], supporting_detail: 'The supplied record is a draft, not evidence of delivery.' },
      { occurrence_id: 'end-1', description: 'The top-level session ended.', claim_refs: ['context'], supporting_detail: 'The session record reports completion.' },
    ],
    artifact_claims: [{ artifact_id: 'a-draft', claim_refs: ['draft'] }],
    omitted_occurrences: [],
  };
}

function assembled(input = bundle(), authored = draft()) {
  const result = assembleCandidate(input, authored);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(validateCandidate(result.snapshot, { legacy: authored.schema_version === '1.0' }).ok, true);
  return result.snapshot;
}
function rejected(input, authored, code) {
  const result = assembleCandidate(input, authored);
  assert.equal(result.ok, false);
  assert.equal(result.snapshot, undefined);
  assert.ok(result.errors.length);
  assert.ok(result.errors.every(error => error.path && error.code && error.message && error.repair));
  if (code) assert.ok(result.errors.some(error => error.code === code), JSON.stringify(result.errors));
  return result;
}
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('closed draft 1.1 assembles a review-free 1.7 candidate with exact source context and explicit header', () => {
  const input = bundle();
  input.coverage.gaps.push({ id: 'history-gap', description: 'Earlier history is unavailable.', affected_refs: ['e-draft'], impact: 'No earlier-state assertion is supported.' });
  const authored = draft();
  const snapshot = assembled(input, authored);
  assert.equal(draftContract.fields.schema_version.values[0], '1.2');
  assert.equal(snapshot.schema_version, '1.7');
  assert.deepEqual(snapshot.header_copy, authored.header_copy);
  assert.equal(snapshot.review, undefined);
  assert.equal(snapshot.copy_review, undefined);
  assert.equal(snapshot.occurrences, undefined);
  assert.equal(snapshot.events, undefined);
  assert.equal(snapshot.context_copy, undefined);
  assert.equal(snapshot.artifact_titles, undefined);
  for (const key of ['bundle_id', 'workflow', 'scenario', 'run', 'actors', 'sessions', 'evidence', 'artifacts', 'presentation']) assert.deepEqual(snapshot[key], input[key]);
  assert.deepEqual(snapshot.coverage, { gaps: [{ id: 'history-gap', description: 'Earlier history is unavailable.', affected_refs: ['e-draft'] }] });
  assert.deepEqual(snapshot.display, { compact: false });
  assert.deepEqual(snapshot.claims, authored.claims);
  assert.deepEqual(snapshot.artifact_claims, authored.artifact_claims);
  assert.equal(validate(snapshot).ok, false, 'assembly cannot replace either real review');
});

test('only selected event attachments enter HTML input; source pages remain in the unchanged collection bundle', () => {
  const input = bundle(), authored = draft();
  input.artifacts.push({ ...structuredClone(input.artifacts[0]), id: 'a-source-page', kind: 'document', title: 'Supporting source page' });
  const original = structuredClone(input);
  const result = assembled(input, authored);
  assert.deepEqual(result.artifacts.map(artifact => artifact.id), ['a-draft']);
  assert.deepEqual(result.evidence, original.evidence);
  assert.deepEqual(input, original);
  authored.artifact_titles = [{ artifact_id: 'a-source-page', title: 'Do not promote this source to a card' }];
  rejected(input, authored, 'missing_reference');
  delete authored.artifact_titles;
  authored.artifact_claims.push({ artifact_id: 'a-source-page', claim_refs: ['context'] });
  rejected(input, authored, 'missing_reference');
});

test('assembly forwards optional authored fix without altering source data or creating reviews', () => {
  const input = bundle(), authored = draft();
  input.occurrences[1].outcome = 'failed';
  authored.events[1].suggested_feedback = { action_id: 'issue', text: 'Investigate the recorded failure before another attempt.', evidence_refs: ['e-draft'], claim_refs: ['draft'] };
  const before = JSON.stringify({ input, authored });
  const result = assembled(freeze(input), freeze(authored));
  assert.deepEqual(result.timeline[1].suggested_feedback, authored.events[1].suggested_feedback);
  assert.equal(result.review, undefined);
  assert.equal(result.copy_review, undefined);
  result.timeline[1].suggested_feedback.evidence_refs.push('changed-output');
  assert.equal(JSON.stringify({ input, authored }), before);
});

test('synthetic uncertain-action bundle preserves all event metadata and artifact bytes', () => {
  const input = bundle();
  const event = input.occurrences[1];
  event.time = { earliest: '2026-01-01T11:58:00Z', latest: '2026-01-01T11:59:59.999Z' };
  event.outcome = 'unconfirmed';
  event.world_effect = { system: 'Sandbox Mail', target: 'draft-1', change: 'Requested a draft update; historical attribution is unavailable.' };
  event.relationships = [{ other_occurrence_id: 'start-1', relation: 'follows', basis: 'inferred', evidence_refs: ['e-session'] }];
  event.workflow_relevance = { explanation: 'The draft is intended for reply review.', basis: 'user_supplied', evidence_refs: ['e-draft'] };
  input.run.status = 'unknown';
  input.run.observed_resulting_state = 'Current draft exists; the request outcome is unconfirmed.';
  input.evidence[1].content = { draft_id: 'draft-1', body: 'First line\r\nSecond line\n', revision: 7, historical_attribution: null };
  Object.assign(input.artifacts[0], {
    content: 'First line\r\nSecond line\n', before: 'Prior text\n', after: 'First line\r\nSecond line\n',
    structured_content: { fields: { revision: 7, flags: [false, null, 'literal'] } }, change: 'unknown',
  });
  assert.equal(validate(input, 'bundle').ok, true);
  const authored = draft();
  authored.summary = 'The request outcome remains unconfirmed.';
  authored.claims[1].text = 'A current draft is recorded; this does not establish who created it.';
  authored.events[1].description = 'The assistant requested an update; historical attribution is unknown.';
  authored.events[1].supporting_detail = 'The supplied timing is bounded and the order relationship is inferred.';
  const snapshot = assembled(input, authored);
  for (const original of input.occurrences) {
    const actual = snapshot.timeline.find(item => item.id === original.id);
    const { description, claim_refs, supporting_detail, ...metadata } = actual;
    const { description: sourceDescription, ...expected } = original;
    assert.deepEqual(metadata, expected);
  }
  assert.equal(snapshot.timeline[1].outcome, 'unconfirmed');
  assert.equal(snapshot.timeline[1].relationships[0].basis, 'inferred');
  assert.equal(JSON.stringify(snapshot.evidence), JSON.stringify(input.evidence));
  assert.equal(JSON.stringify(snapshot.artifacts), JSON.stringify(input.artifacts));
  assert.equal(snapshot.artifacts[0].before, 'Prior text\n');
  assert.equal(snapshot.artifacts[0].after, 'First line\r\nSecond line\n');
});

test('selection, ordering, narrative and omissions come only from the author', () => {
  const input = bundle();
  const authored = draft();
  authored.events = [authored.events[2], authored.events[0]];
  authored.omitted_occurrences = [{ id: 'draft-1', reason: 'This editorial view focuses on the session boundary; the source remains in the collection bundle.' }];
  authored.artifact_claims = [];
  authored.summary = 'An intentionally different editorial focus.';
  const snapshot = assembled(input, authored);
  assert.deepEqual(snapshot.timeline.map(item => item.id), ['end-1', 'start-1']);
  assert.equal(snapshot.summary, authored.summary);
  assert.deepEqual(snapshot.omitted_occurrences, authored.omitted_occurrences);
  assert.deepEqual(snapshot.artifacts, [], 'render input has no unattached artifact cards');
  assert.equal(input.artifacts.length, 1, 'collection source is not removed');
  // Even an unsupported semantic assertion is not silently corrected or
  // "confirmed" by assembly. The real fact/copy reviewers must assess it.
  authored.events[0].description = 'An author-supplied assertion requiring review.';
  assert.equal(assembled(input, authored).timeline[0].description, authored.events[0].description);
});

test('assembly neither mutates inputs nor retains aliases to source or draft', () => {
  const input = freeze(bundle());
  const authored = freeze(draft());
  const before = JSON.stringify({ input, authored });
  const snapshot = assembled(input, authored);
  assert.equal(JSON.stringify({ input, authored }), before);
  snapshot.evidence[0].content.status = 'changed output';
  snapshot.artifacts[0].content = 'changed output';
  snapshot.timeline[0].evidence_refs.push('changed-output');
  snapshot.claims[0].text = 'changed output';
  snapshot.artifact_claims[0].claim_refs.push('changed-output');
  assert.equal(JSON.stringify({ input, authored }), before);
  assert.deepEqual(assembled(input, authored), assembled(input, authored));
});

test('named prose and artifact title overrides cannot overwrite source payloads', () => {
  const input = bundle();
  const authored = draft();
  // Explicit synthetic historical draft: preserve its original named overrides.
  authored.schema_version = '1.0'; delete authored.header_copy;
  authored.context_copy = {
    workflow: { title: 'A clearer workflow title', intended_world_effect: 'Prepare a reply for review.' },
    scenario: { title: 'A clearer scenario title', trigger: 'A question arrives.', initial_conditions: 'No draft is reported.', expected_outcome: 'A draft is available.' },
    run: { execution_label: 'Synthetic editorial example', observed_resulting_state: 'The supplied record describes a draft.' },
  };
  authored.artifact_titles = [{ artifact_id: 'a-draft', title: 'Draft awaiting review' }];
  authored.display = { compact: true };
  const snapshot = assembled(input, authored);
  for (const [section, fields] of Object.entries(authored.context_copy)) for (const [key, value] of Object.entries(fields)) assert.equal(snapshot[section][key], value);
  assert.equal(snapshot.run.id, input.run.id);
  assert.equal(snapshot.run.status, input.run.status);
  assert.deepEqual(snapshot.run.source_refs, input.run.source_refs);
  const { title, ...artifact } = snapshot.artifacts[0];
  const { title: originalTitle, ...sourceArtifact } = input.artifacts[0];
  assert.equal(title, 'Draft awaiting review');
  assert.deepEqual(artifact, sourceArtifact);
  assert.deepEqual(snapshot.display, { compact: true });
});

test('missing, duplicated or fabricated selected IDs and omissions are rejected', () => {
  const mutations = [
    [d => { delete d.events[0].occurrence_id; }, 'schema'],
    [d => { d.events.push(structuredClone(d.events[0])); }, 'duplicate_id'],
    [d => { d.events[0].occurrence_id = 'invented'; }, 'missing_reference'],
    [d => { d.events.pop(); }, 'missing_omission'],
    [d => { d.omitted_occurrences.push({ id: 'start-1', reason: 'Conflicting choice.' }); }, 'selection_conflict'],
    [d => { d.omitted_occurrences.push({ id: 'invented', reason: 'Fabricated omission.' }); }, 'missing_reference'],
    [d => { d.events.pop(); d.omitted_occurrences = [{ id: 'end-1', reason: 'One.' }, { id: 'end-1', reason: 'Two.' }]; }, 'duplicate_id'],
    [d => { d.events.pop(); d.omitted_occurrences = [{ id: 'end-1', reason: ' ' }]; }, 'schema'],
  ];
  for (const [mutate, code] of mutations) { const authored = draft(); mutate(authored); rejected(bundle(), authored, code); }
});

test('source relationships to omitted occurrences require an explicit safe editorial choice', () => {
  const input = bundle();
  input.occurrences[1].relationships.push({ other_occurrence_id: 'start-1', relation: 'caused_by', basis: 'observed', evidence_refs: ['e-session'] });
  const authored = draft();
  authored.events.shift();
  authored.omitted_occurrences = [{ id: 'start-1', reason: 'Session boundary omitted.' }];
  const before = structuredClone(input);
  rejected(input, authored, 'omitted_relationship');
  assert.deepEqual(input, before);
  authored.events.unshift(draft().events[0]);
  authored.omitted_occurrences = [];
  assert.deepEqual(assembled(input, authored).timeline[1].relationships, input.occurrences[1].relationships);
});

test('candidate validation rejects unsupported activity, child/unknown lifecycle and irrelevant external action', () => {
  for (const level of ['child', 'unknown']) {
    const input = bundle();
    input.sessions.push({ ...structuredClone(input.sessions[0]), id: 'nested', level,
      ...(level === 'child' ? { parent_session_id: 'session-1' } : {}) });
    input.coverage.gaps.push({ id: 'level-gap', description: 'Lifecycle scope is restricted.', affected_refs: ['nested'], impact: 'Do not promote this lifecycle.' });
    input.occurrences[0].session_id = 'nested';
    rejected(input, draft(), 'timeline_selection');
  }
  const supporting = bundle();
  supporting.occurrences[0].kind = 'supporting_activity';
  rejected(supporting, draft(), 'schema');
  const external = bundle();
  Object.assign(external.occurrences[1], { kind: 'external_world_action', actor_id: 'mail' });
  rejected(external, draft(), 'relevance');
});

test('closed draft forbids metadata/source edits and validates all authored references', () => {
  const mutations = [
    d => { d.schema_version = '1.3'; },
    d => { d.timeline = []; },
    d => { d.events[0].outcome = 'failed'; },
    d => { d.events[0].time = { at: '2026-01-01T12:00:00Z' }; },
    d => { d.events[0].evidence_refs = ['e-draft']; },
    d => { d.events[0].world_effect = { change: 'Invented effect.' }; },
    d => { d.artifacts = []; },
    d => { d.artifact_titles = [{ artifact_id: 'a-draft', title: 'Title', after: 'Overwritten content' }]; },
    d => { d.context_copy = { run: { status: 'completed' } }; },
    d => { d.context_copy = { workflow: { id: 'another' } }; },
    d => { d.context_copy = { run: { source_refs: ['e-draft'] } }; },
    d => { d.claims[0].evidence_refs = ['absent']; },
    d => { d.claims.push(structuredClone(d.claims[0])); },
    d => { d.events[0].claim_refs = ['absent']; },
    d => { d.artifact_claims[0].artifact_id = 'absent'; },
    d => { d.artifact_claims[0].claim_refs = ['absent']; },
    d => { d.artifact_claims = []; },
    d => { d.artifact_claims.push(structuredClone(d.artifact_claims[0])); },
    d => { d.artifact_titles = [{ artifact_id: 'absent', title: 'Unknown artifact' }]; },
    d => { d.artifact_titles = [{ artifact_id: 'a-draft', title: 'One' }, { artifact_id: 'a-draft', title: 'Two' }]; },
    d => { d.editor_id = d.parent_agent_id; },
  ];
  for (const mutate of mutations) { const authored = draft(); mutate(authored); rejected(bundle(), authored); }
});

test('invalid source bundles and secrets are rejected without echoing secret values', () => {
  const secret = 'sk-ant-ASSEMBLY-SECRET-1234567890';
  const mutations = [
    (b, d) => { d.summary = secret; },
    (b, d) => { d.events[0].supporting_detail = `Bearer ${secret}`; },
    (b, d) => { d.artifact_titles = [{ artifact_id: 'a-draft', title: secret }]; },
    (b, d) => { d.events.pop(); d.omitted_occurrences = [{ id: 'end-1', reason: secret }]; },
    (b, d) => { d.context_copy = { workflow: { title: secret } }; },
    (b, d) => { d[secret] = secret; },
    b => { b.evidence[0].content = { [secret]: secret }; },
    b => { b.artifacts[0].content = secret; },
    b => { b.artifacts[0].source_url = `https://example.test/?token=${secret}`; },
  ];
  for (const mutate of mutations) {
    const input = bundle(); const authored = draft(); mutate(input, authored);
    assert.ok(!JSON.stringify(rejected(input, authored)).includes(secret));
  }
  const input = bundle(); input.occurrences[0].actor_id = 'absent';
  rejected(input, draft(), 'missing_reference');
  rejected(null, draft());
  rejected(bundle(), null);
  const malformed = draft(); malformed.events = Array(1);
  rejected(bundle(), malformed, 'schema');
});

function supportingGapCase() {
  const input = bundle();
  input.occurrences.push({ id: 'support-read', kind: 'supporting_activity', actor_id: 'agent-1', session_id: 'session-1',
    description: 'Read configuration as supporting activity.', outcome: 'unknown', evidence_refs: ['e-session'], artifact_refs: [], relationships: [] });
  input.coverage.gaps.push({ id: 'support-history', description: 'Supporting read history is incomplete.\nNo additional effect is established.',
    affected_refs: ['support-read', 'e-session'], impact: 'Supporting activity must not be promoted to a timeline event.' });
  const authored = draft();
  authored.omitted_occurrences = [{ id: 'support-read', reason: 'Configuration reading is supporting activity, not a world-facing event.' }];
  return { input, authored };
}

// These local review fixtures exercise contract binding only, not claim truth,
// real reviewer dispatch, or model quality.
async function withScriptedReviews(candidate) {
  const doc = structuredClone(candidate);
  if (doc.schema_version !== '1.7') delete doc.header_copy;
  doc.copy_review = fakeCopyReview(doc);
  if (doc.schema_version === '1.2') {
    doc.copy_review.rule_versions.sdlc = 'scenario-run-v1';
    const fields = new Map(copyFields(doc).map(field => [field.field_path, field.text]));
    doc.copy_review.passages = doc.copy_review.passages.map(({ field_digest, ...passage }) => ({ ...passage, original_text: fields.get(passage.field_path) }));
  }
  doc.review = await fakeChecker().check(doc);
  if (['1.6', '1.7'].includes(doc.schema_version)) doc.copy_review_iterations = 1;
  return doc;
}

test('current candidate preserves coverage gap text and source IDs for omitted supporting occurrences', async () => {
  const { input, authored } = supportingGapCase();
  const before = JSON.stringify({ input, authored });
  assert.equal(validate(input, 'bundle').ok, true);
  const doc = assembled(freeze(input), freeze(authored));
  const { impact, ...expectedGap } = input.coverage.gaps[0];
  assert.equal(JSON.stringify(doc.coverage.gaps[0]), JSON.stringify(expectedGap));
  assert.deepEqual(doc.coverage.gaps[0].affected_refs, ['support-read', 'e-session']);
  assert.ok(!doc.timeline.some(event => event.id === 'support-read'));
  assert.deepEqual(doc.omitted_occurrences, authored.omitted_occurrences);
  assert.equal(JSON.stringify({ input, authored }), before);
  const reviewed = await withScriptedReviews(doc);
  const reviewedBefore = JSON.stringify(reviewed), digest = factualDigest(reviewed);
  assert.deepEqual(validate(reviewed), { ok: true, errors: [] });
  assert.strictEqual(prepareRenderSnapshot(reviewed).snapshot, reviewed);
  assert.equal(JSON.stringify(reviewed), reviewedBefore);
  assert.equal(factualDigest(reviewed), digest);
  reviewed.coverage.gaps[0].affected_refs = ['e-session'];
  assert.ok(validate(reviewed).errors.some(error => error.code === 'stale_review'), 'coverage references remain digest-bound');
});

test('current coverage extension rejects unaccounted targets, duplicate omissions and selection conflicts', async () => {
  const { input, authored } = supportingGapCase();
  const doc = assembled(input, authored);
  for (const [mutate, code] of [
    [d => { d.omitted_occurrences = []; }, 'missing_reference'],
    [d => { d.coverage.gaps[0].affected_refs.push('unaccounted'); }, 'missing_reference'],
    [d => { d.omitted_occurrences.push(structuredClone(d.omitted_occurrences[0])); }, 'duplicate_id'],
    [d => { d.omitted_occurrences.push({ id: 'start-1', reason: 'Conflicting editorial choice.' }); }, 'selection_conflict'],
  ]) {
    const changed = structuredClone(doc); mutate(changed);
    for (const result of [validateCandidate(changed), validate(await withScriptedReviews(changed))]) {
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(error => error.code === code), JSON.stringify(result.errors));
    }
  }
  const fabricated = structuredClone(authored);
  fabricated.omitted_occurrences.push({ id: 'not-in-bundle', reason: 'Fabricated omission.' });
  rejected(input, fabricated, 'missing_reference');
  // Registering an omitted ID for coverage must not make it a valid timeline
  // relationship target, either in direct validation or in assembly.
  const relationship = { other_occurrence_id: 'support-read', relation: 'follows', basis: 'inferred', evidence_refs: ['e-session'] };
  doc.timeline[0].relationships.push(relationship);
  assert.ok(validateCandidate(doc).errors.some(error => error.code === 'missing_reference' && error.path.includes('.relationships[')));
  input.occurrences[0].relationships.push(structuredClone(relationship));
  rejected(input, authored, 'omitted_relationship');
});

test('legacy 1.2 coverage targets and original review digests are unchanged', async () => {
  const { input, authored } = supportingGapCase();
  const legacyCandidate = assembled(input, authored);
  legacyCandidate.schema_version = '1.2';
  const legacy = await withScriptedReviews(legacyCandidate);
  const before = JSON.stringify(legacy), digest = factualDigest(legacy);
  const rejectedLegacy = prepareRenderSnapshot(legacy);
  assert.equal(rejectedLegacy.ok, false);
  assert.ok(rejectedLegacy.errors.some(error => error.code === 'missing_reference' && error.path === '$.coverage.gaps[0].affected_refs[0]'));
  assert.equal(JSON.stringify(legacy), before);
  assert.equal(factualDigest(legacy), digest);
  // A historical target that was already valid still passes without projection
  // or digest replacement. This is a freshly built synthetic legacy fixture.
  legacyCandidate.coverage.gaps[0].affected_refs = ['e-session'];
  const validLegacy = await withScriptedReviews(legacyCandidate);
  const validBefore = JSON.stringify(validLegacy), validDigest = factualDigest(validLegacy);
  const prepared = prepareRenderSnapshot(validLegacy);
  assert.equal(prepared.ok, true, JSON.stringify(prepared.errors));
  assert.strictEqual(prepared.snapshot, validLegacy);
  assert.equal(prepared.review_mode, 'legacy-dual-review');
  assert.equal(JSON.stringify(validLegacy), validBefore);
  assert.equal(prepared.snapshot.review.factual_digest, validDigest);
});
