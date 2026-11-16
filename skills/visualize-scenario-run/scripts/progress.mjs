import { constants } from 'node:fs';
import { open, mkdtemp, realpath, lstat, rename, unlink } from 'node:fs/promises';
import { watch as watchDirectory } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { fork } from 'node:child_process';
import { ACTIVITIES, terminalActivity, progressPage } from './progress-page.mjs';

export const LIMITS = Object.freeze({ control: 32768, snapshot: 8 * 1024 * 1024, html: 32 * 1024 * 1024 });
const MANIFEST = 'progress.private.json', WRITER = 'writer.private.json';
const id = () => randomBytes(24).toString('hex');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const serial = value => JSON.stringify(value);
const fail = code => { throw Object.assign(new Error(code), { code }); };
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const token = value => typeof value === 'string' && /^[a-f0-9]{48}$/.test(value);
const name = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(value) && value !== '.' && value !== '..';
const targetKeys = ['workspace_id', 'profile_id', 'scenario_id', 'run_id', 'session_ids', 'agent_version_ids', 'application_version', 'parent_conversation_ref'];
export function normalizeTarget(value) {
  if (!exact(value, targetKeys)) fail('invalid_target');
  const result = {};
  for (const key of targetKeys) {
    const valid = item => typeof item === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:@~/-]{0,199}$/.test(item);
    if (key.endsWith('_ids')) {
      if (!Array.isArray(value[key]) || !value[key].length || value[key].length > 100 || !value[key].every(valid) || new Set(value[key]).size !== value[key].length) fail('invalid_target');
      result[key] = [...value[key]].sort();
    } else {
      if (!valid(value[key])) fail('invalid_target');
      result[key] = value[key];
    }
  }
  if (Buffer.byteLength(serial(result)) > LIMITS.control / 2) fail('invalid_target');
  return result;
}

async function rootIdentity(root) {
  const info = await lstat(root);
  if (!info.isDirectory() || info.isSymbolicLink() || await realpath(root) !== root) fail('unsafe_directory');
  return `${info.dev}:${info.ino}`;
}

// Bound every read, refuse symlinks/hardlinks/devices, and detect changed files.
export async function readProgressFile(root, filename, maximum = LIMITS.control) {
  if (!name(filename) || !constants.O_NOFOLLOW) fail('unsafe_file');
  await rootIdentity(root);
  const file = await open(join(root, filename), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await file.stat();
    if (!before.isFile() || before.nlink !== 1) fail('unsafe_file');
    if (before.size > maximum) fail('oversize_file');
    const buffer = Buffer.alloc(before.size + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await file.read(buffer, length, buffer.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    const after = await file.stat();
    if (length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs || after.nlink !== 1) fail('changed_file');
    return buffer.subarray(0, length);
  } finally { await file.close(); }
}
async function createFile(root, filename, bytes, mode = 0o600) {
  if (!name(filename)) fail('unsafe_file');
  await rootIdentity(root);
  const file = await open(join(root, filename), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, mode);
  try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
}
async function replaceFile(root, filename, bytes) {
  const temporary = `temporary-${id()}.json`;
  await createFile(root, temporary, bytes);
  try { await rename(join(root, temporary), join(root, filename)); }
  catch (error) { await unlink(join(root, temporary)).catch(() => {}); throw error; }
}
const parse = bytes => { try { return JSON.parse(bytes.toString('utf8')); } catch { fail('invalid_json'); } };
function validateRecord(record) {
  if (!exact(record, ['version', 'invocation', 'writer', 'root', 'root_identity', 'target', 'sequence', 'state', 'stage', 'final']) || record.version !== 1 ||
      !token(record.invocation) || !token(record.writer) || typeof record.root !== 'string' || typeof record.root_identity !== 'string' ||
      !Number.isSafeInteger(record.sequence) || record.sequence < 0 || !['working', 'ready', 'blocked', 'retired'].includes(record.state) || !Object.hasOwn(ACTIVITIES, record.stage)) fail('invalid_manifest');
  record.target = normalizeTarget(record.target);
  if (record.final !== null && (!exact(record.final, ['sha256', 'snapshot_sha256']) || !Object.values(record.final).every(value => /^[a-f0-9]{64}$/.test(value)))) fail('invalid_manifest');
  if ((record.state === 'ready' && !record.final) || (['working', 'blocked'].includes(record.state) && record.final)) fail('invalid_manifest');
  return record;
}
async function load(manifestPath) {
  const path = resolve(manifestPath), root = dirname(path);
  if (basename(path) !== MANIFEST) fail('invalid_manifest_path');
  const record = validateRecord(parse(await readProgressFile(root, MANIFEST)));
  if (record.root !== root || record.root_identity !== await rootIdentity(root)) fail('target_mismatch');
  return record;
}
async function save(record) {
  await replaceFile(record.root, MANIFEST, serial(record));
  await replaceFile(record.root, 'progress.html', progressPage(record).html);
}

export async function beginProgress(outputDirectory, target) {
  target = normalizeTarget(target);
  const parent = await realpath(resolve(outputDirectory));
  const root = await mkdtemp(join(parent, 'run-progress-'));
  // mkdtemp is 0700 regardless of a permissive surrounding output directory.
  const record = { version: 1, invocation: id(), writer: id(), root, root_identity: await rootIdentity(root), target,
    sequence: 0, state: 'working', stage: 'gathering', final: null };
  // Initial HTML is written before any server, snapshot loading or rendering.
  await createFile(root, 'progress.html', progressPage(record).html);
  await createFile(root, MANIFEST, serial(record));
  await createFile(root, WRITER, serial({ invocation: record.invocation, writer: record.writer, target }));
  return { ok: true, directory: root, manifest_path: join(root, MANIFEST), writer_path: join(root, WRITER), artifact_path: join(root, 'progress.html') };
}

function matchSnapshot(snapshot, target) {
  const same = (left, right) => serial([...left].sort()) === serial([...right].sort());
  if (snapshot.run?.id !== target.run_id || snapshot.run.workspace_id !== target.workspace_id || snapshot.scenario?.id !== target.scenario_id ||
      snapshot.run.application_version !== target.application_version || snapshot.presentation?.parent_conversation_ref !== target.parent_conversation_ref ||
      !same(snapshot.run.agent_version_ids ?? [], target.agent_version_ids) || !same((snapshot.sessions ?? []).map(item => item.id), target.session_ids) ||
      snapshot.sessions.some(item => item.workspace_id !== target.workspace_id)) fail('target_mismatch');
}
async function checkedBytes(root, snapshotName, htmlName, target) {
  const snapshotBytes = await readProgressFile(root, snapshotName, LIMITS.snapshot);
  const html = await readProgressFile(root, htmlName, LIMITS.html);
  const snapshot = parse(snapshotBytes);
  const { renderHtml } = await import('./render.mjs');
  const result = renderHtml(snapshot);
  if (!result.ok) fail('invalid_reviewed_snapshot');
  matchSnapshot(snapshot, target);
  if (!Buffer.from(result.html).equals(html)) fail('html_mismatch');
  return { html, snapshotBytes };
}

export async function changeProgress(manifestPath, writerPath, sequence, operation, details = {}) {
  const initial = await load(manifestPath);
  const writerRoot = dirname(resolve(writerPath));
  if (writerRoot !== initial.root || basename(writerPath) !== WRITER) fail('invalid_writer_path');
  const writer = parse(await readProgressFile(writerRoot, WRITER));
  if (!exact(writer, ['invocation', 'writer', 'target']) || writer.invocation !== initial.invocation || writer.writer !== initial.writer ||
      serial(normalizeTarget(writer.target)) !== serial(initial.target)) fail('writer_mismatch');
  // One exclusive lock, no waiting/polling or unsafe lock recovery.
  await createFile(initial.root, 'progress.lock', 'locked');
  try {
    const record = await load(manifestPath);
    if (record.writer !== writer.writer || record.invocation !== writer.invocation || serial(record.target) !== serial(normalizeTarget(writer.target))) fail('writer_mismatch');
    if (!Number.isSafeInteger(sequence) || sequence !== record.sequence + 1) fail('stale_sequence');
    if (record.state === 'retired' || (record.state !== 'working' && operation !== 'retire')) fail('terminal_state');
    if (!['update', 'ready', 'blocked', 'retire'].includes(operation)) fail('invalid_operation');
    if (operation === 'update') {
      if (!exact(details, ['stage']) || !Object.hasOwn(ACTIVITIES, details.stage)) fail('invalid_stage');
      record.stage = details.stage;
    } else if (operation === 'ready') {
      if (!exact(details, ['snapshot', 'html']) || ['completed.snapshot.json', 'completed-review.html'].includes(details.snapshot) || ['completed.snapshot.json', 'completed-review.html'].includes(details.html)) fail('invalid_ready');
      const { html, snapshotBytes } = await checkedBytes(record.root, details.snapshot, details.html, record.target);
      await createFile(record.root, 'completed.snapshot.json', snapshotBytes, 0o400);
      await createFile(record.root, 'completed-review.html', html, 0o400);
      record.final = { sha256: digest(html), snapshot_sha256: digest(snapshotBytes) };
      record.state = 'ready';
    } else {
      if (!exact(details, [])) fail('invalid_operation');
      record.state = operation === 'retire' ? 'retired' : 'blocked';
    }
    record.sequence = sequence;
    await save(record);
    return { ok: true, sequence, state: record.state, ...(record.state === 'ready' ? { artifact_path: join(record.root, 'completed-review.html') } : {}) };
  } finally { await unlink(join(initial.root, 'progress.lock')); }
}

const privateBinding = record => serial([record.invocation, record.writer, record.root, record.root_identity, record.target]);
function publicStatus(record) {
  return { invocation: record.invocation, sequence: record.sequence, state: record.state,
    activity: record.state === 'working' ? ACTIVITIES[record.stage] : terminalActivity[record.state] };
}
function artifactCsp(html) {
  const match = html.toString('utf8').match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  if (!match) fail('missing_csp');
  return match[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export async function serveProgress(manifestPath, { lifetimeMs = 3600000 } = {}) {
  if (!Number.isSafeInteger(lifetimeMs) || lifetimeMs < 1 || lifetimeMs > 3600000) fail('invalid_lifetime');
  let record = await load(manifestPath), captured, capturedCsp, stopped = false, watcher, timeout, origin;
  const binding = privateBinding(record);
  if (record.state === 'retired') fail('terminal_state');
  let finish;
  const closed = new Promise(resolve => { finish = resolve; });
  let queue = Promise.resolve();
  const refresh = () => {
    const work = queue.then(async () => {
      if (stopped) fail('server_closed');
      const next = await load(manifestPath);
      if (privateBinding(next) !== binding || next.sequence < record.sequence ||
          (next.sequence === record.sequence && serial(next) !== serial(record)) ||
          (record.state !== 'working' && next.state !== record.state && next.state !== 'retired')) fail('stale_manifest');
      if (captured && next.state === 'ready' && serial(next.final) !== serial(record.final)) fail('changed_final');
      if (next.state === 'ready' && !captured) {
        const bytes = await checkedBytes(next.root, 'completed.snapshot.json', 'completed-review.html', next.target);
        if (digest(bytes.html) !== next.final.sha256 || digest(bytes.snapshotBytes) !== next.final.snapshot_sha256) fail('changed_final');
        captured = Buffer.from(bytes.html); capturedCsp = artifactCsp(captured);
      }
      record = next;
      return next;
    });
    queue = work.catch(() => {});
    return work;
  };
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-origin', 'X-Frame-Options': 'DENY', Connection: 'close' };
  const send = (req, res, code, content, type = 'text/plain; charset=utf-8', csp = "default-src 'none'; frame-ancestors 'none'") => {
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content);
    res.writeHead(code, { ...headers, 'Content-Type': type, 'Content-Length': body.length, 'Content-Security-Policy': csp });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  const server = createServer({ maxHeaderSize: 8192, headersTimeout: 5000, requestTimeout: 5000 }, async (req, res) => {
    const count = key => req.rawHeaders.filter((_, index) => index % 2 === 0 && req.rawHeaders[index].toLowerCase() === key).length;
    if (count('host') !== 1 || req.headers.host !== origin.slice(7) || count('origin') > 1 ||
        (req.headers.origin !== undefined && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') return send(req, res, 403, 'Unavailable');
    if (!['GET', 'HEAD'].includes(req.method)) return send(req, res, 405, 'Unavailable');
    if (req.rawHeaders.length > 64 || req.headers['transfer-encoding'] !== undefined ||
        (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0') || req.headers.expect || req.headers.upgrade) return send(req, res, 400, 'Unavailable');
    const prefix = `/${record.invocation}/`;
    if (![`${prefix}progress.html`, `${prefix}status.json`, `${prefix}final.html`].includes(req.url)) return send(req, res, 404, 'Unavailable');
    try {
      await refresh();
      if (record.state === 'retired') { send(req, res, 410, 'Unavailable'); close(); return; }
      if (req.url === `${prefix}status.json`) return send(req, res, 200, serial(publicStatus(record)), 'application/json; charset=utf-8');
      if (req.url === `${prefix}progress.html`) {
        const page = progressPage(record, true);
        return send(req, res, 200, page.html, 'text/html; charset=utf-8', `${page.csp}; frame-ancestors 'none'`);
      }
      if (record.state !== 'ready' || !captured) return send(req, res, 409, 'Unavailable');
      send(req, res, 200, captured, 'text/html; charset=utf-8', `${capturedCsp}; frame-ancestors 'none'`);
    } catch { send(req, res, 503, 'Unavailable'); close(); }
  });
  server.maxHeadersCount = 32;
  server.maxConnections = 16;
  server.setTimeout(5000, socket => socket.destroy());
  const rejectSocket = socket => socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nContent-Security-Policy: default-src 'none'\r\nContent-Length: 0\r\n\r\n");
  server.on('clientError', (_, socket) => rejectSocket(socket));
  server.on('upgrade', (_, socket) => rejectSocket(socket));
  server.on('connect', (_, socket) => rejectSocket(socket));
  server.on('error', close);
  server.on('listening', () => { if (stopped) { server.close(); server.closeAllConnections(); } });
  server.on('checkContinue', (req, res) => send(req, res, 400, 'Unavailable'));
  server.on('checkExpectation', (req, res) => send(req, res, 400, 'Unavailable'));
  function close() {
    if (stopped) return closed;
    stopped = true; watcher?.close(); clearTimeout(timeout);
    server.close(() => finish()); server.closeAllConnections();
    return closed;
  }
  try {
    // Exclusive lifetime marker: never launch a duplicate server for an invocation.
    await createFile(record.root, 'server.private.json', serial({ invocation: record.invocation }));
    watcher = watchDirectory(record.root, (_, filename) => {
      if (filename === MANIFEST || filename === null) refresh().then(next => { if (next.state === 'retired') close(); }).catch(close);
    });
    watcher.on('error', close);
    await refresh();
    if (stopped || record.state === 'retired') fail('terminal_state');
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    if (stopped || !server.listening) fail('terminal_state');
    origin = `http://127.0.0.1:${server.address().port}`;
    timeout = setTimeout(close, lifetimeMs); timeout.unref();
    return { ok: true, url: `${origin}/${record.invocation}/progress.html`, close, closed };
  } catch (error) { await close(); throw error; }
}

// A finite foreground command owns the startup handshake. No host background-log
// read, shell detachment, model/task polling or browser automation is required.
export async function launchProgress(manifestPath, { spawnServer = fork, startupMs = 10000 } = {}) {
  const record = await load(manifestPath);
  if (record.state !== 'working') fail('terminal_state');
  if (!Number.isSafeInteger(startupMs) || startupMs < 1 || startupMs > 10000) fail('invalid_startup_timeout');
  let child;
  try {
    return await new Promise((done, reject) => {
      child = spawnServer(new URL(import.meta.url), ['serve', resolve(manifestPath)], {
        detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true,
      });
      let settled = false;
      const finish = (error, receipt) => {
        if (settled) return;
        settled = true; clearTimeout(timeout);
        if (!error) {
          try { child.disconnect(); child.unref(); done(receipt); return; }
          catch (failure) { error = failure; }
        }
        try { child.kill('SIGTERM'); } catch { /* only this startup child */ }
        reject(error);
      };
      const timeout = setTimeout(() => finish(new Error('Startup timed out')), startupMs);
      child.once('error', error => finish(error));
      child.once('exit', () => finish(new Error('Server exited')));
      child.once('message', receipt => {
        let url;
        try { url = new URL(receipt.url); } catch { /* reject below */ }
        if (!exact(receipt, ['ok', 'url']) || receipt.ok !== true || !url ||
            url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port ||
            url.username || url.password || url.search || url.hash ||
            url.pathname !== `/${record.invocation}/progress.html`) return finish(new Error('Invalid startup receipt'));
        finish(null, { live: true, url: url.href });
      });
    });
  } catch {
    // The immediate static file survives denied spawning/listening or startup
    // failure. Do not retry, remove the lifetime marker or claim live delivery.
    return { live: false, code: 'local_progress_unavailable' };
  }
}
export async function progressCli(args) {
  const [command, ...rest] = args;
  if (['begin', 'start'].includes(command) && rest.length === 2) {
    const path = resolve(rest[1]);
    const target = parse(await readProgressFile(await realpath(dirname(path)), basename(path)));
    const initial = await beginProgress(rest[0], target);
    return command === 'start' ? { ...initial, ...await launchProgress(initial.manifest_path) } : initial;
  }
  if (command === 'serve' && rest.length === 1) return serveProgress(rest[0]);
  if (['update', 'ready', 'blocked', 'retire'].includes(command)) {
    const length = command === 'update' ? 4 : command === 'ready' ? 5 : 3;
    if (rest.length !== length || !/^[1-9][0-9]{0,14}$/.test(rest[2])) fail('invalid_arguments');
    return changeProgress(rest[0], rest[1], Number(rest[2]), command,
      command === 'update' ? { stage: rest[3] } : command === 'ready' ? { snapshot: rest[3], html: rest[4] } : {});
  }
  fail('invalid_arguments');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let ownedServer, receipted = false;
  const disconnected = () => { if (!receipted) ownedServer?.close(); };
  if (process.send) process.once('disconnect', disconnected);
  try {
    const result = await progressCli(process.argv.slice(2));
    ownedServer = result.closed ? result : undefined;
    const receipt = result.closed ? { ok: true, url: result.url } : result;
    if (process.send) {
      if (!process.connected) { await ownedServer?.close(); fail('server_closed'); }
      // Mark before send's callback: a valid receiver can disconnect as soon as
      // it gets the receipt. A failed send still closes the server in catch.
      receipted = true;
      await new Promise((resolve, reject) => process.send(receipt, error => error ? reject(error) : resolve()));
    } else console.log(serial(receipt));
    if (result.closed) {
      const stop = () => result.close();
      process.once('SIGTERM', stop); process.once('SIGINT', stop);
      await result.closed;
      process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop);
    }
  } catch (error) {
    await ownedServer?.close();
    // Never serialize raw filesystem/renderer errors, source excerpts or targets.
    const known = /^(invalid_|unsafe_|oversize_|changed_|target_|writer_|stale_|terminal_|html_|missing_|server_)/.test(error.code ?? '');
    console.log(serial({ ok: false, code: known ? error.code : 'local_progress_unavailable' }));
    process.exitCode = 1;
  }
}
