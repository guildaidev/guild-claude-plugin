import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

// Static integration-policy checks only. No native/model/application/source calls,
// writes, reloads, installs or claim consumption; not host-compliance evidence.
const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const paths = {
  guide: '../references/generation-performance.md', skill: '../SKILL.md', development: '../../agent-development/SKILL.md',
  editor: '../references/editor.md', copy: '../references/copy-editor.md', fact: '../references/checker.md',
  parent: '../references/parent.md', completion: '../references/completion.md', hosts: '../references/hosts.md',
  editorAgent: '../../../agents/scenario-run-editor.md', copyAgent: '../../../agents/scenario-run-copy-editor.md',
  factAgent: '../../../agents/scenario-run-checker.md', inspect: '../scripts/inspect.mjs',
};
const source = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await read(path)])));
const text = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value.replace(/\s+/g, ' ')]));

test('all active native/development entrypoints link the common five-helper guide', async () => {
  for (const key of ['skill', 'development', 'editor', 'copy', 'fact', 'parent', 'completion', 'hosts', 'editorAgent', 'copyAgent', 'factAgent']) {
    assert.match(text[key], /generation-performance\.md/, key);
  }
  for (const name of ['postrun-package', 'source-grounding', 'review-codec', 'source-navigation', 'review-capture']) {
    assert.match(text.guide, new RegExp(`${name}\\.md`));
    assert.ok((await stat(new URL(`../references/${name}.md`, import.meta.url))).isFile());
  }
});

test('canonical documented CLI signatures match the actual inspect positional boundary', () => {
  for (const signature of [
    'postrun-package INPUT NEW_BUNDLE NEW_PROJECTION',
    'preflight-source CANDIDATE ORIGINAL_COLLECTOR_BUNDLE NEW_PRIVATE_REPORT',
    'claim-copy CANDIDATE STABLE_BUDGET ORIGINAL_COLLECTOR_BUNDLE CURRENT_REPORT',
    'packet-copy CANDIDATE NEW_PACKET', 'packet-fact CANDIDATE NEW_PACKET',
    'packet-handback CHILD_COMPLETE_JSONL PARENT_COMPLETE_JSONL NEW_CAPTURE [native-handback|forwarded-handback]',
    'capture-native-copy CANDIDATE CAPTURE_PACKET NEW_FULL_REVIEW RETAINED_BINDING [EXACT_COMPACT_PACKET]',
    'capture-native-fact CANDIDATE CAPTURE_PACKET NEW_FULL_REVIEW RETAINED_BINDING [EXACT_COMPACT_PACKET]',
    'capture-copy CANDIDATE COMPLETE_ENDTURN_JSONL NEW_FULL_REVIEW AGENT_ID [EXACT_PACKET]',
    'capture-fact CANDIDATE COMPLETE_ENDTURN_JSONL NEW_FULL_REVIEW AGENT_ID [EXACT_PACKET]',
    'expand-review CANDIDATE WIRE_REVIEW EXACT_PACKET NEW_FULL_REVIEW',
  ]) assert.ok(text.guide.includes(signature), signature);
  for (const command of ['postrun-package', 'preflight-source', 'packet-copy-full', 'packet-fact-full', 'packet-handback',
    'capture-native-copy', 'capture-native-fact', 'expand-review']) assert.ok(source.inspect.includes(`'${command}'`), command);
  assert.match(source.inspect, /packagePostrunFile\(inputPath, reviewPath, outputPath\)/);
  assert.match(source.inspect, /validateSourceGroundingReport\(doc, await load\(outputPath\), await load\(copyReviewPath\)\)/);
  assert.match(source.inspect, /command\.endsWith\('-full'\) \? 'full' : 'compact'/);
  assert.match(source.inspect, /flag: 'wx', mode: 0o600/);
});

test('postrun packaging uses actual completion, metadata and per-executed-operation coverage without final-state invention', () => {
  for (const key of ['guide', 'skill', 'parent', 'development']) {
    assert.match(text[key], /postrun-package/); assert.match(text[key], /native completion/);
    assert.match(text[key], /checklist/);
  }
  assert.match(text.guide, /packagePostrunFile/);
  assert.match(text.guide, /per-executed-operation/);
  assert.match(text.guide, /Executed conditional branches count; unexecuted branches are not missing edits/);
  assert.match(text.guide, /Do not invent missing context/);
  assert.match(text.guide, /No manual final-state fallback/);
  assert.match(text.guide, /Requests and acknowledgments are not readback/);
  assert.match(text.guide, /Only actually observed empty creation/);
  assert.match(text.guide, /No manual final-state fallback[\s\S]*observer, source polling, subscription or auth bridge/);
  assert.match(text.guide, /Packaging does not select the human timeline, author claims\/prose or infer effects/);
});

test('each current copy claim requires fresh source binding, not cleared quality counts or another author', () => {
  for (const key of ['guide', 'skill', 'editor', 'editorAgent', 'parent']) {
    assert.match(text[key], /preflight-source/, key); assert.match(text[key], /before EACH/, key);
    assert.match(text[key], /ORIGINAL_COLLECTOR_BUNDLE CURRENT_REPORT/, key);
    assert.match(text[key], /unresolved quality counts NEVER gate/i, key);
    assert.match(text[key], /Legacy 1\.7\/1\.8/, key);
  }
  assert.match(text.guide, /missing, altered or stale report fails/);
  assert.match(text.guide, /Preserve meaning, negation, hedges and uncertainty; unknown support is not falsehood/);
  assert.match(text.guide, /No automatic edits, invented support, extra author dispatch/);
  assert.match(text.guide, /reassemble into a new candidate and regenerate its report and packet/);
  assert.match(text.guide, /Never restamp a report or reset\/refund either consumed claim/);
  assert.match(text.guide, /Keep reports and feedback author-only: not reviewer packets, candidate\/snapshot, UI/);
});

test('compact packet defaults retain readable whole inputs, saved exact bytes and explicit full compatibility', () => {
  assert.match(text.guide, /default to \*\*review-codec 1\.0\*\*/);
  for (const field of ['input', 'dictionary', 'manifest', 'resolution', 'response_contract']) assert.ok(text.guide.includes(field));
  assert.match(text.guide, /packet-copy-full.*packet-fact-full.*original packet 1\.1/);
  assert.match(text.guide, /do not regenerate it after guide changes/);
  for (const key of ['copyAgent', 'factAgent', 'copy', 'fact']) {
    assert.match(text[key], /complete.*(input|dictionary)|input.*dictionary/i, key);
    assert.match(text[key], /response_contract/, key);
    assert.match(text[key], /manifest/, key);
  }
});

test('copy aliases never imply missing passages, defaults, verdicts or exemptions', () => {
  for (const key of ['guide', 'copyAgent', 'copy']) {
    assert.match(text[key], /field_id/, key);
    assert.match(text[key], /every.*(judgment|routing)|Every guide/i, key);
    assert.match(text[key], /wildcard/, key);
    assert.match(text[key], /reviewer_id/, key); assert.match(text[key], /candidate_digest/, key);
    assert.match(text[key], /manifest_digest/, key);
  }
  assert.match(text.copyAgent, /full field inventory/);
  assert.match(text.copyAgent, /all references/);
  assert.match(text.guide, /including on nonpass/);
});

test('fact navigation preserves complete sources and own bounded reads, not older-page cursors or invented clocks', () => {
  for (const key of ['guide', 'fact', 'factAgent']) {
    assert.match(text[key], /source_navigation/, key);
    assert.match(text[key], /from_id means AFTER only, not an older-page cursor|`from_id` means AFTER only, \*\*not an older-page cursor\*\*/i, key);
    assert.match(text[key], /500/, key); assert.match(text[key], /truncation/, key);
    assert.match(text[key], /checker_id/, key); assert.match(text[key], /factual_digest/, key);
    assert.match(text[key], /claim alias|claim aliases/, key);
    assert.match(text[key], /clock/, key);
  }
  assert.match(text.guide, /index creation is rejected.*complete candidate.*private index diagnostic/);
  assert.match(text.guide, /Cached evidence.*not independent service verification/);
  assert.match(text.guide, /Do not borrow cached capture times or lifecycle\/event times, pad a date with midnight/);
  assert.match(text.guide, /malformed facts remain malformed, not a pass/);
});

test('native capture binds exposed complete records, preserves genuine wire/provenance and does not invent foreground formats', () => {
  for (const key of ['guide', 'completion', 'editorAgent', 'editor', 'skill']) {
    assert.match(text[key], /capture-native-copy/, key);
    assert.match(text[key], /SubagentHandback/, key);
    assert.match(text[key], /binding/, key);
  }
  assert.match(text.guide, /packet-handback.*only serializes/);
  assert.match(text.guide, /not validate completion or authenticate/);
  assert.match(text.guide, /Unsupported foreground\/synchronous receipts or future native formats/);
  assert.match(text.guide, /never invent dispatch metadata/i);
  assert.match(text.guide, /repeat failed capture on unchanged source/);
  assert.match(text.guide, /Preserve the complete genuine JSON hand-back with Write unchanged/);
  assert.match(text.guide, /original compact hand-back and returned provenance privately/);
  assert.match(text.guide, /No model|another subagent\/model call merely for formatting/i);
});

test('blocking native owner survives asynchronous resumes until all bounded quality work finishes', () => {
  for (const key of ['guide', 'skill', 'parent', 'completion', 'hosts', 'development', 'editor', 'editorAgent']) {
    assert.match(text[key], /SendMessage/, key);
    assert.match(text[key], /native final completion/, key);
    assert.match(text[key], /pending children|pending editor\/checker children|pending editor\/checker|pending.*children/, key);
  }
  assert.match(text.guide, /do not invent foreground or `run_in_background` flags/i);
  assert.match(text.guide, /Parent advancement or opening the final HTML must wait/);
  assert.match(text.guide, /completed copy.*completed facts/);
});

test('tool allowlists and model defaults stay exact; helpers add no approvals, dispatches or render gates', () => {
  assert.match(source.editorAgent, /^tools: Read, Write, Edit, Bash, Agent, Task$/m);
  assert.match(source.editorAgent, /^model: sonnet$/m);
  assert.match(source.copyAgent, /^tools: Read$/m); assert.match(source.copyAgent, /^model: sonnet$/m);
  assert.match(source.factAgent, /^tools: Read, mcp__plugin_guild_guild__guild_get_session, mcp__plugin_guild_guild__guild_get_session_events, mcp__plugin_guild_github__get_file_contents$/m);
  assert.match(source.factAgent, /^model: opus$/m);
  assert.match(text.guide, /TWO copy calls, THREE shared check\/render attempts/);
  assert.match(text.guide, /missing\/invalid optional reviews do not gate the normal full source-bound UI/);
  assert.match(text.guide, /Real source\/content\/safety, target identity, authorization and presentation gates remain/);
});

test('current public layout uses viewport scrolling and upper-right prompt controls without removing selection/dialog/copy behavior', () => {
  for (const key of ['guide', 'skill', 'editor', 'editorAgent', 'parent', 'hosts']) {
    assert.match(text[key], /viewport scrolling/i, key);
    assert.match(text[key], /upper-right header/, key);
    assert.match(text[key], /no bottom footer bar/i, key);
    assert.match(text[key], /ecommerce words\/icons/, key);
    assert.match(text[key], /dialog/, key);
  }
  assert.doesNotMatch(text.skill, /header sticks inside a bounded scrolling panel/);
  assert.match(text.guide, /manual copy\/paste/);
  assert.match(text.guide, /concern\/human-fix\/technical-fix separation/);
});

test('duplicate-key safety and latency reporting cannot convert formatting or byte savings into approval/speed claims', () => {
  assert.match(text.guide, /parseReviewJSON\(text\)/);
  assert.match(text.guide, /duplicate keys before object parsing, including escaped-equivalent names/);
  assert.match(text.guide, /safe `duplicate_key` errors/);
  assert.match(text.guide, /not repaired into a last-value pass/);
  assert.match(text.guide, /All native time savings remain estimates, not measured minutes or guarantees/);
  assert.match(text.guide, /14% copy \/ 36% fact/);
  assert.match(text.guide, /then-current guides and no source index/);
  assert.match(text.guide, /Updated guides\/index change those sizes; small packets can grow/);
  assert.match(text.guide, /not end-to-end native latency/);
});
