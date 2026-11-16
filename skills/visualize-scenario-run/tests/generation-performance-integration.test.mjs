// SCRIPTED production-boundary integration. No native dispatch or source read.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect } from '../scripts/inspect.mjs';
import { factualDigest, copyFields, validateCandidate } from '../scripts/contracts.mjs';
import { expandReviewPacket, packReviewResponse } from '../scripts/review-codec.mjs';
import { validateSourceGroundingReport } from '../scripts/source-grounding.mjs';
import { reviewLoop } from '../scripts/workflow.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { postrunFixture, postrunDraft } from './postrun-package-fixtures.test.mjs';
import { packagePostrun } from '../scripts/postrun-package.mjs';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { concernFixture } from './concern-fixture.mjs';
import { fakeCopyReview, fakeChecker } from './fixtures.mjs';

const save = (path, value) => writeFile(path, `${JSON.stringify(value)}\n`, { flag: 'wx', mode: 0o600 });
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const missing = async path => assert.rejects(stat(path), { code: 'ENOENT' });
async function temporary(run) {
  const directory = await mkdtemp(join(tmpdir(), 'generation-performance-'));
  try { await run(directory); } finally { await rm(directory, { recursive: true }); }
}

function nativeTransport(kind, wire) {
  const binding = { status: 'completed', kind, sessionId: 'synthetic-session', parentAgentId: 'synthetic-parent',
    agentId: 'synthetic-child', reviewerId: kind === 'copy' ? wire.reviewer_id : wire.checker_id,
    candidateDigest: kind === 'copy' ? wire.candidate_digest : wire.factual_digest,
    dispatchUuid: 'dispatch', dispatchToolUseId: 'dispatch-tool', launchUuid: 'launch',
    completionUuid: 'completion', handbackToolUseId: 'handback-tool', receiptUuid: 'receipt' };
  const identity = { sessionId: binding.sessionId, agentId: binding.agentId, isSidechain: true };
  const parent = { ...identity, agentId: binding.parentAgentId };
  const prompt = 'SCRIPTED transport test. This is not native review approval.';
  const correlation = [
    { ...parent, uuid: 'dispatch', type: 'assistant', message: { role: 'assistant', stop_reason: 'tool_use', content: [
      { type: 'tool_use', id: 'dispatch-tool', name: 'Agent', input: {
        subagent_type: kind === 'copy' ? 'guild:scenario-run-copy-editor' : 'guild:scenario-run-checker', prompt } }] } },
    { ...parent, uuid: 'launch', type: 'user', parentUuid: 'dispatch', sourceToolAssistantUUID: 'dispatch',
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'dispatch-tool', content: 'Synthetic launch.' }] },
      toolUseResult: { agentId: binding.agentId, status: 'async_launched', isAsync: true, prompt } },
  ];
  const transcript = [
    { ...identity, uuid: 'initial', parentUuid: null, type: 'user', message: { role: 'user', content: prompt } },
    { ...identity, uuid: 'completion', type: 'assistant', message: { role: 'assistant', stop_reason: 'tool_use', content: [
      { type: 'tool_use', id: 'handback-tool', name: 'SubagentHandback', input: { message: JSON.stringify(wire) } }] } },
    { ...identity, uuid: 'receipt', type: 'user', parentUuid: 'completion', sourceToolAssistantUUID: 'completion', toolEndsTurn: true,
      toolUseResult: { success: true, message: 'Report delivered to your caller.' }, message: { role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'handback-tool', content: [{ type: 'text', text: '{"success":true,"message":"Report delivered to your caller."}' }] }] } },
  ];
  const encode = rows => rows.map(row => JSON.stringify(row)).join('\n');
  return { binding, child: encode(transcript), parent: encode(correlation) };
}

test('postrun CLI preserves every stage and real baseline through ordinary assembly', () => temporary(async dir => {
  const input = postrunFixture(), original = structuredClone(input);
  const inputPath = join(dir, 'input.json'), bundlePath = join(dir, 'bundle.json'), projectionPath = join(dir, 'versions.json');
  await save(inputPath, input);
  const packaged = await inspect('postrun-package', inputPath, bundlePath, projectionPath);
  assert.equal(packaged.ok, true, JSON.stringify(packaged));
  const pure = packagePostrun(input);
  assert.equal(pure.ok, true);
  assert.deepEqual(await load(bundlePath), pure.bundle);
  assert.deepEqual(await load(projectionPath), pure.artifactVersionSource);
  const draft = postrunDraft(pure), draftPath = join(dir, 'draft.json'), candidatePath = join(dir, 'candidate.json');
  await save(draftPath, draft);
  assert.equal((await inspect('assemble', bundlePath, draftPath, candidatePath, projectionPath)).ok, true);
  const candidate = await load(candidatePath);
  assert.equal(validateCandidate(candidate).ok, true);
  assert.deepEqual(candidate.source_bundle, pure.bundle);
  assert.ok(candidate.artifacts.some(a => a.before === '' && a.after === 'Actual saved body\r\n\n'));
  assert.equal(candidate.evidence.filter(e => e.id.startsWith('log:')).length, 8);
  assert.equal((await stat(bundlePath)).mode & 0o777, 0o600);
  assert.equal((await inspect('postrun-package', inputPath, bundlePath, projectionPath)).ok, false);
  assert.deepEqual(await load(inputPath), original);
  assert.deepEqual(input, original);
}));

test('current copy claims require a fresh private report but unresolved quality never invents a gate', () => temporary(async dir => {
  const { doc } = concernFixture(), source = doc.source_bundle;
  const candidatePath = join(dir, 'candidate.json'), originalPath = join(dir, 'source.json'), reportPath = join(dir, 'preflight.json'), budget = join(dir, 'budget.json');
  await save(candidatePath, doc); await save(originalPath, source);
  assert.equal((await inspect('claim-copy', candidatePath, budget)).errors[0].code, 'source_grounding_required');
  await missing(budget);
  const preflight = await inspect('preflight-source', candidatePath, originalPath, reportPath);
  assert.equal(preflight.ok, true, JSON.stringify(preflight));
  const report = await load(reportPath);
  assert.equal(validateSourceGroundingReport(doc, source, report).ok, true);
  assert.equal((await inspect('claim-copy', candidatePath, budget, originalPath, reportPath)).ok, true);
  const changed = structuredClone(doc);
  changed.timeline[0].supporting_detail += ' The implementation uses maxQueueDepth: 37.';
  const next = join(dir, 'next.json'), nextReport = join(dir, 'next-preflight.json'); await save(next, changed);
  assert.equal((await inspect('claim-copy', next, budget, originalPath, reportPath)).ok, false);
  await missing(`${budget}.iteration-2`);
  assert.equal((await inspect('preflight-source', next, originalPath, nextReport)).ok, true);
  const fresh = await load(nextReport);
  assert.ok(fresh.inventory.some(field => field.details.some(detail => detail.status !== 'supported_literal')));
  assert.equal((await inspect('claim-copy', next, budget, originalPath, nextReport)).ok, true);
  assert.equal((await inspect('claim-copy', next, budget, originalPath, nextReport)).errors[0].code, 'copy_review_limit');
  assert.deepEqual(await load(originalPath), source);
}));

test('compact default packets, exact expansion and genuine-shaped native capture use existing full validators', () => temporary(async dir => {
  const { doc } = concernFixture(), original = structuredClone(doc), candidatePath = join(dir, 'candidate.json');
  await save(candidatePath, doc);
  for (const kind of ['copy', 'fact']) {
    const packetPath = join(dir, `${kind}-packet.json`);
    assert.equal((await inspect(`packet-${kind}`, candidatePath, packetPath)).ok, true);
    const packet = await load(packetPath), full = expandReviewPacket(packet, doc);
    assert.equal(packet.codec_version, '1.0');
    assert.equal(full.candidate_digest, factualDigest(doc));
    if (kind === 'copy') assert.deepEqual(full.fields, copyFields(doc));
    else {
      assert.deepEqual(full.candidate, doc);
      assert.equal(full.source_navigation.cached_index_is_independent_read, false);
      assert.equal(full.source_navigation.claim_coverage.length, doc.claims.length);
      assert.ok(full.source_navigation.sources.some(source => source.locator?.file === candidatePath || JSON.stringify(source).includes(candidatePath)));
    }
    const record = kind === 'copy' ? fakeCopyReview(doc) : await fakeChecker({ finding: 'qualified', gap: 'SCRIPTED source limitation.' }).check(doc);
    const wire = packReviewResponse(record, full, doc), wirePath = join(dir, `${kind}-wire.json`), output = join(dir, `${kind}-expanded.json`);
    await save(wirePath, wire);
    assert.equal((await inspect('expand-review', candidatePath, wirePath, packetPath, output)).ok, true);
    assert.deepEqual(await load(output), record);
    assert.equal((await inspect('expand-review', candidatePath, wirePath, packetPath, output)).ok, false);
    const native = nativeTransport(kind, wire), child = join(dir, `${kind}-child.jsonl`), parent = join(dir, `${kind}-parent.jsonl`), bindingPath = join(dir, `${kind}-binding.json`), capture = join(dir, `${kind}-capture.json`), capturedOutput = join(dir, `${kind}-captured.json`);
    await writeFile(child, native.child, { flag: 'wx', mode: 0o600 }); await writeFile(parent, native.parent, { flag: 'wx', mode: 0o600 }); await save(bindingPath, native.binding);
    assert.equal((await inspect('packet-handback', child, parent, capture)).ok, true);
    const captured = await inspect(`capture-native-${kind}`, candidatePath, capture, capturedOutput, bindingPath, packetPath);
    assert.equal(captured.ok, true, JSON.stringify(captured));
    assert.equal(captured.capture_provenance.authenticity, 'caller-supplied-records-not-authenticated');
    assert.deepEqual(await load(capturedOutput), record);
    const missingPacket = join(dir, `${kind}-without-packet.json`);
    assert.equal((await inspect(`capture-native-${kind}`, candidatePath, capture, missingPacket, bindingPath)).ok, false);
    await missing(missingPacket);
    assert.equal((await stat(capturedOutput)).mode & 0o777, 0o600);
    assert.equal(await readFile(child, 'utf8'), native.child);
  }
  assert.deepEqual(doc, original);
  assert.deepEqual(await load(candidatePath), original);
}));

test('optional private preflight notification failure neither leaks errors nor gates ordinary review and rendering', async () => {
  const { doc } = concernFixture(); let copies = 0, facts = 0;
  const result = await reviewLoop({
    edit: async () => structuredClone(doc),
    onSourceGrounding: async () => { throw new Error('sensitive local callback details'); },
    copyCheck: async candidate => { copies++; return fakeCopyReview(candidate); },
    check: async candidate => { facts++; return fakeChecker().check(candidate); },
    render: async candidate => ({ ok: renderHtml(candidate).ok }),
  });
  assert.equal(result.ok, true); assert.equal(copies, 1); assert.equal(facts, 1);
  assert.ok(result.diagnostics.some(item => item.kind === 'source-grounding-notification'));
  assert.doesNotMatch(JSON.stringify(result), /sensitive local callback details/);
});

test('orchestration supplies current author-private preflight before copy without source mutation or extra dispatch', async () => {
  const { doc } = concernFixture(), original = structuredClone(doc); let copies = 0, preflights = 0;
  const result = await reviewLoop({ originalBundle: doc.source_bundle,
    edit: async () => structuredClone(doc),
    onSourceGrounding: async privateContext => {
      preflights++;
      assert.equal(validateSourceGroundingReport(doc, original.source_bundle, privateContext.source_grounding_report).ok, true);
      assert.ok(privateContext.author_feedback);
    },
    copyCheck: async (...args) => {
      copies++;
      assert.equal(preflights, copies);
      assert.equal(args.length, 1, 'Private grounding assistance is not supplied to the copy reviewer.');
      const [candidate] = args;
      return fakeCopyReview(candidate);
    }, check: async candidate => fakeChecker().check(candidate),
    render: async snapshot => {
      assert.equal(Object.hasOwn(snapshot, 'source_grounding_report'), false);
      return { ok: true, artifact_path: '/private/scripted.html' };
    } });
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(copies, 1);
  assert.equal(result.trace[0].operation, 'source_grounding_preflight');
  assert.deepEqual(doc, original);
});

test('CLI review loads reject duplicate judgments before validation or compact expansion', () => temporary(async dir => {
  const { doc } = concernFixture(), candidatePath = join(dir, 'candidate.json'), reviewPath = join(dir, 'ambiguous-review.json');
  await save(candidatePath, doc);
  const valid = fakeCopyReview(doc);
  const ambiguous = '{"verdict":"blocked",' + JSON.stringify(valid).slice(1);
  await writeFile(reviewPath, ambiguous, { flag: 'wx', mode: 0o600 });
  const copied = await inspect('copy', candidatePath, reviewPath);
  assert.equal(copied.ok, false);
  assert.equal(copied.errors[0].code, 'review_capture_duplicate_key');
  const snapshotPath = join(dir, 'snapshot.json');
  const finalized = await inspect('finalize', candidatePath, snapshotPath, reviewPath, '-');
  assert.equal(finalized.ok, true, 'Malformed optional private feedback is not render approval.');
  assert.equal(finalized.review_diagnostics.copy_review.ok, false);
  assert.equal(Object.hasOwn(await load(snapshotPath), 'copy_review'), false);
  assert.equal(await readFile(reviewPath, 'utf8'), ambiguous);
}));
