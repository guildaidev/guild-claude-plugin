// Synthetic only: writes to an explicitly supplied NEW local directory.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { cases, scenario } from './scenarios.mjs';
import { fakeChecker, fakeCopyReview } from './fixtures.mjs';
import { reviewLoop } from '../scripts/workflow.mjs';
import { renderFile } from '../scripts/render.mjs';

const root = process.argv[2];
const selected = process.argv[3];
if (!root || (selected && !cases.some(([name]) => name === selected))) {
  console.log(JSON.stringify({ ok: false, message: 'Usage: node tests/run-fixtures.mjs NEW_OUTPUT_DIRECTORY [case-name]' }));
  process.exitCode = 1;
} else {
  await mkdir(root, { mode: 0o700 }); // Deliberately refuses an existing directory.
  const results = [];
  for (const [name] of cases.filter(([name]) => !selected || selected === name)) {
    const { doc, options } = scenario(name);
    const checker = fakeChecker(options);
    const firstChecker = name === 'editorial-correction' ? fakeChecker({ finding: 'conflict', gap: 'Independent fixture reports a draft, not a sent message.' }) : checker;
    let checks = 0, renders = 0;
    const result = await reviewLoop({
      edit: async ({ previous }) => {
        if (previous && name === 'renderer-repair') { previous.display.compact = false; return previous; }
        return doc;
      },
      copyCheck: async d => fakeCopyReview(d),
      check: d => (++checks === 1 ? firstChecker : checker).check(d),
      revise: async ({ candidate: d, review }) => {
        if (name === 'editorial-correction' && review?.findings.some(f => f.finding === 'conflict')) {
          d.timeline[1].description = 'Reply assistant saved a draft in Sandbox Mail; it did not send a message.';
          d.summary = d.run.observed_resulting_state = 'A draft was saved; sending was not observed.';
          d.header_copy.observed_result = d.summary;
          d.claims.find(c => c.id === 'claim-draft-1').text = d.timeline[1].description;
          d.claims.find(c => c.id === 'context').text = d.summary;
        }
        return d;
      },
      render: async d => {
        renders++;
        if (name === 'render-presentation-failure' || (name === 'renderer-repair' && renders === 1)) return { ok: false, errors: [{ path: '$output', code: 'fixture_render', message: 'Scripted fixture renderer failure.', repair: 'Repair display only or return the bounded failure.' }] };
        const input = join(root, `${name}-${renders}.snapshot.json`);
        await writeFile(input, JSON.stringify(d, null, 2), { flag: 'wx', mode: 0o600 });
        return renderFile(input, join(root, `${name}.html`));
      },
    });
    const expectedFailure = name === 'render-presentation-failure';
    const passed = result.ok === !expectedFailure && (expectedFailure ? result.exhausted === true : name === 'editorial-correction' ? result.copy_reviews === 2 && checks === 2 && renders === 1 : true);
    results.push({ name, passed, expected_failure: expectedFailure, checker_calls: firstChecker === checker ? checker.calls : [...firstChecker.calls, ...checker.calls], result });
  }
  const report = { ok: results.every(r => r.passed), origin: 'synthetic', limitations: ['Scripted editors and independent fake-source readers, not model-driven agents.', 'DOM/host stubs are tested separately; no live host acceptance or production transport.', 'No Guild/application workflows, model calls, credentials, or network access.'], results };
  const reportPath = join(root, 'report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ok: report.ok, report_path: resolve(reportPath), passed: results.filter(r => r.passed).length, total: results.length, origin: report.origin }));
  if (!report.ok) process.exitCode = 1;
}
