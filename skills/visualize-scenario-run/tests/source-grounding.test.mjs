import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { bundle, sourceBoundCandidate } from './fixtures.mjs';
import { concernFixture } from './concern-fixture.mjs';
import { copyFields, factualDigest, validateCandidate } from '../scripts/contracts.mjs';
import { renderHtml } from '../scripts/render.mjs';
import { validatedFeedbackContext } from '../scripts/feedback-context.mjs';
import { createSourceGroundingReport, validateSourceGroundingReport, sourceGroundingAuthorFeedback,
  SOURCE_GROUNDING_VERSION, SOURCE_GROUNDING_LIMITS } from '../scripts/source-grounding.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const field = (report, path = '$.timeline[1].supporting_detail') => report.inventory.find(item => item.field_path === path);
function setup(text, content = {}) {
  const source = bundle();
  source.evidence[1].content = { ...source.evidence[1].content, ...content };
  const candidate = sourceBoundCandidate(source);
  candidate.timeline[1].supporting_detail = text;
  return { candidate, source };
}
function reportFor(candidate, source = candidate.source_bundle) {
  const result = createSourceGroundingReport(candidate, source);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(validateSourceGroundingReport(candidate, source, result.report).ok, true);
  return result.report;
}

test('preflight catches the unsupported parameter regression before any claim or review, without editing', () => {
  const { candidate, source } = setup('The request set maxDepth: 1.');
  const before = structuredClone({ candidate, source });
  const report = reportFor(candidate, source), detail = field(report).details[0];
  assert.equal(report.report_version, SOURCE_GROUNDING_VERSION);
  assert.equal(report.semantic_status, 'not_assessed');
  assert.equal(report.candidate_digest, factualDigest(candidate));
  assert.equal(detail.kind, 'parameter');
  assert.equal(detail.status, 'missing_literal_support');
  assert.equal(candidate.timeline[1].supporting_detail.slice(detail.start, detail.end), 'maxDepth: 1');
  assert.deepEqual(field(report).context.claim_refs, ['claim-draft-1']);
  assert.deepEqual(field(report).context.evidence_refs, ['e-draft']);
  assert.deepEqual(detail.anchors, []);
  assert.deepEqual({ candidate, source }, before);
  assert.equal(candidate.copy_review, undefined);
});

for (const name of ['pageLimit', 'batch_size', 'jitterWindow', 'queryCap']) {
  test(`general parameter analysis is not hardcoded to the historical name: ${name}`, () => {
    const { candidate, source } = setup(`The code sets ${name}: 7.`);
    const report = reportFor(candidate, source);
    assert.equal(field(report).details[0].status, 'missing_literal_support');
    assert.equal(field(report).details[0].kind, 'parameter');
    const grounded = setup(`The code sets ${name}: 7.`, { [name]: 7 });
    const supported = field(reportFor(grounded.candidate, grounded.source)).details[0];
    assert.equal(supported.status, 'supported_literal');
    assert.deepEqual(supported.anchors.map(anchor => anchor.match), ['parameter_key', 'parameter_value']);
    assert.ok(supported.anchors.every(anchor => anchor.evidence_refs.includes('e-draft')));
  });
}

test('actual source assignment, quoted code and implementation numbers retain literal anchors', () => {
  const { candidate, source } = setup('The code sets retryCount = 3. It calls `save_draft`. The timeout is 250 ms.', {
    log: 'retryCount: 3; save_draft completed; timeout was 250 ms.',
  });
  const report = reportFor(candidate, source), details = field(report).details;
  assert.equal(details.length, 3);
  assert.ok(details.every(detail => detail.status === 'supported_literal'));
  assert.equal(details[0].anchors[0].match, 'parameter_assignment');
  assert.equal(details[1].kind, 'code_literal');
  for (const detail of details) {
    assert.ok(detail.anchors.length);
    for (const anchor of detail.anchors) {
      assert.match(anchor.source_path, /^\$\.source_bundle\.evidence\[1\]\.content\[field:\d+\]$/);
      assert.ok(anchor.end > anchor.start);
      assert.ok(anchor.completeness === 'complete');
    }
  }
});

test('a key and unrelated matching number do not establish a parameter assignment', () => {
  const { candidate, source } = setup('The code sets maxItems: 3.', { maxItems: 9, unrelated: 3 });
  const detail = field(reportFor(candidate, source)).details[0];
  assert.equal(detail.status, 'ambiguous_support');
  assert.equal(detail.reason, 'parameter_components_do_not_establish_assignment');
  assert.equal(detail.anchors.length, 0);
  assert.ok(detail.component_anchors.length);
});

test('CLI option assignments also preserve the option/value binding', () => {
  const { candidate, source } = setup('The code uses `--page-size=12`.', { '--page-size': 8, unrelated: 12 });
  const detail = field(reportFor(candidate, source)).details[0];
  assert.equal(detail.kind, 'parameter');
  assert.notEqual(detail.status, 'supported_literal');
  const grounded = setup('The code uses `--page-size=12`.', { '--page-size': 12 });
  assert.equal(field(reportFor(grounded.candidate, grounded.source)).details[0].status, 'supported_literal');
});

test('scalar types and complete values are not interchangeable or prefix matched', () => {
  for (const [text, content] of [
    ['The code sets maxItems: 3.', { maxItems: '3' }],
    ['The code sets maxItems: "3".', { maxItems: 3 }],
    ['The code sets maxItems: 3.', { maxItems: 30 }],
    ['The code sets maxItems: true.', { maxItems: 'true' }],
  ]) {
    const { candidate, source } = setup(text, content);
    assert.notEqual(field(reportFor(candidate, source)).details[0].status, 'supported_literal');
  }
  for (const [text, content] of [
    ['The code sets modeName: "safe".', { modeName: 'safe' }],
    ['The code sets enabledFlag: false.', { enabledFlag: false }],
    ['The code sets retryCap: -2.', { retryCap: -2 }],
    ['The code sets unsetValue: null.', { unsetValue: null }],
  ]) {
    const { candidate, source } = setup(text, content);
    assert.equal(field(reportFor(candidate, source)).details[0].status, 'supported_literal');
  }
});

test('uncited records remain references, not literal support borrowed across claims', () => {
  const { candidate, source } = setup('The code sets searchLimit: 4.');
  source.evidence[0].content.searchLimit = 4;
  const current = sourceBoundCandidate(source);
  current.timeline[1].supporting_detail = candidate.timeline[1].supporting_detail;
  const detail = field(reportFor(current, source)).details[0];
  assert.equal(detail.status, 'ambiguous_support');
  assert.equal(detail.reason, 'only_uncited_references');
  assert.equal(detail.anchors.length, 0);
  assert.ok(detail.reference_anchors.some(anchor => anchor.evidence_refs.includes('e-session')));
});

test('summary/excerpt evidence, conflicting values and qualifiers remain ambiguous, never automatic edits', () => {
  for (const completeness of ['summary', 'excerpt']) {
    const source = bundle(); source.evidence[1].content.retryCap = 2;
    source.evidence[1].completeness = completeness;
    const candidate = sourceBoundCandidate(source); candidate.timeline[1].supporting_detail = 'The code sets retryCap: 2.';
    assert.equal(field(reportFor(candidate, source)).details[0].status, 'ambiguous_support');
  }
  const { candidate, source } = setup('The code may not set retryCap: 2 unless the input is checked.', { retryCap: 2 });
  const before = structuredClone(candidate);
  const detail = field(reportFor(candidate, source)).details[0];
  assert.equal(detail.status, 'ambiguous_support');
  assert.deepEqual(detail.contextual_modifiers, ['negated', 'qualified']);
  assert.deepEqual(candidate, before);
  const conflicting = setup('The code sets retryCap: 2.', { states: [{ retryCap: 2 }, { retryCap: 6 }] });
  assert.equal(field(reportFor(conflicting.candidate, conflicting.source)).details[0].status, 'ambiguous_support');
  const conflictingText = setup('The code sets retryCap: 2.', { log: 'retryCap: 2; retryCap: 6.' });
  assert.equal(field(reportFor(conflictingText.candidate, conflictingText.source)).details[0].status, 'ambiguous_support');
  const qualified = setup('The code sets retryCap: 2.', { log: 'The code may not set retryCap: 2.' });
  assert.equal(field(reportFor(qualified.candidate, qualified.source)).details[0].status, 'ambiguous_support');
});

test('ordinary world prose and ISO/time values are not treated as implementation parameters', () => {
  const { candidate, source } = setup('At 2026-11-15T22:44:30Z the customer asked 2 questions. At 22:48 the shop served 10 people.');
  candidate.summary = 'The customer bought 3 books for 10 dollars and asked about 2 opening days.';
  const report = reportFor(candidate, source);
  assert.deepEqual(field(report).details, []);
  assert.deepEqual(field(report, '$.summary').details, []);
});

test('all current authored fields, including concern/human fix/TECH text, retain route and reference contexts', () => {
  const { doc, input } = concernFixture();
  doc.timeline[1].concern.explanation = 'The code uses unsupportedMode: 8.';
  doc.timeline[1].suggested_feedback.explanation = 'Check unsupportedMode: 8 before the next draft.';
  doc.timeline[1].suggested_feedback.text = 'Do not enable unsupportedMode: 8 unless the upstream source confirms the setting.';
  const report = reportFor(doc, input);
  assert.deepEqual(report.inventory.map(item => [item.field_path, item.field_digest]),
    copyFields(doc).filter(item => !item.protected_source).map(item => [item.field_path, item.field_digest]));
  for (const [suffix, role] of [['concern.explanation', 'concern'], ['suggested_feedback.explanation', 'human_fix'], ['suggested_feedback.text', 'technical_fix']]) {
    const current = field(report, `$.timeline[1].${suffix}`);
    assert.equal(current.context.role, role);
    assert.deepEqual(current.context.evidence_refs, ['e-draft']);
    assert.ok(current.details.some(detail => detail.status === 'missing_literal_support'));
  }
  assert.ok(!report.inventory.some(item => item.field_path.endsWith('.after') || item.field_path.endsWith('.content')));
});

test('a supported parameter within inline code does not hide an unsupported function beside it', () => {
  const { candidate, source } = setup('The code calls `newFunction(limit: 3)`.', { limit: 3 });
  const details = field(reportFor(candidate, source)).details;
  assert.equal(details.length, 2);
  assert.equal(details[0].kind, 'code_literal');
  assert.equal(details[0].status, 'missing_literal_support');
  assert.equal(details[1].status, 'supported_literal');
});

test('fixed specification and copied event fields use real source paths, including hyphenated numeric units', () => {
  const source = bundle();
  source.workflow.intended_world_effect = 'Use a 10-second timeout and retryCap: 2 to prepare a draft.';
  source.occurrences[1].world_effect.change = 'The code used draft_id.';
  const candidate = sourceBoundCandidate(source), report = reportFor(candidate, source);
  for (const path of ['$.workflow.intended_world_effect', '$.timeline[1].world_effect.change']) {
    const details = field(report, path).details;
    assert.ok(details.length > 0);
    assert.ok(details.every(detail => detail.status === 'supported_literal'), JSON.stringify(details));
  }
});

test('reports bind current exact candidate, inventory and source, including display-only changes', () => {
  const { candidate, source } = setup('The code uses queueLimit: 4.', { queueLimit: 4 });
  const report = reportFor(candidate, source);
  for (const change of [
    doc => { doc.summary += ' Still no sending.'; },
    doc => { doc.claims[0].text += ' Qualifier retained.'; },
    doc => { doc.display.compact = !doc.display.compact; },
    doc => { doc.timeline[1].supporting_detail += ' Unknown implementation.'; },
  ]) {
    const changed = structuredClone(candidate); change(changed);
    const checked = validateSourceGroundingReport(changed, source, report);
    assert.equal(checked.ok, false);
    assert.ok(checked.errors.some(error => error.code === 'stale_grounding_report'));
  }
});

test('source copying and independently supplied collector source prevent tamper and cross-binding', () => {
  const { candidate, source } = setup('The code uses queueLimit: 4.', { queueLimit: 4 });
  for (const change of [
    doc => { doc.evidence[1].content.queueLimit = 3; },
    doc => { doc.source_bundle.evidence[1].content.queueLimit = 3; },
    doc => { doc.run.id = 'another-run'; },
    doc => { doc.artifacts[0].after = 'Changed captured content'; },
    doc => { doc.timeline[1].claim_refs = ['absent']; },
  ]) {
    const changed = structuredClone(candidate); change(changed);
    assert.equal(createSourceGroundingReport(changed, source).ok, false);
  }
  const changed = structuredClone(candidate);
  changed.source_bundle.evidence[1].content.queueLimit = 3;
  changed.evidence[1].content.queueLimit = 3;
  assert.equal(validateCandidate(changed).ok, true); // internal agreement alone is insufficient
  assert.equal(createSourceGroundingReport(changed, source).errors[0].code, 'grounding_source_mismatch');
  const other = structuredClone(source); other.bundle_id = 'other-bundle';
  assert.equal(createSourceGroundingReport(candidate, other).ok, false);
  assert.equal(createSourceGroundingReport(candidate).ok, false);
});

test('report format is closed, recomputed, and rejects invented approvals, anchors and omitted fields', () => {
  const { candidate, source } = setup('The code uses queueLimit: 4.', { queueLimit: 4 });
  const report = reportFor(candidate, source);
  for (const change of [
    r => { r.approved = true; },
    r => { r.report_version = '2.0'; },
    r => { r.inventory.pop(); },
    r => { field(r).details[0].status = 'missing_literal_support'; },
    r => { field(r).details[0].anchors[0].start = 9000; },
    r => { field(r).details[0].invented_source = 'safe'; },
    r => { r.counts.supported_literal++; },
    r => { r.source_digest = '0'.repeat(64); },
  ]) {
    const altered = structuredClone(report); change(altered);
    assert.equal(validateSourceGroundingReport(candidate, source, altered).ok, false);
  }
});

test('malformed, non-JSON, unbounded and sensitive candidates fail without leaking content', () => {
  const { candidate, source } = setup('The code uses queueLimit: 4.');
  const cycle = {}; cycle.self = cycle;
  const accessor = {}; Object.defineProperty(accessor, 'secret', { enumerable: true, get() { throw Error('must not run'); } });
  for (const bad of [null, cycle, accessor, { ...candidate, extra: Infinity }, { ...candidate, extra: new Date() },
    { ...candidate, extra: new Array(2) },
    { ...candidate, summary: 'x'.repeat(SOURCE_GROUNDING_LIMITS.fieldCharacters + 1) },
    { ...candidate, summary: 'Bearer abcdefghijklmnopqrstuvwxyz' },
    { ...candidate, summary: 'sk-ant-abcdefghijklmnopqrstuv' },
    { ...candidate, schema_version: '1.8' },
  ]) {
    const checked = createSourceGroundingReport(bad, source);
    assert.equal(checked.ok, false);
    assert.doesNotMatch(JSON.stringify(checked), /abcdefghijklmnopqrstuvwxyz|sk-ant|must not run/);
  }
  const keySecret = structuredClone(source); keySecret.evidence[1].content.api_key = 'private-marker';
  assert.equal(createSourceGroundingReport(candidate, keySecret).ok, false);
  let deep = null; for (let i = 0; i < SOURCE_GROUNDING_LIMITS.depth + 2; i++) deep = { next: deep };
  assert.equal(createSourceGroundingReport(deep, source).errors[0].code, 'grounding_input_bounds');
});

test('detail, source-index and field-count limits fail explicitly instead of silently truncating', () => {
  const manyDetails = setup(Array.from({ length: SOURCE_GROUNDING_LIMITS.targets + 1 }, (_, i) => `param${i}: 1`).join(' '));
  assert.equal(createSourceGroundingReport(manyDetails.candidate, manyDetails.source).errors[0].code, 'grounding_analysis_bounds');
  const manyFields = setup('The code is unchanged.');
  for (let i = 0; i < SOURCE_GROUNDING_LIMITS.fields; i++) manyFields.candidate.claims.push({ id: `extra-${i}`, text: 'Plain text.', evidence_refs: ['e-draft'] });
  assert.equal(createSourceGroundingReport(manyFields.candidate, manyFields.source).errors[0].code, 'grounding_inventory_bounds');
  const source = bundle(); source.evidence[1].content.index = Object.fromEntries(Array.from({ length: 16000 }, (_, i) => [`key${i}`, i]));
  const candidate = sourceBoundCandidate(source);
  assert.equal(createSourceGroundingReport(candidate, source).errors[0].code, 'grounding_analysis_bounds');
});

test('private author feedback is bounded, value-free and never changes normal HTML/prompt admission', () => {
  const { candidate, source } = setup('Do not set confidentialOption: 7.');
  const before = structuredClone(candidate), report = reportFor(candidate, source);
  const feedback = sourceGroundingAuthorFeedback(candidate, source, report, { maxItems: 1 });
  assert.equal(feedback.ok, true);
  assert.equal(feedback.feedback.items.length, 1);
  assert.equal(feedback.feedback.items[0].role, 'technical_detail');
  assert.doesNotMatch(JSON.stringify(feedback), /confidentialOption|Do not set/);
  for (const maxItems of [0, 33, 1.5, Infinity, '3']) assert.equal(sourceGroundingAuthorFeedback(candidate, source, report, { maxItems }).ok, false);
  const html = renderHtml(candidate);
  assert.equal(html.ok, true); // unreviewed quality is not render admission
  for (const output of [html.html, JSON.stringify(validatedFeedbackContext(candidate))]) {
    assert.doesNotMatch(output, /private_author_preflight|semantic_status|reference_anchors|source_digest|grounding_report|component_anchors/);
  }
  assert.deepEqual(candidate, before);
  candidate.summary += ' Changed.';
  assert.equal(sourceGroundingAuthorFeedback(candidate, source, report).ok, false);
});

test('ordinal payload-key anchors do not echo arbitrary source keys or source prose', () => {
  const { candidate, source } = setup('The code calls `example_call`.', {
    'INTERNAL-PRIVATE-KEY-LABEL': 'example_call is present in this private source sentence.',
  });
  const report = reportFor(candidate, source);
  assert.equal(field(report).details[0].status, 'supported_literal');
  assert.doesNotMatch(JSON.stringify(report), /INTERNAL-PRIVATE-KEY-LABEL|private source sentence|example_call/);
});

test('returned report anchors cannot mutate original source arrays through shared references', () => {
  const source = bundle();
  source.occurrences[1].description = 'The code used literalToken.';
  const candidate = sourceBoundCandidate(source), before = structuredClone({ candidate, source });
  const report = reportFor(candidate, source);
  const anchors = report.inventory.flatMap(item => item.details.flatMap(detail => [...detail.anchors, ...detail.component_anchors, ...detail.reference_anchors]));
  assert.ok(anchors.some(anchor => anchor.source_path.startsWith('$.source_bundle.occurrences')));
  for (const anchor of anchors) anchor.evidence_refs.push('attempted-mutation');
  assert.deepEqual({ candidate, source }, before);
  assert.equal(validateSourceGroundingReport(candidate, source, report).ok, false);
});

test('actual retained candidate catches historical unsupported parameter while source/candidate/budget bytes remain unchanged', {
  skip: !process.env.SOURCE_GROUNDING_RETAINED_DIR && 'Set SOURCE_GROUNDING_RETAINED_DIR explicitly for the read-only retained-source check.',
}, async t => {
  const root = process.env.SOURCE_GROUNDING_RETAINED_DIR;
  const names = ['bundle.json', 'candidate.json', 'candidate2.json', 'version-sources.json', 'copy-review-budget.json', 'copy-review-budget.json.iteration-2'];
  const before = await Promise.all(names.map(name => readFile(join(root, name))));
  const source = JSON.parse(before[0]), candidate = JSON.parse(before[1]);
  const report = reportFor(candidate, source);
  const currentFields = new Map(copyFields(candidate).map(item => [item.field_path, item.text]));
  const historical = report.inventory.flatMap(item => item.details.map(detail => ({
    text: currentFields.get(item.field_path).slice(detail.start, detail.end), detail,
  }))).find(item => /maxDepth\s*:\s*1/.test(item.text));
  assert.ok(historical, 'The actual original authored detail must be inventoried.');
  assert.equal(historical.detail.status, 'missing_literal_support');
  assert.equal(historical.detail.anchors.length, 0);
  const revised = JSON.parse(before[2]);
  const revisedReport = reportFor(revised, source);
  assert.equal(validateSourceGroundingReport(revised, source, report).ok, false);
  const after = await Promise.all(names.map(name => readFile(join(root, name))));
  assert.deepEqual(after.map(sha), before.map(sha));
  t.diagnostic(`Read-only actual source: ${report.counts.fields} original authored fields/${report.counts.details} implementation details; ${revisedReport.counts.fields} revised fields; ${names.length} input/budget byte hashes unchanged. Not semantic approval or a measured speedup.`);
});
