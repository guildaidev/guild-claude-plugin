import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contentDiff, renderContentDiff } from '../scripts/diff.mjs';
import { renderMarkdown } from '../scripts/markdown.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { artifactSourceLink } from '../scripts/artifact-link.mjs';
import { concernFixture } from './concern-fixture.mjs';

const unescape = text => text.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function reconstruct(html) {
  const old = [], current = [];
  for (const match of html.matchAll(/<tr[^>]*class="diff-line diff-(added|removed|context)"[\s\S]*?<span class="diff-source" data-source="([^"]*)"/g)) {
    const text = JSON.parse(unescape(match[2]));
    if (match[1] !== 'added') old.push(text);
    if (match[1] !== 'removed') current.push(text);
  }
  return [old.join(''), current.join('')];
}

test('real upstream React diff is packaged with exact pins, static styles and complete licenses', async () => {
  const root = new URL('../ui/', import.meta.url);
  const pkg = JSON.parse(await readFile(new URL('package.json', root)));
  assert.equal(pkg.dependencies['react-diff-view'], '3.3.3');
  assert.equal(pkg.dependencies['lucide-react'], '1.73.0');
  const component = await readFile(new URL('src/components/artifact-diff.jsx', root), 'utf8');
  assert.match(component, /import \{ Diff, Hunk, Decoration \} from 'react-diff-view'/);
  assert.match(component, /<Diff/); assert.match(component, /<Hunk/); assert.match(component, /<Decoration/); assert.match(component, /<Card/);
  assert.match(component, /optimizeSelection: false/);
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|style=|new Worker|fetch\(|parseDiff\(/);
  const license = await readFile(new URL('dist/THIRD-PARTY-LICENSES.txt', root), 'utf8');
  for (const text of ['react-diff-view@3.3.3', 'Gray Zhang', 'lucide-react@1.73.0', 'ISC License', 'lodash@', 'gitdiff-parser@']) assert.ok(license.includes(text), text);
  const css = await readFile(new URL('dist/ui.css', root), 'utf8');
  assert.match(css, /\.diff-gutter-col/); assert.doesNotMatch(css, /@import|url\(/);
});

test('collapsed context retains every source character and only changed rows lie outside disclosures', () => {
  for (const [before, after] of [
    ['same\r\n\r\nold \r\nrepeat\nend', 'same\r\n\r\nnew\r\nrepeat\nend\n'],
    ['a\nb\na\nb\n', 'b\na\nb\na\n'], ['', 'created\n'], ['deleted\r\n', ''],
    ['same\r\n \r\n', 'same\r\n \r\n'], ['', ''],
    ['💚\n<script>\n', '💚\n<img src=x onerror=alert(1)>\n'],
    ['a\n'.repeat(6_000), 'b\n'.repeat(6_000)],
  ]) {
    const html = renderContentDiff(before, after);
    assert.deepEqual(reconstruct(html), [before, after]);
    assert.doesNotMatch(html, /<details[^>]* open|<(?:script|img|iframe)\b| style=/);
    const expandedChanges = html.replace(/<details class="diff-context-disclosure">[\s\S]*?<\/details>/g, '');
    assert.doesNotMatch(expandedChanges, /class="diff-line diff-context"/);
    assert.equal((html.match(/class="diff-source"/g) ?? []).length, contentDiff(before, after).length);
  }
  assert.match(renderContentDiff('same', 'same'), /No content changes/);
  assert.match(renderContentDiff('a\r\n', 'b\r\n'), />CRLF<\/span>/);
  assert.match(renderContentDiff('a', 'b'), /No final newline/);
});

test('resource nouns are general and trusted external icons follow rather than replace source copy', () => {
  for (const url of ['https://en.wikipedia.org/wiki/AI', 'https://example.test/abstract', 'https://docs.google.com.evil.test/document/d/x']) {
    assert.equal(artifactSourceLink({ kind: 'document', source_url: url }).label, 'Open page');
  }
  assert.equal(artifactSourceLink({ kind: 'document', source_url: 'https://docs.google.com/document/d/x/edit' }).label, 'Open Google Doc');
  assert.equal(artifactSourceLink({ kind: 'file', media_type: 'text/html', source_url: 'https://example.test/page' }).label, 'Open page');
  const markdown = renderMarkdown('[A **source**](https://example.test/page)');
  assert.match(markdown, /A <strong>source<\/strong><svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.doesNotMatch(markdown, /<img| style=/);
  const html = renderHtml(concernFixture().doc).html.split('<script>')[0];
  for (const anchor of html.matchAll(/<a [^>]*target="_blank"[^>]*>([\s\S]*?)<\/a>/g)) {
    assert.match(anchor[1], /<svg/);
    assert.match(anchor[1], /<\/svg>$/);
  }
});

test('Dismiss stays a link-style real sibling button and the header has only badge plus Review prompt', async () => {
  const html = renderHtml(concernFixture().doc).html;
  const header = html.match(/<header class="top">[\s\S]*?<\/header>/)[0];
  assert.doesNotMatch(header, /prompt-summary|<h2|Claude Prompt ·/);
  assert.match(header, /aria-describedby="prompt-count-description"/);
  assert.match(html, /underline-offset-4 hover:underline[^>]*type="button"[^>]*data-dismiss-concern/);
  assert.doesNotMatch(html, /<summary>[^<]*<button/);
  const controller = await readFile(new URL('../scripts/feedback-browser.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(controller, /getElementById\('prompt-summary'\)/);
  assert.match(controller, /getElementById\('prompt-count-description'\)/);
});
