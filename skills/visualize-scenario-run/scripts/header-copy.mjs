// Product/UI budgets, not ASD sentence limits. No authoring or source mutation.
const text = { type: 'string', min: 1 };
export const HEADER_COPY_POLICY = Object.freeze({
  version: '1.0', kind: 'product-ui',
  counting: 'Words are nonempty whitespace-separated tokens; characters are Unicode code points, including spaces. Never truncate or normalize authored text.',
  fields: {
    application_name: { rule_id: 'HEADER-1', min_words: 1, max_words: 2, purpose: 'Plain job-oriented display name, not an invented official product identity or technical agent slug.' },
    workflow_purpose: { rule_id: 'HEADER-2', max_words: 16, max_characters: 120, purpose: 'One brief statement of why the application exists. Keep the full specification separately.' },
    scenario_name: { rule_id: 'HEADER-3', max_words: 6, purpose: 'Few plain distinguishing words about the scenario and supported outcome.' },
    starting_context: { rule_id: 'HEADER-4', purpose: 'Relevant starting situation or requested task, not unobserved absence or invented people.' },
    observed_result: { rule_id: 'HEADER-5', purpose: 'What the available evidence establishes at the end. Preserve attempted, unknown, qualified, partial and failed outcomes.' },
  },
  review: 'These human-experience headers use Economist, then SDLC v2 and this product policy; do not stack ASD. Across starting_context and observed_result, use two or three plain sentences elaborating the scenario name. No punctuation-counting validator. Header claims must be independently checked; brevity cannot invent completion, delivery, readership, causation or official identity.',
});
export const headerCopyContract = {
  type: 'object', fields: {
    application_name: { ...text, maxWords: 2 },
    workflow_purpose: { ...text, maxWords: 16, maxCharacters: 120 },
    scenario_name: { ...text, maxWords: 6 },
    starting_context: text, observed_result: text,
    claim_refs: { type: 'array', min: 1, items: { type: 'string', pattern: /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/ } },
  },
};
export const headerTextFields = Object.keys(HEADER_COPY_POLICY.fields);

// New semantics require a new contract; 1.7 words/reviews are never relabelled.
export const SCENARIO_SUMMARY_POLICY = Object.freeze({
  version: '1.1', kind: 'product-ui', counting: HEADER_COPY_POLICY.counting,
  fields: {
    application_name: HEADER_COPY_POLICY.fields.application_name,
    workflow_purpose: HEADER_COPY_POLICY.fields.workflow_purpose,
    scenario_name: HEADER_COPY_POLICY.fields.scenario_name,
    scenario_description: { rule_id: 'HEADER-4', max_words: 30, max_characters: 200,
      purpose: 'Brief general present-tense summary of scenario setup/task and intended behavior. Prefer one concise sentence; two only if necessary. NOT what happened in this particular run. No past-tense result, completion, source-review or reliability narration. Actual outcomes remain in run/timeline.' },
  },
  review: 'Human-facing headers use Economist, then unchanged SDLC v2 and this product policy. Review meaning and general present tense, not punctuation or verb regexes. Description claim refs ground intended scenario behavior, not completed effects. Numeric validity is not semantic approval.',
  public_presentation: 'Never expose generation machinery in UI, source details or copied prompts: no editorial/factual review records, role identities/models, rule versions, iterations/verdicts, schema/candidate digests or pipeline findings. Preserve business results, source evidence and human-readable uncertainty. Internal gates and real records remain private and unchanged.',
});
export const summaryHeaderCopyContract = {
  type: 'object', fields: {
    application_name: headerCopyContract.fields.application_name,
    workflow_purpose: headerCopyContract.fields.workflow_purpose,
    scenario_name: headerCopyContract.fields.scenario_name,
    scenario_description: { ...text, maxWords: 30, maxCharacters: 200 },
    claim_refs: headerCopyContract.fields.claim_refs,
    description_claim_refs: headerCopyContract.fields.claim_refs,
  },
};
export const headerPolicyFor = doc => ['1.8', '1.9', '1.10'].includes(doc.schema_version) ? SCENARIO_SUMMARY_POLICY : HEADER_COPY_POLICY;
export const headerContractFor = doc => ['1.8', '1.9', '1.10'].includes(doc.schema_version) ? summaryHeaderCopyContract : headerCopyContract;
export const headerTextFieldsFor = doc => Object.keys(headerPolicyFor(doc).fields);

// Must be called only after validating the matching version. Legacy wording is
// a fallback, not a migration or a deterministic rewrite of checked prose.
export function displayHeader(doc) {
  if (['1.7', '1.8', '1.9', '1.10'].includes(doc.schema_version)) return doc.header_copy;
  return { application_name: doc.workflow.title, workflow_purpose: doc.workflow.intended_world_effect,
    scenario_name: doc.scenario.title, expected_outcome: doc.scenario.expected_outcome };
}
