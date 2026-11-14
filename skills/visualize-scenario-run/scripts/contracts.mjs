// Evidence bundle 1.0 / authored-header snapshot 1.7. No agent calls.
import { createHash } from 'node:crypto';
import { headerCopyContract, headerTextFieldsFor, headerPolicyFor, HEADER_COPY_POLICY, SCENARIO_SUMMARY_POLICY, summaryHeaderCopyContract } from './header-copy.mjs';

const text = { type: 'string', min: 1 };
const id = { type: 'string', pattern: /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/ };
const url = { type: 'url' };
const date = { type: 'date', format: 'YYYY-MM-DDTHH:mm:ss[.SSS]Z', pattern: /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/ };
const json = { type: 'json' };
const en = (...values) => ({ type: 'enum', values });
const array = (items, min = 0) => ({ type: 'array', items, min });
const optional = (schema) => ({ ...schema, optional: true });
const object = (fields) => ({ type: 'object', fields });
const refs = array(id);
const outcome = en('confirmed', 'failed', 'partial', 'unconfirmed', 'unknown');
const origin = en('observed', 'synthetic', 'mixed');
const basis = en('observed', 'inferred', 'user_supplied');
const source = object({ system: text, record_id: optional(text), url: optional(url) });
const time = object({ at: optional(date), earliest: optional(date), latest: optional(date) });
const relationship = object({ other_occurrence_id: id, relation: en('caused_by', 'responds_to', 'follows'), basis, evidence_refs: refs });
const relevance = object({ explanation: text, basis, evidence_refs: refs });
const occurrenceFields = {
  id, kind: en('session_started', 'session_terminated', 'agent_world_action', 'external_world_action', 'supporting_activity'),
  actor_id: id, session_id: optional(id), description: text, time: optional(time), outcome,
  evidence_refs: array(id, 1), artifact_refs: refs,
  world_effect: optional(object({ system: text, target: optional(text), change: text })),
  relationships: array(relationship), workflow_relevance: optional(relevance),
};
const artifact = object({
  id, kind: en('message', 'document', 'diff', 'record', 'file', 'other'), title: text, media_type: text,
  content: optional(text), structured_content: optional(json), source_url: optional(url),
  evidence_refs: array(id, 1), completeness: en('complete', 'excerpt', 'metadata_only'), redactions: array(text),
  change: en('created', 'modified', 'sent', 'unchanged', 'unknown'),
  before: optional(text), after: optional(text),
});
const action = object({ id, kind: en('mark_run_correct', 'flag_issue', 'request_rerun'), label: text });
const common = {
  schema_version: en('1.0'), bundle_id: id,
  workflow: object({ id: optional(id), title: text, intended_world_effect: text, relevant_systems: array(text) }),
  scenario: object({ id, title: text, trigger: text, initial_conditions: text, expected_outcome: text }),
  run: object({ id, workspace_id: id, agent_version_ids: array(id, 1), application_version: text,
    sandbox_integrations: array(text), execution_label: optional(text),
    status: en('running', 'completed', 'failed', 'partial', 'cancelled', 'unknown'),
    observed_resulting_state: text, source_refs: array(id, 1) }),
  actors: array(object({ id, label: text, kind: en('agent', 'person', 'external_system'),
    workspace_id: optional(id), agent_version_id: optional(id) }), 1),
  sessions: array(object({ id, workspace_id: id, level: en('top_level', 'child', 'unknown'),
    parent_session_id: optional(id), agent_actor_id: id, source_refs: array(id, 1) })),
  evidence: array(object({ id, kind: en('session_record', 'session_event', 'tool_result', 'external_record', 'user_statement'),
    source, captured_at: date, occurred_at: optional(date), content: json,
    completeness: en('complete', 'excerpt', 'summary'), redactions: array(text) }), 1),
  artifacts: array(artifact),
  coverage: object({ observation_window: optional(object({ from: date, through: date })),
    gaps: array(object({ id, description: text, affected_refs: refs, impact: text })), data_origin: origin }),
  presentation: object({ parent_conversation_ref: text, interaction_target: text, allowed_actions: array(action) }),
};
const finding = object({ claim_id: id, check_refs: array(id, 1),
  finding: en('confirmed', 'qualified', 'conflict', 'unavailable', 'inconclusive'), explanation: text, gaps: array(text) });
export const bundleContract = object({ ...common, occurrences: array(object(occurrenceFields)) });
const factualSnapshotContract = object({
  ...common, schema_version: en('1.1'),
  coverage: object({ observation_window: optional(object({ from: date, through: date })),
    gaps: array(object({ id, description: text, affected_refs: refs })) }),
  snapshot_id: id, editor_id: id, parent_agent_id: id,
  summary: text, claims: array(object({ id, text, evidence_refs: array(id, 1) }), 1),
  timeline: array(object({ ...occurrenceFields,
    kind: en('session_started', 'session_terminated', 'agent_world_action', 'external_world_action'),
    claim_refs: array(id, 1), supporting_detail: text,
  })),
  artifact_claims: array(object({ artifact_id: id, claim_refs: array(id, 1) })),
  omitted_occurrences: array(object({ id, reason: text })),
  review: object({ checker_id: id, factual_digest: text,
    checks: array(object({ id, checker_id: id, operation: en('read'), source_id: text,
      observed_at: date, result: en('read', 'unavailable') }), 1),
    findings: array(finding, 1) }),
  // The only nonfactual renderer option: changing it does not invalidate review.
  display: object({ compact: { type: 'boolean' } }),
});

export const LEGACY_COPY_RULE_VERSIONS = Object.freeze({
  asd_ste100: 'issue-9-structural-v1',
  economist: 'cfb132d62447b959dea5a49940e28da89e1ba75b-summary-v1',
  sdlc: 'scenario-run-v1',
});
export const COPY_RULE_VERSIONS = Object.freeze({ ...LEGACY_COPY_RULE_VERSIONS, sdlc: 'scenario-run-v2' });
export const HEADER_COPY_RULE_VERSIONS = Object.freeze({ ...COPY_RULE_VERSIONS, header_copy: HEADER_COPY_POLICY.version });
export const SUMMARY_HEADER_COPY_RULE_VERSIONS = Object.freeze({ ...COPY_RULE_VERSIONS, header_copy: SCENARIO_SUMMARY_POLICY.version });
const guide = en('asd-ste100', 'economist', 'unresolved');
const fieldDigest = { type: 'string', pattern: /^[a-f0-9]{64}$/ };
const copyReviewSchema = (binding, versions = COPY_RULE_VERSIONS) => object({
  reviewer_id: id, candidate_digest: text,
  rule_versions: object(Object.fromEntries(Object.entries(versions).map(([key, version]) => [key, en(version)]))),
  verdict: en('pass', 'revise', 'blocked'),
  passages: array(object({ field_path: text, ...binding, guide,
    routing_reason: text, sdlc_review: en('pass', 'revise', 'blocked'), exceptions: array(text) })),
  exemptions: array(object({ field_path: text, reason: text })),
  findings: array(object({ field_path: text, ...binding,
    rule_group: en('asd-ste100', 'economist', 'sdlc', 'meaning', ...(versions.header_copy ? ['header_copy'] : [])), rule_id: text,
    severity: en('required', 'advisory'), explanation: text,
    suggestion: optional(text), semantic_risk: en('none', 'possible', 'changes_meaning') })),
});
const v2CopyReviewContract = copyReviewSchema({ field_digest: fieldDigest });
export const copyReviewContract = copyReviewSchema({ field_digest: fieldDigest }, HEADER_COPY_RULE_VERSIONS);
export const summaryCopyReviewContract = copyReviewSchema({ field_digest: fieldDigest }, SUMMARY_HEADER_COPY_RULE_VERSIONS);
export const copyReviewContractFor = doc => doc.schema_version === '1.8' ? summaryCopyReviewContract : doc.schema_version === '1.7' ? copyReviewContract : v2CopyReviewContract;
// Historical 1.2 reviews repeat exact text. Read-only compatibility, never a
// fallback for a new compact review or a reason to restamp an existing digest.
const legacyCopyReviewContract = copyReviewSchema({ original_text: text }, LEGACY_COPY_RULE_VERSIONS);
const legacyCompactCopyReviewContract = copyReviewSchema({ field_digest: fieldDigest }, LEGACY_COPY_RULE_VERSIONS);
const legacyDualSnapshotContract = object({ ...factualSnapshotContract.fields,
  schema_version: en('1.2'), copy_review: legacyCopyReviewContract,
});
const legacyAttachedSnapshotContract = object({ ...factualSnapshotContract.fields,
  schema_version: en('1.4'), copy_review: v2CopyReviewContract,
});
const suggestedFeedback = object({ action_id: id, text, evidence_refs: array(id, 1), claim_refs: array(id, 1) });
const legacyFeedbackSnapshotContract = object({ ...legacyAttachedSnapshotContract.fields,
  schema_version: en('1.5'), timeline: array(object({ ...factualSnapshotContract.fields.timeline.items.fields,
    suggested_feedback: optional(suggestedFeedback),
  })),
});
const legacyBoundedSnapshotContract = object({ ...legacyFeedbackSnapshotContract.fields,
  schema_version: en('1.6'), copy_review_iterations: en(1, 2),
});
const legacyHeaderSnapshotContract = object({ ...legacyBoundedSnapshotContract.fields,
  schema_version: en('1.7'), header_copy: headerCopyContract, copy_review: copyReviewContract,
});
export const snapshotContract = object({ ...legacyBoundedSnapshotContract.fields,
  schema_version: en('1.8'), header_copy: summaryHeaderCopyContract, copy_review: summaryCopyReviewContract,
});
const legacyCompactSnapshotContract = object({ ...legacyAttachedSnapshotContract.fields, schema_version: en('1.3'), copy_review: legacyCompactCopyReviewContract });
export const factualReviewContract = factualSnapshotContract.fields.review;
export const candidateContract = object(Object.fromEntries(Object.entries(snapshotContract.fields)
  .filter(([key]) => !['review', 'copy_review', 'copy_review_iterations'].includes(key))));

// Read-only compatibility for already checked 1.0 artifacts. This is NOT the
// schema for new renderer inputs. Validate the original digest before projecting
// old presentation metadata away; never rewrite or restamp its checker review.
const legacySnapshotContract = object({ ...factualSnapshotContract.fields,
  schema_version: en('1.0'), coverage: common.coverage,
  review: object({ ...factualSnapshotContract.fields.review.fields, data_origin: origin,
    checks: array(object({ ...factualSnapshotContract.fields.review.fields.checks.items.fields,
      data_origin: origin }), 1) }),
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function factualDigest(snapshot) {
  const { review, copy_review, copy_review_iterations, display, ...facts } = snapshot;
  return createHash('sha256').update(canonical(facts)).digest('hex');
}
export function copyFieldDigest(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

// Inventory, not a style classifier. Reviewers route by meaning, never UI location.
// Raw evidence/structured payloads are not authored prose and are never rewritten.
export function copyFields(doc) {
  const fields = [];
  const add = (path, value, protectedSource = false) => {
    if (typeof value === 'string') fields.push({ field_path: path, text: value,
      field_digest: copyFieldDigest(value), protected_source: protectedSource });
  };
  if (['1.7', '1.8'].includes(doc.schema_version)) for (const key of headerTextFieldsFor(doc)) add(`$.header_copy.${key}`, doc.header_copy?.[key]);
  for (const [name, keys] of Object.entries({ workflow: ['title', 'intended_world_effect'], scenario: ['title', 'trigger', 'initial_conditions', 'expected_outcome'], run: ['execution_label', 'observed_resulting_state'] })) {
    for (const key of keys) add(`$.${name}.${key}`, doc[name]?.[key]);
  }
  for (const [i, actor] of (doc.actors ?? []).entries()) add(`$.actors[${i}].label`, actor.label, true);
  add('$.summary', doc.summary);
  for (const [i, event] of (doc.timeline ?? []).entries()) {
    for (const key of ['description', 'supporting_detail']) add(`$.timeline[${i}].${key}`, event[key]);
    if (event.suggested_feedback) add(`$.timeline[${i}].suggested_feedback.text`, event.suggested_feedback.text);
    if (event.world_effect) {
      add(`$.timeline[${i}].world_effect.system`, event.world_effect.system, true);
      add(`$.timeline[${i}].world_effect.change`, event.world_effect.change);
    }
    if (event.workflow_relevance) add(`$.timeline[${i}].workflow_relevance.explanation`, event.workflow_relevance.explanation);
  }
  for (const [i, artifact] of (doc.artifacts ?? []).entries()) {
    add(`$.artifacts[${i}].title`, artifact.title);
    for (const key of ['content', 'before', 'after']) add(`$.artifacts[${i}].${key}`, artifact[key], true);
  }
  for (const [name, key] of [['claims', 'text'], ['omitted_occurrences', 'reason']]) {
    for (const [i, item] of (doc[name] ?? []).entries()) add(`$.${name}[${i}].${key}`, item[key]);
  }
  for (const [i, gap] of (doc.coverage?.gaps ?? []).entries()) add(`$.coverage.gaps[${i}].description`, gap.description);
  for (const [i, action] of (doc.presentation?.allowed_actions ?? []).entries()) add(`$.presentation.allowed_actions[${i}].label`, action.label);
  return fields;
}

export function validateCopyReview(doc, review, { requirePass = true } = {}) {
  return checkCopyReview(doc, review, { requirePass });
}
function checkCopyReview(doc, review, { requirePass = true, legacy = false, historical = false } = {}) {
  const errors = [];
  shape(review, legacy ? legacyCopyReviewContract : historical ? legacyCompactCopyReviewContract : copyReviewContractFor(doc), '$.copy_review', errors);
  scan(review, '$.copy_review', errors);
  if (errors.length) return { ok: false, errors };
  const fail = (path, code, message) => error(errors, path, code, message, 'Obtain copy feedback for this exact candidate; the author must resolve required issues and obtain both reviews again.');
  if ([doc.editor_id, doc.parent_agent_id, doc.review?.checker_id].includes(review.reviewer_id)) fail('$.copy_review.reviewer_id', 'independence', 'Copy editor must be distinct from author, parent and fact checker.');
  if (review.candidate_digest !== factualDigest(doc)) fail('$.copy_review.candidate_digest', 'stale_review', 'Copy review does not match candidate content.');
  const fields = new Map(copyFields(doc).map(field => [field.field_path, field]));
  const seen = new Set();
  const passages = new Map();
  for (const [i, passage] of review.passages.entries()) {
    const path = `$.copy_review.passages[${i}]`;
    const field = fields.get(passage.field_path);
    if (!field || field.protected_source || (legacy ? passage.original_text !== field.text : passage.field_digest !== field.field_digest)) fail(path, 'copy_field', 'Passage must match a current authored field, not verbatim source content.');
    if (seen.has(passage.field_path)) fail(path, 'duplicate_copy_field', 'A field cannot receive two style routes or an exemption and a route.');
    seen.add(passage.field_path); passages.set(passage.field_path, passage);
    if (passage.guide === 'unresolved' && review.verdict !== 'blocked') fail(path, 'routing', 'Unresolved routing requires a blocked review, not both guides or a pass.');
    if (['1.7', '1.8'].includes(doc.schema_version) && passage.field_path.startsWith('$.header_copy.') && !['economist', 'unresolved'].includes(passage.guide)) fail(path, 'routing', 'Human-experience header copy requires Economist, not an internal-process ASD route.');
    if (review.verdict === 'pass' && passage.sdlc_review !== 'pass') fail(path, 'sdlc_review', 'Every passage needs a final SDLC pass after its selected guide.');
  }
  for (const [i, exemption] of review.exemptions.entries()) {
    const field = fields.get(exemption.field_path);
    if (!field?.protected_source) fail(`$.copy_review.exemptions[${i}]`, 'copy_exemption', 'Only protected source text may be exempted; authored copy must be reviewed.');
    if (seen.has(exemption.field_path)) fail(`$.copy_review.exemptions[${i}]`, 'duplicate_copy_field', 'A field has multiple review entries.');
    seen.add(exemption.field_path);
  }
  for (const field of fields.values()) if (!seen.has(field.field_path)) fail('$.copy_review', 'unchecked_copy', 'A copy field has no passage review or protected-source exemption.');
  for (const [i, finding] of review.findings.entries()) {
    const path = `$.copy_review.findings[${i}]`;
    const passage = passages.get(finding.field_path);
    if (!passage || (legacy ? passage.original_text !== finding.original_text : passage.field_digest !== finding.field_digest)) fail(path, 'copy_field', 'Finding must identify the exact reviewed field.');
    if (['asd-ste100', 'economist'].includes(finding.rule_group) && finding.rule_group !== passage?.guide) fail(path, 'routing', 'A finding cannot apply the other style guide.');
    if (finding.rule_group === 'header_copy' && (!finding.field_path.startsWith('$.header_copy.') || headerPolicyFor(doc).fields[finding.field_path.slice('$.header_copy.'.length)]?.rule_id !== finding.rule_id)) fail(path, 'header_policy', 'A header product finding must identify the matching header field and policy rule.');
    if (review.verdict === 'pass' && (finding.severity === 'required' || finding.semantic_risk !== 'none')) fail(path, 'copy_verdict', 'A pass cannot contain unresolved required issues or semantic risk.');
  }
  if (requirePass && review.verdict !== 'pass') fail('$.copy_review.verdict', 'copy_not_passed', 'Copy review requires author revision or is blocked.');
  return { ok: errors.length === 0, errors };
}

function error(errors, path, code, message, repair) {
  // Never echo field values; rejected input can contain credentials.
  errors.push({ path, code, message, repair });
}
function finiteJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(finiteJson);
  if (value && Object.getPrototypeOf(value) === Object.prototype) return Object.values(value).every(finiteJson);
  return false;
}
function shape(value, schema, path, errors) {
  const fail = (message) => error(errors, path, 'schema', message, 'Use the documented contract for this input version.');
  if (value === undefined && schema.optional) return;
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string' || (schema.min && !value.trim()) || (schema.pattern && !schema.pattern.test(value))) fail('Expected nonempty text or a valid identifier.');
      else {
        if (schema.maxWords && value.trim().split(/\s+/u).length > schema.maxWords) error(errors, path, 'header_word_budget', 'Authored header exceeds its product/UI word budget.', 'Author shorter header copy before review or budget consumption; do not truncate source text.');
        if (schema.maxCharacters && [...value].length > schema.maxCharacters) error(errors, path, 'header_character_budget', 'Authored header exceeds its product/UI character budget.', 'Author shorter header copy before review or budget consumption; preserve the full specification separately.');
      }
      break;
    case 'boolean': if (typeof value !== 'boolean') fail('Expected a boolean.'); break;
    case 'enum': if (!schema.values.includes(value)) fail(`Expected one of: ${schema.values.join(', ')}.`); break;
    case 'url': {
      try {
        const parsed = new URL(value);
        // Reject query strings/fragments: signed URLs and tokens must be removed before handoff.
        if (typeof value !== 'string' || !['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error();
      } catch { fail('Expected an absolute HTTP(S) URL without credentials, query, or fragment.'); }
      break;
    }
    case 'date':
      if (typeof value !== 'string' || !schema.pattern.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 19) !== value.slice(0, 19)) fail('Expected a valid UTC ISO observation time (up to millisecond precision).');
      break;
    case 'array':
      if (!Array.isArray(value) || value.length < schema.min) fail(`Expected an array with at least ${schema.min} items.`);
      else value.forEach((item, i) => shape(item, schema.items, `${path}[${i}]`, errors));
      break;
    case 'object':
      if (!value || typeof value !== 'object' || Array.isArray(value)) { fail('Expected an object.'); break; }
      for (const key of Object.keys(value)) if (!Object.hasOwn(schema.fields, key)) error(errors, path, 'unknown_field', 'Unexpected field.', 'Remove fields not in the contract.');
      for (const [key, field] of Object.entries(schema.fields)) shape(value[key], field, `${path}.${key}`, errors);
      break;
    case 'json':
      if (!finiteJson(value)) fail('Expected finite, sanitized JSON content.');
      break;
  }
}

function scan(value, path, errors) {
  if (typeof value === 'string' && /(?:\bBearer\s+[A-Za-z0-9._~-]+|\bsk-(?:ant-)?[A-Za-z0-9_-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/i.test(value)) {
    error(errors, path, 'sensitive_content', 'Potential credential detected.', 'Remove credentials before handoff. Do not hide them in HTML.');
  }
  if (Array.isArray(value)) value.forEach((item, i) => scan(item, `${path}[${i}]`, errors));
  else if (value && typeof value === 'object') for (const [index, [key, item]] of Object.entries(Object.entries(value))) {
    if (/^(?:password|access_token|refresh_token|api_key|authorization|client_secret|cookie)$/i.test(key)) error(errors, path, 'sensitive_field', 'Credential field detected.', 'Remove credential fields entirely.');
    // Arbitrary JSON keys can themselves be secrets; never echo them in paths.
    scan(key, `${path}[key:${index}]`, errors);
    scan(item, `${path}[field:${index}]`, errors);
  }
}

function references(doc, snapshot, errors, reviews = 'both', historicalCopy = false) {
  const sets = {};
  const collections = ['actors', 'sessions', 'evidence', 'artifacts', snapshot ? 'timeline' : 'occurrences'];
  if (snapshot) collections.push('claims');
  for (const name of collections) {
    sets[name] = new Set();
    doc[name].forEach((item, i) => {
      if (sets[name].has(item.id)) error(errors, `$.${name}[${i}].id`, 'duplicate_id', 'Identifier is repeated.', 'Use unique IDs within each collection.');
      sets[name].add(item.id);
    });
  }
  const ref = (value, collection, path) => {
    if (!sets[collection].has(value)) error(errors, path, 'missing_reference', 'Referenced record is absent.', 'Include the referenced record or correct the reference.');
  };
  const list = (values, collection, path) => values.forEach((value, i) => ref(value, collection, `${path}[${i}]`));
  list(doc.run.source_refs, 'evidence', '$.run.source_refs');
  doc.actors.forEach((actor, i) => {
    if (actor.agent_version_id && !doc.run.agent_version_ids.includes(actor.agent_version_id)) error(errors, `$.actors[${i}].agent_version_id`, 'version', 'Actor version is not a run version.', 'Supply the exact run version.');
  });
  doc.sessions.forEach((session, i) => {
    const path = `$.sessions[${i}]`;
    ref(session.agent_actor_id, 'actors', `${path}.agent_actor_id`);
    const agent = doc.actors.find(a => a.id === session.agent_actor_id);
    if (agent && (agent.kind !== 'agent' || agent.workspace_id !== session.workspace_id)) error(errors, path, 'session_actor', 'Session agent and workspace do not match.', 'Use the actual workspace agent identity from the session record.');
    if (session.parent_session_id) ref(session.parent_session_id, 'sessions', `${path}.parent_session_id`);
    list(session.source_refs, 'evidence', `${path}.source_refs`);
    if (session.level === 'child' && !session.parent_session_id) error(errors, path, 'session_level', 'Child session lacks a parent.', 'Supply its parent, or report the level as unknown with a gap.');
    if (session.level === 'top_level' && session.parent_session_id) error(errors, path, 'session_level', 'Top-level session has a parent.', 'Correct the level from the source record.');
    const seen = new Set([session.id]);
    let ancestor = session.parent_session_id;
    while (ancestor) {
      if (seen.has(ancestor)) { error(errors, path, 'session_cycle', 'Session ancestry contains a cycle.', 'Correct parent references from session records.'); break; }
      seen.add(ancestor);
      ancestor = doc.sessions.find(s => s.id === ancestor)?.parent_session_id;
    }
  });
  const events = snapshot ? doc.timeline : doc.occurrences;
  const eventName = snapshot ? 'timeline' : 'occurrences';
  events.forEach((event, i) => {
    const path = `$.${eventName}[${i}]`;
    ref(event.actor_id, 'actors', `${path}.actor_id`);
    const actor = doc.actors.find(a => a.id === event.actor_id);
    if (event.kind === 'agent_world_action' && actor && (actor.kind !== 'agent' || !actor.workspace_id)) error(errors, path, 'actor_boundary', 'Workspace-agent action lacks a workspace agent.', 'Correct the actor or classify the occurrence as external/supporting activity.');
    if (event.session_id) ref(event.session_id, 'sessions', `${path}.session_id`);
    list(event.evidence_refs, 'evidence', `${path}.evidence_refs`);
    list(event.artifact_refs, 'artifacts', `${path}.artifact_refs`);
    if (snapshot) list(event.claim_refs, 'claims', `${path}.claim_refs`);
    if (snapshot && event.suggested_feedback) {
      const suggestion = event.suggested_feedback;
      list(suggestion.evidence_refs, 'evidence', `${path}.suggested_feedback.evidence_refs`);
      list(suggestion.claim_refs, 'claims', `${path}.suggested_feedback.claim_refs`);
      if (suggestion.text.length > 10000) error(errors, `${path}.suggested_feedback.text`, 'feedback_length', 'Suggested feedback exceeds the cart limit.', 'Keep the reviewed suggestion within 10,000 characters.');
      if (!doc.presentation.allowed_actions.some(action => action.id === suggestion.action_id && action.kind === 'flag_issue')) error(errors, `${path}.suggested_feedback.action_id`, 'feedback_action', 'Suggested feedback requires an allowed issue intent.', 'Use a supplied flag_issue action, or omit the suggestion.');
      if (!['failed', 'partial'].includes(event.outcome)) error(errors, `${path}.suggested_feedback`, 'feedback_concern', 'A suggested fix requires a recorded failed or partial outcome.', 'Do not invent fixes for a successful or merely unverified event.');
    }
    if (snapshot && ['session_started', 'session_terminated'].includes(event.kind)) {
      const session = doc.sessions.find(s => s.id === event.session_id);
      if (!session || session.level !== 'top_level') error(errors, path, 'timeline_selection', 'Only known top-level lifecycle belongs in the timeline.', 'Move child or unknown lifecycle into supporting detail.');
      else if (session.agent_actor_id !== event.actor_id) error(errors, path, 'session_actor', 'Lifecycle actor differs from the session agent.', 'Use the session’s actual agent actor.');
    }
    if (['agent_world_action', 'external_world_action'].includes(event.kind) && !event.world_effect) error(errors, path, 'world_effect', 'World action lacks its system boundary and effect.', 'Describe an attempted or observed effect, preserving its outcome.');
    if (snapshot && event.kind === 'external_world_action' && !event.workflow_relevance) error(errors, path, 'relevance', 'External action lacks goal relevance.', 'Supply supported relevance or omit it from the timeline.');
    if (event.workflow_relevance) list(event.workflow_relevance.evidence_refs, 'evidence', `${path}.workflow_relevance.evidence_refs`);
    event.relationships.forEach((relation, j) => {
      ref(relation.other_occurrence_id, eventName, `${path}.relationships[${j}].other_occurrence_id`);
      list(relation.evidence_refs, 'evidence', `${path}.relationships[${j}].evidence_refs`);
    });
    if (event.time) {
      const t = event.time;
      if ((!t.at && !t.earliest && !t.latest) || (t.at && (t.earliest || t.latest)) || (t.earliest && t.latest && Date.parse(t.earliest) > Date.parse(t.latest))) error(errors, `${path}.time`, 'time_bounds', 'Time bounds are inconsistent.', 'Use an exact time, valid bounds, or omit time to show unknown.');
    }
  });
  doc.artifacts.forEach((a, i) => list(a.evidence_refs, 'evidence', `$.artifacts[${i}].evidence_refs`));
  const allRefs = new Set(Object.values(sets).flatMap(s => [...s]));
  // In 1.3 a preserved coverage gap may concern an occurrence deliberately
  // omitted from the timeline. This extends coverage targets only, never event
  // relationships or historical snapshot validation.
  if (snapshot && ['1.3', '1.4', '1.5', '1.6', '1.7', '1.8'].includes(doc.schema_version)) {
    const omitted = new Set();
    doc.omitted_occurrences.forEach((item, i) => {
      const path = `$.omitted_occurrences[${i}].id`;
      if (omitted.has(item.id)) error(errors, path, 'duplicate_id', 'Omitted occurrence is repeated.', 'Provide exactly one omission reason per occurrence.');
      if (sets.timeline.has(item.id)) error(errors, path, 'selection_conflict', 'Occurrence is both selected and omitted.', 'Choose either selection or omission for this occurrence.');
      omitted.add(item.id);
      allRefs.add(item.id);
    });
  }
  const window = doc.coverage.observation_window;
  if (window && Date.parse(window.from) > Date.parse(window.through)) error(errors, '$.coverage.observation_window', 'time_bounds', 'Observation window ends before it starts.', 'Correct the window or omit it and record a coverage gap.');
  doc.coverage.gaps.forEach((g, i) => g.affected_refs.forEach((r, j) => {
    if (!allRefs.has(r)) error(errors, `$.coverage.gaps[${i}].affected_refs[${j}]`, 'missing_reference', 'Gap target is absent.', 'Use a known reference or an empty list for a coverage-wide gap.');
  }));
  if (doc.sessions.some(s => s.level === 'unknown') && !doc.coverage.gaps.length) error(errors, '$.coverage.gaps', 'coverage', 'Unknown session level needs a coverage gap.', 'Describe the uncertainty and its impact.');
  if (!snapshot) return;
  if (['1.7', '1.8'].includes(doc.schema_version)) list(doc.header_copy.claim_refs, 'claims', '$.header_copy.claim_refs');
  if (doc.schema_version === '1.8') list(doc.header_copy.description_claim_refs, 'claims', '$.header_copy.description_claim_refs');
  doc.claims.forEach((c, i) => list(c.evidence_refs, 'evidence', `$.claims[${i}].evidence_refs`));
  if (doc.editor_id === doc.parent_agent_id) error(errors, '$.editor_id', 'independence', 'Parent and author must be distinct.', 'Delegate authorship to a distinct agent.');
  if (reviews !== 'none') {
    const review = doc.review;
    if ([doc.editor_id, doc.parent_agent_id].includes(review.checker_id) || doc.editor_id === doc.parent_agent_id) error(errors, '$.review.checker_id', 'independence', 'Parent, editor, and checker must be distinct.', 'Delegate verification to a distinct authorized read-only agent.');
    if (review.factual_digest !== factualDigest(doc)) error(errors, '$.review.factual_digest', 'stale_review', 'Review does not match factual content.', 'Recheck this factual revision; do not just replace its digest.');
    if (['1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8'].includes(doc.schema_version) && reviews === 'both') errors.push(...checkCopyReview(doc, doc.copy_review, { legacy: doc.schema_version === '1.2', historical: historicalCopy,
      requirePass: !(['1.6', '1.7', '1.8'].includes(doc.schema_version) && doc.copy_review_iterations === 2) }).errors);
    if (doc.schema_version === '1.0' && review.data_origin !== doc.coverage.data_origin) error(errors, '$.review.data_origin', 'origin', 'Review origin differs from the snapshot.', 'Label observed, mixed, or synthetic evidence honestly.');
    const checks = new Set(review.checks.map(c => c.id));
    if (checks.size !== review.checks.length) error(errors, '$.review.checks', 'duplicate_id', 'Check IDs are repeated.', 'Use unique check IDs.');
    review.checks.forEach((c, i) => {
      if (c.checker_id !== review.checker_id) error(errors, `$.review.checks[${i}]`, 'independence', 'Read was not made by this checker.', 'Record the checker’s own authorized source call.');
      if (doc.schema_version === '1.0' && doc.coverage.data_origin !== 'mixed' && c.data_origin !== doc.coverage.data_origin) error(errors, `$.review.checks[${i}].data_origin`, 'origin', 'Read origin conflicts with the declared origin.', 'Correct origin and preserve synthetic limitations.');
    });
    const checkedClaims = new Set();
    review.findings.forEach((f, i) => {
      const path = `$.review.findings[${i}]`;
      ref(f.claim_id, 'claims', `${path}.claim_id`);
      if (checkedClaims.has(f.claim_id)) error(errors, path, 'duplicate_finding', 'A claim has multiple final findings.', 'Reconcile readings into one finding that preserves conflicts.');
      checkedClaims.add(f.claim_id);
      f.check_refs.forEach((r, j) => { if (!checks.has(r)) error(errors, `${path}.check_refs[${j}]`, 'missing_reference', 'Checker read is absent.', 'Record the separate source read, including failed reads.'); });
      if (f.finding !== 'confirmed' && !f.gaps.length) error(errors, `${path}.gaps`, 'verification_gap', 'Nonconfirmation requires a recorded limitation.', 'Explain the conflict, unavailable history, or uncertainty in technical evidence.');
      if (f.finding === 'confirmed' && f.check_refs.some(r => review.checks.find(c => c.id === r)?.result === 'unavailable')) error(errors, path, 'verification_gap', 'Unavailable source cannot confirm a claim.', 'Qualify the finding and expose the gap.');
    });
    doc.claims.forEach((c, i) => { if (!checkedClaims.has(c.id)) error(errors, `$.claims[${i}]`, 'unchecked_claim', 'Claim lacks a final finding.', 'Ask the distinct checker to review every claim.'); });
  }
  const artifactIds = new Set();
  if (['1.4', '1.5', '1.6', '1.7', '1.8'].includes(doc.schema_version)) {
    const attached = new Set(doc.timeline.flatMap(event => event.artifact_refs));
    doc.artifacts.forEach((artifact, i) => {
      if (!attached.has(artifact.id)) error(errors, `$.artifacts[${i}]`, 'detached_artifact', 'Render artifacts must belong to a timeline event.', 'Keep source material in the collection bundle/evidence; only include event-attached business artifacts.');
    });
  }
  doc.artifact_claims.forEach((a, i) => {
    ref(a.artifact_id, 'artifacts', `$.artifact_claims[${i}].artifact_id`);
    list(a.claim_refs, 'claims', `$.artifact_claims[${i}].claim_refs`);
    if (artifactIds.has(a.artifact_id)) error(errors, `$.artifact_claims[${i}]`, 'duplicate_id', 'Artifact claim mapping is repeated.', 'Use one mapping per artifact.');
    artifactIds.add(a.artifact_id);
  });
  doc.artifacts.forEach((a, i) => { if (!artifactIds.has(a.id)) error(errors, `$.artifacts[${i}]`, 'unchecked_artifact', 'Artifact has no claim mapping.', 'Include the artifact in the checker’s review.'); });
  const actions = doc.presentation.allowed_actions.map(a => a.id);
  if (new Set(actions).size !== actions.length) error(errors, '$.presentation.allowed_actions', 'duplicate_id', 'Action IDs repeat.', 'Use unique intent IDs.');
}

function validateContract(doc, contract, snapshot, reviews = 'both', historicalCopy = false) {
  const errors = [];
  try {
    shape(doc, contract, '$', errors);
    scan(doc, '$', errors);
    if (!errors.length) references(doc, snapshot, errors, reviews, historicalCopy);
  } catch {
    error(errors, '$', 'invalid_document', 'Document cannot be validated.', 'Supply finite, acyclic JSON within the documented limits.');
  }
  return { ok: errors.length === 0, errors };
}

export function validate(doc, kind = 'snapshot') {
  return validateContract(doc, kind === 'bundle' ? bundleContract : doc?.schema_version === '1.7' ? legacyHeaderSnapshotContract : snapshotContract, kind !== 'bundle');
}

// Preflight only: these never substitute for the final dual-review validation.
export function validateCandidate(doc, { legacy = false } = {}) {
  const contract = legacy && doc?.schema_version === '1.6'
    ? object(Object.fromEntries(Object.entries(legacyBoundedSnapshotContract.fields).filter(([key]) => !['review', 'copy_review', 'copy_review_iterations'].includes(key))))
    : doc?.schema_version === '1.7' ? object(Object.fromEntries(Object.entries(legacyHeaderSnapshotContract.fields).filter(([key]) => !['review', 'copy_review', 'copy_review_iterations'].includes(key)))) : candidateContract;
  return validateContract(doc, contract, true, 'none');
}
export function validateFactualReview(candidate, review) {
  const fields = candidate.schema_version === '1.7' ? Object.fromEntries(Object.entries(legacyHeaderSnapshotContract.fields).filter(([key]) => !['review', 'copy_review', 'copy_review_iterations'].includes(key))) : candidateContract.fields;
  return validateContract({ ...candidate, review }, object({ ...fields, review: factualReviewContract }), true, 'fact');
}

export function prepareRenderSnapshot(doc) {
  const legacy = ['1.0', '1.1'].includes(doc?.schema_version);
  const historicalCopy = doc?.schema_version === '1.3' && doc.copy_review?.rule_versions?.sdlc === 'scenario-run-v1';
  const contract = doc?.schema_version === '1.0' ? legacySnapshotContract : doc?.schema_version === '1.1' ? factualSnapshotContract : doc?.schema_version === '1.2' ? legacyDualSnapshotContract : historicalCopy ? legacyCompactSnapshotContract : doc?.schema_version === '1.4' ? legacyAttachedSnapshotContract : doc?.schema_version === '1.5' ? legacyFeedbackSnapshotContract : doc?.schema_version === '1.6' ? legacyBoundedSnapshotContract : doc?.schema_version === '1.7' ? legacyHeaderSnapshotContract : snapshotContract;
  const checked = validateContract(doc, contract, true, 'both', historicalCopy);
  if (!checked.ok) return checked;
  if (!legacy) return { ok: true, snapshot: doc, review_mode: ['1.2', '1.4', '1.5', '1.6'].includes(doc.schema_version) || historicalCopy ? 'legacy-dual-review' : 'dual-review' };
  const snapshot = structuredClone(doc);
  snapshot.schema_version = '1.1';
  delete snapshot.coverage.data_origin;
  snapshot.coverage.gaps.forEach(gap => { delete gap.impact; });
  delete snapshot.review.data_origin;
  snapshot.review.checks.forEach(check => { delete check.data_origin; });
  // Internal display projection only. Its review still binds the ORIGINAL 1.0
  // source, not a newly checked 1.1 document. Do not save it as a reviewed input.
  return { ok: true, snapshot, review_mode: 'legacy-factual-only' };
}
