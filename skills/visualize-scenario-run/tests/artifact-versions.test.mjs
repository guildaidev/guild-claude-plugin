import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { artifactVersionBundleDigest, projectArtifactVersions } from '../scripts/artifact-versions.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { validate, validateCandidate, prepareRenderSnapshot, factualDigest, copyFields } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { bundle, sourceBoundCandidate, observedAt } from './fixtures.mjs';

const ref = (evidence_id, pointer) => ({ evidence_id, pointer });
function draftFor(b) {
  const doc = sourceBoundCandidate(b);
  return { schema_version: '1.3', snapshot_id: doc.snapshot_id, editor_id: doc.editor_id,
    parent_agent_id: doc.parent_agent_id, summary: doc.summary, header_copy: doc.header_copy,
    claims: doc.claims, events: doc.timeline.map(event => ({ occurrence_id: event.id,
      description: event.description, claim_refs: event.claim_refs, supporting_detail: event.supporting_detail })),
    artifact_claims: doc.artifact_claims, omitted_occurrences: doc.omitted_occurrences };
}
function fixture(kind = 'document') {
  const b = bundle();
  b.artifacts[0].kind = kind;
  const occurrence = b.occurrences[1];
  occurrence.evidence_refs.push('e-history');
  occurrence.time = { at: '2026-01-01T12:00:01Z' };
  const second = structuredClone(occurrence);
  second.id = 'edit-2'; second.time.at = '2026-01-01T12:00:02Z';
  second.artifact_refs = ['a-draft']; occurrence.artifact_refs = [];
  b.occurrences.splice(2, 0, second);
  b.evidence.push({ id: 'e-history', kind: 'tool_result', source: { system: 'Fixture history' },
    captured_at: observedAt, content: { first: 'First 👋\n', addition: '<script>not executable</script>\n', at: 10 }, completeness: 'complete', redactions: [] });
  const sidecar = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(b), records: [], versions: [
    { id: 'one', artifact_id: 'a-draft', occurrence_id: 'draft-1', operation: 'capture', value_ref: ref('e-history', '/first') },
    { id: 'two', artifact_id: 'a-draft', occurrence_id: 'edit-2', operation: 'append', value_ref: ref('e-history', '/addition') },
  ] };
  return { b, sidecar };
}

test('every artifact kind projects meaningful first content and automatic later before/after', () => {
  for (const kind of ['document', 'message', 'record', 'file', 'diff', 'other']) {
    const { b, sidecar } = fixture(kind), original = JSON.stringify(b), sources = JSON.stringify(sidecar);
    const draft = draftFor(b);
    const result = assembleCandidate(b, draft, { artifactVersionSource: sidecar });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    const doc = result.snapshot;
    assert.deepEqual(doc.source_bundle, b);
    assert.deepEqual(doc.timeline.find(event => event.id === 'draft-1').artifact_refs, ['version:one']);
    assert.deepEqual(doc.timeline.find(event => event.id === 'edit-2').artifact_refs, ['version:two']);
    assert.equal(doc.artifacts[0].kind, kind);
    assert.equal(doc.artifacts[0].after, 'First 👋\n');
    assert.equal(doc.artifacts[0].before, undefined);
    assert.equal(doc.artifacts[1].before, doc.artifacts[0].after);
    assert.equal(doc.artifacts[1].after, 'First 👋\n<script>not executable</script>\n');
    assert.equal(doc.artifacts[1].completeness, 'excerpt');
    assert.match(doc.artifacts[1].redactions.join(' '), /contemporaneous readback was not established/);
    assert.equal(prepareRenderSnapshot({ ...doc, review: { invalid: true }, copy_review: { invalid: true } }).ok, true);
    assert.equal(JSON.stringify(b), original); assert.equal(JSON.stringify(sidecar), sources);
    const rendered = renderHtml(doc);
    assert.equal(rendered.ok, true);
    assert.ok(rendered.html.includes('&lt;script&gt;not executable&lt;/script&gt;'));
    assert.ok(!rendered.html.includes('<script>not executable</script>'));
    const digest = factualDigest(doc);
    doc.artifacts[1].before = 'invented';
    assert.equal(validateCandidate(doc).ok, false); assert.notEqual(factualDigest(doc), digest);
  }
});

test('no invented content, hidden predecessor, source replacement, stale binding or future baseline', () => {
  const cases = [
    sidecar => { sidecar.versions[1].content = 'invented'; },
    sidecar => { sidecar.versions[1].previous_version_id = 'missing'; },
    sidecar => { sidecar.versions[1].base_ref = ref('e-history', '/first'); },
    sidecar => { sidecar.versions[1].value_ref.pointer = '/missing'; },
    sidecar => { sidecar.versions[1].value_ref.pointer = '/bad~2pointer'; },
    sidecar => { sidecar.versions[1].value_ref.pointer = '/__proto__/secret'; },
    sidecar => { sidecar.bundle_digest = 'stale'; },
    sidecar => { sidecar.records.push({ id: 'e-history', content: 'replacement' }); },
    sidecar => { sidecar.versions.reverse(); },
  ];
  for (const mutate of cases) {
    const { b, sidecar } = fixture(); mutate(sidecar);
    assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  }
  const { b, sidecar } = fixture();
  b.occurrences[2].time.at = '2025-12-31T12:00:00Z'; sidecar.bundle_digest = artifactVersionBundleDigest(b);
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});

test('captured indices use declared UTF-16 base, refuse out-of-bounds and surrogate splitting', () => {
  for (const [position, expected] of [[0, false], [8, false], [999, false], [10, true]]) {
    const { b, sidecar } = fixture(); b.evidence.at(-1).content.at = position;
    sidecar.bundle_digest = artifactVersionBundleDigest(b);
    Object.assign(sidecar.versions[1], { operation: 'insert', index_ref: ref('e-history', '/at'), index_base: 1 });
    assert.equal(projectArtifactVersions(b, sidecar).ok, expected);
  }
});

test('index sources must match available target and URL even when occurrence evidence already includes them', () => {
  for (const mismatch of ['record_id', 'url']) {
    const { b, sidecar } = fixture();
    b.evidence.push({ id: 'e-index', kind: 'external_record', source: { system: 'Sandbox Mail fixture',
      record_id: 'draft-1', url: b.artifacts[0].source_url }, captured_at: observedAt,
      content: { offset: 10 }, completeness: 'complete', redactions: [] });
    const source = b.evidence.at(-1);
    b.occurrences.find(item => item.id === 'edit-2').evidence_refs.push(source.id);
    Object.assign(sidecar.versions[1], { operation: 'insert', index_ref: ref(source.id, '/offset'), index_base: 1 });
    sidecar.bundle_digest = artifactVersionBundleDigest(b);
    assert.equal(projectArtifactVersions(b, sidecar).ok, true);
    source.source[mismatch] = mismatch === 'url' ? 'https://example.test/drafts/other' : 'other-target';
    sidecar.bundle_digest = artifactVersionBundleDigest(b);
    assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  }
});

test('current empty captures and clear operations preserve exact protected state and source binding', () => {
  for (const operation of ['capture', 'replace']) {
    const { b, sidecar } = fixture();
    const draft = draftFor(b);
    b.evidence.at(-1).content.addition = '';
    if (operation === 'capture') b.evidence.at(-1).content.first = '';
    sidecar.versions[1].operation = operation;
    sidecar.bundle_digest = artifactVersionBundleDigest(b);
    const sourceBytes = JSON.stringify(b);
    const assembled = assembleCandidate(b, draft, { artifactVersionSource: sidecar });
    assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
    const doc = assembled.snapshot, artifact = doc.artifacts[1];
    assert.equal(artifact.content, ''); assert.equal(artifact.after, '');
    assert.equal(artifact.before, operation === 'capture' ? '' : 'First 👋\n');
    assert.equal(Object.hasOwn(artifact, 'before'), true);
    assert.equal(validateCandidate(doc).ok, true);
    assert.equal(prepareRenderSnapshot(doc).ok, true);
    for (const field of ['content', 'before', 'after']) {
      const item = copyFields(doc).find(item => item.field_path === `$.artifacts[1].${field}`);
      assert.equal(item.protected_source, true); assert.equal(item.text, artifact[field]);
    }
    assert.equal(JSON.stringify(b), sourceBytes); assert.deepEqual(doc.source_bundle, b);
    const changed = structuredClone(doc); changed.artifacts[1].after = 'invented';
    assert.equal(validateCandidate(changed).ok, false);
    const missing = structuredClone(doc); delete missing.artifacts[1].after;
    assert.equal(validateCandidate(missing).ok, false);
    const prose = structuredClone(doc); prose.summary = '';
    assert.equal(validateCandidate(prose).ok, false);
    const label = structuredClone(doc); label.artifacts[1].title = '';
    assert.equal(validateCandidate(label).ok, false);
    for (const version of ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8']) {
      const historical = { ...doc, schema_version: version };
      const checked = prepareRenderSnapshot(historical);
      assert.equal(checked.ok, false);
      assert.ok(checked.errors.some(error => error.path === '$.artifacts[1].content' && error.code === 'schema'), `Historical ${version} must reject empty artifact text`);
    }
  }
  const source = bundle(); source.artifacts[0].content = '';
  assert.equal(validate(source, 'bundle').ok, false);
});

test('first mutations retain exact captured baseline including empty and blank states', () => {
  for (const baseline of ['Existing captured body\n', '', '\n', ' \t\n']) {
    const { b, sidecar } = fixture();
    const sourceEvent = b.occurrences.find(item => item.id === 'draft-1');
    b.occurrences.splice(1, 0, { ...structuredClone(sourceEvent), id: 'baseline-step',
      time: { at: observedAt }, evidence_refs: ['e-baseline'], artifact_refs: [] });
    b.evidence.push({ id: 'e-baseline', kind: 'external_record', source: { system: 'Sandbox Mail fixture',
      record_id: 'draft-1', url: b.artifacts[0].source_url }, captured_at: observedAt, occurred_at: observedAt,
      content: { text: baseline }, completeness: 'complete', redactions: [] });
    sidecar.versions = [{ ...sidecar.versions[0], operation: 'append', base_ref: ref('e-baseline', '/text') }];
    sidecar.bundle_digest = artifactVersionBundleDigest(b);
    const assembled = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
    assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
    const artifact = assembled.snapshot.artifacts.find(item => item.id === 'version:one');
    assert.equal(artifact.before, baseline);
    assert.equal(Object.hasOwn(artifact, 'before'), true);
    assert.equal(artifact.after, baseline + 'First 👋\n');
    assert.equal(validateCandidate(assembled.snapshot).ok, true);
    const removed = structuredClone(assembled.snapshot);
    delete removed.artifacts.find(item => item.id === artifact.id).before;
    assert.equal(validateCandidate(removed).ok, false);
    delete sidecar.versions[0].base_ref;
    assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  }
});

test('structured record versions preserve captured JSON; source keys are not evaluated', () => {
  const { b, sidecar } = fixture('record');
  b.evidence.at(-1).content.first = { status: 'draft', nested: { expression: 'process.exit(1)' } };
  b.evidence.at(-1).content.addition = { status: 'saved' };
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  sidecar.versions[1].operation = 'capture';
  const projected = projectArtifactVersions(b, sidecar);
  assert.equal(projected.ok, true);
  assert.deepEqual(projected.artifacts[0].structured_content, b.evidence.at(-1).content.first);
  assert.deepEqual(projected.artifacts[1].structured_content, { status: 'saved' });
});

test('sidecar evidence has full safety validation and copied-source binding', () => {
  const { b, sidecar } = fixture();
  sidecar.records.push({ id: 'extra', kind: 'tool_result', source: { system: 'Fixture' }, captured_at: observedAt,
    content: { api_key: 'do-not-echo-this-value' }, completeness: 'complete', redactions: [] });
  const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.code === 'sensitive_field'));
  assert.ok(!JSON.stringify(result.errors).includes('do-not-echo-this-value'));
  delete sidecar.records[0].content.api_key;
  const assembled = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  assembled.snapshot.evidence.at(-1).content.changed = true;
  assert.equal(validateCandidate(assembled.snapshot).ok, false);
});

function externalCaptureFixture() {
  const { b, sidecar } = fixture();
  sidecar.versions = sidecar.versions.slice(0, 1);
  const source = b.evidence.at(-1);
  Object.assign(source, { kind: 'external_record', occurred_at: b.occurrences[1].time.at,
    source: { system: 'Sandbox Mail fixture', record_id: 'draft-1', url: b.artifacts[0].source_url },
    content: { title: 'Only a title', text: 'Full captured text' }, redactions: ['Attachment contents were omitted.'] });
  sidecar.versions[0].value_ref.pointer = '/title';
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  return { b, sidecar, source };
}

test('an external capture cannot retrofit future, earlier or unknown-time state onto a step', () => {
  for (const time of ['2026-01-01T12:00:03Z', '2026-01-01T12:00:00Z']) {
    const { b, sidecar, source } = externalCaptureFixture();
    source.occurred_at = time; sidecar.bundle_digest = artifactVersionBundleDigest(b);
    assert.equal(projectArtifactVersions(b, sidecar).ok, false);
    // The source remains available as evidence, never silently rewritten/deleted.
    assert.equal(source.occurred_at, time);
  }
  const { b, sidecar, source } = externalCaptureFixture();
  delete source.occurred_at;
  source.captured_at = '2026-01-01T12:00:03Z';
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  source.occurred_at = '2026-01-01T12:00:01Z';
  delete b.occurrences[1].time;
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});

test('complete external-record title pointers stay excerpted and preserve every relevant source qualification', () => {
  const { b, sidecar } = externalCaptureFixture();
  b.artifacts[0].redactions.push('Original artifact was an excerpt.');
  b.evidence.find(item => item.id === 'e-draft').redactions.push('Source account label omitted.');
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  const result = projectArtifactVersions(b, sidecar);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const artifact = result.artifacts[0];
  assert.equal(artifact.after, 'Only a title');
  assert.equal(artifact.completeness, 'excerpt');
  assert.ok(artifact.redactions.includes('Attachment contents were omitted.'));
  assert.ok(artifact.redactions.includes('Original artifact was an excerpt.'));
  assert.ok(artifact.redactions.includes('Source account label omitted.'));
  assert.match(artifact.redactions.join(' '), /complete artifact content was not independently established/);
});

test('an explicitly observed empty external field is preserved without inventing a baseline', () => {
  const { b, sidecar, source } = externalCaptureFixture();
  source.content.text = '';
  sidecar.versions[0].value_ref.pointer = '/text';
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  const assembled = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  const artifact = assembled.snapshot.artifacts.find(item => item.id === 'version:one');
  assert.equal(artifact.content, ''); assert.equal(artifact.after, '');
  assert.equal(Object.hasOwn(artifact, 'before'), false);
  assert.equal(artifact.completeness, 'excerpt');
  assert.equal(validateCandidate(assembled.snapshot).ok, true);
});

test('mis-targeted and unrelated payloads cannot borrow occurrence or artifact support', () => {
  for (const mutate of [
    source => { source.source.record_id = 'a-different-document'; },
    source => { source.source.url = 'https://example.test/drafts/different'; },
  ]) {
    const { b, sidecar, source } = externalCaptureFixture();
    mutate(source); sidecar.bundle_digest = artifactVersionBundleDigest(b);
    assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  }
  const { b, sidecar } = fixture();
  b.evidence.push({ ...structuredClone(b.evidence.at(-1)), id: 'unrelated', source: { system: 'Fixture history', record_id: 'other-operation' } });
  sidecar.versions[0].value_ref.evidence_id = 'unrelated';
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  const wrongStep = fixture();
  wrongStep.b.occurrences[1].world_effect.target = 'different-artifact-target';
  wrongStep.sidecar.bundle_digest = artifactVersionBundleDigest(wrongStep.b);
  assert.equal(projectArtifactVersions(wrongStep.b, wrongStep.sidecar).ok, false);
});

test('same captured source record or explicit matching operation IDs establish consistency, not authenticity', () => {
  const { b, sidecar } = fixture();
  b.evidence.at(-1).source.record_id = 'receipt-event';
  sidecar.records.push({ ...structuredClone(b.evidence.at(-1)), id: 'same-record-copy' });
  sidecar.versions[0].value_ref.evidence_id = 'same-record-copy';
  sidecar.bundle_digest = artifactVersionBundleDigest(b);
  assert.equal(projectArtifactVersions(b, sidecar).ok, true);
  sidecar.records[0].source.record_id = 'request-event';
  sidecar.records[0].content.operation_id = 'captured-operation-1';
  sidecar.records.push({ ...structuredClone(b.evidence.at(-1)), id: 'receipt-copy', content: { operation_id: 'captured-operation-1' }, redactions: ['Receipt response body omitted.'] });
  sidecar.versions[0].operation_binding = { request_ref: ref('same-record-copy', '/operation_id'), receipt_ref: ref('receipt-copy', '/operation_id') };
  const result = projectArtifactVersions(b, sidecar);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.artifacts[0].completeness, 'excerpt');
  assert.ok(result.artifacts[1].redactions.includes('Receipt response body omitted.'));
  sidecar.records[1].content.operation_id = 'different-operation';
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  sidecar.records[1].content.operation_id = 'captured-operation-1';
  sidecar.records[1].source.record_id = 'unrelated-receipt';
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  sidecar.records[1].source.record_id = 'receipt-event';
  sidecar.records[1].source.system = 'Unrelated source with coincident record IDs';
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});

test('unknown, equal or overlapping occurrence times cannot establish an ordered before-state', () => {
  for (const mutate of [
    b => { delete b.occurrences[1].time; },
    b => { delete b.occurrences[2].time; },
    b => { b.occurrences[2].time.at = b.occurrences[1].time.at; },
    b => { b.occurrences[1].time = { earliest: '2026-01-01T12:00:00Z', latest: '2026-01-01T12:00:03Z' }; },
    b => { b.occurrences[2].time = { earliest: '2026-01-01T12:00:00Z', latest: '2026-01-01T12:00:03Z' }; },
  ]) {
    const { b, sidecar } = fixture(); mutate(b); sidecar.bundle_digest = artifactVersionBundleDigest(b);
    assert.equal(projectArtifactVersions(b, sidecar).ok, false);
  }
});

// Optional retained-source regression: data is only read, never executed or copied
// into the repository. Portable CI skips when this private archive is unavailable.
const retainedRoot = process.env.ARTIFACT_VERSION_RETAINED_ROOT ?? '/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode/claude-plugin-smoke-gu87lbe_';
const retainedBundle = `${retainedRoot}/workspace/run-review-replay-bgsa5lw0/bundle.json`;
const retainedEvents = `${retainedRoot}/config/projects/-private-var-folders-jb-h186fcqx3wx5hkym0wtct3000000gn-T-opencode-claude-plugin-smoke-gu87lbe--workspace/e7a28d94-5862-4b4c-a1db-40026f902ea5/tool-results/mcp-plugin_guild_guild-guild_get_session_events-1794716222905.txt`;
test('actual retained requests reconstruct first-only state and exact final readback including terminal newline', { skip: !existsSync(retainedBundle) || !existsSync(retainedEvents) }, () => {
  const bytes = readFileSync(retainedBundle), b = JSON.parse(bytes);
  const events = JSON.parse(readFileSync(retainedEvents)).items;
  const requests = events.filter(event => event.content?.requests?.[0]?.insertText).reverse();
  const receipts = [1, 2].map(index => events.find(event => event.id === b.evidence.find(item => item.id === `e-doc-insert-${index}`).source.record_id));
  const create = events.find(event => event.id === b.evidence.find(item => item.id === 'e-doc-create').source.record_id);
  const record = (id, event, content) => ({ id, kind: 'session_event', source: { system: 'Guild session events', record_id: event.id }, captured_at: b.evidence[0].captured_at,
    occurred_at: new Date(event.created_at).toISOString(), content, completeness: 'excerpt', redactions: ['Unrelated event and task metadata omitted.'] });
  const sidecar = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(b), records: [
    record('v-initial', create, create.content.body.content[1].paragraph.elements[0].textRun),
    ...requests.map((event, index) => record(`v-request-${index}`, event, { request: event.content, task: { id: event.task.id } })),
    ...receipts.map((event, index) => record(`v-receipt-${index}`, event, { task: { id: event.task.id } })),
  ], versions: requests.map((event, index) => ({ id: `retained-${index}`, artifact_id: 'a-doc', occurrence_id: `doc-insert-${index + 1}`,
    operation: 'insert', value_ref: ref(`v-request-${index}`, '/request/requests/0/insertText/text'),
    index_ref: ref(`v-request-${index}`, '/request/requests/0/insertText/location/index'), index_base: 1,
    operation_binding: { request_ref: ref(`v-request-${index}`, '/task/id'), receipt_ref: ref(`v-receipt-${index}`, '/task/id') },
    ...(index === 0 ? { base_ref: ref('v-initial', '/content') } : { readback_ref: ref('e-doc-readback', '/text') }),
  })) };
  const projection = projectArtifactVersions(b, sidecar);
  assert.equal(projection.ok, true, JSON.stringify(projection.errors));
  assert.equal(requests[0].content.requests[0].insertText.text.length, 3982);
  assert.equal(requests[1].content.requests[0].insertText.location.index, 3983);
  assert.equal(projection.artifacts[0].before, '\n');
  assert.equal(projection.artifacts[0].after, requests[0].content.requests[0].insertText.text + '\n');
  assert.ok(!projection.artifacts[0].after.includes('Al-Ghasali'));
  assert.equal(projection.artifacts[1].before, projection.artifacts[0].after);
  assert.equal(projection.artifacts[1].after, b.artifacts[0].after);
  assert.equal(projection.artifacts[1].completeness, 'excerpt');
  const draft = JSON.parse(readFileSync(`${retainedRoot}/workspace/run-review-replay-bgsa5lw0/draft2.json`));
  const assembled = assembleCandidate(b, draft, { artifactVersionSource: sidecar });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
  assert.equal(prepareRenderSnapshot(assembled.snapshot).ok, true);
  const html = renderHtml(assembled.snapshot);
  assert.equal(html.ok, true);
  assert.ok(html.html.includes('aria-label="Content changes"'));
  assert.deepEqual(readFileSync(retainedBundle), bytes);
  sidecar.versions[1].readback_ref = ref('v-request-1', '/request/requests/0/insertText/text');
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});
