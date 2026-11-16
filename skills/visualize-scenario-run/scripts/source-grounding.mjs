// Private deterministic author preflight. Literal presence is NOT factual,
// causal or semantic proof. No I/O, dispatch, budget access or candidate edits.
import { createHash } from 'node:crypto';
import { copyFields, factualDigest, validate, validateCandidate } from './contracts.mjs';

export const SOURCE_GROUNDING_VERSION = '1.0';
export const SOURCE_GROUNDING_LIMITS = Object.freeze({
  bytes: 8 * 1024 * 1024, nodes: 150000, depth: 64, string: 1024 * 1024,
  fields: 2048, fieldCharacters: 100000, targets: 4096, sourceUnits: 30000,
  matchCharacters: 64 * 1024 * 1024, anchorsPerTarget: 8, feedbackItems: 32,
});
const sha = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const digest = value => sha(canonical(value));
const unique = values => [...new Set(values)].sort();
const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const issue = (path, code, message) => ({ path, code, message,
  repair: 'Use the current sanitized candidate and exact original source bundle. Resolve wording privately; do not alter source records or review metadata.' });
const rejected = (code, message, path = '$') => ({ ok: false, errors: [issue(path, code, message)] });

// Bound and reject non-JSON before recursive production validators. No rejected
// values, property names, prose, credentials or filesystem paths enter errors.
function bounded(value) {
  const active = new Set();
  let nodes = 0, bytes = 0;
  function visit(item, depth) {
    if (++nodes > SOURCE_GROUNDING_LIMITS.nodes || depth > SOURCE_GROUNDING_LIMITS.depth) throw Error('bounds');
    if (item === null || typeof item === 'boolean') { bytes += 5; return; }
    if (typeof item === 'number') { if (!Number.isFinite(item)) throw Error('json'); bytes += 32; return; }
    if (typeof item === 'string') {
      if (item.length > SOURCE_GROUNDING_LIMITS.string) throw Error('bounds');
      bytes += Buffer.byteLength(JSON.stringify(item));
    } else {
      if (!item || typeof item !== 'object' || (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype) || active.has(item)) throw Error('json');
      const keys = Object.keys(item);
      if (Array.isArray(item) ? keys.length !== item.length || keys.some((key, i) => key !== String(i))
        || Reflect.ownKeys(item).length !== keys.length + 1 : Reflect.ownKeys(item).length !== keys.length) throw Error('json');
      active.add(item); bytes += 2;
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(item, key);
        if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw Error('json');
        bytes += Buffer.byteLength(JSON.stringify(key)) + 2;
        visit(descriptor.value, depth + 1);
        if (bytes > SOURCE_GROUNDING_LIMITS.bytes) throw Error('bounds');
      }
      active.delete(item);
    }
    if (bytes > SOURCE_GROUNDING_LIMITS.bytes) throw Error('bounds');
  }
  try { visit(value, 0); return { ok: true }; }
  catch { return rejected('grounding_input_bounds', 'Preflight requires bounded, finite, acyclic plain JSON without accessors.'); }
}

function inputs(candidate, sourceBundle) {
  for (const input of [candidate, sourceBundle]) { const checked = bounded(input); if (!checked.ok) return checked; }
  if (!['1.9', '1.10'].includes(candidate?.schema_version)) return rejected('grounding_version', 'Preflight requires a current source-bound candidate.');
  const candidateCheck = validateCandidate(candidate);
  if (!candidateCheck.ok) return candidateCheck;
  const sourceCheck = validate(sourceBundle, 'bundle');
  if (!sourceCheck.ok) return sourceCheck;
  if (canonical(candidate.source_bundle) !== canonical(sourceBundle)) return rejected('grounding_source_mismatch', 'Embedded source identity or content differs from the independently supplied original bundle.', '$.source_bundle');
  return { ok: true };
}

function fieldContext(doc, field) {
  const path = field.field_path;
  let role = 'authored_context', claims = [], refs = [], direct = [];
  const fromClaims = ids => doc.claims.filter(claim => ids.includes(claim.id)).flatMap(claim => claim.evidence_refs);
  const eventIndex = /^\$\.timeline\[(\d+)\]/.exec(path)?.[1];
  const claimIndex = /^\$\.claims\[(\d+)\]/.exec(path)?.[1];
  const artifactIndex = /^\$\.artifacts\[(\d+)\]/.exec(path)?.[1];
  const omissionIndex = /^\$\.omitted_occurrences\[(\d+)\]/.exec(path)?.[1];
  if (path.startsWith('$.header_copy.')) {
    role = 'human_header';
    claims = path.endsWith('.scenario_description') ? doc.header_copy.description_claim_refs : doc.header_copy.claim_refs;
    direct = ['$.source_bundle.workflow', '$.source_bundle.scenario'];
  } else if (claimIndex !== undefined) {
    role = 'claim'; claims = [doc.claims[claimIndex].id];
  } else if (eventIndex !== undefined) {
    const event = doc.timeline[eventIndex];
    const local = path.includes('.concern.') ? event.concern : path.includes('.suggested_feedback.') ? event.suggested_feedback
      : path.includes('.workflow_relevance.') ? event.workflow_relevance : event;
    role = path.endsWith('.suggested_feedback.text') ? 'technical_fix'
      : path.endsWith('.suggested_feedback.explanation') ? 'human_fix'
        : path.includes('.concern.') ? 'concern' : path.endsWith('.supporting_detail') ? 'technical_detail' : 'event';
    claims = local.claim_refs ?? event.claim_refs;
    refs = local.evidence_refs ?? event.evidence_refs;
    // Suggestions, concerns and relevance must not borrow other event sources.
    if (local === event) {
      const index = doc.source_bundle.occurrences.findIndex(item => item.id === event.id);
      if (index >= 0) direct = [`$.source_bundle.occurrences[${index}]`];
    }
  } else if (artifactIndex !== undefined) {
    role = 'artifact_title';
    const artifact = doc.artifacts[artifactIndex];
    claims = doc.artifact_claims.find(item => item.artifact_id === artifact.id)?.claim_refs ?? [];
    refs = artifact.evidence_refs;
  } else if (omissionIndex !== undefined) {
    role = 'omission';
    const index = doc.source_bundle.occurrences.findIndex(item => item.id === doc.omitted_occurrences[omissionIndex].id);
    if (index >= 0) { direct = [`$.source_bundle.occurrences[${index}]`]; refs = doc.source_bundle.occurrences[index].evidence_refs; }
  } else if (path === '$.summary') {
    role = 'summary'; claims = doc.claims.map(claim => claim.id);
  } else if (path.startsWith('$.run.')) {
    role = 'run_result'; refs = doc.run.source_refs; direct = ['$.source_bundle.run'];
  } else {
    // Immutable specification/coverage/action fields remain inventoried, but use
    // only their actual source counterpart, not all prose as universal support.
    direct = [path.replace('$', '$.source_bundle')];
  }
  return { role, claim_refs: unique(claims ?? []), evidence_refs: unique([...refs, ...fromClaims(claims ?? [])]), direct_source_paths: direct };
}

const wordPattern = /(?:--)?[A-Za-z_$][A-Za-z0-9_$.-]*|\d+(?:\.\d+)*(?:[eE][+-]?\d+)?/g;
const wordsIn = text => [...text.matchAll(wordPattern)].map(match => match[0].replace(/[.-]+$/, ''));
const technicalContext = /\b(?:parameter|argument|config(?:uration)?|option|setting|flag|function|method|API|code|implementation|timeout|retry|retries|depth|limit|batch|buffer|cache|payload|schema|version|port|endpoint|pagination|concurren(?:t|cy)|bytes?|milliseconds?)\b/i;
const modifiers = text => unique([
  ...(/\b(?:not|never|no|without|cannot|didn't|wasn't|isn't|doesn't|don't)\b/i.test(text) ? ['negated'] : []),
  ...(/\b(?:may|might|could|possibly|perhaps|probably|appears?|seems?|unconfirmed|unknown|if|unless|suggest(?:ed)?|propos(?:ed|e))\b/i.test(text) ? ['qualified'] : []),
]);
function vicinity(text, start, end) {
  // Keep local sentence scope. Do not remove, normalize or rewrite qualifiers.
  const before = text.slice(Math.max(0, start - 120), start);
  const after = text.slice(end, end + 120);
  return before.slice(Math.max(before.lastIndexOf('\n'), before.lastIndexOf('. ')) + 1) + text.slice(start, end)
    + after.split(/\n|\. /, 1)[0];
}
function literal(value) {
  if (/^"(?:[^"\\]|\\.)*"$/.test(value)) { try { return { type: 'string', value: JSON.parse(value) }; } catch { /* literal fallback */ } }
  if (/^'(?:[^'\\]|\\.)*'$/.test(value)) return { type: 'string', value: value.slice(1, -1) };
  if (/^(?:true|false|null)$/.test(value)) return { type: 'scalar', value };
  if (/^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) return { type: 'scalar', value };
  return { type: 'identifier', value };
}

function targets(text, role) {
  const found = [];
  const dates = [...text.matchAll(/\b\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d(?:\.\d+)?)?Z?)?\b|\b\d{1,2}:\d\d(?::\d\d(?:\.\d+)?)?Z?\b/g)].map(match => [match.index, match.index + match[0].length]);
  const add = (kind, start, end, value, name) => {
    if (dates.some(([from, through]) => start < through && end > from)) return;
    if (found.some(item => start < item.end && end > item.start)) return;
    found.push({ kind, start, end, value, ...(name ? { name } : {}), contextual_modifiers: modifiers(vicinity(text, start, end)) });
  };
  // General assignment syntax, not a historical-name allow/deny list. Preserve
  // the pair: finding a key and an unrelated number is never literal support.
  const assignments = /(?<![\w$.-])(?:["']?)((?:--)?[A-Za-z_$][A-Za-z0-9_$.-]*)(?:["']?)\s*[:=]\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true\b|false\b|null\b|[A-Za-z_$][A-Za-z0-9_$.-]*)/g;
  for (const match of text.matchAll(assignments)) {
    if (/[\w$.-]/.test(text[match.index - 1] ?? '')) continue;
    const explicit = /[:=]/.test(match[0]) && (literal(match[2]).type !== 'identifier' || /[_.$-]|[a-z][A-Z]/.test(match[1]) || technicalContext.test(vicinity(text, match.index, match.index + match[0].length)));
    if (explicit) add('parameter', match.index, match.index + match[0].length, match[2], match[1]);
  }
  for (const match of text.matchAll(/`([^`\n]+)`/g)) {
    const start = match.index + 1, end = match.index + match[0].length - 1;
    if (found.some(item => start < item.end && end > item.start)) {
      // Keep function names/other operands when a parameter inside the same
      // snippet already owns its span; do not blanket-exempt the rest of code.
      for (const word of match[1].matchAll(wordPattern)) add('code_literal', start + word.index, start + word.index + word[0].length, word[0]);
    } else add('code_literal', start, end, match[1]);
  }
  for (const match of text.matchAll(/(?:--[A-Za-z][A-Za-z0-9-]*|\b[A-Za-z_$][A-Za-z0-9_$]*(?:_[A-Za-z0-9_$]+)+\b|\b[A-Za-z_$][A-Za-z0-9_$]*[a-z][A-Z][A-Za-z0-9_$]*\b|\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b|\b[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+\b)/g)) {
    if (match[0].includes('.') && !technicalContext.test(vicinity(text, match.index, match.index + match[0].length)) && role !== 'technical_fix') continue;
    add('identifier', match.index, match.index + match[0].length, match[0]);
  }
  for (const match of text.matchAll(/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:-[A-Za-z]+|\s?(?:(?:ms|s|KiB|MiB|GiB|KB|MB|GB|bytes)\b|%))?/g)) {
    const local = vicinity(text, match.index, match.index + match[0].length);
    if (role === 'technical_fix' || technicalContext.test(local) || /(?:ms|KiB|MiB|GiB|KB|MB|GB|bytes|%)$/.test(match[0])) add('number', match.index, match.index + match[0].length, match[0]);
  }
  return found.sort((a, b) => a.start - b.start);
}

function sourceIndex(doc) {
  const units = [], words = new Map();
  const put = (text, path, evidenceRefs, completeness, part = 'value', member = null) => {
    if (units.length >= SOURCE_GROUNDING_LIMITS.sourceUnits) throw Error('bounds');
    const unit = { text, path, evidence_refs: evidenceRefs, completeness, part, member };
    units.push(unit);
    for (const word of unique(wordsIn(text))) {
      if (!words.has(word)) words.set(word, new Set());
      words.get(word).add(unit);
    }
    return unit;
  };
  const walk = (item, path, refs, completeness, named = false) => {
    if (item === null || ['string', 'number', 'boolean'].includes(typeof item)) {
      const unit = put(typeof item === 'string' ? item : JSON.stringify(item), path, refs, completeness);
      unit.value_type = item === null ? 'null' : typeof item;
      return unit;
    }
    if (Array.isArray(item)) { item.forEach((value, i) => walk(value, `${path}[${i}]`, refs, completeness, named)); return; }
    Object.entries(item).forEach(([key, value], i) => {
      // Arbitrary payload keys never become report paths. Ordinal field paths
      // resolve against insertion order in the exact digest-bound source JSON.
      const child = named ? `${path}.${key}` : `${path}[field:${i}]`;
      const member = put(key, child, refs, completeness, 'key');
      const scalar = walk(value, child, refs, completeness, named);
      if (scalar) { member.member = scalar; scalar.member = member; }
    });
  };
  const source = doc.source_bundle;
  source.evidence.forEach((record, i) => walk(record.content, `$.source_bundle.evidence[${i}].content`, [record.id], record.completeness));
  (doc.artifact_version_source?.records ?? []).forEach((record, i) => walk(record.content, `$.artifact_version_source.records[${i}].content`, [record.id], record.completeness));
  source.artifacts.forEach((artifact, i) => {
    for (const key of ['title', 'content', 'before', 'after', 'structured_content']) if (artifact[key] !== undefined) walk(artifact[key], `$.source_bundle.artifacts[${i}].${key}`, artifact.evidence_refs, artifact.completeness);
  });
  for (const key of ['workflow', 'scenario', 'run', 'coverage', 'presentation']) walk(source[key], `$.source_bundle.${key}`, [], 'complete', true);
  source.occurrences.forEach((event, i) => {
    for (const key of ['description', 'world_effect', 'workflow_relevance']) if (event[key] !== undefined) walk(event[key], `$.source_bundle.occurrences[${i}].${key}`,
      key === 'workflow_relevance' ? event.workflow_relevance.evidence_refs : event.evidence_refs, 'complete', true);
  });
  return { units, words };
}

const boundary = (text, start, end) => !/[\w$-]/.test(text[start - 1] ?? '') && !/[\w$-]/.test(text[end] ?? '')
  && !(text[start - 1] === '.' && /[\w$]/.test(text[start - 2] ?? ''))
  && !(text[end] === '.' && /[\w$]/.test(text[end + 1] ?? ''));
function literalMatches(unit, value) {
  const matches = [];
  if (!value) return matches;
  let start = unit.text.indexOf(value);
  while (start >= 0 && matches.length < SOURCE_GROUNDING_LIMITS.anchorsPerTarget) {
    if (boundary(unit.text, start, start + value.length)) matches.push([start, start + value.length]);
    start = unit.text.indexOf(value, start + Math.max(1, value.length));
  }
  return matches;
}
function checkTarget(target, context, index, work) {
  const anchor = (unit, start, end, match) => ({ source_path: unit.path, part: unit.part, start, end,
    evidence_refs: [...unit.evidence_refs], completeness: unit.completeness, match });
  const cited = unit => unit.evidence_refs.some(ref => context.evidence_refs.includes(ref))
    || context.direct_source_paths.some(path => unit.path === path || unit.path.startsWith(`${path}.`) || unit.path.startsWith(`${path}[`));
  const exact = [], components = [], references = [];
  let limited = false, conflictingAssignment = false;
  const targetValue = literal(target.value);
  const lookup = target.name ?? wordsIn(targetValue.value)[0];
  const candidates = lookup ? [...(index.words.get(lookup) ?? [])] : index.units;
  const append = (unit, start, end, match, component = false) => {
    const destination = !cited(unit) ? references : component ? components : exact;
    if (destination.length >= SOURCE_GROUNDING_LIMITS.anchorsPerTarget) return;
    destination.push(anchor(unit, start, end, match));
    if (destination === exact && (unit.completeness !== 'complete' || modifiers(vicinity(unit.text, start, end)).length)) limited = true;
  };
  for (const unit of candidates) {
    work.remaining -= unit.text.length;
    if (work.remaining < 0) throw Error('bounds');
    if (target.kind !== 'parameter') {
      for (const [start, end] of literalMatches(unit, targetValue.value)) append(unit, start, end, 'literal');
      continue;
    }
    if (unit.part === 'key' && unit.text === target.name && unit.member) {
      const member = unit.member;
      const typeMatches = targetValue.type === 'string' ? member.value_type === 'string'
        : targetValue.type === 'scalar' ? member.value_type !== 'string' : member.value_type === 'string';
      if (typeMatches && member.text === targetValue.value) {
        append(unit, 0, unit.text.length, 'parameter_key');
        append(member, 0, member.text.length, 'parameter_value');
      } else {
        if (cited(unit)) conflictingAssignment = true;
        append(unit, 0, unit.text.length, 'parameter_key_only', true);
      }
      continue;
    }
    // Quoting and spacing around a source assignment may differ, but both
    // components must occur in the same actual source assignment/member.
    const valuePattern = targetValue.type === 'string' ? `["']${escaped(targetValue.value)}["']` : escaped(target.value);
    const pattern = new RegExp(`(?:["']?)${escaped(target.name)}(?:["']?)\\s*[:=]\\s*${valuePattern}`, 'g');
    let matched = false;
    for (const match of unit.text.matchAll(pattern)) {
      if (!boundary(unit.text, match.index, match.index + match[0].length)) continue;
      matched = true; append(unit, match.index, match.index + match[0].length, 'parameter_assignment');
    }
    const otherAssignments = new RegExp(`(?:["']?)${escaped(target.name)}(?:["']?)\\s*[:=]\\s*("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|[+-]?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|true\\b|false\\b|null\\b|[A-Za-z_$][A-Za-z0-9_$.-]*)`, 'g');
    for (const match of unit.text.matchAll(otherAssignments)) {
      if (!boundary(unit.text, match.index, match.index + match[0].length)) continue;
      const other = literal(match[1]);
      if (other.type === targetValue.type && other.value === targetValue.value) continue;
      if (cited(unit)) conflictingAssignment = true;
      append(unit, match.index, match.index + match[0].length, 'different_parameter_assignment', true);
    }
    if (!matched) for (const [start, end] of literalMatches(unit, target.name)) append(unit, start, end, 'parameter_key_only', true);
  }
  const ambiguous = limited || conflictingAssignment || target.contextual_modifiers.length > 0;
  const status = exact.length ? ambiguous ? 'ambiguous_support' : 'supported_literal'
    : components.length || references.length ? 'ambiguous_support' : 'missing_literal_support';
  const reason = exact.length ? ambiguous ? 'literal_present_context_requires_review' : 'exact_cited_literal_only'
    : components.length ? 'parameter_components_do_not_establish_assignment' : references.length ? 'only_uncited_references' : 'no_cited_literal';
  return { kind: target.kind, start: target.start, end: target.end, token_digest: sha(target.value),
    status, reason, contextual_modifiers: target.contextual_modifiers,
    anchors: exact, component_anchors: components, reference_anchors: references };
}

/** Returns {ok:true, report} even for unsupported details; ok is input validity,
 * not quality approval. sourceBundle MUST be the original collector-held JSON. */
export function createSourceGroundingReport(candidate, sourceBundle) {
  const checked = inputs(candidate, sourceBundle);
  if (!checked.ok) return checked;
  const fields = copyFields(candidate).filter(field => !field.protected_source);
  if (fields.length > SOURCE_GROUNDING_LIMITS.fields || fields.some(field => field.text.length > SOURCE_GROUNDING_LIMITS.fieldCharacters)) return rejected('grounding_inventory_bounds', 'Authored inventory exceeds deterministic preflight bounds.');
  try {
    const index = sourceIndex(candidate);
    const work = { remaining: SOURCE_GROUNDING_LIMITS.matchCharacters };
    let count = 0;
    const inventory = fields.map(field => {
      const context = fieldContext(candidate, field);
      const details = targets(field.text, context.role);
      count += details.length;
      if (count > SOURCE_GROUNDING_LIMITS.targets) throw Error('bounds');
      return { field_path: field.field_path, field_digest: field.field_digest, context,
        details: details.map(target => checkTarget(target, context, index, work)) };
    });
    const all = inventory.flatMap(field => field.details);
    const report = { report_version: SOURCE_GROUNDING_VERSION, purpose: 'private_author_preflight',
      semantic_status: 'not_assessed', candidate_digest: factualDigest(candidate), candidate_sha256: digest(candidate),
      source_digest: digest(sourceBundle), source_identity: { bundle_id: sourceBundle.bundle_id, run_id: sourceBundle.run.id,
        workspace_id: sourceBundle.run.workspace_id, scenario_id: sourceBundle.scenario.id },
      inventory_digest: digest(fields.map(({ field_path, field_digest }) => ({ field_path, field_digest }))),
      counts: { fields: inventory.length, details: all.length, supported_literal: all.filter(detail => detail.status === 'supported_literal').length,
        missing_literal_support: all.filter(detail => detail.status === 'missing_literal_support').length,
        ambiguous_support: all.filter(detail => detail.status === 'ambiguous_support').length }, inventory };
    if (!bounded(report).ok) throw Error('bounds');
    return { ok: true, report };
  } catch { return rejected('grounding_analysis_bounds', 'Source index or detail inventory exceeds deterministic preflight bounds.'); }
}

/** Closed executable report validation. Recompute against current source/content;
 * never restamp, accept a user-declared pass, or trust altered offsets/statuses. */
export function validateSourceGroundingReport(candidate, sourceBundle, report) {
  const boundedReport = bounded(report);
  if (!boundedReport.ok) return boundedReport;
  const current = createSourceGroundingReport(candidate, sourceBundle);
  if (!current.ok) return current;
  if (report?.report_version !== SOURCE_GROUNDING_VERSION) return rejected('grounding_report_version', 'Unsupported private grounding report version.');
  if (report.candidate_sha256 !== current.report.candidate_sha256 || report.candidate_digest !== current.report.candidate_digest || report.inventory_digest !== current.report.inventory_digest) return rejected('stale_grounding_report', 'Grounding report does not bind the exact current candidate and authored inventory.');
  if (report.source_digest !== current.report.source_digest) return rejected('grounding_source_mismatch', 'Grounding report does not bind the current original source.');
  if (canonical(report) !== canonical(current.report)) return rejected('grounding_report_mismatch', 'Grounding report has altered, missing or unexpected fields, details, references or source anchors.');
  return { ok: true, errors: [] };
}

/** Concise, private author-only locations; no raw prose/source values. Never add
 * this object to snapshots, UI, evidence, cart, copy packets or Claude prompts. */
export function sourceGroundingAuthorFeedback(candidate, sourceBundle, report, { maxItems = SOURCE_GROUNDING_LIMITS.feedbackItems } = {}) {
  if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > SOURCE_GROUNDING_LIMITS.feedbackItems) return rejected('grounding_feedback_bounds', 'Private feedback limit must be an integer from 1 through 32.');
  const checked = validateSourceGroundingReport(candidate, sourceBundle, report);
  if (!checked.ok) return checked;
  const findings = report.inventory.flatMap(field => field.details.filter(detail => detail.status !== 'supported_literal').map(detail => ({
    field_path: field.field_path, field_digest: field.field_digest, role: field.context.role,
    claim_refs: field.context.claim_refs, evidence_refs: field.context.evidence_refs,
    start: detail.start, end: detail.end, status: detail.status, reason: detail.reason,
  })));
  return { ok: true, feedback: { purpose: 'private_author_preflight', candidate_sha256: report.candidate_sha256,
    instruction: 'Inspect the indicated candidate spans and report anchors. Resolve unsupported implementation details without changing meaning, negation or qualifications. Source presence does not establish truth or causation. Do not auto-rewrite, invent sources or approval. Regenerate after author edits; retain independent bounded reviews.',
    total: findings.length, omitted: Math.max(0, findings.length - maxItems), items: findings.slice(0, maxItems) } };
}
