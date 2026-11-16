// Private navigation over supplied, sanitized source records. No I/O or tool calls.
import { factualDigest, validateCandidate } from './contracts.mjs';
import { validateSessionEvidence } from './session-evidence.mjs';

export const SOURCE_NAVIGATION_LIMITS = Object.freeze({ input_bytes: 32 * 1024 * 1024,
  output_bytes: 4 * 1024 * 1024, sources: 4096, events: 20000, requests: 512, claims: 4096 });
// Existing get_session_events schema, not a mapping from business/event prose.
const eventTypes = new Set(['user_message', 'agent_console', 'container_log', 'runtime_start',
  'runtime_running', 'runtime_waiting', 'runtime_error', 'runtime_done', 'credentials_request',
  'security_event', 'agent_install_request', 'agent_notification_message', 'agent_notification_progress',
  'agent_notification_error', 'system_error', 'system_message', 'trigger_message', 'interrupted',
  'llm_start', 'llm_done', 'agent_render']);
const clocks = ['/captured_at', '/metadata/captured_at', '/metadata/observed_at'];
const object = v => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
const closed = (v, required, optional = []) => object(v) && required.every(k => Object.hasOwn(v, k)) &&
  Object.keys(v).every(k => [...required, ...optional].includes(k));
const id = v => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(v);
const bytes = v => Buffer.byteLength(typeof v === 'string' ? v : JSON.stringify(v), 'utf8');
const canonical = v => Array.isArray(v) ? `[${v.map(canonical).join(',')}]` : object(v)
  ? `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}` : JSON.stringify(v);
const copy = v => JSON.parse(JSON.stringify(v));
const unique = values => [...new Set(values)];
const escape = s => s.replace(/~/g, '~0').replace(/\//g, '~1');
const error = code => { const e = new Error(`Source navigation rejected: ${code}`); e.code = code; throw e; };
function requireValue(condition, code) { if (!condition) error(code); }
// Retained full events and exact reduced collector envelopes may both exist.
// Missing fields are not conflicts, but every overlapping value must agree.
function mergeEventIdentity(previous, current) {
  if (object(previous) && object(current)) {
    return Object.fromEntries(unique([...Object.keys(previous), ...Object.keys(current)]).map(key => [key,
      Object.hasOwn(previous, key) && Object.hasOwn(current, key) ? mergeEventIdentity(previous[key], current[key]) :
        Object.hasOwn(current, key) ? current[key] : previous[key]]));
  }
  requireValue(canonical(previous) === canonical(current), 'event_binding');
  return previous;
}
function utc(value) {
  const match = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,3}))?Z$/.exec(value ?? '');
  return Boolean(match && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`);
}
function safeURL(value) {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && !u.search && !u.hash &&
      !/[\u0000-\u0020\\]/.test(value) && !/%(?:2e|2f|5c)/i.test(value) &&
      !/\/(?:\.|\.\.)(?:\/|$)/.test(value);
  } catch { return false; }
}
function safePath(value, absolute = false) {
  return typeof value === 'string' && value.length > 0 && value.length <= 2048 &&
    /^[A-Za-z0-9_./ -]+$/.test(value) && !value.includes('//') && !value.endsWith('/') &&
    (!absolute || value.startsWith('/')) && (absolute || !value.startsWith('/')) &&
    value.split('/').filter(Boolean).every(part => !['.', '..'].includes(part));
}
// RFC 6901 only: no JSONPath, code, inherited properties or guessed field names.
function at(root, pointer) {
  requireValue(typeof pointer === 'string' && pointer.length <= 4096 &&
    (pointer === '' || pointer.startsWith('/')) && !/~(?![01])/u.test(pointer), 'pointer');
  let value = root;
  for (const part of pointer === '' ? [] : pointer.slice(1).split('/')) {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    requireValue(!['__proto__', 'prototype', 'constructor'].includes(key) &&
      (object(value) || Array.isArray(value)) && Object.hasOwn(value, key) &&
      (!Array.isArray(value) || /^(0|[1-9]\d*)$/.test(key)), 'pointer');
    value = value[key];
  }
  return value;
}

// Parse the supplied JSON text once to find real value-token line numbers. This
// does not open/attest the path: the caller must pass text from that exact file.
function documentLines(document, candidate) {
  requireValue(closed(document, ['path', 'text']) && safePath(document.path, true) &&
    typeof document.text === 'string' && bytes(document.text) <= SOURCE_NAVIGATION_LIMITS.input_bytes, 'document');
  const text = document.text;
  let parsed;
  try { parsed = JSON.parse(text); } catch { error('document'); }
  requireValue(canonical(parsed) === canonical(candidate), 'document_binding');
  const lines = new Map();
  let position = 0, line = 1;
  const whitespace = () => { while (/\s/.test(text[position] ?? '') && position < text.length) { if (text[position++] === '\n') line++; } };
  const string = () => {
    const start = position++;
    while (position < text.length) {
      const char = text[position++];
      if (char === '\\') position++;
      else if (char === '"') break;
    }
    return JSON.parse(text.slice(start, position));
  };
  const value = pointer => {
    whitespace(); lines.set(pointer, line);
    if (text[position] === '{') {
      position++; whitespace();
      while (text[position] !== '}') {
        const key = string(); whitespace(); position++;
        value(`${pointer}/${escape(key)}`); whitespace();
        if (text[position] !== ',') break;
        position++; whitespace();
      }
      position++;
    } else if (text[position] === '[') {
      position++; whitespace(); let index = 0;
      while (text[position] !== ']') {
        value(`${pointer}/${index++}`); whitespace();
        if (text[position] !== ',') break;
        position++; whitespace();
      }
      position++;
    } else if (text[position] === '"') string();
    else { while (position < text.length && !/[\s,\]}]/.test(text[position])) position++; }
  };
  value('');
  return lines;
}

function githubRequest(request, evidence) {
  requireValue(closed(request, ['owner', 'repo', 'path', 'sha']) &&
    /^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(request.owner) &&
    /^[A-Za-z0-9_.-]{1,100}$/.test(request.repo) && !['.', '..'].includes(request.repo) &&
    safePath(request.path) && /^[a-fA-F0-9]{40}$/.test(request.sha), 'github_request');
  const expected = `https://github.com/${request.owner}/${request.repo}/blob/${request.sha}/${request.path.split('/').map(encodeURIComponent).join('/')}`;
  // The immutable source URL must already exist. Never create a handle from prose.
  requireValue(evidence.source.url === expected, 'source_binding');
  return copy(request);
}
function guildRequest(request, sessions, events = false) {
  requireValue(closed(request, ['session_id'], events ? ['from_id', 'limit', 'types'] : []) &&
    sessions.has(request.session_id), 'session_binding');
  if (events) requireValue((request.from_id === undefined || id(request.from_id)) &&
    (request.limit === undefined || (Number.isInteger(request.limit) && request.limit >= 0 && request.limit <= 500)) &&
    (request.types === undefined || (Array.isArray(request.types) && request.types.length > 0 &&
      request.types.length <= eventTypes.size && request.types.every(t => eventTypes.has(t)) &&
      unique(request.types).length === request.types.length)), 'guild_request');
  return request.session_id;
}

/** Build private packet-fact navigation, not factual verification. See the reference
 * for the closed options schema. All pointers refer to existing supplied records. */
export function buildSourceNavigation(candidate, options = {}) {
  requireValue(closed(options, [], ['read_sources', 'candidate_document']), 'options');
  let serialized;
  try { serialized = JSON.stringify(candidate); } catch { error('candidate'); }
  requireValue(typeof serialized === 'string' && bytes(serialized) <= SOURCE_NAVIGATION_LIMITS.input_bytes &&
    validateCandidate(candidate).ok, 'candidate');
  requireValue(candidate.claims.length <= SOURCE_NAVIGATION_LIMITS.claims, 'claim_limit');
  const lineMap = options.candidate_document ? documentLines(options.candidate_document, candidate) : null;
  const locate = pointer => {
    at(candidate, pointer);
    return { pointer, ...(lineMap ? { file: options.candidate_document.path, line: lineMap.get(pointer) } : {}) };
  };
  const sessions = new Set(candidate.sessions.map(s => s.id));
  const timeline = candidate.timeline;
  const occurrences = candidate.source_bundle?.occurrences ?? timeline;
  const occurrenceRoot = candidate.source_bundle ? '/source_bundle/occurrences' : '/timeline';
  const evidence = new Map();
  for (const [root, records] of [['/evidence', candidate.evidence], ['/source_bundle/evidence', candidate.source_bundle?.evidence ?? []]]) {
    records.forEach((record, i) => {
      if (evidence.has(record.id)) requireValue(canonical(evidence.get(record.id).record) === canonical(record), 'source_binding');
      else evidence.set(record.id, { record, pointer: `${root}/${i}` });
    });
  }
  requireValue(evidence.size <= SOURCE_NAVIGATION_LIMITS.sources, 'source_limit');
  const descriptors = new Map();
  requireValue(options.read_sources === undefined || (Array.isArray(options.read_sources) &&
    options.read_sources.length <= SOURCE_NAVIGATION_LIMITS.sources), 'read_sources');
  for (const descriptor of options.read_sources ?? []) {
    requireValue(closed(descriptor, ['evidence_id', 'reader', 'response_pointer'], ['request_pointer', 'clock_pointer']) &&
      evidence.has(descriptor.evidence_id) && !descriptors.has(descriptor.evidence_id) &&
      ['guild_session', 'guild_events', 'github_file', 'unknown'].includes(descriptor.reader), 'read_source');
    descriptors.set(descriptor.evidence_id, descriptor);
  }
  const suggestions = [], requestKeys = new Map(), events = [], operations = [], eventIdentities = new Map();
  const suggest = (tool, args) => {
    const key = canonical({ tool, arguments: args });
    if (!requestKeys.has(key)) {
      requireValue(suggestions.length < SOURCE_NAVIGATION_LIMITS.requests, 'request_limit');
      const request_id = `read-${suggestions.length + 1}`;
      requestKeys.set(key, request_id);
      suggestions.push({ request_id, tool, arguments: args, independent_read_required: true,
        limitations: tool === 'guild_get_session_events' ? ['Newest-first bounded page; absence is not proof of absence.',
          'from_id means AFTER only, not an older-page cursor. No before_id or offset is supported.',
          'Do not poll or repeat an unreachable older query. Preserve inaccessible/truncated history as unavailable.'] :
          ['Current readback does not by itself prove historical content, ordering or causation.'] });
    }
    return requestKeys.get(key);
  };
  const sources = [];
  for (const [source_id, { record, pointer }] of evidence) {
    requireValue(!record.source.url || safeURL(record.source.url), 'unsafe_url');
    const related = occurrences.filter(o => o.evidence_refs.includes(source_id));
    const pinned = unique([...candidate.sessions.filter(s => s.source_refs.includes(source_id)).map(s => s.id),
      ...related.map(o => o.session_id).filter(Boolean)]);
    let descriptor = descriptors.get(source_id);
    // These are explicit supported Guild envelopes, not a search through prose.
    if (!descriptor && /^Guild(?:\b|$)/i.test(record.source.system)) {
      if (record.kind === 'session_record' && sessions.has(record.source.record_id))
        descriptor = { reader: 'guild_session', response_pointer: '' };
      else if (object(record.content) && (Array.isArray(record.content.items) || Array.isArray(record.content.events)) && sessions.has(record.content.session_id))
        descriptor = { reader: 'guild_events', response_pointer: '' };
      else if (object(record.content?.event) && record.content.event.id === record.source.record_id && pinned.length === 1)
        descriptor = { reader: 'guild_events', response_pointer: '/event' };
    }
    const entry = { source_id, identity: copy(record.source), evidence_kind: record.kind,
      locator: locate(pointer), completeness: record.completeness, redactions: copy(record.redactions),
      cached_capture: { at: record.captured_at, scope: 'collector_cache_not_checker_observed_at' },
      ...(record.occurred_at ? { occurred_at: record.occurred_at } : {}),
      occurrence_ids: related.map(o => o.id), claim_refs: candidate.claims.filter(c => c.evidence_refs.includes(source_id)).map(c => c.id),
      reader: descriptor?.reader ?? 'unknown', request_ids: [], gaps: [],
      read_clock: { status: 'unsupported', guidance: 'A fresh authorized read must supply a full UTC capture clock; never borrow event time or this cached capture.' } };
    if (!descriptor || descriptor.reader === 'unknown') {
      if (descriptor) { at(record.content, descriptor.response_pointer); requireValue(descriptor.request_pointer === undefined && descriptor.clock_pointer === undefined, 'unknown_reader'); }
      entry.gaps.push('No supported independent source capability is established; do not invent a tool, route or request.');
      sources.push(entry); continue;
    }
    const response = at(record.content, descriptor.response_pointer);
    requireValue(object(response), 'response');
    const responseRoot = `${pointer}/content${descriptor.response_pointer}`;
    const request = descriptor.request_pointer === undefined ? undefined : at(record.content, descriptor.request_pointer);
    if (descriptor.reader === 'github_file') {
      requireValue(request !== undefined, 'github_request');
      entry.request_ids.push(suggest('get_file_contents', githubRequest(request, record)));
    } else {
      requireValue(/^Guild(?:\b|$)/i.test(record.source.system), 'source_binding');
      const isEvents = descriptor.reader === 'guild_events';
      const session_id = request !== undefined ? guildRequest(request, sessions, isEvents) : response?.session_id ??
        (descriptor.reader === 'guild_session' ? record.source.record_id : pinned.length === 1 ? pinned[0] : undefined);
      requireValue(sessions.has(session_id) && (!response?.session_id || response.session_id === session_id) &&
        (pinned.length === 0 || (pinned.length === 1 && pinned[0] === session_id)), 'session_binding');
      entry.session_id = session_id;
      if (!isEvents) {
        requireValue(record.kind === 'session_record' && record.source.record_id === session_id &&
          (!response?.id || response.id === session_id), 'source_binding');
        entry.request_ids.push(suggest('guild_get_session', { session_id }));
      } else {
        const listKey = Array.isArray(response?.items) ? 'items' : Array.isArray(response?.events) ? 'events' : null;
        const list = listKey ? response[listKey] : [response];
        requireValue(list.length + events.length <= SOURCE_NAVIGATION_LIMITS.events && list.every(e => object(e) && id(e.id) && typeof e.type === 'string'), 'events');
        requireValue(['has_more', 'truncated'].every(k => response[k] === undefined || typeof response[k] === 'boolean') &&
          (response.limit === undefined || (Number.isInteger(response.limit) && response.limit >= 0 && response.limit <= 500)) &&
          (response.total_count === undefined || (Number.isSafeInteger(response.total_count) && response.total_count >= list.length)), 'pagination');
        requireValue(record.source.record_id === session_id || list.some(e => e.id === record.source.record_id), 'source_binding');
        const seen = new Set(), typeRanks = new Map();
        for (const [index, event] of list.entries()) {
          requireValue(!seen.has(event.id) && (!event.session_id || event.session_id === session_id), 'event_binding'); seen.add(event.id);
          requireValue(['at', 'created_at'].every(k => event[k] === undefined || (typeof event[k] === 'string' && event[k].length <= 128)) &&
            (!event.task || (object(event.task) && (!event.task.id || id(event.task.id)) &&
              (!event.task.tool_name || (typeof event.task.tool_name === 'string' && event.task.tool_name.length <= 256)) &&
              (!event.task.tool_call_id || (typeof event.task.tool_call_id === 'string' && event.task.tool_call_id.length <= 1024)))), 'event_metadata');
          const parent = event.task?.parent_task;
          requireValue(!parent || (object(parent) && (!parent.id || id(parent.id)) &&
            (!parent.agent || (object(parent.agent) && (!parent.agent.id || id(parent.agent.id)))) &&
            (!parent.version || (object(parent.version) && (!parent.version.id || id(parent.version.id))))), 'event_metadata');
          const identity = { session_id, event };
          eventIdentities.set(event.id, eventIdentities.has(event.id) ? mergeEventIdentity(eventIdentities.get(event.id), identity) : identity);
          const types = eventTypes.has(event.type) ? [event.type] : undefined;
          const request_id = suggest('guild_get_session_events', { session_id, limit: 500, ...(types ? { types } : {}) });
          entry.request_ids.push(request_id);
          const rank = types ? typeRanks.get(event.type) ?? 0 : index;
          typeRanks.set(event.type, rank + 1);
          const eventPointer = `${responseRoot}${listKey ? `/${listKey}/${index}` : ''}`;
          const item = { source_id, event_id: event.id, session_id, type: event.type,
            response_order: index, locator: locate(eventPointer), request_id,
            bounded_read_reachability: listKey && rank >= 500 ? 'outside_cached_newest_500_matching_events' : 'unverified_on_future_read',
            ...(event.created_at !== undefined ? { created_at: copy(event.created_at) } : {}),
            ...(event.at !== undefined ? { at: copy(event.at) } : {}),
            ...(event.task?.id ? { task_id: event.task.id } : {}),
            ...(event.task?.tool_name ? { tool_name: event.task.tool_name } : {}),
            ...(event.task?.tool_call_id ? { tool_call_id: event.task.tool_call_id } : {}),
            ...(parent ? { emitter: { ...(parent.id ? { id: parent.id } : {}),
              ...(parent.agent?.id ? { agent: { id: parent.agent.id } } : {}),
              ...(parent.version?.id ? { version: { id: parent.version.id } } : {}) } } : {}),
            independent_read_required: true };
          // Preserve the actual report's stage; request/ack is never readback.
          if (event.type === 'runtime_start' && event.task?.tool_name === 'console_log' && typeof event.content?.message === 'string') {
            let report; try { report = JSON.parse(event.content.message); } catch { /* raw source remains at the locator */ }
            if (report?.type === 'scenario_evidence') {
              if (validateSessionEvidence(report).ok) {
                requireValue(report.session_id === session_id, 'session_binding');
                requireValue((!report.source.url || safeURL(report.source.url)) &&
                  (!report.material.immutable_url || safeURL(report.material.immutable_url)), 'unsafe_url');
                operations.push({ source_id, event_id: event.id, locator: locate(`${eventPointer}/content/message`),
                  encoding: 'JSON_string', operation_id: report.operation_id, stream_id: report.stream_id,
                  sequence: report.sequence, stage: report.stage, at: report.at, source: copy(report.source),
                  material: Object.fromEntries(['completeness', 'redactions', 'gaps', 'revision', 'immutable_url'].filter(k => Object.hasOwn(report.material, k)).map(k => [k, copy(report.material[k])])),
                  bindings: copy((candidate.artifact_version_source?.bindings ?? []).filter(b => b.evidence_id === source_id)),
                  ...(report.acknowledgment ? { acknowledgment: report.acknowledgment } : {}),
                  state_basis: report.stage === 'artifact_observed' ? 'attributed_observation_not_independent_read' : 'intent_receipt_or_gap_not_stored_state' });
              } else entry.gaps.push('A marked operation report is invalid; raw evidence is retained, not promoted to observed state.');
            }
          }
          events.push(item);
        }
        if (!list.length) entry.request_ids.push(suggest('guild_get_session_events', { session_id, limit: 500 }));
        entry.request_ids = unique(entry.request_ids);
        entry.pagination = Object.fromEntries(['has_more', 'limit', 'total_count', 'truncated'].filter(k => Object.hasOwn(response, k)).map(k => [k, copy(response[k])]));
        if (response.has_more === true || response.truncated === true || (Number.isInteger(response.total_count) && response.total_count > list.length))
          entry.gaps.push('Cached event response is partial/truncated. Its missing records are not evidence of absence.');
        if (request?.from_id) entry.gaps.push('Cached request used an AFTER-only from_id; it cannot establish earlier history.');
        if (list.some(e => !eventTypes.has(e.type))) entry.gaps.push('An event type is outside the documented filter enum; no invented type filter was suggested.');
      }
    }
    const clockPointer = descriptor.clock_pointer ?? clocks.find(p => {
      try { return utc(at(response, p)); } catch { return false; }
    });
    if (clockPointer !== undefined) {
      requireValue(clocks.includes(clockPointer) && utc(at(response, clockPointer)), 'read_clock');
      entry.read_clock = { status: 'cached_source_capture_metadata', locator: locate(`${responseRoot}${clockPointer}`),
        at: at(response, clockPointer), guidance: 'Historical metadata only. On your OWN read, use actual returned full UTC capture metadata and disclose its scope; never reuse this cached time as observed_at.' };
    }
    sources.push(entry);
  }
  const sourceMap = new Map(sources.map(s => [s.source_id, s]));
  const artifacts = candidate.artifacts.map((artifact, i) => {
    requireValue(!artifact.source_url || safeURL(artifact.source_url), 'unsafe_url');
    return { artifact_id: artifact.id, kind: artifact.kind, media_type: artifact.media_type, change: artifact.change, locator: locate(`/artifacts/${i}`),
      ...(artifact.source_url ? { source_url: artifact.source_url } : {}),
      evidence_refs: copy(artifact.evidence_refs), completeness: artifact.completeness, redactions: copy(artifact.redactions),
      material_fields: ['content', 'structured_content', 'before', 'after'].filter(k => Object.hasOwn(artifact, k)),
      claim_refs: unique(candidate.artifact_claims.filter(a => a.artifact_id === artifact.id).flatMap(a => a.claim_refs)),
      occurrence_ids: timeline.filter(o => o.artifact_refs.includes(artifact.id)).map(o => o.id) };
  });
  // Version operations refer to exact existing evidence-content pointers, not
  // provider-specific replay instructions or a claim that storage was observed.
  for (const [i, version] of (candidate.artifact_version_source?.versions ?? []).entries()) {
    const refs = {};
    for (const key of ['value_ref', 'base_ref', 'index_ref', 'readback_ref']) if (version[key]) {
      const ref = version[key], source = evidence.get(ref.evidence_id);
      requireValue(source, 'operation_binding'); at(source.record.content, ref.pointer);
      refs[key] = { ...copy(ref), locator: locate(`${source.pointer}/content${ref.pointer}`) };
    }
    operations.push({ version_id: version.id, artifact_id: version.artifact_id, occurrence_id: version.occurrence_id,
      operation: version.operation, locator: locate(`/artifact_version_source/versions/${i}`), refs,
      ...Object.fromEntries(['previous_version_id', 'index_base'].filter(k => Object.hasOwn(version, k)).map(k => [k, copy(version[k])])),
      ...(version.operation_binding ? { operation_binding: copy(version.operation_binding) } : {}),
      state_basis: 'projection_not_independent_stored_state' });
  }
  const occurrenceIndex = occurrences.map((occurrence, i) => ({ occurrence_id: occurrence.id,
    kind: occurrence.kind, locator: locate(`${occurrenceRoot}/${i}`), actor_id: occurrence.actor_id,
    ...(occurrence.session_id ? { session_id: occurrence.session_id } : {}),
    ...(occurrence.time ? { time_window: copy(occurrence.time) } : {}), outcome: occurrence.outcome,
    ...(occurrence.world_effect ? { world_effect: copy(occurrence.world_effect) } : {}),
    ...(occurrence.workflow_relevance ? { workflow_relevance: copy(occurrence.workflow_relevance) } : {}),
    evidence_refs: copy(occurrence.evidence_refs), artifact_refs: copy(occurrence.artifact_refs),
    relationships: copy(occurrence.relationships), selected: timeline.some(o => o.id === occurrence.id),
    claim_refs: copy(timeline.find(o => o.id === occurrence.id)?.claim_refs ?? []) }));
  const coverage = candidate.claims.map((claim, i) => {
    const relatedOccurrences = timeline.filter(o => o.claim_refs.includes(claim.id) || o.concern?.claim_refs.includes(claim.id) || o.suggested_feedback?.claim_refs.includes(claim.id));
    const relatedArtifacts = artifacts.filter(a => a.claim_refs.includes(claim.id));
    const source_ids = unique([...claim.evidence_refs, ...relatedOccurrences.flatMap(o => [...o.evidence_refs,
      ...(o.concern?.evidence_refs ?? []), ...(o.suggested_feedback?.evidence_refs ?? [])]), ...relatedArtifacts.flatMap(a => a.evidence_refs)]);
    return { claim_id: claim.id, locator: locate(`/claims/${i}`), evidence_refs: copy(claim.evidence_refs), source_ids,
      event_ids: unique(events.filter(e => source_ids.includes(e.source_id)).map(e => e.event_id)),
      occurrence_ids: relatedOccurrences.map(o => o.id), artifact_ids: relatedArtifacts.map(a => a.artifact_id),
      operation_indexes: operations.flatMap((o, index) => source_ids.includes(o.source_id) || relatedArtifacts.some(a => a.artifact_id === o.artifact_id) || relatedOccurrences.some(e => e.id === o.occurrence_id) ? [index] : []),
      header_claim_roles: ['claim_refs', 'description_claim_refs'].filter(k => candidate.header_copy?.[k]?.includes(claim.id)).map(k => `header_copy.${k}`),
      request_ids: unique(source_ids.flatMap(ref => sourceMap.get(ref)?.request_ids ?? [])),
      unknown_capability_source_ids: source_ids.filter(ref => sourceMap.get(ref)?.reader === 'unknown'),
      independent_read_required: true, finding_required: true };
  });
  for (const suggestion of suggestions) {
    const targets = events.filter(e => e.request_id === suggestion.request_id);
    suggestion.target_event_ids = unique(targets.map(e => e.event_id));
    suggestion.outside_cached_bounded_page_event_ids = unique(targets.filter(e => e.bounded_read_reachability === 'outside_cached_newest_500_matching_events').map(e => e.event_id));
  }
  const result = { schema_version: '1.0', candidate_digest: factualDigest(candidate), private: true,
    cached_index_is_independent_read: false, sources, events, occurrences: occurrenceIndex, artifacts, operations,
    read_suggestions: suggestions, claim_coverage: coverage,
    qualifications: { source_gaps: copy(candidate.coverage.gaps),
      ...(candidate.coverage.observation_window ? { observation_window: copy(candidate.coverage.observation_window) } : {}),
      ...(candidate.source_bundle?.coverage.data_origin || candidate.coverage.data_origin ? { data_origin: candidate.source_bundle?.coverage.data_origin ?? candidate.coverage.data_origin } : {}) },
    checker_rules: [
      'Use this private index for navigation only. Independently read the authorized sources for every claim; a packet/cache/index is not your call.',
      'Suggestions are bounded candidates, not verified future calls, new permissions or proof of reachability. Use only the existing allowlist.',
      'Do not infer absence, historical state, causation, delivery or confirmation from a missing/truncated response or current readback.',
      'Record actual failed reads and inaccessible older events as unavailable/inconclusive with material gaps; never broaden tools or poll.',
      'observed_at requires genuine YYYY-MM-DDTHH:mm:ss[.SSS]Z source capture metadata from your own read, not an event or cached collector time.',
      'A same-session paired-read clock must be cited and its limited scope disclosed. No supported clock means a capability diagnostic, not an invented timestamp.',
      'Return exactly one genuine final finding for every claim, preserving source identity, order, redactions, missing material and readback-versus-intent qualifications.',
      'Keep navigation and review machinery out of the UI, copied prompt and end-user chat. Normal source-bound rendering does not require fake approval.' ] };
  requireValue(bytes(result) <= SOURCE_NAVIGATION_LIMITS.output_bytes, 'output_limit');
  return result;
}

/** Closed output validation by deterministic regeneration. Also rejects extra keys,
 * stale digests, changed requests and cross-bound pointers; never repairs the index. */
export function validateSourceNavigation(candidate, navigation, options = {}) {
  try {
    requireValue(object(navigation) && bytes(navigation) <= SOURCE_NAVIGATION_LIMITS.output_bytes, 'navigation');
    requireValue(navigation.candidate_digest === factualDigest(candidate), 'stale_navigation');
    requireValue(canonical(navigation) === canonical(buildSourceNavigation(candidate, options)), 'navigation_binding');
    return { ok: true };
  } catch (e) { return { ok: false, errors: [{ code: e.code ?? 'navigation', message: 'Private source navigation is invalid; preserve the original records and rebuild from exact supplied inputs.' }] }; }
}
