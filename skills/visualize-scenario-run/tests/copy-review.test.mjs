import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validate, validateCandidate, validateCopyReview, factualDigest, prepareRenderSnapshot, copyFields, copyFieldDigest, COPY_RULE_VERSIONS } from '../scripts/contracts.mjs';
import { reviewLoop } from '../scripts/workflow.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { candidate, snapshot, fakeCopyReview, fakeChecker } from './fixtures.mjs';

test('dual reviews bind the same candidate; every authored field is covered, source text is exempt', async () => {
  const doc = await snapshot();
  assert.equal(doc.schema_version, '1.7');
  assert.equal(doc.copy_review.candidate_digest, doc.review.factual_digest);
  assert.equal(validate(doc).ok, true);
  const covered = [...doc.copy_review.passages, ...doc.copy_review.exemptions].map(p => p.field_path).sort();
  assert.deepEqual(covered, copyFields(doc).map(p => p.field_path).sort());
  const original = factualDigest(doc);
  doc.copy_review.findings.push({ unrelated: 'review contents never enter the content hash' });
  assert.equal(factualDigest(doc), original);
  assert.equal(validate(doc).ok, false, 'Excluding reviews from digest does not exempt their validation');
});

test('compact field digests bind exact UTF-8 without normalization and never repeat original prose', () => {
  assert.equal(copyFieldDigest('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.notEqual(copyFieldDigest('text'), copyFieldDigest(' text\n'));
  assert.notEqual(copyFieldDigest('é'), copyFieldDigest('e\u0301'));
  const doc = candidate(), fields = copyFields(doc), review = fakeCopyReview(doc);
  for (const field of fields) assert.equal(field.field_digest, copyFieldDigest(field.text));
  assert.ok(!JSON.stringify(review).includes('original_text'));
  assert.ok(!JSON.stringify(review).includes(doc.summary));
  assert.deepEqual(review.passages.map(p => p.field_digest), fields.filter(f => !f.protected_source).map(f => f.field_digest));
  review.findings = [finding({ copy_review: review }, { field_digest: copyFieldDigest('stale field') })];
  assert.ok(validateCopyReview(doc, review).errors.some(e => e.code === 'copy_field'));
});

test('large authored fields remain available for review without whole-text response duplication', () => {
  const doc = candidate(); doc.summary = 'Complete source-scoped prose. '.repeat(1000);
  const review = fakeCopyReview(doc), fields = copyFields(doc);
  const field = fields.find(f => f.field_path === '$.summary');
  assert.equal(field.text, doc.summary);
  const compact = review.passages.find(p => p.field_path === field.field_path);
  assert.equal(compact.field_digest, copyFieldDigest(doc.summary));
  assert.equal(validateCopyReview(doc, review).ok, true);
  const oldPassage = { ...compact, original_text: doc.summary }; delete oldPassage.field_digest;
  assert.ok(JSON.stringify(oldPassage).length > JSON.stringify(compact).length * 50);
});

test('copy contract rejects missing, stale, dual-guide, unknown, uncovered and falsely passing reviews', async () => {
  const mutations = [
    d => { delete d.copy_review; },
    d => { d.copy_review.reviewer_id = d.review.checker_id; },
    d => { d.copy_review.reviewer_id = d.editor_id; },
    d => { d.copy_review.reviewer_id = d.parent_agent_id; },
    d => { d.copy_review.rule_versions.sdlc = 'unknown'; },
    d => { d.copy_review.candidate_digest = 'old'; },
    d => { d.copy_review.passages[0].guide = ['asd-ste100', 'economist']; },
    d => { d.copy_review.passages.push({ ...d.copy_review.passages[0], guide: 'asd-ste100' }); },
    d => { d.copy_review.passages[0].guide = 'unresolved'; },
    d => { d.copy_review.passages[0].sdlc_review = 'revise'; },
    d => { d.copy_review.passages[0].field_digest = copyFieldDigest('Different text'); },
    d => { d.copy_review.passages[0].original_text = 'Obsolete whole-text response'; },
    d => { delete d.copy_review.passages[0].field_digest; },
    d => { d.copy_review.passages.pop(); },
    d => { d.copy_review.exemptions.pop(); },
    d => { d.copy_review.exemptions.push({ field_path: '$.summary', reason: 'Skip authored prose' }); },
    d => { d.copy_review.extra = true; },
    d => { d.copy_review.verdict = 'revise'; },
    d => { d.copy_review.findings.push(finding(d, { severity: 'required' })); },
    d => { d.copy_review.findings.push(finding(d, { semantic_risk: 'possible' })); },
    d => { d.copy_review.findings.push(finding(d, { rule_group: 'asd-ste100' })); },
  ];
  for (const mutate of mutations) {
    const doc = await snapshot(); mutate(doc);
    assert.equal(validate(doc).ok, false, mutate.toString());
    assert.equal(renderHtml(doc).ok, false);
  }
});

function finding(doc, overrides = {}) {
  const passage = doc.copy_review.passages[0];
  return { field_path: passage.field_path, field_digest: passage.field_digest,
    rule_group: 'economist', rule_id: 'ECO-1', severity: 'advisory',
    explanation: 'Scripted review finding, not an actual language judgment.', semantic_risk: 'none', ...overrides };
}

test('second-copy display preserves findings and exact text without relaxing factual or historical gates', async () => {
  for (const verdict of ['revise', 'blocked']) {
    const doc = await snapshot();
    doc.copy_review_iterations = 2;
    doc.copy_review.verdict = verdict;
    doc.copy_review.findings = [finding(doc, { severity: 'required', semantic_risk: 'possible', explanation: 'Unresolved <copy> issue.' })];
    const before = structuredClone(doc), digest = factualDigest(doc);
    assert.equal(validate(doc).ok, true);
    assert.equal(validateCopyReview(doc, doc.copy_review).ok, false, 'A rendered nonpass never becomes a pass');
    const rendered = renderHtml(doc);
    assert.equal(rendered.ok, true);
    assert.doesNotMatch(rendered.html, /Unresolved &lt;copy&gt; issue|Copy-review iterations|not copy-approved/);
    assert.deepEqual(doc, before);
    assert.equal(factualDigest({ ...doc, copy_review_iterations: 1 }), digest, 'Count is orchestration metadata');
    for (const mutate of [
      d => { d.copy_review_iterations = 1; }, d => { d.copy_review_iterations = 3; },
      d => { delete d.copy_review_iterations; }, d => { delete d.review; },
      d => { d.review.factual_digest = '0'.repeat(64); },
      d => { d.copy_review.passages.pop(); }, d => { d.summary += ' Unreviewed.'; },
      d => { d.copy_review.reviewer_id = d.review.checker_id; },
    ]) { const bad = structuredClone(doc); mutate(bad); assert.equal(renderHtml(bad).ok, false, mutate.toString()); }
    const old = structuredClone(doc); old.schema_version = '1.5'; delete old.copy_review_iterations; delete old.header_copy;
    old.copy_review = fakeCopyReview(old); old.copy_review.verdict = verdict;
    old.review.factual_digest = old.copy_review.candidate_digest = factualDigest(old); // Synthetic historical fixture only.
    assert.equal(prepareRenderSnapshot(old).ok, false, 'Historical copy-pass gate is not weakened');
    old.copy_review = fakeCopyReview(old);
    assert.equal(prepareRenderSnapshot(old).ok, true);
  }
});

test('no third dispatch or stale render when factual correction is needed after the second copy', async () => {
  let copies = 0, renders = 0;
  const result = await reviewLoop({ edit: async () => candidate(),
    copyCheck: async d => { copies++; const review = fakeCopyReview(d); review.verdict = 'revise'; return review; },
    check: d => fakeChecker().check(d),
    revise: async ({ candidate: d, phase }) => { if (phase === 'fact') d.summary += ' Necessary factual correction.'; return d; },
    render: async () => { renders++; return { ok: true }; } });
  assert.equal(copies, 2); assert.equal(renders, 0); assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'copy_review_limit');
});

test('a reported selected route excludes the other guide and requires final SDLC review', async () => {
  const doc = await snapshot();
  const passage = doc.copy_review.passages.find(p => p.field_path === '$.timeline[1].supporting_detail');
  passage.guide = 'asd-ste100'; passage.routing_reason = 'Scripted internal-process explanation classification.';
  passage.exceptions = ['Preserve a necessary qualification even if it exceeds the selected guide target.'];
  assert.equal(validateCopyReview(doc, doc.copy_review).ok, true);
  doc.copy_review.findings = [{ ...finding(doc), field_path: passage.field_path, field_digest: passage.field_digest, rule_group: 'economist' }];
  assert.equal(validateCopyReview(doc, doc.copy_review).ok, false);
  doc.copy_review.findings[0].rule_group = 'sdlc';
  assert.equal(validateCopyReview(doc, doc.copy_review).ok, true);
  passage.sdlc_review = 'blocked'; doc.copy_review.verdict = 'blocked'; passage.guide = 'unresolved';
  assert.equal(validateCopyReview(doc, doc.copy_review, { requirePass: false }).ok, true);
  assert.equal(validateCopyReview(doc, doc.copy_review).ok, false);
});

test('wording-only correction uses the remaining copy review; unchanged display reuses reviews', async () => {
  for (const wording of [true, false]) {
    const checker = fakeChecker(); let copies = 0, facts = 0, renders = 0;
    const result = await reviewLoop({
      edit: async ({ previous }) => previous ?? candidate(),
      copyCheck: async d => { copies++; return fakeCopyReview(d); },
      check: async d => { facts++; return checker.check(d); },
      revise: async ({ candidate: d, copy_reviews }) => {
        if (wording && copy_reviews === 1) {
          d.timeline[1].description = 'Reply assistant saved a draft in Sandbox Mail. It did not send a message.';
          d.claims.find(c => c.id === 'claim-draft-1').text = d.timeline[1].description;
        }
        return d;
      },
      render: async d => {
        renders++;
        if (!wording && renders === 1) return { ok: false, errors: [{ path: '$.display', code: 'test', message: 'Scripted display repair', repair: 'Try unchanged content' }] };
        d.display.compact = true;
        assert.equal(d.copy_review.candidate_digest, d.review.factual_digest);
        return renderHtml(d);
      },
    });
    assert.equal(result.ok, true);
    assert.equal(copies, wording ? 2 : 1);
    assert.equal(result.copy_reviews, copies);
    assert.equal(facts, wording ? 2 : 1);
    assert.equal(renders, wording ? 1 : 2);
    if (!wording) assert.equal(result.attempts, 2);
  }
});

test('two valid nonpassing copy reviews display text; malformed feedback still fails closed', async () => {
  for (const verdict of ['revise', 'blocked', 'malformed']) {
    let factCalls = 0, copyCalls = 0, repairs = 0;
    const result = await reviewLoop({
      edit: async () => candidate(),
      copyCheck: async d => {
        copyCalls++;
        const review = fakeCopyReview(d);
        if (verdict === 'malformed') { review.passages.pop(); return review; }
        review.verdict = verdict; review.findings = [finding({ copy_review: review }, { severity: 'required' })];
        return review;
      },
      check: async d => { factCalls++; return fakeChecker().check(d); },
      revise: async ({ candidate: d }) => { repairs++; return d; },
      render: async d => { assert.equal(d.copy_review.verdict, verdict); assert.equal(d.copy_review_iterations, 2); return renderHtml(d); },
    });
    assert.equal(result.ok, verdict !== 'malformed'); assert.equal(copyCalls, verdict === 'malformed' ? 1 : 2); assert.equal(factCalls, verdict === 'malformed' ? 0 : 1); assert.equal(repairs, verdict === 'malformed' ? 0 : 2);
    assert.equal(result.copy_reviews, copyCalls); assert.equal(result.attempts, 1);
    if (result.ok) assert.doesNotMatch(result.html, /displayed with unresolved copy feedback|copy approval/);
  }
  const missing = await reviewLoop({ edit: async () => candidate(), check: async () => {}, render: async () => {} });
  assert.equal(missing.errors[0].code, 'review_capability');
  const thrown = await reviewLoop({ edit: async () => candidate(), copyCheck: async () => { throw new Error('Unavailable rule source'); }, check: async () => {}, render: async () => {} });
  assert.equal(thrown.ok, false); assert.equal(thrown.errors[0].code, 'workflow_failure');
  assert.equal(thrown.copy_reviews, 1); assert.equal(thrown.attempts, 1);
});

test('legacy 1.2 validates its whole-text contract and original digest, without compact upgrade or mutation', async () => {
  const legacy = await snapshot();
  legacy.schema_version = '1.2';
  delete legacy.header_copy;
  delete legacy.copy_review_iterations;
  legacy.copy_review = fakeCopyReview(legacy);
  legacy.copy_review.rule_versions.sdlc = 'scenario-run-v1';
  const fields = new Map(copyFields(legacy).map(f => [f.field_path, f]));
  legacy.copy_review.passages = legacy.copy_review.passages.map(({ field_digest, ...p }) => ({ ...p, original_text: fields.get(p.field_path).text }));
  const passage = legacy.copy_review.passages[0];
  legacy.copy_review.findings = [{ ...finding({ copy_review: legacy.copy_review }), original_text: passage.original_text }];
  delete legacy.copy_review.findings[0].field_digest;
  // Construct a synthetic historical review, never migrate a real review.
  legacy.copy_review.candidate_digest = legacy.review.factual_digest = factualDigest(legacy);
  const before = structuredClone(legacy), serialized = JSON.stringify(legacy);
  assert.equal(validate(legacy).ok, false);
  const { review, copy_review, ...oldCandidate } = legacy;
  assert.equal(validateCandidate(oldCandidate).ok, false);
  const prepared = prepareRenderSnapshot(legacy);
  assert.equal(prepared.ok, true); assert.equal(prepared.review_mode, 'legacy-dual-review');
  assert.strictEqual(prepared.snapshot, legacy);
  assert.equal(JSON.stringify(prepared.snapshot), serialized);
  assert.equal(factualDigest(prepared.snapshot), review.factual_digest);
  assert.equal(renderHtml(legacy).ok, true);
  assert.deepEqual(legacy, before);
  for (const mutate of [
    d => { d.summary += ' Unreviewed change.'; },
    d => { d.copy_review.passages[0].original_text = 'Excerpt'; },
    d => { d.copy_review.findings[0].original_text = 'Wrong field text'; },
    d => { d.copy_review.passages.pop(); },
    d => { d.copy_review.passages.push({ ...d.copy_review.passages[0], guide: 'asd-ste100' }); },
    d => { d.copy_review.findings[0].severity = 'required'; },
    d => { d.copy_review = fakeCopyReview(d); },
    d => { d.schema_version = '1.3'; },
  ]) {
    const invalid = structuredClone(before); mutate(invalid);
    assert.equal(prepareRenderSnapshot(invalid).ok, false, mutate.toString());
  }
});

test('legacy 1.1 rerenders without copy approval; editing old prose still invalidates its original review', async () => {
  const legacy = await snapshot(); legacy.schema_version = '1.1'; delete legacy.copy_review; delete legacy.copy_review_iterations; delete legacy.header_copy;
  legacy.review.factual_digest = factualDigest(legacy); // Synthetic legacy fixture only.
  const before = structuredClone(legacy);
  const prepared = prepareRenderSnapshot(legacy);
  assert.equal(prepared.ok, true); assert.equal(prepared.review_mode, 'legacy-factual-only');
  assert.deepEqual(legacy, before); assert.equal(legacy.copy_review, undefined);
  legacy.summary += ' Changed.';
  assert.equal(prepareRenderSnapshot(legacy).ok, false);
});

test('authored inline-code names are escaped; captured payloads remain verbatim and protected', async () => {
  const doc = await snapshot();
  doc.timeline[1].description = 'The `workspace/reply` agent saved a draft in Sandbox Mail.';
  doc.artifacts[0].content = '`<script>unsafe()</script>`';
  doc.copy_review = fakeCopyReview(doc); doc.review = await fakeChecker().check(doc);
  const html = renderHtml(doc).html;
  assert.match(html, /The <code>workspace\/reply<\/code> agent saved/);
  const card = html.match(/<aside class="business-artifact">[\s\S]*?<\/aside>/)[0];
  assert.match(card, /`&lt;script&gt;unsafe\(\)&lt;\/script&gt;`/);
  assert.doesNotMatch(card, /<script>|<code>/);
});

test('packaged editorial instructions preserve semantic invariants and content-based exclusive routing', async () => {
  const read = name => readFile(new URL(`../references/style/${name}`, import.meta.url), 'utf8');
  const routing = await read('routing-v1.md'); const sdlc = await read('sdlc-v1.md');
  for (const text of ['not where it appears', 'Never stack guides', 'Economist passages do not', 'Ambiguous', 'negation', 'quantities', 'causation', 'status and uncertainty']) assert.ok(routing.includes(text), text);
  assert.match(routing, /asked Slack to post/); assert.match(routing, /Present state cannot prove/);
  assert.match(sdlc, /Only state what actually happened/); assert.match(sdlc, /Never manufacture a missing name/);
  assert.match(sdlc, /visible and verbatim/);
  assert.match(await read('economist-v1.md'), /Do not apply ASD rules or its sentence-length/);
  assert.match(await read('asd-ste100-v1.md'), /Do not add Economist rules/);
});

test('SDLC v2 requires human-facing lifecycle and supported world effects without protocol narration', async () => {
  const read = name => readFile(new URL(`../references/style/${name}`, import.meta.url), 'utf8');
  const sdlc = await read('sdlc-v2.md'), routing = await read('routing-v2.md');
  assert.equal(COPY_RULE_VERSIONS.sdlc, 'scenario-run-v2');
  for (const text of ['The session ended.', 'successfully posted', 'request alone', 'not an “After” panel', 'Do not add detached', 'required SDLC findings', 'evidence does not establish']) assert.ok(sdlc.includes(text), text);
  assert.match(routing, /scenario-run-v2/);
  assert.match(routing, /Never combine guides or use the other as fallback/);
  const current = await snapshot();
  current.copy_review.rule_versions.sdlc = 'scenario-run-v1';
  assert.equal(validate(current).ok, false, 'Historical directives cannot pass as current copy approval');
});
