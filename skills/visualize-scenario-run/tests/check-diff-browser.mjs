// Explicit local browser verification; synthetic sources/reviews, not a native eval.
// node check-diff-browser.mjs /absolute/existing/playwright NEW_PRIVATE_DIRECTORY
import assert from 'node:assert/strict';
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { snapshot, fakeCopyReview, fakeChecker } from './fixtures.mjs';
import { renderHtml } from '../scripts/render.mjs';

const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const out = resolve(process.argv[3]);
await mkdir(out, { mode: 0o700 });
const doc = await snapshot();
Object.assign(doc.artifacts[0], {
  kind: 'document', change: 'modified', title: 'Reply draft',
  before: 'Hello,\nOur opening hours are 10am to 5pm.\nPlease call us for help.\nThank you.\n',
  after: 'Hello,\nOur opening hours are 9am to 6pm.\nYou can reply to this email for help.\nThank you.\n',
});
doc.artifacts[0].content = doc.artifacts[0].after;
doc.copy_review = fakeCopyReview(doc); doc.review = await fakeChecker().check(doc);
const source = JSON.stringify(doc);
const hash = text => createHash('sha256').update(text).digest('hex');
const result = renderHtml(doc); assert.equal(result.ok, true, JSON.stringify(result.errors));
const html = join(out, 'synthetic-content-diff.html');
await writeFile(html, result.html, { flag: 'wx', mode: 0o600 });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [], externalRequests = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.route('**/*', async route => {
  if (/^https?:/.test(route.request().url())) { externalRequests.push(route.request().url()); await route.abort(); }
  else await route.continue();
});
const capture = async name => {
  const path = join(out, name); await page.screenshot({ path }); await chmod(path, 0o600);
};
try {
  for (const [width, height] of [[1280, 1000], [390, 844]]) {
    await page.setViewportSize({ width, height }); await page.goto(pathToFileURL(html).href);
    await page.locator('.content-diff').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.content-diff ins').count(), 2);
    assert.equal(await page.locator('.content-diff del').count(), 2);
    assert.match(await page.locator('.diff-legend').innerText(), /− Removed.*\+ Added/s);
    assert.match(await page.locator('.diff-removed .sr-only').first().textContent(), /Removed/);
    const colors = await page.evaluate(() => ({
      added: getComputedStyle(document.querySelector('.diff-added')).backgroundColor,
      removed: getComputedStyle(document.querySelector('.diff-removed')).backgroundColor,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.notEqual(colors.added, colors.removed); assert.equal(colors.overflow, false);
    assert.doesNotMatch(await page.locator('body').innerText(), /copy_review|candidate_digest|reviewer_id|copy.approv/i);
    await capture(`diff-${width}.png`);
    await page.locator('[data-comment]').first().click();
    await page.locator('#comment-text').fill('Please keep the revised opening hours.');
    await page.locator('#save-comment').click(); await page.locator('#review-prompt').click();
    assert.match(await page.locator('#prompt-preview').inputValue(), /Please keep the revised opening hours\./);
    await page.keyboard.press('Escape');
    checks.push({ width, height, ...colors });
  }
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.locator('.content-diff').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.diff-marker').filter({ hasText: '+' }).count(), 2);
  assert.equal(await page.locator('.diff-marker').filter({ hasText: '−' }).count(), 2);
  await capture('diff-forced-colors.png');
  assert.equal(JSON.stringify(doc), source); assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  await writeFile(join(out, 'report.json'), JSON.stringify({ ok: true, origin: 'synthetic', source_sha256: hash(source), html_sha256: hash(result.html), checks, forced_colors: true, reduced_motion: true, console_errors: errors, external_requests: externalRequests }, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ok: true, output: out, checks, console_errors: errors, external_requests: externalRequests }, null, 2));
} finally { await browser.close(); }
