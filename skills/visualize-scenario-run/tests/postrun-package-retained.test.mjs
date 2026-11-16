// Optional READ-ONLY historical regression, not a new native/model/application run.
// The fixture manifest below is newly declared collector context. It does not
// rewrite old logs, assertions, bundles, reviews or installed application files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, mkdtemp, writeFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { packagePostrun, packagePostrunFile } from '../scripts/postrun-package.mjs';
import { consoleEvidenceEnvelope } from '../scripts/session-evidence.mjs';
import { projectArtifactVersions } from '../scripts/artifact-versions.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { postrunDraft } from './postrun-package-fixtures.test.mjs';

const retained = '/private/tmp/claude-501/-private-var-folders-jb-h186fcqx3wx5hkym0wtct3000000gn-T-opencode-claude-plugin-smoke-gu87lbe--workspace/7e163dd8-e5f2-46d6-aba6-6ded349906fc/scratchpad/review';
const names = ['console-events.json', 'TARGET.json', 'bundle.json', 'version-sources.json'];
test('retained historical logs package all nine exact records without inferred intermediate states or source aliases', {
  skip: !names.every(name => existsSync(join(retained, name))),
}, async () => {
  const bytes = await Promise.all(names.map(name => readFile(join(retained, name))));
  const [session, identity, old, oldProjection] = bytes.map(buffer => JSON.parse(buffer));
  assert.equal(session.session_id, identity.session_ids[0]);
  assert.equal(old.run.id, identity.run_id); assert.equal(old.run.workspace_id, identity.workspace_id);
  const records = session.items.map(event => ({ event, record: JSON.parse(event.content.message) })).sort((a, b) => a.record.sequence - b.record.sequence);
  // Context is explicitly copied from retained metadata, not from final artifact
  // content, stale historical conclusions, old narrative or old review judgments.
  const context = {
    schema_version: '1.0', bundle_id: 'retained-postrun-regression', workflow: structuredClone(old.workflow), scenario: structuredClone(old.scenario),
    run: structuredClone(old.run), actors: structuredClone(old.actors), sessions: structuredClone(old.sessions),
    evidence: structuredClone(old.evidence), occurrences: [], artifacts: [],
    coverage: { observation_window: structuredClone(old.coverage.observation_window), data_origin: old.coverage.data_origin, gaps: [] },
    presentation: structuredClone(old.presentation),
  };
  const targets = [], operations = [];
  for (const operation_id of [...new Set(records.map(item => item.record.operation_id))]) {
    const group = records.filter(item => item.record.operation_id === operation_id);
    // Explicit regression declaration: this group's resolved-source records are
    // pinned to their exact logged source. The different creation-request source
    // is separately unresolved, never declared equivalent to the assigned ID.
    const resolved = group.find(item => item.record.stage !== 'mutation_requested') ?? group[0];
    let target = targets.find(item => JSON.stringify(item.source) === JSON.stringify(resolved.record.source));
    if (!target) {
      target = { id: `retained-target-${targets.length + 1}`, source: structuredClone(resolved.record.source), kind: 'record',
        title: resolved.record.source.record_id, media_type: 'text/plain', evidence_refs: [`log:${resolved.event.id}`] };
      targets.push(target);
    }
    const stages = [...new Set(group.map(item => item.record.stage))];
    if (stages.includes('mutation_requested')) for (const expected of ['mutation_acknowledged', 'artifact_observed']) if (!stages.includes(expected)) stages.push(expected);
    const unresolved = group.find(item => item.record.stage === 'mutation_requested' && JSON.stringify(item.record.source) !== JSON.stringify(target.source));
    operations.push({ stream_id: group[0].record.stream_id, operation_id, target_id: target.id,
      requirements: stages.map(stage => ({ stage, min_records: 1, material_required: stage !== 'mutation_acknowledged' })),
      workflow_relevance: { explanation: 'Regression collector supplied relevance to the retained workflow; not an independent source judgment.', basis: 'user_supplied', evidence_refs: ['e-session'] },
      ...(unresolved ? { unresolved_request_source: structuredClone(unresolved.record.source) } : {}) });
  }
  const input = { schema_version: '1.0', captured_at: old.evidence[0].captured_at, session,
    context, streams: structuredClone(oldProjection.streams), targets, operations };
  const result = packagePostrun(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.authoring.occurrence_codes.length, 9);
  assert.deepEqual(result.authoring.collection_gaps, []);
  assert.equal(result.artifactVersionSource.bindings.filter(binding => binding.unresolved_target).length, 1);
  assert.equal(result.authoring.projection_gaps.filter(gap => gap.code === 'required_evidence_missing').length, 3, 'The separate final readback cannot satisfy three missing per-mutation readbacks');
  for (const { event } of records) {
    const preserved = result.bundle.evidence.find(e => e.id === `log:${event.id}`).content.event;
    assert.equal(preserved.content.message, event.content.message); assert.deepEqual(preserved, consoleEvidenceEnvelope(event));
  }
  const projection = projectArtifactVersions(result.bundle, result.artifactVersionSource);
  assert.equal(projection.ok, true);
  const observed = projection.artifacts.filter(artifact => /observed source content/.test(artifact.redactions.join(' ')));
  assert.equal(observed.length, 1); assert.equal(Object.hasOwn(observed[0], 'before'), false, 'Requested fragments cannot supply an observed stored baseline');
  const assembled = assembleCandidate(result.bundle, postrunDraft(result), { artifactVersionSource: result.artifactVersionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(renderHtml(assembled.snapshot).ok, true);

  const base = '/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode';
  const dir = await mkdtemp(join(existsSync(base) ? base : tmpdir(), 'postrun-retained-test-'));
  try {
    const inputPath = join(dir, 'new-input.json'), bundlePath = join(dir, 'new-bundle.json'), projectionPath = join(dir, 'new-projection.json');
    await writeFile(inputPath, JSON.stringify(input), { mode: 0o600, flag: 'wx' });
    assert.equal((await packagePostrunFile(inputPath, bundlePath, projectionPath)).ok, true);
    assert.equal((await stat(bundlePath)).mode & 0o777, 0o600); assert.equal((await stat(projectionPath)).mode & 0o777, 0o600);
  } finally { await rm(dir, { recursive: true }); }
  const after = await Promise.all(names.map(name => readFile(join(retained, name))));
  after.forEach((buffer, i) => assert.deepEqual(buffer, bytes[i]));
});
