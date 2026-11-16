// SCRIPTED production-contract fixtures only. No native run, source read or model.
import { bundle } from './fixtures.mjs';
import { encodeSessionEvidence } from '../scripts/session-evidence.mjs';

export function postrunFixture() {
  const context = bundle();
  context.occurrences = []; context.artifacts = [];
  context.coverage.observation_window = { from: '2026-01-01T12:00:00Z', through: '2026-01-01T12:01:00Z' };
  context.workflow.relevant_systems = ['Sandbox Mail', 'Sandbox Ledger'];
  const mail = { system: 'Sandbox Mail', record_id: 'draft-1', url: 'https://example.test/drafts/1' };
  const ledger = { system: 'Sandbox Ledger', record_id: 'row-8', url: 'https://example.test/rows/8' };
  context.evidence.find(e => e.id === 'e-draft').source = mail;
  context.evidence.push({ id: 'e-ledger', kind: 'external_record', source: ledger, captured_at: '2026-01-01T12:00:00Z',
    content: { id: 'row-8' }, completeness: 'excerpt', redactions: ['Only target identity was retained.'] });
  const targets = [
    { id: 'mail-artifact', source: mail, kind: 'message', title: 'Reply draft', media_type: 'text/markdown', evidence_refs: ['e-draft'] },
    { id: 'ledger-artifact', source: ledger, kind: 'record', title: 'Selected ledger row', media_type: 'application/json', evidence_refs: ['e-ledger'] },
  ];
  const relevance = { explanation: 'SCRIPTED fixture: selected material is relevant to the supplied workflow.', basis: 'user_supplied', evidence_refs: ['e-session'] };
  const operation = (operation_id, target_id, expected, stream_id = 'main') => ({ stream_id, operation_id, target_id, workflow_relevance: structuredClone(relevance),
    requirements: expected.map(stage => ({ stage, min_records: 1, material_required: stage !== 'mutation_acknowledged' && stage !== 'gap' })) });
  const operations = [operation('initial-read', 'mail-artifact', ['artifact_observed']),
    operation('choose-row', 'ledger-artifact', ['source_selected']),
    operation('write-reply', 'mail-artifact', ['mutation_requested', 'mutation_acknowledged', 'artifact_observed']),
    operation('conditional-write', 'ledger-artifact', ['mutation_requested', 'mutation_acknowledged', 'artifact_observed'], 'branch')];
  const specs = [
    ['initial-read', 'artifact_observed', '', 'main', 1],
    ['choose-row', 'source_selected', { text: '<script>untrusted</script>', amount: 8 }, 'main', 2],
    ['write-reply', 'mutation_requested', 'Exact requested fragment\r\n', 'main', 3],
    ['conditional-write', 'mutation_requested', { status: 'pending' }, 'branch', 1],
    ['write-reply', 'mutation_acknowledged', undefined, 'main', 4],
    ['conditional-write', 'mutation_acknowledged', undefined, 'branch', 2],
    ['write-reply', 'artifact_observed', 'Actual saved body\r\n\n', 'main', 5],
    ['conditional-write', 'artifact_observed', { status: 'stored' }, 'branch', 3],
  ];
  const streams = ['main', 'branch'].map(stream_id => ({ stream_id, parent_task_id: `parent-${stream_id}`, agent_id: 'agent-1', agent_version_id: 'version-7' }));
  const items = specs.map(([operation_id, stage, content, stream_id, sequence], index) => {
    const target = targets.find(t => t.id === operations.find(op => op.operation_id === operation_id).target_id);
    const at = `2026-01-01T12:00:${String(index + 1).padStart(2, '0')}Z`;
    const record = { schema_version: '1.0', type: 'scenario_evidence', session_id: 'session-1', stream_id, sequence, operation_id, stage, at,
      source: structuredClone(target.source), material: { completeness: content === undefined ? 'metadata_only' : 'complete', redactions: [], gaps: [],
        ...(content === undefined ? {} : { content }), revision: `r-${index}` }, ...(stage === 'mutation_acknowledged' ? { acknowledgment: 'accepted' } : {}) };
    return { id: `evt-${index + 1}`, entity_type: 'EntEventRuntimeStart', type: 'runtime_start', created_at: at.replace('Z', '.123456+00:00'),
      task: { id: `task-${index + 1}`, tool_name: 'console_log', tool_call_id: `console_log-call-${index + 1}`,
        parent_task: { id: `parent-${stream_id}`, agent: { id: 'agent-1' }, version: { id: 'version-7' } } },
      content: { level: 'info', message: encodeSessionEvidence(record) } };
  });
  return { schema_version: '1.0', captured_at: '2026-01-01T12:02:00Z', context,
    session: { session_id: 'session-1', items: items.reverse() }, streams, targets, operations };
}

export function postrunDraft(result) {
  const b = result.bundle;
  const selected = b.occurrences.filter(e => e.kind !== 'supporting_activity');
  return { schema_version: '1.4', snapshot_id: 'scripted-snapshot', editor_id: 'scripted-editor', parent_agent_id: 'scripted-parent',
    summary: 'SCRIPTED author copy: application reports are retained with their limitations.',
    header_copy: { application_name: 'Scripted Desk', workflow_purpose: 'Prepare a reply for review.', scenario_name: 'A routine question',
      scenario_description: 'A customer asks a question, and the assistant prepares a reply for review.', claim_refs: ['context'], description_claim_refs: ['context'] },
    claims: [{ id: 'context', text: 'SCRIPTED context claim.', evidence_refs: ['e-session'] },
      ...selected.map((e, i) => ({ id: `claim-${i}`, text: `SCRIPTED record interpretation ${i}.`, evidence_refs: e.evidence_refs }))],
    events: selected.map((e, i) => ({ occurrence_id: e.id, description: `SCRIPTED authored event ${i}.`, claim_refs: [`claim-${i}`], supporting_detail: 'SCRIPTED interpretation only; not independent verification.' })),
    artifact_claims: [], omitted_occurrences: b.occurrences.filter(e => !selected.includes(e)).map(e => ({ id: e.id, reason: 'SCRIPTED author omitted supporting evidence.' })) };
}
