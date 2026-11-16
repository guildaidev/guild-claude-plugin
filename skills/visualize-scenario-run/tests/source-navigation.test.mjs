import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSourceNavigation, validateSourceNavigation, SOURCE_NAVIGATION_LIMITS } from '../scripts/source-navigation.mjs';
import { factualDigest, validateCandidate } from '../scripts/contracts.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';
import { bundle, sourceBoundCandidate } from './fixtures.mjs';

const clock = '2026-01-01T12:00:00.123Z';
const sha = 'a'.repeat(40);
const fileRequest = { owner: 'fixture-org', repo: 'observations', path: 'captures/draft.json', sha };
const fileURL = `https://github.com/fixture-org/observations/blob/${sha}/captures/draft.json`;
function report(stage = 'artifact_observed') {
  return { schema_version: '1.0', type: 'scenario_evidence', session_id: 'session-1', stream_id: 'stream-1', sequence: 1,
    operation_id: 'operation-1', stage, at: '2026-01-01T11:59:00Z',
    source: { system: 'Sandbox Mail fixture', record_id: 'draft-1' },
    material: stage === 'mutation_acknowledged' ? { completeness: 'metadata_only', redactions: [], gaps: [] } :
      { completeness: 'complete', redactions: [], gaps: [], content: 'We open at nine.' },
    ...(stage === 'mutation_acknowledged' ? { acknowledgment: 'completed' } : {}) };
}
function event(id = 'event-log', stage) {
  return { id, type: 'runtime_start', created_at: '2026-01-01T11:59:01.123456+00:00',
    task: { id: 'tool-task-1', tool_name: 'console_log', tool_call_id: 'console_log-1',
      parent_task: { id: 'parent-task-1', agent: { id: 'agent-1' }, version: { id: 'version-7' } } },
    content: { level: 'info', message: JSON.stringify(report(stage)) } };
}
// Representative fictional retained source records, not live reads or a model eval.
function fixture({ list = [event()], clockValue = clock, hasMore = false, stage } = {}) {
  const input = bundle();
  input.evidence[0].content = { session_id: 'session-1', status: 'completed' };
  input.evidence.push({ id: 'e-events', kind: 'session_event', source: { system: 'Guild session events', record_id: 'session-1' },
    captured_at: '2026-01-01T12:01:00Z', content: { session_id: 'session-1', ...(clockValue ? { captured_at: clockValue } : {}),
      items: stage ? [event('event-log', stage)] : list, limit: 500, has_more: hasMore, total_count: list.length + (hasMore ? 200 : 0) },
    completeness: hasMore ? 'excerpt' : 'complete', redactions: hasMore ? ['Older events are outside this capture.'] : [] });
  input.occurrences[1].evidence_refs.push('e-events');
  input.evidence[1].source = { system: 'GitHub fixture archive', record_id: fileRequest.path, url: fileURL };
  input.evidence[1].content = { request: fileRequest, response: { metadata: { captured_at: clock }, text: 'We open at nine.', status: 'draft' } };
  input.artifacts[0].source_url = fileURL;
  return sourceBoundCandidate(input);
}
const options = () => ({ read_sources: [{ evidence_id: 'e-draft', reader: 'github_file', response_pointer: '/response', request_pointer: '/request' }] });
const source = (navigation, id) => navigation.sources.find(s => s.source_id === id);
const rejects = (candidate, opts, code) => assert.throws(() => buildSourceNavigation(candidate, opts), e => e.code === code);
function draftFor(input) {
  const candidate = sourceBoundCandidate(input);
  return { schema_version: '1.4', snapshot_id: candidate.snapshot_id, editor_id: candidate.editor_id,
    parent_agent_id: candidate.parent_agent_id, summary: candidate.summary, header_copy: candidate.header_copy,
    claims: candidate.claims, events: candidate.timeline.map(e => ({ occurrence_id: e.id, description: e.description,
      claim_refs: e.claim_refs, supporting_detail: e.supporting_detail })),
    artifact_claims: candidate.artifact_claims, omitted_occurrences: candidate.omitted_occurrences };
}

test('indexes every claim/source/event/artifact/operation without mutating inputs or claiming independent reads', t => {
  const candidate = fixture(), opts = options(), before = structuredClone({ candidate, opts });
  assert.equal(validateCandidate(candidate).ok, true);
  const navigation = buildSourceNavigation(candidate, opts);
  assert.deepEqual({ candidate, opts }, before);
  assert.equal(navigation.candidate_digest, factualDigest(candidate));
  assert.equal(navigation.private, true);
  assert.equal(navigation.cached_index_is_independent_read, false);
  assert.equal(navigation.claim_coverage.length, candidate.claims.length);
  assert.deepEqual(navigation.claim_coverage.map(c => c.claim_id), candidate.claims.map(c => c.id));
  assert.ok(navigation.claim_coverage.every(c => c.independent_read_required && c.finding_required));
  assert.ok(navigation.read_suggestions.every(s => s.independent_read_required));
  assert.deepEqual(navigation.events[0].emitter, event().task.parent_task);
  assert.equal(navigation.events[0].task_id, 'tool-task-1');
  assert.equal(navigation.events[0].created_at, event().created_at, 'No source-time normalization');
  assert.equal(navigation.operations[0].operation_id, 'operation-1');
  assert.equal(navigation.operations[0].state_basis, 'attributed_observation_not_independent_read');
  assert.equal(navigation.operations[0].locator.pointer, '/evidence/2/content/items/0/content/message');
  assert.equal(navigation.qualifications.data_origin, 'synthetic');
  assert.equal(navigation.claim_coverage.find(c => c.claim_id === 'claim-draft-1').operation_indexes.length, 1);
  assert.equal(navigation.artifacts[0].source_url, fileURL);
  assert.deepEqual(navigation.artifacts[0].material_fields, ['content', 'after']);
  assert.equal(validateSourceNavigation(candidate, navigation, opts).ok, true);
  const serialized = JSON.stringify(navigation);
  assert.ok(!serialized.includes('We open at nine.'), 'Navigation does not repeat material payloads');
  t.diagnostic(`Synthetic sample: ${Buffer.byteLength(serialized)} serialized bytes; ${navigation.read_suggestions.length} suggested independent operations; zero executed operations.`);
});

test('only existing allowlisted requests, exact pinned session IDs, maximum limit and justified type filters', () => {
  const candidate = fixture(), navigation = buildSourceNavigation(candidate, options());
  assert.deepEqual(navigation.read_suggestions.map(s => [s.tool, s.arguments]), [
    ['guild_get_session', { session_id: 'session-1' }],
    ['get_file_contents', fileRequest],
    ['guild_get_session_events', { session_id: 'session-1', limit: 500, types: ['runtime_start'] }],
  ]);
  assert.equal(navigation.read_suggestions.filter(s => s.tool === 'guild_get_session_events').length, 1);
  for (const request of navigation.read_suggestions) assert.ok(!Object.keys(request.arguments).some(k => ['before_id', 'offset', 'observed_at'].includes(k)));
  assert.match(navigation.checker_rules.join(' '), /own read|OWN read/);
  assert.match(navigation.checker_rules.join(' '), /paired-read clock/);
});

test('cached metadata is never observed_at; unsupported event-only clocks remain unsupported', () => {
  const candidate = fixture({ clockValue: null }), opts = options();
  const navigation = buildSourceNavigation(candidate, opts);
  assert.equal(source(navigation, 'e-events').read_clock.status, 'unsupported');
  assert.equal(source(navigation, 'e-session').read_clock.status, 'unsupported');
  assert.equal(source(navigation, 'e-draft').read_clock.status, 'cached_source_capture_metadata');
  assert.equal(source(navigation, 'e-events').cached_capture.at, candidate.evidence[2].captured_at);
  opts.read_sources.push({ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '', clock_pointer: '/items/0/created_at' });
  rejects(candidate, opts, 'read_clock');
  assert.ok(!JSON.stringify(navigation).includes('"observed_at":'));
});

test('full UTC metadata format accepts actual fractions but rejects date-only, offsets and invalid calendar times', () => {
  for (const valid of ['2026-01-01T12:00:00Z', '2026-01-01T12:00:00.1Z', '2026-01-01T12:00:00.123Z']) {
    const navigation = buildSourceNavigation(fixture({ clockValue: valid }));
    assert.equal(source(navigation, 'e-events').read_clock.at, valid);
  }
  for (const invalid of ['2026-01-01', '2026-01-01T12:00:00+00:00', '2026-02-30T12:00:00Z', '2026-01-01T12:00:00.1234Z']) {
    const candidate = fixture({ clockValue: invalid });
    assert.equal(source(buildSourceNavigation(candidate), 'e-events').read_clock.status, 'unsupported');
    rejects(candidate, { read_sources: [{ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '', clock_pointer: '/captured_at' }] }, 'read_clock');
  }
});

test('partial/newest-first/AFTER-only captures preserve gaps and never suggest an older cursor or polling', () => {
  const candidate = fixture({ hasMore: true });
  for (const root of [candidate.evidence, candidate.source_bundle.evidence]) {
    root[2].content = { request: { session_id: 'session-1', limit: 25, from_id: 'actual-after-cursor', types: ['runtime_start'] }, response: root[2].content };
  }
  const navigation = buildSourceNavigation(candidate, { read_sources: [{ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '/response', request_pointer: '/request' }] });
  const item = source(navigation, 'e-events');
  assert.deepEqual(item.pagination, { has_more: true, limit: 500, total_count: 201 });
  assert.match(item.gaps.join(' '), /partial\/truncated/);
  assert.match(item.gaps.join(' '), /AFTER-only/);
  assert.deepEqual(item.redactions, ['Older events are outside this capture.']);
  const suggestion = navigation.read_suggestions.find(s => s.tool === 'guild_get_session_events');
  assert.equal(suggestion.arguments.from_id, undefined, 'Never turn AFTER into an older page cursor');
  assert.match(suggestion.limitations.join(' '), /Do not poll/);
  assert.equal(navigation.events[0].bounded_read_reachability, 'unverified_on_future_read');
});

test('full retained synthetic collections index older records without asserting a reachable older query', () => {
  const list = Array.from({ length: 510 }, (_, i) => ({ id: `event-${i}`, type: 'agent_console', at: '2026-01-01T11:59:00Z' }));
  const navigation = buildSourceNavigation(fixture({ list }));
  assert.equal(navigation.events.length, 510);
  assert.equal(navigation.read_suggestions.filter(s => s.tool === 'guild_get_session_events').length, 1);
  assert.equal(navigation.events[499].bounded_read_reachability, 'unverified_on_future_read');
  assert.equal(navigation.events[500].bounded_read_reachability, 'outside_cached_newest_500_matching_events');
  assert.equal(navigation.read_suggestions.at(-1).outside_cached_bounded_page_event_ids.length, 10);
  assert.equal(navigation.read_suggestions.at(-1).arguments.limit, 500);
});

test('unknown source capabilities and unknown event enums remain honest, not invented calls', () => {
  const candidate = fixture({ list: [{ id: 'source-event-new-type', type: 'undocumented_future_type' }] });
  const navigation = buildSourceNavigation(candidate);
  assert.equal(source(navigation, 'e-draft').reader, 'unknown', 'Immutable GitHub metadata needs an explicit structured-handle binding');
  assert.equal(source(navigation, 'e-draft').request_ids.length, 0);
  assert.match(source(navigation, 'e-draft').gaps[0], /No supported/);
  assert.deepEqual(navigation.read_suggestions.at(-1).arguments, { session_id: 'session-1', limit: 500 });
  assert.match(source(navigation, 'e-events').gaps.join(' '), /no invented type filter/);
  assert.ok(navigation.claim_coverage.some(c => c.unknown_capability_source_ids.includes('e-draft')));
});

test('receipts and requested operations are not promoted to stored observations', () => {
  for (const stage of ['mutation_requested', 'mutation_acknowledged']) {
    const navigation = buildSourceNavigation(fixture({ stage }));
    assert.equal(navigation.operations[0].stage, stage);
    assert.equal(navigation.operations[0].state_basis, 'intent_receipt_or_gap_not_stored_state');
  }
});

test('exact validated candidate document pointers get real lines; guessed/stale/unsafe files fail', () => {
  const candidate = fixture();
  const text = JSON.stringify(candidate, null, 2), path = '/private/retained/candidate.json';
  const opts = { ...options(), candidate_document: { path, text } };
  const navigation = buildSourceNavigation(candidate, opts);
  const locator = navigation.events[0].locator;
  assert.equal(locator.file, path);
  assert.equal(text.split('\n')[locator.line - 1].trim(), '{');
  assert.equal(locator.pointer, '/evidence/2/content/items/0');
  assert.equal(text.split('\n')[navigation.operations[0].locator.line - 1].trim().startsWith('"message":'), true);
  assert.equal(validateSourceNavigation(candidate, navigation, opts).ok, true);
  assert.equal(validateSourceNavigation(candidate, navigation).ok, false, 'File/line mappings require the original document input');
  for (const unsafe of ['/retained/../candidate.json', 'file:///retained/candidate.json', '//remote/candidate.json', '/x/$(touch z).json'])
    rejects(candidate, { candidate_document: { path: unsafe, text } }, 'document');
  rejects(candidate, { candidate_document: { path, text: JSON.stringify({ ...candidate, summary: 'Stale source.' }) } }, 'document_binding');
  assert.equal(source(buildSourceNavigation(candidate), 'e-session').locator.file, undefined);
});

test('strict options/pointers/requests reject unsupported fields and arbitrary source cross-binding', () => {
  const candidate = fixture();
  rejects(candidate, { from_id: 'invented' }, 'options');
  rejects(candidate, { read_sources: [{ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '', before_id: 'not-supported' }] }, 'read_source');
  rejects(candidate, { read_sources: [{ evidence_id: 'missing', reader: 'guild_events', response_pointer: '' }] }, 'read_source');
  rejects(candidate, { read_sources: [{ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '/constructor' }] }, 'pointer');
  rejects(candidate, { read_sources: [{ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '/items/01' }] }, 'pointer');
  rejects(candidate, { read_sources: [{ evidence_id: 'e-draft', reader: 'guild_events', response_pointer: '/response' }] }, 'source_binding');
  const duplicate = options(); duplicate.read_sources.push(duplicate.read_sources[0]);
  rejects(candidate, duplicate, 'read_source');
});

test('immutable GitHub handles require the exact source-bound path/SHA, never mutable ref or invented routes', () => {
  for (const patch of [{ sha: 'main' }, { ref: 'main' }, { path: '../other.json' }, { path: 'other.json' }, { sha: 'b'.repeat(40) }, { owner: 'other-org' }, { api: '/contents' }]) {
    const candidate = fixture();
    for (const root of [candidate.evidence, candidate.source_bundle.evidence]) root[1].content.request = { ...fileRequest, ...patch };
    assert.throws(() => buildSourceNavigation(candidate, options()), /Source navigation rejected/);
  }
  const navigation = buildSourceNavigation(fixture(), options());
  assert.equal(navigation.read_suggestions.find(s => s.tool === 'get_file_contents').arguments.sha, sha);
});

test('session IDs must be pinned and internally consistent; request bounds and actual types are strict', () => {
  for (const patch of [{ session_id: 'unprovided-session' }, { before_id: 'event-log' }, { offset: 50 }, { limit: 501 }, { limit: -1 }, { types: ['not-documented'] }]) {
    const candidate = fixture();
    for (const root of [candidate.evidence, candidate.source_bundle.evidence]) root[2].content = { request: { session_id: 'session-1', ...patch }, response: root[2].content };
    assert.throws(() => buildSourceNavigation(candidate, { read_sources: [{ evidence_id: 'e-events', reader: 'guild_events', response_pointer: '/response', request_pointer: '/request' }] }));
  }
  const candidate = fixture();
  for (const root of [candidate.evidence, candidate.source_bundle.evidence]) root[2].content.items[0].session_id = 'unprovided-session';
  rejects(candidate, {}, 'event_binding');
});

test('duplicate/conflicting event identities and fabricated pagination are rejected, not silently deduplicated', () => {
  rejects(fixture({ list: [event(), event()] }), {}, 'event_binding');
  const candidate = fixture();
  for (const root of [candidate.evidence, candidate.source_bundle.evidence]) root[2].content.has_more = 'false';
  rejects(candidate, {}, 'pagination');
});

test('full cached event and reduced collector envelope share identity only when overlapping values agree', () => {
  const input = fixture().source_bundle;
  input.evidence[2].content.items[0].task.parent_task.agent.label = 'Actual extra source metadata';
  const retained = event();
  input.evidence.push({ id: 'e-reduced', kind: 'session_event', source: { system: 'Guild session events', record_id: retained.id },
    captured_at: clock, content: { event: retained }, completeness: 'complete', redactions: [] });
  input.occurrences[1].evidence_refs.push('e-reduced');
  const navigation = buildSourceNavigation(sourceBoundCandidate(input));
  assert.equal(navigation.events.length, 2, 'Both actual source locators survive');
  assert.equal(navigation.events[0].event_id, navigation.events[1].event_id);
  assert.equal(navigation.read_suggestions.filter(s => s.tool === 'guild_get_session_events').length, 1);
  input.evidence[3].content.event.task.parent_task.agent.id = 'other-agent';
  rejects(sourceBoundCandidate(input), {}, 'event_binding');
});

test('closed deterministic index rejects stale candidates, unsafe URLs, changed requests/locators and extra keys', () => {
  const candidate = fixture(), opts = options(), navigation = buildSourceNavigation(candidate, opts);
  const stale = structuredClone(candidate); stale.summary += ' A revised summary.';
  assert.equal(validateSourceNavigation(stale, navigation, opts).errors[0].code, 'stale_navigation');
  for (const alter of [n => { n.extra = true; }, n => { n.events[0].source_id = 'e-draft'; },
    n => { n.read_suggestions[0].arguments.session_id = 'unprovided-session'; },
    n => { n.sources[0].locator.pointer = '/evidence/1'; }, n => { n.claim_coverage.pop(); }]) {
    const changed = structuredClone(navigation); alter(changed);
    assert.equal(validateSourceNavigation(candidate, changed, opts).ok, false);
  }
  for (const url of ['https://user:secret@example.test/record', 'https://example.test/record?token=secret', 'https://example.test/a/%2e%2e/record']) {
    const input = fixture();
    for (const root of [input.evidence, input.source_bundle.evidence]) root[1].source.url = url;
    assert.throws(() => buildSourceNavigation(input), /Source navigation rejected/);
  }
  assert.equal(SOURCE_NAVIGATION_LIMITS.events, 20000);
});

test('current 1.10/draft 1.4 covers concern/fix claims and retains unselected original source activity', () => {
  const input = fixture().source_bundle;
  input.occurrences.push({ id: 'unselected-read', kind: 'supporting_activity', actor_id: 'agent-1', session_id: 'session-1',
    description: 'A retained source read outside the selected story.', outcome: 'unknown', evidence_refs: ['e-session'], artifact_refs: [], relationships: [] });
  const draft = draftFor(input), claim_id = draft.events[1].claim_refs[0];
  draft.events[1].concern = { explanation: 'Sending is not established by a saved draft.', evidence_refs: ['e-draft'], claim_refs: [claim_id] };
  draft.events[1].suggested_feedback = { action_id: 'issue', explanation: 'Keep the draft separate from delivery.',
    text: 'Keep the draft and delivery states separate.', evidence_refs: ['e-draft'], claim_refs: [claim_id] };
  const result = assembleCandidate(input, draft);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.snapshot.schema_version, '1.10');
  const navigation = buildSourceNavigation(result.snapshot, options());
  const omitted = navigation.occurrences.find(o => o.occurrence_id === 'unselected-read');
  assert.equal(omitted.selected, false);
  assert.equal(omitted.time_window, undefined, 'Unknown source time stays unknown');
  assert.equal(omitted.locator.pointer, '/source_bundle/occurrences/3');
  assert.ok(navigation.claim_coverage.find(c => c.claim_id === claim_id).source_ids.includes('e-draft'));
  assert.equal(validateSourceNavigation(result.snapshot, navigation, options()).ok, true);
});

test('projected version operations retain exact content references and empty after-state without inventing readback', () => {
  const input = bundle();
  input.occurrences[1].evidence_refs.push('e-history');
  input.occurrences[1].time = { at: '2026-01-01T12:00:01Z' };
  const second = structuredClone(input.occurrences[1]);
  second.id = 'clear-step'; second.time.at = '2026-01-01T12:00:02Z';
  input.occurrences.splice(2, 0, second);
  input.evidence.push({ id: 'e-history', kind: 'tool_result', source: { system: 'Fixture history' },
    captured_at: '2026-01-01T12:00:00Z', content: { first: 'First stored text\n', cleared: '' }, completeness: 'complete', redactions: [] });
  const artifactVersionSource = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(input), records: [], versions: [
    { id: 'first', artifact_id: 'a-draft', occurrence_id: 'draft-1', operation: 'capture', value_ref: { evidence_id: 'e-history', pointer: '/first' } },
    { id: 'cleared', artifact_id: 'a-draft', occurrence_id: 'clear-step', previous_version_id: 'first', operation: 'replace', value_ref: { evidence_id: 'e-history', pointer: '/cleared' } },
  ] };
  const result = assembleCandidate(input, draftFor(input), { artifactVersionSource });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const navigation = buildSourceNavigation(result.snapshot);
  assert.equal(navigation.operations.length, 2);
  assert.equal(navigation.operations[1].previous_version_id, 'first');
  assert.equal(navigation.operations[1].refs.value_ref.locator.pointer, '/evidence/2/content/cleared');
  assert.equal(navigation.operations[1].state_basis, 'projection_not_independent_stored_state');
  assert.equal(navigation.operations[1].refs.readback_ref, undefined);
  const artifact = navigation.artifacts.find(a => a.artifact_id === 'version:cleared');
  assert.ok(artifact.material_fields.includes('after'));
  assert.ok(artifact.material_fields.includes('before'));
  assert.equal(artifact.completeness, 'excerpt');
  assert.match(artifact.redactions.join(' '), /readback was not established/);
  assert.equal(navigation.qualifications.data_origin, 'synthetic');
});

test('bounded output rejects overflow rather than dropping source events or claims', () => {
  const list = Array.from({ length: 12000 }, (_, i) => ({ id: `event-${i}`, type: 'agent_console', at: '2026-01-01T11:59:00Z' }));
  rejects(fixture({ list }), {}, 'output_limit');
});
