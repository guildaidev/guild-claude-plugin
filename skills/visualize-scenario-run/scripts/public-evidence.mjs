// Deliberate public projection, NOT a serialization of private reviewer records.
// Protected source/artifact bytes stay unchanged. Public projection can omit a
// redundant validation envelope while the exact business artifact remains visible.
export function privateValidationEvidence(doc) {
  const source = doc.artifact_version_source;
  const hidden = new Set();
  if (doc.schema_version === '1.10') {
    // The exact result is already displayed as artifact content. Its supporting
    // request/read/receipt envelopes are not another user-facing workflow step.
    for (const artifact of doc.artifacts) for (const id of artifact.evidence_refs) hidden.add(id);
    for (const item of doc.evidence) {
      try {
        const record = JSON.parse(item.content?.event?.content?.message);
        if (record.type === 'scenario_evidence' && ['mutation_requested', 'mutation_acknowledged', 'artifact_observed', 'gap'].includes(record.stage)) hidden.add(item.id);
      } catch { /* An ordinary source payload is not a structured log. */ }
    }
  }
  if (source?.schema_version !== '2.1') return hidden;
  const bindings = source.bindings ?? [], privateOperations = new Set();
  for (const operation of source.operations ?? []) {
    if (operation.timeline_role === 'supporting' || bindings.some(binding => binding.occurrence_id === operation.occurrence_id && (() => {
      try { return JSON.parse(doc.evidence.find(item => item.id === binding.evidence_id)?.content?.event?.content?.message).stage === 'mutation_requested'; } catch { return false; }
    })())) privateOperations.add(operation.occurrence_id);
  }
  for (const binding of bindings) if (privateOperations.has(binding.occurrence_id)) hidden.add(binding.evidence_id);
  return hidden;
}

export function publicEvidenceContent(doc, item) {
  if (doc.schema_version !== '1.10') return item.content;
  const event = item.content?.event ?? item.content;
  if (event && typeof event.id === 'string' && event.task && ['runtime_start', 'runtime_done', 'runtime_error', 'system_error'].includes(event.type) && Object.hasOwn(event, 'content')) {
    // Retain the actual business result, not a native task/transport envelope.
    return event.content;
  }
  return item.content;
}

export function evidenceState(doc, event) {
  const findings = (doc.review?.findings ?? []).filter(f => event.claim_refs.includes(f.claim_id));
  const statuses = new Set(findings.map(f => f.finding));
  if (statuses.has('conflict')) return 'Sources conflict';
  if (statuses.has('unavailable')) return 'Source unavailable';
  if (statuses.has('inconclusive')) return 'Evidence inconclusive';
  if (statuses.has('qualified') || findings.some(f => f.gaps.length)) return 'Evidence has limitations';
  return event.outcome === 'confirmed' ? 'Recorded' : `Recorded outcome: ${event.outcome}`;
}

// Authored coverage can mix business coverage with private workflow commentary.
// Omit private proof commentary, never rewrite protected source bytes or reviewer
// prose into new public claims. Generic qualification remains when a note is private.
const machinery = /\b(?:copy[-_ ]review|factual[-_ ]review|fact[-_ ]check(?:er|ing)?|checker|reviewer|model|opus|sonnet|claude[-_]|candidate|snapshot|schema|digest|rule_versions|field_digest|field_path|observed_at|check_refs|claim_refs|claim[-_]|header|copy.approv|copy.editor|generation|HEADER-\d|SDLC-\d|ASD-\d)\b/i;
const proofProcedure = /\b(?:structured\s+(?:console\s+)?(?:records?|logs?|evidence)|(?:console|process)[-_ ](?:logs?|records?|results?)|process_result|artifact_observed|mutation_requested|mutation_acknowledged|(?:read\s*back|readback)|(?:not|never)\s+admitted|(?:no|missing|without)\s+(?:separate\s+)?(?:emitted\s+)?step\s+result|internal\s+steps?[^.!?\n]*(?:not\s+(?:retained|available|shown)|missing))\b/i;
const unknownEffect = 'The available records do not establish every action or content version. The full effect of this change remains uncertain.';

// Supporting prose is authored metadata, not protected source or artifact text.
// Omit complete private sentences, not clauses or qualifications within a sentence.
// Keep independent business sentences even when the author put them in one paragraph.
export function publicSupportingDetail(doc, event) {
  if (doc.schema_version !== '1.10') return event.supporting_detail;
  return event.supporting_detail.split(/\n\s*\n/).map(paragraph => {
    if (!proofProcedure.test(paragraph)) return paragraph;
    return paragraph.split(/(?<=[.!?])\s+(?=[A-Z“"])/).filter(sentence => !proofProcedure.test(sentence)).join(' ');
  }).filter(Boolean).join('\n\n');
}

export function sourceLimitations(doc, event) {
  const relevant = doc.coverage.gaps.filter(g => !event || !g.affected_refs.length || g.affected_refs.includes(event.id));
  const grouped = doc.artifact_version_source?.schema_version === '2.1';
  // Keep the uncertainty, not private collection/checklist/validation mechanics.
  // The detailed, source-bound gap records remain unchanged in the private input.
  const notes = relevant.map(g => (grouped && /^(?:session-evidence|postrun-collection)-gap-\d+$/.test(g.id)) || (doc.schema_version === '1.10' && proofProcedure.test(g.description))
    ? unknownEffect
    : g.description).filter(text => !machinery.test(text));
  const findings = (doc.review?.findings ?? []).filter(f => !event || event.claim_refs.includes(f.claim_id));
  // Human source qualifications are useful. Mixed private workflow notes are not.
  notes.push(...findings.flatMap(f => f.gaps).filter(text => !machinery.test(text)));
  // A private finding may mix a business-record discrepancy with workflow prose.
  // Project only the actual version values, never that raw reviewer paragraph.
  const versions = new Set();
  for (const gap of findings.flatMap(f => f.gaps)) {
    if (!/conflict|contradict/i.test(gap)) continue;
    for (const match of gap.matchAll(/application_version\s+['"]([A-Za-z0-9_.:-]+)['"]/g)) versions.add(match[1]);
  }
  if (versions.size > 1) notes.push(`Application version differs between records: ${[...versions].join(' / ')}.`);
  if (findings.some(f => f.finding === 'conflict')) notes.push('The available sources conflict. The resulting state is not fully established.');
  if (findings.some(f => f.finding === 'unavailable')) notes.push('Some source records are unavailable. The resulting state is not fully established.');
  if (findings.some(f => ['qualified', 'inconclusive'].includes(f.finding) || f.gaps.length)) notes.push('The available evidence has gaps or inconsistencies. Recorded results do not establish every detail or any unobserved effect.');
  return [...new Set(notes)];
}
