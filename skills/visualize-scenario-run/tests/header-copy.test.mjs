// Explicit synthetic fixtures only. No genuine review or source approval is made.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleCandidate } from '../scripts/assemble.mjs';
import { validate, validateCandidate, validateCopyReview, validateFactualReview, factualDigest, copyFields, prepareRenderSnapshot, COPY_RULE_VERSIONS } from '../scripts/contracts.mjs';
import { HEADER_COPY_POLICY, headerCopyContract, headerTextFields } from '../scripts/header-copy.mjs';
import { reviewPacket } from '../scripts/review-io.mjs';
import { inspect } from '../scripts/inspect.mjs';
import { reviewLoop } from '../scripts/workflow.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { feedbackContext, feedbackRuntime } from '../scripts/feedback.mjs';
import { candidate, bundle, snapshot, fakeCopyReview, fakeChecker } from './fixtures.mjs';

// Exact problematic visible strings, used as negative test data, not native input.
const oldName = '`market-monitor` agent: morning competitor rental-offer report';
const oldPurpose = "Each morning, fetch each configured competitor's public rental offers, compare like-for-like entire apartments in EUR including stated one-time fees, and post a readable Markdown report to the Slack channel #rental-market-intel without manual fixes.";
const oldDescription = 'The agent fetches both configured offers for three nights and two guests, compares entire apartments in EUR including stated one-time fees, and posts one readable Markdown comparison to the Slack channel #rental-market-intel.';
const scriptedReviews = async d => { d.copy_review = fakeCopyReview(d); d.review = await fakeChecker().check(d); d.copy_review_iterations = 1; return d; };

function draftFor(input = bundle()) {
  const c = candidate(input);
  return { schema_version: '1.1', snapshot_id: c.snapshot_id, editor_id: c.editor_id, parent_agent_id: c.parent_agent_id,
    header_copy: c.header_copy, summary: c.summary, claims: c.claims,
    events: c.timeline.map(({ id, description, claim_refs, supporting_detail }) => ({ occurrence_id: id, description, claim_refs, supporting_detail })),
    artifact_claims: c.artifact_claims, omitted_occurrences: c.omitted_occurrences };
}

test('closed draft 1.1 requires explicit header text, copies it unchanged, and cannot replace full source specs', () => {
  const input = bundle(); input.workflow.title = oldName; input.workflow.intended_world_effect = oldPurpose;
  input.scenario.expected_outcome = oldDescription;
  const draft = draftFor(input), before = structuredClone({ input, draft });
  const assembled = assembleCandidate(input, draft);
  assert.equal(assembled.ok, true, JSON.stringify(assembled));
  const d = assembled.snapshot;
  assert.equal(d.schema_version, '1.7'); assert.deepEqual(d.header_copy, draft.header_copy);
  assert.deepEqual(d.workflow, input.workflow); assert.deepEqual(d.scenario, input.scenario);
  assert.deepEqual(d.evidence, input.evidence); assert.deepEqual(d.artifacts, input.artifacts);
  assert.equal(d.copy_review, undefined); assert.equal(d.review, undefined);
  d.header_copy.claim_refs.push('output-only'); d.header_copy.observed_result = 'Output-only change.';
  assert.deepEqual({ input, draft }, before);
  for (const change of [a => { delete a.header_copy; }, a => { a.header_copy.observed_result = ''; },
    a => { a.header_copy.extra = 'unknown'; }, a => { a.context_copy = { workflow: { title: 'Not a source override' } }; },
    a => { a.context_copy = { scenario: { expected_outcome: 'Not a source override' } }; }]) {
    const bad = structuredClone(draft); change(bad); assert.equal(assembleCandidate(input, bad).ok, false);
  }
});

test('actual rejected header copy fails deterministic preflight without restricting original specs or description punctuation', () => {
  assert.equal([...oldName].length, 62); assert.equal([...oldPurpose].length, 249);
  const d = candidate(); d.workflow.title = oldName; d.workflow.intended_world_effect = oldPurpose; d.scenario.expected_outcome = oldDescription;
  assert.equal(validateCandidate(d).ok, true, 'Full source specification has no new UI budget');
  for (const [field, value, code] of [['application_name', oldName, 'header_word_budget'], ['workflow_purpose', oldPurpose, 'header_character_budget'],
    ['workflow_purpose', 'word '.repeat(17), 'header_word_budget'], ['scenario_name', 'Simulated morning scan: Berlin, 20–23 November 2026, two guests', 'header_word_budget']]) {
    const bad = structuredClone(d); bad.header_copy[field] = value;
    const result = validateCandidate(bad); assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.path === `$.header_copy.${field}` && e.code === code), JSON.stringify(result));
  }
  const missing = structuredClone(d); delete missing.header_copy;
  assert.equal(validateCandidate(missing).ok, false, 'Old 1.6-shaped description is not a new authored header');
  for (const field of headerTextFields) {
    const bad = structuredClone(d); bad.header_copy[field] = '  '; assert.equal(validateCandidate(bad).ok, false, field);
  }
  d.header_copy.starting_context = 'Dr. Example supplied 3.5 hours. An abbreviation is not a sentence counter.';
  d.header_copy.observed_result = 'First sentence. Second sentence. Reviewers assess the two/three-sentence guidance, not punctuation code.';
  assert.equal(validateCandidate(d).ok, true);
});

test('header word/code-point budgets have exact boundaries and do not silently trim, truncate or normalize', () => {
  const d = candidate(); d.header_copy.workflow_purpose = '😀'.repeat(120);
  assert.equal(validateCandidate(d).ok, true); assert.equal(d.header_copy.workflow_purpose.length, 240);
  d.header_copy.workflow_purpose += '😀'; assert.equal(validateCandidate(d).ok, false);
  d.header_copy.workflow_purpose = Array(16).fill('a').join(' '); assert.equal(validateCandidate(d).ok, true);
  d.header_copy.workflow_purpose += ' a'; assert.equal(validateCandidate(d).ok, false);
  d.header_copy.workflow_purpose = '  Short purpose.  '; d.header_copy.application_name = 'Reply\tDesk';
  const before = JSON.stringify(d); assert.equal(validateCandidate(d).ok, true); assert.equal(JSON.stringify(d), before);
});

test('invalid header cannot consume either copy claim, write a packet, or invoke fixture reviewers', async () => {
  const out = await mkdtemp(join(tmpdir(), 'header-preclaim-'));
  const good = candidate(), input = join(out, 'candidate.json'), budget = join(out, 'budget.json');
  await writeFile(input, JSON.stringify(good));
  assert.equal((await inspect('claim-copy', input, budget)).ok, true);
  const first = await readFile(budget);
  for (const field of ['application_name', 'workflow_purpose']) {
    const bad = structuredClone(good); bad.header_copy[field] = field === 'application_name' ? oldName : oldPurpose;
    await writeFile(input, JSON.stringify(bad));
    const fresh = join(out, `fresh-${field}.json`);
    assert.equal((await inspect('claim-copy', input, fresh)).ok, false);
    await assert.rejects(stat(fresh), { code: 'ENOENT' });
    assert.equal((await inspect('claim-copy', input, budget)).ok, false);
    await assert.rejects(stat(budget + '.iteration-2'), { code: 'ENOENT' });
    assert.deepEqual(await readFile(budget), first);
    const packet = join(out, `packet-${field}.json`);
    assert.equal((await inspect('packet-copy', input, packet)).ok, false); await assert.rejects(stat(packet), { code: 'ENOENT' });
    let calls = 0;
    const result = await reviewLoop({ edit: async () => bad, copyCheck: async () => { calls++; }, check: async () => { calls++; }, render: async () => { calls++; } });
    assert.equal(result.ok, false); assert.equal(result.copy_reviews, 0); assert.equal(calls, 0);
  }
});

test('both packet types carry executable header policy, full source context, all header fields and grounding', async () => {
  const d = candidate(), before = structuredClone(d);
  for (const kind of ['copy', 'fact']) {
    const packet = await reviewPacket(kind, d, '/approved/synthetic-candidate.json');
    assert.deepEqual(packet.header_copy_policy, HEADER_COPY_POLICY);
    assert.deepEqual(packet.header_copy_contract, JSON.parse(JSON.stringify(headerCopyContract, (_, value) => value instanceof RegExp ? value.source : value)));
    assert.deepEqual(packet.header_review.claim_refs, d.header_copy.claim_refs);
    assert.equal(packet.header_review.claims.length, d.header_copy.claim_refs.length);
    assert.match(packet.header_review.requirements, /Independent source reads remain mandatory/);
    if (kind === 'copy') {
      assert.equal(packet.rule_versions.sdlc, 'scenario-run-v2'); assert.equal(packet.rule_versions.header_copy, '1.0');
      assert.equal(packet.review_contract.fields.rule_versions.fields.header_copy.values[0], '1.0');
      assert.deepEqual(packet.semantic_context.original_spec, { workflow: d.workflow, scenario: d.scenario });
      const header = packet.fields.filter(f => f.field_path.startsWith('$.header_copy.'));
      assert.equal(header.length, 5); assert.ok(header.every(f => !f.protected_source));
      for (const key of headerTextFields) assert.equal(header.find(f => f.field_path === `$.header_copy.${key}`).text, d.header_copy[key]);
      assert.ok(packet.references.some(r => r.name === 'style/header-copy-v1.md'));
    } else assert.deepEqual(packet.candidate, d);
  }
  assert.deepEqual(d, before);
});

test('header claims require known nonempty claim refs; styles cannot exempt or misroute human headers', async () => {
  const d = await snapshot();
  for (const refs of [[], ['absent']]) { const bad = structuredClone(d); bad.header_copy.claim_refs = refs; assert.equal(validate(bad).ok, false); }
  const p = d.copy_review.passages.find(p => p.field_path === '$.header_copy.workflow_purpose');
  p.guide = 'asd-ste100'; assert.ok(validateCopyReview(d, d.copy_review).errors.some(e => e.code === 'routing'));
  p.guide = 'economist'; assert.equal(validateCopyReview(d, d.copy_review).ok, true);
  d.copy_review.exemptions.push({ field_path: p.field_path, reason: 'Not actually protected source' });
  assert.equal(validateCopyReview(d, d.copy_review).ok, false);
});

test('every authored header edit invalidates BOTH reviews, even when all product budgets still pass', async () => {
  const base = await snapshot();
  for (const field of headerTextFields) {
    const d = structuredClone(base);
    d.header_copy[field] = field === 'application_name' ? 'Reply Station' : d.header_copy[field] + ' Again.';
    assert.equal(validateCandidate((({ review, copy_review, copy_review_iterations, ...c }) => c)(d)).ok, true);
    assert.notEqual(factualDigest(d), base.review.factual_digest);
    assert.ok(validateCopyReview(d, d.copy_review).errors.some(e => e.code === 'stale_review'));
    const { review, copy_review, copy_review_iterations, ...c } = d;
    assert.ok(validateFactualReview(c, review).errors.some(e => e.code === 'stale_review'));
    assert.equal(renderHtml(d).ok, false);
  }
});

test('new visible headings, queue, page title and prompt use exact authored short fields; original spec is retained', async () => {
  const d = candidate(); d.workflow.title = oldName; d.workflow.intended_world_effect = oldPurpose; d.scenario.expected_outcome = oldDescription;
  await scriptedReviews(d); const before = structuredClone(d), html = renderHtml(d).html;
  assert.match(html, /<h1>Reply Desk<\/h1>/); assert.match(html, /<title>Draft saved for review — Reply Desk<\/title>/);
  assert.match(html, /<p>Prepare customer replies for review\.<\/p>/);
  assert.equal((html.match(/<h[23]>Draft saved for review<\/h[23]>/g) ?? []).length, 2);
  const description = html.match(/<p class="description">([^<]*)<\/p>/)[1];
  assert.equal(description, `${d.header_copy.starting_context} ${d.header_copy.observed_result}`); assert.doesNotMatch(description, /Expected:/);
  assert.match(html, /Original workflow and scenario specification/); assert.ok(html.includes(oldDescription));
  const context = feedbackContext(d), runtime = feedbackRuntime();
  assert.equal(context.workflow_title, 'Reply Desk'); assert.equal(context.scenario_title, 'Draft saved for review');
  const prompt = runtime.compose(context, runtime.add(context, [], 'comment', 'issue', 'draft-1', 'Synthetic UI test feedback.'));
  for (const text of ['Continue work on Reply Desk', 'Scenario: Draft saved for review', d.header_copy.starting_context, d.header_copy.observed_result, oldName, oldPurpose, oldDescription, d.run.id, d.scenario.id]) assert.ok(prompt.includes(text), text);
  assert.ok(!prompt.includes(d.review.factual_digest));
  assert.deepEqual(d, before);
});

test('valid second-copy header product findings display real unresolved text; missing, stale or malformed reviews still block', async () => {
  const d = await snapshot(), p = d.copy_review.passages.find(p => p.field_path === '$.header_copy.observed_result');
  d.copy_review_iterations = 2; d.copy_review.verdict = 'revise'; p.sdlc_review = 'revise';
  d.copy_review.findings = [{ field_path: p.field_path, field_digest: p.field_digest, rule_group: 'header_copy', rule_id: 'HEADER-5', severity: 'required', explanation: 'Synthetic unresolved meaning finding, not real source approval.', semantic_risk: 'possible' }];
  assert.equal(validate(d).ok, true); assert.doesNotMatch(renderHtml(d).html, /Synthetic unresolved meaning finding|not copy approval/);
  assert.equal(d.copy_review.findings[0].explanation, 'Synthetic unresolved meaning finding, not real source approval.');
  for (const change of [b => { b.copy_review_iterations = 1; }, b => { b.copy_review_iterations = 3; }, b => { delete b.review; }, b => { b.copy_review.passages.pop(); }, b => { b.header_copy.observed_result += ' Changed.'; }, b => { delete b.copy_review.rule_versions.header_copy; }]) {
    const bad = structuredClone(d); change(bad); assert.equal(renderHtml(bad).ok, false);
  }
});

test('legacy draft 1.0 and snapshot 1.6 keep their original contracts and two-copy behavior without header migration', async () => {
  const input = bundle(), draft = draftFor(input); draft.schema_version = '1.0'; delete draft.header_copy;
  draft.context_copy = { workflow: { title: oldName, intended_world_effect: oldPurpose }, scenario: { expected_outcome: oldDescription } };
  const assembled = assembleCandidate(input, draft); assert.equal(assembled.ok, true);
  const d = assembled.snapshot; assert.equal(d.schema_version, '1.6'); assert.equal(d.header_copy, undefined);
  d.copy_review = fakeCopyReview(d); d.review = await fakeChecker().check(d); d.copy_review_iterations = 2; d.copy_review.verdict = 'revise';
  assert.deepEqual(d.copy_review.rule_versions, COPY_RULE_VERSIONS);
  const before = structuredClone(d), digest = factualDigest(d), html = renderHtml(d).html;
  assert.equal(prepareRenderSnapshot(d).ok, true); assert.ok(html.includes(oldName)); assert.ok(html.includes(`Expected: ${oldDescription}`));
  assert.doesNotMatch(html, /not copy approval/); assert.deepEqual(d, before); assert.equal(factualDigest(d), digest);
  const injected = structuredClone(d); injected.header_copy = candidate().header_copy; assert.equal(prepareRenderSnapshot(injected).ok, false);
  const wrongRules = structuredClone(d); wrongRules.copy_review.rule_versions.header_copy = '1.0'; assert.equal(prepareRenderSnapshot(wrongRules).ok, false);
  d.copy_review_iterations = 1; assert.equal(prepareRenderSnapshot(d).ok, false);
});
