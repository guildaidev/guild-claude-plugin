// Explicit local real-browser verification, not a native/model evaluation.
// node check-progress-browser.mjs /absolute/existing/playwright NEW_PRIVATE_DIRECTORY
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { beginProgress, changeProgress, serveProgress } from '../scripts/progress.mjs';
import { concernFixture } from './concern-fixture.mjs';
import { renderHtml } from '../scripts/render.mjs';

const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const output = resolve(process.argv[3]);
await mkdir(output, { mode: 0o700 });
const { doc } = concernFixture(), source = JSON.stringify(doc);
assert.equal(doc.schema_version, '1.10');
assert.equal(doc.copy_review, undefined); assert.equal(doc.review, undefined);
const rendered = renderHtml(doc); assert.equal(rendered.ok, true);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const target = { workspace_id: doc.run.workspace_id, profile_id: 'synthetic-profile',
  scenario_id: doc.scenario.id, run_id: doc.run.id, session_ids: doc.sessions.map(item => item.id),
  agent_version_ids: doc.run.agent_version_ids, application_version: doc.run.application_version,
  parent_conversation_ref: doc.presentation.parent_conversation_ref };
const targetPath = join(output, 'target.json');
await writeFile(targetPath, JSON.stringify(target), { flag: 'wx', mode: 0o600 });
const started = spawnSync(process.execPath, [new URL('../scripts/progress.mjs', import.meta.url).pathname, 'start', output, targetPath], { encoding: 'utf8', timeout: 15000 });
assert.equal(started.error, undefined); assert.equal(started.status, 0); assert.equal(started.stderr, '');
const runtime = JSON.parse(started.stdout); assert.equal(runtime.live, true);
const initialHtml = await readFile(runtime.artifact_path);
await writeFile(join(output, 'loading-static.html'), initialHtml, { flag: 'wx', mode: 0o600 });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const servers = [], consoleErrors = [], pageErrors = [], externalRequests = [], expectedDisconnectErrors = [];
let retired, sequence = 0;
const server = { url: runtime.url, close: () => retired ??= changeProgress(runtime.manifest_path, runtime.writer_path, sequence + 1, 'retire') };
servers.push(server);
let disconnecting = false;
page.on('pageerror', error => pageErrors.push(error.message));
page.on('console', message => {
  if (message.type() !== 'error') return;
  if (disconnecting && /net::ERR_CONNECTION_REFUSED|net::ERR_CONNECTION_RESET|net::ERR_SOCKET_NOT_CONNECTED|net::ERR_FAILED|Failed to fetch/.test(message.text())) expectedDisconnectErrors.push(message.text());
  else consoleErrors.push(message.text());
});
await page.route('**/*', async route => {
  const url = route.request().url();
  if (/^https?:/.test(url) && !url.startsWith('http://127.0.0.1:')) { externalRequests.push(url); await route.abort(); }
  else await route.continue();
});
const capture = async name => {
  const path = join(output, name); await page.screenshot({ path }); await chmod(path, 0o600);
};
const change = async (next, operation, details = {}) => {
  const result = await changeProgress(runtime.manifest_path, runtime.writer_path, next, operation, details);
  sequence = next; return result;
};
try {
  await page.goto(pathToFileURL(join(output, 'loading-static.html')).href);
  assert.equal(await page.locator('h1').innerText(), 'Generating test run timeline');
  assert.equal(await page.locator('#connection').count(), 0);
  assert.doesNotMatch(await page.locator('body').innerText(), /Live updates are unavailable|original conversation/);
  assert.equal(await page.locator('script').count(), 0);
  await capture('loading-static.png');
  // Open the finite startup receipt, not the static artifact path. Keep a stale
  // file tab as a regression of the actual smoke failure; disk writes cannot
  // magically update that already-loaded document.
  const staticTab = await context.newPage();
  await staticTab.goto(pathToFileURL(runtime.artifact_path).href);
  await page.goto(server.url);
  assert.equal(await page.locator('h1').innerText(), 'Generating test run timeline');
  assert.equal(await page.locator('#activity').innerText(), 'Gathering evidence.');
  assert.equal(await page.locator('progress').getAttribute('value'), null);
  assert.equal(await page.locator('main').getAttribute('aria-busy'), 'true');
  assert.notEqual(await page.locator('.dots i').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  await capture('loading-desktop.png');
  await change(1, 'update', { stage: 'arranging' });
  await page.waitForFunction(() => document.querySelector('#activity').textContent === 'Arranging the timeline.');
  await change(2, 'update', { stage: 'checking' });
  await page.waitForFunction(() => document.querySelector('#activity').textContent === 'Checking details.');
  assert.equal(await staticTab.locator('#activity').innerText(), 'Gathering evidence.');
  assert.match(await readFile(runtime.artifact_path, 'utf8'), /Checking details/);
  await staticTab.close();
  await capture('loading-checking-desktop.png');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.dots i').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await page.locator('progress').evaluate(el => getComputedStyle(el).display), 'none');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await capture('loading-mobile-reduced-motion.png');
  assert.doesNotMatch(await page.locator('body').innerText(), /synthetic-profile|workspace-1|candidate_digest|reviewer_id|copy_review/);
  await writeFile(join(runtime.directory, 'checked.snapshot.json'), source, { flag: 'wx', mode: 0o600 });
  await writeFile(join(runtime.directory, 'checked.html'), rendered.html, { flag: 'wx', mode: 0o600 });
  await change(3, 'update', { stage: 'polishing' });
  await page.waitForFunction(() => document.querySelector('#activity').textContent === 'Polishing the text.');
  await capture('loading-polishing-mobile.png');
  const ready = await change(4, 'ready', { snapshot: 'checked.snapshot.json', html: 'checked.html' });
  await page.waitForURL(url => url.pathname.endsWith('/final.html'));
  await page.locator('#review-prompt').waitFor();
  assert.equal(await page.locator('#review-prompt').isDisabled(), true);
  assert.equal(await page.locator('#activity').count(), 0);
  const response = await context.request.get(page.url());
  assert.equal(await response.text(), rendered.html);
  assert.match(response.headers()['content-security-policy'], /connect-src 'none'/);
  assert.equal(await readFile(ready.artifact_path, 'utf8'), rendered.html);
  await capture('loading-final-mobile.png');
  await page.setViewportSize({ width: 1280, height: 900 }); await capture('loading-final-desktop.png');
  await server.close();
  // The durable offline result remains usable after the exact server stops.
  await page.goto(pathToFileURL(ready.artifact_path).href); await page.locator('#review-prompt').waitFor();
  const blocked = await beginProgress(output, target);
  const blockedServer = await serveProgress(blocked.manifest_path); servers.push(blockedServer);
  await page.goto(blockedServer.url);
  await changeProgress(blocked.manifest_path, blocked.writer_path, 1, 'blocked');
  await page.waitForFunction(() => document.querySelector('#activity').textContent === 'Live updates have stopped.');
  assert.equal(await page.locator('main').getAttribute('aria-busy'), 'false');
  assert.equal(await page.locator('.dots i').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  await capture('loading-blocked.png');
  await changeProgress(blocked.manifest_path, blocked.writer_path, 2, 'retire'); await blockedServer.closed;
  const disconnected = await beginProgress(output, target);
  const disconnectedServer = await serveProgress(disconnected.manifest_path); servers.push(disconnectedServer);
  await page.goto(disconnectedServer.url);
  disconnecting = true; await disconnectedServer.close();
  await page.waitForFunction(() => document.querySelector('#activity').textContent === 'Live updates are unavailable.');
  assert.match(await page.locator('#connection').innerText(), /does not tell us whether the review has finished/);
  assert.equal(await page.locator('main').getAttribute('aria-busy'), 'false');
  await capture('loading-disconnected.png');
  assert.equal(JSON.stringify(doc), source); assert.deepEqual(consoleErrors, []); assert.deepEqual(pageErrors, []); assert.deepEqual(externalRequests, []);
  await writeFile(join(output, 'report.json'), JSON.stringify({ ok: true, origin: 'synthetic',
    runtime_directory: runtime.directory, final_artifact: ready.artifact_path,
    static_first: true, finite_cli_start: true, server_survives_launcher: true,
    static_tab_does_not_live_update: true, schema_version: doc.schema_version,
    optional_reviews_absent: true, truthful_stages: true, automatic_matching_navigation: true,
    mobile_no_overflow: true, reduced_motion: true, blocked_stops: true, disconnect_stops: true,
    offline_final_after_shutdown: true, source_sha256: hash(source), html_sha256: hash(rendered.html),
    console_errors: consoleErrors, page_errors: pageErrors, external_requests: externalRequests,
    expected_disconnect_errors: expectedDisconnectErrors }, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ok: true, output, final_artifact: ready.artifact_path }));
} finally {
  await Promise.all(servers.map(server => server.close())); await browser.close();
}
