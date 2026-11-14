import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Button } from './components/button.jsx';
import { Card } from './components/card.jsx';
import { startFeedback } from '../../scripts/feedback-browser.mjs';
import { feedbackRuntime } from '../../scripts/feedback.mjs';

const roots = new WeakMap();
function renderItems(slot, values, { title, edit, remove, compact }) {
  if (!roots.has(slot)) roots.set(slot, createRoot(slot));
  // Explicit local redraws; no hydration, storage, network or host bridge.
  flushSync(() => roots.get(slot).render(<>{values.map(value => <Card key={value.item_id} className={compact ? 'queued-item' : 'prompt-item'}>
    <h3>{title(value)}</h3><p className="feedback-origin">{value.kind === 'correct' ? 'Preset from “Add to prompt as correct” · included by you' : value.kind === 'fix' ? 'Suggested fix · included by you' : 'Your comment on this step'}</p>
    <p className="item-text">{value.feedback}</p><div className="item-controls">
      <Button type="button" size="sm" variant="ghost" onClick={event => edit(value, event.currentTarget)} aria-label={`Edit ${title(value)}`}>Edit</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => remove(value)} aria-label={`Remove ${title(value)}`}>Remove</Button>
    </div>
  </Card>)}</>));
}
startFeedback(feedbackRuntime(), { renderItems });
