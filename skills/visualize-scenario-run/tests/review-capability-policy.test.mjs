import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Instruction regressions, not a model evaluation or proof of host discovery,
// effective permissions, native agent compliance or observed browser opening.
const read = async path => (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/\s+/g, ' ');
const [skill, development, parent, completion, hosts] = await Promise.all([
  '../SKILL.md', '../../agent-development/SKILL.md', '../references/parent.md',
  '../references/completion.md', '../references/hosts.md',
].map(read));

test('development recovers installed instructions before declaring a missing review tool', () => {
  assert.match(development, /packaged local workflow, not a Guild MCP review-page tool/);
  assert.match(development, /when that exact name is in the current host listing/);
  assert.match(development, /If Skill is absent, the listing omits this installed skill, or invocation reports unknown skill, use Read/);
  assert.match(development, /\.\.\/visualize-scenario-run\/SKILL\.md/);
  assert.match(development, /resolved from this skill's host-provided base directory/);
  assert.match(development, /An absent listing is not proof that rendering is unavailable/);
  assert.match(development, /or invoke an unlisted Skill name/);
  assert.match(development, /do not replace the page with a generic tool-unavailable apology/);
});

test('all entry gates distinguish discovery from actual execution and presentation', () => {
  for (const text of [skill, parent, completion]) assert.match(text, /capability recovery/);
  assert.match(completion, /absent skill listing, unknown Skill name or empty tool search is not a failed renderer invocation/);
  assert.match(completion, /author dispatch, optional reviewers, Node\/files, validation and browser opening/);
  assert.match(hosts, /direct read loads instructions; it does not register a skill or prove a reload occurred/);
  assert.match(hosts, /File presence and an advertised Bash tool do not prove execution permission/);
  assert.match(hosts, /A preflight or validation error is its actual error, not a missing tool/);
  assert.match(hosts, /An unavailable opener does not erase a saved HTML file/);
});

test('native schema and typed-agent discovery are not confused with MCP tool search', () => {
  assert.match(hosts, /ToolSearch loads only tools announced as deferred, using their exact names/);
  assert.match(hosts, /does not discover plugin skills or turn an agent type into a tool/);
  assert.match(hosts, /ListAgents may list sessions\/message recipients, not dispatch types/);
  assert.match(hosts, /do not spend model calls merely to probe availability/);
  assert.match(hosts, /Do not invent flags, model support or tool restrictions/);
  assert.match(hosts, /Keep a distinct author and enforce the existing reviewer allowlists/);
  assert.match(hosts, /unrestricted general-purpose agent is not a substitute for a restricted checker/);
});

test('recovery documents real offline commands and the normal full source-bound pipeline', () => {
  for (const command of [
    'inspect.mjs bundle /approved/bundle.json',
    'inspect.mjs assemble /approved/bundle.json /approved/draft.json /approved/new-candidate.json',
    'inspect.mjs finalize /approved/new-candidate.json /approved/new-snapshot.json - -',
    'render.mjs /approved/new-snapshot.json /approved/new-review.html',
  ]) assert.ok(hosts.includes(command), command);
  assert.match(hosts, /normal draft 1\.3\/source-bound 1\.9 workflow/);
  assert.match(hosts, /Use no alternate UI/);
  assert.match(hosts, /not permission to skip available authorized reviews/);
  assert.match(hosts, /Pass actual records when retained, even when invalid; never forge approval/);
});

test('capability recovery preserves real denials, bounds, privacy and authorization gates', () => {
  assert.match(hosts, /Probe Node with ONLY `node --version` in one Bash call/);
  assert.match(hosts, /Never retry a denied command by disguising it, changing tools or expanding permissions/);
  assert.match(hosts, /stable two-copy budget, three shared check\/render attempts, sanitization and exact target binding/);
  assert.match(hosts, /Keep concrete failure stage, tool name, attempted call\/result and any safe artifact path in private diagnostics/);
  assert.match(hosts, /Do not proceed with another application iteration/);
  assert.match(hosts, /Do not reload\/restart, alter host settings, switch models, expand access, rerun the scenario or write integrations/);
  assert.match(hosts, /essential capability is truly absent\/denied, report that specific limitation; do not hide it/);
  assert.match(completion, /source\/privacy, cost or presentation gates/);
});
