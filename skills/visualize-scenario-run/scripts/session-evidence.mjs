// Structured application reports, not instructions, source authentication or a transport.
// encodeSessionEvidence is pure and dependency-free; copy/adapt it into application
// source if useful. The actual emission remains an awaited supported Guild tool.
export const SESSION_EVIDENCE_TYPE = 'scenario_evidence';
export const MAX_EVIDENCE_BYTES = 48 * 1024;
export const MAX_SESSION_EVIDENCE_BYTES = 2 * 1024 * 1024;
export const MAX_SESSION_EVIDENCE_RECORDS = 256;
const object = value => value && Object.getPrototypeOf(value) === Object.prototype;
const closed = (value, required, optional = []) => object(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => [...required, ...optional].includes(key));
const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);
const utc = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
// Date.parse truncates the supported 1–9 fractional digits to milliseconds.
// Keep exact source instants internally. Never replace the captured strings.
function sourceNanoseconds(value) {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?(Z|[+-]\d\d:\d\d)$/.exec(value);
  if (!match) return undefined;
  const second = Date.parse(`${match[1]}${match[3]}`);
  return Number.isFinite(second) ? BigInt(second) * 1_000_000n + BigInt((match[2] ?? '').padEnd(9, '0')) : undefined;
}
const sourceTime = value => sourceNanoseconds(value) !== undefined;

// These helpers let metadata producers compare exact source instants and derive
// honest millisecond windows. The lower bound is not an exact observation time;
// the upper bound must round OUTWARD, not backdate a submillisecond event.
export function compareSourceTimes(left, right) {
  const a = sourceNanoseconds(left), b = sourceNanoseconds(right);
  return a === undefined || b === undefined ? undefined : a < b ? -1 : a > b ? 1 : 0;
}
export function sourceTimeBounds(value) {
  const at = sourceNanoseconds(value);
  if (at === undefined) return undefined;
  const remainder = at % 1_000_000n;
  const floor = at / 1_000_000n - (remainder < 0n ? 1n : 0n);
  return { earliest: new Date(Number(floor)).toISOString(),
    latest: new Date(Number(floor + (remainder === 0n ? 0n : 1n))).toISOString() };
}
const bytes = value => new TextEncoder().encode(value).length;
const jsonValue = value => value === null || typeof value === 'string' || typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value)) || (Array.isArray(value) && value.every(jsonValue)) ||
  (object(value) && Object.values(value).every(jsonValue));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : object(value) ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const safeURL = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash; } catch { return false; } };
const stages = ['source_selected', 'mutation_requested', 'mutation_acknowledged', 'artifact_observed', 'gap', 'process_result'];
// A receipt does not promise material content. Requiring an invented gap here
// discards real acknowledgments and falsely breaks the stream's sequence.
const metadataReceipt = record => record.stage === 'mutation_acknowledged' && record.material.completeness === 'metadata_only';
const fail = code => ({ ok: false, errors: [{ path: '$.session_evidence', code,
  message: 'Session evidence does not satisfy its source and coverage contract.',
  repair: 'Use exact sanitized console source records; retain missing evidence as a gap, never invent content or identifiers.' }] });

export function validateSessionEvidence(record) {
  try {
    if (!closed(record, ['schema_version', 'type', 'session_id', 'stream_id', 'sequence', 'operation_id', 'stage', 'at', 'source', 'material'], ['acknowledgment']) || !['1.0', '1.1'].includes(record.schema_version) || (record.stage === 'process_result' && record.schema_version !== '1.1') || record.type !== SESSION_EVIDENCE_TYPE ||
      !['session_id', 'stream_id', 'operation_id'].every(key => id(record[key])) || !Number.isSafeInteger(record.sequence) || record.sequence < 1 || !stages.includes(record.stage) || !utc(record.at)) return fail('record_shape');
    if (!closed(record.source, ['system', 'record_id'], ['url']) || !text(record.source.system) || !text(record.source.record_id) || (record.source.url !== undefined && !safeURL(record.source.url))) return fail('source_shape');
    const material = record.material;
    if (Object.hasOwn(material ?? {}, 'content') && !jsonValue(material.content)) return fail('record_shape');
    if (!closed(material, ['completeness', 'redactions', 'gaps'], ['content', 'revision', 'immutable_url']) || !['complete', 'excerpt', 'metadata_only'].includes(material.completeness) || !strings(material.redactions) || !strings(material.gaps) ||
      (material.revision !== undefined && !text(material.revision)) || (material.immutable_url !== undefined && (!safeURL(material.immutable_url) || !text(material.revision)))) return fail('material_shape');
    if (material.completeness === 'complete' && (!Object.hasOwn(material, 'content') || material.redactions.length || material.gaps.length)) return fail('false_completeness');
    if (material.completeness === 'metadata_only' && Object.hasOwn(material, 'content')) return fail('false_completeness');
    if (material.completeness !== 'complete' && !metadataReceipt(record) && !material.redactions.length && !material.gaps.length) return fail('missing_gap');
    if (record.stage === 'gap' && !material.gaps.length) return fail('missing_gap');
    if (record.stage === 'mutation_acknowledged' ? !['accepted', 'completed', 'failed', 'unknown'].includes(record.acknowledgment) : record.acknowledgment !== undefined) return fail('acknowledgment_shape');
    const serialized = JSON.stringify(record);
    if (canonical(record) !== canonical(JSON.parse(serialized))) return fail('record_shape');
    // Defense in depth only. Builders must minimize/redact using service schemas
    // BEFORE emission. Do not echo rejected values in diagnostics.
    if (/"(?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|password|private[_-]?key)"\s*:|Bearer\s+\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(serialized)) return fail('sensitive_evidence');
    if (bytes(serialized) > MAX_EVIDENCE_BYTES) return fail('record_size');
    return { ok: true };
  } catch { return fail('record_shape'); }
}

export function encodeSessionEvidence(record) {
  const result = validateSessionEvidence(record);
  if (!result.ok) throw new Error(result.errors[0].code);
  return JSON.stringify(record);
}

// Match the retained Guild console TOOL envelope, not JS stdout, arbitrary
// agent_console/container logs, nested JSON strings, prose, or the done receipt.
export function consoleEvidenceEnvelope(event) {
  if (event?.type !== 'runtime_start' || event?.task?.tool_name !== 'console_log' || typeof event.content?.message !== 'string') return undefined;
  let record;
  try { record = JSON.parse(event.content.message); } catch { return undefined; }
  if (record?.type !== SESSION_EVIDENCE_TYPE) return undefined;
  return { id: event.id, type: event.type, created_at: event.created_at,
    task: { id: event.task.id, tool_name: event.task.tool_name, tool_call_id: event.task.tool_call_id,
      parent_task: { id: event.task.parent_task?.id, agent: { id: event.task.parent_task?.agent?.id }, version: { id: event.task.parent_task?.version?.id } } },
    content: { level: event.content.level, message: event.content.message } };
}

/** Postrun collection only. Supply the actual session ID and collection time;
 * responses may be newest-first. Diagnostics are private, not evidence content. */
export function collectSessionEvidence(session, { captured_at } = {}) {
  if (!id(session?.session_id) || !Array.isArray(session.items) || !utc(captured_at)) return fail('session_shape');
  const evidence = [], gaps = [], seen = new Set();
  let total = 0;
  for (const event of session.items) {
    const envelope = consoleEvidenceEnvelope(event);
    if (!envelope) {
      if (event?.task?.tool_name === 'console_log' && event.type === 'runtime_start' && event.content?.message?.includes?.(SESSION_EVIDENCE_TYPE)) gaps.push({ code: 'unparseable_marked_log', event_id: id(event.id) ? event.id : undefined });
      continue;
    }
    const record = JSON.parse(envelope.content.message), checked = validateSessionEvidence(record);
    const parent = envelope.task.parent_task;
    if (!checked.ok || record.session_id !== session.session_id || !id(envelope.id) || !id(envelope.task.id) || !id(parent.id) || !id(parent.agent.id) || !id(parent.version.id) || !/^console_log-\S+$/.test(envelope.task.tool_call_id ?? '') || !['info', 'warn', 'error', 'debug'].includes(envelope.content.level) || !sourceTime(envelope.created_at)) {
      gaps.push({ code: 'invalid_marked_log', event_id: id(event.id) ? event.id : undefined }); continue;
    }
    if (seen.has(envelope.id)) return fail('duplicate_event');
    seen.add(envelope.id);
    total += bytes(envelope.content.message);
    if (evidence.length >= MAX_SESSION_EVIDENCE_RECORDS || total > MAX_SESSION_EVIDENCE_BYTES) { gaps.push({ code: 'session_evidence_limit' }); break; }
    evidence.push({ id: `log:${envelope.id}`, kind: 'session_event', source: { system: 'Guild session events', record_id: envelope.id },
      captured_at, occurred_at: new Date(envelope.created_at).toISOString(), content: { event: envelope },
      completeness: record.material.completeness === 'complete' ? 'complete' : 'excerpt',
      redactions: [...record.material.redactions, ...record.material.gaps] });
  }
  return { ok: true, evidence, gaps };
}

// The collector supplies the build-time checklist. Sequence alone cannot detect
// a missing final log, an entirely absent stream or an omitted expected action.
export function assessSessionEvidenceCoverage(records, requirements) {
  if (!Array.isArray(records) || records.length > MAX_SESSION_EVIDENCE_RECORDS || !records.every(record => validateSessionEvidence(record).ok) || !Array.isArray(requirements) || !requirements.length || requirements.length > MAX_SESSION_EVIDENCE_RECORDS) return fail('coverage_shape');
  const gaps = [];
  for (const [index, requirement] of requirements.entries()) {
    if (!closed(requirement, ['source', 'stage', 'min_records', 'material_required'], ['operation_id']) || !closed(requirement.source, ['system', 'record_id']) || !Object.values(requirement.source).every(text) || !stages.includes(requirement.stage) || !Number.isSafeInteger(requirement.min_records) || requirement.min_records < 1 || requirement.min_records > MAX_SESSION_EVIDENCE_RECORDS || typeof requirement.material_required !== 'boolean' || (requirement.operation_id !== undefined && !id(requirement.operation_id))) return fail('coverage_shape');
    const matches = records.filter(record => record.stage === requirement.stage && record.source.system === requirement.source.system && record.source.record_id === requirement.source.record_id && (!requirement.operation_id || record.operation_id === requirement.operation_id));
    if (matches.length < requirement.min_records || (requirement.material_required && matches.filter(record => record.material.completeness === 'complete').length < requirement.min_records)) gaps.push({ code: 'required_evidence_missing', requirement_index: index });
  }
  return { ok: true, gaps };
}

/** Closed source projections 2.0/2.1 select existing evidence, never replacement
 * content. Version 2.1 groups business operations and keeps validation private.
 * Source evidence lives in the immutable original bundle. */
export function projectSessionEvidence(bundle, sidecar) {
  try {
    const grouped = sidecar?.schema_version === '2.1';
    if (!closed(sidecar, ['schema_version', 'bundle_digest', 'records', 'session_id', 'streams', 'bindings', 'requirements', ...(grouped ? ['operations'] : [])]) || !['2.0', '2.1'].includes(sidecar.schema_version) || !Array.isArray(sidecar.records) || sidecar.records.length || !Array.isArray(sidecar.streams) || sidecar.streams.length > MAX_SESSION_EVIDENCE_RECORDS || !Array.isArray(sidecar.bindings) || sidecar.bindings.length > MAX_SESSION_EVIDENCE_RECORDS) return fail('projection_shape');
    const session = bundle.sessions.find(item => item.id === sidecar.session_id);
    if (!session || session.workspace_id !== bundle.run.workspace_id) return fail('session_binding');
    const streams = new Map();
    for (const stream of sidecar.streams) {
      if (!closed(stream, ['stream_id', 'parent_task_id', 'agent_id', 'agent_version_id']) || !Object.values(stream).every(id) || streams.has(stream.stream_id) || !bundle.run.agent_version_ids.includes(stream.agent_version_id) || !bundle.actors.some(actor => actor.id === stream.agent_id && actor.agent_version_id === stream.agent_version_id)) return fail('emitter_binding');
      streams.set(stream.stream_id, stream);
    }
    const operationPlan = new Map();
    if (grouped) {
      if (!Array.isArray(sidecar.operations) || sidecar.operations.length > MAX_SESSION_EVIDENCE_RECORDS) return fail('operation_shape');
      const keys = new Set();
      for (const plan of sidecar.operations) {
        if (!closed(plan, ['occurrence_id', 'stream_id', 'operation_id', 'timeline_role'], ['specification_refs']) ||
          ![plan.occurrence_id, plan.stream_id, plan.operation_id].every(id) || !streams.has(plan.stream_id) ||
          !['goal_action', 'specified_process', 'supporting'].includes(plan.timeline_role) || operationPlan.has(plan.occurrence_id) ||
          keys.has(`${plan.stream_id}\0${plan.operation_id}`)) return fail('operation_shape');
        const occurrence = bundle.occurrences.find(item => item.id === plan.occurrence_id);
        if (!occurrence || (plan.timeline_role === 'supporting' ? occurrence.kind !== 'supporting_activity' : occurrence.kind !== 'agent_world_action')) return fail('operation_binding');
        const refs = plan.specification_refs;
        if ((plan.timeline_role === 'specified_process' && (occurrence.workflow_relevance?.basis !== 'user_supplied' || !Array.isArray(refs) || !refs.length)) ||
          (refs !== undefined && (!Array.isArray(refs) || new Set(refs).size !== refs.length || refs.some(ref =>
            !['/workflow/intended_world_effect', '/scenario/trigger', '/scenario/initial_conditions', '/scenario/expected_outcome'].includes(ref) ||
            !text(ref.split('/').slice(1).reduce((value, key) => value?.[key], bundle)))))) return fail('specification_binding');
        keys.add(`${plan.stream_id}\0${plan.operation_id}`); operationPlan.set(plan.occurrence_id, plan);
      }
    }
    const entries = [], seen = new Set();
    let total = 0;
    for (const binding of sidecar.bindings) {
      if (!closed(binding, ['evidence_id', 'occurrence_id'], ['artifact_id', 'unresolved_target']) || !id(binding.evidence_id) || !id(binding.occurrence_id) || (binding.artifact_id !== undefined && !id(binding.artifact_id)) ||
        (binding.unresolved_target !== undefined && (binding.unresolved_target !== true || binding.artifact_id !== undefined)) || seen.has(binding.evidence_id)) return fail('duplicate_binding');
      seen.add(binding.evidence_id);
      const evidence = bundle.evidence.find(item => item.id === binding.evidence_id), event = evidence?.content?.event;
      const envelope = consoleEvidenceEnvelope(event);
      if (!envelope || canonical(envelope) !== canonical(event) || evidence.kind !== 'session_event' || evidence.source.system !== 'Guild session events' || evidence.source.record_id !== event.id || !['info', 'warn', 'error', 'debug'].includes(event.content.level)) return fail('event_binding');
      const record = JSON.parse(event.content.message), stream = streams.get(record.stream_id), occurrence = bundle.occurrences.find(item => item.id === binding.occurrence_id);
      if (!validateSessionEvidence(record).ok || record.session_id !== session.id || !stream || !occurrence || occurrence.session_id !== session.id || occurrence.actor_id !== stream.agent_id || !occurrence.evidence_refs.includes(evidence.id) || stream.parent_task_id !== event.task.parent_task.id || stream.agent_id !== event.task.parent_task.agent.id || stream.agent_version_id !== event.task.parent_task.version.id || !id(event.id) || !id(event.task.id) || !/^console_log-\S+$/.test(event.task.tool_call_id ?? '')) return fail('event_binding');
      if (grouped) {
        const plan = operationPlan.get(occurrence.id);
        if (!plan || plan.stream_id !== record.stream_id || plan.operation_id !== record.operation_id ||
          (record.stage === 'process_result' && plan.timeline_role !== 'specified_process') ||
          (binding.artifact_id && !['source_selected', 'artifact_observed', 'gap'].includes(record.stage))) return fail('operation_binding');
      } else if (record.stage === 'process_result') return fail('operation_binding');
      const at = sourceNanoseconds(record.at), logged = sourceNanoseconds(event.created_at),
        from = sourceNanoseconds(occurrence.time?.at ?? occurrence.time?.earliest), through = sourceNanoseconds(occurrence.time?.at ?? occurrence.time?.latest);
      if ([at, logged, from, through].some(value => value === undefined) || at > logged || at < from || logged > through || evidence.occurred_at !== new Date(event.created_at).toISOString()) return fail('time_binding');
      if (!occurrence.world_effect || occurrence.world_effect.system !== record.source.system) return fail('target_binding');
      if (binding.unresolved_target ? record.stage !== 'mutation_requested' || occurrence.world_effect.target === record.source.record_id
        : occurrence.world_effect.target !== record.source.record_id) return fail('target_binding');
      total += bytes(event.content.message);
      if (total > MAX_SESSION_EVIDENCE_BYTES) return fail('session_evidence_limit');
      entries.push({ binding, evidence, event, record, occurrence, at, logged });
    }
    for (const evidence of bundle.evidence) {
      const event = consoleEvidenceEnvelope(evidence.content?.event);
      if (!event) continue;
      const record = JSON.parse(event.content.message);
      if (record.session_id === session.id && streams.has(record.stream_id) && !seen.has(evidence.id)) return fail('unaccounted_log');
    }
    const overlapping = new Set(), incompleteOperations = new Set();
    const materialWindows = [];
    if (grouped) for (const plan of operationPlan.values()) {
      const rows = entries.filter(entry => entry.occurrence.id === plan.occurrence_id);
      const mutation = rows.some(entry => entry.record.stage === 'mutation_requested');
      if (!rows.length || (plan.timeline_role === 'specified_process' && (mutation || !rows.some(entry => entry.record.stage === 'process_result'))) ||
        (mutation && rows.some(entry => entry.binding.artifact_id && entry.record.stage === 'source_selected'))) return fail('operation_binding');
      if (mutation) {
        const observed = rows.find(entry => entry.binding.artifact_id && entry.record.stage === 'artifact_observed');
        if (!observed || observed.record.material.completeness !== 'complete') incompleteOperations.add(plan.occurrence_id);
        const resolved = rows.find(entry => !entry.binding.unresolved_target);
        if (resolved) materialWindows.push({ id: plan.occurrence_id, source: resolved.record.source,
          from: rows[0].at, through: rows.at(-1).logged });
      }
    }
    for (const left of materialWindows) for (const right of materialWindows) if (left.id !== right.id &&
      left.source.system === right.source.system && left.source.record_id === right.source.record_id &&
      left.from <= right.through && right.from <= left.through) { overlapping.add(left.id); overlapping.add(right.id); }
    const previousSequence = new Map(), epochs = new Map(), operationSources = new Map(), gaps = [], artifacts = [], attachments = new Map(), latest = new Map(), eventIDs = new Set(), taskIDs = new Set();
    for (const entry of entries) {
      const { record, event, evidence, occurrence, binding, at, logged } = entry;
      if (eventIDs.has(event.id) || taskIDs.has(event.task.id)) return fail('duplicate_event');
      eventIDs.add(event.id); taskIDs.add(event.task.id);
      const prior = previousSequence.get(record.stream_id);
      if (prior && (record.sequence <= prior.record.sequence || at < prior.at || logged <= prior.logged)) return fail('sequence_order');
      const missing = record.sequence !== (prior?.record.sequence ?? 0) + 1;
      if (missing) gaps.push({ code: 'sequence_gap', evidence_id: evidence.id });
      if (missing) epochs.set(record.stream_id, (epochs.get(record.stream_id) ?? 0) + 1);
      const epoch = epochs.get(record.stream_id) ?? 0;
      previousSequence.set(record.stream_id, entry);
      // Creation can be requested before the service assigns an identity. Retain
      // that exact unresolved request, never alias its target to the later ID.
      // Unknown target means no material, operation-source binding or continuity
      // across this point, even when its submitted content was fully captured.
      if (binding.unresolved_target) {
        gaps.push({ code: 'unresolved_target', evidence_id: evidence.id });
        epochs.set(record.stream_id, epoch + 1);
        continue;
      }
      const operationKey = `${record.stream_id}\0${record.operation_id}`, sourceKey = canonical(record.source);
      if (operationSources.has(operationKey) && operationSources.get(operationKey) !== sourceKey) return fail('operation_binding');
      operationSources.set(operationKey, sourceKey);
      if (record.material.completeness !== 'complete' && (!metadataReceipt(record) || record.material.redactions.length || record.material.gaps.length)) gaps.push({ code: 'incomplete_material', evidence_id: evidence.id });
      if (grouped && record.stage === 'mutation_requested' && (incompleteOperations.has(occurrence.id) || overlapping.has(occurrence.id))) {
        for (const [priorKey, value] of latest) if (value.source.system === record.source.system && value.source.record_id === record.source.record_id) latest.delete(priorKey);
        gaps.push({ code: overlapping.has(occurrence.id) ? 'overlapping_operations' : 'operation_state_missing', evidence_id: evidence.id });
      }
      if (!binding.artifact_id) continue;
      const original = bundle.artifacts.find(item => item.id === binding.artifact_id);
      if (!original || !occurrence.artifact_refs.includes(original.id) || (original.source_url && original.source_url !== record.source.url) || !['source_selected', 'mutation_requested', 'artifact_observed', 'gap'].includes(record.stage)) return fail('artifact_binding');
      const originalSources = original.evidence_refs.map(id => bundle.evidence.find(item => item.id === id)).filter(item => item?.kind === 'external_record');
      if (originalSources.some(item => item.source.record_id && item.source.record_id !== record.source.record_id)) return fail('target_binding');
      const material = record.material;
      // An excerpt/metadata-only log is evidence, but never a complete material
      // state. Remove the old final attachment rather than show it at this step.
      if (!attachments.has(occurrence.id)) attachments.set(occurrence.id, new Map());
      const slots = attachments.get(occurrence.id);
      if (slots.has(original.id)) return fail('duplicate_artifact_slot');
      slots.set(original.id, undefined);
      if (grouped && overlapping.has(occurrence.id)) continue;
      const key = `${original.id}\0${record.stream_id}\0${record.stage}\0${sourceKey}`;
      if (material.completeness !== 'complete') {
        // A known missing state breaks this source's material continuity across
        // ALL stages, not merely the gap/request stage that reported the loss.
        // Keep unrelated artifacts, streams and source identities independent.
        for (const [priorKey, priorVersion] of latest) {
          if (priorVersion.artifact_id === original.id && priorVersion.stream_id === record.stream_id &&
            priorVersion.source.system === record.source.system && priorVersion.source.record_id === record.source.record_id) latest.delete(priorKey);
        }
        continue;
      }
      const content = typeof material.content === 'string' ? material.content : JSON.stringify(material.content, null, 2);
      const predecessor = latest.get(key);
      const contiguous = predecessor && predecessor.epoch === epoch;
      const before = contiguous ? predecessor.content : undefined;
      const qualification = record.stage === 'artifact_observed' ? 'Application-reported observed source content; not independent verification or proof of causation.'
        : record.stage === 'mutation_requested' ? 'Requested content only; acknowledgment and observed stored content are separate evidence.' : 'Application-reported selected source content; not a mutation or independent verification.';
      const artifact = { id: `version:${event.id}`, kind: original.kind, title: original.title, media_type: original.media_type,
        ...(original.source_url ? { source_url: original.source_url } : {}), evidence_refs: [...new Set([...original.evidence_refs, evidence.id, ...(contiguous ? [predecessor.evidence_id] : [])])],
        completeness: 'excerpt', redactions: [...new Set([...original.redactions, ...evidence.redactions, ...(contiguous ? predecessor.redactions : []), qualification,
          ...(typeof material.content !== 'string' ? ['Structured source content is displayed using deterministic JSON serialization; original structure remains in source evidence.'] : []),
          ...(missing ? ['Evidence sequence is incomplete; no preceding version is inferred.'] : [])])],
        content, after: content, ...(before !== undefined ? { before } : {}), change: before === undefined ? 'unknown' : before === content ? 'unchanged' : 'modified' };
      if (artifacts.some(item => item.id === artifact.id)) return fail('duplicate_artifact_slot');
      artifacts.push(artifact); slots.set(original.id, artifact.id);
      latest.set(key, { content, epoch, evidence_id: evidence.id, redactions: [...evidence.redactions],
        artifact_id: original.id, stream_id: record.stream_id, source: record.source });
    }
    const coverage = assessSessionEvidenceCoverage(entries.map(entry => entry.record), sidecar.requirements);
    if (!coverage.ok) return coverage;
    gaps.push(...coverage.gaps);
    const hidden = grouped ? [...operationPlan.values()].filter(plan => plan.timeline_role === 'supporting').map(plan => plan.occurrence_id) : [];
    const privateEvidence = grouped ? entries.filter(entry => hidden.includes(entry.occurrence.id) ||
      entries.some(other => other.occurrence.id === entry.occurrence.id && other.record.stage === 'mutation_requested')).map(entry => entry.evidence.id) : [];
    return { ok: true, evidence: [], artifacts, gaps,
      ...(grouped ? { hidden_occurrence_ids: hidden, private_evidence_ids: privateEvidence } : {}),
      coverageGaps: gaps.map((gap, index) => ({ id: `session-evidence-gap-${index + 1}`,
        description: gap.code === 'sequence_gap' ? 'Application evidence sequence has missing records; intermediate actions and versions are not established.' : gap.code === 'required_evidence_missing' ? 'The build-time evidence checklist has missing actions or material versions; full coverage is not established.' : gap.code === 'unresolved_target' ? 'A request used a target not established as the later artifact. Its content is not a stored version or comparison baseline.' : 'Application evidence omits or redacts material content; a complete state is not established.',
        affected_refs: gap.evidence_id ? [gap.evidence_id, entries.find(entry => entry.evidence.id === gap.evidence_id).occurrence.id] : [] })),
      occurrences: bundle.occurrences.map(occurrence => ({ ...structuredClone(occurrence), artifact_refs: occurrence.artifact_refs.flatMap(id => {
        const slots = attachments.get(occurrence.id); return slots?.has(id) ? slots.get(id) ? [slots.get(id)] : [] : [id];
      }) })) };
  } catch { return fail('projection_shape'); }
}
