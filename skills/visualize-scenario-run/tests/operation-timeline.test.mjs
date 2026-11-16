import assert from 'node:assert/strict';
import test from 'node:test';
import { operationTimelineFixture, operationTimelineDraft, serialOperationTimelineFixture } from './operation-timeline-fixture.mjs';
import { postrunFixture } from './postrun-package-fixtures.test.mjs';
import { packagePostrun } from '../scripts/postrun-package.mjs';
import { projectArtifactVersions, artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { validate, factualDigest } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { validatedFeedbackContext } from '../scripts/feedback-context.mjs';
import { encodeSessionEvidence } from '../scripts/session-evidence.mjs';
import { concernFixture } from './concern-fixture.mjs';

test('operation packaging keeps validation private and material on its business action across services', () => {
  const input = operationTimelineFixture(), original = structuredClone(input);
  const result = packagePostrun(input); assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.artifactVersionSource.schema_version, '2.1');
  assert.equal(result.bundle.occurrences.length, 5); assert.equal(result.authoring.occurrence_codes.length, 9);
  const projection = projectArtifactVersions(result.bundle, result.artifactVersionSource); assert.equal(projection.ok, true);
  const operation = id => result.artifactVersionSource.operations.find(item => item.operation_id === id);
  const action = result.bundle.occurrences.find(item => item.id === operation('write-reply').occurrence_id);
  assert.equal(action.evidence_refs.length, 3); assert.deepEqual(action.time, { earliest: '2026-01-01T12:00:03Z', latest: '2026-01-01T12:00:07.124Z' });
  const displayed = projection.occurrences.find(item => item.id === action.id).artifact_refs.map(id => projection.artifacts.find(item => item.id === id));
  assert.equal(displayed.length, 1); assert.equal(displayed[0].before, ''); assert.equal(displayed[0].after, 'Actual saved body\r\n\n');
  assert.ok(!displayed[0].after.includes('requested fragment'));
  assert.ok(projection.hidden_occurrence_ids.includes(operation('initial-read').occurrence_id));
  const draft = operationTimelineDraft(result), assembled = assembleCandidate(result.bundle, draft, { artifactVersionSource: result.artifactVersionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(validate(assembled.snapshot).ok, true);
  assert.equal(assembled.snapshot.timeline.length, 4);
  assert.ok(assembled.snapshot.timeline.some(item => item.description.includes('normalized')));
  assert.equal(assembled.snapshot.timeline.find(item => item.id === action.id).artifact_refs[0], displayed[0].id);
  const html = renderHtml(assembled.snapshot).html;
  assert.match(html, /diff-added/); assert.match(html, /Actual saved body/);
  assert.doesNotMatch(html, /artifact_observed|mutation_requested|mutation_acknowledged|console_log|readback|read back/i);
  assert.doesNotMatch(JSON.stringify(validatedFeedbackContext(assembled.snapshot)), /artifact_observed|mutation_requested|readback|read back/i);
  assert.deepEqual(assembled.snapshot.source_bundle, result.bundle); assert.deepEqual(input, original);
  const changed = structuredClone(assembled.snapshot); changed.timeline[0].artifact_refs = [];
  assert.equal(validate(changed).ok, false); assert.notEqual(factualDigest(changed), factualDigest(assembled.snapshot));
});

test('supporting occurrences cannot be promoted by a draft or a manually fabricated snapshot', () => {
  const result = packagePostrun(operationTimelineFixture()), draft = operationTimelineDraft(result);
  const hidden = result.bundle.occurrences.find(item => item.kind === 'supporting_activity' && !draft.events.some(event => event.occurrence_id === item.id));
  const selected = structuredClone(draft); selected.omitted_occurrences = []; selected.events.push({ occurrence_id: hidden.id, description: 'Verification mechanics.', supporting_detail: 'Do not display.', claim_refs: ['context'] });
  assert.ok(assembleCandidate(result.bundle, selected, { artifactVersionSource: result.artifactVersionSource }).errors.some(error => error.code === 'private_occurrence'));
  const snapshot = assembleCandidate(result.bundle, draft, { artifactVersionSource: result.artifactVersionSource }).snapshot;
  const forged = structuredClone(snapshot); forged.timeline.push({ ...hidden, description: 'Verification mechanics.', supporting_detail: 'Do not display.', claim_refs: ['context'] }); forged.omitted_occurrences = [];
  assert.equal(validate(forged).ok, false);
});

test('general role, operation, specification and source-time bindings fail closed without inventing a missing state', () => {
  const input = operationTimelineFixture(), result = packagePostrun(input);
  for (const change of [
    value => { delete value.operations.find(item => item.timeline_role === 'specified_process').specification_refs; },
    value => { value.operations[0].timeline_role = 'new-role'; },
    value => { value.operations.find(item => item.timeline_role === 'specified_process').specification_refs = ['/scenario/not-a-spec']; },
    value => { value.operations.find(item => item.operation_id === 'write-reply').timeline_role = 'specified_process'; },
  ]) { const modified = structuredClone(input); change(modified); assert.equal(packagePostrun(modified).ok, false); }
  for (const change of [
    value => { value.operations[0].operation_id = 'different'; },
    value => { value.bindings.find(item => item.artifact_id).artifact_id = 'other'; },
    value => { value.operations.find(item => item.timeline_role === 'specified_process').specification_refs = ['/run/status']; },
  ]) { const modified = structuredClone(result.artifactVersionSource); change(modified); assert.equal(projectArtifactVersions(result.bundle, modified).ok, false); }
  const missing = structuredClone(input); missing.session.items = missing.session.items.filter(item => JSON.parse(item.content.message).operation_id !== 'initial-read');
  const packaged = packagePostrun(missing); assert.equal(packaged.ok, true);
  const projected = projectArtifactVersions(packaged.bundle, packaged.artifactVersionSource);
  const write = projected.artifacts.find(item => item.after === 'Actual saved body\r\n\n');
  assert.equal(Object.hasOwn(write, 'before'), false); assert.ok(projected.gaps.length);
  const limited = assembleCandidate(packaged.bundle, operationTimelineDraft(packaged), { artifactVersionSource: packaged.artifactVersionSource });
  assert.equal(limited.ok, true);
  assert.match(renderHtml(limited.snapshot).html, /full effect of this change remains uncertain/);
  assert.doesNotMatch(JSON.stringify(validatedFeedbackContext(limited.snapshot)), /build-time evidence checklist|artifact_observed|readback|console_log/i);
  const old = packagePostrun(postrunFixture()); assert.equal(old.ok, true); assert.equal(old.artifactVersionSource.schema_version, '2.0'); assert.equal(old.bundle.occurrences.length, 8);
  assert.equal(result.artifactVersionSource.bundle_digest, artifactVersionBundleDigest(result.bundle));
});

test('overlapping writes do not assign a shared state or misleading comparison to one action', () => {
  const input = operationTimelineFixture();
  const branch = input.operations.find(item => item.operation_id === 'conditional-write');
  branch.target_id = 'mail-artifact';
  for (const event of input.session.items) {
    const record = JSON.parse(event.content.message);
    if (record.operation_id === branch.operation_id) { record.source = structuredClone(input.targets[0].source); event.content.message = JSON.stringify(record); }
  }
  const result = packagePostrun(input); assert.equal(result.ok, true, JSON.stringify(result.errors));
  const projection = projectArtifactVersions(result.bundle, result.artifactVersionSource);
  assert.ok(projection.gaps.some(gap => gap.code === 'overlapping_operations'));
  const actions = result.artifactVersionSource.operations.filter(item => ['write-reply', 'conditional-write'].includes(item.operation_id));
  for (const action of actions) assert.deepEqual(projection.occurrences.find(item => item.id === action.occurrence_id).artifact_refs, []);
});

test('successive material changes carry their own exact source-backed differences, not separate validation rows', () => {
  const input = serialOperationTimelineFixture(), original = structuredClone(input), result = packagePostrun(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const assembled = assembleCandidate(result.bundle, operationTimelineDraft(result), { artifactVersionSource: result.artifactVersionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  const events = assembled.snapshot.timeline.filter(event => result.artifactVersionSource.operations.some(plan => ['write-reply', 'conditional-write'].includes(plan.operation_id) && plan.occurrence_id === event.id));
  const artifacts = events.map(event => assembled.snapshot.artifacts.find(artifact => event.artifact_refs.includes(artifact.id)));
  assert.equal(artifacts[0].before, ''); assert.equal(artifacts[1].before, artifacts[0].after);
  assert.equal(artifacts[1].after, 'Actual saved body\r\n\nAdded section.');
  const html = renderHtml(assembled.snapshot).html;
  assert.equal((html.match(/aria-label="Content changes"/g) ?? []).length, 2);
  assert.equal((html.match(/class="event-meta"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /mutation_requested|artifact_observed|Private implementation evidence/);
  assert.deepEqual(input, original);
});

test('a genuine-shaped ordinary native result can support specified work without inventing a console emission', () => {
  // SCRIPTED alternative source channel, not a historical session rewrite.
  const input = serialOperationTimelineFixture();
  input.operations = input.operations.filter(operation => operation.operation_id !== 'normalize-text');
  input.session.items = input.session.items.filter(event => JSON.parse(event.content.message).operation_id !== 'normalize-text');
  for (const event of input.session.items) {
    const record = JSON.parse(event.content.message);
    if (record.stream_id === 'main' && record.sequence > 3) { record.sequence--; event.content.message = encodeSessionEvidence(record); }
  }
  const result = packagePostrun(input); assert.equal(result.ok, true, JSON.stringify(result.errors));
  const draft = operationTimelineDraft(result);
  const response = { id: 'native-process-result', type: 'runtime_done', created_at: '2026-01-01T12:00:02.750123Z', transport_probe: 'PRIVATE_NATIVE_TRANSPORT_ENVELOPE',
    task: { id: 'native-process-task', parent_task: { id: 'parent-main' } }, content: { text: 'Normalized selected text.' } };
  result.bundle.evidence.push({ id: 'e-native-process', kind: 'session_event', source: { system: 'Guild session events', record_id: response.id },
    captured_at: input.captured_at, occurred_at: '2026-01-01T12:00:02.750Z', content: structuredClone(response), completeness: 'complete', redactions: [] });
  result.bundle.evidence.push({ id: 'e-original-spec', kind: 'user_statement', source: { system: 'Original specification' },
    captured_at: input.captured_at, content: input.context.workflow.intended_world_effect, completeness: 'complete', redactions: [] });
  const action = { id: 'native-normalization', kind: 'agent_world_action', actor_id: 'agent-1', session_id: 'session-1',
    description: 'The application normalized the selected text.', time: { earliest: '2026-01-01T12:00:02.750Z', latest: '2026-01-01T12:00:02.751Z' },
    outcome: 'unconfirmed', evidence_refs: ['e-native-process'], artifact_refs: [], relationships: [],
    world_effect: { system: 'Text Normalizer', target: 'native-process-task', change: 'The application normalized the selected text.' },
    workflow_relevance: { explanation: 'Text normalization is part of the original workflow.', basis: 'user_supplied', evidence_refs: ['e-original-spec'] } };
  result.bundle.occurrences.push(action);
  result.bundle.coverage.gaps.push({ id: 'gap-private-channel', description: 'No separate emitted step result was retained in structured records.',
    affected_refs: [action.id], impact: 'The emitted channel alone does not cover this step.' });
  result.artifactVersionSource.bundle_digest = artifactVersionBundleDigest(result.bundle);
  draft.claims.push({ id: 'native-process-claim', text: action.description, evidence_refs: ['e-native-process', 'e-original-spec'] });
  draft.events.splice(1, 0, { occurrence_id: action.id, description: action.description, claim_refs: ['native-process-claim'],
    supporting_detail: 'Text normalization is part of the requested workflow.\n\nThe application recorded no separate step result.' });
  const original = structuredClone(result.bundle), assembled = assembleCandidate(result.bundle, draft, { artifactVersionSource: result.artifactVersionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(validate(assembled.snapshot).ok, true);
  assert.equal(assembled.snapshot.timeline.length, 4);
  assert.ok(assembled.snapshot.timeline.some(event => event.id === action.id));
  const html = renderHtml(assembled.snapshot).html;
  assert.match(html, /The application normalized the selected text/);
  assert.match(html, /Text normalization is part of the requested workflow/);
  assert.match(html, /Normalized selected text\./);
  assert.doesNotMatch(html, /PRIVATE_NATIVE_TRANSPORT_ENVELOPE/);
  assert.match(html, /full effect of this change remains uncertain/);
  assert.doesNotMatch(html, /process_result|separate (?:emitted )?step result|structured records|readback|read back/i);
  assert.deepEqual(assembled.snapshot.source_bundle, original);
  assert.deepEqual(assembled.snapshot.evidence.find(evidence => evidence.id === 'e-native-process').content, response);
  assert.deepEqual(result.bundle, original);
});

test('ordinary artifact result evidence stays private while exact business artifact text remains visible', () => {
  const { input, draft } = concernFixture();
  input.evidence[1].content.validation_transport = 'PRIVATE_SOURCE_ENVELOPE_ONLY';
  const content = `${input.evidence[1].content.text}\nLiteral source term: readback.`;
  input.evidence[1].content.text = content;
  input.artifacts[0].content = content;
  input.artifacts[0].after = content;
  const original = structuredClone(input);
  const assembled = assembleCandidate(input, draft);
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  const html = renderHtml(assembled.snapshot).html;
  assert.doesNotMatch(html, /PRIVATE_SOURCE_ENVELOPE_ONLY/);
  assert.match(html, /Literal source term: readback\./, 'Protected artifact text is not word-censored.');
  assert.match(html, /Sunday opening hours are not confirmed\./);
  assert.deepEqual(assembled.snapshot.source_bundle, original);
  assert.deepEqual(input, original);
});

test('private processing caveats do not erase an independent business omission', () => {
  const { input, draft } = concernFixture();
  const event = draft.events.find(item => item.occurrence_id === 'draft-1');
  event.supporting_detail = 'The saved text omitted the final warning. The internal steps were not retained, so how each term was chosen is not shown.';
  input.coverage.gaps.push({ id: 'gap-processing-private', description: 'The internal steps were not retained.', affected_refs: ['draft-1'], impact: 'Individual decisions remain unknown.' });
  const original = structuredClone(input), assembled = assembleCandidate(input, draft);
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  const html = renderHtml(assembled.snapshot).html;
  assert.match(html, /The saved text omitted the final warning\./);
  assert.doesNotMatch(html, /internal steps|how each term was chosen|not retained/i);
  assert.match(html, /full effect of this change remains uncertain/);
  assert.deepEqual(input, original);
  assert.equal(assembled.snapshot.timeline.find(item => item.id === 'draft-1').supporting_detail, event.supporting_detail);
});

test('an actual initial content representation remains the first ordinary artifact comparison baseline', () => {
  const { input, draft } = concernFixture();
  const after = `${input.artifacts[0].after}\n`;
  input.evidence[1].content.text = after;
  input.evidence.push({ id: 'e-initial-content', kind: 'external_record', source: structuredClone(input.evidence[1].source),
    occurred_at: '2026-01-01T11:59:59Z', captured_at: '2026-01-01T12:00:00Z',
    content: { created: true, text: '\n', revision: 'initial-revision' }, completeness: 'complete', redactions: [] });
  input.artifacts[0].content = after;
  input.artifacts[0].after = after;
  input.artifacts[0].evidence_refs.push('e-initial-content');
  input.evidence[1].occurred_at = '2026-01-01T12:00:00Z';
  input.occurrences.find(item => item.id === 'draft-1').time = { at: '2026-01-01T12:00:00Z' };
  input.occurrences.splice(1, 0, { id: 'create-empty', kind: 'agent_world_action', actor_id: 'agent-1', session_id: 'session-1',
    description: 'Created a reply draft.', time: { at: '2026-01-01T11:59:59Z' }, outcome: 'confirmed',
    evidence_refs: ['e-initial-content'], artifact_refs: ['a-draft'], relationships: [],
    world_effect: { system: 'Sandbox Mail', target: 'draft-1', change: 'Created a reply draft.' } });
  draft.claims.push({ id: 'claim-initial', text: 'A reply draft exists.', evidence_refs: ['e-initial-content'] });
  draft.events.splice(1, 0, { occurrence_id: 'create-empty', description: 'Created a reply draft.', claim_refs: ['claim-initial'], supporting_detail: 'The draft contains no reply text yet.' });
  const versionSource = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(input), records: [], versions: [
    { id: 'initial', artifact_id: 'a-draft', occurrence_id: 'create-empty', operation: 'capture', value_ref: { evidence_id: 'e-initial-content', pointer: '/text' } },
    { id: 'first-filled', artifact_id: 'a-draft', occurrence_id: 'draft-1', operation: 'capture', previous_version_id: 'initial', value_ref: { evidence_id: 'e-draft', pointer: '/text' } },
  ] };
  const original = structuredClone(input), assembled = assembleCandidate(input, draft, { artifactVersionSource: versionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  const first = assembled.snapshot.artifacts.find(item => item.id === 'version:first-filled');
  assert.equal(first.before, '\n');
  assert.equal(first.after, after);
  assert.equal(Object.hasOwn(input.artifacts[0], 'before'), false, 'Bundle 1.0 is not widened to accept empty artifact fields.');
  const html = renderHtml(assembled.snapshot).html;
  assert.match(html, /class="content-diff"/);
  assert.match(html, /<ins/);
  assert.equal((html.match(/class="business-artifact"/g) ?? []).length, 1, 'The initial empty state is not a public content card.');
  assert.doesNotMatch(html, /initial-revision/);
  assert.deepEqual(assembled.snapshot.source_bundle, original);
  assert.deepEqual(input, original);
  const missing = structuredClone(input);
  missing.occurrences.find(item => item.id === 'create-empty').artifact_refs = [];
  missing.artifacts[0].evidence_refs = missing.artifacts[0].evidence_refs.filter(id => id !== 'e-initial-content');
  const withoutBaseline = assembleCandidate(missing, draft);
  assert.equal(withoutBaseline.ok, true);
  assert.doesNotMatch(renderHtml(withoutBaseline.snapshot).html, /class="artifact-diff"/);
});
