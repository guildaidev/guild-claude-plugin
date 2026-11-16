// Fixture-safe orchestration helpers. Agent dispatch/source calls belong to the host,
// not this module. Callbacks are supplied explicitly; no hidden model or network use.
import { factualDigest, validate, validateCandidate, validateCopyReview, validateFactualReview } from './contracts.mjs';
import { createSourceGroundingReport, sourceGroundingAuthorFeedback } from './source-grounding.mjs';

export async function reviewLoop(options) {
  let initial;
  try { initial = await options.edit({ attempt: 1, previous: undefined, errors: [] }); }
  catch { return { ok: false, errors: [{ code: 'author_failure' }] }; }
  if (['1.9', '1.10'].includes(initial?.schema_version)) return contentReviewLoop({ ...options, initial });
  return legacyReviewLoop({ ...options, edit: args => args.attempt === 1 ? initial : options.edit(args) });
}

// Bounded quality work, then the SAME renderer. Reviews are never approval tokens
// for 1.9 content. Structural/source/security failures still stop output.
async function contentReviewLoop({ initial, originalBundle = initial.source_bundle, onSourceGrounding, edit, copyCheck, check, render, revise = async ({ candidate }) => candidate, maxAttempts = 3 }) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw new Error('Use one to three attempts.');
  const trace = [], diagnostics = [];
  let candidate = structuredClone(initial), copyReviews = 0;
  const content = value => {
    const { review, copy_review, copy_review_iterations, ...rest } = value;
    return rest;
  };
  candidate = content(candidate);
  const preflight = () => validateCandidate(candidate);
  if (!preflight().ok) return preflight();
  const pending = value => ['running', 'pending'].includes(value?.status);
  let copy, fact;
  while (copyReviews < 2 && typeof copyCheck === 'function') {
    const grounding = createSourceGroundingReport(candidate, originalBundle);
    const authorFeedback = grounding.ok ? sourceGroundingAuthorFeedback(candidate, originalBundle, grounding.report) : grounding;
    if (!grounding.ok || !authorFeedback.ok) {
      // Assistance failure is private, not approval or a normal-render gate. No
      // copy callback/claim is consumed without a current report.
      diagnostics.push({ kind: 'source-grounding', validation: grounding.ok ? authorFeedback : grounding });
      break;
    }
    trace.push({ operation: 'source_grounding_preflight', candidate_digest: factualDigest(candidate) });
    // Optional local author-owner notification, not another author/model dispatch.
    // Never forward this private assistance to the independent copy callback.
    const privateContext = { source_grounding_report: structuredClone(grounding.report), author_feedback: structuredClone(authorFeedback.feedback) };
    if (typeof onSourceGrounding === 'function') {
      try { await onSourceGrounding(privateContext); }
      catch { diagnostics.push({ kind: 'source-grounding-notification', validation: { ok: false, errors: [{ code: 'author_feedback_unavailable' }] } }); }
    }
    copyReviews++;
    trace.push({ operation: 'copy_check', iteration: copyReviews });
    try { copy = await copyCheck(structuredClone(candidate)); }
    catch { copy = undefined; }
    if (pending(copy)) return { ok: false, pending: true, copy_reviews: copyReviews, trace };
    const result = validateCopyReview(candidate, copy, { requirePass: false });
    diagnostics.push({ kind: 'copy', record: structuredClone(copy), validation: result });
    if (result.ok && copy.verdict === 'pass' || copyReviews === 2) break;
    candidate = content(structuredClone(await revise({ candidate: structuredClone(candidate), copy_review: structuredClone(copy), phase: 'copy', copy_reviews: copyReviews, diagnostics: structuredClone(diagnostics) })));
    trace.push({ operation: 'editorial_revision', phase: 'copy' });
    if (!preflight().ok) return preflight();
  }
  // Invalid copy feedback does not prevent the distinct factual stage.
  if (typeof check === 'function') {
    trace.push({ operation: 'independent_check' });
    try { fact = await check(structuredClone(candidate)); }
    catch { fact = undefined; }
    if (pending(fact)) return { ok: false, pending: true, copy_reviews: copyReviews, trace };
    const result = validateFactualReview(candidate, fact);
    diagnostics.push({ kind: 'fact', record: structuredClone(fact), validation: result });
    if (result.ok) {
      // Known factual problems may be qualified in one bounded author correction.
      // Any change invalidates old records; no third copy or restamped approval.
      candidate = content(structuredClone(await revise({ candidate: structuredClone(candidate), review: structuredClone(fact), copy_review: structuredClone(copy), phase: 'fact', copy_reviews: copyReviews, diagnostics: structuredClone(diagnostics) })));
      if (!preflight().ok) return preflight();
    }
  }
  let errors = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const repaired = content(structuredClone(await edit({ attempt, previous: structuredClone(candidate), errors })));
      if (factualDigest(repaired) !== factualDigest(candidate)) return { ok: false, attempts: attempt, copy_reviews: copyReviews, trace, diagnostics,
        errors: [{ path: '$', code: 'content_frozen', message: 'Render repair changed frozen content.', repair: 'Repair display only; do not start another copy or author loop.' }] };
      candidate = repaired;
    }
    const snapshot = { ...candidate, ...(copy !== undefined ? { copy_review: copy } : {}), ...(fact !== undefined ? { review: fact } : {}), ...(copyReviews ? { copy_review_iterations: copyReviews } : {}) };
    const validated = validate(snapshot);
    if (!validated.ok) return { ...validated, copy_reviews: copyReviews, trace, diagnostics };
    const result = await render(structuredClone(snapshot));
    trace.push({ attempt, operation: 'render', ok: result.ok });
    if (result.ok) return { ...result, attempts: attempt, copy_reviews: copyReviews, trace, diagnostics };
    errors = result.errors;
  }
  return { ok: false, attempts: maxAttempts, copy_reviews: copyReviews, trace, diagnostics, errors, exhausted: true };
}

async function legacyReviewLoop({ edit, copyCheck, check, render, revise = async ({ candidate }) => candidate, maxAttempts = 3 }) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw new Error('Use one to three attempts.');
  if (typeof copyCheck !== 'function' || typeof check !== 'function') return { ok: false, attempts: 0, trace: [], errors: [{ path: '$workflow', code: 'review_capability', message: 'Distinct copy and factual review callbacks are required.', repair: 'Establish both reviewers; never substitute a fabricated pass.' }] };
  let previous, review, copyReview, digest, errors = [], copyReviews = 0;
  const trace = [];
  const limit = attempt => ({ ok: false, attempts: attempt, copy_reviews: copyReviews, trace,
    copy_review: structuredClone(copyReview), review: structuredClone(review),
    errors: [{ path: '$.copy_review', code: 'copy_review_limit', message: 'Candidate content changed after both copy reviews.', repair: 'Do not obtain a third review or render stale factual bindings. Keep the second reviewed text and report the necessary factual correction.' }] });
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let candidate = structuredClone(await edit({ attempt, previous: structuredClone(previous), errors: structuredClone(errors) }));
      // Authoring may receive a prior reviewed candidate for a display-only repair.
      // Supplied reviews are never trusted as a replacement for actual callbacks.
      const { review: suppliedFact, copy_review: suppliedCopy, copy_review_iterations: suppliedCount, ...unreviewed } = candidate;
      candidate = unreviewed;
      while (true) {
        if (!['1.7', '1.8'].includes(candidate.schema_version)) return { ok: false, attempts: attempt, copy_reviews: copyReviews, trace, errors: [{ path: '$.schema_version', code: 'workflow_version', message: 'Use authored-header snapshot 1.8 (or explicit historical 1.7).', repair: 'Assemble a new current candidate; never relabel a historical snapshot.' }] };
        const preflight = validateCandidate(candidate);
        if (!preflight.ok) return { ...preflight, attempts: attempt, copy_reviews: copyReviews, trace };
        const nextDigest = factualDigest(candidate);
        if (nextDigest !== digest) { copyReview = undefined; review = undefined; digest = nextDigest; }
        if (!copyReview) {
          if (copyReviews >= 2) return limit(attempt);
          copyReviews++;
          trace.push({ attempt, operation: 'copy_check', iteration: copyReviews });
          copyReview = await copyCheck(structuredClone(candidate));
        }
        const copyValidation = validateCopyReview(candidate, copyReview, { requirePass: false });
        if (!copyValidation.ok) return { ...copyValidation, attempts: attempt, copy_reviews: copyReviews, trace };
        const revisedCandidate = async phase => {
          const revised = await revise({ candidate: structuredClone({ ...candidate, copy_review: copyReview, ...(review ? { review } : {}) }), review: structuredClone(review), copy_review: structuredClone(copyReview), phase, attempt, copy_reviews: copyReviews });
          const { review: ignoredFact, copy_review: ignoredCopy, copy_review_iterations: ignoredCount, ...content } = structuredClone(revised);
          return content;
        };
        if (copyReview.verdict !== 'pass' && copyReviews < 2) {
          candidate = await revisedCandidate('copy');
          trace.push({ attempt, operation: 'editorial_revision', phase: 'copy' });
          copyReview = undefined; review = undefined;
          continue;
        }
        if (!review) {
          review = await check(structuredClone({ ...candidate, copy_review: copyReview }));
          trace.push({ attempt, operation: 'independent_check' });
        }
        const factualValidation = validateFactualReview(candidate, review);
        if (!factualValidation.ok) return { ...factualValidation, attempts: attempt, copy_reviews: copyReviews, trace };
        const revised = await revisedCandidate('fact');
        if (factualDigest(revised) !== digest) {
          trace.push({ attempt, operation: 'editorial_revision', phase: 'fact' });
          if (copyReviews >= 2) return limit(attempt);
          candidate = revised;
          continue;
        }
        candidate = revised;
        break;
      }
      candidate.review = structuredClone(review);
      candidate.copy_review = structuredClone(copyReview);
      candidate.copy_review_iterations = copyReviews;
      const finalValidation = validate(candidate);
      if (!finalValidation.ok) return { ...finalValidation, attempts: attempt, copy_reviews: copyReviews, trace };
      const result = await render(structuredClone(candidate));
      trace.push({ attempt, operation: 'render', ok: result.ok });
      if (result.ok) return { ...result, attempts: attempt, copy_reviews: copyReviews, trace };
      errors = result.errors;
      previous = candidate;
    } catch {
      return { ok: false, attempts: attempt, copy_reviews: copyReviews, trace, errors: [{ path: '$workflow', code: 'workflow_failure', message: 'Author, copy editor, fact checker or renderer failed.', repair: 'Return safe diagnostics to the parent; do not repeat writes or claim success.' }] };
    }
  }
  return { ok: false, attempts: maxAttempts, copy_reviews: copyReviews, errors, trace, exhausted: true };
}

export async function presentArtifact(result, { host, openBrowser, openSidebar, sidebarVerified = false }) {
  if (!result.ok) return { rendered: false, presented: false, errors: result.errors };
  const route = host !== 'terminal' && sidebarVerified && openSidebar ? 'sidebar' : 'browser';
  const open = route === 'sidebar' ? openSidebar : openBrowser;
  if (!open) return { rendered: true, presented: false, artifact_path: result.artifact_path, route, feedback: 'copy-to-chat', reason: 'No supported presentation capability is available.' };
  try {
    // Dispatch alone is not proof of presentation; adapter must report observation.
    const observed = await open(result.artifact_path);
    return { rendered: true, presented: observed?.observed === true, artifact_path: result.artifact_path, route, feedback: 'copy-to-chat', ...(observed?.observed === true ? {} : { reason: 'Open was attempted but successful presentation was not observed.' }) };
  } catch {
    return { rendered: true, presented: false, artifact_path: result.artifact_path, route, feedback: 'copy-to-chat', reason: 'Presentation failed; return the artifact path to the parent.' };
  }
}
