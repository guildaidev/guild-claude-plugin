import { bundle, candidate } from './fixtures.mjs';

export const cases = [
  ['simple-success', 'Simple success with inline artifact and independent fake reads.'],
  ['downstream-session', 'Goal-relevant downstream action starts another top-level session.'],
  ['editorial-correction', 'A required correction stops instead of repeating the sole copy review or rendering stale text.'],
  ['renderer-repair', 'Structured renderer error is repaired within the bound.'],
  ['post-closure-feedback', 'Manual feedback and simulated host-specific automatic routes after editor closure.'],
  ['attempt-versus-effect', 'Request acceptance is not delivery.'],
  ['contradictory-verification', 'Conflicting sources stay visibly conflicting.'],
  ['verification-unavailable', 'Failed authorized reads leave explicit verification gaps.'],
  ['current-state-not-causation', 'A current draft does not prove creation by this run.'],
  ['relevant-omission-noise', 'Keep a relevant downstream effect while omitting plumbing and unrelated effects.'],
  ['partial-failure', 'Retain a confirmed draft alongside a failed send.'],
  ['ambiguous-order', 'Unknown order and inferred cause are not presented as observed history.'],
  ['render-presentation-failure', 'Bounded rendering and opener failures are reported honestly.'],
];

function downstream(input) {
  input.sessions.push({ ...structuredClone(input.sessions[0]), id: 'session-2' });
  input.occurrences.push({ id: 'mail-index', kind: 'external_world_action', actor_id: 'mail', description: 'Sandbox Mail indexed the draft for review and started another top-level Guild session.', outcome: 'confirmed', evidence_refs: ['e-draft'], artifact_refs: [], world_effect: { system: 'Sandbox Mail', change: 'Indexed the draft.' }, relationships: [{ other_occurrence_id: 'draft-1', relation: 'caused_by', basis: 'observed', evidence_refs: ['e-draft'] }], workflow_relevance: { explanation: 'Indexing makes the intended reply review possible.', basis: 'observed', evidence_refs: ['e-draft'] } });
  input.occurrences.push({ ...structuredClone(input.occurrences[0]), id: 'start-2', session_id: 'session-2', description: 'Reply assistant started a second top-level Guild session after the indexing event.', relationships: [{ other_occurrence_id: 'mail-index', relation: 'caused_by', basis: 'observed', evidence_refs: ['e-draft'] }] });
}

export function scenario(name) {
  const input = bundle();
  let options = {};
  if (['downstream-session', 'relevant-omission-noise'].includes(name)) downstream(input);
  if (name === 'relevant-omission-noise') {
    input.sessions.push({ ...structuredClone(input.sessions[0]), id: 'child-1', level: 'child', parent_session_id: 'session-1' });
    input.sessions.push({ ...structuredClone(input.sessions[0]), id: 'unknown-1', level: 'unknown' });
    input.coverage.gaps.push({ id: 'unknown-level', description: 'The level of one session is unknown.', affected_refs: ['unknown-1'], impact: 'Its lifecycle cannot be treated as top-level.' });
    input.occurrences.push({ ...structuredClone(input.occurrences[0]), id: 'child-start', session_id: 'child-1' });
    input.occurrences.push({ ...structuredClone(input.occurrences[0]), id: 'unknown-start', session_id: 'unknown-1' });
    input.occurrences.push({ ...structuredClone(input.occurrences[1]), id: 'read-plumbing', kind: 'supporting_activity', description: 'Read internal configuration.' });
    input.occurrences.push({ id: 'unrelated-mail', kind: 'external_world_action', actor_id: 'mail', description: 'An unrelated mailbox label changed.', outcome: 'confirmed', evidence_refs: ['e-draft'], artifact_refs: [], relationships: [], world_effect: { system: 'Sandbox Mail', change: 'Changed an unrelated label.' } });
  }
  const doc = candidate(input);
  const action = doc.timeline.find(e => e.id === 'draft-1');
  if (name === 'attempt-versus-effect') {
    doc.header_copy.scenario_name = 'Draft save requested';
    doc.header_copy.observed_result = 'The request was accepted. Saving and delivery remain unconfirmed.';
    action.description = 'Reply assistant requested a draft save in Sandbox Mail; acceptance was observed, but saving and delivery are unconfirmed.';
    action.outcome = 'unconfirmed'; action.world_effect.change = 'Requested a draft save; effect unconfirmed.';
    doc.run.status = 'unknown'; doc.run.observed_resulting_state = 'Request acceptance only; resulting draft state is unknown.';
    doc.artifacts[0].change = 'unknown'; delete doc.artifacts[0].after;
    options = { finding: 'qualified', gap: 'Request acceptance does not establish a saved draft or delivery.' };
  }
  if (name === 'contradictory-verification') {
    doc.header_copy.scenario_name = 'Draft result disputed';
    doc.header_copy.observed_result = 'Sources conflict about whether the draft was saved.';
    action.description = 'The parent evidence reports a saved draft in Sandbox Mail, but the independent source conflicts; the effect is unresolved.';
    action.outcome = 'unknown'; doc.run.status = 'unknown'; doc.run.observed_resulting_state = 'Sources conflict about whether the draft was saved.';
    options = { finding: 'conflict', gap: 'Parent record reports saved; independent fixture history reports no save.' };
  }
  if (name === 'verification-unavailable') {
    doc.header_copy.scenario_name = 'Draft result unverified';
    doc.header_copy.observed_result = 'The parent reports a saved draft. Independent verification is unavailable.';
    action.description = 'The parent evidence reports a saved draft in Sandbox Mail; independent verification is unavailable.';
    action.outcome = 'unconfirmed'; doc.run.observed_resulting_state = 'Parent-reported draft only; no independent observation.';
    options = { finding: 'unavailable', gap: 'The authorized fixture source read was unavailable.', readResult: 'unavailable' };
  }
  if (name === 'current-state-not-causation') {
    doc.header_copy.scenario_name = 'Current draft found';
    doc.header_copy.starting_context = 'The prior draft state is unknown.';
    doc.header_copy.observed_result = 'A draft exists now. Its creator and creation time are unknown.';
    action.description = 'A draft exists now in Sandbox Mail; the available history does not establish that this run created it.';
    action.outcome = 'unknown'; action.world_effect.change = 'Current draft observed; creation by this run is unknown.';
    doc.scenario.initial_conditions = 'Prior draft state is unknown.';
    doc.run.observed_resulting_state = 'Current draft exists; creator and creation time are unknown.';
    doc.artifacts[0].change = 'unknown';
    options = { finding: 'qualified', gap: 'Current state is not historical causation; creation history is missing.' };
  }
  if (name === 'partial-failure') {
    doc.header_copy.scenario_name = 'Draft saved but send failed';
    doc.header_copy.observed_result = 'The draft was saved, but a later send attempt failed.';
    doc.run.status = 'partial';
    doc.run.observed_resulting_state = 'The draft was saved, but a later send attempt failed.';
    doc.timeline.push({ ...structuredClone(action), id: 'failed-send', description: 'Reply assistant attempted to send through Sandbox Mail, but the send failed; the saved draft remains.', outcome: 'failed', artifact_refs: [], world_effect: { system: 'Sandbox Mail', change: 'Send attempt failed.' }, claim_refs: ['claim-failed-send'] });
  }
  if (name === 'ambiguous-order') {
    action.relationships.push({ other_occurrence_id: 'start-1', relation: 'follows', basis: 'inferred', evidence_refs: ['e-session'] });
    action.supporting_detail = 'Order is uncertain; a relationship is inferred, not an observed causal history.';
    options = { finding: 'qualified', gap: 'Event times and causal history are unavailable; order is uncertain.' };
  }
  if (Object.keys(options).length) {
    doc.coverage.gaps.push({ id: 'verification-limit', description: options.gap, affected_refs: ['draft-1'] });
  }
  if (name === 'editorial-correction') {
    // Deliberately false authored text for the explicit synthetic correction case.
    doc.header_copy.observed_result = 'The editor initially asserts delivery, contrary to the separate source.';
    action.description = 'Reply assistant sent the customer message through Sandbox Mail.';
    doc.run.observed_resulting_state = 'The editor initially asserts delivery, contrary to the separate source.';
  }
  // Renderer failures are injected by the fixture driver, not by corrupting a
  // candidate that the production preflight must reject before reviewer calls.
  doc.summary = ['simple-success', 'downstream-session', 'relevant-omission-noise', 'renderer-repair', 'post-closure-feedback'].includes(name)
    ? 'Reply assistant saved a draft for review in Sandbox Mail. Sending was not requested or observed.'
    : doc.run.observed_resulting_state;
  // Rebuild fixture claim text after editorial scenario changes, rather than
  // leaving a stale claim that says something different from the story.
  doc.claims = [{ id: 'context', text: `${doc.summary} ${doc.scenario.initial_conditions}`, evidence_refs: doc.run.source_refs },
    ...doc.timeline.map(e => ({ id: e.claim_refs[0], text: e.description, evidence_refs: e.evidence_refs })),
    ...doc.artifacts.map(a => ({ id: `claim-artifact-${a.id}`, text: `${a.title}: ${a.change}.`, evidence_refs: a.evidence_refs }))];
  return { input, doc, options };
}
