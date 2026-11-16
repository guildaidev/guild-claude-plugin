// Private, deterministic JSON transport only. No dispatch, source reads or writes.
import { createHash } from 'node:crypto';
import { copyFields, copyReviewContractFor, factualReviewContract, factualDigest,
  validateCandidate, validateCopyReview, validateFactualReview } from './contracts.mjs';
import { headerPolicyFor, headerContractFor, headerTextFieldsFor } from './header-copy.mjs';

export const REVIEW_CODEC_VERSION = '1.0';
export const REVIEW_CODEC_LIMITS = Object.freeze({ bytes: 64 * 1024 * 1024, nodes: 500000,
  depth: 100, references: 50000, workBytes: 32 * 1024 * 1024, workNodes: 500000 });
const sha = value => createHash('sha256').update(value).digest('hex');
const descriptor = value => JSON.parse(JSON.stringify(value, (_, item) => item instanceof RegExp ? item.source : item));
export class ReviewCodecError extends Error {
  constructor(code) { super(`review_codec:${code}`); this.name = 'ReviewCodecError'; this.code = code; }
  toJSON() { return { code: this.code, message: this.message }; }
}
const fail = code => { throw new ReviewCodecError(code); }; // Never echo private input.
const plain = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const keys = (value, required, optional = []) => {
  if (!plain(value) || required.some(key => !Object.hasOwn(value, key)) ||
    Object.keys(value).some(key => ![...required, ...optional].includes(key))) fail('keys');
};
const list = value => { if (!Array.isArray(value)) fail('array'); return value; };
const work = Symbol('operation work');
function spend(limits, bytes = 0, nodes = 0) {
  const used = limits[work]; used.bytes += bytes; used.nodes += nodes;
  if (used.bytes > limits.workBytes || used.nodes > limits.workNodes) fail('bounds');
}

// Measure JSON string escaping without allocating an escaped string. Counts both
// UTF-8 bytes and UTF-16 characters (the original dictionary threshold's unit).
function quotedSize(text, limits) {
  spend(limits, text.length);
  let bytes = 2, chars = 2;
  for (let index = 0; index < text.length; index++) {
    const unit = text.charCodeAt(index);
    if (unit === 34 || unit === 92 || unit === 8 || unit === 9 || unit === 10 || unit === 12 || unit === 13) { bytes += 2; chars += 2; }
    else if (unit < 32) { bytes += 6; chars += 6; }
    else if (unit >= 0xd800 && unit <= 0xdbff && index + 1 < text.length &&
      text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4; chars += 2; index++;
    } else if (unit >= 0xd800 && unit <= 0xdfff) { bytes += 6; chars += 6; }
    else { bytes += unit < 128 ? 1 : unit < 2048 ? 2 : 3; chars++; }
  }
  spend(limits, bytes - text.length);
  return { bytes, chars };
}

function quoted(text, limits) {
  const size = quotedSize(text, limits);
  spend(limits, size.bytes); // Reserve before JSON.stringify allocates anything.
  return { ...size, text: JSON.stringify(text) };
}

// Exactly the original sorted-key canonical digest, streamed into SHA-256. No
// full serialization of any ancestor is retained or built for canonical hashing.
function digest(value, limits) {
  const hash = createHash('sha256');
  const write = (text, bytes = Buffer.byteLength(text)) => { spend(limits, bytes); hash.update(text); };
  const visit = item => {
    spend(limits, 0, 1);
    if (typeof item === 'string') { const encoded = quoted(item, limits); write(encoded.text, encoded.bytes); }
    else if (Array.isArray(item)) {
      write('['); item.forEach((child, index) => { if (index) write(','); visit(child); }); write(']');
    } else if (plain(item)) {
      write('{'); Object.keys(item).sort().forEach((key, index) => {
        if (index) write(','); const encoded = quoted(key, limits); write(encoded.text, encoded.bytes); write(':'); visit(item[key]);
      }); write('}');
    } else write(JSON.stringify(item));
  };
  visit(value);
  return hash.digest('hex');
}

// Compare actual values, not serialized ancestors or hash equality. Dictionary
// equality is insertion-order-sensitive; binding equality is sorted-key JSON.
function same(left, right, limits, ordered = false) {
  spend(limits, 0, 1);
  if (typeof left === 'string' && typeof right === 'string') spend(limits, left.length + right.length);
  if (left === right) return true;
  if (Array.isArray(left)) return Array.isArray(right) && left.length === right.length &&
    left.every((child, index) => same(child, right[index], limits, ordered));
  if (!plain(left) || !plain(right)) return false;
  const a = Object.keys(left), b = Object.keys(right);
  if (a.length !== b.length) return false;
  if (!ordered) { a.sort(); b.sort(); }
  return a.every((key, index) => key === b[index] && same(left[key], right[key], limits, ordered));
}

function limitsFor(options = {}) {
  keys(options, [], ['bytes', 'nodes', 'depth', 'references', 'workBytes', 'workNodes']);
  const limits = { ...REVIEW_CODEC_LIMITS, ...options };
  for (const key of Object.keys(limits)) if (!Number.isSafeInteger(limits[key]) || limits[key] < 1 ||
    limits[key] > REVIEW_CODEC_LIMITS[key]) fail('limits');
  Object.defineProperty(limits, work, { value: { bytes: 0, nodes: 0 } });
  return limits;
}

// Match JSON file semantics for undefined object properties in reviewPacket().
// Reject non-JSON types instead of silently converting Buffers, dates or NaN.
function json(value, limits) {
  const ancestors = new Set(); let nodes = 0, bytes = 0;
  const add = count => { bytes += count; if (bytes > limits.bytes) fail('bounds'); };
  const visit = (item, depth) => {
    spend(limits, 0, 1);
    if (++nodes > limits.nodes || depth > limits.depth) fail('bounds');
    if (typeof item === 'string') { add(quotedSize(item, limits).bytes); return item; }
    if (item === null || typeof item === 'boolean') { add(item === null || item === true ? 4 : 5); return item; }
    if (typeof item === 'number' && Number.isFinite(item) && !Object.is(item, -0)) { add(JSON.stringify(item).length); return item; }
    if (!Array.isArray(item) && !plain(item)) fail('json');
    if (ancestors.has(item)) fail('cycle');
    ancestors.add(item);
    let result;
    if (Object.getOwnPropertySymbols(item).length) fail('json');
    const names = Object.getOwnPropertyNames(item);
    spend(limits, 0, names.length); // Before inspecting/allocating property records.
    for (const key of names) {
      const property = Object.getOwnPropertyDescriptor(item, key);
      if (property.get || property.set) fail('json');
    }
    if (Array.isArray(item)) {
      if (Object.keys(item).length !== item.length) fail('json');
      add(2 + Math.max(0, item.length - 1));
      result = [];
      for (let index = 0; index < item.length; index++) {
        if (!Object.hasOwn(item, index)) fail('json');
        result.push(visit(item[index], depth + 1));
      }
    } else {
      result = {}; add(2); let count = 0;
      for (const key of Object.keys(item)) {
        const child = item[key]; if (child === undefined) continue;
        if (count++) add(1);
        add(quotedSize(key, limits).bytes + 1);
        Object.defineProperty(result, key, { value: visit(child, depth + 1),
          writable: true, enumerable: true, configurable: true });
      }
    }
    ancestors.delete(item);
    return result;
  };
  return visit(value, 0);
}

// Existing production validators/factualDigest use canonical strings internally.
// Reserve conservative ancestor-serialization work BEFORE entering those APIs.
// Measuring is allocation-free for text; large/deep candidates fail safely even
// though this module cannot change those historical validators' implementation.
function reserveValidatorWork(value, limits) {
  const visit = item => {
    spend(limits, 0, 1);
    let bytes;
    if (typeof item === 'string') bytes = quotedSize(item, limits).bytes;
    else if (Array.isArray(item)) bytes = 2 + Math.max(0, item.length - 1) + item.reduce((sum, child) => sum + visit(child), 0);
    else if (plain(item)) {
      const entries = Object.entries(item);
      bytes = 2 + Math.max(0, entries.length - 1) + entries.reduce((sum, [key, child]) => sum + quotedSize(key, limits).bytes + 1 + visit(child), 0);
    } else bytes = JSON.stringify(item).length;
    spend(limits, 4 * bytes);
    return bytes;
  };
  visit(value);
}

const resolution = 'Read input as JSON data. An object containing only $review_ref names the exact value in dictionary with that id. Resolve dictionary entries in ascending numeric id order; entries may reference only earlier entries. Substitute the whole value, without trimming, normalization or interpretation. An object containing only $review_literal is a literal object represented by ordered [key,value] pairs; resolve each value, but treat each key literally. Arrays retain their exact order. No executable decompressor, source API or evaluation is needed. For copy fields, field_id resolves to manifest.fields; combine its field_path, field_digest and protected_source with the full text supplied in input.fields. Read all text, semantic context and reference guides, not hashes alone. Return only the closed response_contract. Manifest identity acknowledges this exact candidate, rules and field inventory; it is not approval. Make every judgment yourself. Independent authorized factual source reads and genuine timestamps remain required.';

// These use the existing descriptor vocabulary. Judgment schemas are inherited,
// not weakened; field/claim/checker identity substitutions are the only aliases.
export function reviewResponseContract(kind) {
  const text = { type: 'string', min: 1 };
  const en = value => ({ type: 'enum', values: [value] });
  const object = fields => ({ type: 'object', fields });
  const array = items => ({ type: 'array', items, min: 0 });
  const identity = { type: 'string', pattern: '^[a-f0-9]{64}$' };
  const base = { wire_version: en(REVIEW_CODEC_VERSION), kind: en(kind), manifest_digest: identity };
  if (kind === 'copy') {
    const full = descriptor(copyReviewContractFor({ schema_version: '1.10' })).fields;
    const withField = schema => {
      const { field_path, field_digest, ...rest } = schema.fields;
      return object({ field_id: { ...text, pattern: '^f[1-9][0-9]*$' }, ...rest });
    };
    return object({ ...base, reviewer_id: full.reviewer_id, candidate_digest: identity, verdict: full.verdict,
      passages: array(withField(full.passages.items)), exemptions: array(withField(full.exemptions.items)),
      findings: array(withField(full.findings.items)) });
  }
  if (kind !== 'fact') fail('kind');
  const full = descriptor(factualReviewContract).fields;
  const { checker_id, ...check } = full.checks.items.fields;
  return object({ ...base, checker_id: full.checker_id, factual_digest: identity, checks: { ...full.checks, items: object(check) },
    findings: { ...full.findings, items: object({ ...full.findings.items.fields,
      claim_id: { ...text, pattern: '^c[1-9][0-9]*$' } }) } });
}

function prepare(packetValue, candidateValue, limits) {
  const packet = json(packetValue, limits), candidate = json(candidateValue, limits);
  if (!['1.7', '1.8', '1.9', '1.10'].includes(candidate.schema_version)) fail('candidate_version');
  reserveValidatorWork(candidate, limits);
  if (!validateCandidate(candidate).ok) fail('candidate');
  if (!['copy', 'fact'].includes(packet.kind) || packet.packet_version !== '1.1') fail('packet_version');
  if (packet.candidate_digest !== factualDigest(candidate) || typeof packet.candidate_path !== 'string') fail('binding');
  const expectedContract = descriptor(packet.kind === 'copy' ? copyReviewContractFor(candidate) : factualReviewContract);
  if (!same(packet.review_contract, expectedContract, limits)) fail('contract');
  if (!plain(packet.response_requirements) || !plain(packet.header_copy_policy) ||
    !plain(packet.header_copy_contract) || !plain(packet.header_review)) fail('packet');
  const headerClaims = [...new Set([...candidate.header_copy.claim_refs, ...(candidate.header_copy.description_claim_refs ?? [])])];
  if (!same(packet.header_copy_policy, headerPolicyFor(candidate), limits) ||
    !same(packet.header_copy_contract, descriptor(headerContractFor(candidate)), limits) ||
    !same(packet.header_review.field_paths, headerTextFieldsFor(candidate).map(key => `$.header_copy.${key}`), limits) ||
    !same(packet.header_review.claim_refs, headerClaims, limits) ||
    !same(packet.header_review.claims, candidate.claims.filter(claim => headerClaims.includes(claim.id)), limits)) fail('header');
  const names = new Set();
  for (const reference of list(packet.references)) {
    keys(reference, ['name', 'sha256', 'lines']);
    if (typeof reference.name !== 'string' || names.has(reference.name) ||
      list(reference.lines).some(line => typeof line !== 'string')) fail('reference');
    const guideBytes = reference.lines.reduce((sum, line) => sum + Buffer.byteLength(line), Math.max(0, reference.lines.length - 1));
    spend(limits, 2 * guideBytes); // Reserve full join/hash buffers before joining.
    if (reference.sha256 !== sha(reference.lines.join('\n'))) fail('reference');
    names.add(reference.name);
  }
  if (!names.size) fail('reference');
  const fields = copyFields(candidate);
  if (packet.kind === 'copy') {
    if (!same(packet.fields, fields, limits) || !plain(packet.semantic_context) ||
      !same(packet.rule_versions, Object.fromEntries(Object.entries(expectedContract.fields.rule_versions.fields)
        .map(([key, schema]) => [key, schema.values[0]])), limits)) fail('inventory');
    const context = json({ actors: candidate.actors, sessions: candidate.sessions, evidence: candidate.evidence,
      original_spec: { workflow: candidate.workflow, scenario: candidate.scenario }, header_copy: candidate.header_copy,
      run_identity: Object.fromEntries(['id', 'workspace_id', 'agent_version_ids', 'application_version', 'sandbox_integrations', 'status']
        .map(key => [key, candidate.run[key]])), relevant_systems: candidate.workflow.relevant_systems,
      observation_window: candidate.coverage.observation_window,
      claim_evidence: candidate.claims.map(({ id, evidence_refs }) => ({ id, evidence_refs })),
      events: candidate.timeline.map(({ id, kind, actor_id, session_id, time, outcome, evidence_refs, artifact_refs, claim_refs, relationships }) =>
        ({ id, kind, actor_id, session_id, time, outcome, evidence_refs, artifact_refs, claim_refs, relationships })) }, limits);
    // Preserve future additive packet context, but reject missing or altered
    // original semantic context. Extensions are also fully packet-hash-bound.
    if (Object.entries(context).some(([key, value]) => !same(packet.semantic_context[key], value, limits))) fail('context');
  } else if (!same(packet.candidate, candidate, limits)) fail('candidate_content');
  const contract = reviewResponseContract(packet.kind);
  const manifest = {
    codec_version: REVIEW_CODEC_VERSION, kind: packet.kind, candidate_schema_version: candidate.schema_version,
    candidate_digest: packet.candidate_digest, candidate_sha256: digest(candidate, limits), packet_version: packet.packet_version,
    packet_sha256: digest(packet, limits), response_contract_sha256: digest(contract, limits),
    // The packet hash binds complete rules, guide bytes, semantic context and all
    // packet extensions; these versions remain legible rather than hash-only.
    ...(packet.kind === 'copy' ? { rule_versions: packet.rule_versions } : {}),
    fields: fields.map(({ field_path, field_digest, protected_source }, index) =>
      ({ id: `f${index + 1}`, field_path, field_digest, protected_source })),
    claims: candidate.claims.map(({ id }, index) => ({ id: `c${index + 1}`, claim_id: id })),
  };
  return { packet, candidate, contract, manifest, manifestId: digest(manifest, limits) };
}

// Hashing selects duplicate candidates; equality is also checked before reuse.
// Reference definitions are postorder, so every edge points strictly backward.
function dictionaryPack(value, limits) {
  const counts = new Map(), containers = new WeakMap(), strings = new Map();
  const update = (hash, text, bytes = Buffer.byteLength(text)) => { spend(limits, bytes); hash.update(text); };
  // Postorder structural fingerprints retain only hashes, lengths and original
  // value references, NEVER serialized ancestors (including unique ancestors).
  // Equal hashes are checked against actual ordered JSON values before reuse.
  const count = item => {
    spend(limits, 0, 1);
    const hash = createHash('sha256'); let chars;
    if (typeof item === 'string') {
      const encoded = quoted(item, limits); chars = encoded.chars; update(hash, encoded.text, encoded.bytes);
    } else if (Array.isArray(item)) {
      update(hash, 'array:'); chars = 2 + Math.max(0, item.length - 1);
      for (const child of item) { const fp = count(child); chars += fp.chars; update(hash, `${fp.key};`); }
    } else if (plain(item)) {
      update(hash, 'object:'); const entries = Object.entries(item); chars = 2 + Math.max(0, entries.length - 1);
      for (const [key, child] of entries) {
        const encoded = quoted(key, limits), fp = count(child); chars += encoded.chars + 1 + fp.chars;
        update(hash, encoded.text, encoded.bytes); update(hash, `:${fp.key};`);
      }
    } else { const encoded = JSON.stringify(item); chars = encoded.length; update(hash, encoded); }
    const fp = { key: hash.digest('hex'), chars };
    if (plain(item) || Array.isArray(item)) containers.set(item, fp);
    if (chars >= 96) {
      const previous = counts.get(fp.key);
      if (previous && !same(previous.value, item, limits, true)) fail('collision');
      if (previous) previous.count++;
      else counts.set(fp.key, { value: item, count: 1 });
      if (typeof item === 'string') strings.set(item, fp);
    }
    return fp;
  };
  count(value);
  const dictionary = [], ids = new Map();
  const encode = item => {
    spend(limits, 0, 1);
    const fp = typeof item === 'string' ? strings.get(item) : item && typeof item === 'object' ? containers.get(item) : null;
    const duplicate = fp && fp.chars >= 96 && counts.get(fp.key).count > 1;
    if (duplicate && ids.has(fp.key)) return { $review_ref: ids.get(fp.key) };
    let encoded;
    if (Array.isArray(item)) encoded = item.map(encode);
    else if (plain(item)) {
      const pairs = Object.entries(item).map(([key, child]) => [key, encode(child)]);
      encoded = Object.hasOwn(item, '$review_ref') || Object.hasOwn(item, '$review_literal')
        ? { $review_literal: pairs } : Object.fromEntries(pairs);
    } else encoded = item;
    if (!duplicate) return encoded;
    if (dictionary.length >= limits.references) fail('bounds');
    const id = `d${dictionary.length}`;
    ids.set(fp.key, id); dictionary.push({ id, value: encoded });
    return { $review_ref: id };
  };
  const input = encode(value);
  return { dictionary, input };
}

export function packReviewPacket(packet, candidate, options = {}) {
  return packPacket(packet, candidate, limitsFor(options));
}

function packPacket(packet, candidate, limits) {
  const prepared = prepare(packet, candidate, limits);
  const input = { ...prepared.packet };
  if (input.kind === 'copy') input.fields = input.fields.map(({ text }, index) => ({ field_id: `f${index + 1}`, text }));
  return json({ codec_version: REVIEW_CODEC_VERSION, kind: input.kind, manifest_id: prepared.manifestId,
    manifest: prepared.manifest, resolution, response_contract: prepared.contract,
    ...dictionaryPack(input, limits) }, limits);
}

export function expandReviewPacket(packedValue, candidate, options = {}) {
  return expandPacket(packedValue, candidate, limitsFor(options));
}

function expandPacket(packedValue, candidate, limits) {
  const packed = json(packedValue, limits);
  keys(packed, ['codec_version', 'kind', 'manifest_id', 'manifest', 'resolution', 'response_contract', 'dictionary', 'input']);
  if (packed.codec_version !== REVIEW_CODEC_VERSION || !['copy', 'fact'].includes(packed.kind)) fail('version');
  const dictionary = list(packed.dictionary);
  if (dictionary.length > limits.references) fail('bounds');
  dictionary.forEach((entry, index) => {
    keys(entry, ['id', 'value']);
    if (entry.id !== `d${index}`) fail('dictionary_id');
  });
  let nodes = 0, bytes = 0;
  const decode = (item, before, depth) => {
    spend(limits, 0, 1);
    if (++nodes > limits.nodes || depth > limits.depth) fail('bounds');
    if (typeof item === 'string') { const size = Buffer.byteLength(item, 'utf8'); spend(limits, size); bytes += size; }
    if (bytes > limits.bytes) fail('bounds');
    if (Array.isArray(item)) return item.map(child => decode(child, before, depth + 1));
    if (!plain(item)) return item;
    if (Object.hasOwn(item, '$review_ref')) {
      keys(item, ['$review_ref']);
      if (typeof item.$review_ref !== 'string' || !/^d(?:0|[1-9][0-9]*)$/.test(item.$review_ref)) fail('reference');
      const index = Number(item.$review_ref.slice(1));
      if (!Number.isSafeInteger(index) || index >= before || !dictionary[index]) fail('reference');
      return decode(dictionary[index].value, index, depth + 1);
    }
    const literal = Object.hasOwn(item, '$review_literal');
    if (literal) keys(item, ['$review_literal']);
    const pairs = literal ? list(item.$review_literal) : Object.entries(item), seen = new Set();
    return Object.fromEntries(pairs.map(pair => {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || seen.has(pair[0])) fail('literal');
      seen.add(pair[0]); const size = Buffer.byteLength(pair[0], 'utf8'); spend(limits, size); bytes += size;
      return [pair[0], decode(pair[1], before, depth + 1)];
    }));
  };
  const packet = decode(packed.input, dictionary.length, 0);
  if (packed.kind === 'copy') {
    const fields = list(packed.manifest?.fields);
    packet.fields = list(packet.fields).map((entry, index) => {
      keys(entry, ['field_id', 'text']);
      if (entry.field_id !== `f${index + 1}` || fields[index]?.id !== entry.field_id) fail('inventory');
      const { field_path, field_digest, protected_source } = fields[index];
      return { field_path, text: entry.text, field_digest, protected_source };
    });
  }
  const restored = json(packet, limits);
  // Repacking rejects altered manifests/descriptors, unused definitions, aliases,
  // duplicate ids and noncanonical representations, not just changed payloads.
  if (!same(packed, packPacket(restored, candidate, limits), limits)) fail('binding');
  return restored;
}

function checkedReview(kind, candidate, review) {
  const result = kind === 'copy' ? validateCopyReview(candidate, review, { requirePass: false })
    : validateFactualReview(candidate, review);
  if (!result.ok) fail('review');
  return review;
}

export function packReviewResponse(reviewValue, packet, candidate, options = {}) {
  const limits = limitsFor(options), prepared = prepare(packet?.codec_version
    ? expandPacket(packet, candidate, limits) : packet, candidate, limits);
  const { kind } = prepared.packet;
  const review = checkedReview(kind, prepared.candidate, json(reviewValue, limits));
  const fields = new Map(prepared.manifest.fields.map(field => [field.field_path, field.id]));
  const claims = new Map(prepared.manifest.claims.map(claim => [claim.claim_id, claim.id]));
  const base = { wire_version: REVIEW_CODEC_VERSION, kind, manifest_digest: prepared.manifestId };
  if (kind === 'copy') {
    const compact = ({ field_path, field_digest, ...rest }) => ({ field_id: fields.get(field_path), ...rest });
    return { ...base, reviewer_id: review.reviewer_id, candidate_digest: review.candidate_digest, verdict: review.verdict,
      passages: review.passages.map(compact), exemptions: review.exemptions.map(compact), findings: review.findings.map(compact) };
  }
  return { ...base, checker_id: review.checker_id, factual_digest: review.factual_digest,
    checks: review.checks.map(({ checker_id, ...check }) => check),
    findings: review.findings.map(finding => ({ ...finding, claim_id: claims.get(finding.claim_id) })) };
}

export function expandReviewResponse(responseValue, packet, candidate, options = {}) {
  const limits = limitsFor(options), prepared = prepare(packet?.codec_version
    ? expandPacket(packet, candidate, limits) : packet, candidate, limits), wire = json(responseValue, limits);
  const { kind } = prepared.packet;
  const base = ['wire_version', 'kind', 'manifest_digest'];
  keys(wire, kind === 'copy' ? [...base, 'reviewer_id', 'candidate_digest', 'verdict', 'passages', 'exemptions', 'findings']
    : [...base, 'checker_id', 'factual_digest', 'checks', 'findings']);
  if (wire.wire_version !== REVIEW_CODEC_VERSION || wire.kind !== kind || wire.manifest_digest !== prepared.manifestId ||
    wire[kind === 'copy' ? 'candidate_digest' : 'factual_digest'] !== prepared.manifest.candidate_digest) fail('binding');
  let review;
  if (kind === 'copy') {
    const fields = new Map(prepared.manifest.fields.map(field => [field.id, field]));
    const expand = (entry, required, optional = [], exemption = false) => {
      keys(entry, ['field_id', ...required], optional);
      const field = fields.get(entry.field_id);
      if (!field || field.protected_source !== exemption) fail('field_id');
      const { field_id, ...judgments } = entry;
      return { field_path: field.field_path, ...(!exemption ? { field_digest: field.field_digest } : {}), ...judgments };
    };
    review = { reviewer_id: wire.reviewer_id, candidate_digest: wire.candidate_digest,
      rule_versions: prepared.manifest.rule_versions, verdict: wire.verdict,
      passages: list(wire.passages).map(entry => expand(entry, ['guide', 'routing_reason', 'sdlc_review', 'exceptions'])),
      exemptions: list(wire.exemptions).map(entry => expand(entry, ['reason'], [], true)),
      findings: list(wire.findings).map(entry => expand(entry,
        ['rule_group', 'rule_id', 'severity', 'explanation', 'semantic_risk'], ['suggestion'])) };
  } else {
    const claims = new Map(prepared.manifest.claims.map(claim => [claim.id, claim.claim_id]));
    review = { checker_id: wire.checker_id, factual_digest: wire.factual_digest,
      checks: list(wire.checks).map(entry => {
        keys(entry, ['id', 'operation', 'source_id', 'observed_at', 'result']);
        return { ...entry, checker_id: wire.checker_id };
      }),
      findings: list(wire.findings).map(entry => {
        keys(entry, ['claim_id', 'check_refs', 'finding', 'explanation', 'gaps']);
        if (!claims.has(entry.claim_id)) fail('claim_id');
        return { ...entry, claim_id: claims.get(entry.claim_id) };
      }) };
  }
  return checkedReview(kind, prepared.candidate, json(review, limits));
}

export function reviewCodecByteCounts(packet, packed, review, response) {
  const size = value => Buffer.byteLength(JSON.stringify(value), 'utf8');
  return { packet_bytes: size(packet), compact_packet_bytes: size(packed),
    ...(review === undefined ? {} : { review_bytes: size(review), compact_response_bytes: size(response) }) };
}
