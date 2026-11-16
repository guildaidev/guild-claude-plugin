// Read-only local screenshot references of an existing checked HTML artifact.
// Example feedback is browser-local, not user feedback or native approval.
// node capture-reviewed-states.mjs PLAYWRIGHT HTML NEW_OUTPUT_DIR
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const html = resolve(process.argv[3]), out = resolve(process.argv[4]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const before = await readFile(html);
await mkdir(out, { mode: 0o700 });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [], external = [], captures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.route('**/*', async route => {
  if (/^https?:/.test(route.request().url())) { external.push(route.request().url()); await route.abort(); } else await route.continue();
});
async function capture(file, label) {
  const path = join(out, file);
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  await chmod(path, 0o600);
  captures.push({ file, label, viewport: page.viewportSize(), sha256: digest(await readFile(path)) });
}
try {
  await page.goto(pathToFileURL(html).href);
  await capture('01-reviewed-default.png', 'Unchanged reviewed input · shadcn presentation only');
  await page.locator('[data-add-correct]').click();
  assert.match(await page.locator('[data-queued=""]').textContent(), /Whole scenario/);
  await capture('02-correct-scope.png', 'Illustrative whole-scenario correct-result preset · no approval');
  await page.locator('[data-comment]').nth(1).click();
  await page.locator('#comment-text').fill('Review example: clarify the retained version conflict before proposing changes.');
  await page.locator('#save-comment').click();
  await capture('03-step-comment.png', 'Illustrative browser-local comment on step 2');
  await page.locator('#review-prompt').click();
  await capture('04-reviewed-prompt.png', 'Included examples and deterministic prompt · not copied or submitted');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#review-prompt').click();
  await capture('05-mobile-prompt.png', 'Narrow-screen prompt review · illustrative local feedback');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  assert.deepEqual(await readFile(html), before);
  const report = { ok: true, html, html_sha256: digest(before), captures, errors, external_requests: external, limitations: 'Presentation-only screenshots of a previously checked synthetic native input. Example feedback only; no new model review, copy/delivery, execution or user acceptance.' };
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
