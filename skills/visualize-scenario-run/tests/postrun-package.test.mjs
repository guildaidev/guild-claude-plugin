import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm, symlink, access, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { packagePostrun, packagePostrunFile, MAX_POSTRUN_INPUT_BYTES, MAX_POSTRUN_EVENTS } from '../scripts/postrun-package.mjs';
import { projectArtifactVersions, artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { validate, validateCandidate } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { inspect } from '../scripts/inspect.mjs';
import { postrunFixture, postrunDraft } from './postrun-package-fixtures.test.mjs';

test('SCRIPTED postrun metadata + real-shaped logs roundtrip through ordinary production assembly/render', async () => {
  const input = postrunFixture(), original = JSON.stringify(input);
  const result = packagePostrun(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const { bundle: b, artifactVersionSource: s } = result;
  assert.equal(validate(b, 'bundle').ok, true);
  assert.deepEqual(s.requirements.map(r => r.operation_id), ['initial-read', 'choose-row', 'write-reply', 'write-reply', 'write-reply', 'conditional-write', 'conditional-write', 'conditional-write']);
  assert.equal(b.occurrences.length, 8); assert.equal(s.bindings.length, 8);
  assert.ok(b.artifacts.every(a => a.completeness === 'metadata_only' && !Object.hasOwn(a, 'content') && !Object.hasOwn(a, 'before')));
  for (const source of input.session.items) {
    const retained = b.evidence.find(e => e.source.record_id === source.id);
    assert.equal(retained.content.event.content.message, source.content.message);
    assert.equal(retained.content.event.created_at, source.created_at);
    assert.deepEqual(retained.content.event.task, source.task);
    const occurrence = b.occurrences.find(o => o.evidence_refs.includes(retained.id));
    assert.equal(occurrence.time.earliest, JSON.parse(source.content.message).at);
    assert.equal(occurrence.time.latest, JSON.parse(source.content.message).at.replace('Z', '.124Z'));
    assert.equal(occurrence.outcome, 'unknown'); assert.deepEqual(occurrence.relationships, []);
  }
  assert.deepEqual(b.workflow, input.context.workflow); assert.deepEqual(b.scenario, input.context.scenario);
  assert.deepEqual(b.run, input.context.run); assert.deepEqual(b.actors, input.context.actors); assert.deepEqual(b.sessions, input.context.sessions);
  const p = projectArtifactVersions(b, s);
  assert.equal(p.ok, true, JSON.stringify(p.errors)); assert.deepEqual(p.gaps, []);
  assert.equal(p.artifacts.length, 6);
  assert.equal(p.artifacts[0].after, ''); assert.equal(Object.hasOwn(p.artifacts[0], 'before'), false);
  const observed = p.artifacts.find(a => a.id === 'version:evt-7');
  assert.equal(observed.before, ''); assert.equal(observed.after, 'Actual saved body\r\n\n');
  assert.equal(p.artifacts.find(a => a.id === 'version:evt-3').before, undefined, 'A request cannot borrow the observed baseline');
  assert.deepEqual(p.occurrences.filter(e => e.evidence_refs.some(ref => ['log:evt-5', 'log:evt-6'].includes(ref))).map(e => e.artifact_refs), [[], []]);
  assert.ok(result.authoring.required_authored_slots.includes('summary'));
  const assembled = assembleCandidate(b, postrunDraft(result), { artifactVersionSource: s });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(validateCandidate(assembled.snapshot).ok, true);
  assert.deepEqual(assembled.snapshot.source_bundle, b); assert.deepEqual(assembled.snapshot.artifact_version_source, s);
  const tampered = structuredClone(assembled.snapshot); tampered.artifacts.find(a => a.id === 'version:evt-7').after = 'Invented later state';
  assert.equal(validateCandidate(tampered).ok, false);
  const rendered = renderHtml(assembled.snapshot);
  assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
  assert.match(rendered.html, /Content-Security-Policy/); assert.match(rendered.html, /&lt;script&gt;untrusted&lt;\/script&gt;/);
  assert.doesNotMatch(rendered.html, /<script>untrusted<\/script>/);
  assert.equal(JSON.stringify(input), original);
  const reversed = postrunFixture(); reversed.session.items.reverse();
  assert.deepEqual(packagePostrun(reversed), result, 'Newest-first transport order does not change app-sequenced packaging');

  const dir = await mkdtemp(join(tmpdir(), 'postrun-roundtrip-'));
  try {
    const paths = Object.fromEntries(['input', 'bundle', 'source', 'draft', 'candidate'].map(key => [key, join(dir, `${key}.json`)]));
    await writeFile(paths.input, original, { flag: 'wx', mode: 0o600 });
    assert.equal((await packagePostrunFile(paths.input, paths.bundle, paths.source)).ok, true);
    await writeFile(paths.draft, JSON.stringify(postrunDraft(result)), { flag: 'wx', mode: 0o600 });
    assert.equal((await inspect('assemble', paths.bundle, paths.draft, paths.candidate, paths.source)).ok, true);
    assert.equal(validateCandidate(JSON.parse(await readFile(paths.candidate, 'utf8'))).ok, true);
    assert.equal(await readFile(paths.input, 'utf8'), original);
  } finally { await rm(dir, { recursive: true }); }
});

test('SCRIPTED missing operations/final readback, sequence gaps and redactions remain gaps without invented state', () => {
  const input = postrunFixture();
  input.session.items = input.session.items.filter(e => !['evt-5', 'evt-7'].includes(e.id));
  input.operations.push({ ...structuredClone(input.operations[0]), operation_id: 'executed-with-no-log' });
  const result = packagePostrun(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.ok(result.authoring.projection_gaps.filter(g => g.code === 'required_evidence_missing').length >= 3);
  const projected = projectArtifactVersions(result.bundle, result.artifactVersionSource);
  assert.ok(!projected.artifacts.some(a => a.id === 'version:evt-7'));
  assert.ok(!projected.artifacts.some(a => a.after === 'Actual saved body\r\n\n'));
  const assembled = assembleCandidate(result.bundle, postrunDraft(result), { artifactVersionSource: result.artifactVersionSource });
  assert.equal(assembled.ok, true); assert.ok(assembled.snapshot.coverage.gaps.some(g => /checklist/.test(g.description)));
  const redacted = postrunFixture(), event = redacted.session.items.find(e => e.id === 'evt-1');
  const record = JSON.parse(event.content.message);
  record.material = { completeness: 'metadata_only', gaps: ['Actual initial state was not retained.'], redactions: [] };
  event.content.message = JSON.stringify(record);
  const missing = packagePostrun(redacted); assert.equal(missing.ok, true);
  const p = projectArtifactVersions(missing.bundle, missing.artifactVersionSource);
  assert.deepEqual(p.occurrences.find(e => e.id === 'occ:evt-1').artifact_refs, []);
  assert.equal(Object.hasOwn(p.artifacts.find(a => a.id === 'version:evt-7'), 'before'), false);
  assert.equal(p.artifacts.find(a => a.id === 'version:evt-7').after, 'Actual saved body\r\n\n');
});

test('SCRIPTED missing marked logs are explicit collection gaps, not repaired payloads', () => {
  const input = postrunFixture();
  input.session.items.find(e => e.id === 'evt-7').content.message = '{"type":"scenario_evidence",';
  const result = packagePostrun(input); assert.equal(result.ok, true);
  assert.deepEqual(result.authoring.collection_gaps, [{ code: 'unparseable_marked_log', event_id: 'evt-7' }]);
  assert.ok(result.bundle.coverage.gaps.some(g => /unparseable_marked_log/.test(g.description)));
  assert.ok(result.authoring.projection_gaps.some(g => g.code === 'required_evidence_missing'));
  assert.ok(!result.bundle.evidence.some(e => e.id === 'log:evt-7'));
});

test('SCRIPTED metadata references may reuse only exact already-collected evidence, never replace an ID', () => {
  const input = postrunFixture(), first = packagePostrun(input);
  const existing = structuredClone(first.bundle.evidence.find(e => e.id === 'log:evt-7'));
  input.context.evidence.push(existing); input.context.run.source_refs.push(existing.id);
  const merged = packagePostrun(input); assert.equal(merged.ok, true, JSON.stringify(merged.errors));
  assert.equal(merged.bundle.evidence.filter(e => e.id === existing.id).length, 1);
  assert.deepEqual(merged.bundle.evidence.find(e => e.id === existing.id), existing);
  existing.captured_at = '2026-01-01T12:03:00Z';
  const conflicting = packagePostrun(input); assert.equal(conflicting.ok, false); assert.equal(conflicting.errors[0].code, 'evidence_id_collision');
});

test('SCRIPTED same-target streams remain separate; explicit gap records never attach a final fallback', () => {
  const input = postrunFixture();
  input.operations.find(op => op.operation_id === 'conditional-write').target_id = 'mail-artifact';
  for (const event of input.session.items) {
    const record = JSON.parse(event.content.message);
    if (record.stream_id === 'branch') { record.source = structuredClone(input.targets[0].source); event.content.message = JSON.stringify(record); }
  }
  let result = packagePostrun(input); assert.equal(result.ok, true, JSON.stringify(result.errors));
  let projected = projectArtifactVersions(result.bundle, result.artifactVersionSource);
  assert.equal(Object.hasOwn(projected.artifacts.find(a => a.id === 'version:evt-8'), 'before'), false, 'Other stream cannot borrow the empty baseline');
  assert.equal(projected.artifacts.find(a => a.id === 'version:evt-7').before, '');
  const event = input.session.items.find(e => e.id === 'evt-8'), record = JSON.parse(event.content.message);
  record.stage = 'gap'; record.material = { completeness: 'metadata_only', redactions: [], gaps: ['An actual resulting state was not captured.'] };
  event.content.message = JSON.stringify(record);
  const op = input.operations.find(op => op.operation_id === 'conditional-write');
  op.requirements[2] = { stage: 'gap', min_records: 1, material_required: false };
  result = packagePostrun(input); assert.equal(result.ok, true, JSON.stringify(result.errors));
  projected = projectArtifactVersions(result.bundle, result.artifactVersionSource);
  assert.deepEqual(projected.occurrences.find(o => o.id === 'occ:evt-8').artifact_refs, []);
  assert.equal(projected.artifacts.find(a => a.id === 'version:evt-7').before, '', 'Other-stream gap cannot destroy this actual baseline');
  const assembled = assembleCandidate(result.bundle, postrunDraft(result), { artifactVersionSource: result.artifactVersionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(renderHtml(assembled.snapshot).ok, true);
});

test('SCRIPTED creation source changes require an explicit unresolved request pin, never an invented alias', () => {
  const input = postrunFixture();
  const event = input.session.items.find(e => e.id === 'evt-5'), record = JSON.parse(event.content.message);
  record.source.record_id = 'newly-created-id'; event.content.message = JSON.stringify(record);
  const original = JSON.stringify(input);
  const result = packagePostrun(input);
  assert.equal(result.ok, false); assert.equal(result.errors[0].code, 'operation_scope');
  assert.equal(JSON.stringify(input), original, 'Do not rewrite the request or receipt target to repair bindings');
  const explicit = postrunFixture(), request = explicit.session.items.find(e => e.id === 'evt-3'), value = JSON.parse(request.content.message);
  value.source = { system: explicit.targets[0].source.system, record_id: 'unresolved-new-target' };
  request.content.message = JSON.stringify(value);
  explicit.operations.find(op => op.operation_id === 'write-reply').unresolved_request_source = structuredClone(value.source);
  const bytes = request.content.message;
  const packaged = packagePostrun(explicit); assert.equal(packaged.ok, true, JSON.stringify(packaged.errors));
  const binding = packaged.artifactVersionSource.bindings.find(b => b.evidence_id === 'log:evt-3');
  assert.equal(binding.unresolved_target, true); assert.equal(Object.hasOwn(binding, 'artifact_id'), false);
  assert.equal(packaged.bundle.evidence.find(e => e.id === 'log:evt-3').content.event.content.message, bytes);
  assert.equal(Object.hasOwn(packaged.bundle.occurrences.find(o => o.id === 'occ:evt-3').world_effect, 'target'), false);
  assert.ok(packaged.authoring.projection_gaps.some(g => g.code === 'unresolved_target'));
  const p = projectArtifactVersions(packaged.bundle, packaged.artifactVersionSource);
  assert.equal(p.ok, true); assert.ok(!p.artifacts.some(a => a.id === 'version:evt-3'));
  assert.equal(Object.hasOwn(p.artifacts.find(a => a.id === 'version:evt-7'), 'before'), false, 'Unresolved request breaks previous material continuity');
  const assembled = assembleCandidate(packaged.bundle, postrunDraft(packaged), { artifactVersionSource: packaged.artifactVersionSource });
  assert.equal(assembled.ok, true, JSON.stringify(assembled.errors)); assert.equal(renderHtml(assembled.snapshot).ok, true);
});

test('SCRIPTED explicit IDs/spec/checklist and source/session/emitter/time/order pins fail closed', () => {
  const cases = [
    r => { delete r.context.scenario; }, r => { delete r.context.run.application_version; },
    r => { r.context.actors[0].agent_version_id = 'another-version'; }, r => { r.session.session_id = 'another-session'; },
    r => { r.streams[0].parent_task_id = 'another-task'; }, r => { r.streams[0].agent_id = 'mail'; },
    r => { r.streams[0].agent_version_id = 'another-version'; }, r => { r.targets[0].source.record_id = 'another-target'; },
    r => { r.targets[0].source.url = 'https://example.test/unrelated'; }, r => { r.operations.pop(); },
    r => { r.operations[0].requirements = []; }, r => { r.operations[2].requirements.pop(); },
    r => { r.operations[2].requirements = r.operations[2].requirements.slice(0, 1); },
    r => { r.operations[0].workflow_relevance.evidence_refs = ['nonexistent']; }, r => { delete r.operations[0].workflow_relevance; },
    r => { r.operations[3].operation_id = r.operations[0].operation_id; },
    r => { r.context.coverage.observation_window.through = '2026-01-01T12:00:06Z'; },
    r => { delete r.context.coverage.observation_window; }, r => { r.captured_at = '2026-01-01T12:00:06Z'; },
    r => { r.operations[2].requirements[1].material_required = true; }, r => { r.extra = 'untrusted'; },
    r => { r.context.artifacts = [{ id: 'final-artifact' }]; },
    r => { const e = r.session.items.find(e => e.id === 'evt-7'), record = JSON.parse(e.content.message); record.sequence = 2; e.content.message = JSON.stringify(record); },
  ];
  for (const mutate of cases) {
    const request = postrunFixture(); mutate(request);
    assert.equal(packagePostrun(request).ok, false, mutate.toString());
  }
  const result = packagePostrun(postrunFixture());
  const stale = structuredClone(result.artifactVersionSource); stale.bundle_digest = 'stale';
  assert.equal(projectArtifactVersions(result.bundle, stale).ok, false);
  const moved = structuredClone(result.bundle); moved.occurrences[0].world_effect.target = 'unrelated';
  const rebound = { ...result.artifactVersionSource, bundle_digest: artifactVersionBundleDigest(moved) };
  assert.equal(projectArtifactVersions(moved, rebound).ok, false);
});

test('SCRIPTED JSON safety/bounds never invoke getters or echo rejected secrets', () => {
  let invoked = false;
  const dangerous = postrunFixture(); Object.defineProperty(dangerous, 'extra', { enumerable: true, get() { invoked = true; throw new Error('DO_NOT_ECHO'); } });
  assert.equal(packagePostrun(dangerous).ok, false); assert.equal(invoked, false);
  for (const mutate of [
    r => { r.context.evidence[0].content = { api_key: 'DO_NOT_ECHO' }; },
    r => { r.context.evidence[0].content = JSON.parse('{"__proto__":{"polluted":true}}'); },
    r => { r.context.evidence[0].content = NaN; }, r => { r.context.evidence[0].content = r; },
    r => { r.context.evidence[0].content = new Date(); }, r => { r.context.evidence[0].content = new Array(3); },
    r => { r.context.evidence[0].content = 'x'.repeat(MAX_POSTRUN_INPUT_BYTES); },
    r => { r.session.items = Array(MAX_POSTRUN_EVENTS + 1).fill(null); },
  ]) {
    const request = postrunFixture(); mutate(request);
    const result = packagePostrun(request); assert.equal(result.ok, false, mutate.toString());
    assert.doesNotMatch(JSON.stringify(result), /DO_NOT_ECHO/);
  }
  assert.equal({}.polluted, undefined);
  const tooMany = postrunFixture(), event = tooMany.session.items[0];
  tooMany.session.items = Array.from({ length: 257 }, (_, index) => ({ ...structuredClone(event), id: `extra-event-${index}` }));
  const bounded = packagePostrun(tooMany);
  assert.equal(bounded.ok, false); assert.equal(bounded.errors[0].code, 'session_evidence_limit');
});

test('SCRIPTED private CLI/files use wx, do not overwrite sources, and roll back only newly created outputs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'postrun-private-'));
  try {
    const input = join(dir, 'input.json'), b = join(dir, 'bundle.json'), s = join(dir, 'projection.json');
    const original = JSON.stringify(postrunFixture());
    await writeFile(input, original, { flag: 'wx', mode: 0o600 });
    const cli = spawnSync(process.execPath, [new URL('../scripts/postrun-package.mjs', import.meta.url).pathname, input, b, s], { encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stdout); assert.equal(JSON.parse(cli.stdout).ok, true);
    for (const path of [b, s]) assert.equal((await stat(path)).mode & 0o777, 0o600);
    const originals = await Promise.all([input, b, s].map(p => readFile(p, 'utf8')));
    assert.equal((await packagePostrunFile(input, b, s)).ok, false);
    assert.deepEqual(await Promise.all([input, b, s].map(p => readFile(p, 'utf8'))), originals);
    assert.equal((await packagePostrunFile(input, input, join(dir, 'new-source.json'))).ok, false);
    const fresh = join(dir, 'fresh.json');
    assert.equal((await packagePostrunFile(input, fresh, s)).ok, false);
    await assert.rejects(access(fresh)); assert.equal(await readFile(s, 'utf8'), originals[2]);
    const link = join(dir, 'link.json'); await symlink(input, link);
    assert.equal((await packagePostrunFile(link, fresh, join(dir, 'new-source.json'))).ok, false);
    await chmod(input, 0o644);
    assert.equal((await packagePostrunFile(input, fresh, join(dir, 'new-source.json'))).ok, false);
    assert.equal(await readFile(input, 'utf8'), original);
    const invalid = join(dir, 'invalid-utf8.json');
    await writeFile(invalid, Buffer.concat([Buffer.from('{"payload":"'), Buffer.from([0xff]), Buffer.from('"}')]), { flag: 'wx', mode: 0o600 });
    assert.equal((await packagePostrunFile(invalid, fresh, join(dir, 'new-source.json'))).ok, false);
  } finally { await rm(dir, { recursive: true }); }
});
