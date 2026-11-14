// Deliberate public projection, NOT a serialization of private reviewer records.
// Source payloads and artifacts are handled separately, unchanged by this module.
export function evidenceState(doc, event) {
  const findings = doc.review.findings.filter(f => event.claim_refs.includes(f.claim_id));
  const statuses = new Set(findings.map(f => f.finding));
  if (statuses.has('conflict')) return 'Sources conflict';
  if (statuses.has('unavailable')) return 'Source unavailable';
  if (statuses.has('inconclusive')) return 'Evidence inconclusive';
  if (statuses.has('qualified') || findings.some(f => f.gaps.length)) return 'Evidence has limitations';
  return event.outcome === 'confirmed' ? 'Recorded' : `Recorded outcome: ${event.outcome}`;
}

// Authored coverage can mix business coverage with private workflow commentary.
// Omit mixed paragraphs, never rewrite quoted source bytes or reviewer prose into
// new public claims. Generic qualification remains even when a note is private.
const machinery = /\b(?:copy[-_ ]review|factual[-_ ]review|fact[-_ ]check(?:er|ing)?|checker|reviewer|model|opus|sonnet|claude[-_]|candidate|snapshot|schema|digest|rule_versions|field_digest|field_path|observed_at|check_refs|claim_refs|claim[-_]|header|copy.approv|copy.editor|generation|HEADER-\d|SDLC-\d|ASD-\d)\b/i;
export function sourceLimitations(doc, event) {
  const relevant = doc.coverage.gaps.filter(g => !event || !g.affected_refs.length || g.affected_refs.includes(event.id));
  const notes = relevant.map(g => g.description).filter(text => !machinery.test(text));
  const findings = doc.review.findings.filter(f => !event || event.claim_refs.includes(f.claim_id));
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
