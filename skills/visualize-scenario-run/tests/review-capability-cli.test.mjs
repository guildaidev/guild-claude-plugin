import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { bundle, sourceBoundCandidate } from './fixtures.mjs';

// Real local Node CLI boundaries with synthetic, source-bound fixtures. No
// Skill/Agent/MCP/model, live scenario, browser or permission adapter is invoked.
// These tests cannot prove the resumed host will choose to follow instructions.
const scripts = fileURLToPath(new URL('../scripts/', import.meta.url));
const temp = () => mkdtemp('/private/var/folders/jb/h186fcqx3wx5hkym0wtct3000000gn/T/opencode/review-capability-cli-');
const save = (path, value) => writeFile(path, JSON.stringify(value), { flag: 'wx', mode: 0o600 });
const cli = (cwd, script, ...args) => {
  const result = spawnSync(process.execPath, [join(scripts, script), ...args], { cwd, encoding: 'utf8', timeout: 15000 });
  assert.equal(result.error, undefined);
  assert.equal(result.stderr, '');
  const value = JSON.parse(result.stdout);
  assert.equal(result.status, value.ok ? 0 : 1, result.stdout);
  return value;
};
const draft = input => {
  const doc = sourceBoundCandidate(input);
  return { schema_version: '1.3', snapshot_id: doc.snapshot_id,
    editor_id: doc.editor_id, parent_agent_id: doc.parent_agent_id,
    summary: doc.summary, header_copy: doc.header_copy, claims: doc.claims,
    events: doc.timeline.map(event => ({ occurrence_id: event.id,
      description: event.description, claim_refs: event.claim_refs, supporting_detail: event.supporting_detail })),
    artifact_claims: doc.artifact_claims, omitted_occurrences: doc.omitted_occurrences };
};
const prepare = async () => {
  const root = await temp(), input = bundle();
  const paths = Object.fromEntries(['bundle', 'draft', 'candidate', 'snapshot', 'copy'].map(name => [name, join(root, `${name}.json`)]));
  paths.html = join(root, 'review.html');
  await save(paths.bundle, input); await save(paths.draft, draft(input));
  return { root, input, paths };
};

test('packaged bundle/assemble/finalize/render CLIs work without a skill registry or review-page tool', async () => {
  const { root, input, paths } = await prepare();
  const before = await readFile(paths.bundle);
  assert.equal(cli(root, 'inspect.mjs', 'bundle', paths.bundle).ok, true);
  assert.equal(cli(root, 'inspect.mjs', 'assemble', paths.bundle, paths.draft, paths.candidate).ok, true);
  const candidate = JSON.parse(await readFile(paths.candidate, 'utf8'));
  assert.equal(candidate.schema_version, '1.9');
  assert.deepEqual(candidate.source_bundle, input);
  const finalized = cli(root, 'inspect.mjs', 'finalize', paths.candidate, paths.snapshot, '-', '-');
  assert.equal(finalized.ok, true);
  assert.deepEqual(finalized.review_diagnostics, {});
  const snapshot = JSON.parse(await readFile(paths.snapshot, 'utf8'));
  assert.equal(snapshot.review, undefined); assert.equal(snapshot.copy_review, undefined);
  const rendered = cli(root, 'render.mjs', paths.snapshot, paths.html);
  assert.equal(rendered.ok, true);
  assert.equal(rendered.artifact_path, paths.html);
  const html = await readFile(paths.html, 'utf8');
  for (const token of ['scenario-intro', 'id="comment-composer"', 'id="prompt-review"', 'class="prompt-state" aria-label="Claude prompt"', "connect-src &#39;none&#39;"])
    assert.ok(html.includes(token), token);
  assert.doesNotMatch(html, /limited.evidence|tool.unavailable|unsafe-eval|<iframe/i);
  assert.deepEqual(await readFile(paths.bundle), before);
});

test('retained malformed optional feedback stays private and unchanged, not a fake approval or capability failure', async () => {
  const { root, paths } = await prepare();
  assert.equal(cli(root, 'inspect.mjs', 'assemble', paths.bundle, paths.draft, paths.candidate).ok, true);
  const record = 'actual malformed private feedback; never an approval';
  await writeFile(paths.copy, record, { flag: 'wx', mode: 0o600 });
  const finalized = cli(root, 'inspect.mjs', 'finalize', paths.candidate, paths.snapshot, paths.copy, '-');
  assert.equal(finalized.ok, true);
  assert.equal(finalized.review_diagnostics.copy_review.ok, false);
  assert.equal(await readFile(paths.copy, 'utf8'), record);
  assert.equal(cli(root, 'render.mjs', paths.snapshot, paths.html).ok, true);
  assert.doesNotMatch(await readFile(paths.html, 'utf8'), /actual malformed private feedback/);
});

test('source mismatch is a validation failure with no final file, not missing render capability', async () => {
  const { root, paths } = await prepare();
  assert.equal(cli(root, 'inspect.mjs', 'assemble', paths.bundle, paths.draft, paths.candidate).ok, true);
  const changed = JSON.parse(await readFile(paths.candidate, 'utf8'));
  changed.run.id = 'wrong-run';
  const invalid = join(root, 'invalid-candidate.json'); await save(invalid, changed);
  const result = cli(root, 'inspect.mjs', 'finalize', invalid, paths.snapshot, '-', '-');
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
  assert.doesNotMatch(JSON.stringify(result), /tool.unavailable|unknown.skill/i);
  await assert.rejects(access(paths.snapshot), { code: 'ENOENT' });
  await assert.rejects(access(paths.html), { code: 'ENOENT' });
});

test('file collision preserves the existing artifact and returns an actual IO error', async () => {
  const { root, paths } = await prepare();
  assert.equal(cli(root, 'inspect.mjs', 'assemble', paths.bundle, paths.draft, paths.candidate).ok, true);
  assert.equal(cli(root, 'inspect.mjs', 'finalize', paths.candidate, paths.snapshot, '-', '-').ok, true);
  assert.equal(cli(root, 'render.mjs', paths.snapshot, paths.html).ok, true);
  const before = await readFile(paths.html);
  const result = cli(root, 'render.mjs', paths.snapshot, paths.html);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
  assert.doesNotMatch(JSON.stringify(result), /tool.unavailable|unknown.skill/i);
  assert.deepEqual(await readFile(paths.html), before);
});
