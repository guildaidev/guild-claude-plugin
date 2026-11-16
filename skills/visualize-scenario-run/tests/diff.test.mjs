import test from 'node:test';
import assert from 'node:assert/strict';
import { contentDiff, renderContentDiff } from '../scripts/diff.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { factualDigest } from '../scripts/contracts.mjs';
import { snapshot, fakeCopyReview, fakeChecker } from './fixtures.mjs';

function reconstructed(before, after) {
  const rows = contentDiff(before, after);
  assert.equal(rows.filter(row => row.kind !== 'added').map(row => row.text).join(''), before);
  assert.equal(rows.filter(row => row.kind !== 'removed').map(row => row.text).join(''), after);
  return rows;
}

test('diff preserves exact versions, order, repeated lines, whitespace, CRLF and final newline', () => {
  for (const [before, after] of [
    ['same\nold\nsame\n', 'same\nnew\nsame\n'],
    ['a\r\n\r\nb \r\n', 'a\r\n\r\nb\r\n'], ['a', 'a\n'],
    ['', 'created\n'], ['deleted\n', ''], ['', ''], ['same\n', 'same\n'],
    ['a\nb\na\nb\n', 'b\na\nb\na\n'], ['💚\n<script>', '💚\n</script>'],
  ]) reconstructed(before, after);
  assert.deepEqual(contentDiff('start\nold\nend\n', 'start\nnew\nend\n').map(r => r.kind), ['context', 'removed', 'added', 'context']);
});

test('diff bounds quadratic work without dropping either large source version', () => {
  const before = Array.from({ length: 1100 }, (_, i) => `old ${i}\n`).join('');
  const after = Array.from({ length: 1100 }, (_, i) => `new ${i}\n`).join('');
  const rows = reconstructed(before, after);
  assert.equal(rows.length, 2200);
  assert.equal(reconstructed('a\n'.repeat(300_000), 'b\n'.repeat(300_000)).length, 2);
  assert.equal(reconstructed('a\n'.repeat(6_000), 'b\n'.repeat(6_000)).length, 2);
  for (let i = 0; i < 70; i++) {
    const a = Array.from({ length: i }, (_, n) => `${(n * 7 + i) % 5}\n`).join('');
    reconstructed(a, a.slice(i) + 'tail');
  }
});

test('diff is escaped inert markup with semantic additions/removals and non-color markers', () => {
  const html = renderContentDiff('<script>evil()</script>\n', '<img src=x onerror=evil()>\n');
  assert.match(html, /aria-label="Content changes"/);
  assert.match(html, /− Removed/); assert.match(html, /\+ Added/);
  assert.match(html, /<del class="diff-text">&lt;script&gt;/);
  assert.match(html, /<ins class="diff-text">&lt;img/);
  assert.doesNotMatch(html, /<(script|img|iframe|a)\b|onclick=/);
  assert.match(renderContentDiff('same', 'same'), /No content changes/);
  assert.match(renderContentDiff('a', 'b'), /No final newline/);
  assert.match(renderContentDiff('', ''), /Captured content is empty/);
  assert.match(renderContentDiff('removed', ''), /Current captured content is empty/);
  assert.match(renderContentDiff('', 'added'), /Previous captured content is empty/);
  assert.throws(() => renderContentDiff(undefined, 'after'), /Two explicit text versions/);
});

test('every source artifact type uses supplied before/after changes without source or review edits', async () => {
  for (const kind of ['message', 'document', 'diff', 'record', 'file', 'other']) {
    const doc = await snapshot();
    Object.assign(doc.artifacts[0], { kind, change: 'modified', before: 'Title\nOld text\n', after: 'Title\nNew text\n', content: 'Title\nNew text\n' });
    doc.copy_review = fakeCopyReview(doc); doc.review = await fakeChecker().check(doc);
    const before = JSON.stringify(doc), digest = factualDigest(doc);
    const result = renderHtml(doc);
    assert.equal(result.ok, true);
    const card = result.html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)[0];
    assert.match(card, /class="content-diff"/);
    assert.match(card, /<del class="diff-text">Old text\n<\/del>/);
    assert.match(card, /<ins class="diff-text">New text\n<\/ins>/);
    assert.doesNotMatch(card, /class="artifact-change"/);
    assert.equal(JSON.stringify(doc), before); assert.equal(factualDigest(doc), digest);
    assert.match(result.html, /connect-src &#39;none&#39;/);
    assert.doesNotMatch(result.html, /unsafe-inline|unsafe-eval/);
    doc.timeline[0].description += ' Changed.';
    assert.equal(renderHtml(doc).ok, false);
  }
});

test('a single captured side never invents a baseline, and equal versions show one body', async () => {
  const doc = await snapshot();
  let card = renderHtml(doc).html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)[0];
  assert.doesNotMatch(card, /Content changes|Removed|<del|<ins/);
  doc.artifacts[0].before = doc.artifacts[0].after;
  doc.copy_review = fakeCopyReview(doc); doc.review = await fakeChecker().check(doc);
  card = renderHtml(doc).html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)[0];
  assert.match(card, /No content changes/);
  const displayed = [...card.matchAll(/<span class="diff-text">([\s\S]*?)<\/span>/g)].map(match => match[1]).join('');
  assert.equal((displayed.match(/We open at nine\./g) ?? []).length, 1);
  assert.match(card, /<details class="diff-context-disclosure">/);
});
