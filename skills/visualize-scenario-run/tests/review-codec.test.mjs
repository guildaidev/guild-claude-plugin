import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reviewPacket } from '../scripts/review-io.mjs';
import { copyFields, factualDigest, validateCopyReview, validateFactualReview } from '../scripts/contracts.mjs';
import { REVIEW_CODEC_LIMITS, packReviewPacket, expandReviewPacket, packReviewResponse,
  expandReviewResponse, reviewResponseContract, reviewCodecByteCounts } from '../scripts/review-codec.mjs';
import { candidate, sourceBoundCandidate, fakeCopyReview, fakeChecker } from './fixtures.mjs';
import { concernFixture } from './concern-fixture.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';

// Deterministic contract fixtures only. No native dispatch, model, application,
// external read, approval, source write, server or install is performed here.
const clone = value => JSON.parse(JSON.stringify(value));
const sha = text => createHash('sha256').update(text).digest('hex');
const packetFor = async (kind, doc) => {
  const packet = await reviewPacket(kind, doc, '/private/review-codec-fixture/candidate.json', { compact: false });
  return packet.codec_version ? expandReviewPacket(packet, doc) : packet;
};
const copyFixture = async () => {
  const { doc } = concernFixture(), packet = await packetFor('copy', doc), review = fakeCopyReview(doc);
  review.verdict = 'blocked';
  const passage = review.passages[0];
  Object.assign(passage, { guide: 'unresolved', routing_reason: 'Synthetic ambiguous routing: preserve the exact qualifier.\r\n第二行 🧭',
    sdlc_review: 'blocked', exceptions: ['Synthetic exception: retain negation.', 'Do not infer a completed effect.'] });
  review.findings.push({ field_path: passage.field_path, field_digest: passage.field_digest, rule_group: 'meaning',
    rule_id: 'SYNTHETIC-SCOPE', severity: 'required', explanation: 'The supplied scope is ambiguous; this fixture does not approve it.',
    suggestion: 'Ask the author to establish the supported scope.\nDo not guess.', semantic_risk: 'possible' });
  review.exemptions[0].reason = 'Keep the exact original name, including Unicode and whitespace.';
  return { doc, packet, review, wire: packReviewResponse(review, packet, doc) };
};
const factFixture = async () => {
  const { doc } = concernFixture(), packet = await packetFor('fact', doc);
  const checker = fakeChecker({ finding: 'qualified', gap: 'Synthetic reader cannot establish delivery or causation.' });
  const review = await checker.check(doc);
  return { doc, packet, review, wire: packReviewResponse(review, packet, doc) };
};

test('both packet kinds round-trip every JSON field under original 1.7–1.10 candidate contracts', async () => {
  const v18 = sourceBoundCandidate(); delete v18.source_bundle; v18.schema_version = '1.8';
  for (const doc of [candidate(), v18, sourceBoundCandidate(), concernFixture().doc]) {
    for (const kind of ['copy', 'fact']) {
      const packet = await packetFor(kind, doc), before = clone(packet), candidateBefore = clone(doc);
      const packed = packReviewPacket(packet, doc);
      assert.deepEqual(expandReviewPacket(clone(packed), clone(doc)), before);
      assert.deepEqual(packReviewPacket(packet, doc), packed);
      assert.deepEqual(clone(packet), before); assert.deepEqual(doc, candidateBefore);
      assert.deepEqual(packed.manifest.fields.map(({ id, ...field }) => field),
        copyFields(doc).map(({ text, ...field }) => field));
      assert.equal(packed.manifest.packet_version, '1.1');
      assert.equal(packed.manifest.candidate_schema_version, doc.schema_version);
      assert.equal(packed.manifest.candidate_digest, factualDigest(doc));
      if (kind === 'fact') assert.deepEqual(expandReviewPacket(packed, doc).candidate, doc);
    }
  }
});

test('full semantic/rule/source context and extensions survive, with repeated large material physically stored once', async () => {
  const { doc } = concernFixture(), packet = await packetFor('fact', doc);
  const material = 'Synthetic duplicate private material: keep CRLF\r\ncombining e\u0301 / é / 🧭 / \u0000 / lone \ud800.\n'.repeat(100);
  packet.additional_private_context = { first: { text: material }, second: { text: material }, nested: [material, material] };
  packet.literal_data = { $review_ref: 'not-a-reference', $review_literal: [['duplicate', 1], ['duplicate', 2]],
    nested: JSON.parse('{"__proto__":{"literal":"safe"}}') };
  const packed = packReviewPacket(packet, doc), serialized = JSON.stringify(packed);
  assert.equal(serialized.split(JSON.stringify(material)).length - 1, 1);
  assert.deepEqual(expandReviewPacket(packed, doc), packet);
  assert.deepEqual(expandReviewPacket(packed, doc).references, packet.references);
  assert.equal({}.literal, undefined);
});

test('exact Unicode artifact bytes and duplicated private source_bundle remain complete, independently resolved JSON values', async () => {
  const { input, draft } = concernFixture();
  const verbatim = 'Private fixture only\r\n\t e\u0301 ≠ é 🧭\u0000 {"$review_ref":"ordinary text"}\n'.repeat(500);
  input.evidence[1].content.text = verbatim;
  input.artifacts[0].content = verbatim; input.artifacts[0].after = verbatim;
  const assembled = assembleCandidate(input, draft);
  assert.equal(assembled.ok, true);
  const doc = assembled.snapshot, originalBuffer = Buffer.from(JSON.stringify(doc));
  for (const kind of ['copy', 'fact']) {
    const packet = await packetFor(kind, doc), packed = packReviewPacket(packet, doc);
    const restored = expandReviewPacket(packed, doc);
    assert.deepEqual(restored, clone(packet));
    assert.ok(JSON.stringify(packed).length < JSON.stringify(packet).length);
    if (kind === 'fact') {
      assert.deepEqual(Buffer.from(JSON.stringify(restored.candidate)), originalBuffer);
      assert.equal(restored.candidate.source_bundle.artifacts[0].content, verbatim);
      assert.equal(restored.candidate.artifacts[0].after, verbatim);
      assert.notEqual(restored.candidate.evidence, restored.candidate.source_bundle.evidence);
      restored.candidate.evidence[1].content.text = 'A change in one decoded JSON location';
      assert.equal(restored.candidate.source_bundle.evidence[1].content.text, verbatim);
    }
  }
  assert.deepEqual(Buffer.from(JSON.stringify(doc)), originalBuffer);
});

test('copy response expansion preserves genuine blocked judgments, findings, exceptions, severity, semantic risk and order', async () => {
  const { doc, packet, review, wire } = await copyFixture();
  review.findings.push({ ...review.findings[0], severity: 'advisory', semantic_risk: 'changes_meaning',
    explanation: 'Second separate synthetic issue for the same field.' });
  review.passages.reverse(); review.exemptions.reverse();
  const compact = packReviewResponse(review, packet, doc), expanded = expandReviewResponse(compact, packet, doc);
  assert.deepEqual(expanded, review);
  assert.deepEqual(expandReviewResponse(compact, packReviewPacket(packet, doc), doc), review);
  assert.equal(expanded.verdict, 'blocked');
  assert.equal(validateCopyReview(doc, expanded, { requirePass: false }).ok, true);
  assert.equal(validateCopyReview(doc, expanded).ok, false);
  assert.ok(wire.passages.every(passage => !Object.hasOwn(passage, 'field_digest') && !Object.hasOwn(passage, 'field_path')));
  assert.equal(wire.reviewer_id, review.reviewer_id);
  assert.equal(wire.candidate_digest, review.candidate_digest);
  assert.equal(wire.wire_version, '1.0');
  assert.equal(wire.passages.length + wire.exemptions.length, copyFields(doc).length);
  assert.ok(JSON.stringify(compact).length < JSON.stringify(review).length);
});

test('factual response aliases only claim/checker identities; source calls, provenance, times, gaps and finding order stay exact', async () => {
  const { doc, packet, review } = await factFixture();
  review.findings.reverse(); review.checks.reverse();
  const compact = packReviewResponse(review, packet, doc), expanded = expandReviewResponse(compact, packet, doc);
  assert.deepEqual(expanded, review);
  assert.equal(validateFactualReview(doc, expanded).ok, true);
  assert.ok(compact.findings.every(finding => /^c[1-9][0-9]*$/.test(finding.claim_id)));
  assert.ok(compact.checks.every(check => !Object.hasOwn(check, 'checker_id')));
  assert.equal(compact.checker_id, review.checker_id);
  assert.equal(compact.factual_digest, review.factual_digest);
  assert.deepEqual(compact.checks.map(check => check.observed_at), review.checks.map(check => check.observed_at));
});

test('manifest binds exact candidate including display excluded by factualDigest, schema, guides, contract and inventory', async () => {
  const { doc, packet, wire } = await copyFixture();
  const displayChanged = clone(doc); displayChanged.display.compact = !displayChanged.display.compact;
  assert.equal(factualDigest(displayChanged), factualDigest(doc));
  assert.throws(() => expandReviewResponse(wire, packet, displayChanged), /binding/);
  const staleDigest = clone(wire); staleDigest.candidate_digest = '0'.repeat(64);
  assert.throws(() => expandReviewResponse(staleDigest, packet, doc), /binding/);
  const guideChanged = clone(packet);
  guideChanged.references[0].lines.push('Synthetic new rule; not the reviewed rule.');
  guideChanged.references[0].sha256 = sha(guideChanged.references[0].lines.join('\n'));
  assert.throws(() => expandReviewResponse(wire, guideChanged, doc), /binding/);
  for (const change of [p => { p.review_contract.fields.verdict.values.push('skip'); },
    p => { p.fields.pop(); }, p => { p.fields[0].text += ' changed'; },
    p => { p.rule_versions.sdlc = 'scenario-run-v1'; }, p => { p.packet_version = 'future'; },
    p => { p.semantic_context.original_spec.workflow.title += ' mixed candidate'; },
    p => { p.header_review.claims = []; }, p => { p.references[0].lines[0] += ' changed'; }]) {
    const changed = clone(packet); change(changed);
    assert.throws(() => packReviewPacket(changed, doc), /review_codec:/);
  }
});

test('mixed or changed factual candidates, stale response ids and mixed copy/fact wire kinds are rejected', async () => {
  const { doc, packet, wire } = await factFixture();
  const changedPacket = clone(packet); changedPacket.candidate.summary += ' Changed candidate.';
  assert.throws(() => packReviewPacket(changedPacket, doc), /candidate_content/);
  const stale = clone(wire); stale.manifest_digest = '0'.repeat(64);
  assert.throws(() => expandReviewResponse(stale, packet, doc), /binding/);
  const staleDigest = clone(wire); staleDigest.factual_digest = '0'.repeat(64);
  assert.throws(() => expandReviewResponse(staleDigest, packet, doc), /binding/);
  const copy = await packetFor('copy', doc);
  assert.throws(() => expandReviewResponse(wire, copy, doc), /keys|binding/);
  assert.throws(() => expandReviewPacket(packReviewPacket(packet, doc), sourceBoundCandidate()), /review_codec:/);
});

test('unknown, duplicate, forward and cyclic dictionary refs, literal duplicate keys and unused definitions fail closed', async () => {
  const { doc, packet } = await factFixture(), packed = packReviewPacket(packet, doc);
  for (const change of [
    p => { p.input = { $review_ref: 'd999999' }; },
    p => { p.input = { $review_ref: 'd00' }; },
    p => { p.dictionary = [{ id: 'd0', value: { $review_ref: 'd0' } }]; p.input = { $review_ref: 'd0' }; },
    p => { p.dictionary = [{ id: 'd0', value: { $review_ref: 'd1' } }, { id: 'd1', value: 'forward' }]; p.input = { $review_ref: 'd0' }; },
    p => { p.dictionary.push({ ...p.dictionary[0] }); },
    p => { p.input = { $review_ref: 'd0', unknown: true }; },
    p => { p.input = { $review_literal: [['x', 1], ['x', 2]] }; },
    p => { p.dictionary[0].value = 'Tampered payload, not the original source context.'; },
    p => { p.dictionary.push({ id: `d${p.dictionary.length}`, value: 'unused hidden material' }); },
  ]) {
    const changed = clone(packed); change(changed);
    assert.throws(() => expandReviewPacket(changed, doc), /review_codec:/);
  }
});

test('unknown packet-envelope/manifest/descriptor properties and duplicate or swapped manifest ids are rejected', async () => {
  const { doc, packet } = await copyFixture(), packed = packReviewPacket(packet, doc);
  for (const change of [p => { p.unknown = true; }, p => { p.manifest.unknown = true; },
    p => { p.manifest.fields[1].id = p.manifest.fields[0].id; },
    p => { [p.manifest.fields[0], p.manifest.fields[1]] = [p.manifest.fields[1], p.manifest.fields[0]]; },
    p => { p.manifest.claims.push(p.manifest.claims[0]); },
    p => { p.response_contract.fields.verdict.values.push('skip'); },
    p => { p.resolution = 'Do not read the source context.'; }]) {
    const changed = clone(packed); change(changed);
    assert.throws(() => expandReviewPacket(changed, doc), /review_codec:/);
  }
});

test('copy aliases cannot invent coverage, exempt authored passages, review protected text or duplicate a route', async () => {
  const { doc, packet, wire } = await copyFixture();
  const protectedId = wire.exemptions[0].field_id, authoredId = wire.passages[0].field_id;
  for (const change of [r => { r.passages.pop(); }, r => { r.exemptions.pop(); },
    r => { r.passages.push(r.passages[0]); }, r => { r.passages[0].field_id = 'f999999'; },
    r => { r.passages[0].field_id = protectedId; }, r => { r.exemptions[0].field_id = authoredId; },
    r => { r.passages[0].field_id = 'f01'; }, r => { r.passages[0].field_id = authoredId.toUpperCase(); }]) {
    const changed = clone(wire); change(changed);
    assert.throws(() => expandReviewResponse(changed, packet, doc), /review_codec:/);
  }
});

test('expansion cannot supply missing copy judgments or suppress unexpected output keys', async () => {
  const { doc, packet, wire } = await copyFixture();
  for (const change of [r => { delete r.verdict; }, r => { delete r.candidate_digest; }, r => { delete r.passages[0].routing_reason; },
    r => { delete r.passages[0].sdlc_review; }, r => { delete r.passages[0].exceptions; },
    r => { delete r.exemptions[0].reason; }, r => { delete r.findings[0].semantic_risk; },
    r => { r.findings[0].default_approval = true; }, r => { r.passages[0].field_digest = '0'.repeat(64); },
    r => { r.unknown = true; }, r => { r.manifest_id = r.manifest_digest; }]) {
    const changed = clone(wire); change(changed);
    assert.throws(() => expandReviewResponse(changed, packet, doc), /keys/);
  }
});

test('existing production routing, independence, severity and semantic-risk rules remain authoritative', async () => {
  const { doc, packet, wire } = await copyFixture();
  const fixPath = '$.timeline[1].suggested_feedback.explanation';
  const fixId = packReviewPacket(packet, doc).manifest.fields.find(field => field.field_path === fixPath).id;
  for (const change of [r => { r.reviewer_id = doc.editor_id; }, r => { r.reviewer_id = doc.parent_agent_id; },
    r => { r.verdict = 'pass'; }, r => { r.passages[0].guide = 'asd-ste100'; },
    r => { r.passages.find(p => p.field_id === fixId).guide = 'economist'; },
    r => { r.findings[0].rule_group = 'economist'; }, r => { r.findings[0].severity = 'minor'; },
    r => { r.findings[0].semantic_risk = 'approved'; }, r => { r.passages[0].guide = ['asd-ste100', 'economist']; }]) {
    const changed = clone(wire); change(changed);
    assert.throws(() => expandReviewResponse(changed, packet, doc), /review/);
  }
});

test('factual aliases cannot omit or duplicate claims or fabricate missing check traces/timestamps/identities', async () => {
  const { doc, packet, wire } = await factFixture();
  for (const change of [r => { r.findings.pop(); }, r => { r.findings.push(r.findings[0]); },
    r => { r.findings[0].claim_id = 'c99999'; }, r => { r.findings[0].claim_id = doc.claims[0].id; },
    r => { r.checks = []; }, r => { r.findings[0].check_refs = ['unknown-read']; },
    r => { r.findings[0].gaps = []; }, r => { delete r.checks[0].observed_at; },
    r => { r.checks[0].observed_at = '2026-01-01'; }, r => { r.checks[0].operation = 'write'; },
    r => { r.checker_id = doc.editor_id; }, r => { r.checks[0].checker_id = 'someone-else'; },
    r => { r.checks[0].unknown = true; }, r => { delete r.findings[0].explanation; }]) {
    const changed = clone(wire); change(changed);
    assert.throws(() => expandReviewResponse(changed, packet, doc), /review_codec:/);
  }
});

test('packing malformed expanded feedback fails instead of repairing judgments or replacing stale digests', async () => {
  const { doc, packet, review } = await copyFixture();
  for (const change of [r => { r.candidate_digest = '0'.repeat(64); }, r => { r.passages.pop(); },
    r => { r.passages[0].field_digest = '0'.repeat(64); }, r => { r.unknown = true; }]) {
    const changed = clone(review); change(changed);
    assert.throws(() => packReviewResponse(changed, packet, doc), /review/);
  }
});

test('bounded JSON handling rejects cycles, native buffers, sparse arrays and accessors without leaking private data', async () => {
  const { doc, packet } = await factFixture();
  const cycle = {}; cycle.self = cycle;
  const accessor = {}; Object.defineProperty(accessor, 'private', { enumerable: true, get() { throw new Error('SHOULD_NOT_EXECUTE'); } });
  const sparse = Array(2); sparse[1] = 'value';
  for (const value of [cycle, Buffer.from('PRIVATE_CODEC_MATERIAL'), new Uint8Array([1, 2]), new Date(),
    Number.NaN, Number.POSITIVE_INFINITY, 10n, sparse, accessor]) {
    const changed = { ...packet, private_test_buffer: value };
    assert.throws(() => packReviewPacket(changed, doc), error => {
      assert.match(error.message, /^review_codec:/);
      assert.doesNotMatch(error.message, /PRIVATE_CODEC_MATERIAL|SHOULD_NOT_EXECUTE/);
      return true;
    });
  }
});

test('hard byte/node/depth/reference bounds reject rather than truncate, including amplified dictionary payloads', async () => {
  const { doc, packet } = await factFixture(), packed = packReviewPacket(packet, doc);
  for (const options of [{ bytes: 100 }, { nodes: 10 }, { depth: 2 }, { references: 1 }]) {
    assert.throws(() => packReviewPacket(packet, doc, options), /bounds/);
  }
  for (const options of [{ bytes: REVIEW_CODEC_LIMITS.bytes + 1 }, { nodes: 0 }, { depth: Infinity }, { unknown: 1 }])
    assert.throws(() => packReviewPacket(packet, doc, options), /limits|keys/);
  const bomb = clone(packed);
  bomb.dictionary = [{ id: 'd0', value: 'Repeated private string of bounded size.' }];
  for (let i = 1; i < 5; i++) bomb.dictionary.push({ id: `d${i}`, value: Array.from({ length: 20 }, () => ({ $review_ref: `d${i - 1}` })) });
  bomb.input = { $review_ref: 'd4' };
  assert.throws(() => expandReviewPacket(bomb, doc, { nodes: 5000 }), /bounds/);
  assert.deepEqual(expandReviewPacket(packed, doc), packet);
});

test('response descriptors are closed and contain all genuine judgment fields; counters measure actual serialized bytes', async () => {
  const { doc, packet, review, wire } = await copyFixture(), packed = packReviewPacket(packet, doc);
  const contract = reviewResponseContract('copy');
  assert.deepEqual(contract.fields.passages.items.fields.exceptions, { type: 'array', items: { type: 'string', min: 1 }, min: 0 });
  assert.ok(contract.fields.findings.items.fields.severity);
  assert.ok(contract.fields.findings.items.fields.semantic_risk);
  assert.ok(reviewResponseContract('fact').fields.checks.items.fields.observed_at);
  assert.throws(() => reviewResponseContract('unknown'), /kind/);
  const counts = reviewCodecByteCounts(packet, packed, review, wire);
  assert.equal(counts.compact_response_bytes, Buffer.byteLength(JSON.stringify(wire)));
  assert.equal(counts.packet_bytes, Buffer.byteLength(JSON.stringify(packet)));
  assert.equal(counts.compact_packet_bytes, Buffer.byteLength(JSON.stringify(packed)));
});
