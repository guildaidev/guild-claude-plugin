import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { prepareRenderSnapshot } from './contracts.mjs';
import { renderMarkdown } from './markdown.mjs';
import { validatedFeedbackContext as feedbackContext } from './feedback-context.mjs';
import { buttonHtml, textareaHtml, queueHtml, externalLinkIconHtml } from '../ui/dist/server.mjs';
import { displayHeader } from './header-copy.mjs';
import { sourceLimitations, privateValidationEvidence, publicSupportingDetail, publicEvidenceContent } from './public-evidence.mjs';
import { renderContentDiff, diffStyle } from './diff.mjs';
import { concernDetails, publicConcernExplanation } from './concern-details.mjs';
import { artifactSourceLink } from './artifact-link.mjs';

const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pre = (v) => `<pre>${esc(typeof v === 'string' ? v : JSON.stringify(v, null, 2))}</pre>`;
const paragraph = (v) => `<p>${esc(v)}</p>`;
// Only authored inline-code delimiters are interpreted, after HTML escaping.
// Captured Markdown is formatted separately with an inert, escaped subset.
const authored = (v) => esc(v).replace(/`([^`\r\n]+)`/g, '<code>$1</code>');
const link = (url) => {
  const source = artifactSourceLink({ source_url: url, kind: 'document' });
  return source ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}${externalLinkIconHtml()}</a>` : '';
};
const detail = (label, body, className = 'review-details') => `<details class="${className}"><summary>${esc(label)}</summary><div class="detail-body">${body}</div></details>`;
const list = (values) => `<ul>${values.map(v => `<li>${esc(v)}</li>`).join('')}</ul>`;
// Preserve the installed shadcn Button's classes while using native anchor
// semantics. No click handler, new navigation bridge, or executable source HTML.
function artifactLinkHtml(artifact) {
  const source = artifactSourceLink(artifact);
  return source ? `<p class="artifact-source">${buttonHtml({ className: 'artifact-source-link', size: 'sm' }, source.label)
    .replace('<button ', `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" `)
    .replace(' type="button"', '').replace(/<\/button>$/, `${externalLinkIconHtml()}</a>`)}</p>` : '';
}

export function intent(doc, actionId, eventId) {
  const action = doc.presentation.allowed_actions.find(a => a.id === actionId);
  if (!action || (eventId && !doc.timeline.some(e => e.id === eventId))) throw new Error('Unknown intent target.');
  return {
    type: 'scenario_run_feedback_intent', intent_id: `${doc.snapshot_id}:${action.id}${eventId ? `:${eventId}` : ''}`,
    action: action.kind, snapshot_id: doc.snapshot_id, run_id: doc.run.id, scenario_id: doc.scenario.id,
    parent_conversation_ref: doc.presentation.parent_conversation_ref,
    ...(eventId ? { event_id: eventId } : {}),
    feedback: '', scope: 'unspecified', execution: 'not_performed',
  };
}

// Static trusted code only. No host route, endpoint, postMessage, or mutation.
const script = readFileSync(new URL('../ui/dist/browser.js', import.meta.url), 'utf8');
// Presentation tokens follow the supplied Figma; header/document geometry follows
// the user's newer request for more timeline space and page-wide scrolling.
// No demo records, golden persistence, remote assets or executable source HTML.
const layoutStyle = `:root{color-scheme:dark;--bg:#191919;--surface:#202020;--hover:#282828;--text:#e6e6e4;--muted:#a3a3a3;--line:#363636;--ok:#9cbca3;--warn:#c7b38b;--radius:12px;--s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:24px;--s6:32px;--s7:48px;--s8:64px}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow-wrap:anywhere}
main{max-width:1440px;margin:auto;padding:24px;display:grid;grid-template-columns:264px minmax(0,1fr);align-items:start;gap:24px}h1,h2,h3,h4,p{margin:0}h1{font-size:18px;font-weight:600}h2{font-size:26px;line-height:1.3;font-weight:600}h3,h4{font-size:13px;font-weight:600}button,textarea{font:inherit}button,summary{cursor:pointer}:focus-visible{outline:2px solid var(--text);outline-offset:4px}a{color:var(--text);text-underline-offset:3px;overflow-wrap:anywhere}button:disabled{cursor:default}.primary{font-weight:600}
.top{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:16px 24px;padding:16px 32px;border-bottom:1px solid var(--line);min-height:80px;background:var(--bg);z-index:3}.top.is-sticky{position:sticky;top:0}.application-copy{min-width:0}.application-copy p{color:var(--muted)}.muted,.run-meta{color:var(--muted);font-size:13px}.queue h2{font-size:14px;padding:8px 12px 16px}.queue-current{padding:16px;background:var(--surface);border:1px solid var(--line);border-radius:12px}.queue-current h3{font-size:14px}.queue-current p{margin-top:8px;color:var(--muted);font-size:12px}.scenario{min-width:0}.scenario-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.scenario-heading button{flex-shrink:0}.scenario-intro{padding:20px 24px 24px}.description{margin-top:12px;color:var(--muted)}.run-meta{margin-top:12px}.guidance{margin-top:12px;font-size:12px;color:var(--muted)}code{font:.92em ui-monospace,SFMono-Regular,monospace;overflow-wrap:anywhere}
.timeline{margin-top:8px}.event{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:12px;padding:12px;margin-bottom:12px}.event-marker{font-size:18px;text-align:center;color:var(--muted)}.event.terminal .event-marker,.event.confirmed .event-marker{color:var(--ok)}.event.warning .event-marker{color:#d99191}.event-content{min-width:0}.event-meta{font-size:11px;color:var(--muted);margin-bottom:4px}.event-meta time{font-variant-numeric:tabular-nums;white-space:nowrap}.event-title{color:var(--text);font-size:14px;line-height:1.6;font-weight:500;overflow-wrap:anywhere}.comment-control{align-self:start;padding:3px 8px;font-size:12px;background:transparent;border-color:transparent}
.business-artifact{margin-top:var(--s4);padding:var(--s5);background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);min-width:0}.artifact-body{margin-top:var(--s4)}.artifact-body>p{margin-top:var(--s2)}.artifact-change{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s4)}.artifact-change h4{font-size:12px;color:var(--muted);font-weight:400}.artifact-content{white-space:pre-wrap;overflow-wrap:anywhere}.business-artifact pre{font-family:inherit;font-size:14px;margin:var(--s1) 0 0}.artifact-source{font-size:12px;margin-top:var(--s3)}
.markdown{overflow-wrap:anywhere;min-width:0}.markdown>*+*{margin-top:var(--s3)}.markdown h4,.markdown h5,.markdown h6{font-size:14px;font-weight:600}.markdown ul,.markdown ol{padding-left:22px}.markdown li+li{margin-top:var(--s1)}.markdown blockquote{margin:var(--s3) 0;padding-left:var(--s3);border-left:3px solid var(--line);color:var(--muted)}.markdown pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);padding:var(--s3);border-radius:6px}.slack-channel{padding-bottom:var(--s3);margin-bottom:var(--s4);border-bottom:1px solid var(--line);font-size:13px;font-weight:600}.slack-message{display:grid;grid-template-columns:36px minmax(0,1fr);gap:var(--s3)}.slack-avatar{width:36px;height:36px;border-radius:8px;background:#47414c;display:grid;place-items:center;color:#ddd0e8;font-size:20px;font-weight:600}.slack-byline{display:flex;gap:var(--s2);align-items:baseline;flex-wrap:wrap;margin-bottom:var(--s1)}.slack-author{font-weight:600}.slack-byline time{font-size:12px;color:var(--muted)}.slack-message .artifact-body{margin-top:0}
.event-details,.review-details{margin-top:var(--s3);font-size:13px;color:var(--muted)}details>summary{width:fit-content;padding:var(--s1) 0}details>summary:hover{color:var(--text)}.detail-body{margin-top:var(--s3);padding:var(--s4);background:var(--surface);border-radius:var(--radius);color:var(--text);min-width:0}.detail-body p+p{margin-top:var(--s3)}.detail-body dl{margin:var(--s3) 0 0;display:grid;grid-template-columns:120px minmax(0,1fr);gap:var(--s2) var(--s4)}.detail-body dt{color:var(--muted)}.detail-body dd{margin:0;overflow-wrap:anywhere}.detail-body pre{margin:var(--s3) 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,monospace}.detail-body h3{margin-top:var(--s4)}.detail-body section+section{margin-top:var(--s5)}.detail-body li{overflow-wrap:anywhere}.detail-body ul{padding-left:var(--s4)}
.review-block{display:grid;grid-template-columns:max-content minmax(0,1fr);align-items:start;column-gap:8px;margin-top:var(--s3)}.review-flag{display:contents;font-size:13px}.review-flag::details-content{display:contents}.review-flag>summary{grid-column:1;grid-row:1;font-weight:600;color:#d99191;min-height:36px}.review-flag>summary:hover{color:#e8aaaa}.review-flag>.detail-body{grid-column:1/-1;grid-row:2;color:var(--text)}.review-flag:not([open])>.detail-body{display:none}.review-flag .detail-body>h3:first-child{margin-top:0}.dismiss-concern{grid-column:2;grid-row:1;justify-self:start;border:0;background:transparent;box-shadow:none;border-radius:0;padding:4px 0;min-height:36px;height:auto;text-decoration:underline;text-underline-offset:3px;font-size:12px;color:var(--muted)}textarea{display:block;width:100%;min-height:160px;max-height:260px;margin-top:var(--s3);padding:var(--s2);background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,monospace}textarea[hidden]{display:none}[role=status]{margin-top:var(--s2);color:var(--muted);font-size:12px}[role=status]:empty{display:none}.unplaced-artifacts{margin-top:var(--s6)}.compact .event{padding-bottom:var(--s5)}.compact .event:last-child{padding-bottom:0}
.prompt-state{justify-self:end;display:grid;grid-template-columns:36px auto;align-items:center;gap:8px;max-width:100%}.count{display:grid;place-items:center;flex-shrink:0;width:36px;min-height:36px;padding:2px;background:var(--hover);border:1px solid var(--line);border-radius:8px;font-size:16px}.prompt-state>button{min-height:40px}.prompt-state .error{grid-column:1/-1}.external-link-icon{display:inline-block;width:14px;height:14px;margin-left:6px;vertical-align:-2px;flex-shrink:0}.queued-item{border-left:2px solid var(--ok);padding:10px 12px;margin-top:12px;border-radius:0 8px 8px 0;background:var(--surface);font-size:12px}.queued-item>span{color:var(--ok)}.queued-item p{margin:4px 0}.queued-item button,.item-controls button{padding:2px 0;background:transparent;border:0;font-size:12px;margin-right:12px;color:var(--muted)}.item-text{white-space:pre-wrap;overflow-wrap:anywhere}
dialog{color:var(--text);background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);overflow:auto}dialog::backdrop{background:#0009}dialog h2{font-size:14px}dialog textarea{font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;resize:vertical;max-height:none}#comment-composer{width:400px}#comment-context{font-size:12px;margin-top:4px;color:var(--muted)}#comment-text{min-height:100px}.dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.error{color:#d99191;font-size:12px}.error:empty{display:none}.error:not(:empty){margin-top:8px}#prompt-review{width:1088px;padding:32px}#prompt-review h2{font-size:26px}.modal-heading{display:flex;align-items:start;justify-content:space-between;gap:16px}.modal-heading p{color:var(--muted);margin-top:8px}.close-modal{width:40px;height:40px;padding:0;font-size:22px}.review-columns{display:grid;grid-template-columns:minmax(0,424fr) minmax(0,576fr);gap:24px;margin-top:28px}.review-columns h3{font-size:14px;margin-bottom:12px}.prompt-item{border:1px solid var(--line);padding:16px;border-radius:12px;margin-bottom:12px;background:var(--bg)}.prompt-item h3{font-size:13px;color:var(--ok)}.prompt-item p{font-size:13px;margin:12px 0}.prompt-item .item-controls{display:flex;gap:12px}#prompt-preview{margin:0;min-height:420px;height: min(548px,55dvh);resize:vertical;font:12px/1.7 ui-monospace,SFMono-Regular,monospace}.review-bottom{margin-top:28px;border-top:1px solid var(--line);padding-top:24px}.review-bottom p{color:var(--muted);font-size:13px}.review-bottom .dialog-actions{justify-content:space-between;align-items:center}.review-bottom .primary{min-width:288px;min-height:56px}.noscript{padding:16px;color:#d99191}
@media(max-width:900px){main{grid-template-columns:200px minmax(0,1fr);gap:12px;padding:16px 12px}.top{padding:16px}.scenario-intro{padding:12px}.scenario-heading{flex-direction:column}.review-columns{grid-template-columns:1fr}#prompt-review{padding:20px}}@media(max-width:600px){main{display:block;padding:12px}.queue{margin-bottom:12px}.queue h2{display:none}.queue-current{padding:8px 12px}.queue-current h3{font-size:12px}.top{grid-template-columns:minmax(0,1fr);padding:12px 16px;gap:12px}.prompt-state{grid-row:1;grid-template-columns:28px auto;width:auto}.prompt-state>button{min-height:36px;font-size:12px;padding:8px 10px}.count{width:28px;min-height:28px;font-size:14px}.scenario-heading{gap:8px}.scenario-heading h2{font-size:21px}.description{margin-top:8px}.event{gap:8px;padding:8px;grid-template-columns:20px minmax(0,1fr)}.comment-control{grid-column:2;justify-self:start}.artifact-change{grid-template-columns:1fr}.business-artifact{padding:16px}.detail-body dl{grid-template-columns:1fr;gap:4px}.detail-body dd+dt{margin-top:8px}.review-bottom .dialog-actions{flex-direction:column-reverse;align-items:stretch}.review-bottom .primary{min-width:0}.review-columns{margin-top:20px}#prompt-review h2{font-size:22px}}`;
const refinements = `
.comment-control{min-height:36px;padding:8px 14px;background:var(--surface);border:1px solid #606060;border-radius:8px;font-size:13px;box-shadow:0 1px 2px #0003}.comment-control:hover{background:#333;border-color:#999}.comment-control:active{background:#414141}.scenario-heading button{height:auto;min-height:40px;white-space:normal;text-align:center}.feedback-origin{color:var(--muted);font-size:11px!important}.queued-item h3{color:var(--ok);font-size:12px}.queued-item .item-controls button,.prompt-item .item-controls button{padding:4px 8px;min-height:32px;margin:0}.queued-item .item-controls{display:flex;gap:4px}.queued-item .item-text{margin-top:8px}.count{position:relative;overflow:hidden;font-variant-numeric:tabular-nums;box-shadow:inset 0 12px 16px #0004,inset 0 -1px #ffffff15}.count:after{content:'';position:absolute;inset:50% 0 auto;border-top:1px solid #ffffff18;pointer-events:none}.register-add{animation:register-up 520ms steps(8,end)}.register-remove{animation:register-down 520ms steps(8,end)}@keyframes register-up{0%{transform:translateY(0);box-shadow:inset 0 -24px 0 #9cbca344}35%{transform:translateY(-8px) rotateX(28deg)}65%{transform:translateY(3px) rotateX(-12deg)}100%{transform:translateY(0)}}@keyframes register-down{0%{transform:translateY(0);box-shadow:inset 0 24px 0 #c7b38b44}35%{transform:translateY(8px) rotateX(-28deg)}65%{transform:translateY(-3px) rotateX(12deg)}100%{transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.register-add,.register-remove{animation:none}button{transition:none!important}}`;
// Tailwind preflight resets native dialog centring and list markers. Restore
// these document semantics explicitly; no runtime style injection is needed.
const semanticStyle = `dialog{margin:auto}.markdown ul{list-style:disc}.markdown ol{list-style:decimal}.queued-item{border:1px solid var(--line);border-left:2px solid var(--ok)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.comment-control{min-height:44px;min-width:88px}}`;
// Only native dialogs and textareas own scroll areas. The queue, heading and
// timeline all remain in normal document flow, including on narrow/short screens.
// 168px is the enforced maximum sticky header (160px) plus an 8px focus gap;
// native scrollIntoView/fragment navigation therefore cannot hide a target.
const documentStyle = `html{scrollbar-gutter:stable}body{min-height:100dvh}.top.is-sticky~main *{scroll-margin-top:168px}dialog{z-index:10}@media(forced-colors:active){.top{border-bottom:1px solid CanvasText}.count{border:1px solid CanvasText}}`;
const style = readFileSync(new URL('../ui/dist/ui.css', import.meta.url), 'utf8') + layoutStyle + refinements + semanticStyle + documentStyle + diffStyle;
const hash = (content) => createHash('sha256').update(content).digest('base64');

function feedback(doc) {
  const action = doc.presentation.allowed_actions.find(a => a.kind === 'mark_run_correct');
  if (!action) return '';
  return buttonHtml({ 'data-add-correct': true, 'data-action': action.id }, '✓ Add to prompt as correct');
}
function slackMetadata(doc, event, artifact, text) {
  if (artifact.kind !== 'message' || !/^Slack(?:\b|\s|\()/i.test(event.world_effect?.system ?? '')) return null;
  for (const evidence of doc.evidence.filter(item => artifact.evidence_refs.includes(item.id))) {
    const c = evidence.content;
    if (!c || typeof c !== 'object' || c.ok !== true || !/^[CGD][A-Z0-9]+$/.test(c.channel ?? '') || !/^\d+\.\d+$/.test(c.ts ?? '')) continue;
    const message = c.message ?? c;
    if (message.text !== text) continue;
    const names = new Set();
    if (typeof c.channel_name === 'string' && /^[\w-]+$/.test(c.channel_name)) names.add(c.channel_name);
    for (const item of doc.evidence.filter(item => event.evidence_refs.includes(item.id))) {
      const match = /\bchannel ([CGD][A-Z0-9]+) \(([\w-]+)\)/.exec(item.content?.text ?? '');
      if (match?.[1] === c.channel) names.add(match[2]);
    }
    const name = names.size === 1 ? [...names][0] : null;
    const at = evidence.occurred_at;
    const clock = at ? /T(\d{2}:\d{2}):\d{2}(?:\.\d+)?Z$/.exec(at)?.[1] : null;
    return { channel: name, sender: message.username ?? message.display_name ?? null,
      app: typeof message.bot_id === 'string', at, clock };
  }
  return null;
}

function artifactHtml(doc, artifactId, event) {
  const a = doc.artifacts.find(a => a.id === artifactId);
  const body = text => text === '' ? paragraph('Captured content is empty.') : /\b(?:markdown|mrkdwn)\b/i.test(a.media_type) ? `<div class="markdown">${renderMarkdown(text)}</div>` : `<p class="artifact-content">${esc(text)}</p>`;
  const slack = slackMetadata(doc, event, a, a.after ?? a.content);
  const hasBefore = typeof a.before === 'string', hasAfter = typeof a.after === 'string', hasContent = typeof a.content === 'string';
  const repeatsAfter = hasAfter && hasContent && a.content.startsWith(a.after) && (a.content === a.after || /^ \(revision [^()\r\n]+\)$/.test(a.content.slice(a.after.length)));
  const capturedText = [...(hasBefore ? [a.before] : []), ...(hasAfter ? [a.after] : []), ...(hasContent && !repeatsAfter ? [a.content] : [])];
  // Keep genuine empty versions in source/projection for the next comparison,
  // but do not spend timeline space on an empty content card. A clearing edit
  // still has a nonempty before value and therefore renders its red removals.
  if (a.structured_content === undefined && capturedText.length && capturedText.every(text => !text.trim())) return '';
  const change = hasBefore && hasAfter ? renderContentDiff(a.before, a.after) : hasAfter || hasBefore ? body(a.after ?? a.before) : '';
  const content = hasContent && !repeatsAfter ? body(a.content) : '';
  const contents = `<div class="artifact-body">${change}${content}${a.structured_content !== undefined ? pre(a.structured_content) : ''}${!hasContent && a.structured_content === undefined && !hasBefore && !hasAfter ? paragraph('Artifact content is unavailable; only metadata was observed.') : ''}</div>`;
  if (slack) return `<aside class="business-artifact slack-artifact" aria-label="Slack message"><div class="slack-channel">Slack${slack.channel ? ` · #${esc(slack.channel)}` : ''}</div><div class="slack-message"><span class="slack-avatar" aria-hidden="true">▦</span><div><div class="slack-byline"><span class="slack-author"${slack.sender ? '' : ' title="Sender display name was not supplied"'}>${esc(slack.sender ?? (slack.app ? 'App' : 'Message'))}</span>${slack.clock ? `<time datetime="${esc(slack.at)}" title="${esc(slack.at)}">${esc(slack.clock)} UTC</time>` : ''}</div>${contents}</div></div>${artifactLinkHtml(a)}</aside>`;
  return `<aside class="business-artifact"><h3>${esc(a.title)}</h3>${contents}${artifactLinkHtml(a)}</aside>`;
}

const definitions = (values) => `<dl>${Object.entries(values).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
function eventTime(event) {
  if (!event.time) return { label: 'Unknown', full: 'Unknown' };
  if (!event.time.at) {
    const clock = value => value?.match(/T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/)?.[1] ?? value ?? '?';
    return { label: `${clock(event.time.earliest)}–${clock(event.time.latest)}`, full: `${event.time.earliest ?? 'unknown'} to ${event.time.latest ?? 'unknown'}` };
  }
  // Source time, not browser-local time. Full date/offset stay available in detail.
  const at = event.time.at;
  const match = at.match(/T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  return { label: match ? match[1] : at, full: at, at };
}

export function renderHtml(doc) {
  const prepared = prepareRenderSnapshot(doc);
  return prepared.ok ? renderPreparedHtml(prepared.snapshot) : prepared;
}

function renderPreparedHtml(doc) {
  const header = displayHeader(doc);
  const currentHeader = ['1.7', '1.8', '1.9', '1.10'].includes(doc.schema_version);
  const issueAction = doc.presentation.allowed_actions.find(action => action.kind === 'flag_issue');
  const used = new Set(doc.timeline.flatMap(e => e.artifact_refs));
  const supportingArtifacts = doc.artifacts.filter(artifact => !used.has(artifact.id));
  const supportingIndex = Math.max(0, doc.timeline.findIndex(e => ['agent_world_action', 'external_world_action'].includes(e.kind)));
  const privateEvidence = privateValidationEvidence(doc), grouped = doc.artifact_version_source?.schema_version === '2.1';
  const sourceDetails = ids => doc.evidence.filter(e => ids.includes(e.id) && !privateEvidence.has(e.id)).map(e => {
    let content = publicEvidenceContent(doc, e);
    if ((grouped || doc.schema_version === '1.10') && e.content?.event?.task?.tool_name === 'console_log') {
      try { content = JSON.parse(e.content.event.content.message).material.content; } catch { content = undefined; }
    }
    return `<section><h3>${esc(e.id)}</h3>${paragraph(`${e.source.system}; record ${e.source.record_id ?? 'unknown'}; observed ${e.captured_at}; completeness ${e.completeness}.`)}${e.occurred_at ? paragraph(`Source event time: ${e.occurred_at}.`) : paragraph('Source event time is unknown.')}${link(e.source.url)}${content === undefined ? '' : pre(content)}${list(e.redactions)}</section>`;
  }).join('');
  const story = doc.timeline.map((e, index) => {
    const actor = doc.actors.find(a => a.id === e.actor_id);
    const t = eventTime(e);
    const reviews = e.claim_refs.map(id => doc.review?.findings.find(f => f.claim_id === id)).filter(Boolean);
    const statuses = [...new Set(reviews.map(f => f.finding))];
    const concern = Boolean(e.concern) || ['failed', 'partial'].includes(e.outcome) || statuses.includes('conflict');
    const terminal = e.kind === 'session_terminated' && e.outcome === 'confirmed' && statuses.length > 0 && statuses.every(s => s === 'confirmed');
    const confirmed = e.outcome === 'confirmed' && statuses.length > 0 && statuses.every(s => s === 'confirmed');
    const classes = `event${e.kind === 'external_world_action' ? ' other' : ''}${terminal ? ' terminal' : ''}${concern ? ' warning' : ''}`;
    const fix = e.suggested_feedback;
    const concernCopy = concernDetails(e);
    // The concern and the human explanation of a fix are authored separately.
    // Never use the technical prompt as prose or repeat raw outcome/evidence rows.
    const explanation = authored(publicConcernExplanation(e.concern?.explanation) || concernCopy[0]?.text || 'The available evidence does not explain how this event conflicts with the application goal.');
    const fixExplanation = publicConcernExplanation(fix?.explanation);
    const humanFix = fixExplanation ? authored(fixExplanation) : 'The available evidence does not support a specific application change.';
    const flag = concern ? `<div class="review-block" data-concern-event="${esc(e.id)}">${detail('Possibly incorrect behavior', '<h3>Claude’s concern</h3><p>' + explanation + '</p><h3>Suggested fix</h3><p>' + humanFix + '</p>' + (fixExplanation ? buttonHtml({ 'data-add-fix': true, 'data-action': fix.action_id, 'data-event': e.id }, 'Add suggested fix to prompt') : buttonHtml({ disabled: true, title: 'A supported suggested fix is not available.' }, 'Add suggested fix to prompt')), 'review-flag')}${buttonHtml({ variant: 'link', className: 'dismiss-concern', size: 'sm', 'data-dismiss-concern': e.id, 'data-event': e.id, 'aria-label': 'Dismiss this concern' }, 'Dismiss')}</div>` : '';
    const artifacts = doc.artifacts.filter(a => e.artifact_refs.includes(a.id));
    const publicDetail = publicSupportingDetail(doc, e);
    const supporting = (publicDetail ? `<p>${authored(publicDetail)}</p>` : '') + paragraph(`Outcome: ${e.outcome}. Time: ${t.full}.`) + definitions({ Actor: actor.label, 'Actor kind': actor.kind, 'Source time': t.full, Service: e.world_effect?.system ?? 'Guild workspace' }) + pre({ event_id: e.id, session_id: e.session_id ?? 'unknown', evidence_refs: e.evidence_refs, relationships: e.relationships, relevance: e.workflow_relevance ?? 'not applicable' }) + list(sourceLimitations(doc, e)) + (!grouped && doc.schema_version !== '1.10' && artifacts.length ? pre({ artifacts }) : '') + sourceDetails([...new Set([...e.evidence_refs, ...artifacts.flatMap(a => a.evidence_refs)])]) + (index === 0 ? definitions({ 'Run status': doc.run.status, 'Observed state': doc.run.observed_resulting_state }) + pre({ run_id: doc.run.id, scenario_id: doc.scenario.id, workspace_id: doc.run.workspace_id, sessions: doc.sessions }) : '');
    const sourceMaterial = (index === 0 ? definitions({ 'Application version': doc.run.application_version, 'Execution label': doc.run.execution_label ?? 'Recorded run', Workspace: doc.run.workspace_id }) + list(sourceLimitations(doc)) + (currentHeader ? `<h3>Original workflow and scenario specification</h3>${pre({ workflow: doc.workflow, scenario: doc.scenario })}` : '') : '') + (index === supportingIndex && supportingArtifacts.length ? `<section class="supporting-source-material"><h3>Supporting source material</h3>${pre(supportingArtifacts)}${sourceDetails([...new Set(supportingArtifacts.flatMap(a => a.evidence_refs))])}</section>` : '');
    return `<article id="${esc(e.id)}" class="${classes}"><span class="event-marker" aria-hidden="true">${concern ? '!' : e.outcome === 'confirmed' ? '✓' : '○'}</span><div class="event-content"><p class="event-meta">Step ${index + 1} · <time${t.at ? ` datetime="${esc(t.at)}"` : ''} title="${esc(t.full)}">${esc(t.label)}</time></p><h3 class="event-title">${authored(e.description)}</h3>${e.artifact_refs.map(id => artifactHtml(doc, id, e)).join('')}${flag}${detail('Evidence and technical details', supporting + sourceMaterial, 'event-details')}<div data-queued="${esc(e.id)}" aria-live="polite"></div></div>${issueAction ? buttonHtml({ className: 'comment-control', size: 'sm', 'data-comment': true, 'data-action': issueAction.id, 'data-event': e.id, 'aria-label': `Comment on step ${index + 1}` }, 'Comment') : ''}</article>`;
  }).join('');
  const csp = `default-src 'none'; style-src 'sha256-${hash(style)}'; script-src 'sha256-${hash(script)}'; connect-src 'none'; img-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${esc(csp)}"><meta name="referrer" content="no-referrer"><title>${esc(header.scenario_name)} — ${currentHeader ? esc(header.application_name) : 'Run review'}</title><style>${style}</style></head>
<body class="${doc.display.compact ? 'compact' : ''}"><header class="top"><div class="application-copy"><h1>${esc(header.application_name)}</h1><p>${esc(header.workflow_purpose)}</p></div><section class="prompt-state" aria-label="Claude prompt"><span id="prompt-count" class="count" aria-hidden="true">0</span>${buttonHtml({ variant: 'default', className: 'primary', id: 'review-prompt', 'aria-describedby': 'prompt-count-description', disabled: true }, 'Review prompt')}<span id="prompt-count-description" class="sr-only">0 items in prompt.</span><p id="cart-status" class="error" role="alert"></p><p id="cart-motion-status" class="sr-only" role="status" aria-live="polite"></p></section></header><main>
<aside class="queue" aria-label="Review queue"><h2>Review queue</h2>${queueHtml(header.scenario_name)}</aside>
<section class="scenario" aria-label="Scenario run" tabindex="0"><div class="scenario-intro"><div class="scenario-heading"><h2>${esc(header.scenario_name)}</h2>${feedback(doc)}</div><p class="description">${['1.8', '1.9', '1.10'].includes(doc.schema_version) ? esc(header.scenario_description) : currentHeader ? `${esc(header.starting_context)} ${esc(header.observed_result)}` : `Expected: ${esc(header.expected_outcome)}`}</p><div data-queued="" aria-live="polite"></div></div>
<div class="timeline" aria-label="World state over time">${story || paragraph('No consequential events could be established from the available evidence.')}</div></section>
</main>
<noscript><p class="noscript">JavaScript is required to collect local feedback. Evidence remains readable. Nothing is sent or applied.</p></noscript>
<dialog id="comment-composer" aria-labelledby="comment-title" aria-describedby="comment-context"><h2 id="comment-title">Add a comment</h2><p id="comment-context"></p>${textareaHtml({ id: 'comment-text', 'aria-label': 'Feedback text', placeholder: 'What should change, or what should Claude preserve?', maxLength: 10000 })}<p id="comment-error" class="error" role="alert"></p><div class="dialog-actions">${buttonHtml({ 'data-close-comment': true }, 'Cancel')}${buttonHtml({ variant: 'default', className: 'primary', id: 'save-comment' }, 'Add to prompt')}</div></dialog>
<dialog id="prompt-review" aria-labelledby="review-title" aria-describedby="included-summary"><header class="modal-heading"><div><h2 id="review-title">Review your Claude prompt</h2><p id="included-summary"></p></div>${buttonHtml({ className: 'close-modal', size: 'icon', 'data-close-review': true, 'aria-label': 'Close prompt review' }, '×')}</header><div class="review-columns"><section><h3 id="included-title">Included items (0)</h3><div id="prompt-items"></div></section><section><h3>Prompt preview</h3>${textareaHtml({ id: 'prompt-preview', readOnly: true, 'aria-label': 'Final Claude prompt' })}<p class="error" id="prompt-error" role="alert"></p></section></div><footer class="review-bottom"><p>Copy this prompt, paste it into your original Claude chat, and submit it there. This page does not send, run, apply, approve or save anything.</p><div class="dialog-actions">${buttonHtml({ 'data-close-review': true }, 'Continue reviewing')}${buttonHtml({ variant: 'default', className: 'primary', id: 'copy-prompt', disabled: true }, 'Copy Claude prompt')}</div><p id="copy-status" role="status" aria-live="polite"></p></footer></dialog>
<textarea id="feedback-context" hidden readonly aria-hidden="true">${esc(JSON.stringify(feedbackContext(doc)))}</textarea>
<script>${script}</script></body></html>`;
  return { ok: true, html };
}

export async function renderFile(inputPath, outputPath) {
  try {
    if (!outputPath || !outputPath.endsWith('.html')) return { ok: false, errors: [{ path: '$output', code: 'output_path', message: 'Expected an explicit .html output path.', repair: 'Choose a new HTML file in an approved local directory.' }] };
    const input = await readFile(inputPath);
    if (input.length > 10 * 1024 * 1024) return { ok: false, errors: [{ path: '$', code: 'size_limit', message: 'Snapshot exceeds 10 MiB.', repair: 'Keep relevant sanitized excerpts and record the coverage gap.' }] };
    let doc;
    try { doc = JSON.parse(input.toString('utf8')); }
    catch { return { ok: false, errors: [{ path: '$', code: 'invalid_json', message: 'Input is not JSON.', repair: 'Write valid JSON without raw source dumps.' }] }; }
    const prepared = prepareRenderSnapshot(doc);
    if (!prepared.ok) return prepared;
    const result = renderPreparedHtml(prepared.snapshot);
    if (!result.ok) return result;
    const artifactPath = resolve(outputPath);
    // Refuse to overwrite any existing artifact or user file.
    await writeFile(artifactPath, result.html, { flag: 'wx', mode: 0o600 });
    const checked = prepared.snapshot;
    return { ok: true, artifact_path: artifactPath, snapshot_id: doc.snapshot_id, review_mode: prepared.review_mode, review_diagnostics: prepared.review_diagnostics, verification: { findings: checked.review?.findings ?? [] }, copy_review: checked.copy_review ? { reviewer_id: checked.copy_review.reviewer_id, verdict: checked.copy_review.verdict, candidate_digest: checked.copy_review.candidate_digest } : { status: doc.copy_review !== undefined ? 'invalid' : 'not_performed' }, gaps: checked.coverage.gaps };
  } catch (err) {
    return { ok: false, errors: [{ path: '$file', code: ['ENOENT', 'EACCES', 'EEXIST', 'ENOSPC'].includes(err.code) ? err.code : 'render_failure', message: 'Could not read the snapshot or write a new artifact.', repair: 'Check local permissions and paths; select a new output filename. Do not claim an artifact was created.' }] };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await renderFile(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
