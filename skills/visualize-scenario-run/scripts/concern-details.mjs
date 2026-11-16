// Reuse public, authored event copy; never synthesize causes from status enums,
// raw tool payloads, or private reviewer explanations. Each returned excerpt is
// an unchanged sentence from an existing field, not a newly authored assertion.
const privateDetail = /\b(?:copy[-_ ]review|factual[-_ ]review|fact[-_ ]check(?:er|ing)?|checker|reviewer|model|opus|sonnet|candidate|snapshot|schema|digest|rule_versions|field_digest|field_path|check_refs|claim_refs|evidence_refs|record_id|session_id|generation|copy.editor|HEADER-\d|SDLC-\d|ASD-\d)\b|\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i;

function publicSentences(value) {
  if (typeof value !== 'string') return [];
  // Split only at sentence boundaries, not clauses: dropping a qualification
  // from the same sentence could change the source's meaning.
  return value.split(/(?<=[.!?])\s+(?=\S)/)
    .map(text => text.trim()).filter(text => text && !privateDetail.test(text));
}

// Keep the authored explanation separate from raw evidence and the technical
// prompt. Do not expose generation diagnostics as a public concern or fix.
export function publicConcernExplanation(value) {
  return publicSentences(value).join(' ');
}

export function concernDetails(event) {
  const fields = [
    ['Recorded problem', event.description],
    ['Recorded effect', event.world_effect?.change],
    ['Source detail', event.supporting_detail],
    ...(event.workflow_relevance?.basis === 'observed' ? [['Workflow impact', event.workflow_relevance.explanation]] : []),
  ];
  const seen = new Set();
  return fields.flatMap(([label, value]) => publicSentences(value).flatMap(text => {
    if (seen.has(text)) return [];
    seen.add(text);
    return [{ label, text }];
  }));
}
