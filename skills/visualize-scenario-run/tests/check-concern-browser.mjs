// Explicit local browser regression. No model calls, service writes or acceptance.
// node check-concern-browser.mjs EXISTING_PLAYWRIGHT NEW_PRIVATE_OUTPUT_DIRECTORY
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { concernFixture, humanConcern, humanFix, technicalFix } from './concern-fixture.mjs';
import { renderHtml } from '../scripts/render.mjs';

assert.ok(process.argv[2] && process.argv[3], 'Provide existing Playwright and a NEW private output directory.');
const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const out = resolve(process.argv[3]);
await mkdir(out, { mode: 0o700 });
const { doc } = concernFixture(), original = structuredClone(doc);
const result = renderHtml(doc);
assert.equal(result.ok, true, JSON.stringify(result.errors));
const html = join(out, 'synthetic-concern.html');
await writeFile(html, result.html, { flag: 'wx', mode: 0o600 });
const errors = [], requests = [], checks = [], screenshots = [];
const report = { ok: false, output_directory: out, checks, errors, external_requests: requests, screenshots,
  provenance: 'Synthetic authored concern, human fix and separate technical prompt. No native review or source truth claim.' };
const browser = await chromium.launch({ headless: true });
let page;
try {
  const context = await browser.newContext();
  await context.route('**/*', async route => {
    if (/^https?:/.test(route.request().url())) { requests.push(route.request().url()); await route.abort(); }
    else await route.continue();
  });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const capture = async name => { const path = join(out, name); await page.screenshot({ path }); await chmod(path, 0o600); screenshots.push(path); };
  for (const [width, height, reducedMotion] of [[1728, 873, 'no-preference'], [1280, 900, 'no-preference'], [390, 700, 'no-preference'], [390, 560, 'reduce']]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion });
    await page.goto(pathToFileURL(html).href);
    const block = page.locator('[data-concern-event="draft-1"]');
    const summary = block.locator('summary');
    const dismiss = block.locator('[data-dismiss-concern]');
    assert.equal(await block.locator('summary button').count(), 0);
    assert.equal(await block.locator('.detail-body').isVisible(), false);
    const geometry = await block.evaluate(node => {
      const a = node.querySelector('summary').getBoundingClientRect(), b = node.querySelector('[data-dismiss-concern]').getBoundingClientRect();
      return { gap: b.left - a.right, verticalOverlap: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
        absolute: getComputedStyle(node.querySelector('[data-dismiss-concern]')).position === 'absolute' };
    });
    assert.ok(geometry.gap >= 0 && geometry.gap <= 12, JSON.stringify(geometry));
    assert.ok(geometry.verticalOverlap > 0, JSON.stringify(geometry));
    assert.equal(geometry.absolute, false);
    await summary.focus(); await page.keyboard.press('Enter');
    assert.equal(await block.locator('.detail-body').isVisible(), true);
    const openGeometry = await block.evaluate(node => {
      const a = node.querySelector('summary').getBoundingClientRect(), b = node.querySelector('[data-dismiss-concern]').getBoundingClientRect(),
        body = node.querySelector('.detail-body').getBoundingClientRect(), box = node.getBoundingClientRect();
      return { summaryWidth: a.width, summaryHeight: a.height, gap: b.left - a.right, bodyWidth: body.width, boxWidth: box.width };
    });
    assert.ok(openGeometry.summaryWidth >= 150 && openGeometry.summaryHeight < 70, JSON.stringify(openGeometry));
    assert.ok(openGeometry.gap >= 0 && openGeometry.gap <= 12, JSON.stringify(openGeometry));
    assert.ok(openGeometry.bodyWidth <= openGeometry.boxWidth + 1, JSON.stringify(openGeometry));
    assert.deepEqual(await block.locator('h3').allTextContents(), ['Claude’s concern', 'Suggested fix']);
    assert.deepEqual(await block.locator('.detail-body > p').allTextContents(), [humanConcern, humanFix]);
    assert.doesNotMatch(await block.innerText(), /Outcome:|Recorded problem|Recorded effect|Workflow impact|save_draft/);
    const add = block.getByRole('button', { name: 'Add suggested fix to prompt', exact: true });
    assert.equal(await add.isEnabled(), true);
    const contextBytes = await page.locator('#feedback-context').inputValue();
    await capture(`concern-${width}x${height}.png`);
    await add.click();
    assert.equal(await page.locator('#prompt-count').innerText(), '1');
    assert.equal(await block.locator('[data-add-fix]').isDisabled(), true);
    await dismiss.focus(); await page.keyboard.press('Space');
    assert.equal(await page.locator('[data-concern-event]').count(), 0);
    assert.equal(await page.locator('#draft-1 .event-details > summary').evaluate(node => node === document.activeElement), true);
    assert.equal(await page.locator('#prompt-count').innerText(), '1');
    assert.equal(await page.locator('#feedback-context').inputValue(), contextBytes);
    await page.locator('#review-prompt').click();
    const prompt = await page.locator('#prompt-preview').inputValue();
    assert.ok(prompt.includes(technicalFix));
    assert.equal(prompt.split(technicalFix).length - 1, 1);
    assert.ok(!prompt.includes(humanFix));
    assert.doesNotMatch(prompt, /reviewer_id|copy_review|candidate_digest|factual_digest/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    for (const selector of ['style', 'script']) {
      const hash = createHash('sha256').update(await page.locator(selector).textContent()).digest('base64');
      assert.ok(csp.includes(`'sha256-${hash}'`));
    }
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
    await capture(`technical-prompt-${width}x${height}.png`);
    await page.keyboard.press('Escape'); await page.reload();
    assert.equal(await page.locator('[data-concern-event]').count(), 1);
    assert.equal(await page.locator('#prompt-count').innerText(), '0');
    checks.push({ width, height, reducedMotion, inline_dismiss: geometry, human_copy_separate: true,
      exact_technical_prompt: true, keyboard_dismiss_focus: true, cart_survives_dismiss: true, reload_resets: true, strict_csp: true });
  }
  assert.deepEqual(doc, original);
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  report.ok = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) { const path = join(out, 'failure.png'); await page.screenshot({ path }).catch(() => {}); await chmod(path, 0o600).catch(() => {}); }
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
}
