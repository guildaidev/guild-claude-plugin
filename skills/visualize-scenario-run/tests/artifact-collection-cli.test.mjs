import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect } from '../scripts/inspect.mjs';
import { artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';
import { bundle, sourceBoundCandidate, observedAt } from './fixtures.mjs';

test('CLI consumes an optional collector sidecar without changing original bundle or inventing source prose', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-collector-cli-'));
  try {
    const b = bundle();
    const occurrence = b.occurrences[1];
    b.evidence.push({ id: 'material-capture', kind: 'tool_result',
      source: { system: 'Fixture capture' }, captured_at: observedAt,
      content: { text: 'Captured material content.\n' }, completeness: 'excerpt',
      redactions: ['A captured operation is not independent readback.'] });
    occurrence.evidence_refs.push('material-capture');
    const doc = sourceBoundCandidate(b);
    const draft = { schema_version: '1.3', snapshot_id: doc.snapshot_id,
      editor_id: doc.editor_id, parent_agent_id: doc.parent_agent_id,
      summary: doc.summary, header_copy: doc.header_copy, claims: doc.claims,
      events: doc.timeline.map(e => ({ occurrence_id: e.id, description: e.description,
        claim_refs: e.claim_refs, supporting_detail: e.supporting_detail })),
      artifact_claims: doc.artifact_claims, omitted_occurrences: doc.omitted_occurrences };
    const sidecar = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(b),
      records: [], versions: [{ id: 'captured', artifact_id: 'a-draft',
        occurrence_id: occurrence.id, operation: 'capture',
        value_ref: { evidence_id: 'material-capture', pointer: '/text' } }] };
    const paths = ['bundle.json', 'draft.json', 'versions.json'].map(name => join(dir, name));
    await Promise.all([b, draft, sidecar].map((value, i) => writeFile(paths[i], JSON.stringify(value), { flag: 'wx', mode: 0o600 })));
    const originals = await Promise.all(paths.map(path => readFile(path)));
    const output = join(dir, 'candidate.json');
    assert.equal((await inspect('assemble', paths[0], paths[1], output, paths[2])).ok, true);
    const result = JSON.parse(await readFile(output, 'utf8'));
    assert.deepEqual(result.source_bundle, b);
    assert.equal(result.artifacts.find(a => a.id === 'version:captured').after, 'Captured material content.\n');
    assert.deepEqual(result.timeline.find(e => e.id === occurrence.id).artifact_refs, ['version:captured']);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    assert.deepEqual(await Promise.all(paths.map(path => readFile(path))), originals);
    assert.equal((await inspect('assemble', paths[0], paths[1], output, paths[2])).ok, false);
    assert.deepEqual(await readFile(output), Buffer.from(JSON.stringify(result, null, 2) + '\n'));
  } finally { await rm(dir, { recursive: true }); }
});

test('build/test path requires supported session evidence, not an armed observer', async () => {
  const development = await readFile(new URL('../../agent-development/SKILL.md', import.meta.url), 'utf8');
  const plan = development.indexOf('Before sending input, verify the built iteration includes its session-evidence');
  assert.ok(plan >= 0 && plan < development.indexOf('2. Send `content`'));
  assert.ok(development.indexOf('build-time evidence') < development.indexOf('For prompt and tools, use'));
  const guide = await readFile(new URL('../references/artifact-capture.md', import.meta.url), 'utf8');
  assert.match(guide, /await task\.console\.info/);
  assert.match(guide, /consoleTools/);
  assert.match(guide, /llmAgent\(\{ tools: \{ \.\.\.consoleTools/);
  assert.match(guide, /Plain `console\.log` is NOT established as session-persisted/);
  assert.match(guide, /observer feature has been removed/);
  assert.match(guide, /no observer command, configuration or supported\s+manual fallback/);
  assert.doesNotMatch(guide, /wait-armed BRIDGE_MANIFEST/);
  assert.match(guide, /cannot lock external concurrent\s+writers/);
  assert.match(guide, /runtime_done is not a payload/);
});
