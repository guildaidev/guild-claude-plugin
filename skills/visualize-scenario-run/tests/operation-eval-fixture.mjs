// Local test authoring only. This is NOT shipped as an eval input, review or HTML.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { artifactVersionBundleDigest } from '../scripts/artifact-versions.mjs';

export const operationEvalCase = fileURLToPath(new URL('../../../evals/visualize-scenario-run/operation-timeline-replay/', import.meta.url));

export async function operationEvalFixture(changeDraft = () => {}, { omitInitialBaseline = false } = {}) {
  const source = JSON.parse(await readFile(join(operationEvalCase, 'mocks/guild/fixtures/events.json'), 'utf8'));
  const session = JSON.parse(await readFile(join(operationEvalCase, 'mocks/guild/fixtures/session.json'), 'utf8'));
  const byId = new Map(source.items.map(event => [event.id, event]));
  const spec = 'Select a Research Catalog abstract. Use the configured PlainText agent to simplify it. Create one note and save the first section. For the recorded second branch, select a Label Catalog entry, use PlainText to simplify it, and append a second section.';
  const evidence = [{ id: 'e-spec', kind: 'user_statement', source: { system: 'Synthetic user specification' }, captured_at: '2026-01-02T12:01:00.000Z', content: spec, completeness: 'complete', redactions: [] },
    { id: 'e-session', kind: 'session_record', source: { system: 'Guild', record_id: session.id }, captured_at: '2026-01-02T12:01:00.000Z', content: session, completeness: 'complete', redactions: [] }];
  const docId = 'fixture-timeline-document', url = `https://docs.google.com/document/d/${docId}/edit`;
  for (const event of source.items.filter(item => !item.id.startsWith('log-'))) {
    const document = ['event-doc-initial-done', 'event-doc-first-done', 'event-doc-final-done'].includes(event.id);
    evidence.push({ id: `e-${event.id}`, kind: document ? 'external_record' : 'session_event',
      source: document ? { system: 'Google Docs', record_id: docId, url } : { system: 'Guild session events', record_id: event.id },
      captured_at: '2026-01-02T12:01:00.000Z', occurred_at: event.created_at, content: { event }, completeness: 'complete', redactions: [] });
  }
  const defs = [
    ['first-source', 'Selected the vision abstract.', 1, 2, ['event-select-first-done'], 'Research Catalog', 'vision-42'],
    ['first-process', 'Simplified the vision abstract with PlainText.', 3, 4, ['event-process-first-done'], 'PlainText', 'task-process-first'],
    ['create-note', 'Created the note.', 5, 8, ['event-create-done', 'event-doc-initial-done'], 'Google Docs', docId],
    ['first-change', 'Added the simplified vision section to the note.', 9, 12, ['event-insert-first-done', 'event-doc-first-done'], 'Google Docs', docId],
    ['second-source', 'Selected the battery safety entry.', 13, 14, ['event-select-second-done'], 'Label Catalog', 'battery-7'],
    ['second-process', 'Simplified the battery safety text with PlainText.', 15, 16, ['event-process-second-done'], 'PlainText', 'task-process-second'],
    ['second-change', 'Added the simplified battery safety section to the note.', 17, 20, ['event-insert-second-done', 'event-doc-final-done'], 'Google Docs', docId],
  ];
  const clock = second => `2026-01-02T12:00:${String(second).padStart(2, '0')}.000Z`;
  const occurrences = defs.map(([id, description, from, through, eventIds, system, target]) => ({ id, kind: 'agent_world_action', actor_id: 'source-agent', session_id: session.id, description,
    time: { earliest: clock(from), latest: clock(through) }, outcome: 'confirmed', evidence_refs: eventIds.map(event => `e-${event}`),
    artifact_refs: system === 'Google Docs' ? ['the-note'] : [], world_effect: { system, target, change: description }, relationships: [],
    workflow_relevance: { explanation: 'This operation is an explicit part of the requested workflow.', basis: 'user_supplied', evidence_refs: ['e-spec', ...eventIds.map(event => `e-${event}`)] } }));
  const finalText = byId.get('event-doc-final-done').content.body.content[0].paragraph.elements[0].textRun.content;
  const bundle = { schema_version: '1.0', bundle_id: 'synthetic-operation-eval-local-test',
    workflow: { id: 'source-notes', title: 'Source Notes', intended_world_effect: spec, relevant_systems: ['Research Catalog', 'Label Catalog', 'PlainText', 'Google Docs'] },
    scenario: { id: 'two-source-note', title: 'Two simplified sections', trigger: 'The existing synthetic test input.', initial_conditions: 'The supplied synthetic source records and PlainText agent are available.', expected_outcome: 'One note contains two titled, simplified sections.' },
    run: { id: session.root_task.id, workspace_id: session.workspace.id, agent_version_ids: [session.agent_version_override.id], application_version: 'source-notes-1', sandbox_integrations: ['Research Catalog', 'Label Catalog', 'Google Docs'], status: 'completed', observed_resulting_state: 'The note contains the two sections.', source_refs: ['e-spec', 'e-session'] },
    actors: [{ id: 'source-agent', label: 'Source Notes', kind: 'agent', workspace_id: session.workspace.id, agent_version_id: session.agent_version_override.id }],
    sessions: [{ id: session.id, workspace_id: session.workspace.id, level: 'top_level', agent_actor_id: 'source-agent', source_refs: ['e-session'] }], evidence,
    artifacts: [{ id: 'the-note', kind: 'document', title: 'Source Notes', media_type: 'text/markdown', after: finalText, source_url: url,
      evidence_refs: ['e-event-doc-initial-done', 'e-event-doc-first-done', 'e-event-doc-final-done'], completeness: 'excerpt', redactions: ['Text representation only.'], change: 'modified' }],
    coverage: { data_origin: 'observed', observation_window: { from: clock(0), through: clock(21) }, gaps: [] },
    presentation: { parent_conversation_ref: 'synthetic-eval-parent', interaction_target: 'The same parent conversation.', allowed_actions: [{ id: 'correct', kind: 'mark_run_correct', label: 'Keep this behavior' }, { id: 'issue', kind: 'flag_issue', label: 'Add feedback' }] }, occurrences };
  const pointer = '/event/content/body/content/0/paragraph/elements/0/textRun/content';
  const artifactVersionSource = { schema_version: '1.0', bundle_digest: artifactVersionBundleDigest(bundle), records: [], versions: [
    { id: 'initial', artifact_id: 'the-note', occurrence_id: 'create-note', operation: 'capture', value_ref: { evidence_id: 'e-event-doc-initial-done', pointer } },
    { id: 'first', artifact_id: 'the-note', occurrence_id: 'first-change', operation: 'capture', value_ref: { evidence_id: 'e-event-doc-first-done', pointer }, previous_version_id: 'initial' },
    { id: 'second', artifact_id: 'the-note', occurrence_id: 'second-change', operation: 'capture', value_ref: { evidence_id: 'e-event-doc-final-done', pointer }, previous_version_id: 'first' },
  ] };
  if (omitInitialBaseline) {
    bundle.occurrences.find(event => event.id === 'create-note').artifact_refs = [];
    artifactVersionSource.versions.shift();
    delete artifactVersionSource.versions[0].previous_version_id;
    artifactVersionSource.bundle_digest = artifactVersionBundleDigest(bundle);
  }
  const draft = { schema_version: '1.4', snapshot_id: 'synthetic-operation-eval-review', editor_id: 'synthetic-author', parent_agent_id: 'synthetic-parent', summary: 'Two selected sources became two simplified sections.',
    claims: [{ id: 'goal', text: spec, evidence_refs: ['e-spec'] }, ...occurrences.map(event => ({ id: `claim-${event.id}`, text: event.description, evidence_refs: event.evidence_refs }))],
    header_copy: { application_name: 'Source Notes', workflow_purpose: 'Save two simplified source sections in one note.', scenario_name: 'Two simplified sections saved', scenario_description: 'The application selects two sources, simplifies each text, and saves two titled sections in one note.', claim_refs: ['goal'], description_claim_refs: ['goal'] },
    events: occurrences.map(event => ({ occurrence_id: event.id, description: event.description, claim_refs: [`claim-${event.id}`], supporting_detail: 'The selected source content belongs to this part of the workflow.' })),
    artifact_claims: [{ artifact_id: 'the-note', claim_refs: ['claim-create-note', 'claim-first-change', 'claim-second-change'] }], omitted_occurrences: [] };
  changeDraft(draft);
  const assembled = assembleCandidate(bundle, draft, { artifactVersionSource });
  if (!assembled.ok) throw new Error(JSON.stringify(assembled.errors));
  return { snapshot: assembled.snapshot, source, session, bundle, draft };
}
