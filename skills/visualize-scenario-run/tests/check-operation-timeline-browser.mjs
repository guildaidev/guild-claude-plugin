// SCRIPTED evidence only. No model, native application, source-service or clipboard calls.
// node check-operation-timeline-browser.mjs EXISTING_PLAYWRIGHT NEW_OUTPUT_DIRECTORY
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { serialOperationTimelineFixture, operationTimelineDraft } from './operation-timeline-fixture.mjs';
import { packagePostrun } from '../scripts/postrun-package.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { renderHtml } from '../scripts/render.mjs';

const [playwright, output] = process.argv.slice(2).map(value => resolve(value));
assert.ok(playwright && output);
await mkdir(output, { mode: 0o700 });
const input = serialOperationTimelineFixture(), original = JSON.stringify(input);
const packaged = packagePostrun(input); assert.equal(packaged.ok, true);
const assembled = assembleCandidate(packaged.bundle, operationTimelineDraft(packaged), { artifactVersionSource: packaged.artifactVersionSource });
assert.equal(assembled.ok, true);
const doc = assembled.snapshot, before = JSON.stringify(doc), rendered = renderHtml(doc);
assert.equal(rendered.ok, true);
const file = join(output, 'operation-timeline.html');
await writeFile(file, rendered.html, { flag: 'wx', mode: 0o600 });
const { chromium } = createRequire(import.meta.url)(playwright), browser = await chromium.launch({ headless: true });
const errors = [], requests = [], checks = [], screenshots = [];
const hiddenMechanics = /artifact_observed|mutation_requested|mutation_acknowledged|console_log|readback|read back|Private implementation evidence/i;
// The HTML parser normalizes line endings in displayed text. The source strings
// remain byte-exact in the independently checked immutable candidate and input.
const displayedText = value => value.replace(/\r\n?/g, '\n');
try {
  for (const mode of [
    { width: 1280, height: 900, reducedMotion: 'no-preference', forcedColors: 'none' },
    { width: 390, height: 700, reducedMotion: 'no-preference', forcedColors: 'none' },
    { width: 390, height: 560, reducedMotion: 'reduce', forcedColors: 'none' },
    { width: 1280, height: 900, reducedMotion: 'reduce', forcedColors: 'active' },
  ]) {
    const page = await browser.newPage({ viewport: { width: mode.width, height: mode.height }, reducedMotion: mode.reducedMotion, forcedColors: mode.forcedColors });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/*', async route => {
      if (/^https?:/.test(route.request().url())) { requests.push(route.request().url()); await route.abort(); }
      else await route.continue();
    });
    await page.goto(pathToFileURL(file).href);
    assert.equal(await page.locator('article.event').count(), 4);
    const titles = await page.locator('.event-title').allTextContents();
    assert.deepEqual(titles, doc.timeline.map(event => event.description));
    assert.ok(titles.some(title => title.includes('normalized')));
    assert.equal(await page.locator('.content-diff').count(), 2);
    for (const event of doc.timeline.filter(event => event.artifact_refs.some(id => doc.artifacts.find(a => a.id === id)?.before !== undefined))) {
      const article = page.locator(`article[id="${event.id}"]`);
      assert.equal(await article.locator('.content-diff').count(), 1);
      const artifact = doc.artifacts.find(a => event.artifact_refs.includes(a.id));
      const rows = await article.locator('.diff-line').evaluateAll(nodes => nodes.map(node => ({
        kind: node.classList.contains('diff-added') ? 'added' : node.classList.contains('diff-removed') ? 'removed' : 'context',
        text: node.querySelector('.diff-text')?.textContent ?? '',
      })));
      assert.equal(rows.filter(row => row.kind !== 'added').map(row => row.text).join(''), displayedText(artifact.before));
      assert.equal(rows.filter(row => row.kind !== 'removed').map(row => row.text).join(''), displayedText(artifact.after));
      assert.match(await article.innerText(), /Added/);
    }
    assert.equal(hiddenMechanics.test(await page.locator('body').innerText()), false);
    await page.locator('.event-details').evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
    assert.equal(hiddenMechanics.test(await page.locator('body').innerText()), false, 'Validation is not relocated into public source details.');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.equal(await page.locator('.scenario').evaluate(node => getComputedStyle(node).overflowY), 'visible');
    await page.locator('.comment-control').first().click();
    await page.locator('#comment-text').fill('Preserve this workflow.');
    await page.locator('#save-comment').click();
    assert.equal(await page.locator('#prompt-count').innerText(), '1');
    await page.locator('#review-prompt').click();
    const prompt = await page.locator('#prompt-preview').inputValue();
    assert.match(prompt, /Preserve this workflow\./);
    assert.equal(hiddenMechanics.test(prompt), false);
    await page.keyboard.press('Escape');
    await page.locator('.event-details').evaluateAll(nodes => nodes.forEach(node => { node.open = false; }));
    await page.evaluate(() => scrollTo(0, 0));
    const name = `operations-${mode.width}x${mode.height}-${mode.forcedColors}.png`, png = join(output, name);
    await page.screenshot({ path: png, fullPage: true }); await chmod(png, 0o600); screenshots.push(png);
    checks.push({ ...mode, business_steps: 4, action_attached_diffs: 2, specified_process_visible: true, validation_private: true, prompt: true, overflow: false });
    await page.close();
  }
} finally { await browser.close(); }
assert.equal(JSON.stringify(input), original); assert.equal(JSON.stringify(doc), before);
assert.deepEqual(errors, []); assert.deepEqual(requests, []);
const report = { ok: true, origin: 'SCRIPTED source records; not a native run or approval.', html: file,
  html_sha256: createHash('sha256').update(rendered.html).digest('hex'), source_unchanged: true, checks, screenshots, console_errors: errors, external_requests: requests };
await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify(report));
