// Explicitly synthetic authoring fixture, not a real application observation.
import { bundle, sourceBoundCandidate } from './fixtures.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';

export const humanConcern = 'The draft does not state Sunday opening hours. The customer cannot use it to plan a Sunday visit.';
export const humanFix = 'Check Sunday opening hours before you save the draft. If you cannot confirm the hours, ask the customer to wait.';
export const technicalFix = 'Update the reply agent: check Sunday opening hours before calling save_draft. Add tests for confirmed hours and a timed-out lookup. Never send a message as part of this change.';

export function concernFixture() {
  const input = bundle();
  input.workflow.intended_world_effect = 'Save a reply with confirmed Sunday opening hours.';
  input.scenario.initial_conditions = 'The customer needs Sunday opening hours to plan a visit.';
  input.scenario.expected_outcome = 'The reply draft states confirmed Sunday opening hours.';
  input.run.status = 'partial';
  input.run.observed_resulting_state = 'The reply draft does not state confirmed Sunday opening hours.';
  input.occurrences[1].outcome = 'partial';
  input.occurrences[1].description = 'The assistant saved a draft without confirmed Sunday opening hours.';
  input.evidence[1].content.text = 'Sunday opening hours are not confirmed.';
  Object.assign(input.artifacts[0], { content: input.evidence[1].content.text, after: input.evidence[1].content.text });
  const old = sourceBoundCandidate(input);
  const draft = {
    schema_version: '1.4', snapshot_id: old.snapshot_id, editor_id: old.editor_id,
    parent_agent_id: old.parent_agent_id, summary: old.summary, claims: old.claims,
    header_copy: old.header_copy, artifact_claims: old.artifact_claims,
    omitted_occurrences: old.omitted_occurrences,
    events: old.timeline.map(event => ({ occurrence_id: event.id,
      description: event.description, claim_refs: event.claim_refs, supporting_detail: event.supporting_detail })),
  };
  const event = draft.events[1], refs = { evidence_refs: ['e-draft'], claim_refs: event.claim_refs };
  event.concern = { explanation: humanConcern, ...refs };
  event.suggested_feedback = { explanation: humanFix, text: technicalFix, action_id: 'issue', ...refs };
  const result = assembleCandidate(input, draft);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return { input, draft, doc: result.snapshot };
}
