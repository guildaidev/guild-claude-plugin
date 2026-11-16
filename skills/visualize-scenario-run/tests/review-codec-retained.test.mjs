import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reviewPacket } from '../scripts/review-io.mjs';
import { packReviewPacket, expandReviewPacket, reviewCodecByteCounts } from '../scripts/review-codec.mjs';

// Opt-in read-only measurement of ONE exact caller-supplied retained candidate.
// No path discovery, native output parsing, fabricated feedback or source writes.
const path = process.env.REVIEW_CODEC_RETAINED_CANDIDATE;
test('retained exact candidate packets round-trip with measured serialized byte counts', { skip: !path }, async context => {
  const before = await readFile(path), candidate = JSON.parse(before.toString('utf8'));
  for (const kind of ['copy', 'fact']) {
    const result = await reviewPacket(kind, candidate, path, { compact: false });
    const packet = result.codec_version ? expandReviewPacket(result, candidate) : result;
    const packed = packReviewPacket(packet, candidate);
    assert.deepEqual(expandReviewPacket(packed, candidate), JSON.parse(JSON.stringify(packet)));
    const counts = reviewCodecByteCounts(packet, packed);
    context.diagnostic(JSON.stringify({ kind, schema_version: candidate.schema_version, ...counts,
      saved_percent: Number((100 * (1 - counts.compact_packet_bytes / counts.packet_bytes)).toFixed(2)) }));
  }
  assert.deepEqual(await readFile(path), before);
});
