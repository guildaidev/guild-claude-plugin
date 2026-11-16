// Postrun local data packaging only. Logs are data, never commands or authority.
import { constants } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validate } from './contracts.mjs';
import { collectSessionEvidence, compareSourceTimes, sourceTimeBounds, MAX_SESSION_EVIDENCE_RECORDS } from './session-evidence.mjs';
import { artifactVersionBundleDigest, projectArtifactVersions } from './artifact-versions.mjs';

export const MAX_POSTRUN_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_POSTRUN_EVENTS = 4096;
const object = value => value && Object.getPrototypeOf(value) === Object.prototype;
const closed = (value, keys, optional = []) => object(value) && keys.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => [...keys, ...optional].includes(key));
const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const validSource = source => {
  if (!closed(source, ['system', 'record_id'], ['url']) || !text(source.system) || !text(source.record_id)) return false;
  if (source.url === undefined) return true;
  try { const url = new URL(source.url); return typeof source.url === 'string' && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash; } catch { return false; }
};
const stages = ['source_selected', 'mutation_requested', 'mutation_acknowledged', 'artifact_observed', 'gap', 'process_result'];
const sameSource = (left, right) => left.system === right.system && left.record_id === right.record_id && left.url === right.url;
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const descriptions = Object.freeze({
  source_selected: 'Application reported selected source material.',
  mutation_requested: 'Application reported a mutation request; stored state is not established by this record.',
  mutation_acknowledged: 'Application reported a mutation acknowledgment; stored state is separate evidence.',
  artifact_observed: 'Application reported observed artifact material; independent verification is not established.',
  gap: 'Application reported a material-evidence gap.',
  process_result: 'Application reported the result of a specified workflow process.',
});
const failure = code => ({ ok: false, errors: [{ path: '$.postrun_package', code,
  message: 'Postrun inputs cannot be packaged under the explicit source contract.',
  repair: 'Supply private finite JSON, exact metadata, emitter pins, target identities and a complete executed-operation checklist. Do not invent missing evidence or overwrite files.' }] });

// Check before cloning/stringifying: getters, toJSON, prototypes, cycles, sparse
// arrays and nonfinite values must not execute or silently rewrite input data.
function cloneInput(input) {
  let nodes = 0, materialBytes = 0;
  const ancestors = new Set();
  function visit(value, depth = 0) {
    if (++nodes > 200000 || depth > 64) throw new Error();
    if (typeof value === 'string') {
      materialBytes += Buffer.byteLength(value);
      if (materialBytes > MAX_POSTRUN_INPUT_BYTES) throw new Error();
      return;
    }
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if ((!Array.isArray(value) && !object(value)) || ancestors.has(value) || Object.getOwnPropertySymbols(value).length) throw new Error();
    ancestors.add(value);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Array.isArray(value) && (Object.keys(value).length !== value.length || Object.keys(value).some((key, i) => key !== String(i)))) throw new Error();
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (Array.isArray(value) && key === 'length') continue;
      materialBytes += Buffer.byteLength(key);
      if (materialBytes > MAX_POSTRUN_INPUT_BYTES) throw new Error();
      if (['__proto__', 'constructor', 'prototype', 'toJSON'].includes(key) || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new Error();
      visit(descriptor.value, depth + 1);
    }
    ancestors.delete(value);
  }
  visit(input);
  const serialized = JSON.stringify(input);
  if (Buffer.byteLength(serialized) > MAX_POSTRUN_INPUT_BYTES) throw new Error();
  return JSON.parse(serialized);
}

/** Ordinary bundle 1.0 + projection 2.1 for grouped input 1.1 (legacy 1.0 -> 2.0).
 * No prose, source calls or clock
 * inference. Context is a valid metadata-only bundle seed with empty generated
 * collections. All actual identity/spec/context fields remain caller supplied. */
export function packagePostrun(input) {
  try {
    const request = cloneInput(input);
    if (!closed(request, ['schema_version', 'captured_at', 'session', 'context', 'streams', 'targets', 'operations']) || !['1.0', '1.1'].includes(request.schema_version) ||
      !closed(request.session, ['session_id', 'items']) || !Array.isArray(request.session.items) || request.session.items.length > MAX_POSTRUN_EVENTS ||
      !Array.isArray(request.streams) || !request.streams.length || request.streams.length > MAX_SESSION_EVIDENCE_RECORDS ||
      !Array.isArray(request.targets) || !request.targets.length || request.targets.length > MAX_SESSION_EVIDENCE_RECORDS ||
      !Array.isArray(request.operations) || !request.operations.length || request.operations.length > MAX_SESSION_EVIDENCE_RECORDS) return failure('input_shape');
    const bundle = request.context;
    const checked = validate(bundle, 'bundle');
    if (!checked.ok) return checked;
    if (bundle.occurrences.length || bundle.artifacts.length) return failure('nonempty_seed');
    const session = bundle.sessions.find(item => item.id === request.session.session_id);
    if (!session || session.workspace_id !== bundle.run.workspace_id) return failure('session_scope');
    const window = bundle.coverage.observation_window;
    if (!window) return failure('observation_window_required');
    const captureScope = compareSourceTimes(request.captured_at, window.through);
    if (captureScope === undefined || captureScope < 0) return failure('capture_scope');
    const streams = new Map();
    for (const stream of request.streams) {
      if (!closed(stream, ['stream_id', 'parent_task_id', 'agent_id', 'agent_version_id']) || !Object.values(stream).every(id) || streams.has(stream.stream_id)) return failure('stream_shape');
      const actor = bundle.actors.find(item => item.id === stream.agent_id);
      if (!actor || actor.kind !== 'agent' || actor.workspace_id !== bundle.run.workspace_id || actor.agent_version_id !== stream.agent_version_id || !bundle.run.agent_version_ids.includes(stream.agent_version_id)) return failure('emitter_scope');
      streams.set(stream.stream_id, stream);
    }
    const targets = new Map();
    for (const target of request.targets) {
      if (!closed(target, ['id', 'source', 'kind', 'title', 'media_type', 'evidence_refs']) || !id(target.id) || targets.has(target.id) ||
        !validSource(target.source) ||
        [...targets.values()].some(other => sameSource(other.source, target.source))) return failure('target_shape');
      targets.set(target.id, target);
      // No final content is copied into any occurrence. A target is an explicitly
      // identified metadata slot, not an assumed blank or a captured final state.
      bundle.artifacts.push({ id: target.id, kind: target.kind, title: target.title, media_type: target.media_type,
        ...(target.source.url === undefined ? {} : { source_url: target.source.url }), evidence_refs: target.evidence_refs,
        completeness: 'metadata_only', redactions: [], change: 'unknown' });
    }
    const operations = new Map(), requirements = [];
    for (const operation of request.operations) {
      if (!closed(operation, ['stream_id', 'operation_id', 'target_id', 'requirements', 'workflow_relevance', ...(request.schema_version === '1.1' ? ['timeline_role'] : [])], ['unresolved_request_source', ...(request.schema_version === '1.1' ? ['specification_refs'] : [])]) || !id(operation.operation_id) ||
        operations.has(operation.operation_id) || !streams.has(operation.stream_id) || !targets.has(operation.target_id) ||
        !Array.isArray(operation.requirements) || !operation.requirements.length || operation.requirements.length > stages.length ||
        !closed(operation.workflow_relevance, ['explanation', 'basis', 'evidence_refs']) || !text(operation.workflow_relevance.explanation) ||
        !['observed', 'inferred', 'user_supplied'].includes(operation.workflow_relevance.basis) || !Array.isArray(operation.workflow_relevance.evidence_refs) || !operation.workflow_relevance.evidence_refs.length) return failure('operation_shape');
      if (request.schema_version === '1.1' && (!['goal_action', 'specified_process', 'supporting'].includes(operation.timeline_role) ||
        (operation.timeline_role === 'specified_process' && (operation.workflow_relevance.basis !== 'user_supplied' || !Array.isArray(operation.specification_refs) || !operation.specification_refs.length)) ||
        (operation.specification_refs !== undefined && (!Array.isArray(operation.specification_refs) || new Set(operation.specification_refs).size !== operation.specification_refs.length || operation.specification_refs.some(ref =>
          !['/workflow/intended_world_effect', '/scenario/trigger', '/scenario/initial_conditions', '/scenario/expected_outcome'].includes(ref) || !text(ref.split('/').slice(1).reduce((value, key) => value?.[key], bundle))))))) return failure('timeline_role');
      if (operation.unresolved_request_source !== undefined && (!validSource(operation.unresolved_request_source) ||
        operation.unresolved_request_source.system !== targets.get(operation.target_id).source.system ||
        operation.unresolved_request_source.record_id === targets.get(operation.target_id).source.record_id ||
        !operation.requirements.some(requirement => requirement.stage === 'mutation_requested'))) return failure('unresolved_request_shape');
      const declared = new Set();
      for (const requirement of operation.requirements) {
        if (!closed(requirement, ['stage', 'min_records', 'material_required']) || !stages.includes(requirement.stage) || (requirement.stage === 'process_result' && request.schema_version !== '1.1') || declared.has(requirement.stage) ||
          !Number.isSafeInteger(requirement.min_records) || requirement.min_records < 1 || requirement.min_records > MAX_SESSION_EVIDENCE_RECORDS ||
          typeof requirement.material_required !== 'boolean' || (requirement.stage === 'mutation_acknowledged' && requirement.material_required)) return failure('checklist_shape');
        declared.add(requirement.stage);
        const { system, record_id } = requirement.stage === 'mutation_requested' && operation.unresolved_request_source
          ? operation.unresolved_request_source : targets.get(operation.target_id).source;
        requirements.push({ source: { system, record_id }, operation_id: operation.operation_id, ...requirement });
      }
      if (declared.has('mutation_requested') && (!declared.has('mutation_acknowledged') || (!declared.has('artifact_observed') && !declared.has('gap')))) return failure('mutation_checklist');
      if (request.schema_version === '1.1' && (operation.timeline_role === 'specified_process' ? !declared.has('process_result') : declared.has('process_result'))) return failure('process_checklist');
      operations.set(operation.operation_id, operation);
    }
    if (requirements.length > MAX_SESSION_EVIDENCE_RECORDS) return failure('checklist_limit');
    const collected = collectSessionEvidence(request.session, { captured_at: request.captured_at });
    if (!collected.ok) return collected;
    if (collected.gaps.some(gap => gap.code === 'session_evidence_limit')) return failure('session_evidence_limit');
    const entries = collected.evidence.map(evidence => ({ evidence, event: evidence.content.event, record: JSON.parse(evidence.content.event.content.message) }));
    // Guild may return newest-first. Normalize presentation order by source log
    // time at its full source precision, retaining exact original timestamps and
    // application sequence numbers. Date.parse would erase submillisecond order.
    entries.sort((a, b) => compareSourceTimes(a.event.created_at, b.event.created_at) || compare(a.record.stream_id, b.record.stream_id) || a.record.sequence - b.record.sequence || compare(a.event.id, b.event.id));
    const bindings = [], codes = [];
    for (const { evidence, event, record } of entries) {
      const stream = streams.get(record.stream_id), operation = operations.get(record.operation_id);
      if (!stream || !operation || operation.stream_id !== record.stream_id) return failure('operation_scope');
      const unresolved = record.stage === 'mutation_requested' && operation.unresolved_request_source !== undefined;
      if (!sameSource(unresolved ? operation.unresolved_request_source : targets.get(operation.target_id).source, record.source)) return failure('operation_scope');
      if (!operation.requirements.some(requirement => requirement.stage === record.stage)) return failure('undeclared_stage');
      if (stream.parent_task_id !== event.task.parent_task.id || stream.agent_id !== event.task.parent_task.agent.id || stream.agent_version_id !== event.task.parent_task.version.id) return failure('emitter_scope');
      const from = compareSourceTimes(record.at, window.from), through = compareSourceTimes(event.created_at, window.through);
      const collectedAfter = compareSourceTimes(event.created_at, request.captured_at), loggedBounds = sourceTimeBounds(event.created_at);
      if (from === undefined || through === undefined || collectedAfter === undefined || !loggedBounds || from < 0 || through > 0 || collectedAfter > 0) return failure('event_scope');
      const occurrence_id = `occ:${event.id}`;
      const existing = bundle.evidence.find(item => item.id === evidence.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(evidence)) return failure('evidence_id_collision');
      if (!existing) bundle.evidence.push(evidence);
      const attach = record.stage !== 'mutation_acknowledged' && !unresolved;
      bundle.occurrences.push({ id: occurrence_id, kind: record.stage === 'gap' ? 'supporting_activity' : 'agent_world_action',
        actor_id: stream.agent_id, session_id: session.id, description: descriptions[record.stage],
        // The occurrence contract has millisecond precision. Its upper bound
        // contains the actual log instant; occurred_at is only a truncated index.
        time: { earliest: record.at, latest: loggedBounds.latest }, outcome: 'unknown', evidence_refs: [evidence.id],
        artifact_refs: attach ? [operation.target_id] : [], world_effect: { system: record.source.system,
          ...(unresolved ? {} : { target: record.source.record_id }), change: descriptions[record.stage] },
        workflow_relevance: operation.workflow_relevance, relationships: [] });
      bindings.push({ evidence_id: evidence.id, occurrence_id, ...(attach ? { artifact_id: operation.target_id } : {}), ...(unresolved ? { unresolved_target: true } : {}) });
      codes.push({ occurrence_id, evidence_id: evidence.id, stream_id: record.stream_id, sequence: record.sequence,
        operation_id: record.operation_id, stage: record.stage });
    }
    const evidenceIDs = new Set(bundle.evidence.map(item => item.id));
    for (const operation of operations.values()) if (operation.workflow_relevance.evidence_refs.some(ref => !evidenceIDs.has(ref))) return failure('relevance_reference');
    for (const [index, gap] of collected.gaps.entries()) bundle.coverage.gaps.push({ id: `postrun-collection-gap-${index + 1}`,
      description: `Structured application evidence collection reported ${gap.code}.`, affected_refs: [],
      impact: 'Some application evidence was not retained as valid structured records; complete coverage is not established.' });
    const operationBindings = [];
    if (request.schema_version === '1.1') {
      const grouped = [];
      for (const operation of operations.values()) {
        const rows = codes.filter(code => code.stream_id === operation.stream_id && code.operation_id === operation.operation_id);
        if (!rows.length) continue; // Missing executed evidence remains a coverage gap, not an invented event.
        const originals = rows.map(row => bundle.occurrences.find(item => item.id === row.occurrence_id));
        const mutation = rows.some(row => row.stage === 'mutation_requested');
        if (operation.timeline_role === 'specified_process' && mutation) return failure('mixed_process_effect');
        const observations = rows.filter(row => row.stage === 'artifact_observed');
        if (observations.length > 1) return failure('ambiguous_operation_material');
        // Request fragments never stand in for the resulting artifact. A reported
        // gap conservatively suppresses the slot even if another log has content.
        const material = rows.find(row => row.stage === 'gap') ?? observations[0] ??
          (!mutation ? rows.find(row => row.stage === 'source_selected') : undefined);
        const target = targets.get(operation.target_id), first = originals[0];
        const occurrence = { ...first, kind: operation.timeline_role === 'supporting' ? 'supporting_activity' : 'agent_world_action',
          description: operation.timeline_role === 'supporting' ? 'Private implementation evidence.' : 'Application reported a workflow operation.',
          time: { earliest: originals.map(item => item.time.earliest).sort(compareSourceTimes)[0], latest: originals.map(item => item.time.latest).sort(compareSourceTimes).at(-1) },
          evidence_refs: originals.flatMap(item => item.evidence_refs), artifact_refs: material ? [operation.target_id] : [],
          world_effect: { system: target.source.system, target: target.source.record_id, change: 'Application reported a workflow operation.' } };
        grouped.push(occurrence);
        operationBindings.push({ occurrence_id: occurrence.id, stream_id: operation.stream_id, operation_id: operation.operation_id,
          timeline_role: operation.timeline_role, ...(operation.specification_refs ? { specification_refs: operation.specification_refs } : {}) });
        for (const row of rows) {
          const binding = bindings.find(item => item.evidence_id === row.evidence_id);
          binding.occurrence_id = occurrence.id;
          delete binding.artifact_id;
          if (row === material) binding.artifact_id = operation.target_id;
          row.occurrence_id = occurrence.id;
        }
      }
      bundle.occurrences = grouped.sort((a, b) => compareSourceTimes(a.time.earliest, b.time.earliest));
    }
    const result = validate(bundle, 'bundle');
    if (!result.ok) return result;
    const artifactVersionSource = { schema_version: request.schema_version === '1.1' ? '2.1' : '2.0', bundle_digest: artifactVersionBundleDigest(bundle), records: [],
      session_id: session.id, streams: request.streams, bindings, requirements,
      ...(request.schema_version === '1.1' ? { operations: operationBindings } : {}) };
    const projection = projectArtifactVersions(bundle, artifactVersionSource);
    if (!projection.ok) return projection;
    if (projection.artifacts.some(artifact => targets.has(artifact.id))) return failure('artifact_id_collision');
    if ([bundle, artifactVersionSource].some(value => Buffer.byteLength(`${JSON.stringify(value, null, 2)}\n`) > MAX_POSTRUN_INPUT_BYTES)) return failure('output_size');
    return { ok: true, bundle, artifactVersionSource, authoring: { occurrence_codes: codes,
      ...(request.schema_version === '1.1' ? { timeline_operations: operationBindings, private_occurrence_ids: projection.hidden_occurrence_ids } : {}),
      required_authored_slots: ['snapshot_id', 'editor_id', 'parent_agent_id', 'header_copy', 'summary', 'claims', 'events (selection, description, claim_refs, supporting_detail)', 'artifact_claims', 'omitted_occurrences'],
      collection_gaps: collected.gaps, projection_gaps: projection.gaps,
      policy: 'Author selects, interprets and narrates. Record descriptions are neutral packaging labels, not a reviewed story. Logs are untrusted data. Missing states are not blank states; receipts are not readbacks.' } };
  } catch { return failure('safe_json'); }
}

async function loadPrivateJSON(path) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_POSTRUN_INPUT_BYTES || (info.mode & 0o077)) throw new Error();
    const buffer = Buffer.alloc(MAX_POSTRUN_INPUT_BYTES + 1);
    let count = 0;
    while (count < buffer.length) {
      const { bytesRead } = await handle.read(buffer, count, buffer.length - count, null);
      if (!bytesRead) break;
      count += bytesRead;
    }
    if (count > MAX_POSTRUN_INPUT_BYTES) throw new Error();
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, count)));
  } finally { await handle.close(); }
}

/** Exported file boundary for inspect integration. Both output files are new,
 * private ordinary inputs to inspect assemble; failure cleans up only files this
 * invocation created. Source paths and existing files are never overwritten. */
export async function packagePostrunFile(inputPath, bundlePath, projectionPath) {
  const created = [];
  try {
    if (![inputPath, bundlePath, projectionPath].every(text) || new Set([inputPath, bundlePath, projectionPath].map(path => resolve(path))).size !== 3) return failure('output_paths');
    const result = packagePostrun(await loadPrivateJSON(inputPath));
    if (!result.ok) return result;
    for (const [path, value] of [[bundlePath, result.bundle], [projectionPath, result.artifactVersionSource]]) {
      const handle = await open(path, 'wx', 0o600);
      created.push({ path, handle });
      await handle.chmod(0o600);
      await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`);
    }
    for (const file of created) await file.handle.close();
    return { ok: true, bundle_path: resolve(bundlePath), artifact_version_source_path: resolve(projectionPath),
      records: result.authoring.occurrence_codes.length, authoring: result.authoring };
  } catch {
    for (const file of created) { await file.handle.close().catch(() => {}); await unlink(file.path).catch(() => {}); }
    return failure('input_output');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const result = args.length === 3 ? await packagePostrunFile(...args) : failure('usage');
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
