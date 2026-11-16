// Local file-boundary optimization only. No model, dispatch, external reads or prose edits.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { COPY_RULE_VERSIONS, HEADER_COPY_RULE_VERSIONS, SUMMARY_HEADER_COPY_RULE_VERSIONS, copyFields, copyReviewContractFor, factualReviewContract, factualDigest } from './contracts.mjs';
import { headerPolicyFor, headerContractFor, headerTextFieldsFor } from './header-copy.mjs';
import { captureLegacyReview, readReviewCapturePacket } from './review-capture.mjs';
import { buildSourceNavigation } from './source-navigation.mjs';
import { packReviewPacket, expandReviewResponse } from './review-codec.mjs';

const referenceRoot = new URL('../references/', import.meta.url);
const sha = text => createHash('sha256').update(text).digest('hex');
const descriptor = value => JSON.parse(JSON.stringify(value, (_, item) => item instanceof RegExp ? item.source : item));
export async function reviewPacket(kind, candidate, candidatePath, options = {}) {
  if (!['copy', 'fact'].includes(kind)) throw new Error('kind');
  const names = kind === 'copy'
    ? ['copy-editor.md', 'style/routing-v2.md', 'style/asd-ste100-v1.md', 'style/economist-v1.md', 'style/sdlc-v2.md', ...(['1.7', '1.8', '1.9', '1.10'].includes(candidate.schema_version) ? [candidate.schema_version !== '1.7' ? 'style/header-copy-v1.1.md' : 'style/header-copy-v1.md'] : [])]
    : ['checker.md'];
  const references = await Promise.all(names.map(async name => {
    const content = await readFile(new URL(name, referenceRoot), 'utf8');
    // Keep native Read's per-line limit from truncating an escaped whole guide.
    return { name, sha256: sha(content), lines: content.split('\n') };
  }));
  const packet = {
    packet_version: '1.1', kind, candidate_path: resolve(candidatePath), candidate_digest: factualDigest(candidate),
    // These are the executable validator's descriptors, not executable input code.
    review_contract: descriptor(kind === 'copy' ? copyReviewContractFor(candidate) : factualReviewContract),
    response_requirements: kind === 'copy' ? {
      field_digest: 'Every passage AND finding must identify its field_path and exact supplied fields[].field_digest (SHA-256 of the entire current fields[].text, without trimming or normalization). Do not repeat original field text or add original_text. The complete text remains in this packet for review.',
      completeness: 'Return the complete review, including all passages and exemptions, even for revise/blocked. Only the author changes the candidate; never repair or replace its digest.',
    } : {
      observed_at: 'Every checks[].observed_at requires a genuine full UTC timestamp: YYYY-MM-DDTHH:mm:ss[.SSS]Z. A calendar date alone is invalid. Never add midnight, reuse an event time as a read time or invent a clock.',
      clock_scope: 'Use source-provided capture metadata and explain its scope. If a paired read for this same session supplies the capture time, cite that source and disclose that the session response has no independent capture clock. If no supported full timestamp exists, report the capability limitation rather than fabricate one.',
      completeness: 'Return one finding per claim, preserving qualifications and source-read provenance. Do not change candidate content, copy feedback or revision digests.',
    },
    references,
    ...(candidate.schema_version === '1.10' ? { concern_content_policy: {
      concern: 'Review concern.explanation as a plain explanation of the possible conflict between this event and the stated application goal. Do not replace it with event repetition or outcome enums.',
      human_fix: 'Review suggested_feedback.explanation with ASD-STE100: short active sentences, one instruction per sentence, no semicolons, at most 20 words per instruction and 25 per description. Prefer elements already introduced on the page.',
      technical_fix: 'Review suggested_feedback.text separately as the technical Claude Code prompt for the same supported change. Only this technical text enters the feedback cart. An unsupported remedy may be absent; never invent one.',
    } } : {}),
    ...(['1.7', '1.8', '1.9', '1.10'].includes(candidate.schema_version) ? { header_copy_policy: headerPolicyFor(candidate),
      header_copy_contract: descriptor(headerContractFor(candidate)),
      header_review: { field_paths: headerTextFieldsFor(candidate).map(key => `$.header_copy.${key}`),
        claim_refs: [...new Set([...candidate.header_copy.claim_refs, ...(candidate.header_copy.description_claim_refs ?? [])])],
        claims: candidate.claims.filter(claim => [...candidate.header_copy.claim_refs, ...(candidate.header_copy.description_claim_refs ?? [])].includes(claim.id)),
        requirements: candidate.schema_version !== '1.7' ? 'Check the brief GENERAL PRESENT-TENSE scenario summary against setup/task/intended behavior, NOT observed results from this run. Prefer one concise sentence. Actual results stay in run/timeline. Assess all text/references honestly; never manufacture approval or source reads. Independent source reads remain mandatory for factual judgments. Generation machinery is private, not user-facing evidence or prompt content.' : 'Review every authored header field against the policy and original specification. Check task context versus observed result, source/claim grounding and qualifiers. A display name is not official identity. Do not invent success, a trigger, delivery or readership. Independent source reads remain mandatory for the factual checker.' } } : {}),
  };
  if (kind === 'fact') {
    // This index is cached navigation, never an independent read or a read clock.
    // A bounded navigation failure does not remove the complete review input.
    let navigation;
    try { navigation = { source_navigation: buildSourceNavigation(candidate, options.navigation ?? {}) }; }
    catch (error) {
      navigation = { source_navigation_diagnostic: {
        code: typeof error?.code === 'string' && /^[a-z_]{1,64}$/.test(error.code) ? error.code : 'navigation_unavailable',
        message: 'Source navigation is unavailable; the complete candidate remains supplied. Independent authorized reads are still required.',
      } };
    }
    const full = { ...packet, candidate, ...navigation };
    return options.format === 'compact' ? packReviewPacket(full, candidate) : full;
  }
  const full = { ...packet, rule_versions: ['1.8', '1.9', '1.10'].includes(candidate.schema_version) ? SUMMARY_HEADER_COPY_RULE_VERSIONS : candidate.schema_version === '1.7' ? HEADER_COPY_RULE_VERSIONS : COPY_RULE_VERSIONS, fields: copyFields(candidate),
    semantic_context: {
      actors: candidate.actors, sessions: candidate.sessions, evidence: candidate.evidence,
      ...(['1.7', '1.8', '1.9', '1.10'].includes(candidate.schema_version) ? { original_spec: { workflow: candidate.workflow, scenario: candidate.scenario }, header_copy: candidate.header_copy } : {}),
      run_identity: Object.fromEntries(['id', 'workspace_id', 'agent_version_ids', 'application_version', 'sandbox_integrations', 'status']
        .map(key => [key, candidate.run[key]])),
      relevant_systems: candidate.workflow.relevant_systems,
      observation_window: candidate.coverage.observation_window,
      claim_evidence: candidate.claims.map(({ id, evidence_refs }) => ({ id, evidence_refs })),
      events: candidate.timeline.map(({ id, kind, actor_id, session_id, time, outcome, evidence_refs, artifact_refs, claim_refs, relationships }) =>
        ({ id, kind, actor_id, session_id, time, outcome, evidence_refs, artifact_refs, claim_refs, relationships })),
    },
  };
  return options.format === 'compact' ? packReviewPacket(full, candidate) : full;
}

// Narrow adapter for an explicitly supplied native Claude Code task transcript.
// No home-directory discovery, guessed task paths, tool-result parsing or fallback
// to earlier responses. A caller-provided file is not proof of genuine dispatch.
export function nativeReview(text, agentId) {
  return captureLegacyReview(text, agentId);
}

// Explicitly selected completed native-handback transport. Never downgrade a
// failed packet to the legacy parser, and never authenticate caller-supplied files.
export function nativeHandbackReview(packetText, expectedBinding) {
  return readReviewCapturePacket(packetText, expectedBinding);
}

// Expansion only substitutes exact bound references. Genuine judgments and
// clocks remain required and the existing full validators still run afterward.
export function expandedReview(record, matchingPacket, candidate) {
  if (record && Object.hasOwn(record, 'wire_version')) {
    if (!matchingPacket) throw new Error('compact_packet_required');
    return expandReviewResponse(record, matchingPacket, candidate);
  }
  return record;
}

export function reviewSummary(kind, review) {
  return kind === 'copy'
    ? { verdict: review.verdict, findings: review.findings,
      routes: Object.fromEntries(['asd-ste100', 'economist', 'unresolved'].map(guide => [guide, review.passages.filter(p => p.guide === guide).length])) }
    : { findings: review.findings, source_reads: review.checks.length };
}
