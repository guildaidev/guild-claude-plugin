// Fixture-safe orchestration helpers. Agent dispatch/source calls belong to the host,
// not this module. Callbacks are supplied explicitly; no hidden model or network use.
import { factualDigest, validate, validateCandidate, validateCopyReview, validateFactualReview } from './contracts.mjs';

export async function reviewLoop({ edit, copyCheck, check, render, revise = async ({ candidate }) => candidate, maxAttempts = 3 }) {
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
