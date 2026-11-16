import test from 'node:test';
import assert from 'node:assert/strict';
import { bundle, sourceBoundCandidate, snapshot, fakeChecker, fakeCopyReview } from './fixtures.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { concernDetails } from '../scripts/concern-details.mjs';
import { artifactSourceLink } from '../scripts/artifact-link.mjs';

const concern = html => html.match(/<details class="review-flag">[\s\S]*?<\/details>/)?.[0];
const card = html => html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)?.[0];

for (const [outcome, description, change, detail] of [
  ['failed', 'The paper search failed: two requests timed out and two were rate-limited.', 'No paper records were returned.', 'Attempts returned HTTP 504, 429, 504 and 429. Response headers were omitted.'],
  ['partial', 'The rewrite stopped early with one term unexplained.', 'Returned a rewrite with one term left unexplained.', 'The rewrite explained 30 terms and stopped at its three-round limit. Per-term model logs include private diagnostics.'],
]) {
  test(`current source-bound ${outcome} concern explains the recorded business problem without review records`, () => {
    const input = bundle(), event = input.occurrences[1];
    event.outcome = outcome; event.description = description; event.world_effect.change = change;
    event.workflow_relevance = { explanation: 'The requested reply remains incomplete.', basis: 'observed', evidence_refs: event.evidence_refs };
    const doc = sourceBoundCandidate(input);
    doc.timeline[1].supporting_detail = detail;
    const before = structuredClone(doc), rendered = renderHtml(doc);
    assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
    const panel = concern(rendered.html);
    assert.ok(panel);
    assert.ok(panel.includes(description));
    assert.doesNotMatch(panel, /Recorded problem|Recorded effect|Source detail|Workflow impact|Outcome:/);
    assert.match(panel, /<h3>Suggested fix<\/h3>/);
    assert.match(panel, /disabled[^>]*>Add suggested fix to prompt/);
    assert.doesNotMatch(panel, /model|diagnostics|checker|reviewer|digest|schema|snapshot|claim_refs|evidence_refs/);
    assert.deepEqual(doc, before);
    assert.equal(doc.review, undefined);
    assert.match(rendered.html, /class="event warning"/);
  });
}

test('concern excerpts preserve full sentences and do not manufacture a cause from a status', () => {
  const event = { outcome: 'failed', description: 'The update failed.', supporting_detail: 'No further detail was supplied.' };
  assert.deepEqual(concernDetails(event), [
    { label: 'Recorded problem', text: 'The update failed.' },
    { label: 'Source detail', text: 'No further detail was supplied.' },
  ]);
  assert.deepEqual(concernDetails({ description: 'Version 1.9 stopped.', supporting_detail: 'The model failed because its limit was exceeded; the cause is uncertain.' }), [
    { label: 'Recorded problem', text: 'Version 1.9 stopped.' },
  ]);
  assert.deepEqual(concernDetails({ description: 'Snapshot diagnostics.', supporting_detail: 'Model metadata.' }), []);
});

test('missing safe concern copy falls back honestly and malicious authored content stays inert', () => {
  const input = bundle(); input.occurrences[1].outcome = 'failed';
  input.occurrences[1].description = 'Model diagnostics.';
  input.occurrences[1].world_effect.change = 'Model diagnostics.';
  const doc = sourceBoundCandidate(input); doc.timeline[1].supporting_detail = 'Model diagnostics.';
  assert.match(concern(renderHtml(doc).html), /does not explain how this event conflicts with the application goal/);
  doc.timeline[1].description = '<script>alert("bad")</script> failed.';
  doc.timeline[1].supporting_detail = 'The result contains `<img src=x onerror=bad>`. No cause was recorded.';
  const panel = concern(renderHtml(doc).html);
  assert.match(panel, /&lt;script&gt;/);
  assert.doesNotMatch(panel, /The result contains/);
  assert.doesNotMatch(panel, /<script|<img|onerror="/);
});

test('legacy reviewed conflicts retain limitations without presenting a technical prompt as a plain fix', async () => {
  const doc = await snapshot();
  doc.timeline[1].outcome = 'partial';
  doc.timeline[1].suggested_feedback = { text: 'Check the saved draft.', action_id: 'issue', evidence_refs: doc.timeline[1].evidence_refs, claim_refs: doc.timeline[1].claim_refs };
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker({ finding: 'conflict', gap: 'The source records disagree about delivery.' }).check(doc);
  const result = renderHtml(doc);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.match(result.html, /The source records disagree about delivery/);
  assert.doesNotMatch(result.html, /data-add-fix="true"/);
  assert.match(result.html, /<h3>Claude’s concern<\/h3>/);
  assert.match(concern(result.html), /<h3>Suggested fix<\/h3>/);
  assert.doesNotMatch(concern(result.html), /Check the saved draft/);
  assert.match(concern(result.html), /disabled[^>]*>Add suggested fix to prompt/);
  assert.match(result.html, /data-concern-event="draft-1"/);
  assert.match(result.html, /type="button"[^>]*data-dismiss-concern="draft-1"[^>]*data-event="draft-1"[^>]*aria-label="Dismiss this concern"/);
  assert.doesNotMatch(result.html, /<summary>[^<]*<button/);
  assert.doesNotMatch(result.html, /Copy suggested prompt to fix/);
  assert.doesNotMatch(result.html, /class="event terminal"/);
});

test('external-service failures are not presented as proof of incorrect agent behavior', () => {
  const input = bundle();
  input.occurrences[1].kind = 'external_world_action';
  input.occurrences[1].outcome = 'failed';
  input.occurrences[1].workflow_relevance = { explanation: 'The requested reply remains incomplete.', basis: 'observed', evidence_refs: ['e-draft'] };
  const rendered = renderHtml(sourceBoundCandidate(input));
  assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
  assert.doesNotMatch(concern(rendered.html), /agent caused|agent is incorrect|agent is at fault/);
  assert.match(concern(rendered.html), /available evidence does not support a specific application change/);
});

test('all event descriptions share the readable text color while status icons retain their distinctions', () => {
  const html = renderHtml(sourceBoundCandidate()).html;
  assert.match(html, /\.event-title\{color:var\(--text\)/);
  assert.doesNotMatch(html, /\.event\.other \.event-title/);
  assert.match(html, /\.event\.warning \.event-marker\{color:#d99191\}/);
});

for (const [url, label] of [
  ['https://docs.google.com/document/d/abc/edit', 'Open Google Doc'],
  ['https://docs.google.com/spreadsheets/d/abc/edit', 'Open Google Sheet'],
  ['https://docs.google.com/presentation/d/abc/edit', 'Open Google Slides'],
  ['https://drive.google.com/file/d/abc/view', 'Open Google Drive file'],
  ['https://workspace.slack.com/archives/C123/p1234567', 'Open Slack message'],
  ['https://github.com/org/repo/pull/42', 'Open GitHub pull request'],
  ['https://github.com/org/repo/issues/42', 'Open GitHub issue'],
  ['https://team.notion.site/Business-plan-abc', 'Open Notion page'],
  ['https://linear.app/team/issue/ABC-42/task', 'Open Linear issue'],
  ['https://example.test/Google-Doc', 'Open page'],
  ['https://docs.google.com.evil.test/document/d/abc', 'Open page'],
  ['https://docs.google.com/not-a-document', 'Open page'],
  ['https://en.wikipedia.org/wiki/Artificial_intelligence', 'Open page'],
  ['https://example.test/article.html', 'Open page'],
  ['https://example.test/report.pdf', 'Open PDF'],
]) {
  test(`source CTA identifies only the actual validated destination: ${label} (${url})`, () => {
    const input = bundle(); input.artifacts[0].kind = 'document'; input.artifacts[0].source_url = url;
    const doc = sourceBoundCandidate(input), before = structuredClone(doc);
    assert.deepEqual(artifactSourceLink(doc.artifacts[0]), { url, label });
    const rendered = renderHtml(doc);
    assert.equal(rendered.ok, true, JSON.stringify(rendered.errors));
    const source = card(rendered.html);
    assert.ok(source.includes(`>${label}<svg`));
    assert.match(source, /class="lucide lucide-external-link external-link-icon"/);
    assert.ok(source.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
    assert.match(source, /inline-flex items-center justify-center/);
    assert.match(source, /artifact-source-link/);
    assert.doesNotMatch(source, /<button|type="button"|onclick|Open source record/);
    assert.deepEqual(doc, before);
  });
}

test('unknown providers use honest artifact kinds; unsafe destinations never produce a link', () => {
  for (const kind of ['document', 'message', 'diff', 'record', 'file']) assert.equal(artifactSourceLink({ kind, source_url: 'https://unknown.test/item' }).label, `Open ${kind === 'document' ? 'page' : kind}`);
  assert.equal(artifactSourceLink({ kind: 'other', source_url: 'https://unknown.test/item' }).label, 'Open source artifact');
  for (const source_url of [undefined, 'javascript:alert(1)', 'data:text/html,bad', 'https://name:password@example.test/file', 'https://example.test/file?token=private', 'https://example.test/file#private', '/relative']) assert.equal(artifactSourceLink({ source_url }), null);
});
