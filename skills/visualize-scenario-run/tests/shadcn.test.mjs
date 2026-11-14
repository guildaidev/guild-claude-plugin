import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, cp, writeFile, stat, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { renderHtml } from '../scripts/render.mjs';
import { factualDigest } from '../scripts/contracts.mjs';
import { snapshot, fakeChecker } from './fixtures.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
test('genuine local shadcn components and compiled assets are packaged with licenses', async () => {
  const button = await readFile(join(root, 'ui/src/components/button.jsx'), 'utf8');
  assert.match(button, /from '@radix-ui\/react-slot'/);
  assert.match(button, /from 'class-variance-authority'/);
  assert.match(button, /React\.forwardRef/);
  for (const name of ['button', 'card', 'textarea']) assert.match(await readFile(join(root, `ui/src/components/${name}.jsx`), 'utf8'), /shadcn\/ui new-york/);
  const entry = await readFile(join(root, 'ui/src/browser.jsx'), 'utf8');
  assert.match(entry, /<Card/); assert.match(entry, /<Button/);
  for (const path of ['scripts/feedback-browser.mjs', 'ui/src/browser.jsx', 'ui/src/server.jsx']) {
    assert.doesNotMatch(await readFile(join(root, path), 'utf8'), /dangerouslySetInnerHTML|\.innerHTML|postMessage|localStorage|sessionStorage|\bfetch\(/, path);
  }
  const css = await readFile(join(root, 'ui/dist/ui.css'), 'utf8');
  assert.match(css, /tailwindcss v4\.1\.17/); assert.match(css, /\.inline-flex/);
  assert.doesNotMatch(css, /@import|url\(/);
  const licenses = await readFile(join(root, 'ui/dist/THIRD-PARTY-LICENSES.txt'), 'utf8');
  for (const text of ['Copyright (c) 2023 shadcn', 'react@19.2.0', '@radix-ui/react-slot@1.2.4', 'Permission is hereby granted']) assert.ok(licenses.includes(text));
  const lock = JSON.parse(await readFile(join(root, 'ui/package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/react'].version, '19.2.0');
});

test('generated review has exact hash-only CSP and no external resource elements or inline styles', async () => {
  const doc = await snapshot(), before = structuredClone(doc);
  const html = renderHtml(doc).html;
  for (const tag of ['style', 'script']) {
    const content = html.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))[1];
    const digest = createHash('sha256').update(content).digest('base64');
    assert.ok(html.includes(`${tag}-src &#39;sha256-${digest}&#39;`));
  }
  const markup = html.split('<script>')[0];
  assert.doesNotMatch(markup, /<img\b|<iframe\b|<link\b|\sstyle=|<script\s+src=/);
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval|<script[^>]+src=/);
  for (const directive of ['default-src', 'connect-src', 'img-src', 'form-action']) assert.ok(html.includes(`${directive} &#39;none&#39;`));
  assert.deepEqual(doc, before); assert.equal(factualDigest(doc), factualDigest(before));
});

test('header removes clutter without dropping exact technical metadata or inventing new copy', async () => {
  const doc = await snapshot(), html = renderHtml(doc).html;
  const header = html.match(/<header class="top">([\s\S]*?)<\/header>/)[1];
  assert.ok(header.includes(`<h1>${doc.header_copy.application_name}</h1>`));
  assert.ok(header.includes(doc.header_copy.workflow_purpose));
  assert.ok(!header.includes(doc.workflow.intended_world_effect));
  assert.doesNotMatch(header, /Scenario run review/);
  const intro = html.match(/<div class="scenario-intro">([\s\S]*?)<div class="timeline"/)[1];
  assert.doesNotMatch(intro, /run-meta|guidance|Add feedback with/);
  assert.ok(intro.includes(doc.header_copy.scenario_name));
  assert.ok(intro.includes(doc.header_copy.starting_context)); assert.ok(intro.includes(doc.header_copy.observed_result));
  assert.doesNotMatch(intro, /Expected:/);
  const details = html.match(/<details class="event-details">([\s\S]*?)<\/details>/)[1];
  assert.ok(details.includes('Application version')); assert.ok(details.includes(doc.run.application_version)); assert.ok(details.includes(doc.run.workspace_id));
});

test('new header authoring guidance is explicit without changing pinned rules or historical reviews', async () => {
  for (const path of ['references/editor.md', 'references/copy-editor.md']) {
    const text = await readFile(join(root, path), 'utf8');
    for (const field of ['header_copy', 'application_name', 'workflow_purpose', 'scenario_name', 'starting_context', 'observed_result', 'claim_refs']) assert.ok(text.includes(field), `${path}: ${field}`);
    assert.match(text, /Economist/); assert.match(text, /SDLC v2/); assert.match(text, /historical|frozen/);
    assert.match(text, /starting/); assert.match(text, /two\s+or/);
  }
});

test('completion checkmark preserves qualified review and does not create green terminal approval', async () => {
  const doc = await snapshot();
  doc.review = await fakeChecker({ finding: 'qualified', gap: 'Only the recorded outcome is known.' }).check(doc);
  const html = renderHtml(doc).html;
  assert.match(html, /class="event-marker" aria-hidden="true">✓<\/span>/);
  assert.doesNotMatch(html, /class="event terminal"/);
  assert.match(html, /Evidence has limitations/); assert.match(html, /Only the recorded outcome is known/);
  assert.doesNotMatch(html, /review qualified/);
});

test('scoped feedback and CSS register animation preserve reduced-motion and count-only behavior', async () => {
  const source = await readFile(join(root, 'scripts/feedback-browser.mjs'), 'utf8');
  assert.match(source, /before === items\.length/);
  const browser = await readFile(join(root, 'ui/src/browser.jsx'), 'utf8');
  assert.match(browser, /Preset from “Add to prompt as correct”/);
  assert.match(browser, /Your comment on this step/);
  assert.match(source, /Whole scenario/);
  const html = renderHtml(await snapshot()).html;
  assert.match(html, /@keyframes register-up/); assert.match(html, /@keyframes register-down/);
  assert.match(html, /prefers-reduced-motion:reduce/); assert.match(html, /animation:none/);
  assert.match(html, /id="cart-motion-status" class="sr-only" role="status" aria-live="polite"/);
});

test('packaged runtime renders outside the repo without npm modules or eval and preserves private no-overwrite output', async () => {
  const out = await realpath(await mkdtemp(join(tmpdir(), 'scenario-shadcn-runtime-')));
  await cp(join(root, 'scripts'), join(out, 'scripts'), { recursive: true });
  await mkdir(join(out, 'ui'));
  await cp(join(root, 'ui/dist'), join(out, 'ui/dist'), { recursive: true });
  const input = join(out, 'input.json'), output = join(out, 'review.html');
  await writeFile(input, JSON.stringify(await snapshot()), { flag: 'wx', mode: 0o600 });
  const run = () => spawnSync(process.execPath, ['--disallow-code-generation-from-strings', join(out, 'scripts/render.mjs'), input, output], { cwd: out, encoding: 'utf8' });
  const result = run(); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).ok, true);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  const bytes = await readFile(output);
  const again = run(); assert.equal(again.status, 1); assert.equal(JSON.parse(again.stdout).errors[0].code, 'EEXIST');
  assert.deepEqual(await readFile(output), bytes);
});
