// Local, deterministic assembly only. Editorial choices and both real reviews
// remain external to this module; assembly does not verify claims or read sources.
import * as contracts from './contracts.mjs';
import { headerCopyContract, summaryHeaderCopyContract } from './header-copy.mjs';

const text = { type: 'string', min: 1 };
const id = { type: 'string', pattern: /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/ };
const object = fields => ({ type: 'object', fields });
const array = (items, min = 0) => ({ type: 'array', items, min });
const optional = schema => ({ ...schema, optional: true });
const prose = keys => optional(object(Object.fromEntries(keys.map(key => [key, optional(text)]))));

// Closed descriptor, in the same data format as the bundle/candidate contracts.
// occurrence_id selects an existing source occurrence; it is never a new ID.
export const legacyDraftContract = object({
  schema_version: { type: 'enum', values: ['1.0'] },
  snapshot_id: id, editor_id: id, parent_agent_id: id, summary: text,
  claims: array(object({ id, text, evidence_refs: array(id, 1) }), 1),
  events: array(object({ occurrence_id: id, description: text,
    claim_refs: array(id, 1), supporting_detail: text,
    suggested_feedback: optional(object({ action_id: id, text, evidence_refs: array(id, 1), claim_refs: array(id, 1) })) })),
  artifact_claims: array(object({ artifact_id: id, claim_refs: array(id, 1) })),
  omitted_occurrences: array(object({ id, reason: text })),
  artifact_titles: optional(array(object({ artifact_id: id, title: text }))),
  display: optional(object({ compact: { type: 'boolean' } })),
  context_copy: optional(object({
    workflow: prose(['title', 'intended_world_effect']),
    scenario: prose(['title', 'trigger', 'initial_conditions', 'expected_outcome']),
    run: prose(['execution_label', 'observed_resulting_state']),
  })),
});
// New authoring requires explicit header text and preserves the complete source
// workflow/scenario context. Historical draft 1.0 remains an explicit 1.6 path.
export const legacyHeaderDraftContract = object({ ...legacyDraftContract.fields,
  schema_version: { type: 'enum', values: ['1.1'] }, header_copy: headerCopyContract,
  context_copy: optional(object({ run: prose(['execution_label', 'observed_resulting_state']) })),
});
export const draftContract = object({ ...legacyHeaderDraftContract.fields,
  schema_version: { type: 'enum', values: ['1.2'] }, header_copy: summaryHeaderCopyContract,
});

function fail(errors, path, code, message, repair) {
  // Never include rejected values or arbitrary property names in diagnostics.
  errors.push({ path, code, message, repair });
}

function shape(value, schema, path, errors) {
  if (value === undefined && schema.optional) return;
  const reject = () => fail(errors, path, 'schema', 'Draft field does not match its contract.', 'Use the closed contract for the explicit draft version.');
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string' || (schema.min && !value.trim()) || (schema.pattern && !schema.pattern.test(value))) reject();
      break;
    case 'boolean': if (typeof value !== 'boolean') reject(); break;
    case 'enum': if (!schema.values.includes(value)) reject(); break;
    case 'array':
      if (!Array.isArray(value) || value.length < schema.min) reject();
      else for (let i = 0; i < value.length; i++) shape(value[i], schema.items, `${path}[${i}]`, errors);
      break;
    case 'object':
      if (!value || Object.getPrototypeOf(value) !== Object.prototype) { reject(); break; }
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.fields, key)) fail(errors, path, 'unknown_field', 'Unexpected draft field.', 'Remove fields not in the closed draft contract.');
      }
      for (const [key, field] of Object.entries(schema.fields)) shape(value[key], field, `${path}.${key}`, errors);
      break;
  }
}

export function assembleCandidate(bundle, draft) {
  const checked = contracts.validate(bundle, 'bundle');
  if (!checked.ok) return checked;
  const errors = [];
  try {
    const legacy = draft?.schema_version === '1.0';
    shape(draft, legacy ? legacyDraftContract : draft?.schema_version === '1.1' ? legacyHeaderDraftContract : draftContract, '$', errors);
    if (errors.length) return { ok: false, errors };

    const source = new Map(bundle.occurrences.map(item => [item.id, item]));
    const selected = new Set();
    draft.events.forEach((event, i) => {
      const path = `$.events[${i}].occurrence_id`;
      if (!source.has(event.occurrence_id)) fail(errors, path, 'missing_reference', 'Selected occurrence is absent from the bundle.', 'Select only a supplied occurrence ID.');
      if (selected.has(event.occurrence_id)) fail(errors, path, 'duplicate_id', 'Selected occurrence is repeated.', 'Select each occurrence at most once.');
      selected.add(event.occurrence_id);
    });
    const omitted = new Set();
    draft.omitted_occurrences.forEach((item, i) => {
      const path = `$.omitted_occurrences[${i}]`;
      if (!source.has(item.id)) fail(errors, path, 'missing_reference', 'Omitted occurrence is absent from the bundle.', 'Explain omissions only for supplied occurrences.');
      if (omitted.has(item.id)) fail(errors, path, 'duplicate_id', 'Omission is repeated.', 'Provide exactly one reason for each omitted occurrence.');
      if (selected.has(item.id)) fail(errors, path, 'selection_conflict', 'Occurrence is both selected and omitted.', 'Choose either selection or omission for this occurrence.');
      omitted.add(item.id);
    });
    bundle.occurrences.forEach((item, i) => {
      if (!selected.has(item.id) && !omitted.has(item.id)) fail(errors, `$.occurrences[${i}]`, 'missing_omission', 'Unselected occurrence has no omission reason.', 'Add one editorial omission reason or select the occurrence.');
    });
    draft.events.forEach((event, i) => {
      source.get(event.occurrence_id)?.relationships.forEach((relation, j) => {
        if (!selected.has(relation.other_occurrence_id)) fail(errors, `$.events[${i}].relationships[${j}]`, 'omitted_relationship', 'Selected occurrence refers to an omitted occurrence.', 'Select the referenced occurrence if eligible, or omit the dependent occurrence. Do not rewrite or drop the source relationship.');
      });
    });
    const artifacts = new Set(draft.events.flatMap(event => source.get(event.occurrence_id)?.artifact_refs ?? []));
    const titles = new Set();
    (draft.artifact_titles ?? []).forEach((item, i) => {
      const path = `$.artifact_titles[${i}]`;
      if (!artifacts.has(item.artifact_id)) fail(errors, path, 'missing_reference', 'Artifact title must refer to a selected event artifact.', 'Keep source-page material in the collection bundle/evidence, not a detached render card.');
      if (titles.has(item.artifact_id)) fail(errors, path, 'duplicate_id', 'Artifact title is repeated.', 'Provide at most one title per artifact.');
      titles.add(item.artifact_id);
    });
    if (errors.length) return { ok: false, errors };

    const { occurrences, ...context } = structuredClone(bundle);
    context.schema_version = legacy ? '1.6' : draft.schema_version === '1.1' ? '1.7' : '1.8';
    context.artifacts = context.artifacts.filter(artifact => artifacts.has(artifact.id));
    delete context.coverage.data_origin;
    context.coverage.gaps.forEach(gap => { delete gap.impact; });
    const authored = structuredClone(draft);
    for (const [section, fields] of Object.entries(authored.context_copy ?? {})) Object.assign(context[section], fields);
    const occurrenceCopies = new Map(occurrences.map(item => [item.id, item]));
    const titleCopies = new Map((authored.artifact_titles ?? []).map(item => [item.artifact_id, item.title]));
    for (const artifact of context.artifacts) if (titleCopies.has(artifact.id)) artifact.title = titleCopies.get(artifact.id);
    const snapshot = {
      ...context,
      snapshot_id: authored.snapshot_id, editor_id: authored.editor_id, parent_agent_id: authored.parent_agent_id,
      summary: authored.summary, claims: authored.claims,
      ...(!legacy ? { header_copy: authored.header_copy } : {}),
      timeline: authored.events.map(({ occurrence_id, description, claim_refs, supporting_detail, suggested_feedback }) => ({
        ...occurrenceCopies.get(occurrence_id), description, claim_refs, supporting_detail,
        ...(suggested_feedback ? { suggested_feedback } : {}),
      })),
      artifact_claims: authored.artifact_claims, omitted_occurrences: authored.omitted_occurrences,
      display: authored.display ?? { compact: false },
    };
    // Structural/reference/credential preflight is not factual or copy review.
    if (typeof contracts.validateCandidate !== 'function') {
      fail(errors, '$', 'validator_unavailable', 'Candidate preflight is unavailable.', 'Use the matching candidate contract before requesting both reviews.');
      return { ok: false, errors };
    }
    const candidateCheck = contracts.validateCandidate(snapshot, { legacy });
    return candidateCheck.ok ? { ok: true, snapshot } : candidateCheck;
  } catch {
    fail(errors, '$', 'invalid_document', 'Assembly requires finite, acyclic JSON documents.', 'Supply sanitized JSON using the bundle and draft contracts.');
    return { ok: false, errors };
  }
}
