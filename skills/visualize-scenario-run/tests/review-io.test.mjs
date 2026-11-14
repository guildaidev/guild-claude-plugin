import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { inspect } from '../scripts/inspect.mjs';
import { nativeReview } from '../scripts/review-io.mjs';
import { copyFields, HEADER_COPY_RULE_VERSIONS, validate, validateCandidate, validateFactualReview, validateCopyReview } from '../scripts/contracts.mjs';
import { snapshot } from './fixtures.mjs';

const agent = 'native-reviewer-1';
const row = (body, extra = {}) => ({ type: 'assistant', agentId: agent, isSidechain: true,
  message: { role: 'assistant', stop_reason: 'end_turn', content: [{ type: 'text', text: body }] }, ...extra });
const transcript = (review, fenced = false) => JSON.stringify(row(fenced ? `\`\`\`json\n${JSON.stringify(review)}\n\`\`\`` : JSON.stringify(review)));

test('focused packets retain complete copy coverage, semantic evidence, pinned rules and exact fact candidate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-packet-'));
  try {
    const { review, copy_review, copy_review_iterations, ...candidate } = await snapshot();
    const original = structuredClone(candidate), input = join(dir, 'candidate.json');
    await writeFile(input, JSON.stringify(candidate));
    assert.equal(validateCandidate(candidate).ok, true);
    for (const kind of ['copy', 'fact']) {
      const output = join(dir, `${kind}.json`);
      const result = await inspect(`packet-${kind}`, input, output);
      assert.equal(result.ok, true);
      assert.equal((await stat(output)).mode & 0o777, 0o600);
      const packet = JSON.parse(await readFile(output, 'utf8'));
      assert.equal(packet.candidate_digest, review.factual_digest);
      assert.equal(packet.packet_version, '1.1');
      assert.equal(packet.candidate_path, input);
      for (const source of packet.references) assert.equal(source.sha256, createHash('sha256').update(source.lines.join('\n')).digest('hex'));
      if (kind === 'copy') {
        assert.deepEqual(packet.fields, copyFields(candidate));
        assert.deepEqual(packet.semantic_context.evidence, candidate.evidence);
        assert.deepEqual(packet.rule_versions, HEADER_COPY_RULE_VERSIONS);
        assert.equal(packet.references.length, 6);
        assert.equal(packet.review_contract.fields.reviewer_id.pattern, '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$');
        assert.match(packet.response_requirements.field_digest, /fields\[\]\.field_digest/);
        assert.equal(packet.response_requirements.original_text, undefined);
        assert.ok(!JSON.stringify(packet.review_contract).includes('original_text'));
        assert.match(packet.response_requirements.completeness, /complete review/);
      } else {
        assert.deepEqual(packet.candidate, candidate);
        const clock = packet.review_contract.fields.checks.items.fields.observed_at;
        assert.equal(clock.format, 'YYYY-MM-DDTHH:mm:ss[.SSS]Z');
        assert.equal(new RegExp(clock.pattern).test('2026-11-13'), false);
        assert.equal(new RegExp(clock.pattern).test('2026-11-13T10:03:00Z'), true);
        assert.match(packet.response_requirements.observed_at, /Never add midnight/);
        assert.match(packet.response_requirements.clock_scope, /disclose/);
      }
      assert.equal((await inspect(`packet-${kind}`, input, output)).ok, false, 'No overwrites');
    }
    assert.deepEqual(candidate, original);
    candidate.timeline[0].actor_id = 'missing';
    await writeFile(input, JSON.stringify(candidate));
    assert.equal((await inspect('packet-copy', input, join(dir, 'invalid.json'))).ok, false, 'Preflight before spending on reviewers');
    await assert.rejects(stat(join(dir, 'invalid.json')));
  } finally { await rm(dir, { recursive: true }); }
});

test('native handoff parser accepts only the supplied agent final response, never tool/source text or older output', () => {
  const review = { sample: true };
  assert.deepEqual(nativeReview(transcript(review), agent), review);
  assert.deepEqual(nativeReview(transcript(review, true), agent), review);
  assert.deepEqual(nativeReview(JSON.stringify(row(`\`\`\`json\n  ${JSON.stringify(review)}\n  \`\`\``)), agent), review);
  for (const text of [
    transcript(review),
    `${transcript(review)}\n${JSON.stringify({ type: 'user', agentId: agent, isSidechain: true, message: { content: [{ type: 'tool_result', content: JSON.stringify(review) }] } })}`,
    JSON.stringify(row(JSON.stringify(review), { agentId: 'other-agent' })),
    JSON.stringify(row(JSON.stringify(review), { message: { role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'tool_use', input: review }] } })),
    JSON.stringify(row(JSON.stringify(review), { message: { role: 'assistant', stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: JSON.stringify(review) }] } })),
    JSON.stringify(row(`Here is a review: ${JSON.stringify(review)}`)),
    `${transcript(review)}\ntruncated-json`,
    `${transcript(review)}\n${JSON.stringify({ type: 'api-request', agentId: agent })}`,
  ]) {
    const id = text === transcript(review) ? 'wrong-agent' : agent;
    assert.throws(() => nativeReview(text, id));
  }
});

test('capture saves exact genuine-response data without author regeneration, digest replacement or premature approval', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-capture-'));
  try {
    const { review, copy_review, copy_review_iterations, ...candidate } = await snapshot();
    const input = join(dir, 'candidate.json'), source = join(dir, 'native.jsonl');
    await writeFile(input, JSON.stringify(candidate));
    for (const [kind, record] of [['copy', copy_review], ['fact', review]]) {
      await writeFile(source, transcript(record, true));
      const output = join(dir, `${kind}.json`);
      const result = await inspect(`capture-${kind}`, input, source, output, agent);
      assert.equal(result.ok, true);
      assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), record);
      assert.equal((await stat(output)).mode & 0o777, 0o600);
      assert.equal((await inspect(`capture-${kind}`, input, source, output, agent)).ok, false);
      const stale = structuredClone(candidate); stale.summary += ' New wording.';
      await writeFile(input, JSON.stringify(stale));
      const bad = await inspect(`capture-${kind}`, input, source, join(dir, `stale-${kind}.json`), agent);
      assert.ok(bad.errors.some(error => error.code === 'stale_review'));
      await assert.rejects(stat(join(dir, `stale-${kind}.json`)));
      await writeFile(input, JSON.stringify(candidate));
    }
    assert.equal(validateFactualReview(candidate, review).ok, true);
    assert.equal(validate({ ...candidate, review }).ok, false, 'Capture is not a substitute for both final reviews');
    const incomplete = structuredClone(review); incomplete.findings.pop();
    assert.equal(validateFactualReview(candidate, incomplete).ok, false);
    const revise = { ...copy_review, verdict: 'revise' };
    await writeFile(source, transcript(revise));
    const captured = await inspect('capture-copy', input, source, join(dir, 'revise.json'), agent);
    assert.equal(captured.ok, true, 'Feedback need not be a pass to be preserved');
    assert.equal(captured.verdict, 'revise');
    assert.equal(validate({ ...candidate, review, copy_review: revise }).ok, false);
    assert.deepEqual(JSON.parse(await readFile(input, 'utf8')), candidate);
  } finally { await rm(dir, { recursive: true }); }
});

test('date-only factual times and mismatched copy field digests fail before attachment or capture, without silent repair', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'review-wire-regression-'));
  try {
    const { review, copy_review, copy_review_iterations, ...candidate } = await snapshot();
    const input = join(dir, 'candidate.json'), fact = join(dir, 'fact.json'), native = join(dir, 'native.jsonl');
    await writeFile(input, JSON.stringify(candidate));
    await writeFile(fact, JSON.stringify(review));
    assert.equal((await inspect('fact', input, fact)).ok, true);
    const badFact = structuredClone(review);
    badFact.checks[0].observed_at = '2026-11-13';
    await writeFile(fact, JSON.stringify(badFact));
    const rejected = await inspect('fact', input, fact);
    assert.ok(rejected.errors.some(e => e.path.endsWith('.observed_at') && e.code === 'schema'));
    await writeFile(native, transcript(badFact));
    assert.equal((await inspect('capture-fact', input, native, join(dir, 'invalid-fact.json'), agent)).ok, false);
    await assert.rejects(stat(join(dir, 'invalid-fact.json')));
    assert.deepEqual(JSON.parse(await readFile(fact, 'utf8')), badFact, 'No timestamp normalization or invention');
    const badCopy = structuredClone(copy_review), passage = badCopy.passages.find(p => p.field_path === '$.summary');
    badCopy.verdict = 'revise';
    badCopy.findings = [{ field_path: passage.field_path, field_digest: '0'.repeat(64),
      rule_group: 'meaning', rule_id: 'source-scope', severity: 'required', explanation: 'Unit-test feedback, not an actual semantic judgment.', semantic_risk: 'possible' }];
    assert.ok(validateCopyReview(candidate, badCopy, { requirePass: false }).errors.some(e => e.code === 'copy_field'));
    await writeFile(native, transcript(badCopy));
    assert.equal((await inspect('capture-copy', input, native, join(dir, 'invalid-copy.json'), agent)).ok, false);
    await assert.rejects(stat(join(dir, 'invalid-copy.json')));
    const fullCopy = structuredClone(badCopy);
    fullCopy.findings[0].field_digest = passage.field_digest;
    assert.equal(validateCopyReview(candidate, fullCopy, { requirePass: false }).ok, true, 'Complete revise feedback can be recorded');
    assert.equal(validate({ ...candidate, review, copy_review: fullCopy }).ok, false, 'Required semantic feedback still blocks rendering');
    assert.deepEqual(JSON.parse(await readFile(input, 'utf8')), candidate);
  } finally { await rm(dir, { recursive: true }); }
});
