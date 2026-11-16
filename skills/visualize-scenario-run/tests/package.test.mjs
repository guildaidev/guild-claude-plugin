import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { cases } from './scenarios.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const plugin = resolve(root, '../..');
test('default plugin skill discovery includes instructions and required renderer assets', async () => {
  const manifest = JSON.parse(await readFile(join(plugin, '.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(manifest.name, 'guild');
  assert.equal(manifest.skills, undefined, 'Use existing default skills/ discovery, not a conflicting custom path.');
  for (const file of ['SKILL.md', 'references/contracts.md', 'references/parent.md', 'references/editor.md', 'references/checker.md', 'references/copy-editor.md', 'references/style/routing-v1.md', 'references/style/asd-ste100-v1.md', 'references/style/economist-v1.md', 'references/style/economist-LICENSE.txt', 'references/style/sdlc-v1.md', 'references/hosts.md', 'references/sources.md', 'scripts/contracts.mjs', 'scripts/assemble.mjs', 'scripts/render.mjs', 'scripts/inspect.mjs', 'scripts/review-io.mjs', 'scripts/workflow.mjs']) assert.ok((await stat(join(root, file))).isFile(), file);
  const skill = await readFile(join(root, 'SKILL.md'), 'utf8');
  for (const file of ['references/completion.md', 'scripts/markdown.mjs', 'scripts/diff.mjs', 'scripts/progress.mjs', 'scripts/progress-page.mjs', 'references/style/routing-v2.md', 'references/style/sdlc-v2.md']) assert.ok((await stat(join(root, file))).isFile(), file);
  assert.match(skill, /name: visualize-scenario-run/);
  for (const file of ['references/artifact-capture.md', 'references/operation-timeline.md', 'scripts/artifact-versions.mjs', 'scripts/artifact-link.mjs', 'scripts/concern-details.mjs', 'scripts/session-evidence.mjs']) assert.ok((await stat(join(root, file))).isFile(), file);
  for (const file of ['references/source-grounding.md', 'references/postrun-package.md', 'references/review-codec.md', 'references/review-capture.md', 'references/source-navigation.md', 'scripts/source-grounding.mjs', 'scripts/postrun-package.mjs', 'scripts/review-codec.mjs', 'scripts/review-capture.mjs', 'scripts/source-navigation.mjs']) assert.ok((await stat(join(root, file))).isFile(), file);
  for (const file of ['scripts/capture-live.mjs', 'scripts/capture-host.mjs', 'tests/capture-live.test.mjs']) await assert.rejects(stat(join(root, file)), { code: 'ENOENT' });
  assert.ok(skill.split('\n').length < 500);
  assert.match(skill, /invoke \*\*only\*\* `node --version` in one Bash call/);
  assert.match(skill, /Use Read\/Glob for plugin files/);
  for (const [, link] of skill.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:\/\//.test(link)) assert.equal(new URL(link).protocol, 'https:');
    else assert.ok((await stat(join(root, link))).isFile(), link);
  }
  for (const file of ['contracts.mjs', 'assemble.mjs', 'markdown.mjs', 'diff.mjs', 'progress.mjs', 'progress-page.mjs', 'session-evidence.mjs', 'source-grounding.mjs', 'postrun-package.mjs', 'review-codec.mjs', 'review-capture.mjs', 'source-navigation.mjs', 'render.mjs', 'inspect.mjs', 'review-io.mjs', 'workflow.mjs']) {
    const source = await readFile(join(root, 'scripts', file), 'utf8');
    for (const [, target] of source.matchAll(/from '([^']+)'/g)) {
      assert.ok(target.startsWith('node:') || target.startsWith('./') || target === '../ui/dist/server.mjs', target);
      if (target.startsWith('./')) assert.ok((await stat(join(root, 'scripts', target))).isFile());
      if (target === '../ui/dist/server.mjs') assert.ok((await stat(join(root, 'ui/dist/server.mjs'))).isFile());
    }
    assert.doesNotMatch(source, /from ['"](?:https?:|.*dev\/)/);
  }
});

test('recognizable third-party effects are a general instruction with honest supported-layout fallback', async () => {
  const effects = await readFile(join(root, 'references/effects.md'), 'utf8');
  assert.match(effects, /general presentation principle, not a Slack-specific feature/);
  for (const kind of ['chat post', 'email', 'ticket', 'calendar', 'document or spreadsheet']) assert.ok(effects.includes(kind), kind);
  assert.match(effects, /faithful neutral artifact presentation/);
  assert.match(effects, /only supplied metadata/);
  assert.match(effects, /Identify the service from evidence/);
  assert.match(effects, /Formatting is not proof that the effect completed/);
  assert.match(effects, /not a declaration that the packaged renderer/);
  assert.match(effects, /Presentation changes cannot rewrite reviewed copy/);
  for (const file of ['SKILL.md', 'references/editor.md', 'references/contracts.md']) {
    assert.match(await readFile(join(root, file), 'utf8'), /effects\.md/, file);
  }
  const author = await readFile(join(plugin, 'agents/scenario-run-editor.md'), 'utf8');
  assert.match(author, /references\/effects\.md/);
  assert.match(author, /faithful neutral/);
});

test('native roles and official independent reader retain a closed read-only checker tool list', async () => {
  const checker = await readFile(join(plugin, 'agents/scenario-run-checker.md'), 'utf8');
  const tools = checker.match(/^tools: (.+)$/m)[1].split(', ');
  assert.deepEqual(tools, ['Read', 'mcp__plugin_guild_guild__guild_get_session', 'mcp__plugin_guild_guild__guild_get_session_events', 'mcp__plugin_guild_github__get_file_contents']);
  assert.doesNotMatch(checker.split('---')[1], /permissionMode|mcpServers|hooks/);
  const editor = await readFile(join(plugin, 'agents/scenario-run-editor.md'), 'utf8');
  assert.match(editor, /guild:scenario-run-checker/);
  assert.match(editor, /guild:scenario-run-copy-editor/);
  assert.match(editor, /^model: sonnet$/m);
  assert.match(checker, /^model: opus$/m);
  const copy = await readFile(join(plugin, 'agents/scenario-run-copy-editor.md'), 'utf8');
  assert.deepEqual(copy.match(/^tools: (.+)$/m)[1].split(', '), ['Read']);
  assert.match(copy, /^model: sonnet$/m);
  assert.doesNotMatch(copy.split('---')[1], /permissionMode|mcpServers|hooks/);
  assert.match(copy, /verdict blocked/);
  assert.match(copy, /packet-copy/);
  assert.match(checker, /packet-fact/);
  assert.match(editor, /capture-copy/);
  assert.match(editor, /never a guessed path/);
  assert.match(editor, /collection time/);
  assert.match(editor, /unsupported absence of world effects/);
  assert.match(editor, /known-invalid earlier revision/);
  assert.match(editor, /inspect\.mjs fact /);
  assert.match(copy, /field_digest/);
  assert.match(copy, /human-facing jargon violations as required SDLC issues/);
  assert.match(editor, /The session ended/);
  assert.match(editor, /Do not invent a trigger/);
  assert.match(checker, /Do not pad it with/);
  const mcp = JSON.parse(await readFile(join(plugin, '.mcp.json'), 'utf8'));
  assert.equal(mcp.mcpServers.github.url, 'https://api.githubcopilot.com/mcp/readonly');
  assert.equal(mcp.mcpServers.github.headers['X-MCP-Tools'], 'get_file_contents');
  const mock = await readFile(join(plugin, 'evals/agent-development/scenario1-checkpoint-a/mocks/github/get_file_contents.md'), 'utf8');
  assert.match(mock, /a{40}/);
  assert.doesNotMatch(mock.split('---')[1], /sha:/, 'A valid parent current-file read must not abort the run; checker pinning is verified in its trace.');
  assert.match(mock, /"history":/);
  assert.doesNotMatch(mock, /snapshot_id|factual_digest|claim_refs|<html/);
});

test('native competitor case keeps raw evidence consistent without seeded narrative or approvals', async () => {
  const base = join(plugin, 'evals/agent-development/scenario1-checkpoint-a');
  const history = (await readFile(join(base, 'history.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  assert.match(history[0].message.content, /market-monitor/);
  assert.match(history[0].message.content, /Every morning/);
  assert.doesNotMatch(history[0].message.content, /visualiz|RN-42|release-note/);
  const eventsText = await readFile(join(base, 'mocks/guild/guild_get_session_events.md'), 'utf8');
  const events = JSON.parse(eventsText.split('---')[2].trim());
  const session = JSON.parse((await readFile(join(base, 'mocks/guild/guild_get_session.md'), 'utf8')).split('---')[2].trim());
  const archiveText = await readFile(join(base, 'mocks/github/get_file_contents.md'), 'utf8');
  const archive = JSON.parse(archiveText.split('```json\n')[1].split('\n```')[0]);
  const response = JSON.parse(events.events.find(event => event.id === 'event-slack-response').content.split('response: ')[1]);
  const message = archive.history[1].messages[0];
  assert.equal(response.ok, true);
  assert.equal(response.channel, archive.channel.id);
  assert.equal(response.ts, message.ts);
  assert.equal(response.message.text, message.text);
  assert.equal(archive.history[0].messages.length, 0);
  assert.equal(new Date(Number(message.ts) * 1000).toISOString().slice(0, 19), events.events.find(event => event.id === 'event-slack-response').at.slice(0, 19));
  assert.equal(session.ended_at, events.events.find(event => event.type === 'runtime_done').at);
  assert.equal(archive.public_pages.length, 2);
  assert.equal(80 * 3 + 20, 260);
  assert.equal(95 * 3 + 10, 295);
  assert.equal(295 - 260, 35);
  assert.match(message.text, /EUR 260/);
  assert.match(message.text, /EUR 295/);
  assert.match(message.text, /EUR 35/);
  for (const page of archive.public_pages) assert.ok(new URL(page.url).hostname.endsWith('.example'));
  for (const text of [eventsText, archiveText]) assert.doesNotMatch(text, /snapshot_id|copy_review|candidate_digest|claim_refs|<html/);
  assert.equal((await readFile(join(base, 'prompt.md'), 'utf8')).split('---')[2].trim(), 'Wait for the pending test results.');
});
test('all 13 optional replay cases have matching names, settings and trace graders', async () => {
  const evalRoot = join(root, 'evals');
  const dirs = (await readdir(evalRoot, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name).sort();
  assert.deepEqual(dirs, cases.map(([name]) => name).sort());
  for (const name of dirs) {
    const yaml = await readFile(join(evalRoot, name, 'case.yaml'), 'utf8');
    assert.match(yaml, /^schema_version: "1.1"/);
    assert.ok(yaml.includes(`name: ${name}\n`));
    assert.match(yaml, /expected_outcome: \|/);
    const prompt = await readFile(join(evalRoot, name, 'prompt.md'), 'utf8');
    assert.match(prompt, /^---\ntags: \[skill-creator\]\nmax_turns: 20\ntimeout_seconds: 600\nallowed_tools: \[Read, Glob, Grep, Skill, Write, Edit, Bash\]\n---/);
    const graders = await readdir(join(evalRoot, name, 'graders'));
    assert.ok(graders.length);
    for (const grader of graders) assert.match(await readFile(join(evalRoot, name, 'graders', grader), 'utf8'), /^---\ntype: llm\nfocus: trace\nweight: 1\n---/);
  }
});

test('agent-development instructions trigger safe review only after results', async () => {
  const source = await readFile(join(plugin, 'skills/agent-development/SKILL.md'), 'utf8');
  const section = source.split('## 5. Test and revise')[1].split('## 6. Release only on request')[0];
  const wait = source.split('### Handle a wait result')[1].split('## 5. Test and revise')[0];
  assert.match(section, /After results arrive, including partial results or an error, automatically use\s+the `visualize-scenario-run` skill/);
  assert.match(section, /do not ask for a separate visualization\s+request or confirmation/);
  assert.match(section, /exact tested version, workspace, profile and session/);
  assert.match(section, /confirmed effects, failures and missing evidence/);
  assert.match(section, /distinct narrative author, Read-only copy editor,\s+independent read-only fact checker, renderer/);
  assert.match(section, /Do not rerun the agent, resend input or make external writes to visualize/);
  assert.match(section, /Report unavailable capabilities, verification,\s+rendering or presentation honestly/);
  assert.match(section, /For `ACTION_REQUIRED`, handle the actual request/);
  assert.match(wait, /pending result without a required action, repeat the same wait/);
  assert.match(wait, /Do not resend the input or create another execution/);
  assert.ok(section.indexOf('For `ACTION_REQUIRED`') < section.indexOf('After results arrive'));
});

test('all orchestration entry points require final completion, matching HTML and presentation before iteration', async () => {
  for (const path of ['SKILL.md', 'references/parent.md', 'references/editor.md', 'references/hosts.md']) {
    assert.match(await readFile(join(root, path), 'utf8'), /completion\.md/, path);
  }
  const author = await readFile(join(plugin, 'agents/scenario-run-editor.md'), 'utf8');
  const development = await readFile(join(plugin, 'skills/agent-development/SKILL.md'), 'utf8');
  const policy = await readFile(join(root, 'references/completion.md'), 'utf8');
  assert.match(author, /references\/completion\.md/);
  assert.match(author, /Await the COMPLETE copy hand-back/);
  assert.match(author, /Await the COMPLETE factual hand-back/);
  assert.match(development, /BLOCKING dependency/);
  assert.match(development, /before\s+proposing or executing the next iteration/);
  for (const pattern of [/native completion notification/, /do not invent a synchronous-dispatch flag/,
    /Do not poll files, task status or transcripts/, /editor's \*\*final\*\* hand-back/,
    /current\s+requested target/, /real HTML file/, /direct, usable artifact reference\/link/,
    /Do not advance until that real blocker clears/, /late result for a superseded run stays\s+historical/,
    /triggers bounded recovery then normal rendering/, /Do not ask the user to steer generation/,
    /Do not\s+run copy and fact checks concurrently/, /complete genuine JSON hand-back/,
    /Local sequencing tests do not prove native agent compliance/]) assert.match(policy, pattern);
});

test('technical-error exception requires all current scenarios and preserves business-failure review and approvals', async () => {
  const policy = await readFile(join(root, 'references/completion.md'), 'utf8');
  const development = await readFile(join(plugin, 'skills/agent-development/SKILL.md'), 'utf8');
  for (const text of [policy, development]) {
    const source = text.replace(/\s+/g, ' ');
    assert.match(source, /ALL scenarios/);
    assert.match(source, /NONE completed\s+without an execution error/);
    assert.match(source, /until at least one scenario completes\s+without an execution error/);
    assert.match(source, /Once ANY scenario/);
  }
  assert.match(policy, /current test batch, not old runs or the pass\/fail score alone/);
  assert.match(policy, /failed business assertions[\s\S]*NOT\s+automatically a technical failure/);
  assert.match(policy, /unknown status are NOT proof/);
  assert.match(policy, /do not dispatch a visualization editor, render or display/);
  assert.match(policy, /not required approval for a\s+change, billing, a new test or an external write/);
  assert.match(policy, /Do not bypass it or retry indefinitely/);
  assert.match(development, /all-scenarios technical-error exception applies/);
});
