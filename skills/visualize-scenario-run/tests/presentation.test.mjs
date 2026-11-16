import test from 'node:test';
import assert from 'node:assert/strict';
import { factualDigest } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { snapshot, fakeChecker, fakeCopyReview } from './fixtures.mjs';
import { scenario } from './scenarios.mjs';

test('Figma tokens, queue and sentence-led steps retain prompt state in the header', async () => {
  const doc = await snapshot();
  const before = structuredClone(doc);
  const digest = factualDigest(doc);
  const { html, ok } = renderHtml(doc);
  assert.equal(ok, true);
  for (const token of ['--bg:#191919', '--surface:#202020', '--text:#e6e6e4', '--line:#363636', '--radius:12px', 'grid-template-columns:264px minmax(0,1fr)', 'class="prompt-state"', '@media(max-width:600px)']) {
    assert.ok(html.includes(token), token);
  }
  assert.equal((html.match(/class="event(?: [^"]*)?"/g) ?? []).length, doc.timeline.length);
  assert.equal((html.match(/<h3 class="event-title">/g) ?? []).length, doc.timeline.length);
  assert.equal((html.match(/<summary>Evidence and technical details<\/summary>/g) ?? []).length, doc.timeline.length);
  assert.match(html, /class="business-artifact"/);
  assert.match(html, /<time title="Unknown">Unknown<\/time>/);
  assert.match(html, /aria-label="Review queue"/);
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /font-variant-numeric:tabular-nums;white-space:nowrap/);
  assert.match(html, /class="event-meta">Step 1/);
  assert.doesNotMatch(html, /role="tablist"|localStorage|goldenRuns|Market monitor|Staynest|data-scenario=/);
  assert.match(html, /id="review-prompt"[^>]*disabled=""[^>]*>Review prompt/);
  assert.equal((html.match(/class="[^"]*queue-current"/g) ?? []).length, 1);
  assert.equal(factualDigest(doc), digest);
  assert.deepEqual(doc, before);
});

test('step metadata shows source times and actual ranges without generic labels', async () => {
  const doc = await snapshot();
  doc.timeline[0].time = { at: '2026-11-13T10:02:02Z' };
  doc.timeline[1].time = { earliest: '2026-11-13T10:02:03Z', latest: '2026-11-13T10:02:07Z' };
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  const { html, ok } = renderHtml(doc);
  assert.equal(ok, true);
  assert.match(html, /<time datetime="2026-11-13T10:02:02Z" title="2026-11-13T10:02:02Z">10:02:02<\/time>/);
  assert.match(html, /title="2026-11-13T10:02:03Z to 2026-11-13T10:02:07Z">10:02:03–10:02:07<\/time>/);
  assert.match(html, /<time title="Unknown">Unknown<\/time>/);
  assert.doesNotMatch(html.match(/class="event-meta">[\s\S]*?<\/p>/g).join(''), /Bounded|Recorded|completed|Evidence has limitations/);
});

test('timeline and queue omit generic status labels while technical evidence stays intact', async () => {
  const doc = await snapshot();
  const original = structuredClone(doc);
  const html = renderHtml(doc).html;
  const queue = html.match(/<aside class="queue"[\s\S]*?<\/aside>/)[0];
  assert.doesNotMatch(queue, /Recorded|completed|<p>/);
  const metadata = [...html.matchAll(/<p class="event-meta">([^<]*)<time[^>]*>[^<]*<\/time>([^<]*)<\/p>/g)];
  assert.equal(metadata.length, doc.timeline.length);
  for (const meta of metadata) {
    assert.match(meta[1], /^Step \d+ · $/);
    assert.equal(meta[2], '');
  }
  assert.match(html, /<dt>Run status<\/dt><dd>completed<\/dd>/);
  assert.deepEqual(doc, original);
});

test('external markers, confirmed terminal styling and visible conflict/failure distinctions', async () => {
  const { doc } = scenario('downstream-session');
  doc.copy_review_iterations = 1;
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  const rendered = renderHtml(doc);
  assert.equal(rendered.ok, true);
  assert.match(rendered.html, /id="mail-index" class="event other"/);
  assert.match(rendered.html, /class="event terminal"/);
  const unverified = await snapshot();
  unverified.review = await fakeChecker({ finding: 'unavailable', gap: 'Source unavailable.' }).check(unverified);
  const unverifiedHtml = renderHtml(unverified).html;
  assert.doesNotMatch(unverifiedHtml, /class="event terminal"/);
  assert.match(unverifiedHtml, /<li>Source unavailable\.<\/li>/);
  assert.doesNotMatch(unverifiedHtml, /class="event-note"/);
  assert.doesNotMatch(unverifiedHtml, /Verification: unavailable/);
  assert.doesNotMatch(unverifiedHtml, /<summary>Possibly incorrect behavior<\/summary>/);
  for (const name of ['partial-failure', 'contradictory-verification']) {
    const { doc: failure, options } = scenario(name);
    failure.copy_review_iterations = 1;
    failure.copy_review = fakeCopyReview(failure);
    failure.review = await fakeChecker(options).check(failure);
    assert.match(renderHtml(failure).html, /<summary>Possibly incorrect behavior<\/summary>/);
  }
});

test('feedback controls require allowed intents and never represent approval or execution', async () => {
  const doc = await snapshot();
  let html = renderHtml(doc).html;
  assert.match(html, /data-add-correct="true" data-action="correct"/);
  assert.doesNotMatch(html, /Copy-to-parent intent only/);
  assert.match(html, /id="prompt-preview" readOnly="" aria-label="Final Claude prompt"/);
  assert.equal((html.match(/data-comment="true" /g) ?? []).length, doc.timeline.length);
  assert.doesNotMatch(html, /aria-pressed=|fetch\(|window\.parent|window\.opener|localStorage/);
  doc.presentation.allowed_actions = [];
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  html = renderHtml(doc).html;
  assert.doesNotMatch(html, /data-add-correct="true" data-action=|data-comment="true" /);
  assert.match(html, /id="review-prompt"[^>]*disabled/);
});

test('cart keeps provenance inside evidence disclosures, not extra audit UI', async () => {
  const doc = await snapshot();
  const before = structuredClone(doc);
  const html = renderHtml(doc).html;
  assert.doesNotMatch(html, /Scenario and observed result|Coverage and verification limits|More feedback to the original parent|Verification findings and independent source reads|Technical context and provenance|Artifact provenance and redactions|Feedback on this event/);
  assert.doesNotMatch(html, /non-confirmed claim|coverage gaps|Verification:|class="artifact-meta"|Editorial reading order|No automatic feedback transport/);
  assert.doesNotMatch(html, /class="origin"|Synthetic data|class="event-note"|Copy-to-parent intent only/);
  assert.equal((html.match(/id="copy-prompt"/g) ?? []).length, 1);
  assert.match(html, /execution:"not_performed"/);
  // React's trusted implementation contains a generic innerHTML path; our
  // components never call it. Hostile-content/browser and source tests cover this.
  assert.doesNotMatch(html, /sessionStorage/);
  assert.equal((html.match(/<summary>Evidence and technical details<\/summary>/g) ?? []).length, doc.timeline.length);
  // Provenance remains available inside existing evidence disclosures, not a new audit footer.
  assert.match(html, new RegExp(doc.review.factual_digest));
  assert.match(html, /completeness/);
  assert.deepEqual(doc, before);
});

test('inline artifact omits repeated after-state metadata but retains distinct business content', async () => {
  const doc = await snapshot();
  doc.artifacts[0].content = `${doc.artifacts[0].after} (revision rev-2)`;
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  let html = renderHtml(doc).html;
  let card = html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)[0];
  assert.doesNotMatch(card, /revision rev-2|Artifact provenance|text\/plain/);
  assert.equal((card.match(/We open at nine\./g) ?? []).length, 1);
  assert.match(html, /revision rev-2/); // The exact content is retained in technical evidence.
  doc.artifacts[0].content = `${doc.artifacts[0].after} Also open on Sundays.`;
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  html = renderHtml(doc).html;
  card = html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)[0];
  assert.match(card, /Also open on Sundays/);
});
