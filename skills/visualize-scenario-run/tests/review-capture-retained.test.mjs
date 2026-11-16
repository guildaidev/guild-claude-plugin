// Opt-in read-only regression. Explicit paths only: no home/transcript discovery.
// No retained script, config, model, native host or application is executed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readReviewCapturePacket } from '../scripts/review-capture.mjs';
import { nativeReview } from '../scripts/review-io.mjs';

const parentPath = process.env.REVIEW_CAPTURE_PARENT_JSONL;
const cases = [
  { env: 'REVIEW_CAPTURE_COPY1_JSONL', kind: 'copy', agentId: 'af35e5af087dfaf18', reviewerId: 'copy-reviewer-1',
    candidateDigest: '4814dcaa8746460ad2643ff017844c2f2dfccd376db0e39828d1af35b0c4c118',
    dispatchUuid: '0641eb03-f131-4175-aadb-c1f11993f8e3', dispatchToolUseId: 'toolu_01SwmG5JqvcFuXz7QRtj3QjQ', launchUuid: '7e49deec-973d-466c-aeee-1e70a52e479e',
    completionUuid: '00091a82-74ac-45aa-8b89-684fd103e45e', handbackToolUseId: 'toolu_013imTTnvoDfwi9XFEtAgU2E', receiptUuid: '1a69bee7-7e27-405f-8f6e-5621ab8b1f19',
    forwardUuid: '862d06fe-ca06-4708-aefb-0e30382633c3', historicalParentLines: 99 },
  { env: 'REVIEW_CAPTURE_COPY2_JSONL', kind: 'copy', agentId: 'a8b27298378cbeb6d', reviewerId: 'copy-reviewer-2',
    candidateDigest: '3e4db1c7d4dce7b3ac2318d20e4e0437ec34a8c8cb303eef3e0928c062a629eb',
    dispatchUuid: 'dbbca69a-035b-407b-8d2d-ec7abcfdd9a3', dispatchToolUseId: 'toolu_017ozH8ZCvfAcVRMLnxYDtyq', launchUuid: '1874131f-9970-4649-ad12-3bd4a136a6a5',
    completionUuid: '5679c32a-6017-4df3-ad43-8ed4be9f3787', handbackToolUseId: 'toolu_01Pf6weVVSWwwYDDShhttwvR', receiptUuid: 'fb43f7c9-a63c-4ae2-8d17-5581634d5b6d',
    forwardUuid: '67bbf57a-4f61-4dce-99ae-e2f88b0bebdf' },
  { env: 'REVIEW_CAPTURE_FACT_JSONL', kind: 'fact', agentId: 'a2c96c8629a012a54', reviewerId: 'fact-checker-1',
    candidateDigest: '3e4db1c7d4dce7b3ac2318d20e4e0437ec34a8c8cb303eef3e0928c062a629eb',
    dispatchUuid: 'd3212e40-a7a8-4ca2-8285-b6e03d330e7e', dispatchToolUseId: 'toolu_01AnwtEMh2Dkb9NvhWJCVjn1', launchUuid: 'abf30fe0-a00a-4758-a150-3156fde436a1',
    completionUuid: '9c441cbe-3ff9-473b-83ab-2e5f411cf0c9', handbackToolUseId: 'toolu_01A5i1JSZy5MR3ALCfLhyxVr', receiptUuid: '34f7102e-a538-45b9-9605-4981e69cc38a',
    forwardUuid: 'b1a3193d-5d2d-4d8d-9bec-f8d59e8892ba' },
];
for (const c of cases) test(`retained ${c.reviewerId}: exact native and forwarded report, actual identity correlation`, {
  skip: !(parentPath && process.env[c.env]) && 'Supply explicit retained parent and child JSONL paths.',
}, async () => {
  const transcript = await readFile(process.env[c.env], 'utf8'), fullParent = await readFile(parentPath, 'utf8');
  // The first response is tested at its historical pre-supersession boundary,
  // never relabelled as the current review of candidate 2.
  const correlation = c.historicalParentLines ? fullParent.split('\n').slice(0, c.historicalParentLines).join('\n') : fullParent;
  const binding = { ...c, status: 'completed', sessionId: '7e163dd8-e5f2-46d6-aba6-6ded349906fc', parentAgentId: 'a1c8142b2480b2ddb' };
  const rows = transcript.trim().split('\n').map(JSON.parse), original = rows.find(row => row.uuid === c.completionUuid)
    .message.content.find(block => block.type === 'tool_use' && block.id === c.handbackToolUseId).input.message;
  const genuine = JSON.parse(original);
  assert.throws(() => nativeReview(transcript, c.agentId), 'The original parser rejects the actual final user receipt.');
  for (const format of ['native-handback', 'forwarded-handback']) {
    const packet = JSON.stringify({ capture_version: '1.0', format, transcript, correlation });
    const result = readReviewCapturePacket(packet, binding);
    assert.deepEqual(result.review, genuine); assert.equal(result.reviewText, original);
    assert.deepEqual(JSON.parse(JSON.stringify(result.review)), genuine);
    if (c.kind === 'fact') {
      assert.equal(result.review.capability_diagnostic.code, 'observed_at_unavailable');
      assert.ok(result.review.checks.every(check => check.observed_at === null), 'Never synthesize a read clock.');
    }
    for (const wrong of [{ agentId: 'other' }, { parentAgentId: 'other' }, { dispatchToolUseId: 'other' },
      { candidateDigest: '0'.repeat(64) }, { receiptUuid: 'other' }]) {
      assert.throws(() => readReviewCapturePacket(packet, { ...binding, ...wrong }));
    }
    if (c.historicalParentLines) assert.throws(() => readReviewCapturePacket(JSON.stringify({ capture_version: '1.0', format, transcript, correlation: fullParent }), binding), { code: 'superseded' });
  }
});
