import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Static instruction regressions, not proof of agent compliance, reconstructed
// source authenticity, runtime replay correctness or rendered/browser behavior.
const read = async path => (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/\s+/g, ' ');
const [timeline, effects, editor, author, copy, checker] = await Promise.all([
  '../references/timeline-content.md', '../references/effects.md',
  '../references/editor.md', '../../../agents/scenario-run-editor.md',
  '../references/copy-editor.md', '../references/checker.md',
].map(read));
const temporal = timeline.slice(timeline.indexOf('### Material versions'), timeline.indexOf('## Controls'));
const concerns = timeline.slice(timeline.indexOf('## Useful failed'), timeline.indexOf('## Place artifacts'));
const controls = timeline.slice(timeline.indexOf('## Controls'), timeline.indexOf('## Bounded completion'));
const capture = timeline.slice(timeline.indexOf('### Collect intermediate evidence'), timeline.indexOf('### Material versions'));

test('build-time evidence replaces the default observer and is consumed after native completion', () => {
  assert.match(capture, /parent\/development evidence collector at BUILD time/);
  assert.match(capture, /structured scenario_evidence through supported awaited Guild console tools/);
  assert.match(capture, /No default observer, source polling, subscription or auth bridge/);
  assert.match(capture, /visualization author does not start a test run to obtain missing evidence/);
  assert.match(capture, /SESSION before the next application- controlled mutation destroys them/);
  assert.match(capture, /postrun input 1.1 \/ source projection 2.1 through the existing collector-sidecar/);
  assert.match(capture, /Original input 1.0 \/ projection 2.0 .* remain supported under their original contracts/);
  for (const text of [editor, author, effects, copy, checker]) {
    assert.match(text, /parent\/development (evidence )?collector/);
    assert.match(text, /structured console_log/);
    assert.match(text, /projection 2.1/);
    assert.match(text, /[Nn]o observer, source polling, subscription or auth bridge/);
  }
});

test('intermediate captures retain exact identity and observation provenance without assuming atomic readback', () => {
  assert.match(capture, /run\/source occurrence references, exact target identity/);
  assert.match(capture, /Absent revision\/time\/order metadata stays unknown/);
  assert.match(capture, /External concurrent writers can still cause TOCTOU races/);
  assert.match(capture, /console acceptance is not independent readback or a lock/);
  assert.match(capture, /Never stamp final-state content with an earlier event's time or claim it was observed then/);
  assert.match(capture, /validate planned coverage/);
  assert.match(copy, /Flag final content stamped as an earlier observed version or a reconstruction presented as observed readback/);
  assert.match(checker, /whether the intermediate version was actually observed before later changes/);
});

test('missing session evidence does not license polling, reruns, permission expansion or another UI', () => {
  assert.match(capture, /No assistant polling or sleeps, extra run, permission expansion or business write is authorized/);
  assert.match(capture, /Missing capture stays a gap with normal source-bound rendering after bounded quality work/);
  assert.match(capture, /never fake approval, extra review calls or an alternate UI/);
  for (const text of [editor, author, effects, copy, checker]) {
    assert.match(text, /assistant polling\/sleeps/);
    assert.match(text, /TOCTOU/);
    assert.match(text, /[Ll]ogs are (?:untrusted |attributed )?evidence, (?:never |not )/);
  }
});

test('each material step uses its own version and later edits compare with the prior version', () => {
  assert.match(temporal, /at each content\/effect step, tied to the exact target, source occurrence and supported operation order/);
  assert.match(temporal, /initial empty creation is not the later populated artifact/);
  assert.match(temporal, /first content insertion shows only the version supported at that step; a later append or replacement compares against that prior version/i);
  assert.match(temporal, /not against an empty artifact or the final payload repeated at every step/);
  // This must be a state-transition rule across artifact classes, not a study,
  // document title, provider or fixture-specific selection heuristic.
  assert.match(temporal, /same rule to edits of messages, ticket fields, calendar details, spreadsheet rows and other records/);
  for (const text of [effects, editor, author]) {
    assert.match(text, /material (artifact )?version at each content\/effect step/);
    assert.match(text, /later append[\s\S]{0,100}prior version/);
  }
});

test('captured state is preferred and final content cannot be reverse-guessed into a baseline', () => {
  assert.match(temporal, /Prefer actual captured before\/after versions/);
  assert.match(temporal, /source bytes, target identity, completeness, redactions and evidence references unchanged/);
  assert.match(temporal, /Never reconstruct a prior version by guessing, truncating the final text, removing an apparent section or assuming an append from its wording/);
  assert.match(temporal, /final readback alone cannot establish intermediate versions or the cause\/order of changes/);
  for (const text of [editor, author, copy, checker]) {
    assert.match(text, /baseline/);
    assert.match(text, /guess(?:ed)?[\s\S]{0,100}truncat|truncat[\s\S]{0,100}guess/);
  }
});

test('deterministic replay is gated on exact inputs and preserves uncertainty when they are absent', () => {
  for (const text of [temporal, effects, editor, author, copy, checker]) {
    assert.match(text, /known exact baseline, exact source operations, the same verified target and (?:an )?unambiguous operation order/);
  }
  assert.match(temporal, /do not skip missing or failed operations to manufacture continuity/);
  assert.match(temporal, /If any required input is missing, ambiguous or incompatible, retain the captured version and disclose the missing baseline or ordering evidence/);
  assert.match(temporal, /do not fabricate a diff/);
  assert.match(temporal, /not new fields, commands or a claim that a replay helper exists/);
  assert.match(effects, /does not introduce a helper API or authorize executing source operations against a service/);
});

test('requested mutations, partial acknowledgments and observed storage are different evidence levels', () => {
  assert.match(temporal, /replay-derived requested state is not independently read-back stored content/);
  assert.match(temporal, /Distinguish requested mutations, acknowledged operations and observed stored versions in private evidence and claims/);
  assert.match(temporal, /Public prose describes only the supported business effect or attempt, not the validation procedure/);
  assert.match(temporal, /Tool acceptance alone does not establish successful completion or the exact resulting state/);
  assert.match(temporal, /partial response supports only its recorded successful portion; do not apply the whole requested batch as confirmed/);
  assert.match(temporal, /Preserve contradictory captures and unknown confidence/);
  assert.match(checker, /When authorized source capabilities permit, check the material version at every content\/effect step, exact target identity and operation order/);
  assert.match(checker, /If historical versions, ordering or target identity cannot be checked, record unavailable\/inconclusive or a scoped qualification with the actual gap/);
  assert.match(checker, /not invented source access or confirmation/);
  assert.match(checker, /Do not write, replay operations against a service or expand the read-only allowlist/);
});

test('failed and partial concerns explain an evidence-grounded problem and consequence without an invented fix', () => {
  assert.match(concerns, /concrete supported problem and its consequence for the intended result/);
  assert.match(concerns, /not merely repeat “Outcome: failed” or “Outcome: partial”/);
  assert.match(concerns, /actual event and available evidence: what was attempted, what failed or remains incomplete, and what that means for the user/);
  assert.match(concerns, /distinguish an observed error, an attributed report and an inferred cause/);
  assert.match(concerns, /If the cause is unknown, say so and describe the known consequence instead/);
  assert.match(concerns, /Missing evidence is not proof of a failed write/);
  assert.match(concerns, /source\/claim-bound `concern\.explanation` for the goal conflict/);
  assert.match(concerns, /`suggested_feedback\.explanation` for the human fix and `suggested_feedback\.text`/);
  assert.match(concerns, /Do not repeat the timeline description or use the technical prompt as the human explanation/);
  assert.match(concerns, /useful concern does not require a proposed fix/);
  assert.match(concerns, /never invent a root cause, permission change, retry outcome or remedy/);
  for (const text of [editor, author, copy, checker]) {
    assert.match(text, /concern\.explanation/);
    assert.match(text, /suggested_feedback\.explanation/);
    assert.match(text, /suggested_feedback\.text/);
    assert.match(text, /cause/);
  }
});

test('copy findings cannot rewrite protected content, invent state or force approval', () => {
  assert.match(copy, /Flag missing material artifact versions, final payloads repeated at earlier steps/);
  assert.match(copy, /Raise these as meaning findings for the author; never rewrite protected artifact content, before\/after, source evidence, IDs or timestamps to make a review pass/);
  assert.match(copy, /not new review calls or a requirement to force pass/);
  assert.match(copy, /At most TWO copy-review calls/);
  assert.match(author, /await native completion notifications or a supported blocking wait/);
  assert.match(author, /Never run copy and fact reviewers concurrently/);
  assert.match(checker, /Missing or invalid review stays private diagnostics; normal source-bound 1\.10 rendering does not require fake approval, another layout or extra review budget/);
});

test('concern privacy does not turn missing generation diagnostics into a business failure cause', () => {
  assert.match(concerns, /Do not expose a copy-review finding, missing reviewer, verdict or generation process as the cause of an application failure/);
  assert.match(timeline, /private everywhere: chat, UI, evidence disclosures, dialogs, feedback cart and copied prompts/);
  assert.match(copy, /invent missing implementation facts/);
  assert.match(copy, /private/);
  assert.match(checker, /Keep generation diagnostics private and genuine source gaps public/);
  assert.match(author, /never expose generation-process internals in end-user chat, UI, source details, dialogs, cart or copied prompt/);
});

test('prototype concern pattern preserves useful explanation and modern cart intent without demo leakage', () => {
  assert.match(concerns, /https:\/\/app\.notion\.com\/p\/v2-Agentic-SDLC-visualization-414c3e1ce8dc80018091f454f386979b\?source=copy_link#5610bca3053d479789a97b074ac9a9e9/);
  assert.match(concerns, /expanded accordion has “Claude’s concern”, “Suggested fix” and “Add suggested fix to prompt”/);
  assert.match(concerns, /headings are product copy, not disclosure of a private reviewer or proof that a review ran/);
  assert.match(concerns, /never its sample text, demo identities or illustrative outcomes as evidence/);
  assert.match(concerns, /Preserve the modern add-fix-to-cart action; do not replace it with the prototype's copy-only action/);
  assert.match(concerns, /Adding a fix to the cart remains unexecuted intent, not permission to apply it/);
  for (const text of [effects, editor, author, copy, checker]) {
    assert.match(text, /timeline-content\.md/);
    assert.match(text, /Claude’s concern/);
    assert.match(text, /Suggested fix/);
    assert.match(text, /add-fix-to-cart|Add suggested fix to prompt/);
    assert.match(text, /demo|sample data/);
  }
});

test('concerns distinguish an external problem and a repeated trigger from proven incorrect behavior', () => {
  assert.match(concerns, /Distinguish external-service failure from incorrect agent behavior/);
  assert.match(concerns, /timeout can explain missing input without proving that the agent acted wrongly; assess its handling separately against the supported expectation and outcome/);
  assert.match(concerns, /repeated trigger can be a legitimate retry/);
  assert.match(concerns, /trigger alone is not a proven failure: a duplicate-result concern needs evidence of the observed duplicate result, not just two starts, two requests or an inferred race/);
  assert.match(concerns, /Do not invent an unknown cause or copy the prototype's diagnosis into another run/);
  assert.match(copy, /Flag wording that equates external-service failure with incorrect agent behavior without evidence/);
  assert.match(checker, /duplicate-result concern needs an observed duplicate result, not just repeated starts or requests/);
});

test('Dismiss is accessible ephemeral visibility, not feedback transport, approval or a schema mutation', () => {
  assert.match(concerns, /“Dismiss” as a local in-memory concern-visibility action only/);
  assert.match(concerns, /hides that concern in the current page instance, not the event, artifact or evidence/);
  assert.match(concerns, /must not mutate source\/snapshot content, add\/remove cart entries, imply approval or correctness, execute feedback, or persist dismissal across reloads\/sessions/);
  assert.match(concerns, /Dismiss must be keyboard accessible and must not accidentally toggle the accordion or activate the fix action; keep focus usable after hiding the concern/);
  assert.match(concerns, /Place Dismiss inline beside “Possibly incorrect behavior”, outside its summary/);
  assert.match(concerns, /renderer implementation belongs to the UI layer/);
  for (const text of [effects, editor, author, copy, checker]) {
    assert.match(text, /“Dismiss”/);
    assert.match(text, /local in-memory concern visibility|hides only that concern in memory/);
    assert.match(text, /approval/);
    assert.match(text, /persistence|persist|resets on reload/);
  }
});

test('presentation keeps narrative color uniform and labels source links from identity and actual extent', () => {
  for (const text of [timeline, editor, author, copy]) {
    assert.match(text, /same default body text color for all narrative event descriptions, regardless of outcome/);
  }
  assert.match(timeline, /Status icons and artifact diff highlights may carry their own accessible semantics/);
  assert.match(controls, /supported by captured artifact type, service and safe URL/);
  assert.match(controls, /Do not use a generic “Open source record” when a more specific identity is supported, or guess a provider from narrative text/);
  assert.match(controls, /Actual displayed content extent, not a link's presence, determines whether a full-content label is truthful/);
  assert.match(controls, /Source URL identity must match the artifact target/);
  assert.match(controls, /An absent safe source URL means no invented link/);
  assert.match(controls, /A button label does not authorize opening an authenticated service, writing to it or claiming that the link loaded/);
});
