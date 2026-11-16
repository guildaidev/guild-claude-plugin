import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Static skill-definition regression checks only. These do not exercise rendered
// HTML, native agents, source authenticity, accessibility or host compliance.
const reference = path => new URL(`../references/${path}`, import.meta.url);
const agent = role => new URL(`../../../agents/scenario-run-${role}.md`, import.meta.url);
const read = async url => (await readFile(url, 'utf8')).replace(/\s+/g, ' ');
const policy = await read(reference('timeline-content.md'));
const effects = await read(reference('effects.md'));
const definitions = await Promise.all(['editor', 'copy-editor', 'checker'].map(async role => ({
  role,
  reference: await read(reference(`${role}.md`)),
  agent: await read(agent(role)),
})));

test('goal relevance, not write/read classification, selects external source interactions', () => {
  assert.match(policy, /goal-relevant external reads or selections/);
  assert.match(policy, /A write is not required/);
  assert.match(policy, /meaning of the occurrence, not its tool name or technical implementation/);
  // Varied positive cases and the negative boundary prevent a domain-specific rule.
  for (const example of [/customer record/, /search-result choice/, /retrieval of source content/, /comparing external offers/]) {
    assert.match(policy, example);
  }
  assert.match(policy, /Do not promote every read into an event/);
  assert.match(policy, /generic retrieval noise .* stays private/);
  assert.match(policy, /Do not invent a missing selection, raw response, actor, exact selection time or causal link/);
  assert.match(policy, /Request time is not automatically selection time/);
  assert.match(policy, /Unknown times stay unknown/);
  for (const definition of definitions) {
    for (const text of [definition.reference, definition.agent]) {
      assert.match(text, /timeline-content\.md/, definition.role);
      assert.match(text, /external source interactions\/read-selection actions integral to the application goal/, definition.role);
      assert.match(text, /without a write/, definition.role);
    }
  }
});

test('minimal rows retain truth and expectation mismatches without repeated metadata', () => {
  assert.match(policy, /only the step number, timestamp, icon and brief event description/);
  assert.match(policy, /Do not add repeated qualification labels/);
  assert.match(policy, /never show a confirmed\/success icon for an unestablished effect/);
  assert.match(policy, /Avoid “returned a link”, return-value narration/);
  assert.match(policy, /preserve the actual creation and the mismatch in the appropriate concern\/evidence disclosure/);
  assert.match(policy, /do not hide a real external write/);
  assert.match(policy, /Removing clutter never licenses converting a request into successful/);
  assert.match(policy, /exact supplied actor names\/IDs in source metadata and technical detail/);
});

test('all artifact payloads have meaningful placement, not blind deduplication or evidence deletion', () => {
  for (const text of [policy, effects]) {
    assert.match(text, /message/);
    assert.match(text, /email/);
    assert.match(text, /ticket/);
    assert.match(text, /calendar/);
    assert.match(text, /spreadsheet/);
    assert.match(text, /document/);
    assert.match(text, /meaningful content\/effect step/);
    assert.match(text, /Do not repeat identical payloads across setup, lifecycle/);
    assert.match(text, /Deduplicate presentation, not evidence|deduplicate presentation, not evidence/);
    assert.match(text, /Distinct versions/);
    assert.match(text, /before\/after stages/);
    assert.match(text, /URL.*(collapse real edits|not enough to collapse real edits)/);
  }
  assert.match(policy, /without showing the later body before it existed/);
  assert.match(policy, /original evidence records, claims, IDs and source bytes/);
});

test('source-backed content changes request accessible green/red diffs without fabricated versions', () => {
  for (const text of [policy, effects, ...definitions.flatMap(d => [d.reference, d.agent])]) {
    assert.match(text, /paired source-backed before\/after versions|paired source-backed before\/after|paired source-backed/);
    assert.match(text, /diff-style/);
    assert.match(text, /green additions/i);
    assert.match(text, /red removals/);
    assert.match(text, /Added\/Removed|Added\/ Removed|“Added”\/“Removed”/);
    assert.match(text, /verbatim (source )?bytes|source bytes verbatim/);
    assert.match(text, /context[\/,] ?order(?:[\/,] ?| and )meaning/);
    assert.match(text, /missing version|missing baseline\/version|fabricated baseline/);
    assert.match(text, /readback/);
    assert.match(text, /unsupported diff|diff widget.*implemented|implemented diff widget|diff capability.*does not support/);
  }
  assert.match(policy, /meaning does not depend on color alone/);
  assert.match(policy, /With only one captured version, show that version truthfully, not an invented diff/);
  assert.match(effects, /all artifact types/);
});

test('controls name the action and actual service without unsafe links or false completeness', () => {
  for (const text of [policy, effects]) {
    assert.match(text, /Add comment/);
    assert.match(text, /Open in \{service\}/);
    assert.match(text, /Open in Google Docs/);
    assert.match(text, /Open the full text in Google Docs/);
    assert.match(text, /actually truncated/);
    assert.match(text, /source.*(supports|support)|evidence supports/);
    assert.match(text, /keyboard.accessible/);
    assert.match(text, /visible focus/);
    assert.match(text, /safe.*source.supplied URLs/);
    assert.match(text, /remote scripts|scripts\/assets/);
    assert.match(text, /unexecuted intent/);
  }
  assert.match(policy, /An absent safe source URL means no invented link/);
  assert.match(policy, /click-only containers, javascript URLs/);
});

test('privacy and bounded delivery keep genuine records and safety gates intact', () => {
  assert.match(policy, /private everywhere: chat, UI, evidence disclosures, dialogs, feedback cart and copied prompts/);
  assert.match(policy, /Always aim to finish with useful HTML after bounded checks/);
  assert.match(policy, /do not ask the user to debug malformed reviewer output/);
  assert.match(policy, /Never fake approval/);
  assert.match(policy, /reuse stale approval bindings/);
  assert.match(policy, /source\/time\/reference, identity, authorization, factual and stale-binding gates/);
  assert.match(policy, /completion\.md and hosts\.md/);
  for (const definition of definitions) {
    for (const text of [definition.reference, definition.agent]) {
      assert.match(text, /chat/, definition.role);
      assert.match(text, /completion\.md/, definition.role);
      assert.match(text, /delivery\.md/, definition.role);
      assert.match(text, /private|privately/, definition.role);
    }
  }
  const editor = definitions.find(d => d.role === 'editor');
  assert.match(editor.reference, /normal packaged UI, never separate HTML or a limited-evidence mode/);
  assert.match(editor.agent, /Render the normal full packaged UI, never handcrafted HTML, a limited-evidence mode or another layout/);
});

test('agent roles, production model aliases and read-only tool boundaries remain explicit', async () => {
  for (const role of ['editor', 'copy-editor', 'checker']) {
    const raw = await readFile(agent(role), 'utf8');
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/)[1];
    assert.match(frontmatter, new RegExp(`^model: ${role === 'checker' ? 'opus' : 'sonnet'}$`, 'm'));
    if (role === 'editor') assert.match(frontmatter, /^tools: Read, Write, Edit, Bash, Agent, Task$/m);
    if (role === 'copy-editor') assert.match(frontmatter, /^tools: Read$/m);
    if (role === 'checker') {
      assert.match(frontmatter, /^tools: Read, mcp__plugin_guild_guild__guild_get_session, mcp__plugin_guild_guild__guild_get_session_events, mcp__plugin_guild_github__get_file_contents$/m);
    }
  }
});

test('one-shot description/header policy and renderer capability limits remain explicit', () => {
  const editor = definitions.find(d => d.role === 'editor');
  assert.match(editor.reference, /exactly ONE closed-description generation/);
  assert.match(editor.agent, /Generate ONLY the closed description payload ONCE/);
  assert.match(editor.agent, /200 Unicode code points AND 30 words/);
  assert.match(policy, /skill-definition requirements, not proof that a renderer implements/);
  assert.match(effects, /packaged diff widget is implemented for explicit text/);
  assert.match(effects, /does not authorize invented fields or unsupported diff formats/);
  assert.match(policy, /Use supported fields only/);
});
