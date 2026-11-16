// Explicit offline regression from immutable retained console messages. No service
// calls, model runs, native reloads, review approval or original-file writes.
// node check-retained-artifact-diff.mjs EXISTING_PLAYWRIGHT RETAINED_REVIEW NEW_OUT
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspect } from '../scripts/inspect.mjs';
import { renderFile } from '../scripts/render.mjs';
import { contentDiff } from '../scripts/diff.mjs';
import { artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';

const [playwright, review, output] = process.argv.slice(2).map(value => resolve(value));
assert.ok(playwright && review && output);
await mkdir(output, { mode: 0o700 });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['bundle.json', 'version-sources.json', 'draft2.json', 'final.json', 'session-events.json', 'evidence-report.json', 'new-review.html'];
const originals = new Map(await Promise.all(files.map(async name => [name, await readFile(join(review, name))])));
const load = name => JSON.parse(originals.get(name));
const bundle = load('bundle.json'), sidecar = load('version-sources.json'), draft = load('draft2.json');
const sourceByID = new Map(bundle.evidence.map(e => [e.id, e]));
const sequence = evidence => JSON.parse(evidence.content.event.content.message).sequence;
const operation = evidence => JSON.parse(evidence.content.event.content.message).operation_id;
const occurrenceByOperation = new Map();
for (const binding of sidecar.bindings) {
  const op = operation(sourceByID.get(binding.evidence_id));
  assert.ok(!occurrenceByOperation.has(op) || occurrenceByOperation.get(op) === binding.occurrence_id);
  occurrenceByOperation.set(op, binding.occurrence_id);
}
const paths = Object.fromEntries(['evidence-report', 'bundle', 'version-sources', 'draft', 'candidate', 'final'].map(name => [name, join(output, `${name}.json`)]));
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
assert.equal((await inspect('session-evidence', join(review, 'session-events.json'), paths['evidence-report'], new Date().toISOString())).ok, true);
const collected = JSON.parse(await readFile(paths['evidence-report']));
assert.deepEqual(collected.gaps, []); assert.equal(collected.evidence.length, 11);
const bindings = new Map(sidecar.bindings.map(binding => [binding.evidence_id, binding]));
for (const evidence of collected.evidence) {
  const record = JSON.parse(evidence.content.event.content.message);
  const occurrence = bundle.occurrences.find(e => e.id === occurrenceByOperation.get(record.operation_id));
  assert.ok(occurrence, 'Only an already bound actual operation can be extended');
  if (sourceByID.has(evidence.id)) {
    assert.equal(sourceByID.get(evidence.id).content.event.content.message, evidence.content.event.content.message);
    continue;
  }
  bundle.evidence.push(evidence); sourceByID.set(evidence.id, evidence);
  occurrence.evidence_refs.push(evidence.id);
  // NEW assembly only: include the actual newly retained request time in its
  // bounded occurrence window. Never backdate the readback or edit old metadata.
  occurrence.time = {
    earliest: new Date(Math.min(Date.parse(occurrence.time.earliest ?? occurrence.time.at), Date.parse(record.at))).toISOString(),
    latest: new Date(Math.max(Date.parse(occurrence.time.latest ?? occurrence.time.at), Date.parse(evidence.content.event.created_at))).toISOString(),
  };
  bindings.set(evidence.id, { evidence_id: evidence.id, occurrence_id: occurrence.id,
    ...(record.source.record_id !== occurrence.world_effect.target ? { unresolved_target: true } : {}) });
}
sidecar.bindings = [...bindings.values()].sort((a, b) => sequence(sourceByID.get(a.evidence_id)) - sequence(sourceByID.get(b.evidence_id)));
assert.deepEqual(sidecar.bindings.map(binding => sequence(sourceByID.get(binding.evidence_id))), Array.from({ length: 11 }, (_, i) => i + 1));
sidecar.bundle_digest = artifactVersionBundleDigest(bundle);
draft.snapshot_id += '-offline-receipt-proof';
await save(paths.bundle, bundle); await save(paths['version-sources'], sidecar); await save(paths.draft, draft);
const assembled = await inspect('assemble', paths.bundle, paths.draft, paths.candidate, paths['version-sources']);
assert.equal(assembled.ok, true, JSON.stringify(assembled.errors));
assert.equal((await inspect('finalize', paths.candidate, paths.final, '-', '-')).ok, true);
const doc = JSON.parse(await readFile(paths.final));
const artifactAt = id => doc.artifacts.find(a => doc.timeline.find(e => e.id === id).artifact_refs.includes(a.id));
const initial = artifactAt('create-doc'), first = artifactAt('insert-first'), later = artifactAt('append-second');
assert.equal(initial.after, '\n'); assert.equal(Object.hasOwn(initial, 'before'), false);
assert.equal(first.before, initial.after); assert.equal(later.before, first.after);
assert.ok(first.after.length > 1 && later.after.length > first.after.length);
for (const artifact of [initial, first, later]) {
  const evidence = sourceByID.get(artifact.evidence_refs.find(id => id === artifact.id.replace('version:', 'log:')));
  assert.equal(artifact.after, JSON.parse(evidence.content.event.content.message).material.content);
}
const comparisons = [first, later].map(a => {
  const rows = contentDiff(a.before, a.after);
  assert.equal(rows.filter(r => r.kind !== 'added').map(r => r.text).join(''), a.before);
  assert.equal(rows.filter(r => r.kind !== 'removed').map(r => r.text).join(''), a.after);
  assert.equal(rows.filter(r => r.kind === 'removed').length, 0);
  return { before_sha256: hash(a.before), after_sha256: hash(a.after), added: rows.filter(r => r.kind === 'added').map(r => r.text).join(''), context: rows.filter(r => r.kind === 'context').map(r => r.text).join('') };
});
assert.equal(comparisons[0].context, '\n');
assert.equal(comparisons[0].added, first.after.slice(0, -1));
assert.equal(comparisons[1].context, first.after);
const appendRequest = collected.evidence.find(evidence => sequence(evidence) === 9);
assert.equal(comparisons[1].added, JSON.parse(appendRequest.content.event.content.message).material.content,
  'The observed delta also matches the captured request; neither substitutes for the other');
const html = join(output, 'offline-retained-source-reassembly.html');
assert.equal((await renderFile(paths.final, html)).ok, true);
const unchanged = join(output, 'current-ui-original-snapshot.html');
assert.equal((await renderFile(join(review, 'final.json'), unchanged)).ok, true);
const originalPresentationMatches = (await readFile(unchanged)).equals(originals.get('new-review.html'));
// Presentation may change independently: this follow-up moves the prompt state
// into the header and removes the inner scroller. Original source/HTML bytes are
// asserted unchanged below, not silently regenerated to a new historical file.
const { chromium } = createRequire(import.meta.url)(playwright);
const browser = await chromium.launch({ headless: true });
const errors = [], requests = [], checks = [], screenshots = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/*', async route => {
    if (/^https?:/.test(route.request().url())) { requests.push(route.request().url()); await route.abort(); }
    else await route.continue();
  });
  for (const mode of [
    { name: 'desktop', width: 1280, height: 900, forcedColors: 'none', reducedMotion: 'no-preference' },
    { name: 'mobile-reduced', width: 390, height: 700, forcedColors: 'none', reducedMotion: 'reduce' },
    { name: 'forced-colors', width: 1280, height: 900, forcedColors: 'active', reducedMotion: 'reduce' },
  ]) {
    await page.setViewportSize(mode); await page.emulateMedia(mode);
    await page.goto(pathToFileURL(html).href);
    assert.equal(await page.locator('.top .prompt-state').count(), 1);
    assert.equal(await page.locator('.prompt-bar').count(), 0);
    assert.equal(await page.locator('#create-doc .business-artifact').count(), 0, 'A real empty baseline stays internal rather than displaying an empty card');
    assert.equal(await page.locator('.content-diff[aria-label="Content changes"]').count(), 2);
    assert.equal(await page.locator('.diff-removed').count(), 0);
    for (const id of ['insert-first', 'append-second']) {
      const event = page.locator(`#${id}`), diff = event.locator('.content-diff');
      assert.ok(await diff.locator('ins.diff-text').count() > 0);
      assert.ok((await diff.locator('.diff-marker').allTextContents()).includes('+'));
      assert.ok((await diff.locator('.diff-added .sr-only').allTextContents()).every(text => text === 'Added: '));
      const color = await diff.locator('.diff-added').first().evaluate(n => getComputedStyle(n).backgroundColor);
      if (mode.forcedColors === 'none') assert.equal(color, 'rgb(32, 60, 45)');
      await event.locator('.business-artifact > h3').scrollIntoViewIfNeeded();
      const path = join(output, `${mode.name}-${id}.png`);
      await page.screenshot({ path }); await chmod(path, 0o600); screenshots.push(path);
      if (id === 'append-second') {
        await diff.locator('.diff-added').first().scrollIntoViewIfNeeded();
        const addedPath = join(output, `${mode.name}-${id}-additions.png`);
        await page.screenshot({ path: addedPath }); await chmod(addedPath, 0o600); screenshots.push(addedPath);
      }
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.ok(csp.includes("connect-src 'none'")); assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
    await page.goto(pathToFileURL(html).href);
    assert.equal(await page.locator('#prompt-count').innerText(), '0');
    await page.locator('[data-comment]').first().click();
    await page.locator('#comment-text').fill('Retain the captured document versions.');
    await page.locator('#save-comment').click(); await page.locator('#review-prompt').click();
    assert.match(await page.locator('#prompt-preview').inputValue(), /Retain the captured document versions\./);
    assert.doesNotMatch(await page.locator('#prompt-preview').inputValue(), /copy_review|candidate_digest|reviewer_id/);
    await page.keyboard.press('Escape');
    checks.push({ ...mode, diff_count: 2, additions_green_or_forced_color_marked: true, exact_source_versions: true, cart: true, csp: true, overflow: false });
  }
  await page.goto(pathToFileURL(join(review, 'new-review.html')).href);
  assert.equal(await page.locator('.content-diff[aria-label="Content changes"]').count(), 0);
} finally { await browser.close(); }
assert.deepEqual(errors, []); assert.deepEqual(requests, []);
for (const [name, bytes] of originals) assert.deepEqual(await readFile(join(review, name)), bytes);
await save(join(output, 'report.json'), { ok: true,
  origin: 'Offline deterministic reassembly of exact retained console envelopes; not a new generation, review, native run or replacement for the original artifact.',
  limitations: 'Original source and historical gap prose are preserved, not reauthored. The creation-request target remains unresolved. Readbacks are application-reported, not independent source verification.',
  original_files: Object.fromEntries([...originals].map(([name, bytes]) => [name, { path: join(review, name), sha256: hash(bytes), unchanged: true }])),
  original_snapshot_reproduces_exact_html: originalPresentationMatches,
  presentation_change: 'Current header/document-scroll presentation is independent of unchanged historical source and HTML bytes.',
  collected_records: 11, collection_gaps: collected.gaps,
  comparison_bytes: comparisons.map(({ added, context, ...rest }) => ({ ...rest, added_utf16: added.length, context_utf16: context.length })),
  checks, screenshots, console_errors: errors, external_requests: requests });
console.log(JSON.stringify({ ok: true, report: join(output, 'report.json'), html, screenshots }));
