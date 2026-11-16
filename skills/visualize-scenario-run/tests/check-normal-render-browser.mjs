// Local-only current-contract regression; no model, service, clipboard or auth writes.
// node check-normal-render-browser.mjs EXISTING_PLAYWRIGHT NEW_OUTPUT_DIR [REAL_HTML]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sourceBoundCandidate } from './fixtures.mjs';
import { renderHtml } from '../scripts/render.mjs';

const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const out = resolve(process.argv[3]);
await mkdir(out, { mode: 0o700 });
const doc = sourceBoundCandidate();
doc.copy_review = { verdict: 'revise', findings: [{ field_path: '$.artifacts[0].after', explanation: 'PRIVATE invalid review marker' }] };
const result = renderHtml(doc); assert.equal(result.ok, true);
const file = join(out, 'normal.html'); await writeFile(file, result.html, { flag: 'wx', mode: 0o600 });
const browser = await chromium.launch({ headless: true });
const errors = [], requests = [], checks = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.route('**/*', async route => {
    if (/^https?:/.test(route.request().url())) { requests.push(route.request().url()); await route.abort(); }
    else await route.continue();
  });
  for (const [label, input] of [['synthetic', file], ...(process.argv[4] ? [['actual-source', resolve(process.argv[4])]] : [])]) {
    for (const [width, height] of [[1280, 900], [390, 700], [390, 560]]) {
      await page.setViewportSize({ width, height });
      await page.goto(pathToFileURL(input).href);
      assert.equal(await page.locator('#prompt-count').innerText(), '0');
      assert.equal(await page.locator('#review-prompt').isDisabled(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('.event-details summary').first().click();
      await page.evaluate(() => scrollTo(0, document.scrollingElement.scrollHeight));
      assert.ok(await page.evaluate(() => document.scrollingElement.scrollTop > 0));
      assert.equal(await page.locator('.scenario').evaluate(e => e.scrollTop), 0);
      assert.equal(await page.locator('.scenario').evaluate(e => getComputedStyle(e).overflowY), 'visible');
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('.event-details summary').first().click();
      await page.locator('[data-comment]').first().click();
      assert.equal(await page.locator('#comment-composer').evaluate(e => e.open), true);
      await page.locator('#comment-text').fill('Keep the recorded evidence unchanged.');
      await page.locator('#save-comment').click();
      assert.equal(await page.locator('#prompt-count').innerText(), '1');
      await page.locator('#review-prompt').click();
      assert.equal(await page.locator('#prompt-review').evaluate(e => e.open), true);
      const prompt = await page.locator('#prompt-preview').inputValue();
      assert.match(prompt, /Keep the recorded evidence unchanged/);
      assert.doesNotMatch(prompt, /PRIVATE|copy_review|reviewer_id|checker_id|candidate_digest|field_digest|limited.evidence|generation/i);
      await page.screenshot({ path: join(out, `${label}-${width}x${height}-dialog.png`) });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#prompt-review').evaluate(e => e.open), false);
      await page.locator('.event-details summary').first().click();
      const text = await page.locator('body').innerText();
      assert.doesNotMatch(text, /PRIVATE|copy_review|reviewer_id|checker_id|candidate_digest|field_digest|rule_versions|limited.evidence|generation/i);
      await page.screenshot({ path: join(out, `${label}-${width}x${height}-evidence.png`) });
      checks.push({ label, width, height, header_prompt: true, dialogs: true, document_scroll: true, privacy: true, overflow: false });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(file).href);
  await page.locator('[data-add-correct]').click();
  assert.equal(await page.locator('#prompt-count').evaluate(e => getComputedStyle(e).animationName), 'none');
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  const summary = { ok: true, checks, errors, external_requests: requests, reduced_motion: true };
  await writeFile(join(out, 'verification.json'), JSON.stringify(summary, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ...summary, directory: out }));
} finally { await browser.close(); }
