import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../scripts/markdown.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { validate, validateCandidate, factualDigest, prepareRenderSnapshot, LEGACY_COPY_RULE_VERSIONS } from '../scripts/contracts.mjs';
import { snapshot, fakeCopyReview, fakeChecker } from './fixtures.mjs';

// Synthetic reviewer records below exercise presentation/contracts, not model judgment.
async function reviewed(doc) {
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  return doc;
}
const report = '# Berlin rental market\n3 nights · 2 guests\n\n- Coast Stays: **EUR 260**.\n- Urban Nests: **EUR 295**.\n\nLowest observed total: Coast Stays, EUR 35 lower.';
async function slackCase() {
  const doc = await snapshot();
  const event = doc.timeline[1], artifact = doc.artifacts[0];
  event.world_effect.system = 'Slack';
  artifact.media_type = 'text/markdown'; artifact.content = report; artifact.after = report;
  const source = doc.evidence.find(e => e.id === 'e-draft');
  source.occurred_at = '2026-01-01T12:00:00Z';
  source.content = { ok: true, channel: 'C0123456789', ts: '1767268800.000100', message: { bot_id: 'B0123456789', text: report } };
  doc.evidence.push({ ...structuredClone(source), id: 'e-request', content: { text: 'Slack chat.postMessage request: channel C0123456789 (rental-market-intel); text is the comparison.' } });
  event.evidence_refs.push('e-request');
  return reviewed(doc);
}

test('inert Markdown formats business text, lists, emphasis and code without changing the input', () => {
  const before = report;
  const html = renderMarkdown(report);
  assert.match(html, /<h4>Berlin rental market<\/h4>/);
  assert.match(html, /<ul><li>Coast Stays: <strong>EUR 260<\/strong>/);
  assert.equal((html.match(/<li>/g) ?? []).length, 2);
  assert.equal(report, before);
  assert.equal(renderMarkdown(report), html);
  assert.match(renderMarkdown('> *Quoted*\n\n3. Third\n4. Fourth\n\n```js\n<script>\n```'), /<blockquote><p><em>Quoted<\/em>/);
  assert.match(renderMarkdown('3. Third'), /<ol start="3">/);
  assert.match(renderMarkdown('`<x>` and ~~old~~ and __bold__'), /<code>&lt;x&gt;<\/code> and <s>old<\/s> and <strong>bold<\/strong>/);
  assert.match(renderMarkdown('```html\n<script>\n```'), /&lt;script&gt;/);
});

test('Markdown never executes HTML, images, unsafe links or service mentions', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n![avatar](https://a.test/x.png)\n[x](javascript:alert)\n[x](data:text/html,evil)\n[x](https://user:pass@a.test/x)\n[x](https://a.test/x?secret=1)\n[x](https://a.test/x#fragment)\n<@U123>');
  assert.doesNotMatch(html, /<(?:script|img|iframe|a)\b/i);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;@U123&gt;/);
  assert.match(renderMarkdown('[record](https://example.test/record)'), /href="https:\/\/example.test\/record" target="_blank" rel="noopener noreferrer"/);
});

test('Slack attachment is a full-width formatted message with source-backed metadata and no After label', async () => {
  const doc = await slackCase(), before = JSON.stringify(doc);
  const html = renderHtml(doc).html;
  const card = html.match(/<aside class="business-artifact slack-artifact"[\s\S]*?<\/aside>/)[0];
  assert.match(card, /Slack · #rental-market-intel/);
  assert.match(card, />App<\/span>/);
  assert.match(card, />12:00 UTC<\/time>/);
  assert.match(card, /<strong>EUR 260<\/strong>/);
  assert.doesNotMatch(card, /<h4>After<\/h4>|artifact-change|<img|reaction|read receipt/i);
  assert.equal(JSON.stringify(doc), before);
  assert.match(html, /img-src &#39;none&#39;/);
  const plain = structuredClone(doc); plain.artifacts[0].media_type = 'text/plain';
  const plainHtml = renderHtml(await reviewed(plain)).html;
  assert.match(plainHtml, /# Berlin rental market/);
  assert.doesNotMatch(plainHtml, /<strong>EUR 260<\/strong>/);
  const mismatch = structuredClone(doc); mismatch.evidence[1].content.message.text = 'Different body';
  assert.doesNotMatch(renderHtml(await reviewed(mismatch)).html, /class="business-artifact slack-artifact"/);
  const noName = structuredClone(doc); noName.evidence.find(e => e.id === 'e-request').content.text = 'No channel name supplied.';
  const noNameCard = renderHtml(await reviewed(noName)).html.match(/<aside class="business-artifact slack-artifact"[\s\S]*?<\/aside>/)[0];
  assert.doesNotMatch(noNameCard, /#rental-market-intel/);
});

test('current HTML schema rejects detached cards; legacy source artifacts appear only inside evidence', async () => {
  const doc = await snapshot();
  doc.artifacts.push({ ...structuredClone(doc.artifacts[0]), id: 'source-offer', title: 'Supporting offer page' });
  doc.artifact_claims.push({ artifact_id: 'source-offer', claim_refs: ['context'] });
  await reviewed(doc);
  assert.ok(validate(doc).errors.some(e => e.code === 'detached_artifact'));
  const { review, copy_review, copy_review_iterations, ...candidate } = doc;
  assert.ok(validateCandidate(candidate).errors.some(e => e.code === 'detached_artifact'));
  doc.schema_version = '1.3';
  delete doc.header_copy;
  delete doc.copy_review_iterations;
  doc.copy_review = fakeCopyReview(doc); doc.copy_review.rule_versions = { ...LEGACY_COPY_RULE_VERSIONS };
  doc.review = await fakeChecker().check(doc);
  const before = JSON.stringify(doc), digest = factualDigest(doc);
  assert.equal(prepareRenderSnapshot(doc).review_mode, 'legacy-dual-review');
  const html = renderHtml(doc).html;
  assert.equal((html.match(/<aside class="business-artifact"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<h3>Supporting offer page<\/h3>|<h2>Artifacts<\/h2>/);
  assert.match(html, /class="supporting-source-material"/);
  assert.equal(JSON.stringify(doc), before);
  assert.equal(doc.review.factual_digest, digest);
  doc.timeline[0].description += ' Changed.';
  assert.ok(prepareRenderSnapshot(doc).errors.some(e => e.code === 'stale_review'));
});
