import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { reviewPacket } from '../scripts/review-io.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { packReviewPacket, expandReviewPacket, reviewCodecByteCounts, ReviewCodecError } from '../scripts/review-codec.mjs';
import { concernFixture } from './concern-fixture.mjs';

// Node-only deterministic regressions. No models, source services, native agent
// dispatch, application run, files, installs or changes to retained records.
const codecUrl = new URL('../scripts/review-codec.mjs', import.meta.url).href;
const ioUrl = new URL('../scripts/review-io.mjs', import.meta.url).href;
const fixtureUrl = new URL('./concern-fixture.mjs', import.meta.url).href;
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');

function lowHeapScript(size, amplify = false) {
  return `
    import assert from 'node:assert/strict';
    import { packReviewPacket, expandReviewPacket, ReviewCodecError } from ${JSON.stringify(codecUrl)};
    import { reviewPacket } from ${JSON.stringify(ioUrl)};
    import { concernFixture } from ${JSON.stringify(fixtureUrl)};
    const { doc } = concernFixture();
    const candidateBefore = Buffer.from(JSON.stringify(doc));
    const packet = await reviewPacket('fact', doc, '/private/codec-memory-fixture/candidate.json', { format: 'full' });
    const material = 'x'.repeat(${size});
    let nested = material;
    for (let index = 0; index < 70; index++) nested = { nested };
    packet.private_context = nested;
    let stage = 'pack', outcome;
    try {
      const packed = packReviewPacket(packet, doc);
      stage = 'expand';
      if (${amplify}) {
        packed.dictionary = [{ id: 'd0', value: 'x'.repeat(65536) }];
        for (let index = 1; index < 4; index++) packed.dictionary.push({ id: 'd' + index,
          value: Array.from({ length: 16 }, () => ({ $review_ref: 'd' + (index - 1) })) });
        packed.input = { $review_ref: 'd3' };
      }
      const restored = expandReviewPacket(packed, doc);
      assert.equal(${amplify}, false, 'Amplified input must fail before canonical rebinding.');
      assert.deepEqual(restored, JSON.parse(JSON.stringify(packet)));
      assert.deepEqual(restored.candidate.source_bundle, doc.source_bundle);
      assert.deepEqual(Buffer.from(JSON.stringify(restored.candidate)), candidateBefore);
      outcome = 'roundtrip';
    } catch (error) {
      assert.ok(error instanceof ReviewCodecError, error.name);
      assert.equal(error.code, 'bounds');
      assert.deepEqual(error.toJSON(), { code: 'bounds', message: 'review_codec:bounds' });
      outcome = 'safe-bounds';
    }
    let retained = packet.private_context;
    for (let index = 0; index < 70; index++) retained = retained.nested;
    assert.equal(retained, material); // No removal/shortening to squeeze it in.
    assert.deepEqual(Buffer.from(JSON.stringify(doc)), candidateBefore);
    console.log(JSON.stringify({ outcome, stage, input_bytes: Buffer.byteLength(JSON.stringify(packet)),
      max_rss_kib: process.resourceUsage().maxRSS }));
  `;
}

for (const size of [512 * 1024, 2 * 1024 * 1024]) {
  test(`128 MiB heap: ${size} private bytes under 70 unique ancestors cannot abort`, context => {
    const result = spawnSync(process.execPath, ['--max-old-space-size=128', '--input-type=module', '-e', lowHeapScript(size)],
      { encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024 });
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null, 'OOM/abort signals are not safe bounds diagnostics.');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    const measurement = JSON.parse(result.stdout);
    assert.ok(['roundtrip', 'safe-bounds'].includes(measurement.outcome));
    assert.ok(measurement.input_bytes > size && measurement.input_bytes < 64 * 1024 * 1024);
    context.diagnostic(JSON.stringify(measurement));
  });
}

test('128 MiB heap: encoded dictionary amplification fails before output/canonical repack allocation', context => {
  const result = spawnSync(process.execPath, ['--max-old-space-size=128', '--input-type=module', '-e', lowHeapScript(1024, true)],
    { encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024 });
  assert.equal(result.error, undefined); assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
  const measurement = JSON.parse(result.stdout);
  assert.equal(measurement.outcome, 'safe-bounds'); assert.equal(measurement.stage, 'expand');
  context.diagnostic(JSON.stringify(measurement));
});

test('streamed canonical bindings retain original sorted-key SHA-256, including exact JSON Unicode escapes', async () => {
  const { doc } = concernFixture();
  const packet = await reviewPacket('fact', doc, '/private/codec-memory-fixture/candidate.json', { format: 'full' });
  packet.private_context = { z: '🧭 é e\u0301 \ud800 \udc00 \ud800x \udc00 \b\t\n\f\r\u0000 \\ " /',
    a: [null, false, true, 0, 1.2, 1e30, 1e-9, { '10': 'ten', '2': 'two', '1': 'one' }] };
  const packed = packReviewPacket(packet, doc);
  assert.equal(packed.manifest.packet_sha256, hash(JSON.parse(JSON.stringify(packet))));
  assert.equal(packed.manifest.candidate_sha256, hash(doc));
  assert.equal(packed.manifest_id, hash(packed.manifest));
  assert.deepEqual(expandReviewPacket(packed, doc), JSON.parse(JSON.stringify(packet)));
});

test('cumulative work bounds apply across decode and canonical repack, not a reset at each internal phase', async () => {
  const { doc } = concernFixture();
  const packet = await reviewPacket('fact', doc, '/private/codec-memory-fixture/candidate.json', { format: 'full' });
  const packed = packReviewPacket(packet, doc);
  for (const options of [{ workBytes: 100 }, { workNodes: 10 }]) {
    assert.throws(() => packReviewPacket(packet, doc, options), error => error instanceof ReviewCodecError && error.code === 'bounds');
    assert.throws(() => expandReviewPacket(packed, doc, options), error => error instanceof ReviewCodecError && error.code === 'bounds');
  }
  let sharedBudgetObserved = false;
  for (let workBytes = 128 * 1024; workBytes <= 8 * 1024 * 1024; workBytes += 128 * 1024) {
    try { packReviewPacket(packet, doc, { workBytes }); }
    catch (error) { assert.equal(error.code, 'bounds'); continue; }
    try { expandReviewPacket(packed, doc, { workBytes }); }
    catch (error) { assert.equal(error.code, 'bounds'); sharedBudgetObserved = true; break; }
  }
  assert.equal(sharedBudgetObserved, true, 'Expansion must charge its additional decode/repack/equality work.');
});

test('structural fingerprints still compact representative repeated context and preserve the entire candidate/source bundle', async context => {
  const { input, draft } = concernFixture();
  const material = 'Exact private representative fixture 🧭.\r\n'.repeat(1000);
  input.evidence[1].content.text = material;
  input.artifacts[0].content = material; input.artifacts[0].after = material;
  const assembled = assembleCandidate(input, draft); assert.equal(assembled.ok, true);
  const doc = assembled.snapshot;
  for (const kind of ['copy', 'fact']) {
    const packet = await reviewPacket(kind, doc, '/private/codec-memory-fixture/candidate.json', { format: 'full' });
    const packed = packReviewPacket(packet, doc), restored = expandReviewPacket(packed, doc);
    assert.deepEqual(restored, JSON.parse(JSON.stringify(packet)));
    if (kind === 'fact') assert.deepEqual(restored.candidate.source_bundle, input);
    const counts = reviewCodecByteCounts(packet, packed);
    assert.ok(counts.compact_packet_bytes < counts.packet_bytes * 0.85);
    context.diagnostic(JSON.stringify({ kind, ...counts }));
  }
});
