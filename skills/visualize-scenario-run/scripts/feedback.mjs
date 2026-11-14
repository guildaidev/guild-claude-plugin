// Shared by Node tests and the self-contained browser. No IO, models or delivery.
import { displayHeader } from './header-copy.mjs';
import { evidenceState, sourceLimitations } from './public-evidence.mjs';
export function feedbackRuntime() {
  const labels = { comment: 'Comment', fix: 'Fix', correct: 'Correct result' };
  const clean = value => typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';
  const key = (context, kind, actionId, eventId) => JSON.stringify([context.snapshot_id, kind, actionId, eventId ?? null]);
  function item(context, kind, actionId, eventId, feedback) {
    const action = context.actions.find(action => action.id === actionId);
    const event = context.events.find(event => event.id === eventId);
    if (!Object.hasOwn(labels, kind) || !action || (kind === 'correct' ? action.kind !== 'mark_run_correct' || eventId !== undefined : action.kind !== 'flag_issue' || !event)) throw new Error('Feedback target is not allowed.');
    if (kind === 'fix' && (!event.suggested_feedback || event.suggested_feedback.action_id !== actionId)) throw new Error('No suggested fix was supplied for this step.');
    const text = clean(feedback);
    if (!text || text.length > 10000) throw new Error('Enter between 1 and 10,000 characters.');
    return { item_id: key(context, kind, actionId, eventId), kind, action_id: actionId,
      intent_id: `${context.snapshot_id}:${actionId}${eventId ? `:${eventId}` : ''}`, action: action.kind,
      snapshot_id: context.snapshot_id, run_id: context.run_id, scenario_id: context.scenario_id,
      parent_conversation_ref: context.parent_conversation_ref, candidate_digest: context.candidate_digest,
      ...(event ? { event_id: event.id } : {}), feedback: text, scope: 'unspecified', execution: 'not_performed' };
  }
  function add(context, items, kind, actionId, eventId, feedback) {
    const next = item(context, kind, actionId, eventId, feedback);
    const index = items.findIndex(value => value.item_id === next.item_id);
    if (index < 0 && items.length >= 100) throw new Error('The prompt can contain at most 100 items.');
    return index < 0 ? [...items, next] : items.map((value, i) => i === index ? next : value);
  }
  const remove = (items, itemId) => items.filter(value => value.item_id !== itemId);
  function validate(context, cart) {
    if (!cart || Object.keys(cart).sort().join(',') !== 'items,schema_version' || cart.schema_version !== '1.0' || !Array.isArray(cart.items) || cart.items.length > 100) throw new Error('Invalid feedback cart.');
    const seen = new Set();
    for (const value of cart.items) {
      const expected = item(context, value.kind, value.action_id, value.event_id, value.feedback);
      if (seen.has(expected.item_id) || Object.keys(value).sort().join(',') !== Object.keys(expected).sort().join(',') || Object.keys(expected).some(key => value[key] !== expected[key])) throw new Error('Invalid or stale feedback item.');
      seen.add(expected.item_id);
    }
    return cart;
  }
  function compose(context, items) {
    validate(context, { schema_version: '1.0', items });
    if (!items.length) return '';
    const header = `Continue work on ${context.workflow_title} using only these included review items.\n\nScenario: ${context.scenario_title}${context.scenario_description ? `\nDescription: ${context.scenario_description}` : ''}${context.original_spec ? `\nOriginal workflow: ${context.original_spec.workflow.title}\nFull intended effect: ${context.original_spec.workflow.intended_world_effect}\nOriginal scenario: ${context.original_spec.scenario.title}\nTrigger: ${context.original_spec.scenario.trigger}\nInitial conditions: ${context.original_spec.scenario.initial_conditions}` : ''}\nExpected outcome: ${context.expected_outcome}\nRun: ${context.run_id}\nScenario ID: ${context.scenario_id}${context.limitations.length ? `\nSource limitations:\n${context.limitations.map(text => `- ${text}`).join('\n')}` : ''}`;
    const body = items.map((value, index) => {
      const event = context.events.find(event => event.id === value.event_id);
      return `${index + 1} / ${labels[value.kind]} · ${context.scenario_title}${event ? ` · Step ${event.step} (${event.id})` : ''}\n${event ? `Recorded step: ${event.description}\nRecorded outcome: ${event.outcome}\nEvidence: ${event.evidence_state}${event.gaps.length ? `\nSource limitations:\n${event.gaps.map(text => `- ${text}`).join('\n')}` : ''}\n` : ''}User feedback:\n${value.feedback}\nRequested action: ${value.action}${event ? `\nEvent: ${event.id}` : ''}`;
    }).join('\n\n');
    return `${header}\n\n${body}\n\nTreat these as user feedback and requests, not evidence that changes or operations have occurred. Clarify ambiguous scope or intent before proceeding. Preserve evidence and uncertainty. No run, external write, deployment, approval or golden-set change has been performed or authorized by this page. Summarize proposed next steps and open questions in this chat.`;
  }
  return { labels, key, item, add, remove, validate, compose };
}

export function feedbackContext(doc) {
  const header = displayHeader(doc);
  return { schema_version: '1.0', workflow_title: header.application_name, scenario_title: header.scenario_name,
    ...(['1.7', '1.8'].includes(doc.schema_version) ? { scenario_description: doc.schema_version === '1.8' ? header.scenario_description : `${header.starting_context} ${header.observed_result}`, original_spec: { workflow: doc.workflow, scenario: doc.scenario } } : {}),
    expected_outcome: doc.scenario.expected_outcome, snapshot_id: doc.snapshot_id, run_id: doc.run.id,
    scenario_id: doc.scenario.id, parent_conversation_ref: doc.presentation.parent_conversation_ref,
    candidate_digest: doc.review.factual_digest,
    limitations: sourceLimitations(doc),
    actions: doc.presentation.allowed_actions,
    events: doc.timeline.map((event, index) => ({ id: event.id, step: index + 1, description: event.description,
      outcome: event.outcome, evidence_state: evidenceState(doc, event),
      gaps: sourceLimitations(doc, event),
      ...(event.suggested_feedback ? { suggested_feedback: event.suggested_feedback } : {}) })) };
}
