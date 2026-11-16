import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateSessionEvidence, encodeSessionEvidence, consoleEvidenceEnvelope, collectSessionEvidence, assessSessionEvidenceCoverage, MAX_EVIDENCE_BYTES, MAX_SESSION_EVIDENCE_RECORDS } from '../scripts/session-evidence.mjs';
import { artifactVersionBundleDigest, projectArtifactVersions } from '../scripts/artifact-versions.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { prepareRenderSnapshot, validateCandidate } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { sourceLimitations } from '../scripts/public-evidence.mjs';
import { inspect } from '../scripts/inspect.mjs';
import { renderFile } from '../scripts/render.mjs';
import { contentDiff } from '../scripts/diff.mjs';
import { bundle, sourceBoundCandidate } from './fixtures.mjs';

const captured_at = '2026-01-01T12:01:00Z';
function record(sequence = 1, stage = 'artifact_observed', content = 'First exact state\n') {
  return { schema_version: '1.0', type: 'scenario_evidence', session_id: 'session-1', stream_id: 'main', sequence,
    operation_id: `write-${sequence}`, stage, at: `2026-01-01T12:00:${String(sequence).padStart(2, '0')}Z`,
    source: { system: 'Sandbox Mail', record_id: 'draft-1', url: 'https://example.test/drafts/1' },
    material: { content, revision: `revision-${sequence}`, completeness: 'complete', redactions: [], gaps: [] },
    ...(stage === 'mutation_acknowledged' ? { acknowledgment: 'accepted' } : {}) };
}
function envelope(value, index = value.sequence) {
  return { id: `event-${index}`, entity_type: 'EntEventRuntimeStart', type: 'runtime_start', created_at: value.at.replace('Z', '.123456+00:00'),
    task: { id: `console-task-${index}`, tool_name: 'console_log', tool_call_id: `console_log-call-${index}`,
      parent_task: { id: 'parent-task', agent: { id: 'agent-1' }, version: { id: 'version-7' } } },
    content: { level: 'info', message: encodeSessionEvidence(value) } };
}
function fixture(values = [record(), record(2, 'artifact_observed', 'First exact state\nLater material\n')]) {
  const b = bundle(), template = structuredClone(b.occurrences[1]);
  b.occurrences.splice(1, 1, ...values.map((value, index) => ({ ...structuredClone(template), id: index ? `edit-${index}` : 'draft-1',
    time: { earliest: value.at, latest: value.at.replace('Z', '.999Z') }, evidence_refs: [`log:event-${index + 1}`] })));
  const events = values.map((value, i) => envelope(value, i + 1));
  const collected = collectSessionEvidence({ session_id: 'session-1', items: [...events].reverse() }, { captured_at });
  assert.equal(collected.ok, true);
  b.evidence.push(...collected.evidence);
  const sidecar = { schema_version: '2.0', bundle_digest: artifactVersionBundleDigest(b), records: [], session_id: 'session-1',
    streams: [{ stream_id: 'main', parent_task_id: 'parent-task', agent_id: 'agent-1', agent_version_id: 'version-7' }],
    requirements: [...new Set(values.map(value => value.stage))].map(stage => ({ source: { system: 'Sandbox Mail', record_id: 'draft-1' }, stage,
      min_records: values.filter(value => value.stage === stage).length, material_required: stage !== 'mutation_acknowledged' })),
    bindings: values.map((value, index) => ({ evidence_id: `log:event-${index + 1}`, occurrence_id: index ? `edit-${index}` : 'draft-1',
      ...(['artifact_observed', 'mutation_requested', 'source_selected'].includes(value.stage) ? { artifact_id: 'a-draft' } : {}) })) };
  return { b, sidecar, events };
}
function draftFor(b) {
  const old = sourceBoundCandidate(b);
  return { schema_version: '1.4', snapshot_id: old.snapshot_id, editor_id: old.editor_id, parent_agent_id: old.parent_agent_id,
    summary: old.summary, header_copy: old.header_copy, claims: old.claims,
    events: old.timeline.map(e => ({ occurrence_id: e.id, description: e.description, claim_refs: e.claim_refs, supporting_detail: e.supporting_detail })),
    artifact_claims: old.artifact_claims, omitted_occurrences: old.omitted_occurrences };
}
const rebind = (b, sidecar) => { sidecar.bundle_digest = artifactVersionBundleDigest(b); };

test('actual-shaped Guild console start envelope persists JSON once; done/debug/model/source prose are ignored', () => {
  const event = envelope(record());
  const done = { ...event, id: 'done-1', type: 'runtime_done', content: { result: 'ok' } };
  const debug = { ...event, id: 'debug-1', content: { level: 'error', message: 'Provider model failed; do not invent a timeline action.' } };
  const notConsole = { ...event, id: 'other-1', task: { ...event.task, tool_name: 'read_source' } };
  const collected = collectSessionEvidence({ session_id: 'session-1', items: [done, debug, notConsole, event] }, { captured_at });
  assert.equal(collected.ok, true); assert.equal(collected.evidence.length, 1); assert.deepEqual(collected.gaps, []);
  assert.equal(collected.evidence[0].content.event.content.message, event.content.message);
  assert.equal(collected.evidence[0].occurred_at, '2026-01-01T12:00:01.123Z');
  assert.equal(consoleEvidenceEnvelope(done), undefined);
  assert.equal(collected.evidence[0].content.event.task.parent_task.version.id, 'version-7');
});

test('closed bounded logger rejects false completeness, secrets and malformed records without echoing rejected data', () => {
  for (const mutate of [
    r => { r.extra = 'no'; }, r => { r.material.completeness = 'complete'; r.material.redactions.push('Removed content.'); },
    r => { delete r.material.content; }, r => { r.material.content = 'x'.repeat(MAX_EVIDENCE_BYTES); },
    r => { r.material.content = { password: 'DO_NOT_ECHO' }; }, r => { r.material.content = NaN; },
    r => { r.at = '2026-01-01'; }, r => { r.sequence = 0; }, r => { r.acknowledgment = 'completed'; },
    r => { r.source.url += '?token=secret'; }, r => { r.material.immutable_url = 'https://example.test/revision'; delete r.material.revision; },
  ]) {
    const r = record(); mutate(r);
    const result = validateSessionEvidence(r);
    assert.equal(result.ok, false); assert.ok(!JSON.stringify(result).includes('DO_NOT_ECHO'));
    assert.throws(() => encodeSessionEvidence(r));
  }
  assert.equal(validateSessionEvidence(record(1, 'artifact_observed', '')).ok, true);
  const meta = record(); meta.material = { completeness: 'metadata_only', gaps: ['Content too large; immutable revision awaits authorized verification.'], redactions: [], revision: 'r1', immutable_url: 'https://example.test/r1' };
  assert.equal(validateSessionEvidence(meta).ok, true);
});

test('content-free acknowledgment is a receipt, not a missing material version or invented gap', () => {
  for (const acknowledgment of ['accepted', 'completed', 'failed', 'unknown']) {
    const receipt = record(2, 'mutation_acknowledged'); receipt.acknowledgment = acknowledgment;
    receipt.material = { completeness: 'metadata_only', redactions: [], gaps: [] };
    const original = JSON.stringify(receipt);
    assert.equal(validateSessionEvidence(receipt).ok, true);
    const collected = collectSessionEvidence({ session_id: 'session-1', items: [envelope(receipt)] }, { captured_at });
    assert.deepEqual(collected.gaps, []); assert.equal(collected.evidence.length, 1);
    assert.equal(collected.evidence[0].content.event.content.message, original);
    assert.equal(collected.evidence[0].completeness, 'excerpt');
    const { b, sidecar } = fixture([receipt]);
    const projection = projectArtifactVersions(b, sidecar);
    assert.equal(projection.ok, true); assert.deepEqual(projection.artifacts, []);
    assert.ok(!projection.gaps.some(g => g.code === 'incomplete_material'));
    sidecar.bindings[0].artifact_id = 'a-draft';
    assert.equal(projectArtifactVersions(b, sidecar).ok, false, 'Receipt must never claim an artifact state');
    receipt.material.content = '';
    assert.equal(validateSessionEvidence(receipt).ok, false, 'metadata_only must not carry content');
    delete receipt.material.content; receipt.acknowledgment = 'invented';
    assert.equal(validateSessionEvidence(receipt).ok, false);
  }
  for (const stage of ['source_selected', 'mutation_requested', 'artifact_observed', 'gap']) {
    const missing = record(1, stage); missing.material = { completeness: 'metadata_only', redactions: [], gaps: [] };
    assert.equal(validateSessionEvidence(missing).ok, false, stage);
  }
  const receipt = record(1, 'mutation_acknowledged');
  receipt.material = { completeness: 'metadata_only', redactions: [], gaps: ['Actual receipt details omitted.'] };
  const { b, sidecar } = fixture([receipt]);
  assert.ok(projectArtifactVersions(b, sidecar).gaps.some(g => g.code === 'incomplete_material'));
});

// Same producer/collector shape as the linked run: title request, metadata receipts,
// observed blank paragraph, two fragment requests and exact resulting readbacks.
function receiptSequenceFixture({ initial = '\n' } = {}) {
  const first = 'First section\r\n| Column | Value |\r\n| --- | --- |\r\n| A | <script>inert</script> |\r\n\n';
  const later = `${first}Later section\nA second captured paragraph.\n`;
  const values = [record(1, 'mutation_requested', 'New document title'), record(2, 'mutation_acknowledged'),
    record(3, 'artifact_observed', initial), record(4, 'source_selected', 'Chosen first source'),
    record(5, 'mutation_requested', first), record(6, 'mutation_acknowledged'), record(7, 'artifact_observed', first),
    record(8, 'source_selected', 'Chosen later source'), record(9, 'mutation_requested', later.slice(first.length)),
    record(10, 'mutation_acknowledged'), record(11, 'artifact_observed', later)];
  const groups = [[0, 1, 2], [3], [4, 5, 6], [7], [8, 9, 10]];
  groups.forEach((indices, group) => indices.forEach(index => { values[index].operation_id = `operation-${group}`; }));
  values.filter(v => v.stage === 'mutation_acknowledged').forEach(v => {
    v.material = { completeness: 'metadata_only', redactions: [], gaps: [] };
  });
  const result = fixture(values), old = result.b.occurrences;
  result.b.occurrences = [old[0], ...groups.map(indices => {
    const occurrences = indices.map(index => old[index + 1]);
    const occurrence = { ...occurrences[0], evidence_refs: occurrences.flatMap(e => e.evidence_refs),
      artifact_refs: indices.some(index => values[index].stage === 'artifact_observed') ? occurrences[0].artifact_refs : [],
      time: { earliest: occurrences[0].time.earliest, latest: occurrences.at(-1).time.latest } };
    indices.forEach(index => {
      result.sidecar.bindings[index].occurrence_id = occurrence.id;
      if (values[index].stage !== 'artifact_observed') delete result.sidecar.bindings[index].artifact_id;
    });
    return occurrence;
  }), old.at(-1)];
  result.b.artifacts[0].media_type = 'text/markdown';
  rebind(result.b, result.sidecar);
  return { ...result, first, later };
}

test('all receipts and initial request survive normal collect/assemble/finalize/render with exact blank and successive diff baselines', async () => {
  const { b, sidecar, events, first, later } = receiptSequenceFixture();
  const originals = [JSON.stringify(b), JSON.stringify(sidecar), JSON.stringify(events)];
  const dir = await mkdtemp(join(tmpdir(), 'receipt-diff-cli-'));
  try {
    const paths = Object.fromEntries(['events', 'report', 'bundle', 'sidecar', 'draft', 'candidate', 'final'].map(key => [key, join(dir, `${key}.json`)]));
    await writeFile(paths.events, JSON.stringify({ session_id: 'session-1', items: events }), { flag: 'wx', mode: 0o600 });
    assert.equal((await inspect('session-evidence', paths.events, paths.report, captured_at)).ok, true);
    const report = JSON.parse(await readFile(paths.report));
    assert.equal(report.evidence.length, 11); assert.deepEqual(report.gaps, []);
    assert.ok(report.evidence.every(e => events.some(event => event.id === e.content.event.id && event.content.message === e.content.event.content.message)));
    for (const [key, value] of [['bundle', b], ['sidecar', sidecar], ['draft', draftFor(b)]]) {
      await writeFile(paths[key], JSON.stringify(value), { flag: 'wx', mode: 0o600 });
    }
    assert.equal((await inspect('assemble', paths.bundle, paths.draft, paths.candidate, paths.sidecar)).ok, true);
    assert.equal((await inspect('finalize', paths.candidate, paths.final, '-', '-')).ok, true);
    const doc = JSON.parse(await readFile(paths.final));
    assert.deepEqual(doc.source_bundle, b); assert.deepEqual(doc.artifact_version_source, sidecar);
    assert.deepEqual(doc.artifacts.map(a => [a.before, a.after]), [[undefined, '\n'], ['\n', first], [first, later]]);
    assert.ok(!doc.coverage.gaps.some(g => /missing records|omits or redacts/.test(g.description)));
    const firstRows = contentDiff(doc.artifacts[1].before, doc.artifacts[1].after);
    assert.equal(firstRows.filter(r => r.kind === 'removed').length, 0);
    assert.equal(firstRows.filter(r => r.kind === 'added').map(r => r.text).join(''), first.slice(0, -1));
    const laterRows = contentDiff(doc.artifacts[2].before, doc.artifacts[2].after);
    assert.equal(laterRows.filter(r => r.kind === 'context').map(r => r.text).join(''), first);
    assert.equal(laterRows.filter(r => r.kind === 'added').map(r => r.text).join(''), later.slice(first.length));
    for (const [before, after] of doc.artifacts.slice(1).map(a => [a.before, a.after])) {
      const rows = contentDiff(before, after);
      assert.equal(rows.filter(r => r.kind !== 'added').map(r => r.text).join(''), before);
      assert.equal(rows.filter(r => r.kind !== 'removed').map(r => r.text).join(''), after);
    }
    const output = join(dir, 'retained-shape.html');
    assert.equal((await renderFile(paths.final, output)).ok, true);
    const html = await readFile(output, 'utf8');
    assert.equal((html.match(/aria-label="Content changes"/g) ?? []).length, 2);
    assert.match(html, /<ins class="diff-text">/); assert.match(html, /&lt;script&gt;inert&lt;\/script&gt;/);
    assert.equal((await renderFile(paths.final, output)).ok, false);
    assert.equal(await readFile(output, 'utf8'), html);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    assert.equal(await readFile(paths.bundle, 'utf8'), originals[0]);
    assert.equal(await readFile(paths.sidecar, 'utf8'), originals[1]);
  } finally { await rm(dir, { recursive: true }); }
  assert.deepEqual([JSON.stringify(b), JSON.stringify(sidecar), JSON.stringify(events)], originals);
});

test('receipt continuity never fills absent baseline or missing receipt', () => {
  for (const initial of ['', '\n']) {
    const { b, sidecar, first } = receiptSequenceFixture({ initial });
    let projected = projectArtifactVersions(b, sidecar);
    assert.equal(projected.ok, true); assert.equal(projected.artifacts[1].before, initial);
    // Omitting BOTH the bundle record and binding must still leave a sequence gap.
    b.evidence = b.evidence.filter(e => e.id !== 'log:event-6');
    sidecar.bindings = sidecar.bindings.filter(v => v.evidence_id !== 'log:event-6');
    rebind(b, sidecar); projected = projectArtifactVersions(b, sidecar);
    assert.equal(projected.ok, true); assert.equal(Object.hasOwn(projected.artifacts[1], 'before'), false);
    assert.equal(projected.artifacts[2].before, first, 'Later continuity restarts from the actual first readback');
  }
  const { b, sidecar } = receiptSequenceFixture();
  const observed = b.evidence.find(e => e.id === 'log:event-3').content.event;
  const missing = JSON.parse(observed.content.message);
  missing.material = { completeness: 'metadata_only', redactions: [], gaps: ['Initial stored state was not available.'] };
  observed.content.message = encodeSessionEvidence(missing); rebind(b, sidecar);
  const projected = projectArtifactVersions(b, sidecar);
  assert.equal(projected.ok, true); assert.equal(projected.artifacts.length, 2);
  assert.equal(Object.hasOwn(projected.artifacts[0], 'before'), false, 'Creation never implies empty state');
  assert.match(projected.artifacts[0].redactions.join(' '), /observed source content/);
});

test('unresolved pre-creation target preserves exact request as a gap, never aliases a source or supplies a baseline', () => {
  const { b, sidecar, first, later } = receiptSequenceFixture();
  const requestEvent = b.evidence.find(e => e.id === 'log:event-1').content.event;
  const request = JSON.parse(requestEvent.content.message);
  request.source = { system: request.source.system, record_id: 'new-document' };
  requestEvent.content.message = encodeSessionEvidence(request); rebind(b, sidecar);
  assert.equal(projectArtifactVersions(b, sidecar).ok, false, 'Default target checks must reject the placeholder');
  sidecar.bindings[0].unresolved_target = true;
  const original = JSON.stringify(b), sources = JSON.stringify(sidecar);
  const projection = projectArtifactVersions(b, sidecar);
  assert.equal(projection.ok, true, JSON.stringify(projection.errors));
  assert.deepEqual(projection.gaps.map(g => g.code), ['unresolved_target', 'required_evidence_missing']);
  assert.deepEqual(projection.artifacts.map(a => [a.before, a.after]), [[undefined, '\n'], ['\n', first], [first, later]]);
  const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(result.ok, true, JSON.stringify(result.errors)); assert.equal(renderHtml(result.snapshot).ok, true);
  assert.equal(JSON.stringify(b), original); assert.equal(JSON.stringify(sidecar), sources);
  for (const mutate of [
    s => { s.bindings[0].artifact_id = 'a-draft'; }, s => { s.bindings[0].unresolved_target = false; },
    s => { s.bindings[1].unresolved_target = true; }, s => { s.bindings[2].unresolved_target = true; delete s.bindings[2].artifact_id; },
    s => { s.bindings[4].unresolved_target = true; },
  ]) {
    const changed = structuredClone(sidecar); mutate(changed);
    assert.equal(projectArtifactVersions(b, changed).ok, false, mutate.toString());
  }
  // An unresolved request AFTER a material capture breaks continuity too.
  const middleEvent = b.evidence.find(e => e.id === 'log:event-5').content.event;
  const middle = JSON.parse(middleEvent.content.message); middle.source = request.source;
  middleEvent.content.message = encodeSessionEvidence(middle); sidecar.bindings[4].unresolved_target = true;
  rebind(b, sidecar);
  const broken = projectArtifactVersions(b, sidecar);
  assert.equal(broken.ok, true); assert.equal(Object.hasOwn(broken.artifacts[1], 'before'), false);
  assert.equal(broken.artifacts[2].before, first);
});

test('postrun malformed/truncated/session-mismatched logs and finite collection limits remain explicit gaps', () => {
  const truncated = envelope(record()); truncated.content.message = '{"type":"scenario_evidence",';
  const wrong = envelope({ ...record(), session_id: 'other-session' }, 2);
  const result = collectSessionEvidence({ session_id: 'session-1', items: [truncated, wrong] }, { captured_at });
  assert.equal(result.ok, true); assert.equal(result.evidence.length, 0);
  assert.deepEqual(result.gaps.map(g => g.code), ['unparseable_marked_log', 'invalid_marked_log']);
  const events = Array.from({ length: MAX_SESSION_EVIDENCE_RECORDS + 1 }, (_, i) => envelope(record(), i + 1));
  const bounded = collectSessionEvidence({ session_id: 'session-1', items: events }, { captured_at });
  assert.equal(bounded.evidence.length, MAX_SESSION_EVIDENCE_RECORDS);
  assert.equal(bounded.gaps.at(-1).code, 'session_evidence_limit');
});

test('normal 1.10 assembly renders exact first/later material and diff with no review approval or blank baseline', () => {
  const { b, sidecar } = fixture(), original = JSON.stringify(b);
  const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const doc = result.snapshot;
  assert.equal(doc.schema_version, '1.10'); assert.equal(doc.artifacts[0].after, 'First exact state\n');
  assert.equal(Object.hasOwn(doc.artifacts[0], 'before'), false);
  assert.equal(doc.artifacts[1].before, doc.artifacts[0].after);
  assert.equal(doc.artifacts[1].after, 'First exact state\nLater material\n');
  assert.match(doc.artifacts[1].redactions.join(' '), /Application-reported observed source content/);
  doc.review = { bogus: 'not approval' }; doc.copy_review = { bogus: 'not approval' };
  assert.equal(prepareRenderSnapshot(doc).ok, true);
  const rendered = renderHtml(doc); assert.equal(rendered.ok, true);
  assert.match(rendered.html, /aria-label="Content changes"/);
  assert.match(rendered.html, /Review prompt/); assert.match(rendered.html, /Content-Security-Policy/);
  assert.doesNotMatch(rendered.html, /bogus|not approval/);
  assert.equal(JSON.stringify(b), original);
  doc.artifacts[0].after = 'Invented'; assert.equal(validateCandidate(doc).ok, false);
});

test('source selections, requested payloads, accepted responses and observed storage do not collapse', () => {
  const selected = record(1, 'source_selected', 'Actual chosen source\n');
  const request = record(2, 'mutation_requested', 'Requested body\n');
  const ack = record(3, 'mutation_acknowledged', { ok: true });
  const observed = record(4, 'artifact_observed', 'Actual stored content differs\n');
  const { b, sidecar } = fixture([selected, request, ack, observed]);
  const projection = projectArtifactVersions(b, sidecar);
  assert.equal(projection.ok, true, JSON.stringify(projection.errors)); assert.equal(projection.artifacts.length, 3);
  assert.match(projection.artifacts[0].redactions.join(' '), /selected source content; not a mutation/);
  assert.match(projection.artifacts[1].redactions.join(' '), /Requested content only/);
  assert.equal(projection.artifacts[2].after, observed.material.content);
  assert.equal(projection.artifacts[2].before, undefined);
  sidecar.bindings[2].artifact_id = 'a-draft';
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});

test('redacted/truncated/missing material removes misleading final attachment and never supplies a full diff', () => {
  for (const completeness of ['excerpt', 'metadata_only']) {
    const first = record(); first.material = { completeness, redactions: ['Private section omitted.'], gaps: ['Full content unavailable.'], ...(completeness === 'excerpt' ? { content: 'Partial' } : {}) };
    const { b, sidecar } = fixture([first, record(2)]);
    const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.deepEqual(result.snapshot.timeline.find(e => e.id === 'draft-1').artifact_refs, []);
    assert.equal(result.snapshot.artifacts.length, 1); assert.equal(result.snapshot.artifacts[0].before, undefined);
    assert.ok(result.snapshot.coverage.gaps.some(g => /omits or redacts/.test(g.description)));
    assert.ok(sourceLimitations(result.snapshot, result.snapshot.timeline.find(e => e.id === 'draft-1')).some(note => /omits or redacts/.test(note)));
    assert.equal(renderHtml(result.snapshot).ok, true);
  }
  const { b, sidecar } = fixture([record(), record(3)]);
  const projection = projectArtifactVersions(b, sidecar);
  assert.equal(projection.ok, true); assert.equal(projection.artifacts[1].before, undefined);
  assert.ok(projection.gaps.some(g => g.code === 'sequence_gap'));
});

test('spoofed or unrelated event/emitter/session/target/time/order/content bindings are rejected', () => {
  const cases = [
    (b, s) => { s.session_id = 'wrong'; }, (b, s) => { s.streams[0].agent_id = 'wrong'; },
    (b, s) => { s.streams[0].agent_version_id = 'wrong'; }, (b, s) => { s.streams[0].parent_task_id = 'wrong'; },
    (b, s) => { s.bindings[0].occurrence_id = 'edit-1'; }, (b, s) => { s.bindings[0].artifact_id = 'wrong'; },
    (b, s) => { s.bindings.reverse(); }, (b, s) => { s.bindings.pop(); },
    (b, s) => { s.bindings.push(structuredClone(s.bindings[0])); },
    b => { b.occurrences[1].world_effect.target = 'unrelated'; },
    b => { b.evidence.find(e => e.id === 'log:event-1').source.record_id = 'unrelated'; },
    b => { b.evidence.find(e => e.id === 'log:event-1').content.event.task.parent_task.agent.id = 'unrelated'; },
    b => { b.occurrences[1].time = { at: '2026-01-01T12:00:00Z' }; },
    b => { b.artifacts[0].source_url = 'https://example.test/other'; },
    b => { const e = b.evidence.find(e => e.id === 'log:event-2').content.event; const r = JSON.parse(e.content.message); r.sequence = 1; e.content.message = encodeSessionEvidence(r); },
    b => { const e = b.evidence.find(e => e.id === 'log:event-2').content.event; e.id = 'event-1'; },
  ];
  for (const mutate of cases) {
    const { b, sidecar } = fixture(); mutate(b, sidecar); rebind(b, sidecar);
    assert.equal(projectArtifactVersions(b, sidecar).ok, false, mutate.toString());
  }
  const { b, sidecar } = fixture(); sidecar.bundle_digest = 'stale';
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});

test('one operation cannot borrow another source and a missing middle record cannot bridge later versions', () => {
  const values = [record(), record(3, 'mutation_acknowledged', { ok: true }), record(4)];
  const { b, sidecar } = fixture(values), projection = projectArtifactVersions(b, sidecar);
  assert.equal(projection.ok, true); assert.equal(projection.artifacts[1].before, undefined);
  const source = b.evidence.find(e => e.id === 'log:event-2').content.event;
  const changed = JSON.parse(source.content.message); changed.operation_id = 'write-1'; changed.source.record_id = 'other';
  source.content.message = encodeSessionEvidence(changed); b.occurrences[2].world_effect.target = 'other'; rebind(b, sidecar);
  assert.equal(projectArtifactVersions(b, sidecar).ok, false);
});

test('build-time coverage checklist detects missing final/entire-source content beyond sequence checks', () => {
  const { b, sidecar } = fixture([record()]);
  sidecar.requirements[0].min_records = 2;
  sidecar.requirements.push({ source: { system: 'Another service', record_id: 'selected-source' }, stage: 'source_selected', min_records: 1, material_required: true });
  const projected = projectArtifactVersions(b, sidecar);
  assert.equal(projected.ok, true); assert.equal(projected.gaps.filter(g => g.code === 'required_evidence_missing').length, 2);
  const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(result.ok, true, JSON.stringify(result.errors)); assert.equal(renderHtml(result.snapshot).ok, true);
  assert.ok(result.snapshot.coverage.gaps.some(g => /checklist/.test(g.description)));
  assert.equal(assessSessionEvidenceCoverage([], [{ command: 'execute source text' }]).ok, false);
});

test('explicit missing-state gap suppresses a misleading final attachment and source timestamps require timezones', () => {
  const gap = record(1, 'gap'); gap.material = { completeness: 'metadata_only', redactions: [], gaps: ['State could not be captured.'] };
  const { b, sidecar, events } = fixture([gap]); sidecar.bindings[0].artifact_id = 'a-draft';
  const projected = projectArtifactVersions(b, sidecar);
  assert.equal(projected.ok, true); assert.deepEqual(projected.artifacts, []);
  assert.deepEqual(projected.occurrences.find(e => e.id === 'draft-1').artifact_refs, []);
  events[0].created_at = '2026-01-01';
  const collected = collectSessionEvidence({ session_id: 'session-1', items: events }, { captured_at });
  assert.equal(collected.evidence.length, 0); assert.equal(collected.gaps[0].code, 'invalid_marked_log');
});

test('known missing material invalidates same-artifact source baselines across stages without changing source bytes', () => {
  const cases = ['artifact_observed', 'mutation_requested', 'source_selected'].flatMap(capturedStage =>
    [['gap', 'metadata_only'], ['mutation_requested', 'metadata_only'], ['mutation_requested', 'excerpt'], ['source_selected', 'excerpt']]
      .map(([stage, completeness]) => [capturedStage, stage, completeness]));
  for (const [capturedStage, stage, completeness] of cases) {
    const middle = record(2, stage);
    middle.material = { completeness, redactions: completeness === 'excerpt' ? ['Private material omitted.'] : [],
      gaps: ['A meaningful material state was not retained.'], ...(completeness === 'excerpt' ? { content: 'Partial material only' } : {}) };
    const { b, sidecar } = fixture([record(1, capturedStage), middle, record(3, capturedStage, 'Later exact state\n')]);
    sidecar.bindings[1].artifact_id = 'a-draft';
    const original = JSON.stringify(b), sources = JSON.stringify(sidecar);
    const projected = projectArtifactVersions(b, sidecar);
    assert.equal(projected.ok, true, JSON.stringify(projected.errors));
    assert.equal(projected.artifacts.length, 2);
    assert.deepEqual(projected.occurrences.find(e => e.id === 'edit-1').artifact_refs, []);
    assert.equal(projected.artifacts[0].after, 'First exact state\n');
    assert.equal(projected.artifacts[1].after, 'Later exact state\n');
    assert.equal(Object.hasOwn(projected.artifacts[1], 'before'), false, `${stage}/${completeness} must invalidate the earlier observed baseline`);
    assert.match(projected.artifacts[1].redactions.join(' '), capturedStage === 'artifact_observed' ? /not independent verification/ : capturedStage === 'mutation_requested' ? /Requested content only/ : /selected source content/);
    const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(validateCandidate(result.snapshot).ok, true);
    assert.deepEqual(result.snapshot.timeline.find(e => e.id === 'edit-1').artifact_refs, []);
    assert.equal(Object.hasOwn(result.snapshot.artifacts[1], 'before'), false);
    const html = renderHtml(result.snapshot);
    assert.equal(html.ok, true); assert.doesNotMatch(html.html, /aria-label="Content changes"/);
    assert.equal(JSON.stringify(b), original); assert.equal(JSON.stringify(sidecar), sources);
    assert.equal(JSON.stringify(result.snapshot.source_bundle), original);
  }
});

test('missing material for an unrelated source does not invalidate another artifact baseline', () => {
  const middle = record(2, 'gap');
  middle.source = { system: 'Sandbox Mail', record_id: 'other-draft', url: 'https://example.test/drafts/other' };
  middle.material = { completeness: 'metadata_only', redactions: [], gaps: ['Unrelated draft state missing.'] };
  const { b, sidecar } = fixture([record(), middle, record(3, 'artifact_observed', 'Later exact state\n')]);
  b.occurrences[2].world_effect.target = 'other-draft'; b.occurrences[2].artifact_refs = ['a-other'];
  b.evidence.push({ ...structuredClone(b.evidence.find(e => e.id === 'e-draft')), id: 'e-other', source: { ...middle.source } });
  b.artifacts.push({ ...structuredClone(b.artifacts[0]), id: 'a-other', source_url: middle.source.url, evidence_refs: ['e-other'] });
  sidecar.bindings[1].artifact_id = 'a-other'; rebind(b, sidecar);
  const original = JSON.stringify(b), sources = JSON.stringify(sidecar), projected = projectArtifactVersions(b, sidecar);
  assert.equal(projected.ok, true, JSON.stringify(projected.errors));
  assert.deepEqual(projected.occurrences.find(e => e.id === 'edit-1').artifact_refs, []);
  assert.equal(projected.artifacts[1].before, 'First exact state\n');
  assert.equal(projected.artifacts[1].after, 'Later exact state\n');
  const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
  assert.equal(result.ok, true, JSON.stringify(result.errors)); assert.equal(renderHtml(result.snapshot).ok, true);
  assert.equal(JSON.stringify(b), original); assert.equal(JSON.stringify(sidecar), sources);
});

test('missing material in another stream leaves the same source baseline isolated', () => {
  const middle = record(2, 'gap'); middle.stream_id = 'other-stream'; middle.sequence = 1;
  middle.material = { completeness: 'metadata_only', redactions: [], gaps: ['Other stream state missing.'] };
  const last = record(3, 'artifact_observed', 'Later exact state\n'); last.sequence = 2;
  const { b, sidecar } = fixture([record(), middle, last]);
  sidecar.streams.push({ ...sidecar.streams[0], stream_id: middle.stream_id });
  sidecar.bindings[1].artifact_id = 'a-draft';
  const original = JSON.stringify(b), sources = JSON.stringify(sidecar), projected = projectArtifactVersions(b, sidecar);
  assert.equal(projected.ok, true, JSON.stringify(projected.errors));
  assert.deepEqual(projected.occurrences.find(e => e.id === 'edit-1').artifact_refs, []);
  assert.equal(projected.artifacts[1].before, 'First exact state\n');
  assert.equal(projected.artifacts[1].after, 'Later exact state\n');
  assert.equal(JSON.stringify(b), original); assert.equal(JSON.stringify(sidecar), sources);
});

test('captured empty text and structured JSON keep exact source data and use normal inert rendering', () => {
  for (const content of ['', { status: 'draft', text: '<script>not executable</script>' }]) {
    const { b, sidecar } = fixture([record(1, 'artifact_observed', content), record(2, 'artifact_observed', 'Later\n')]);
    const projected = projectArtifactVersions(b, sidecar);
    assert.equal(projected.ok, true);
    assert.equal(projected.artifacts[0].after, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    assert.equal(projected.artifacts[0].before, undefined);
    const result = assembleCandidate(b, draftFor(b), { artifactVersionSource: sidecar });
    assert.equal(result.ok, true, JSON.stringify(result.errors)); assert.equal(renderHtml(result.snapshot).ok, true);
  }
});

test('session-evidence CLI produces private new-file reports and never overwrites source or output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'session-evidence-cli-'));
  try {
    const input = join(dir, 'events.json'), output = join(dir, 'evidence.json');
    const source = JSON.stringify({ session_id: 'session-1', items: [envelope(record())] });
    await writeFile(input, source, { flag: 'wx', mode: 0o600 });
    assert.equal((await inspect('session-evidence', input, output, captured_at)).ok, true);
    const report = await readFile(output, 'utf8'); assert.equal(JSON.parse(report).evidence.length, 1);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    assert.equal((await inspect('session-evidence', input, output, captured_at)).ok, false);
    assert.equal(await readFile(output, 'utf8'), report); assert.equal(await readFile(input, 'utf8'), source);
  } finally { await rm(dir, { recursive: true }); }
});

const retained = '/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode/live-capture-fork-yiyfruu3/live-capture-Sjq57B/collected-events.json';
test('retained real console persistence shape is recognized but ordinary nested debugging is not evidence', { skip: !existsSync(retained) }, () => {
  const original = readFileSync(retained), session = JSON.parse(original);
  const event = session.items.find(e => e.id === '01a1e094-184d-431e-0000-e53a4b443fa5');
  assert.equal(event.type, 'runtime_start'); assert.equal(event.task.tool_name, 'console_log');
  assert.equal(typeof event.content.message, 'string'); assert.equal(event.content.level, 'info');
  const done = session.items.find(e => e.type === 'runtime_done' && e.task.id === event.task.id);
  assert.deepEqual(done.content, { result: 'ok' });
  const result = collectSessionEvidence(session, { captured_at: '2026-11-15T23:00:00Z' });
  assert.equal(result.ok, true); assert.equal(result.evidence.length, 0);
  assert.deepEqual(readFileSync(retained), original);
});
