import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate, factualDigest } from '../scripts/contracts.mjs';
import { renderHtml, renderFile, intent } from '../scripts/render.mjs';
import { reviewLoop, presentArtifact } from '../scripts/workflow.mjs';
import { bundle, candidate, snapshot, fakeChecker, fakeCopyReview } from './fixtures.mjs';
import { cases, scenario } from './scenarios.mjs';

test('parent handoff includes all categories, exact versions and missing coverage', () => {
  const input = bundle();
  assert.equal(validate(input, 'bundle').ok, true);
  for (const category of ['workflow', 'scenario', 'run', 'actors', 'sessions', 'evidence', 'occurrences', 'artifacts', 'coverage', 'presentation']) {
    const missing = structuredClone(input); delete missing[category];
    assert.equal(validate(missing, 'bundle').ok, false, category);
  }
  assert.ok(input.run.agent_version_ids.length && input.run.application_version);
  const incomplete = scenario('relevant-omission-noise').input;
  assert.equal(validate(incomplete, 'bundle').ok, true);
  assert.match(incomplete.coverage.gaps[0].impact, /cannot/);
});

test('eval 1: complete checked story, inline artifact, synthetic independent calls', async () => {
  const checker = fakeChecker(); const doc = candidate();
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await checker.check(doc);
  doc.copy_review_iterations = 1;
  const result = renderHtml(doc);
  assert.equal(result.ok, true);
  assert.equal(checker.calls.length, doc.claims.length);
  assert.ok(checker.calls.every(c => c.operation === 'read' && c.source_id.startsWith('independent-fixture/') && c.observed_at));
  assert.ok(!checker.calls.some(c => doc.evidence.some(e => e.id === c.source_id)));
  assert.doesNotMatch(result.html, /Synthetic data|class="origin"/);
  assert.match(result.html, /<h3>Reply draft<\/h3>/);
  assert.match(result.html, /We open at nine/);
  assert.equal(doc.timeline.length, 3);
});

for (const name of ['downstream-session', 'relevant-omission-noise']) {
  test(`eval ${name === 'downstream-session' ? 2 : 10}: ${name}`, async () => {
    const { doc } = scenario(name); const checker = fakeChecker();
    doc.copy_review = fakeCopyReview(doc);
    doc.review = await checker.check(doc);
    doc.copy_review_iterations = 1;
    assert.equal(validate(doc).ok, true, JSON.stringify(validate(doc)));
    assert.ok(doc.timeline.some(e => e.id === 'mail-index'));
    assert.ok(doc.timeline.some(e => e.id === 'start-2'));
    assert.equal(doc.sessions.filter(s => s.level === 'top_level').length, 2);
    assert.ok(doc.timeline.every(e => !['child-start', 'unknown-start', 'read-plumbing', 'unrelated-mail'].includes(e.id)));
    if (name === 'relevant-omission-noise') assert.equal(doc.omitted_occurrences.length, 4);
    assert.ok(renderHtml(doc).html.includes('Indexed the draft.') || renderHtml(doc).html.includes('indexed the draft'));
    assert.equal(checker.calls.length, doc.claims.length);
  });
}

test('eval 3: factual correction gets fresh copy and factual reviews within the two-copy limit', async () => {
  const { doc } = scenario('editorial-correction');
  const conflict = fakeChecker({ finding: 'conflict', gap: 'Independent source has a draft, no delivery.' });
  const corrected = fakeChecker(); let checked = 0, copies = 0, renders = 0;
  const result = await reviewLoop({
    edit: async () => doc,
    copyCheck: async d => { copies++; return fakeCopyReview(d); },
    check: async d => (++checked === 1 ? conflict : corrected).check(d),
    revise: async ({ candidate: d, review }) => {
      if (review.findings.some(f => f.finding === 'conflict')) {
        d.timeline[1].description = 'Reply assistant saved a draft in Sandbox Mail; no message was sent.';
        d.run.observed_resulting_state = 'A draft was saved; no message was sent.';
        d.summary = d.run.observed_resulting_state;
        d.header_copy.observed_result = d.summary;
        d.claims.find(c => c.id === 'claim-draft-1').text = d.timeline[1].description;
        d.claims.find(c => c.id === 'context').text = d.summary;
      }
      return d;
    },
    render: async d => { renders++; return renderHtml(d); },
  });
   assert.equal(result.ok, true);
   assert.equal(checked, 2); assert.equal(copies, 2); assert.equal(renders, 1);
   assert.ok(conflict.calls.length); assert.ok(corrected.calls.length);
   assert.match(result.html, /no message was sent/);
});

test('eval 4: display-only renderer repair reuses both reviews; content repair stops at the copy budget', async () => {
  for (const factual of [false, true]) {
    const checker = fakeChecker(); let checks = 0, copies = 0, renders = 0;
    const { doc } = scenario('renderer-repair');
    const result = await reviewLoop({
      edit: async ({ previous, errors }) => {
        if (!previous) return doc;
        assert.ok(errors.every(e => e.path && e.repair));
        if (factual) previous.timeline[0].description += ' The narrative changed.';
        else previous.display.compact = true;
        return previous;
      },
      copyCheck: async d => { copies++; return fakeCopyReview(d); },
      check: async d => { checks++; return checker.check(d); },
      // Scripted renderer failure, not invalid source metadata or model behavior.
      render: async d => ++renders === 1 ? { ok: false, errors: [{ path: '$.display', code: 'fixture_render', message: 'Fixture renderer needs a display repair.', repair: 'Repair only display.compact.' }] } : renderHtml(d),
    });
    assert.equal(result.ok, true);
    assert.equal(result.attempts, 2);
    assert.equal(checks, factual ? 2 : 1); assert.equal(copies, factual ? 2 : 1);
    assert.equal(renders, 2);
  }
});

test('invalid candidate preflight does not spend the sole copy review or factual reads', async () => {
  const doc = candidate(); doc.timeline[0].actor_id = 'missing-actor';
  let copies = 0, facts = 0, renders = 0;
  const result = await reviewLoop({ edit: async () => doc,
    copyCheck: async d => { copies++; return fakeCopyReview(d); },
    check: async d => { facts++; return fakeChecker().check(d); },
    render: async d => { renders++; return renderHtml(d); } });
  assert.equal(result.ok, false); assert.equal(result.copy_reviews, 0);
  assert.ok(result.errors.some(e => e.code === 'missing_reference'));
  assert.equal(copies + facts + renders, 0);
});

test('combined reviewer identity is validated before even a permissive render callback', async () => {
  let renders = 0;
  const result = await reviewLoop({ edit: async () => candidate(), copyCheck: async d => fakeCopyReview(d),
    check: async d => ({ ...await fakeChecker().check(d), checker_id: d.copy_review.reviewer_id }),
    render: async () => { renders++; return { ok: true }; } });
  assert.equal(result.ok, false); assert.equal(renders, 0);
  assert.ok(result.errors.some(e => e.code === 'independence'));
});

async function copyFromArtifact(html, clipboardAvailable) {
  // Controller-only DOM/clipboard unit stub. The compiled React artifact is
  // exercised in check-feedback-browser.mjs, not approximated by this DOM stub.
  const { startFeedback } = await import('../scripts/feedback-browser.mjs');
  const { feedbackRuntime } = await import('../scripts/feedback.mjs');
  const script = `(${startFeedback.toString()})((${feedbackRuntime.toString()})(), { renderItems() {} });`;
  const context = html.match(/<textarea id="feedback-context"[^>]*>([\s\S]*?)<\/textarea>/)[1]
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  let listener, copied, selected = false;
  const elements = new Map();
  const node = () => ({ value: '', textContent: '', listeners: {}, classList: { remove() {}, add() {} }, setAttribute() {}, append() {}, replaceChildren() {}, focus() {}, select() { selected = true; }, addEventListener(name, fn) { this.listeners[name] = fn; } });
  const get = id => { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); };
  get('feedback-context').value = context;
  runInNewContext(script, {
    document: { addEventListener: (_, fn) => { listener = fn; }, getElementById: get, createElement: node, querySelectorAll: () => [], querySelector: () => node() },
    navigator: clipboardAvailable ? { clipboard: { writeText: async text => { copied = text; } } } : {},
  });
  listener({ target: { closest: () => ({ hasAttribute: name => name === 'data-add-correct', dataset: { action: 'correct' } }) } });
  await get('copy-prompt').listeners.click();
  return { text: get('prompt-preview').value, copied, selected, status: get('copy-status').textContent };
}

const copiedIntent = text => Object.fromEntries(text.split('\n').map(line => {
  const separator = line.indexOf(': ');
  return [line.slice(0, separator), line.slice(separator + 2)];
}));

test('eval 5: artifact-owned copying works after editor closure, with manual fallback', async () => {
  let editor = await snapshot(); const html = renderHtml(editor).html;
  const expected = intent(editor, 'correct');
  // Event-scoped intents remain valid data, but no extra event control is rendered.
  assert.equal(intent(editor, 'correct', 'start-1').event_id, 'start-1');
  assert.throws(() => intent(editor, 'correct', 'missing-event'));
  editor = null; // The copy handler has no editor/session dependency.
  for (const available of [true, false]) {
    const result = await copyFromArtifact(html, available);
    assert.equal(result.selected, !available);
    const payload = copiedIntent(result.copied ?? result.text);
    assert.equal(payload.Snapshot, undefined);
    assert.equal(payload.Run, expected.run_id);
    assert.equal(payload['Scenario ID'], expected.scenario_id);
    assert.equal(payload['Parent conversation'], undefined);
    assert.equal(payload.Intent, undefined);
    assert.equal(payload['Requested action'], expected.action);
    assert.equal(payload.event_id, undefined);
    assert.equal(payload.Execution, undefined);
    assert.match(result.status, /Nothing was sent or applied/);
  }
  const run = await copyFromArtifact(html, false);
  const runIntent = copiedIntent(run.text);
  assert.equal(runIntent.event_id, undefined);
  assert.equal(runIntent['Requested action'], 'mark_run_correct');
  assert.equal(runIntent.Execution, undefined);
  assert.equal(runIntent['Parent conversation'], undefined);
  assert.equal(run.selected, true);
  // Simulation of an optional parent-owned bridge, NOT shipped transport code.
  for (const host of ['terminal-browser', 'claude-desktop', 'opencode', 'claude-ai']) {
    const originalParent = [];
    const simulatedBridge = async payload => originalParent.push(structuredClone(payload));
    await simulatedBridge(expected);
    assert.deepEqual(originalParent, [expected], host);
    assert.equal(originalParent[0].parent_conversation_ref, 'parent-conversation-1');
    assert.equal(originalParent[0].execution, 'not_performed');
  }
});

const uncertaintyChecks = {
  'attempt-versus-effect': /acceptance does not establish/,
  'contradictory-verification': /Sources conflict/,
  'verification-unavailable': /authorized fixture source read was unavailable/,
  'current-state-not-causation': /does not establish that this run created it/,
  'partial-failure': /send failed/,
  'ambiguous-order': /Order is uncertain/,
};
for (const [name, expected] of Object.entries(uncertaintyChecks)) {
  test(`eval ${cases.findIndex(c => c[0] === name) + 1}: ${name}`, async () => {
    const { doc, options } = scenario(name); const checker = fakeChecker(options);
    doc.copy_review = fakeCopyReview(doc);
    doc.review = await checker.check(doc);
    doc.copy_review_iterations = 1;
    const result = renderHtml(doc);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.match(result.html, expected);
    assert.equal(checker.calls.length, doc.claims.length);
    if (name === 'partial-failure') {
      assert.equal(doc.timeline.find(e => e.id === 'draft-1').outcome, 'confirmed');
      assert.equal(doc.timeline.find(e => e.id === 'failed-send').outcome, 'failed');
      assert.match(result.html, /Run status<\/dt><dd>partial/);
    }
    if (name === 'ambiguous-order') {
      assert.ok(doc.timeline.every(e => !e.time));
      assert.match(result.html, /Time: Unknown/);
      assert.match(result.html, /inferred/);
    }
    if (name === 'verification-unavailable') assert.ok(doc.review.checks.every(c => c.result === 'unavailable'));
  });
}

test('eval 13: bounded rendering failure and honest presentation failures', async () => {
  const { doc } = scenario('render-presentation-failure'); const checker = fakeChecker();
  let copies = 0;
  const result = await reviewLoop({ edit: async () => doc, copyCheck: async d => { copies++; return fakeCopyReview(d); }, check: d => checker.check(d),
    render: async () => ({ ok: false, errors: [{ path: '$output', code: 'fixture_render', message: 'Scripted output failure.', repair: 'Return a diagnostic; no artifact exists.' }] }) });
  assert.equal(result.ok, false); assert.equal(result.exhausted, true); assert.equal(result.attempts, 3);
  assert.equal(copies, 1); assert.equal(result.copy_reviews, 1);
  assert.equal(result.artifact_path, undefined);
  const path = '/fictional/review.html';
  const good = { ok: true, artifact_path: path };
  let chosen;
  const terminal = await presentArtifact(good, { host: 'terminal', sidebarVerified: true, openSidebar: async () => { chosen = 'sidebar'; }, openBrowser: async () => { chosen = 'browser'; return { observed: true }; } });
  assert.equal(chosen, 'browser'); assert.equal(terminal.presented, true);
  const missing = await presentArtifact(good, { host: 'desktop' });
  assert.equal(missing.presented, false); assert.equal(missing.artifact_path, path);
  const failure = await presentArtifact(good, { host: 'terminal', openBrowser: async () => { throw new Error('opener failed'); } });
  assert.equal(failure.presented, false); assert.equal(failure.rendered, true);
  const dispatch = await presentArtifact(good, { host: 'terminal', openBrowser: async () => ({ dispatched: true }) });
  assert.equal(dispatch.presented, false);
  const sidebar = await presentArtifact(good, { host: 'desktop', sidebarVerified: true, openSidebar: async () => ({ observed: true }) });
  assert.equal(sidebar.route, 'sidebar'); assert.equal(sidebar.feedback, 'copy-to-chat');
  assert.equal((await presentArtifact(result, { host: 'terminal' })).rendered, false);
});

test('safe deterministic HTML, safe links, no resources or fixture secret, credential rejection', async () => {
  const doc = await snapshot();
  doc.artifacts[0].content = '<script>steal()</script><img src="https://evil.test/x" onerror="steal()"> & </textarea>';
  doc.copy_review = fakeCopyReview(doc);
  doc.review = await fakeChecker().check(doc);
  const result = renderHtml(doc);
  assert.equal(result.ok, true);
  assert.equal(result.html, renderHtml(doc).html);
  assert.ok(!result.html.includes('<img src='));
  assert.ok(!result.html.includes('<script>steal()'));
  assert.match(result.html, /&lt;script&gt;steal/);
  assert.match(result.html, /connect-src &#39;none&#39;/);
  // React uses a local MessageChannel scheduler, not a parent-bound bridge.
  assert.doesNotMatch(result.html, /window\.parent|window\.opener|parent\.postMessage/);
  assert.match(result.html, /rel="noopener noreferrer"/);
  const fixtureSecret = 'sk-ant-FAKE-CREDENTIAL-1234567890';
  assert.ok(!result.html.includes(fixtureSecret));
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,hello', 'https://u:p@example.test/x', 'https://example.test/?token=x', 'https://example.test/#secret']) {
    const bad = structuredClone(doc); bad.artifacts[0].source_url = unsafe;
    assert.equal(renderHtml(bad).ok, false);
  }
  doc.evidence[0].content = fixtureSecret;
  assert.equal(renderHtml(doc).ok, false);
});

test('file renderer returns path or actionable errors, permissions and overwrite protection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'guild-review-unit-'));
  const input = join(dir, 'snapshot.json'); const output = join(dir, 'review.html');
  const doc = await snapshot();
  await writeFile(input, JSON.stringify(doc), { mode: 0o600 });
  const result = await renderFile(input, output);
  assert.equal(result.ok, true); assert.equal(result.artifact_path, output);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  const html = await readFile(output, 'utf8'); assert.equal(html, renderHtml(doc).html);
  assert.equal((await renderFile(input, output)).errors[0].code, 'EEXIST');
  assert.equal(await readFile(output, 'utf8'), html);
  await writeFile(input, 'not JSON');
  assert.equal((await renderFile(input, join(dir, 'bad.html'))).errors[0].code, 'invalid_json');
  assert.equal((await renderFile(input, 'bad.txt')).ok, false);
  assert.equal((await renderFile(join(dir, 'missing'), join(dir, 'new.html'))).errors[0].code, 'ENOENT');
});

test('digest binds each factual category; reviewed display remains nonfactual', async () => {
  const doc = await snapshot(); const original = factualDigest(doc);
  for (const field of ['summary', 'workflow', 'scenario', 'run', 'actors', 'sessions', 'evidence', 'artifacts', 'coverage', 'presentation', 'timeline', 'claims', 'omitted_occurrences']) {
    const changed = structuredClone(doc); changed[field] = { changed: true };
    assert.notEqual(factualDigest(changed), original, field);
  }
  doc.display.compact = true;
  assert.equal(factualDigest(doc), original);
});

test('actual renderer CLI emits JSON with correct success and failure exit codes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'guild-review-cli-'));
  const input = join(dir, 'snapshot.json'); const output = join(dir, 'review.html');
  await writeFile(input, JSON.stringify(await snapshot()), { mode: 0o600 });
  const cli = fileURLToPath(new URL('../scripts/render.mjs', import.meta.url));
  const success = spawnSync(process.execPath, [cli, input, output], { encoding: 'utf8' });
  assert.equal(success.status, 0); assert.equal(success.stderr, '');
  assert.equal(JSON.parse(success.stdout).artifact_path, output);
  const failure = spawnSync(process.execPath, [cli, input, output], { encoding: 'utf8' });
  assert.equal(failure.status, 1); assert.equal(failure.stderr, '');
  assert.equal(JSON.parse(failure.stdout).errors[0].code, 'EEXIST');
});
