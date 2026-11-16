import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderHtml } from '../scripts/render.mjs';
import { factualDigest } from '../scripts/contracts.mjs';
import { concernFixture } from './concern-fixture.mjs';

test('prompt controls live in the application header without a bottom bar or reserved footer space', () => {
  const { doc } = concernFixture(), original = structuredClone(doc), digest = factualDigest(doc);
  const result = renderHtml(doc);
  assert.equal(result.ok, true);
  const markup = result.html.split('<script>')[0];
  const header = markup.match(/<header class="top">([\s\S]*?)<\/header>/)[1];
  for (const id of ['prompt-count', 'prompt-count-description', 'review-prompt', 'cart-status', 'cart-motion-status']) {
    assert.ok(header.includes(`id="${id}"`), id);
    assert.equal((markup.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, 1);
  }
  assert.match(header, /class="prompt-state" aria-label="Claude prompt"/);
  assert.doesNotMatch(header, /prompt-summary|<h2|Claude Prompt ·/);
  assert.match(header, /aria-describedby="prompt-count-description"/);
  assert.doesNotMatch(header.replace(/<[^>]*>/g, ''), /\b(cart|basket|shopping|checkout)\b/i);
  assert.doesNotMatch(header, /<svg|<img/i);
  assert.doesNotMatch(markup, /prompt-bar|position:fixed;bottom:0|padding[^}]*184px|padding-bottom:216px/);
  assert.match(markup, /<dialog id="prompt-review"/);
  assert.match(markup, /id="comment-composer"/);
  assert.deepEqual(doc, original);
  assert.equal(factualDigest(doc), digest);
});

test('timeline, queue and scenario heading use the document rather than bounded scroll panels', async () => {
  const source = await readFile(new URL('../scripts/render.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /html,body\{height:100%;overflow:hidden\}|body\{height:100dvh/);
  for (const selector of ['main', '\\.queue', '\\.scenario', '\\.scenario-intro', '\\.timeline']) {
    for (const match of source.matchAll(new RegExp(`${selector}\\{([^}]*)\\}`, 'g'))) {
      assert.doesNotMatch(match[1], /overflow(?:-y)?:(?:auto|scroll|hidden)|max-height:|height:100%|overscroll-behavior:contain/);
    }
  }
  const browser = await readFile(new URL('../scripts/feedback-browser.mjs', import.meta.url), 'utf8');
  assert.match(browser, /new ResizeObserver\(measureHeader\)/);
  assert.match(browser, /window\.scrollBy/);
  assert.doesNotMatch(browser, /panel\.scrollTop|preventDefault\(\).*wheel|addEventListener\(['"]wheel/);
});
