import { createHash } from 'node:crypto';

export const ACTIVITIES = Object.freeze({
  gathering: 'Gathering evidence.', arranging: 'Arranging the timeline.',
  checking: 'Checking details.', polishing: 'Polishing the text.',
});
export const terminalActivity = Object.freeze({
  ready: 'Your review is ready.', blocked: 'Live updates have stopped.',
  retired: 'This review is no longer current.',
});
const hash = text => createHash('sha256').update(text).digest('base64');
const escape = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const style = `:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#191919;color:#e6e6e4;font:16px/1.6 system-ui,sans-serif}main{width:min(560px,100%);padding:40px}h1{font-size:26px;line-height:1.3;margin:24px 0 12px}p{color:#b7b7b7}a{color:inherit}a:focus-visible{outline:2px solid white;outline-offset:4px}.dots{display:flex;gap:12px;height:36px;align-items:center}.dots i{display:block;width:14px;height:14px;border-radius:50%;background:#9cbca3;animation:arrange 1.8s ease-in-out infinite}.dots i:nth-child(2){animation-delay:.2s}.dots i:nth-child(3){animation-delay:.4s}.dots i:nth-child(4){animation-delay:.6s}progress{width:100%;height:10px;accent-color:#9cbca3;margin:20px 0}.paused .dots i{animation:none;background:#777}.paused progress{display:none}small{color:#9c9c9c}@keyframes arrange{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(-9px);opacity:1}}@media(prefers-reduced-motion:reduce){.dots i{animation:none}progress{display:none}}`;

// Trusted static browser code only. All source/target data stays outside code.
export function startProgressBrowser(document, window, fetch, schedule, unschedule) {
  const main = document.querySelector('main');
  const status = document.getElementById('activity');
  const note = document.getElementById('connection');
  const invocation = main.dataset.invocation;
  const labels = ['Gathering evidence.', 'Arranging the timeline.', 'Checking details.', 'Polishing the text.'];
  let stopped = false, timer, controller, errors = 0, sequence = Number(main.dataset.sequence);
  const stop = () => { stopped = true; unschedule(timer); controller?.abort(); main.classList.add('paused'); main.setAttribute('aria-busy', 'false'); };
  window.addEventListener('pagehide', stop, { once: true });
  window.addEventListener('beforeunload', stop, { once: true });
  async function poll() {
    if (stopped) return;
    controller = new window.AbortController();
    const timeout = schedule(() => controller.abort(), 5000);
    try {
      const response = await fetch(new window.URL('status.json', window.location.href), {
        cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal,
      });
      if (!response.ok) throw new Error('Unavailable');
      const text = await response.text();
      if (text.length > 2048) throw new Error('Invalid status');
      const item = JSON.parse(text);
      if (!item || Object.keys(item).sort().join(',') !== 'activity,invocation,sequence,state' ||
          item.invocation !== invocation || !Number.isSafeInteger(item.sequence) || item.sequence < sequence ||
          !['working', 'ready', 'blocked', 'retired'].includes(item.state)) throw new Error('Invalid status');
      if (item.state === 'working' && !labels.includes(item.activity)) throw new Error('Invalid activity');
      if (stopped) return;
      sequence = item.sequence; errors = 0; note.textContent = 'Updates appear as the work moves forward.';
      if (item.state === 'working') status.textContent = item.activity;
      else {
        stop();
        status.textContent = item.state === 'ready' ? 'Your review is ready.' : item.state === 'retired' ? 'This review is no longer current.' : 'Live updates have stopped.';
        note.textContent = item.state === 'blocked' ? 'See the original conversation for the next update.' : '';
        if (item.state === 'ready') window.location.replace(new window.URL('final.html', window.location.href).href);
      }
    } catch {
      if (!stopped && ++errors >= 3) {
        stop(); status.textContent = 'Live updates are unavailable.';
        note.textContent = 'This does not tell us whether the review has finished. Check the original conversation for the final link.';
      }
    } finally {
      unschedule(timeout);
      if (!stopped) timer = schedule(poll, 1000);
    }
  }
  poll();
  return stop;
}

export function progressPage(record, live = false) {
  const title = 'Generating test run timeline';
  const activity = record.state === 'working' ? ACTIVITIES[record.stage] : terminalActivity[record.state];
  const script = live ? `(${startProgressBrowser.toString()})(document,window,window.fetch.bind(window),window.setTimeout.bind(window),window.clearTimeout.bind(window));` : '';
  const csp = `default-src 'none'; style-src 'sha256-${hash(style)}'; script-src ${live ? `'sha256-${hash(script)}'` : "'none'"}; connect-src ${live ? "'self'" : "'none'"}; img-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escape(csp)}"><meta name="referrer" content="no-referrer"><title>${title}</title><style>${style}</style></head><body><main data-invocation="${escape(record.invocation)}" data-sequence="${record.sequence}" aria-busy="${record.state === 'working'}"${record.state === 'working' ? '' : ' class="paused"'}><div class="dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div><h1>${title}</h1><p id="activity" role="status" aria-live="polite" aria-atomic="true">${escape(activity)}</p><progress aria-label="${title}">Working</progress>${live ? '<p id="connection">Updates appear as the work moves forward.</p>' : ''}${!live && record.state === 'ready' ? '<p><a href="completed-review.html">Open the completed review</a></p>' : ''}<small>No actions are being applied to your application.</small>${live ? '<noscript><p>Live updates need JavaScript. Use the final link in the original conversation.</p></noscript>' : ''}</main>${script ? `<script>${script}</script>` : ''}</body></html>`;
  return { html, csp };
}
