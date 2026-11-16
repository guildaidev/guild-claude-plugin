// Deterministic timestamp/production-packaging regressions only. No native run,
// model, external read or rewriting of retained source timestamps/material.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bundle } from './fixtures.mjs';
import { postrunFixture, postrunDraft } from './postrun-package-fixtures.test.mjs';
import { packagePostrun } from '../scripts/postrun-package.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { artifactVersionBundleDigest, projectArtifactVersions } from '../scripts/artifact-versions.mjs';
import { compareSourceTimes, sourceTimeBounds, collectSessionEvidence, validateSessionEvidence } from '../scripts/session-evidence.mjs';

const utc = '2026-01-01T12:00:01';
function precisePair(created = [`${utc}.123451Z`, `${utc}.123452Z`], { at = `${utc}.123Z`, through = `${utc}.124Z` } = {}) {
  const b = bundle(), template = structuredClone(b.occurrences[1]);
  const events = created.map((created_at, index) => ({ id: `precision-event-${index + 1}`, type: 'runtime_start', created_at,
    task: { id: `precision-task-${index + 1}`, tool_name: 'console_log', tool_call_id: `console_log-precision-${index + 1}`,
      parent_task: { id: 'precision-parent', agent: { id: 'agent-1' }, version: { id: 'version-7' } } },
    content: { level: 'info', message: JSON.stringify({ schema_version: '1.0', type: 'scenario_evidence',
      session_id: 'session-1', stream_id: 'main', sequence: index + 1, operation_id: `precision-op-${index + 1}`, stage: 'artifact_observed', at,
      source: { system: 'Sandbox Mail', record_id: 'draft-1', url: 'https://example.test/drafts/1' },
      material: { content: index ? 'Later exact content\r\n' : '', completeness: 'complete', redactions: [], gaps: [] } }) } }));
  const collected = collectSessionEvidence({ session_id: 'session-1', items: [...events].reverse() }, { captured_at: '2026-01-01T12:01:00Z' });
  assert.equal(collected.ok, true); assert.deepEqual(collected.gaps, []);
  b.evidence.push(...collected.evidence);
  b.occurrences.splice(1, 1, ...events.map(event => ({ ...structuredClone(template), id: `occ:${event.id}`,
    time: { earliest: at, latest: through }, evidence_refs: [`log:${event.id}`] })));
  const sidecar = { schema_version: '2.0', bundle_digest: artifactVersionBundleDigest(b), records: [], session_id: 'session-1',
    streams: [{ stream_id: 'main', parent_task_id: 'precision-parent', agent_id: 'agent-1', agent_version_id: 'version-7' }],
    bindings: events.map(event => ({ evidence_id: `log:${event.id}`, occurrence_id: `occ:${event.id}`, artifact_id: 'a-draft' })),
    requirements: [{ source: { system: 'Sandbox Mail', record_id: 'draft-1' }, stage: 'artifact_observed', min_records: 2, material_required: true }] };
  return { b, sidecar, events };
}

test('source timestamp comparison preserves all 1–9 fractional digits and actual timezone instants', () => {
  for (let digits = 1; digits <= 9; digits++) {
    const prefix = '1'.repeat(digits - 1);
    assert.equal(compareSourceTimes(`${utc}.${prefix}1Z`, `${utc}.${prefix}2Z`), -1);
    assert.equal(compareSourceTimes(`${utc}.${prefix}2Z`, `${utc}.${prefix}1Z`), 1);
    assert.equal(compareSourceTimes(`${utc}.${prefix}1Z`, `${utc}.${`${prefix}1`.padEnd(9, '0')}+00:00`), 0);
  }
  assert.equal(compareSourceTimes('2026-01-01T17:45:01.123451+05:45', `${utc}.123451Z`), 0);
  assert.equal(compareSourceTimes('2026-01-01T08:30:01.123452-03:30', `${utc}.123451Z`), 1);
  assert.equal(compareSourceTimes('2025-12-31T23:30:01.123451-12:30', `${utc}.123452Z`), -1);
  for (const value of [undefined, '', '2026-01-01', `${utc}.1234567890Z`, `${utc}.123451`, `${utc}.123451+25:00`]) {
    assert.equal(compareSourceTimes(value, `${utc}Z`), undefined);
    assert.equal(sourceTimeBounds(value), undefined);
  }
});

test('millisecond windows contain the exact instant without backdating their upper bound', () => {
  assert.deepEqual(sourceTimeBounds(`${utc}.123451Z`), { earliest: `${utc}.123Z`, latest: `${utc}.124Z` });
  assert.deepEqual(sourceTimeBounds('2026-01-01T17:45:01.123000000+05:45'), { earliest: `${utc}.123Z`, latest: `${utc}.123Z` });
  assert.deepEqual(sourceTimeBounds(`${utc}.999999999Z`), { earliest: `${utc}.999Z`, latest: '2026-01-01T12:00:02.000Z' });
  assert.deepEqual(sourceTimeBounds('2025-12-31T23:59:59.999999999Z'), { earliest: '2025-12-31T23:59:59.999Z', latest: '2026-01-01T00:00:00.000Z' });
  assert.deepEqual(sourceTimeBounds('1969-12-31T23:59:59.999999999Z'), { earliest: '1969-12-31T23:59:59.999Z', latest: '1970-01-01T00:00:00.000Z' });
  assert.deepEqual(sourceTimeBounds('1969-12-31T23:59:59.999000000Z'), { earliest: '1969-12-31T23:59:59.999Z', latest: '1969-12-31T23:59:59.999Z' });
});

test('exact projection accepts genuine submillisecond order while retaining every source byte and empty baseline', () => {
  for (const created of [
    [`${utc}.123451+00:00`, `${utc}.123452Z`],
    [`${utc}.123456781Z`, `${utc}.123456782Z`],
    ['2026-01-01T17:45:01.123451+05:45', '2026-01-01T08:30:01.123452-03:30'],
  ]) {
    const { b, sidecar, events } = precisePair(created);
    const original = JSON.stringify({ b, sidecar, events });
    const result = projectArtifactVersions(b, sidecar);
    assert.equal(result.ok, true, JSON.stringify(result.errors)); assert.deepEqual(result.gaps, []);
    assert.equal(result.artifacts[0].after, '');
    assert.equal(Object.hasOwn(result.artifacts[0], 'before'), false);
    assert.equal(result.artifacts[1].before, ''); assert.equal(result.artifacts[1].after, 'Later exact content\r\n');
    assert.equal(JSON.stringify({ b, sidecar, events }), original);
  }
});

test('equal, backward and truncated timestamps cannot manufacture strict source order', () => {
  for (const created of [
    [`${utc}.123451Z`, `${utc}.123451000+00:00`],
    ['2026-01-01T17:45:01.123451+05:45', `${utc}.123451Z`],
    [`${utc}.123452Z`, `${utc}.123451Z`],
    [`${utc}.123456782Z`, `${utc}.123456781Z`],
    [`${utc}.123Z`, `${utc}.123Z`],
    [`${utc}.123451Z`, `${utc}.123Z`],
  ]) {
    const { b, sidecar } = precisePair(created), original = JSON.stringify({ b, sidecar });
    const result = projectArtifactVersions(b, sidecar);
    assert.equal(result.ok, false); assert.equal(result.errors[0].code, 'sequence_order');
    assert.equal(JSON.stringify({ b, sidecar }), original);
  }
});

test('exact source bounds reject logs beyond a millisecond upper bound instead of truncating or widening it', () => {
  for (const [created, through, expected] of [
    [[`${utc}.123Z`, `${utc}.123000001Z`], `${utc}.123Z`, false],
    [[`${utc}.123Z`, `${utc}.123999999Z`], `${utc}.124Z`, true],
    [[`${utc}.123Z`, `${utc}.124000001Z`], `${utc}.124Z`, false],
  ]) {
    const { b, sidecar } = precisePair(created, { through });
    const original = JSON.stringify({ b, sidecar });
    const result = projectArtifactVersions(b, sidecar);
    assert.equal(result.ok, expected, JSON.stringify(result.errors));
    if (!expected) assert.equal(result.errors[0].code, 'time_binding');
    assert.equal(JSON.stringify({ b, sidecar }), original);
  }
  const { b, sidecar } = precisePair();
  const record = JSON.parse(b.evidence.find(e => e.id === 'log:precision-event-1').content.event.content.message);
  record.at = `${utc}.123451Z`;
  assert.equal(validateSessionEvidence(record).ok, false, 'The record clock contract remains millisecond-only');
});

function packagingPair(created = [`${utc}.123451+00:00`, `${utc}.123452+00:00`]) {
  const input = postrunFixture();
  for (const event of input.session.items) {
    const record = JSON.parse(event.content.message);
    if (record.stream_id !== 'main' || record.sequence > 2) continue;
    record.at = `${utc}.123Z`;
    event.created_at = created[record.sequence - 1];
    event.content.message = JSON.stringify(record);
  }
  return input;
}

test('production postrun packaging accepts the reported precision repro and preserves exact input through normal assembly/render', () => {
  for (const created of [
    [`${utc}.123451+00:00`, `${utc}.123452+00:00`],
    [`${utc}.123456781Z`, `${utc}.123456782Z`],
    ['2026-01-01T17:45:01.123451+05:45', '2026-01-01T08:30:01.123452-03:30'],
  ]) {
    const input = packagingPair(created), original = JSON.stringify(input);
    const collected = collectSessionEvidence(input.session, { captured_at: input.captured_at });
    assert.equal(collected.evidence.length, 8); assert.deepEqual(collected.gaps, []);
    const packaged = packagePostrun(input);
    assert.equal(packaged.ok, true, JSON.stringify(packaged.errors));
    assert.deepEqual(packaged.authoring.collection_gaps, []);
    for (const event of input.session.items) {
      const evidence = packaged.bundle.evidence.find(e => e.id === `log:${event.id}`);
      assert.equal(evidence.content.event.created_at, event.created_at);
      assert.equal(evidence.content.event.content.message, event.content.message);
      const occurrence = packaged.bundle.occurrences.find(o => o.evidence_refs.includes(evidence.id));
      assert.equal(compareSourceTimes(event.created_at, occurrence.time.latest) <= 0, true);
    }
    const assembled = assembleCandidate(packaged.bundle, postrunDraft(packaged), { artifactVersionSource: packaged.artifactVersionSource });
    assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
    assert.equal(renderHtml(assembled.snapshot).ok, true);
    assert.equal(JSON.stringify(input), original);
  }
});

test('production postrun packaging still rejects genuine equal, backward and truncated source order', () => {
  for (const created of [
    [`${utc}.123451Z`, `${utc}.123451000Z`],
    [`${utc}.123452Z`, `${utc}.123451Z`],
    [`${utc}.123Z`, `${utc}.123Z`],
  ]) {
    const input = packagingPair(created), original = JSON.stringify(input);
    const result = packagePostrun(input);
    assert.equal(result.ok, false);
    assert.equal(result.errors[0].code, 'sequence_order');
    assert.equal(JSON.stringify(input), original);
  }
});

test('production packaging does not truncate a log back inside the declared observation or collection window', () => {
  for (const limit of ['observation', 'collection']) {
    const input = postrunFixture();
    const at = limit === 'observation' ? '2026-01-01T12:01:00' : '2026-01-01T12:02:00';
    if (limit === 'collection') input.context.coverage.observation_window.through = `${at}Z`;
    const event = input.session.items.find(e => e.id === 'evt-8');
    const record = JSON.parse(event.content.message);
    record.at = `${at}Z`; event.content.message = JSON.stringify(record);
    event.created_at = `${at}.000000001Z`;
    const original = JSON.stringify(input), result = packagePostrun(input);
    assert.equal(result.ok, false, `${limit} must contain the actual nanosecond timestamp`);
    assert.equal(result.errors[0].code, 'event_scope');
    assert.equal(JSON.stringify(input), original);
  }
});
