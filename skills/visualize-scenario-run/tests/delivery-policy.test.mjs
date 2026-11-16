import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Static policy regressions only. These checks do not launch agents, implement a
// progress server/fallback renderer, or prove model compliance/host presentation.
const read = async path => (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/\s+/g, ' ');
const [progress, delivery, completion, parent, hosts, development] = await Promise.all([
  '../references/progress.md', '../references/delivery.md',
  '../references/completion.md', '../references/parent.md',
  '../references/hosts.md', '../../agent-development/SKILL.md',
].map(read));

test('entry policies use the packaged loading helper and one normal renderer', () => {
  for (const text of [completion, parent, hosts, development]) {
    assert.match(text, /progress\.md/);
    assert.match(text, /delivery\.md/);
  }
  assert.match(progress, /progress\.mjs/);
  assert.match(delivery, /Use ONE renderer and ONE full UI/);
  assert.match(delivery, /no limited-evidence mode, alternate layout, handcrafted fallback HTML/);
  assert.match(hosts, /Packaged local helper/);
});

test('native entrypoints start live delivery explicitly and retain one writer through final handoff', async () => {
  const paths = ['../SKILL.md', '../references/parent.md', '../references/completion.md', '../references/hosts.md', '../../agent-development/SKILL.md', '../../../agents/scenario-run-editor.md'];
  for (const path of paths) {
    const text = await read(path);
    assert.match(text, /progress\.mjs start OUTDIR TARGET/, path);
    assert.match(text, /live:true/, path);
    assert.match(text, /sequence/, path);
    assert.match(text, /handoff|hand-back/, path);
  }
  assert.match(progress, /Open the returned `url`, NOT `artifact_path`/);
  assert.match(progress, /ONE JSON result and exits/);
  assert.match(progress, /Node IPC/);
  assert.match(progress, /It then STOPS writing/);
  assert.match(progress, /skip polishing if no text is being polished/);
  assert.match(progress, /Reviewers never receive writer authority/);
  assert.match(progress, /`begin` alone is NOT live startup/);
  assert.doesNotMatch(progress, /Present `artifact_path` immediately|Open the static loading page first/);
});

test('development and main entrypoints require each actual artifact edit before destructive continuation', async () => {
  const skill = await read('../SKILL.md');
  for (const text of [development, skill]) {
    assert.match(text, /EACH EDIT/);
    assert.match(text, /artifact-capture\.md/);
    assert.match(text, /actual source readback/);
    assert.match(text, /before the next application-controlled edit/);
    assert.match(text, /empty.*baseline.*actual|empty creation.*actual|baseline requires actual/);
    assert.match(text, /gaps/);
    assert.match(text, /immutable revision/);
  }
  assert.match(development, /not only its final state/);
  assert.match(development, /never a final-state fallback/);
  assert.match(development, /permission for wider source access/);
});

test('loading starts before long work with truthful accessible activity, not fake completion', () => {
  assert.match(progress, /immediately write a small sanitized `progress\.html`/);
  assert.match(progress, /BEFORE visualization-specific evidence collection/);
  assert.match(progress, /progress bar.*engaging CSS animation/);
  assert.match(progress, /prefers-reduced-motion/);
  assert.match(progress, /indeterminate bar/);
  for (const activity of ['Gathering evidence', 'Arranging the timeline', 'Checking details', 'Polishing the text']) {
    assert.ok(progress.includes(activity), activity);
  }
  assert.match(progress, /not rotate activities on a timer/);
  assert.match(progress, /never a fabricated percentage, ETA or 100%/);
  assert.match(progress, /Narrow public exception/);
  assert.match(progress, /do not imply that rewriting a file refreshes an already open tab/);
});

test('optional browser polling is local, read-only, bounded and separate from assistant waiting', () => {
  for (const required of [
    /Bind only to `127\.0\.0\.1`/, /ephemeral port/, /three exact read-only routes/,
    /Allow GET\/HEAD only/, /unexpected Host headers and foreign Origin headers/,
    /No directory listing/, /No external assets or requests/,
    /Cache-Control: no-store/, /refuse symlinks escaping it/,
    /Only the \*\*browser\*\* polls/, /one outstanding request/,
    /three consecutive connection errors/, /same-origin status connection/,
    /Do NOT loosen the final artifact's CSP/, /Never use shell sleeps/,
    /awaits native final notifications or a supported blocking wait/,
  ]) assert.match(progress, required);
  assert.match(progress, /stop only that invocation's server/);
  assert.match(progress, /Its late writes are rejected/);
  assert.match(progress, /durable direct artifact link, not a temporary localhost URL/);
});

test('bounded delivery is source-bound normal HTML, never another layout or fake approval', () => {
  for (const required of [
    /snapshot\/candidate \*\*1\.9\*\*/, /original sanitized bundle/,
    /Review records are OPTIONAL PRIVATE diagnostics, not render permissions/,
    /invalid record is never treated as valid/, /restamp reviews/,
    /Historical 1\.0–1\.8 inputs retain their original read-only contracts/,
    /shadcn UI, cart, dialogs, source-backed diff and strict offline CSP/,
    /inspect\.mjs finalize/, /source\/content, exact target identity and deterministic renderer bytes/,
  ]) assert.match(delivery, required);
});

test('bounded failure finishes useful delivery without extra model dispatch or steering choices', () => {
  assert.match(delivery, /At most TWO copy-review calls/);
  assert.match(delivery, /at most THREE shared check\/render attempts/);
  assert.match(delivery, /No reset, refund or third dispatch/);
  assert.match(delivery, /one bounded source-grounded author correction/);
  assert.match(delivery, /No fresh model dispatch merely to escape exhaustion/);
  assert.match(delivery, /do not ask the user to debug generation/);
  assert.match(delivery, /Any content change invalidates BOTH reviews/);
  assert.match(delivery, /Only display.compact can reuse an unchanged matching pair/);
  assert.match(completion, /do not continue the application workflow while generating/);
  assert.match(development, /not “skip review vs fix wording”/);
});

test('unknown and disputed business effects remain qualified without stale identity or fake approval', () => {
  assert.match(delivery, /An unknown version stays unknown/);
  assert.match(delivery, /tool acceptance is not delivery/);
  assert.match(delivery, /Do not assert unsupported success/);
  assert.match(delivery, /not an invented source read or pass/);
  assert.match(delivery, /does NOT establish review approval/);
  assert.match(completion, /never relabel the old snapshot or its reviews/);
  assert.match(delivery, /Late output for a superseded target stays historical/);
});

test('presentation and authorization gates survive optional review failure, and technical-all-failed remains no visualization', () => {
  assert.match(completion, /If ALL scenarios ended because of a technical failure\/error and NONE completed/);
  assert.match(completion, /do not dispatch a visualization editor, render or display a visualization/);
  assert.match(progress, /do not create a visualization\/loading page for that exception/);
  assert.match(delivery, /technical-error exception still produces no visualization/);
  assert.match(delivery, /No application iteration may run in parallel with finishing the page/);
  assert.match(delivery, /until observed presentation\/user confirmation or explicit cancellation\/supersession/);
  assert.match(hosts, /An opener dispatch is not observed presentation/);
  assert.match(hosts, /minimum concrete user action with the safe link/);
  assert.match(delivery, /silently downgrade permissions\/credentials/);
  assert.match(delivery, /does NOT.*authorize application changes, reruns, external writes, cleanup, publication or release/);
});
