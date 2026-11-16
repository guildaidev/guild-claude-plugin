import test from 'node:test';
import assert from 'node:assert/strict';
import { readReviewCapturePacket } from '../scripts/review-capture.mjs';
import { reviewPacket } from '../scripts/review-io.mjs';
import { packReviewPacket, expandReviewPacket, packReviewResponse, expandReviewResponse } from '../scripts/review-codec.mjs';
import { validateCopyReview, validateFactualReview } from '../scripts/contracts.mjs';
import { concernFixture } from './concern-fixture.mjs';
import { fakeCopyReview, fakeChecker } from './fixtures.mjs';

// Synthetic host-shaped transport evidence, not proof of actual dispatch or reads.
function transport(kind, wire) {
  const binding = { status: 'completed', kind, sessionId: 'codec-fixture-session', parentAgentId: 'codec-fixture-parent',
    agentId: 'codec-fixture-child', reviewerId: kind === 'copy' ? wire.reviewer_id : wire.checker_id,
    candidateDigest: kind === 'copy' ? wire.candidate_digest : wire.factual_digest,
    dispatchUuid: 'dispatch', dispatchToolUseId: 'dispatch-tool', launchUuid: 'launch',
    completionUuid: 'completion', handbackToolUseId: 'handback-tool', receiptUuid: 'receipt' };
  const identity = { sessionId: binding.sessionId, agentId: binding.agentId, isSidechain: true };
  const parentIdentity = { ...identity, agentId: binding.parentAgentId };
  const prompt = 'Synthetic codec/capture contract test; never actual review approval.';
  const report = JSON.stringify(wire), encode = rows => rows.map(row => JSON.stringify(row)).join('\n');
  const correlation = [
    { ...parentIdentity, uuid: 'dispatch', type: 'assistant', message: { role: 'assistant', stop_reason: 'tool_use', content: [
      { type: 'tool_use', id: 'dispatch-tool', name: 'Agent', input: {
        subagent_type: kind === 'copy' ? 'guild:scenario-run-copy-editor' : 'guild:scenario-run-checker', prompt } }] } },
    { ...parentIdentity, uuid: 'launch', type: 'user', parentUuid: 'dispatch', sourceToolAssistantUUID: 'dispatch',
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'dispatch-tool', content: 'Synthetic launch.' }] },
      toolUseResult: { agentId: binding.agentId, status: 'async_launched', isAsync: true, prompt } },
  ];
  const transcript = [
    { ...identity, uuid: 'initial', parentUuid: null, type: 'user', message: { role: 'user', content: prompt } },
    { ...identity, uuid: 'completion', type: 'assistant', message: { role: 'assistant', stop_reason: 'tool_use', content: [
      { type: 'tool_use', id: 'handback-tool', name: 'SubagentHandback', input: { message: report } }] } },
    { ...identity, uuid: 'receipt', type: 'user', parentUuid: 'completion', sourceToolAssistantUUID: 'completion', toolEndsTurn: true,
      toolUseResult: { success: true, message: 'Report delivered to your caller.' },
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'handback-tool', content: [
        { type: 'text', text: '{"success":true,"message":"Report delivered to your caller."}' }] }] } },
  ];
  return { text: JSON.stringify({ capture_version: '1.0', format: 'native-handback',
    transcript: encode(transcript), correlation: encode(correlation) }), binding };
}

test('compact top-level logical identity/digest correlate before expansion, then original validators accept exact synthetic records', async () => {
  const { doc } = concernFixture();
  for (const kind of ['copy', 'fact']) {
    const result = await reviewPacket(kind, doc, '/private/review-codec-fixture/candidate.json', { compact: false });
    const packet = result.codec_version ? expandReviewPacket(result, doc) : result;
    const record = kind === 'copy' ? { ...fakeCopyReview(doc), verdict: 'blocked' }
      : await fakeChecker({ finding: 'qualified', gap: 'Synthetic source limitation, not real verification.' }).check(doc);
    const compact = packReviewPacket(packet, doc), wire = packReviewResponse(record, packet, doc);
    const input = transport(kind, wire), before = structuredClone(input);
    const captured = readReviewCapturePacket(input.text, input.binding);
    assert.deepEqual(captured.review, wire);
    assert.equal(captured.reviewText, JSON.stringify(wire));
    assert.equal(captured.provenance.review_validation, 'required-before-write');
    const expanded = expandReviewResponse(captured.review, compact, doc);
    assert.deepEqual(expanded, record);
    assert.equal((kind === 'copy' ? validateCopyReview(doc, expanded, { requirePass: false }) : validateFactualReview(doc, expanded)).ok, true);
    assert.deepEqual(input, before);
    assert.throws(() => readReviewCapturePacket(input.text, { ...input.binding, candidateDigest: '0'.repeat(64) }));
  }
});
