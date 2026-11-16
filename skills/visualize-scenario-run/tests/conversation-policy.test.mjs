import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Definition checks only: these assertions do not run an agent or exercise a host.
const skill = await readFile(new URL('../SKILL.md', import.meta.url), 'utf8');
const conversation = await readFile(new URL('../references/conversation.md', import.meta.url), 'utf8');
const normalized = text => text.replace(/\s+/g, ' ');
const policy = normalized(conversation);

test('current conversation policy retains privacy and source-bound 1.10 authoring', () => {
  for (const file of ['conversation.md', 'progress.md', 'delivery.md']) {
    assert.ok(skill.includes(`](references/${file})`), file);
  }
  assert.match(skill, /Current 1\.10 policy/);
  assert.match(skill, /Use closed draft \*\*1\.4\*\*, source-bound snapshot \*\*1\.10\*\*/);
  assert.match(skill, /ABSOLUTE PUBLIC INVARIANT/);
  assert.match(normalized(skill), /overrides historical public reporting, copy-limit warnings and requests for the user to resolve internal review problems/);
  assert.ok(skill.indexOf('references/conversation.md') < skill.indexOf('## 1. Parent:'));
  assert.ok(skill.split('\n').length < 500);
});

test('generation privacy covers chat, progress, HTML, evidence, cart and copied prompts', () => {
  assert.match(policy, /Never expose or discuss skill inner workings with the end user/);
  assert.match(policy, /public chat, progress pages, final HTML, source evidence panels, dialogs, the cart and copied prompts/);
  for (const phrase of ['bundle/ref terminology', 'author/reviewer/', 'fact-checker roles',
    'copy budgets', 'iterations', 'schemas', 'digests', 'model choices', 'capture details',
    'semantic checks', 'review records', 'verdicts', 'internal constraints']) {
    assert.ok(policy.includes(phrase), phrase);
  }
  assert.match(policy, /Do not explain why an agent failed those constraints/);
  assert.match(policy, /not a user-facing technical-details disclosure/);
  assert.match(policy, /“Review prompt” and “Review queue” can still name business actions/);
});

test('business source uncertainty stays honest without explaining review machinery', () => {
  assert.match(policy, /Show actual source uncertainty where useful in the business-evidence UI/);
  assert.match(policy, /The message was found, but its earlier text is unavailable/);
  assert.match(policy, /Do not invent certainty, hide a business conflict or imply a source was checked when it was not/);
  assert.match(policy, /the review skill's own machinery is not/);
});

test('immediate progress permits truthful human activities but not internal narration or polling', () => {
  assert.match(policy, /immediate local progress page through the supported host flow/);
  assert.match(policy, /Do not wait for a finished narrative before presenting progress/);
  for (const activity of ['gathering test evidence', 'arranging the timeline', 'checking details', 'polishing words']) {
    assert.ok(policy.includes(activity), activity);
  }
  assert.match(policy, /Use an activity only while it is actually happening/);
  assert.match(policy, /not permission to dump internal logic, roles, counters or failure details/);
  assert.match(policy, /Do not claim a review is complete because its progress page opened/);
  assert.match(policy, /Keep browser updates separate from assistant file\/transcript polling/);
  assert.match(policy, /native completion notifications or a supported blocking wait/);
  assert.match(conversation, /^> I’m working on getting your feedback UI up and running\.$/m);
  assert.match(policy, /Only if a reliable estimate is actually available/);
  assert.match(policy, /do not invent a numeric ETA or send the placeholder/);
  assert.match(policy, /Do not repeatedly say “I’ll send the link when ready” when the progress page is already open/);
});

test('bounded autonomous review is not permission to skip factual or completion gates', () => {
  assert.match(policy, /overrides historical instructions to announce copy limits/);
  assert.match(policy, /does not waive completion, source\/safety, privacy, identity or two-copy boundaries/);
  assert.match(policy, /Do not ask the user to choose fix wording, approve a second check, shorten the prose or skip a review/);
  assert.match(policy, /Do not offer more internal review rounds or hide\/fake approval/);
  assert.match(policy, /normal source-bound HTML after bounded quality work/);
  assert.match(policy, /Never reset consumed claims, fabricate review responses or continue indefinitely/);
  assert.match(normalized(skill), /This review is BLOCKING/);
  assert.match(normalized(skill), /ALL current scenarios ended in technical errors and NONE completed without an execution error/);
  assert.match(normalized(skill), /at most \*\*two copy-review calls per visualization invocation\*\*/);
});

test('necessary real decisions are singular, host-supported and never answered for the user', () => {
  assert.match(policy, /authentication\/access, cost, external writes and changes of scope/);
  assert.match(policy, /ask one necessary question at a time/);
  assert.match(policy, /host's multiple-choice input if it actually exists, with sensible options/);
  assert.match(policy, /If it does not exist, ask one concise question in chat/);
  assert.match(policy, /Do not invent a tool/);
  assert.match(policy, /answer on the user's behalf/);
  assert.match(policy, /Internal review management alone does not require a user decision/);
  assert.match(policy, /Defer unrelated Google Doc cleanup until the review flow is finished/);
  assert.match(policy, /Never silently delete an external artifact/);
});

test('successful handoff is exact and limited to observed completed UI presentation', () => {
  const successful = 'I’ve opened your feedback UI. You can compose a prompt in it which you can then paste back into this thread to continue iterating on the functionality we’re building.';
  assert.ok(conversation.includes(`> ${successful}\n`));
  assert.match(policy, /use only this successful handoff in the original thread/);
  assert.match(policy, /Say “opened” only when presentation was observed or the user confirmed/);
  assert.match(policy, /An opener dispatch is not proof, and an open loading page is not proof/);
  assert.match(policy, /I couldn’t confirm that it opened/);
  assert.match(policy, /actual safe, usable artifact link/);
  assert.match(policy, /Do not paste a raw filesystem path as the handoff/);
  assert.match(policy, /Never invent a link or claim HTML exists when it does not/);
  assert.match(policy, /Do not append a long summary, caveats, source checks, fact limits, proposed changes, session\/version IDs, copy iterations or cleanup choices/);
  assert.match(policy, /The user's job now is to use the feedback UI/);
});

test('internal hand-back and historical bindings cannot become a public metadata dump', () => {
  const main = normalized(skill);
  assert.match(main, /Return PRIVATELY to the original parent/);
  assert.match(main, /internal hand-back data, not a public summary or handoff template/);
  assert.match(main, /These remain private target bindings, not permission to expose generation metadata/);
  assert.match(policy, /Copying a prompt is intent only, not execution or automatic delivery/);
  assert.match(policy, /preserve the existing action approvals/);
});

test('policy definitions explicitly do not prove runtime or native host implementation', () => {
  assert.match(policy, /instruction policy, not a runtime, renderer, schema or host implementation/);
  assert.match(policy, /packaged local progress helper/);
  assert.match(policy, /no alternate page or limited-evidence mode/);
  assert.match(policy, /Use the documented commands; do not invent browser support or live update APIs/);
  assert.match(policy, /Static policy tests/);
  assert.match(policy, /do not prove native agent compliance, browser opening, local progress updates/);
  assert.match(policy, /do not claim fresh native behavior was verified/);
});
