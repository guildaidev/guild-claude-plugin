// Node-only validated public projection. The shared browser runtime stays pure.
import { feedbackContext } from './feedback.mjs';
import { factualDigest, prepareRenderSnapshot } from './contracts.mjs';

export function validatedFeedbackContext(doc) {
  // Historical display projections were already validated against ORIGINAL bytes.
  if (!['1.9', '1.10'].includes(doc.schema_version)) return feedbackContext(doc);
  const prepared = prepareRenderSnapshot(doc);
  if (!prepared.ok) throw new Error('Invalid render content.');
  return feedbackContext(prepared.snapshot, factualDigest(doc));
}
