// Deterministic presentation checks only. No native run, model call, real
// clipboard write, application mutation, review fabrication or source rewrite.
// node check-header-prompt-browser.mjs EXISTING_PLAYWRIGHT NEW_OUTPUT_DIR [EXACT_SNAPSHOT_JSON]
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderHtml } from '../scripts/render.mjs';
import { feedbackRuntime } from '../scripts/feedback.mjs';
import { validatedFeedbackContext as feedbackContext } from '../scripts/feedback-context.mjs';
import { concernFixture, technicalFix } from './concern-fixture.mjs';

const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const out = resolve(process.argv[3]);
await mkdir(out, { mode: 0o700 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePath = process.argv[4] ? resolve(process.argv[4]) : null;
const sourceBytes = sourcePath ? await readFile(sourcePath) : null;
const fixture = concernFixture().doc;
const actual = sourceBytes ? JSON.parse(sourceBytes) : null;
const inputs = [];
for (const [label, doc] of [['synthetic', fixture], ...(actual ? [['actual-source', actual]] : [])]) {
  const before = JSON.stringify(doc), result = renderHtml(doc);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(JSON.stringify(doc), before);
  const path = join(out, `${label}.html`);
  await writeFile(path, result.html, { flag: 'wx', mode: 0o600 });
  inputs.push({ label, doc, path, html: result.html });
}
// Deliberately difficult but valid authored display copy, not a new application
// identity, evidence record or replacement for the retained source snapshot.
const long = structuredClone(fixture);
long.header_copy.application_name = 'OpeningHours'.repeat(8) + ' Assistant';
long.header_copy.workflow_purpose = 'Preserve ' + 'unbroken-source-description'.repeat(3) + ' for review.';
const longRender = renderHtml(long);
assert.equal(longRender.ok, true, JSON.stringify(longRender.errors));
const longPath = join(out, 'synthetic-long-copy.html');
await writeFile(longPath, longRender.html, { flag: 'wx', mode: 0o600 });
const server = createServer((request, response) => {
  if (request.url !== '/review.html') { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(inputs.at(-1).html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const httpUrl = `http://127.0.0.1:${server.address().port}/review.html`;
const browser = await chromium.launch({ headless: true });
const errors = [], externalRequests = [], checks = [], screenshots = [];
const page = await browser.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.route('**/*', async route => {
  const url = route.request().url();
  if (/^https?:/.test(url) && !url.startsWith(`http://127.0.0.1:${server.address().port}/`)) {
    externalRequests.push(url); await route.abort();
  } else await route.continue();
});
const capture = async name => { const path = join(out, name); await page.screenshot({ path }); await chmod(path, 0o600); screenshots.push(path); };
const count = async n => assert.equal(await page.locator('#prompt-count').innerText(), String(n));
const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function geometry() {
  return page.evaluate(() => {
    const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
    const top = document.querySelector('.top');
    return { header: rect(top), prompt: rect(document.querySelector('.prompt-state')), sticky: top.classList.contains('is-sticky'), scroll: document.scrollingElement.scrollTop,
      panels: ['main', '.queue', '.scenario', '.scenario-intro', '.timeline'].map(selector => {
        const element = document.querySelector(selector), css = getComputedStyle(element);
        return { selector, overflowY: css.overflowY, maxHeight: css.maxHeight, scrollTop: element.scrollTop };
      }) };
  });
}
async function wheelCheck(region, selector, width, height) {
  await page.evaluate(() => scrollTo(0, 0)); await frame();
  if (selector) {
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    const b = await page.locator(selector).first().boundingBox();
    await page.mouse.move(b.x + Math.min(b.width / 2, 20), Math.max(1, Math.min(height - 2, b.y + b.height / 2)));
  } else await page.mouse.move(width - 24, height / 2);
  const before = await page.evaluate(() => document.scrollingElement.scrollTop);
  await page.mouse.wheel(0, 180);
  await page.waitForFunction(before => document.scrollingElement.scrollTop > before + 100, before);
  const after = await geometry();
  assert.ok(after.scroll > before + 100, region);
  for (const panel of after.panels) assert.equal(panel.scrollTop, 0, `${region}: ${panel.selector}`);
  return { region, before, after: after.scroll };
}
try {
  for (const input of inputs) {
    for (const [width, height] of [[1728, 873], [1280, 900], [390, 844], [390, 560], [320, 560]]) {
      await page.setViewportSize({ width, height });
      await page.goto(pathToFileURL(input.path).href); await frame();
      await count(0); await noOverflow();
      const initial = await geometry();
      assert.ok(initial.prompt.x > width / 2 || width <= 600);
      assert.ok(initial.prompt.right <= initial.header.right && initial.prompt.y >= initial.header.y);
      assert.ok(initial.prompt.bottom <= initial.header.bottom);
      assert.equal(await page.locator('.prompt-bar, body > footer').count(), 0);
      assert.doesNotMatch(await page.locator('.top').innerText(), /\b(cart|basket|shopping|checkout)\b/i);
      assert.equal(await page.locator('.prompt-state svg, .prompt-state img').count(), 0);
      assert.equal(await page.locator('#review-prompt').isDisabled(), true);
      for (const panel of initial.panels) { assert.equal(panel.overflowY, 'visible'); assert.equal(panel.maxHeight, 'none'); }
      assert.equal(await page.locator('.application-copy h1').innerText(), input.doc.header_copy.application_name);
      assert.equal(await page.locator('.application-copy p').innerText(), input.doc.header_copy.workflow_purpose);
      await capture(`${input.label}-${width}x${height}-header-empty.png`);
      await page.locator('.event-details summary').first().click();
      const wheel = [];
      for (const [region, selector] of [['header', '.top'], ['queue', '.queue'], ['step-column', '.event-marker'], ['blank', null]]) {
        wheel.push(await wheelCheck(region, selector, width, height));
      }
      await page.locator('.event-details summary').first().evaluate(e => e.scrollIntoView({ block: 'start' }));
      const intoView = await page.locator('.event-details summary').first().evaluate(e => {
        const r=e.getBoundingClientRect(), top=document.querySelector('.top');
        return { y:r.y, bottom:r.bottom, boundary:top.classList.contains('is-sticky')?top.getBoundingClientRect().bottom:0, height:innerHeight };
      });
      assert.ok(intoView.y >= intoView.boundary - 1 && intoView.bottom <= intoView.height + 1, JSON.stringify({ label: input.label, width, height, intoView }));
      // Focus, keyboard activation and dialog dismissal all follow document scroll.
      await page.evaluate(() => scrollTo(0, 0));
      const last = page.locator('[data-comment]').last(); await last.focus();
      const focused = await last.evaluate(element => {
        const r = element.getBoundingClientRect(), top = document.querySelector('.top');
        return { active: document.activeElement === element, y: r.y, bottom: r.bottom, boundary: top.classList.contains('is-sticky') ? top.getBoundingClientRect().bottom : 0, height: innerHeight };
      });
      assert.equal(focused.active, true); assert.ok(focused.y >= focused.boundary); assert.ok(focused.bottom <= focused.height);
      await page.keyboard.press('Enter'); assert.equal(await page.locator('#comment-composer').evaluate(e => e.open), true);
      await page.keyboard.press('Escape'); assert.equal(await last.evaluate(e => e === document.activeElement), true);
      await page.locator('[data-add-correct]').click(); await count(1);
      await page.locator('#review-prompt').click();
      await page.locator('#copy-prompt').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#copy-prompt').isVisible(), true);
      await noOverflow(); await capture(`${input.label}-${width}x${height}-prompt.png`);
      await page.keyboard.press('Escape');
      await page.locator('#review-prompt').focus();
      const promptFocus = await page.locator('#review-prompt').boundingBox();
      assert.ok(promptFocus.y >= 0 && promptFocus.y + promptFocus.height <= height);
      checks.push({ label: input.label, width, height, initial, wheel, intoView, focused });
    }
  }
  // Wrapping is not clipping: complete long names/purposes remain in normal flow.
  for (const [width, height] of [[1728, 873], [1280, 900], [390, 844], [390, 560], [320, 560]]) {
    await page.setViewportSize({ width, height }); await page.goto(pathToFileURL(longPath).href); await frame(); await noOverflow();
    assert.equal(await page.locator('.application-copy h1').innerText(), long.header_copy.application_name);
    assert.equal(await page.locator('.application-copy p').innerText(), long.header_copy.workflow_purpose);
    assert.equal(await page.locator('.application-copy').evaluate(e => e.scrollHeight <= e.clientHeight + 1 && e.scrollWidth <= e.clientWidth + 1), true);
    if (width <= 600) assert.equal((await geometry()).sticky, false);
    await page.locator('[data-comment]').last().focus();
    assert.equal(await page.locator('[data-comment]').last().evaluate(e => { const r=e.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight; }), true);
    await page.evaluate(() => scrollTo(0, 0)); await capture(`long-copy-${width}x${height}.png`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(pathToFileURL(inputs[0].path).href);
  await page.locator('[data-add-correct]').click(); await count(1);
  await page.locator('[data-comment][data-event="draft-1"]').click();
  const comment = 'Preserve the unsent state and clarify the missing Sunday hours.';
  await page.locator('#comment-text').fill(comment); await page.locator('#save-comment').click(); await count(2);
  await page.locator('.review-flag summary').click(); await page.locator('[data-add-fix]').click(); await count(3);
  await page.locator('[data-add-correct], [data-add-fix]').evaluateAll(elements => elements.forEach(e => e.click())); await count(3);
  const context = feedbackContext(fixture), runtime = feedbackRuntime();
  let items = runtime.add(context, [], 'correct', 'correct', undefined, 'Preserve the behavior shown in this run.');
  items = runtime.add(context, items, 'comment', 'issue', 'draft-1', comment);
  items = runtime.add(context, items, 'fix', 'issue', 'draft-1', technicalFix);
  const expected = runtime.compose(context, items);
  await page.locator('#review-prompt').click();
  assert.equal(await page.locator('#prompt-preview').inputValue(), expected);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedForLayoutTest = text; } } }));
  await page.locator('#copy-prompt').click(); assert.equal(await page.evaluate(() => window.copiedForLayoutTest), expected);
  await capture('three-items-exact-manual-prompt.png');
  await page.locator('#prompt-items button[aria-label="Edit Comment · Step 2"]').click();
  await page.locator('#comment-text').fill('Edited comment only.'); await page.locator('#save-comment').click(); await count(3);
  assert.equal(await page.locator('#copy-status').innerText(), '');
  assert.ok((await page.locator('#prompt-preview').inputValue()).includes(technicalFix));
  assert.ok((await page.locator('#prompt-preview').inputValue()).includes('Edited comment only.'));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Deliberate local denial'); } } }));
  await page.locator('#copy-prompt').click();
  assert.match(await page.locator('#copy-status').innerText(), /Copy the selected prompt manually/);
  assert.equal(await page.locator('#prompt-preview').evaluate(e => e.selectionEnd - e.selectionStart === e.value.length), true);
  await page.locator('#prompt-items button[aria-label="Remove Comment · Step 2"]').click(); await count(2);
  assert.ok((await page.locator('#prompt-preview').inputValue()).includes(technicalFix));
  await page.keyboard.press('Escape'); await page.locator('[data-dismiss-concern]').click();
  await count(2); assert.equal(await page.locator('.review-block').count(), 0);
  await page.locator('#review-prompt').click(); assert.ok((await page.locator('#prompt-preview').inputValue()).includes(technicalFix));
  await page.keyboard.press('Escape'); await page.reload(); await count(0); assert.equal(await page.locator('.review-block').count(), 1);
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.locator('[data-add-correct]').click();
  assert.equal(await page.locator('#prompt-count').evaluate(e => getComputedStyle(e).animationName), 'none');
  await noOverflow(); await capture('forced-colors-reduced-motion.png');
  await page.emulateMedia({ forcedColors: 'none' });
  // Same exact self-contained renderer also works through HTTP under its CSP.
  const response = await page.goto(httpUrl); assert.equal(response.status(), 200); await count(0);
  await page.locator('[data-add-correct]').click(); await count(1); await page.locator('#review-prompt').click();
  assert.ok((await page.locator('#prompt-preview').inputValue()).length > 0);
  await capture('http-prompt.png');
  assert.deepEqual(await page.locator('[style]:not([style=""])').evaluateAll(elements => elements.map(e => e.outerHTML)), []);
  assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  if (sourcePath) assert.deepEqual(await readFile(sourcePath), sourceBytes);
  const report = { ok: true, output_directory: out, checks, source: sourcePath ? { path: sourcePath, sha256: sha(sourceBytes), unchanged: true, presentation_only_rerender: true } : null,
    exact_prompt_and_stubbed_clipboard: true, manual_fallback: true, edit_remove_dedupe: true, dismiss_preserves_prompt: true, reload_memory_only: true,
    long_copy_wraps: true, reduced_motion: true, forced_colors: true, http_csp: true, errors, external_requests: externalRequests, screenshots,
    limits: 'Local Chromium presentation verification only; no new generation, native scenario run, review approval, real clipboard write or application mutation.' };
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ok: true, output_directory: out, viewport_checks: checks.length, source: report.source, screenshots: screenshots.length }));
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
