import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, mkdtemp, writeFile, rm, chmod } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderHtml } from '../scripts/render.mjs';
import { collectSessionEvidence } from '../scripts/session-evidence.mjs';
import { verifyReview } from '../../../evals/visualize-scenario-run/operation-timeline-replay/files/verify-review.mjs';
import { operationEvalCase, operationEvalFixture } from './operation-eval-fixture.mjs';

const skillRoot = fileURLToPath(new URL('../', import.meta.url));
const fixtures = join(operationEvalCase, 'mocks/guild/fixtures');
const sha = value => createHash('sha256').update(value).digest('hex');
const temp = () => mkdtemp(join(tmpdir(), 'operation-eval-local-'));
async function files(directory) { return (await Promise.all((await readdir(directory, { withFileTypes: true })).map(item => item.isDirectory() ? files(join(directory, item.name)) : [join(directory, item.name)]))).flat(); }

test('the new eval contains only synthetic raw inputs, complete local mocks and guarded existing-run history', async () => {
  const source = JSON.parse(await readFile(join(fixtures, 'events.json'))), session = JSON.parse(await readFile(join(fixtures, 'session.json')));
  assert.equal(source.synthetic, true); assert.equal(source.items.length, source.pagination.total_count); assert.equal(source.pagination.has_more, false);
  assert.equal(new Set(source.items.map(item => item.id)).size, source.items.length);
  const records = collectSessionEvidence(source, { captured_at: '2026-01-02T12:01:00.000Z' });
  assert.equal(records.ok, true, JSON.stringify(records.errors)); assert.equal(records.evidence.length, 7); assert.deepEqual(records.gaps, []);
  assert.equal(source.items.filter(item => item.task?.entity_type === 'EntTaskAgent' && item.task.parent_task_id === session.root_task.id && item.type === 'runtime_done').length, 2);
  assert.ok(!source.items.some(item => item.content?.message?.includes('process_result')));
  const gets = source.items.filter(item => item.task?.tool_name === 'google_docs_oauth_documents_get' && item.type === 'runtime_done').sort((a, b) => a.created_at.localeCompare(b.created_at));
  const text = event => event.content.body.content[0].paragraph.elements[0].textRun.content;
  assert.equal(text(gets[0]), '\n'); assert.equal(text(gets[1]).length, 84); assert.equal(text(gets[2]).length, 188); assert.ok(text(gets[2]).startsWith(text(gets[1])));
  for (const [startId, before, after] of [['event-insert-first-start', text(gets[0]), text(gets[1])], ['event-insert-second-start', text(gets[1]), text(gets[2])]]) {
    const insert = source.items.find(item => item.id === startId).content.requests[0].insertText;
    assert.equal(before.slice(0, insert.location.index - 1) + insert.text + before.slice(insert.location.index - 1), after);
  }
  const history = (await readFile(join(operationEvalCase, 'history.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(history.filter(row => row.message?.content?.some?.(part => part.name?.endsWith('guild_send_session_message'))).length, 1);
  assert.ok((await readFile(join(operationEvalCase, 'case.yaml'), 'utf8')).includes('scaffold_script: scaffold.sh'));
  for (const server of ['guild', 'github']) {
    const tools = JSON.parse(await readFile(join(operationEvalCase, 'mocks', server, '_tools.json')));
    for (const tool of tools.tools) {
      const mock = await readFile(join(operationEvalCase, 'mocks', server, `${tool.name}.md`), 'utf8');
      for (const match of mock.matchAll(/\{\{file:([^}]+)\}\}/g)) assert.ok((await stat(join(operationEvalCase, 'mocks', server, match[1]))).isFile());
    }
  }
  for (const tool of ['guild_start_profile_agent_test_session', 'guild_send_session_message']) assert.match(await readFile(join(operationEvalCase, 'mocks/guild', `${tool}.md`), 'utf8'), /error: true/);
  const raw = (await Promise.all((await files(operationEvalCase)).map(path => readFile(path, 'utf8')))).join('\n');
  assert.doesNotMatch(raw, /1owHvJ4jhYu5PeCl|9cfdeeb0-abda|operation-ui-replay-7v4hlpny|Didrickson|@guild\.ai/);
  assert.equal(session.id, source.session_id);
});

test('scaffold copies read-only raw fixtures and the verifier only into its fresh workspace', async () => {
  const directory = await temp();
  try {
    const result = spawnSync('/bin/bash', [join(operationEvalCase, 'scaffold.sh')], { cwd: directory, encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await files(directory)).map(path => path.slice(directory.length + 1)).sort(), ['fixtures/session.json', 'fixtures/source-events.json', 'verify-review.mjs']);
    assert.equal(await readFile(join(directory, 'fixtures/source-events.json'), 'utf8'), await readFile(join(fixtures, 'events.json'), 'utf8'));
    for (const path of await files(directory)) assert.equal((await stat(path)).mode & 0o777, 0o444);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('eval verifier checks a complete normal production render and rejects missing processes, baselines and public validation prose', async () => {
  const directory = await temp();
  try {
    const scaffold = spawnSync('/bin/bash', [join(operationEvalCase, 'scaffold.sh')], { cwd: directory, encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
    assert.equal(scaffold.status, 0, scaffold.stderr);
    const snapshotPath = join(directory, 'review.snapshot.json'), htmlPath = join(directory, 'review.html');
    const run = async snapshot => {
      await writeFile(snapshotPath, JSON.stringify(snapshot)); await writeFile(htmlPath, renderHtml(snapshot).html);
      return verifyReview({ snapshotPath, htmlPath, skillRoot, fixtureDirectory: join(directory, 'fixtures') });
    };
    const good = await operationEvalFixture(), original = structuredClone(good.snapshot);
    const result = await run(good.snapshot);
    assert.equal(result.report.ok, true, JSON.stringify(result.report));
    assert.equal(result.publicSummary.steps.length, 7);
    assert.deepEqual(good.snapshot, original);
    const omitted = await operationEvalFixture(draft => {
      draft.events = draft.events.filter(event => event.occurrence_id !== 'first-process');
      draft.omitted_occurrences.push({ id: 'first-process', reason: 'Negative local test omits a required business process.' });
    });
    assert.equal((await run(omitted.snapshot)).report.ok, false);
    const noBaseline = await operationEvalFixture(undefined, { omitInitialBaseline: true });
    assert.equal((await run(noBaseline.snapshot)).report.ok, false);
    const wrongProse = await operationEvalFixture(draft => { draft.events[0].description = 'The agent read the document back to validate the result.'; });
    assert.equal((await run(wrongProse.snapshot)).report.ok, false);
    await run(good.snapshot);
    const before = sha(await readFile(snapshotPath));
    const cli = spawnSync(process.execPath, [join(directory, 'verify-review.mjs'), snapshotPath, htmlPath, skillRoot], { cwd: directory, encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stderr || cli.stdout);
    assert.equal(JSON.parse(await readFile(join(directory, 'verification.json'))).ok, true);
    assert.equal(sha(await readFile(snapshotPath)), before);
    const duplicate = spawnSync(process.execPath, [join(directory, 'verify-review.mjs'), snapshotPath, htmlPath, skillRoot], { cwd: directory, encoding: 'utf8' });
    assert.notEqual(duplicate.status, 0, 'Verification reports are not overwritten.');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
