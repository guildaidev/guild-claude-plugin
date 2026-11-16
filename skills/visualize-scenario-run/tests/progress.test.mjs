import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, open, readFile, writeFile, chmod, stat, symlink, link, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { connect } from 'node:net';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';
import { beginProgress, changeProgress, serveProgress, launchProgress, readProgressFile, normalizeTarget, LIMITS } from '../scripts/progress.mjs';
import { progressPage, startProgressBrowser } from '../scripts/progress-page.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { snapshot } from './fixtures.mjs';

const script = fileURLToPath(new URL('../scripts/progress.mjs', import.meta.url));
const target = () => ({ workspace_id: 'workspace-1', profile_id: 'profile-private', scenario_id: 'scenario-1', run_id: 'run-1',
  session_ids: ['session-1'], agent_version_ids: ['version-7'], application_version: 'app-3', parent_conversation_ref: 'parent-conversation-1' });
async function setup(t, value = target()) {
  const directory = await mkdtemp(join(await realpath(tmpdir()), 'progress-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await beginProgress(directory, value);
  const record = JSON.parse(await readFile(result.manifest_path, 'utf8'));
  const change = (seq, op, details = {}) => changeProgress(result.manifest_path, result.writer_path, seq, op, details);
  return { ...result, record, change };
}
async function serving(t, context) {
  const result = await serveProgress(context.manifest_path);
  t.after(() => result.close());
  const url = new URL(result.url);
  const get = (suffix, options) => http(url, suffix, options);
  return { ...result, get, url };
}
function http(url, suffix = 'status.json', { method = 'GET', headers = {}, path, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: url.port, path: path ?? url.pathname.replace('progress.html', suffix), method, headers, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('Test request timed out')));
    req.end(body);
  });
}
async function reviewed(context) {
  const doc = await snapshot();
  const html = renderHtml(doc);
  assert.equal(html.ok, true);
  await writeFile(join(context.directory, 'checked.snapshot.json'), JSON.stringify(doc));
  await writeFile(join(context.directory, 'checked.html'), html.html);
  return { doc, html: html.html, details: { snapshot: 'checked.snapshot.json', html: 'checked.html' } };
}
const rejects = (promise, code) => assert.rejects(promise, error => error.code === code);

test('begin writes an immediate offline page and private closed target/writer files', async t => {
  const context = await setup(t);
  assert.equal((await stat(context.directory)).mode & 0o777, 0o700);
  for (const path of [context.manifest_path, context.writer_path, context.artifact_path]) assert.equal((await stat(path)).mode & 0o777, 0o600);
  const page = await readFile(context.artifact_path, 'utf8');
  assert.match(page, /Gathering evidence/);
  assert.match(page, /<progress aria-label=/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /<h1>Generating test run timeline<\/h1>/);
  assert.doesNotMatch(page, /Making your run easier to explore|Live updates are unavailable|original conversation|id="connection"/);
  assert.doesNotMatch(page, /<script>|profile-private|workspace-1|parent-conversation-1|unsafe-inline|unsafe-eval/);
  assert.match(progressPage(context.record).csp, /script-src 'none'; connect-src 'none'/);
  assert.throws(() => normalizeTarget({ ...target(), token: 'secret' }), /invalid_target/);
  assert.throws(() => normalizeTarget({ ...target(), run_id: '<script>' }), /invalid_target/);
  assert.throws(() => normalizeTarget({ ...target(), session_ids: ['one', 'one'] }), /invalid_target/);
  assert.throws(() => normalizeTarget({ ...target(), session_ids: Array.from({ length: 100 }, (_, i) => `session-${i}-${'x'.repeat(180)}`) }), /invalid_target/);
});

test('read-only HTTP serves exactly three routes, truthful status and strict hashed CSP', async t => {
  const context = await setup(t), server = await serving(t, context);
  assert.equal(server.url.hostname, '127.0.0.1');
  const page = await server.get('progress.html');
  assert.equal(page.status, 200);
  assert.match(page.body, /<h1>Generating test run timeline<\/h1>/);
  for (const tag of ['style', 'script']) {
    const content = page.body.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))[1];
    const hash = createHash('sha256').update(content).digest('base64');
    assert.ok(page.headers['content-security-policy'].includes(`'sha256-${hash}'`));
  }
  assert.match(page.headers['content-security-policy'], /connect-src 'self'/);
  assert.doesNotMatch(page.headers['content-security-policy'], /unsafe-/);
  const status = await server.get();
  assert.deepEqual(Object.keys(JSON.parse(status.body)).sort(), ['activity', 'invocation', 'sequence', 'state']);
  assert.doesNotMatch(status.body + page.body, /profile-private|workspace-1|parent-conversation-1|writer.private|progress.private/);
  assert.ok(!(status.body + page.body).includes(context.record.writer));
  for (const response of [page, status, await server.get('final.html')]) {
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['access-control-allow-origin'], undefined);
    assert.equal(response.headers['set-cookie'], undefined);
  }
  const head = await server.get('progress.html', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(head.body, '');
  assert.equal((await server.get('final.html')).status, 409);
  await context.change(1, 'update', { stage: 'checking' });
  assert.equal(JSON.parse((await server.get()).body).activity, 'Checking details.');
});

test('hostile HTTP methods, exact paths, origins, hosts, bodies and private files fail closed', async t => {
  const context = await setup(t), server = await serving(t, context);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE']) assert.equal((await server.get('status.json', { method })).status, 405, method);
  for (const suffix of ['progress.private.json', 'writer.private.json', 'server.private.json', 'progress.lock', 'checked.snapshot.json', 'status.json?path=../secret', '%73tatus.json', '../status.json', 'final.html/extra', '']) {
    assert.equal((await server.get(suffix)).status, 404, suffix);
  }
  for (const path of ['/', '/favicon.ico', '/%2e%2e/status.json', 'http://evil.test/status.json', `//${server.url.host}${server.url.pathname}`]) assert.equal((await server.get('', { path })).status, 404, path);
  for (const headers of [{ Host: 'evil.test' }, { Host: `localhost:${server.url.port}` }, { Origin: 'https://evil.test' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await server.get('status.json', { headers })).status, 403);
  assert.equal((await server.get('status.json', { headers: { Origin: server.url.origin } })).status, 200);
  assert.equal((await server.get('status.json', { headers: { 'Content-Length': '1' }, body: 'x' })).status, 400);
  assert.equal((await server.get('status.json', { headers: { 'Transfer-Encoding': 'chunked' } })).status, 400);
  assert.equal((await server.get('status.json', { headers: { Expect: '100-continue' } })).status, 400);
  const raw = text => new Promise((resolve, reject) => {
    const socket = connect(Number(server.url.port), '127.0.0.1', () => socket.end(text));
    let output = ''; socket.on('data', bytes => { output += bytes; }); socket.on('end', () => resolve(output)); socket.on('error', reject);
  });
  for (const request of [
    `GET ${server.url.pathname} HTTP/1.1\r\nHost: ${server.url.host}\r\nHost: evil.test\r\n\r\n`,
    `GET ${server.url.pathname} HTTP/1.1\r\nHost: ${server.url.host}\r\nOrigin: ${server.url.origin}\r\nOrigin: https://evil.test\r\n\r\n`,
    `CONNECT evil.test:443 HTTP/1.1\r\nHost: evil.test\r\n\r\n`,
    `GET ${server.url.pathname} HTTP/1.1\r\nHost: ${server.url.host}\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n`,
    `GET ${server.url.pathname} HTTP/1.1\r\nHost: ${server.url.host}\r\nX-Large: ${'a'.repeat(9000)}\r\n\r\n`,
    `GET ${server.url.pathname} HTTP/1.1\r\nHost: ${server.url.host}\r\n${Array.from({ length: 35 }, (_, i) => `X-Extra-${i}: 1\r\n`).join('')}Origin: https://evil.test\r\n\r\n`,
  ]) assert.match(await raw(request), /HTTP\/1\.1 (400|403)/);
});

test('monotonic sequence, exclusive concurrent writers, fixed activities and terminal states are enforced', async t => {
  const context = await setup(t);
  await rejects(context.change(0, 'update', { stage: 'checking' }), 'stale_sequence');
  await rejects(context.change(2, 'update', { stage: 'checking' }), 'stale_sequence');
  await rejects(context.change(1, 'update', { stage: '<script>' }), 'invalid_stage');
  await rejects(context.change(1, 'update', { stage: 'checking', message: 'raw internal detail' }), 'invalid_stage');
  const attempts = await Promise.allSettled([context.change(1, 'update', { stage: 'checking' }), context.change(1, 'update', { stage: 'polishing' })]);
  assert.equal(attempts.filter(item => item.status === 'fulfilled').length, 1);
  await context.change(2, 'blocked');
  await rejects(context.change(3, 'update', { stage: 'gathering' }), 'terminal_state');
  await rejects(context.change(3, 'ready', { snapshot: 'x', html: 'y' }), 'terminal_state');
  const page = await readFile(context.artifact_path, 'utf8');
  assert.match(page, /class="paused"/); assert.match(page, /Live updates have stopped/);
  await context.change(3, 'retire');
  await rejects(context.change(4, 'update', { stage: 'checking' }), 'terminal_state');
  await rejects(serveProgress(context.manifest_path), 'terminal_state');
});

test('writer/target mismatches and oversized control files do not change the run', async t => {
  const context = await setup(t);
  const original = await readFile(context.writer_path);
  const writer = JSON.parse(original);
  await writeFile(context.writer_path, JSON.stringify({ ...writer, target: { ...writer.target, profile_id: 'wrong-profile' } }));
  await rejects(context.change(1, 'blocked'), 'writer_mismatch');
  await writeFile(context.writer_path, JSON.stringify({ ...writer, writer: 'f'.repeat(48) }));
  await rejects(context.change(1, 'blocked'), 'writer_mismatch');
  await writeFile(context.writer_path, 'x'.repeat(LIMITS.control + 1));
  await rejects(context.change(1, 'blocked'), 'oversize_file');
  await writeFile(context.writer_path, original);
  await context.change(1, 'blocked');
});

test('symlinks, hardlinks, directories and arbitrary ready paths cannot expose private files', async t => {
  const context = await setup(t);
  const { details } = await reviewed(context);
  await symlink(context.writer_path, join(context.directory, 'symlink.html'));
  await assert.rejects(context.change(1, 'ready', { ...details, html: 'symlink.html' }));
  await link(context.writer_path, join(context.directory, 'hardlink.html'));
  await rejects(context.change(1, 'ready', { ...details, html: 'hardlink.html' }), 'unsafe_file');
  await assert.rejects(readProgressFile(context.directory, '..'));
  await rejects(context.change(1, 'ready', { ...details, html: '../outside.html' }), 'unsafe_file');
  await rejects(context.change(1, 'ready', { ...details, html: context.writer_path }), 'unsafe_file');
  await mkdir(join(context.directory, 'directory.html'));
  await rejects(context.change(1, 'ready', { ...details, html: 'directory.html' }), 'unsafe_file');
  await symlink(context.directory, join(context.directory, 'root-alias'));
  await rejects(readProgressFile(join(context.directory, 'root-alias'), 'checked.html'), 'unsafe_directory');
  await rejects(readProgressFile(context.directory, 'missing'), 'ENOENT');
  const server = await serving(t, context);
  for (const suffix of ['symlink.html', 'hardlink.html']) assert.equal((await server.get(suffix)).status, 404);
});

test('ready rejects unreviewed or mismatching snapshots, arbitrary HTML, oversize files and wrong run identity', async t => {
  const context = await setup(t);
  const { doc, html, details } = await reviewed(context);
  await writeFile(join(context.directory, 'checked.html'), `${html}<script>alert(1)</script>`);
  await rejects(context.change(1, 'ready', details), 'html_mismatch');
  await writeFile(join(context.directory, 'checked.html'), html);
  const unreviewed = structuredClone(doc); delete unreviewed.copy_review;
  await writeFile(join(context.directory, 'checked.snapshot.json'), JSON.stringify(unreviewed));
  await rejects(context.change(1, 'ready', details), 'invalid_reviewed_snapshot');
  await writeFile(join(context.directory, 'checked.snapshot.json'), 'x'.repeat(LIMITS.snapshot + 1));
  await rejects(context.change(1, 'ready', details), 'oversize_file');
  await reviewed(context);
  const oversized = await open(join(context.directory, 'oversized.html'), 'wx');
  await oversized.truncate(LIMITS.html + 1); await oversized.close();
  await rejects(context.change(1, 'ready', { ...details, html: 'oversized.html' }), 'oversize_file');
  for (const [key, value] of Object.entries({ run_id: 'old-run', workspace_id: 'old-workspace', scenario_id: 'old-scenario', application_version: 'old-app',
    agent_version_ids: ['old-version'], session_ids: ['old-session'], parent_conversation_ref: 'other-parent' })) {
    const other = await setup(t, { ...target(), [key]: value });
    const checked = await reviewed(other);
    await rejects(other.change(1, 'ready', checked.details), 'target_mismatch');
  }
  await context.change(1, 'ready', details);
  assert.equal((await stat(join(context.directory, 'completed-review.html'))).mode & 0o777, 0o400);
});

test('ready captures immutable exact renderer bytes; HTTP never reads caller files after capture', async t => {
  const context = await setup(t), server = await serving(t, context);
  const { html, details } = await reviewed(context);
  await context.change(1, 'ready', details);
  assert.equal(JSON.parse((await server.get()).body).state, 'ready');
  const first = await server.get('final.html');
  assert.equal(first.status, 200); assert.equal(first.body, html);
  const head = await server.get('final.html', { method: 'HEAD' });
  assert.equal(head.body, ''); assert.equal(Number(head.headers['content-length']), Buffer.byteLength(html));
  assert.match(first.headers['content-security-policy'], /connect-src 'none'/);
  assert.doesNotMatch(first.headers['content-security-policy'], /connect-src 'self'|unsafe-/);
  await writeFile(join(context.directory, 'checked.html'), '<script>hostile replacement</script>');
  await writeFile(join(context.directory, 'checked.snapshot.json'), '{}');
  await chmod(join(context.directory, 'completed-review.html'), 0o600);
  await writeFile(join(context.directory, 'completed-review.html'), '<script>mutated durable copy</script>');
  assert.equal((await server.get('final.html')).body, html, 'server serves its captured bytes, not changed files');
  await rejects(context.change(2, 'update', { stage: 'checking' }), 'terminal_state');
  assert.equal((await server.get('completed.snapshot.json')).status, 404);
  assert.match(await readFile(context.artifact_path, 'utf8'), /href="completed-review.html"/);
});

test('tampered captured final before server startup fails closed', async t => {
  const context = await setup(t), { details } = await reviewed(context);
  await context.change(1, 'ready', details);
  await chmod(join(context.directory, 'completed-review.html'), 0o600);
  await writeFile(join(context.directory, 'completed-review.html'), '<h1>not checked</h1>');
  await rejects(serveProgress(context.manifest_path), 'html_mismatch');
});

test('partial capture cannot overwrite existing files or publish a ready state', async t => {
  const context = await setup(t), { details } = await reviewed(context);
  await writeFile(join(context.directory, 'completed-review.html'), 'preserve this existing file');
  await assert.rejects(context.change(1, 'ready', details), error => error.code === 'EEXIST');
  assert.equal(await readFile(join(context.directory, 'completed-review.html'), 'utf8'), 'preserve this existing file');
  assert.equal(JSON.parse(await readFile(context.manifest_path, 'utf8')).state, 'working');
  const server = await serving(t, context);
  assert.equal((await server.get('final.html')).status, 409);
});

test('retire closes this server; late writers cannot reopen it or affect a fresh invocation', async t => {
  const context = await setup(t), server = await serving(t, context);
  await assert.rejects(serveProgress(context.manifest_path), error => error.code === 'EEXIST');
  await context.change(1, 'retire');
  await server.closed;
  await assert.rejects(server.get());
  await rejects(context.change(2, 'blocked'), 'terminal_state');
  const fresh = await setup(t), next = await serving(t, fresh);
  assert.notEqual(fresh.record.invocation, context.record.invocation);
  assert.equal(JSON.parse((await next.get()).body).state, 'working');
  assert.equal((await next.get('', { path: server.url.pathname })).status, 404);
});

test('event-driven server rejects private target tampering and bounded lifetime shuts down', async t => {
  const context = await setup(t), server = await serving(t, context);
  const record = JSON.parse(await readFile(context.manifest_path, 'utf8'));
  await writeFile(context.manifest_path, JSON.stringify({ ...record, target: { ...record.target, profile_id: 'different-profile' }, sequence: 1 }));
  await server.closed;
  await assert.rejects(server.get());
  const fresh = await setup(t);
  const bounded = await serveProgress(fresh.manifest_path, { lifetimeMs: 30 });
  // The HTTP server keeps the loop alive; no assistant sleep/status polling.
  await bounded.closed;
  await assert.rejects(http(new URL(bounded.url)));
});

test('server rejects regressed sequence, same-sequence mutations and terminal revival', async t => {
  for (const variant of ['regressed', 'mutated', 'revived']) {
    const context = await setup(t), server = await serving(t, context);
    await context.change(1, variant === 'revived' ? 'blocked' : 'update', variant === 'revived' ? {} : { stage: 'checking' });
    assert.equal((await server.get()).status, 200);
    const record = JSON.parse(await readFile(context.manifest_path, 'utf8'));
    const bad = variant === 'regressed' ? { ...record, sequence: 0 } : variant === 'mutated' ? { ...record, stage: 'polishing' } : { ...record, sequence: 2, state: 'working' };
    await writeFile(context.manifest_path, JSON.stringify(bad));
    await server.closed;
    await assert.rejects(server.get());
  }
});

test('CLI begins offline, serves from native stdout receipt, updates, blocks and retires without HTTP writes', async t => {
  const directory = await mkdtemp(join(await realpath(tmpdir()), 'progress-cli-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const targetPath = join(directory, 'target.json'); await writeFile(targetPath, JSON.stringify(target()));
  const cli = (...args) => {
    const output = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    assert.equal(output.stderr, '');
    return { status: output.status, ...JSON.parse(output.stdout) };
  };
  const initial = cli('begin', directory, targetPath); assert.equal(initial.ok, true);
  const child = spawn(process.execPath, [script, 'serve', initial.manifest_path], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null) child.kill('SIGTERM'); });
  const receipt = await new Promise((resolve, reject) => {
    let text = ''; child.stdout.on('data', bytes => { text += bytes; if (text.includes('\n')) resolve(JSON.parse(text.split('\n')[0])); });
    child.once('error', reject); child.once('exit', code => { if (!text) reject(new Error(`Server exited ${code}`)); });
  });
  assert.equal(receipt.ok, true);
  assert.equal(cli('update', initial.manifest_path, initial.writer_path, '1', 'arranging').ok, true);
  assert.equal(JSON.parse((await http(new URL(receipt.url))).body).activity, 'Arranging the timeline.');
  assert.equal(cli('blocked', initial.manifest_path, initial.writer_path, '2').ok, true);
  assert.equal(JSON.parse((await http(new URL(receipt.url))).body).state, 'blocked');
  const exited = once(child, 'exit');
  assert.equal(cli('retire', initial.manifest_path, initial.writer_path, '3').ok, true);
  assert.equal((await exited)[0], 0);
  const invalid = cli('update', initial.manifest_path, initial.writer_path, '4', 'checking');
  assert.equal(invalid.status, 1); assert.equal(invalid.code, 'terminal_state');
  const completed = await setup(t), { details } = await reviewed(completed);
  const ready = cli('ready', completed.manifest_path, completed.writer_path, '1', details.snapshot, details.html);
  assert.equal(ready.ok, true); assert.equal(ready.state, 'ready');
  assert.equal(ready.artifact_path, join(completed.directory, 'completed-review.html'));
});

test('finite start CLI returns a live URL after listening; owned server survives launcher exit', async t => {
  const directory = await mkdtemp(join(await realpath(tmpdir()), 'progress-start-test-'));
  const targetPath = join(directory, 'target.json'); await writeFile(targetPath, JSON.stringify(target()));
  const output = spawnSync(process.execPath, [script, 'start', directory, targetPath], { encoding: 'utf8', timeout: 15000 });
  assert.equal(output.error, undefined); assert.equal(output.status, 0); assert.equal(output.stderr, '');
  const initial = JSON.parse(output.stdout);
  assert.equal(initial.ok, true); assert.equal(initial.live, true);
  let sequence = 0;
  t.after(async () => {
    await changeProgress(initial.manifest_path, initial.writer_path, ++sequence, 'retire');
    await rm(directory, { recursive: true, force: true });
  });
  const url = new URL(initial.url);
  assert.equal((await http(url, 'progress.html')).status, 200);
  assert.match((await http(url, 'progress.html')).body, /<script>/);
  await changeProgress(initial.manifest_path, initial.writer_path, ++sequence, 'update', { stage: 'checking' });
  assert.equal(JSON.parse((await http(url)).body).activity, 'Checking details.');
  const context = { directory: initial.directory };
  const { html, details } = await reviewed(context);
  await changeProgress(initial.manifest_path, initial.writer_path, ++sequence, 'ready', details);
  assert.equal((await http(url, 'final.html')).body, html);
  assert.match(await readFile(initial.artifact_path, 'utf8'), /completed-review.html/);
});

test('launch failures preserve static output and never claim a live URL or retry', async t => {
  for (const outcome of ['denied', 'exit', 'invalid', 'timeout']) {
    const context = await setup(t); let calls = 0, killed = 0;
    const result = await launchProgress(context.manifest_path, { startupMs: 20, spawnServer(module, args, options) {
      calls++; assert.equal(module.href, new URL('../scripts/progress.mjs', import.meta.url).href);
      assert.deepEqual(args, ['serve', context.manifest_path]);
      assert.equal(options.detached, true); assert.deepEqual(options.stdio, ['ignore', 'ignore', 'ignore', 'ipc']);
      if (outcome === 'denied') throw new Error('private denied detail');
      const child = new EventEmitter(); child.kill = () => { killed++; };
      queueMicrotask(() => { if (outcome === 'exit') child.emit('exit', 1);
        if (outcome === 'invalid') child.emit('message', { ok: true, url: 'https://evil.test/progress.html' }); });
      return child;
    } });
    assert.deepEqual(result, { live: false, code: 'local_progress_unavailable' });
    assert.equal(calls, 1); assert.equal(killed, outcome === 'denied' ? 0 : 1);
    assert.match(await readFile(context.artifact_path, 'utf8'), /Gathering evidence/);
    assert.equal(JSON.parse(await readFile(context.manifest_path)).sequence, 0);
  }
});

// Browser controller tests use a controlled DOM/clock, not browser acceptance.
function browserHarness(items) {
  const nodes = { main: { dataset: { invocation: 'a'.repeat(48), sequence: '0' }, classList: { add() {} }, setAttribute() {} },
    activity: { textContent: '' }, connection: { textContent: '' } };
  const listeners = {}, timers = new Map(), navigations = [];
  let next = 0, calls = 0, inFlight = 0, maxInFlight = 0;
  const schedule = (fn, delay) => { timers.set(++next, { fn, delay }); return next; };
  const unschedule = id => timers.delete(id);
  const window = { URL, AbortController, location: { href: `http://127.0.0.1:1234/${'a'.repeat(48)}/progress.html`, replace: url => navigations.push(url) },
    addEventListener: (name, callback) => { listeners[name] = callback; } };
  const document = { querySelector: () => nodes.main, getElementById: id => nodes[id] };
  const fetch = async (url, options) => {
    assert.equal(url.origin, 'http://127.0.0.1:1234'); assert.equal(options.credentials, 'omit');
    calls++; maxInFlight = Math.max(maxInFlight, ++inFlight);
    try {
      const item = items.shift();
      if (item instanceof Error) throw item;
      return { ok: true, text: async () => JSON.stringify(item) };
    } finally { inFlight--; }
  };
  const stop = startProgressBrowser(document, window, fetch, schedule, unschedule);
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const tick = async () => { await flush(); const entry = [...timers].find(([, value]) => value.delay === 1000); if (entry) { timers.delete(entry[0]); await entry[1].fn(); } await flush(); };
  return { nodes, listeners, timers, navigations, tick, flush, stop, calls: () => calls, maxInFlight: () => maxInFlight };
}
const browserStatus = (state, sequence, activity = 'Checking details.') => ({ invocation: 'a'.repeat(48), sequence, state, activity });
test('browser-only controller updates high-level text and navigates exactly once on matching ready', async () => {
  const browser = browserHarness([browserStatus('working', 1), browserStatus('ready', 2)]);
  await browser.flush(); assert.equal(browser.nodes.activity.textContent, 'Checking details.');
  await browser.tick(); await browser.tick();
  assert.equal(browser.navigations.length, 1); assert.match(browser.navigations[0], /\/final\.html$/);
  assert.equal(browser.calls(), 2); assert.equal(browser.maxInFlight(), 1);
});
test('browser stops on blocked/retired, disconnect, stale/wrong identities and unload without false completion', async () => {
  for (const state of ['blocked', 'retired']) {
    const browser = browserHarness([browserStatus(state, 1)]); await browser.flush();
    assert.equal(browser.navigations.length, 0); assert.equal(browser.timers.size, 0);
  }
  for (const invalid of [new Error('Disconnected'), { ...browserStatus('ready', 1), invocation: 'b'.repeat(48) }, browserStatus('working', -1),
    { ...browserStatus('working', 1), activity: '<script>raw internals</script>' }, { ...browserStatus('ready', 1), final_url: 'https://evil.test' }]) {
    const browser = browserHarness([invalid, invalid, invalid]); await browser.flush(); await browser.tick(); await browser.tick();
    assert.equal(browser.calls(), 3); assert.equal(browser.navigations.length, 0);
    assert.equal(browser.nodes.activity.textContent, 'Live updates are unavailable.'); assert.equal(browser.timers.size, 0);
  }
  const browser = browserHarness([browserStatus('working', 1)]); await browser.flush(); browser.listeners.pagehide(); await browser.tick();
  assert.equal(browser.calls(), 1); assert.equal(browser.timers.size, 0);
});
