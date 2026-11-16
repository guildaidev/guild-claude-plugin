// SCRIPTED cross-domain evidence, not an application run or reviewer approval.
import { postrunFixture, postrunDraft } from './postrun-package-fixtures.test.mjs';
import { packagePostrun } from '../scripts/postrun-package.mjs';
import { encodeSessionEvidence } from '../scripts/session-evidence.mjs';

export function operationTimelineFixture() {
  const input = postrunFixture();
  input.schema_version = '1.1';
  input.context.workflow.intended_world_effect = 'Select a record, normalize its text, and prepare a reply.';
  for (const operation of input.operations) operation.timeline_role = operation.operation_id === 'initial-read' ? 'supporting' : 'goal_action';
  const source = { system: 'Text Normalizer', record_id: 'normalization-1' };
  input.targets.push({ id: 'normalized-text', source, kind: 'other', title: 'Normalized text', media_type: 'text/plain', evidence_refs: ['e-session'] });
  input.operations.push({ stream_id: 'main', operation_id: 'normalize-text', target_id: 'normalized-text', timeline_role: 'specified_process',
    specification_refs: ['/workflow/intended_world_effect'], workflow_relevance: { explanation: 'Text normalization is an explicit workflow step.', basis: 'user_supplied', evidence_refs: ['e-session'] },
    requirements: [{ stage: 'process_result', min_records: 1, material_required: true }] });
  for (const event of input.session.items) {
    const record = JSON.parse(event.content.message);
    if (record.stream_id === 'main' && record.sequence >= 3) { record.sequence++; event.content.message = encodeSessionEvidence(record); }
  }
  const record = { schema_version: '1.1', type: 'scenario_evidence', session_id: 'session-1', stream_id: 'main', sequence: 3,
    operation_id: 'normalize-text', stage: 'process_result', at: '2026-01-01T12:00:02.500Z', source,
    material: { content: 'Normalized source text.', completeness: 'complete', redactions: [], gaps: [] } };
  input.session.items.push({ id: 'normalized-event', type: 'runtime_start', created_at: '2026-01-01T12:00:02.600123Z',
    task: { id: 'normalized-task', tool_name: 'console_log', tool_call_id: 'console_log-normalized',
      parent_task: { id: 'parent-main', agent: { id: 'agent-1' }, version: { id: 'version-7' } } }, content: { level: 'info', message: encodeSessionEvidence(record) } });
  return input;
}

export function operationTimelineDraft(result) {
  const draft = postrunDraft(result);
  const roles = new Map(result.artifactVersionSource.operations.map(item => [item.occurrence_id, item]));
  const visible = result.bundle.occurrences.filter(item => roles.get(item.id).timeline_role !== 'supporting');
  const descriptions = { 'choose-row': 'The application selected the record.', 'normalize-text': 'The application normalized the selected text.',
    'write-reply': 'The application saved the reply draft.', 'conditional-write': 'The application updated the selected record.' };
  draft.claims = [draft.claims[0], ...visible.map((item, i) => ({ id: `operation-claim-${i}`, text: descriptions[roles.get(item.id).operation_id], evidence_refs: item.evidence_refs }))];
  draft.events = visible.map((item, i) => ({ occurrence_id: item.id, description: descriptions[roles.get(item.id).operation_id], claim_refs: [`operation-claim-${i}`], supporting_detail: 'The application reports this workflow result.' }));
  draft.omitted_occurrences = result.bundle.occurrences.filter(item => !visible.includes(item)).map(item => ({ id: item.id, reason: 'Private implementation evidence, not a business step.' }));
  return draft;
}

export function packagedOperationTimeline() { return packagePostrun(operationTimelineFixture()); }

export function serialOperationTimelineFixture() {
  const input = operationTimelineFixture(), operation = input.operations.find(item => item.operation_id === 'conditional-write');
  operation.target_id = 'mail-artifact'; operation.stream_id = 'main';
  for (const event of input.session.items) {
    const record = JSON.parse(event.content.message);
    if (record.operation_id !== operation.operation_id) continue;
    record.source = structuredClone(input.targets[0].source); record.stream_id = 'main'; record.sequence += 6;
    const second = record.stage === 'mutation_requested' ? 9 : record.stage === 'mutation_acknowledged' ? 10 : 11;
    record.at = `2026-01-01T12:00:${String(second).padStart(2, '0')}Z`;
    event.created_at = record.at.replace('Z', '.123456+00:00');
    event.task.parent_task.id = 'parent-main';
    if (record.stage === 'mutation_requested') record.material.content = 'Added section.';
    if (record.stage === 'artifact_observed') record.material.content = 'Actual saved body\r\n\nAdded section.';
    event.content.message = encodeSessionEvidence(record);
  }
  return input;
}
