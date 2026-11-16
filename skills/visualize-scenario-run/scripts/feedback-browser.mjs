// Serialized as trusted static code by render.mjs. All user/source text uses DOM
// text/value setters, never HTML. Cart is memory-only, scoped to this one page.
export function startFeedback(runtime, ui) {
  const context = JSON.parse(document.getElementById('feedback-context').value);
  const review = document.getElementById('prompt-review');
  const composer = document.getElementById('comment-composer');
  const field = document.getElementById('comment-text');
  const preview = document.getElementById('prompt-preview');
  const copy = document.getElementById('copy-prompt');
  const header = document.querySelector('.top');
  // Keep a compact header available on roomy screens. Long copy, narrow screens
  // and short windows use normal flow instead of hiding the timeline under it.
  // Class changes only: hash-only CSP permits neither inline styles nor injection.
  const measureHeader = () => header.classList.toggle('is-sticky', innerWidth > 600 && header.offsetHeight <= Math.min(160, innerHeight / 4));
  new ResizeObserver(measureHeader).observe(header);
  window.addEventListener('resize', measureHeader);
  measureHeader();
  // Native focus scrolls the document; correct only a sticky-header overlap.
  // Dialogs retain their own native scrolling and focus management.
  document.addEventListener('focusin', event => {
    if (!header.classList.contains('is-sticky') || header.contains(event.target) || event.target.closest('dialog')) return;
    const target = event.target.getBoundingClientRect(), boundary = header.getBoundingClientRect();
    if (target.top < boundary.bottom && target.bottom > 0) window.scrollBy(0, target.top - boundary.bottom - 8);
  });
  let items = [];
  let target;
  let opener;
  const title = value => `${runtime.labels[value.kind]} · ${value.event_id ? `Step ${context.events.find(event => event.id === value.event_id).step}` : 'Whole scenario'}`;
  function registerChange(before) {
    if (before === items.length) return;
    const register = document.getElementById('prompt-count');
    register.classList.remove('register-add', 'register-remove');
    // Restart a CSS-only mechanical counter/till animation, without inline styles.
    void register.offsetWidth;
    register.classList.add(items.length > before ? 'register-add' : 'register-remove');
    document.getElementById('cart-motion-status').textContent = `${items.length > before ? 'Added to' : 'Removed from'} prompt. ${items.length} ${items.length === 1 ? 'item' : 'items'}.`;
  }
  function compose() {
    try {
      preview.value = runtime.compose(context, items);
      copy.disabled = !items.length;
      document.getElementById('prompt-error').textContent = '';
    } catch (error) {
      preview.value = '';
      copy.disabled = true;
      document.getElementById('prompt-error').textContent = error.message;
    }
    // A previous clipboard success must never describe a later edited prompt.
    document.getElementById('copy-status').textContent = '';
  }
  function edit(value, source) {
    target = { kind: value.kind, actionId: value.action_id, eventId: value.event_id };
    opener = source;
    document.getElementById('comment-title').textContent = `Edit ${runtime.labels[value.kind].toLowerCase()}`;
    document.getElementById('save-comment').textContent = 'Save changes';
    document.getElementById('comment-context').textContent = title(value);
    field.value = value.feedback;
    composer.showModal();
    field.focus();
  }
  function redraw() {
    document.getElementById('cart-status').textContent = '';
    const count = items.length;
    document.getElementById('prompt-count').textContent = count;
    document.getElementById('prompt-count-description').textContent = `${count} ${count === 1 ? 'item' : 'items'} in prompt.`;
    document.getElementById('review-prompt').disabled = !count;
    document.getElementById('included-title').textContent = `Included items (${count})`;
    document.getElementById('included-summary').textContent = `${count} ${count === 1 ? 'item' : 'items'} · Edit or remove anything before you copy.`;
    const remove = value => { const before = items.length; items = runtime.remove(items, value.item_id); redraw(); registerChange(before); };
    ui.renderItems(document.getElementById('prompt-items'), items, { title, edit, remove });
    for (const slot of document.querySelectorAll('[data-queued]')) {
      ui.renderItems(slot, items.filter(value => (value.event_id ?? '') === slot.dataset.queued), { title, edit, remove, compact: true });
    }
    for (const control of document.querySelectorAll('[data-add-correct], [data-add-fix]')) {
      const kind = control.hasAttribute('data-add-correct') ? 'correct' : 'fix';
      const exists = items.some(value => value.item_id === runtime.key(context, kind, control.dataset.action, control.dataset.event));
      control.textContent = exists ? (kind === 'correct' ? '✓ Correct result added' : '✓ Fix added') : (kind === 'correct' ? '✓ Add to prompt as correct' : 'Add suggested fix to prompt');
      control.disabled = exists;
    }
    compose();
  }
  document.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control) return;
    if (control.hasAttribute('data-dismiss-concern')) {
      const wrapper = control.closest('[data-concern-event]');
      if (!wrapper || wrapper.dataset.concernEvent !== control.dataset.dismissConcern) return;
      event.preventDefault();
      event.stopPropagation();
      const article = wrapper.closest('article');
      const next = article?.querySelector('.event-details > summary') ?? article?.querySelector('[data-comment]');
      // Visibility only: preserve the event, evidence and any queued feedback.
      // Removal is memory-only and the original concern returns on reload.
      wrapper.remove();
      next?.focus();
      return;
    }
    if (control.hasAttribute('data-comment')) {
      const existing = items.find(value => value.kind === 'comment' && value.event_id === control.dataset.event);
      if (existing) return edit(existing, control);
      target = { kind: 'comment', actionId: control.dataset.action, eventId: control.dataset.event };
      opener = control;
      document.getElementById('comment-title').textContent = 'Add a comment';
      document.getElementById('save-comment').textContent = 'Add to prompt';
      document.getElementById('comment-context').textContent = `${context.scenario_title} · Step ${context.events.find(value => value.id === target.eventId).step}`;
      field.value = '';
      composer.showModal(); field.focus();
    }
    if (control.hasAttribute('data-add-correct') || control.hasAttribute('data-add-fix')) {
      const kind = control.hasAttribute('data-add-correct') ? 'correct' : 'fix';
      const feedback = kind === 'correct' ? 'Preserve the behavior shown in this run.' : context.events.find(value => value.id === control.dataset.event).suggested_feedback.text;
      try {
        const before = items.length;
        items = runtime.add(context, items, kind, control.dataset.action, control.dataset.event, feedback);
        redraw();
        registerChange(before);
      } catch (error) { document.getElementById('cart-status').textContent = error.message; }
    }
  });
  document.getElementById('save-comment').addEventListener('click', () => {
    try {
      const before = items.length;
      items = runtime.add(context, items, target.kind, target.actionId, target.eventId, field.value);
      document.getElementById('comment-error').textContent = '';
      composer.close(); redraw(); registerChange(before); opener?.focus();
    } catch (error) { document.getElementById('comment-error').textContent = error.message; }
  });
  for (const control of document.querySelectorAll('[data-close-comment]')) control.addEventListener('click', () => composer.close());
  composer.addEventListener('close', () => { document.getElementById('comment-error').textContent = ''; opener?.focus(); });
  document.getElementById('review-prompt').addEventListener('click', () => { redraw(); review.showModal(); });
  for (const control of document.querySelectorAll('[data-close-review]')) control.addEventListener('click', () => review.close());
  copy.addEventListener('click', async () => {
    // Capture exact bytes before awaiting clipboard; controls are modal and the
    // status is cleared whenever the cart changes.
    const text = preview.value;
    if (!text || copy.disabled) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (text === preview.value) document.getElementById('copy-status').textContent = 'Copied. Paste and submit in your original Claude chat. Nothing was sent or applied.';
    } catch {
      preview.focus(); preview.select();
      document.getElementById('copy-status').textContent = 'Copy the selected prompt manually, then paste and submit in your original Claude chat. Nothing was sent or applied.';
    }
  });
  redraw();
}
