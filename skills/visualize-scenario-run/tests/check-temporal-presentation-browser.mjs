// Explicit offline browser regression, not a model run or user acceptance.
// node check-temporal-presentation-browser.mjs EXISTING_PLAYWRIGHT NEW_OUTPUT_DIR [REAL_HTML]
// REAL_HTML is read-only. External destinations and clipboard are never opened.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bundle, sourceBoundCandidate, observedAt } from './fixtures.mjs';
import { renderHtml } from '../scripts/render.mjs';

assert.ok(process.argv[2] && process.argv[3], 'Provide existing Playwright and a NEW private output directory.');
const { chromium } = createRequire(import.meta.url)(resolve(process.argv[2]));
const out = resolve(process.argv[3]);
await mkdir(out, { mode: 0o700 });
const sourceUrl = 'https://docs.google.com/document/d/offline-browser-fixture/edit';
const firstVersion = 'Customer reply\nWe open at nine.\nSunday hours are unknown.\n';
const laterVersion = 'Customer reply\nWe open at nine.\nSunday hours remain unconfirmed.\n<img src="https://example.test/not-requested" onerror="alert(1)">\n';
const problem = 'The hours service timed out, so Sunday opening hours could not be checked.';
const incomplete = 'The document update is partial: Sunday opening hours remain unconfirmed.';
const remedy = 'Keep Sunday hours marked unconfirmed until the schedule is available.';
const input = bundle();
input.run.status = 'partial';
input.run.observed_resulting_state = 'A reply document exists; Sunday opening hours remain unconfirmed.';
input.evidence[1].source.url = sourceUrl;
input.evidence[1].content = { text: firstVersion, status: 'created' };
input.evidence.push(
  { id: 'e-timeout', kind: 'external_record', source: { system: 'Hours service' }, captured_at: observedAt, content: { status: 504, text: problem }, completeness: 'complete', redactions: [] },
  { id: 'e-update', kind: 'external_record', source: { system: 'Google Docs', url: sourceUrl }, captured_at: observedAt, content: { before: firstVersion, after: laterVersion, text: incomplete }, completeness: 'complete', redactions: [] },
);
Object.assign(input.artifacts[0], { kind: 'document', title: 'Customer reply document', content: firstVersion, after: firstVersion, source_url: sourceUrl });
input.artifacts.push({ id: 'a-update', kind: 'document', title: 'Customer reply document update', media_type: 'text/plain', before: firstVersion, after: laterVersion, source_url: sourceUrl, evidence_refs: ['e-update'], completeness: 'complete', redactions: [], change: 'modified' });
Object.assign(input.occurrences[1], { description: 'The assistant created a customer reply document with Sunday hours still unknown.', world_effect: { system: 'Google Docs', change: 'Created a reply document without claiming confirmed Sunday hours.' } });
input.occurrences.splice(1, 0, { id: 'hours-timeout', kind: 'external_world_action', actor_id: 'mail', description: problem, outcome: 'failed', evidence_refs: ['e-timeout'], artifact_refs: [], relationships: [], world_effect: { system: 'Hours service', change: 'No Sunday schedule was returned.' }, workflow_relevance: { explanation: 'The requested Sunday opening hours remain unknown.', basis: 'observed', evidence_refs: ['e-timeout'] } });
input.occurrences.splice(3, 0, { id: 'doc-partial', kind: 'agent_world_action', actor_id: 'agent-1', session_id: 'session-1', description: incomplete, outcome: 'partial', evidence_refs: ['e-update'], artifact_refs: ['a-update'], relationships: [], world_effect: { system: 'Google Docs', change: 'Updated the reply while preserving the unconfirmed Sunday hours.' } });
input.occurrences.at(-1).outcome = 'unconfirmed';
const doc = sourceBoundCandidate(input);
// A new synthetic authored variant, not a migration of retained run evidence.
doc.schema_version = '1.10';
doc.timeline.find(e => e.id === 'hours-timeout').supporting_detail = 'The service returned HTTP 504 without a Sunday schedule. The underlying cause was not recorded.';
doc.timeline.find(e => e.id === 'hours-timeout').concern = {
  explanation: `${problem} The customer still needs confirmed hours to plan a Sunday visit.`,
  evidence_refs: ['e-timeout'], claim_refs: doc.timeline.find(e => e.id === 'hours-timeout').claim_refs,
};
const partial = doc.timeline.find(e => e.id === 'doc-partial');
partial.supporting_detail = 'The recorded update leaves Sunday opening hours unconfirmed.';
partial.concern = { explanation: `${incomplete} The customer cannot use the reply to plan a Sunday visit.`, evidence_refs: partial.evidence_refs, claim_refs: partial.claim_refs };
const technicalRemedy = `Update the reply logic to preserve unconfirmed Sunday hours. Add a regression test for an unavailable schedule. ${remedy}`;
partial.suggested_feedback = { action_id: 'issue', explanation: remedy, text: technicalRemedy, evidence_refs: partial.evidence_refs, claim_refs: partial.claim_refs };
// A malformed private optional review must not leak into normal presentation.
doc.copy_review = { verdict: 'revise', findings: [{ explanation: 'PRIVATE_BROWSER_REVIEW_MARKER', field_path: '$.artifacts[0].after' }] };
const original = structuredClone(doc);
const rendered = renderHtml(doc);
assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
assert.deepEqual(doc, original);
const htmlFile = join(out, 'synthetic-temporal.html');
await writeFile(htmlFile, rendered.html, { flag: 'wx', mode: 0o600 });
const optional = process.argv[4] ? resolve(process.argv[4]) : undefined;
const optionalOriginal = optional ? await readFile(optional) : undefined;
const browser = await chromium.launch({ headless: true });
const errors = [], requests = [], checks = [], screenshots = [];
const report = { ok: false, output_directory: out, checks, console_errors: errors, external_requests: requests, screenshots, limits: 'Deterministic synthetic/source presentation only; no models, live writes, external navigation, clipboard writes or acceptance claim.' };
let page;
const privacy = /PRIVATE_BROWSER_REVIEW_MARKER|copy_review|reviewer_id|checker_id|candidate_digest|factual_digest|field_digest|rule_versions|limited.evidence|nonapproval|generation/i;
const count = async expected => assert.equal(await page.locator('#prompt-count').innerText(), String(expected));
const capture = async name => { const path = join(out, name); await page.screenshot({ path }); await chmod(path, 0o600); screenshots.push(path); };
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
const clean = async () => {
  assert.doesNotMatch(await page.locator('body').innerText(), privacy);
  assert.doesNotMatch(await page.locator('#prompt-preview').inputValue(), privacy);
};
async function audit() {
  assert.deepEqual(await page.evaluate(() => window.__presentationAudit), { storage: [], clipboard: [], opens: [] });
  assert.deepEqual(await page.locator('[style]:not([style=""])').evaluateAll(nodes => nodes.map(n => n.getAttribute('style'))), []);
}
async function baseline() {
  await count(0);
  assert.equal(await page.locator('#review-prompt').isDisabled(), true);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  for (const value of ["default-src 'none'", "connect-src 'none'", "img-src 'none'", "form-action 'none'", "object-src 'none'", "base-uri 'none'"]) assert.ok(csp.includes(value), value);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|https?:/);
  for (const [selector, directive] of [['style', 'style-src'], ['script', 'script-src']]) {
    const text = await page.locator(selector).textContent();
    assert.ok(csp.includes(`${directive} 'sha256-${createHash('sha256').update(text).digest('base64')}'`));
  }
  const colors = await page.locator('.event-title').evaluateAll(nodes => [...new Set(nodes.map(n => getComputedStyle(n).color))]);
  assert.equal(colors.length, 1, `All narrative descriptions must have the same computed color: ${colors}`);
  assert.equal(await page.locator('.event-title').evaluateAll(nodes => nodes.every(n => getComputedStyle(n).opacity === '1')), true);
  assert.equal(await page.locator('summary button').count(), 0);
  const links = page.locator('.artifact-source a');
  for (let i = 0; i < await links.count(); i++) {
    const link = links.nth(i);
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(await link.evaluate(n => n.tagName), 'A');
    const href = new URL(await link.getAttribute('href'));
    assert.ok(['http:', 'https:'].includes(href.protocol));
    assert.equal(href.username + href.password + href.search + href.hash, '');
    assert.equal(await link.evaluate(n => { const s = getComputedStyle(n); return parseFloat(s.borderTopWidth) >= 1 && parseFloat(s.fontSize) >= 12 && n.getBoundingClientRect().height >= 30; }), true);
  }
  await noOverflow(); await clean(); await audit();
}

try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__presentationAudit = { storage: [], clipboard: [], opens: [] };
    for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { window.__presentationAudit.storage.push(method); return Reflect.apply(original, this, args); };
    }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { window.__presentationAudit.clipboard.push('writeText'); } } });
    window.open = (...args) => { window.__presentationAudit.opens.push(String(args[0])); return null; };
  });
  await context.route('**/*', async route => {
    if (/^https?:/.test(route.request().url())) { requests.push(route.request().url()); await route.abort(); }
    else await route.continue();
  });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const modes = [
    { name: 'desktop', width: 1280, height: 900, reducedMotion: 'no-preference', forcedColors: 'none', key: 'Enter' },
    { name: 'mobile', width: 390, height: 700, reducedMotion: 'no-preference', forcedColors: 'none', key: 'Space' },
    { name: 'mobile-short-reduced', width: 390, height: 560, reducedMotion: 'reduce', forcedColors: 'none', key: 'Enter' },
    { name: 'desktop-forced-colors', width: 1280, height: 900, reducedMotion: 'reduce', forcedColors: 'active', key: 'Space' },
  ];
  for (const mode of modes) {
    const check = { ...mode, completed: false };
    checks.push(check);
    await page.setViewportSize({ width: mode.width, height: mode.height });
    await page.emulateMedia({ reducedMotion: mode.reducedMotion, forcedColors: mode.forcedColors });
    await page.goto(pathToFileURL(htmlFile).href);
    await baseline();
    Object.assign(check, { baseline_csp: true, uniform_computed_colors: true, safe_cta: true, privacy: true, storage_calls: 0 });
    assert.equal(await page.locator('.event').count(), doc.timeline.length);
    assert.equal(await page.locator('[data-concern-event]').count(), 2);
    assert.equal(await page.getByRole('link', { name: 'Open Google Doc', exact: true }).count(), 2);
    assert.equal(await page.getByRole('link', { name: 'Open Google Doc', exact: true }).first().getAttribute('href'), sourceUrl);
    const first = page.locator('#draft-1 .business-artifact');
    assert.ok((await first.innerText()).includes(firstVersion.trim()));
    assert.doesNotMatch(await first.innerText(), /remain unconfirmed|not-requested/);
    const changed = page.locator('#doc-partial .business-artifact');
    assert.ok((await changed.locator('.diff-removed .diff-text').allTextContents()).join('').includes('Sunday hours are unknown.'));
    assert.ok((await changed.locator('.diff-added .diff-text').allTextContents()).join('').includes('Sunday hours remain unconfirmed.'));
    assert.equal(await changed.locator('img').count(), 0);
    assert.ok((await changed.innerText()).includes('<img src='));
    Object.assign(check, { explicit_versions: true, hostile_source_inert: true });
    const contextBytes = await page.locator('#feedback-context').inputValue();
    const evidenceBytes = await page.locator('#doc-partial .event-details .detail-body').innerHTML();
    const titleBytes = await page.locator('.event-title').allTextContents();
    for (const id of ['hours-timeout', 'doc-partial']) {
      const block = page.locator(`[data-concern-event="${id}"]`);
      const summary = block.locator('summary'); await summary.focus(); await page.keyboard.press('Enter');
      assert.equal(await block.getByRole('heading', { name: 'Claude’s concern', exact: true }).isVisible(), true);
      const text = await block.innerText(); assert.ok(text.includes(id === 'hours-timeout' ? problem : incomplete));
      assert.ok(text.length > `Possibly incorrect behavior Outcome: ${id === 'hours-timeout' ? 'failed' : 'partial'}. Dismiss`.length + 80);
      if (id === 'hours-timeout') {
        assert.match(text, /customer still needs confirmed hours/);
        assert.doesNotMatch(text, /Outcome:|Recorded problem|Recorded effect|Source detail/);
        assert.equal(await block.getByRole('button', { name: 'Add suggested fix to prompt', exact: true }).isDisabled(), true);
      } else {
        assert.match(text, /Suggested fix/); assert.ok(text.includes(remedy));
        assert.ok(!text.includes(technicalRemedy));
        await block.locator('[data-add-fix]').click(); await count(1);
        assert.equal(await block.locator('[data-add-fix]').isDisabled(), true);
        if (mode.reducedMotion === 'reduce') assert.equal(await page.locator('#prompt-count').evaluate(n => getComputedStyle(n).animationName), 'none');
      }
    }
    Object.assign(check, { human_concerns: true, grounded_fix_only: true, add_fix_runtime: true });
    await page.locator('#doc-partial .review-flag .detail-body').scrollIntoViewIfNeeded();
    await capture(`${mode.name}-concern.png`);
    await page.locator('[data-dismiss-concern="hours-timeout"]').click();
    assert.equal(await page.locator('[data-concern-event="hours-timeout"]').count(), 0);
    assert.equal(await page.locator('[data-concern-event="doc-partial"]').count(), 1);
    assert.equal(await page.locator('#hours-timeout .event-details > summary').evaluate(n => n === document.activeElement), true);
    await count(1);
    const dismiss = page.locator('[data-dismiss-concern="doc-partial"]');
    await dismiss.focus(); await page.keyboard.press(mode.key);
    assert.equal(await page.locator('[data-concern-event]').count(), 0);
    assert.equal(await page.locator('#doc-partial .event-details > summary').evaluate(n => n === document.activeElement), true);
    assert.equal(await page.locator('.event').count(), doc.timeline.length);
    assert.equal(await page.locator('.event-details').count(), doc.timeline.length);
    assert.deepEqual(await page.locator('.event-title').allTextContents(), titleBytes);
    assert.equal(await page.locator('#feedback-context').inputValue(), contextBytes);
    assert.equal(await page.locator('#doc-partial .event-details .detail-body').innerHTML(), evidenceBytes);
    await count(1); assert.ok((await page.locator('[data-queued="doc-partial"]').innerText()).includes(technicalRemedy));
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#doc-partial .event-details').evaluate(n => n.open), true);
    await clean(); await capture(`${mode.name}-dismissed-evidence.png`);
    await page.locator('#doc-partial .event-details > summary').click();
    await page.locator('[data-comment][data-event="doc-partial"]').click();
    assert.equal(await page.locator('#comment-composer').evaluate(n => n.open), true);
    await page.locator('#comment-text').fill('Preserve the uncertainty and inspect the recorded service timeout.');
    await page.locator('#save-comment').click(); await count(2);
    await page.locator('#review-prompt').click();
    assert.equal(await page.locator('#prompt-review').evaluate(n => n.open), true);
    const prompt = await page.locator('#prompt-preview').inputValue();
    assert.ok(prompt.includes(technicalRemedy)); assert.match(prompt, /Preserve the uncertainty/);
    assert.doesNotMatch(prompt, /approved|approval recorded|applied successfully/i);
    assert.match(await page.locator('#prompt-review').innerText(), /does not send, run, apply, approve or save anything/);
    await clean(); await noOverflow(); await audit(); await capture(`${mode.name}-prompt.png`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#prompt-review').evaluate(n => n.open), false);
    await page.reload(); await count(0);
    assert.equal(await page.locator('[data-concern-event]').count(), 2);
    assert.equal(await page.locator('#feedback-context').inputValue(), contextBytes);
    assert.equal(await page.locator('#doc-partial [data-add-fix]').isDisabled(), false);
    await audit();
    Object.assign(check, { completed: true, source_bound: true, mouse_and_keyboard_dismiss: true, scoped_focus: true, evidence_unchanged: true, cart_survives_dismiss: true, reload_resets: true, typed_safe_cta: true, dialogs: true, external_requests: 0, overflow: false });
  }
  if (optional) {
    for (const [width, height] of [[1280, 900], [390, 700]]) {
      await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'none' });
      await page.goto(pathToFileURL(optional).href); await baseline();
      const events = await page.locator('.event').count();
      const concerns = await page.locator('[data-concern-event]').count();
      const contextBytes = await page.locator('#feedback-context').inputValue();
      if (concerns) {
        const block = page.locator('[data-concern-event]').first();
        const id = await block.getAttribute('data-concern-event');
        await block.locator('summary').focus(); await page.keyboard.press('Enter');
        assert.equal(await block.getByRole('heading', { name: 'Claude’s concern', exact: true }).isVisible(), true);
        const paragraphs = await block.locator('.detail-body p').allTextContents();
        assert.ok(paragraphs.some(text => !/^Outcome:/.test(text) && text.length > 35));
        const evidence = page.locator('.event').filter({ has: page.locator(`[data-event="${id}"]`) }).first().locator('.event-details > summary');
        await block.locator('[data-dismiss-concern]').focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('[data-concern-event]').count(), concerns - 1);
        assert.equal(await evidence.evaluate(n => n === document.activeElement), true);
        assert.equal(await page.locator('.event').count(), events);
        assert.equal(await page.locator('#feedback-context').inputValue(), contextBytes);
      }
      await page.locator('[data-comment]').first().click(); await page.locator('#comment-text').fill('Keep the recorded source content unchanged.');
      await page.locator('#save-comment').click(); await count(1); await page.locator('#review-prompt').click();
      await clean(); await capture(`actual-source-${width}x${height}-prompt.png`); await page.keyboard.press('Escape');
      await page.reload(); await count(0); assert.equal(await page.locator('[data-concern-event]').count(), concerns);
      await audit(); checks.push({ actual_source: optional, width, height, concerns, event_count: events, dismiss_restores: true, privacy: true, offline: true });
    }
    assert.deepEqual(await readFile(optional), optionalOriginal);
  }
  assert.deepEqual(doc, original); assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  report.ok = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  if (page) await capture('failure.png').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
}
