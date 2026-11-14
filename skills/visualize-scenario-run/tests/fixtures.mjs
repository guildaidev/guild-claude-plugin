import { factualDigest, copyFields, COPY_RULE_VERSIONS, HEADER_COPY_RULE_VERSIONS, SUMMARY_HEADER_COPY_RULE_VERSIONS } from '../scripts/contracts.mjs';

export const observedAt = '2026-01-01T12:00:00Z';
export function bundle() {
  return {
    schema_version: '1.0', bundle_id: 'bundle-1',
    workflow: { title: 'Review a customer reply', intended_world_effect: 'Save a reply draft for review.', relevant_systems: ['Guild', 'Sandbox Mail'] },
    scenario: { id: 'scenario-1', title: 'A routine question', trigger: 'A customer asks about opening hours.', initial_conditions: 'No reply draft exists.', expected_outcome: 'One draft, not a sent message.' },
    run: { id: 'run-1', workspace_id: 'workspace-1', agent_version_ids: ['version-7'], application_version: 'app-3', sandbox_integrations: ['Sandbox Mail: drafts-only fixture'], status: 'completed', observed_resulting_state: 'One reply draft exists; no delivery is observed.', source_refs: ['e-session'] },
    actors: [
      { id: 'agent-1', label: 'Reply assistant', kind: 'agent', workspace_id: 'workspace-1', agent_version_id: 'version-7' },
      { id: 'mail', label: 'Sandbox Mail', kind: 'external_system' },
    ],
    sessions: [{ id: 'session-1', workspace_id: 'workspace-1', level: 'top_level', agent_actor_id: 'agent-1', source_refs: ['e-session'] }],
    evidence: [
      { id: 'e-session', kind: 'session_record', source: { system: 'Guild fixture', record_id: 'session-1' }, captured_at: observedAt, content: { status: 'completed' }, completeness: 'complete', redactions: [] },
      { id: 'e-draft', kind: 'external_record', source: { system: 'Sandbox Mail fixture', record_id: 'draft-1', url: 'https://example.test/drafts/1' }, captured_at: observedAt, content: { text: 'We open at nine.', status: 'draft' }, completeness: 'complete', redactions: [] },
    ],
    occurrences: [
      { id: 'start-1', kind: 'session_started', actor_id: 'agent-1', session_id: 'session-1', description: 'Reply assistant started a top-level Guild session.', outcome: 'confirmed', evidence_refs: ['e-session'], artifact_refs: [], relationships: [] },
      { id: 'draft-1', kind: 'agent_world_action', actor_id: 'agent-1', session_id: 'session-1', description: 'Reply assistant saved a reply draft in Sandbox Mail; it did not send a message.', outcome: 'confirmed', evidence_refs: ['e-draft'], artifact_refs: ['a-draft'], world_effect: { system: 'Sandbox Mail', target: 'draft-1', change: 'Saved a draft.' }, relationships: [] },
      { id: 'end-1', kind: 'session_terminated', actor_id: 'agent-1', session_id: 'session-1', description: 'Reply assistant’s top-level Guild session ended.', outcome: 'confirmed', evidence_refs: ['e-session'], artifact_refs: [], relationships: [] },
    ],
    artifacts: [{ id: 'a-draft', kind: 'message', title: 'Reply draft', media_type: 'text/plain', content: 'We open at nine.', source_url: 'https://example.test/drafts/1', evidence_refs: ['e-draft'], completeness: 'complete', redactions: [], change: 'created', after: 'We open at nine.' }],
    coverage: { gaps: [], data_origin: 'synthetic' },
    presentation: { parent_conversation_ref: 'parent-conversation-1', interaction_target: 'Paste into the original parent conversation.', allowed_actions: [
      { id: 'correct', kind: 'mark_run_correct', label: 'Mark this run correct' },
      { id: 'issue', kind: 'flag_issue', label: 'Flag an issue' },
      { id: 'rerun', kind: 'request_rerun', label: 'Request another run' },
    ] },
  };
}

export function candidate(input = bundle()) {
  const { occurrences, ...context } = structuredClone(input);
  context.schema_version = '1.7';
  delete context.coverage.data_origin;
  context.coverage.gaps.forEach(gap => { delete gap.impact; });
  const timeline = occurrences.filter(e => e.kind !== 'supporting_activity' &&
    (e.kind !== 'external_world_action' || e.workflow_relevance) &&
    (!e.kind.startsWith('session_') || context.sessions.find(s => s.id === e.session_id)?.level === 'top_level'));
  const attached = new Set(timeline.flatMap(event => event.artifact_refs));
  context.artifacts = context.artifacts.filter(artifact => attached.has(artifact.id));
  const result = {
    ...context, snapshot_id: 'snapshot-1', editor_id: 'editor-1', parent_agent_id: 'parent-1',
    header_copy: { application_name: 'Reply Desk', workflow_purpose: 'Prepare customer replies for review.', scenario_name: 'Draft saved for review',
      starting_context: 'A customer asks about opening hours.', observed_result: 'The agent saved a reply draft. Sending was not observed.', claim_refs: ['context', 'claim-draft-1'] },
    summary: 'Reply assistant saved a draft for review. Sending was not requested or observed.',
    claims: [{ id: 'context', text: 'The scenario context and resulting state are as described.', evidence_refs: context.run.source_refs }],
    timeline: timeline.map(e => ({ ...e, claim_refs: [`claim-${e.id}`], supporting_detail: 'Synthetic source detail, not live verification.' })),
    artifact_claims: context.artifacts.map(a => ({ artifact_id: a.id, claim_refs: [`claim-artifact-${a.id}`] })),
    omitted_occurrences: occurrences.filter(e => !timeline.includes(e)).map(e => ({ id: e.id, reason: 'Supporting activity or unknown/child lifecycle; not a top-level story event.' })),
    display: { compact: false },
  };
  for (const event of result.timeline) result.claims.push({ id: event.claim_refs[0], text: event.description, evidence_refs: event.evidence_refs });
  for (const a of result.artifacts) result.claims.push({ id: `claim-artifact-${a.id}`, text: `${a.title}: ${a.change}.`, evidence_refs: a.evidence_refs });
  return result;
}

// Independent fake source state, deliberately not copied from candidate/bundle
// assertions. These deterministic stand-ins are not LLM fact-check evaluations.
export function fakeSource({ finding = 'confirmed', gap = '', readResult = 'read' } = {}) {
  const calls = [];
  const state = Object.freeze({ finding, gap, readResult, draft: 'We open at nine.', delivery: false });
  return {
    calls,
    async read(sourceId) {
      calls.push({ operation: 'read', source_id: sourceId, observed_at: observedAt });
      return structuredClone(state);
    },
  };
}
export function fakeChecker(options = {}) {
  const source = fakeSource(options);
  return {
    calls: source.calls,
    async check(doc) {
      const checks = [];
      const findings = [];
      for (const claim of doc.claims) {
        const sourceId = `independent-fixture/${claim.id}`;
        const reading = await source.read(sourceId);
        const call = { id: `check-${claim.id}`, checker_id: 'checker-1', operation: 'read', source_id: sourceId, observed_at: observedAt, result: reading.readResult };
        checks.push(call);
        findings.push({ claim_id: claim.id, check_refs: [call.id], finding: reading.finding,
          explanation: reading.finding === 'confirmed' ? 'Separate synthetic source read agrees.' : 'Separate synthetic source read does not establish the stronger assertion.', gaps: reading.gap ? [reading.gap] : [] });
      }
      return { checker_id: 'checker-1', factual_digest: factualDigest(doc), checks,
        findings };
    },
  };
}

export async function snapshot() {
  const doc = candidate();
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  doc.copy_review_iterations = 1;
  return doc;
}

// Scripted contract fixture ONLY. This does not assess language or model behavior.
export function fakeCopyReview(doc) {
  const fields = copyFields(doc);
  return { reviewer_id: 'copy-editor-1', candidate_digest: factualDigest(doc),
    rule_versions: { ...(doc.schema_version === '1.8' ? SUMMARY_HEADER_COPY_RULE_VERSIONS : doc.schema_version === '1.7' ? HEADER_COPY_RULE_VERSIONS : COPY_RULE_VERSIONS) }, verdict: 'pass',
    passages: fields.filter(f => !f.protected_source).map(f => ({ field_path: f.field_path,
      field_digest: f.field_digest, guide: 'economist', routing_reason: 'Scripted world-facing prose fixture, not an actual editorial decision.',
      sdlc_review: 'pass', exceptions: [] })),
    exemptions: fields.filter(f => f.protected_source).map(f => ({ field_path: f.field_path, reason: 'Preserve supplied source name or verbatim artifact text.' })), findings: [] };
}
