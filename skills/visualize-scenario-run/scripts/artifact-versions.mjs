// Pure projection of captured data. Never executes source scripts or calls a service.
import { createHash } from 'node:crypto';
import { projectSessionEvidence } from './session-evidence.mjs';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
export const artifactVersionBundleDigest = bundle => createHash('sha256').update(canonical(bundle)).digest('hex');
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(value);
const object = value => value && Object.getPrototypeOf(value) === Object.prototype;
const closed = (value, required, optional = []) => object(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => [...required, ...optional].includes(key));
const issue = (path, code = 'artifact_version_source') => ({ path, code,
  message: 'Artifact version cannot be reproduced from its captured sources.',
  repair: 'Supply exact sanitized source references and ordered operations; do not invent a baseline or rewrite the original bundle.' });

// RFC 6901 pointers into evidence.content, never executable expressions or paths.
function resolveReference(reference, evidence) {
  if (!closed(reference, ['evidence_id', 'pointer']) || !identifier(reference.evidence_id) || typeof reference.pointer !== 'string' || !/^(?:\/(?:[^~]|~[01])*)*$/.test(reference.pointer)) throw new Error();
  const record = evidence.get(reference.evidence_id);
  if (!record) throw new Error();
  let value = record.content;
  for (const encoded of reference.pointer ? reference.pointer.slice(1).split('/') : []) {
    const key = encoded.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) throw new Error();
    value = value[key];
  }
  return { value, record };
}
const windowFor = occurrence => ({ from: Date.parse(occurrence.time?.at ?? occurrence.time?.earliest), through: Date.parse(occurrence.time?.at ?? occurrence.time?.latest) });
const sameSourceRecord = (left, right) => typeof left?.source?.record_id === 'string' && left.source.record_id.length > 0 && left.source.record_id === right?.source?.record_id && left.source.system === right.source.system;
const associated = (record, refs, evidence) => refs.includes(record.id) || refs.some(id => sameSourceRecord(record, evidence.get(id)));
const targetConsistent = (record, original, occurrence) => record.kind !== 'external_record' ||
  ((!record.source?.record_id || !occurrence.world_effect?.target || record.source.record_id === occurrence.world_effect.target) &&
    (!record.source?.url || !original.source_url || record.source.url === original.source_url));
const splitSurrogate = (text, offset) => offset > 0 && offset < text.length && /[\uD800-\uDBFF]/.test(text[offset - 1]) && /[\uDC00-\uDFFF]/.test(text[offset]);

/** Private collector sidecar. References only: no authored version content.
 * Source authenticity and completeness still require source review. */
export function projectArtifactVersions(bundle, sidecar) {
  const errors = [];
  const reject = path => errors.push(issue(path));
  try {
    if (['2.0', '2.1'].includes(sidecar?.schema_version)) return sidecar.bundle_digest === artifactVersionBundleDigest(bundle)
      ? projectSessionEvidence(bundle, sidecar) : { ok: false, errors: [issue('$.artifact_version_source')] };
    if (!closed(sidecar, ['schema_version', 'bundle_digest', 'records', 'versions']) || sidecar.schema_version !== '1.0' || sidecar.bundle_digest !== artifactVersionBundleDigest(bundle) || !Array.isArray(sidecar.records) || !Array.isArray(sidecar.versions) || !sidecar.versions.length) return { ok: false, errors: [issue('$.artifact_version_source')] };
    const evidence = new Map(bundle.evidence.map(record => [record.id, record]));
    for (const [index, record] of sidecar.records.entries()) {
      // The host also checks evidence shape and credentials. Never replace IDs.
      if (!identifier(record?.id) || evidence.has(record.id)) reject(`$.artifact_version_source.records[${index}]`);
      else evidence.set(record.id, record);
    }
    if (errors.length) return { ok: false, errors };
    const versions = new Map(), latest = new Map(), projected = [], attachments = new Map(), replaced = new Map();
    const targetSlots = new Set();
    for (const [index, version] of sidecar.versions.entries()) {
      const path = `$.artifact_version_source.versions[${index}]`;
      try {
        if (!closed(version, ['id', 'artifact_id', 'occurrence_id', 'operation', 'value_ref'], ['base_ref', 'previous_version_id', 'index_ref', 'index_base', 'readback_ref', 'operation_binding']) || !identifier(version.id) || versions.has(version.id)) throw new Error();
        const original = bundle.artifacts.find(item => item.id === version.artifact_id);
        const occurrence = bundle.occurrences.find(item => item.id === version.occurrence_id);
        if (!original || !occurrence || !['agent_world_action', 'external_world_action'].includes(occurrence.kind)) throw new Error();
        const artifactTargets = bundle.occurrences.filter(item => item.artifact_refs.includes(original.id)).map(item => item.world_effect?.target).filter(Boolean);
        if (occurrence.world_effect?.target && artifactTargets.length && !artifactTargets.includes(occurrence.world_effect.target)) throw new Error();
        const slot = `${version.artifact_id}\0${version.occurrence_id}`;
        if (targetSlots.has(slot)) throw new Error();
        targetSlots.add(slot);
        const previous = latest.get(version.artifact_id);
        if (version.previous_version_id && versions.get(version.previous_version_id) !== previous) throw new Error();
        if (version.previous_version_id && (!previous || previous.artifact_id !== version.artifact_id)) throw new Error();
        const window = windowFor(occurrence);
        if (previous && !(Number.isFinite(windowFor(previous.occurrence).through) && Number.isFinite(window.from) && windowFor(previous.occurrence).through < window.from)) throw new Error();
        if (previous && version.base_ref) throw new Error();
        const used = new Set(occurrence.evidence_refs);
        const read = reference => { const resolved = resolveReference(reference, evidence); used.add(resolved.record.id); return resolved; };
        const captured = read(version.value_ref);
        const operationRecords = new Set();
        if (version.operation_binding !== undefined) {
          if (!closed(version.operation_binding, ['request_ref', 'receipt_ref'])) throw new Error();
          const request = read(version.operation_binding.request_ref), receipt = read(version.operation_binding.receipt_ref);
          if (request.record.id !== captured.record.id || typeof request.value !== 'string' || !request.value || request.value !== receipt.value || !associated(receipt.record, occurrence.evidence_refs, evidence)) throw new Error();
          operationRecords.add(request.record.id); operationRecords.add(receipt.record.id);
        }
        if ((!associated(captured.record, occurrence.evidence_refs, evidence) && !operationRecords.has(captured.record.id)) || !targetConsistent(captured.record, original, occurrence)) throw new Error();
        // An observed record state cannot travel backwards (or across an unknown
        // window) merely because the collector attached it to an earlier step.
        if (version.operation === 'capture' && captured.record.kind === 'external_record') {
          const observed = Date.parse(captured.record.occurred_at ?? captured.record.captured_at);
          if (!Number.isFinite(observed) || !Number.isFinite(window.from) || !Number.isFinite(window.through) || observed < window.from || observed > window.through) throw new Error();
        }
        let value = structuredClone(captured.value), before;
        if (version.operation === 'capture') {
          if (version.base_ref || version.index_ref || version.index_base !== undefined) throw new Error();
          if (previous) before = previous.value;
        } else {
          let base;
          if (version.base_ref) {
            base = read(version.base_ref);
            const prior = bundle.occurrences.filter(item => item.world_effect?.target && item.world_effect.target === occurrence.world_effect?.target && Number.isFinite(windowFor(item).through) && windowFor(item).through < window.from);
            if (!prior.some(item => associated(base.record, item.evidence_refs, evidence)) || !targetConsistent(base.record, original, occurrence)) throw new Error();
            const observed = Date.parse(base.record.occurred_at ?? base.record.captured_at);
            if (base.record.kind === 'external_record' && (!Number.isFinite(observed) || !Number.isFinite(window.from) || observed >= window.from)) throw new Error();
          }
          before = previous ? previous.value : base?.value;
          if (typeof before !== 'string' || typeof value !== 'string') throw new Error();
          if (version.operation === 'append') {
            if (version.index_ref || version.index_base !== undefined) throw new Error();
            value = before + value;
          } else if (version.operation === 'insert') {
            if (!version.index_ref || ![0, 1].includes(version.index_base)) throw new Error();
            const indexed = read(version.index_ref);
            if (!associated(indexed.record, occurrence.evidence_refs, evidence) && !operationRecords.has(indexed.record.id) && indexed.record.id !== captured.record.id) throw new Error();
            if (!targetConsistent(indexed.record, original, occurrence)) throw new Error();
            const position = indexed.value;
            const offset = position - version.index_base;
            if (!Number.isSafeInteger(position) || offset < 0 || offset > before.length || splitSurrogate(before, offset)) throw new Error();
            value = before.slice(0, offset) + value + before.slice(offset);
          } else if (version.operation === 'replace') {
            if (version.index_ref || version.index_base !== undefined) throw new Error();
          } else throw new Error();
        }
        if (previous) previous.evidence_refs.forEach(id => used.add(id));
        const limitations = [...original.redactions];
        limitations.push(version.operation === 'capture' && captured.record.kind === 'external_record'
          ? 'Captured source field only; complete artifact content was not independently established.'
          : 'Version reconstructed from captured source data; a contemporaneous readback was not established.');
        if (version.readback_ref) {
          const readback = read(version.readback_ref);
          if (readback.record.kind !== 'external_record' || readback.record.completeness !== 'complete' || !associated(readback.record, [...occurrence.evidence_refs, ...original.evidence_refs], evidence) || !targetConsistent(readback.record, original, occurrence) || canonical(readback.value) !== canonical(value)) throw new Error();
          limitations.push('Projected content matches a captured readback field; this does not independently establish full artifact content, mutation timing or causation.');
        }
        for (const id of used) limitations.push(...(evidence.get(id)?.redactions ?? []));
        const id = `version:${version.id}`;
        if (!identifier(id) || bundle.artifacts.some(item => item.id === id)) throw new Error();
        const artifact = { id, kind: original.kind, title: original.title, media_type: original.media_type,
          ...(original.source_url ? { source_url: original.source_url } : {}), evidence_refs: [...used],
          completeness: 'excerpt', redactions: [...new Set(limitations)],
          change: previous || version.base_ref ? canonical(before) === canonical(value) ? 'unchanged' : 'modified' : 'unknown',
          ...(typeof value === 'string' ? { content: value, after: value,
            ...(typeof before === 'string' ? { before } : {}) } : { structured_content: value }) };
        versions.set(version.id, { value, artifact_id: version.artifact_id, occurrence, evidence_refs: [...used] });
        latest.set(version.artifact_id, versions.get(version.id));
        projected.push(artifact);
        if (!attachments.has(occurrence.id)) attachments.set(occurrence.id, []);
        attachments.get(occurrence.id).push(id);
        if (!replaced.has(occurrence.id)) replaced.set(occurrence.id, new Set());
        replaced.get(occurrence.id).add(original.id);
      } catch { reject(path); }
    }
    if (errors.length) return { ok: false, errors };
    return { ok: true, artifacts: projected, evidence: structuredClone(sidecar.records),
      occurrences: bundle.occurrences.map(occurrence => ({ ...structuredClone(occurrence),
        artifact_refs: [...occurrence.artifact_refs.filter(id => !replaced.get(occurrence.id)?.has(id)), ...(attachments.get(occurrence.id) ?? [])] })) };
  } catch { return { ok: false, errors: [issue('$.artifact_version_source')] }; }
}
