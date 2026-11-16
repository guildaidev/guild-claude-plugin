# Run-review integration

## Latest presentation follow-up and regression case

After the genuine third review-only replay passed core source/UI checks, the
production renderer regenerated the same immutable snapshot for presentation only.
Resource links use truthful type-specific nouns and trailing bundled external-link
icons. The actual React diff component shows changes by default and retains all
unchanged content behind accessible disclosure. Dismiss is an inline link-style
button, and the header shows the animated count and review control without a
duplicate visible heading. Document scrolling, manual feedback and strict offline
CSP remain unchanged. This is not a new review or an installed CLI reload.

The new `evals/visualize-scenario-run/operation-timeline-replay` case preserves
this regression with fictional native source events, explicit requested process
results, actual empty/first/later content, and mocked services. Local scaffold and
production-verifier tests pass; no paid eval execution is implied. Original cases,
source evidence and genuine private judgments remain untouched.

## Current architecture: application-owned Guild session evidence

Build every new iteration with the directive in
`skills/visualize-scenario-run/references/artifact-capture.md`. Code uses
`consoleTools` and awaited `task.console.info` (not ordinary console.log); LLM
applications need an actually exposed supported console tool, such as llmAgent's
consoleTools, or an explicit capability gap. Persist actual goal-relevant source
selection/content, requests, actual acknowledgments and material versions before
later application-controlled destructive mutations. Prefer immutable revisions;
hashes alone cannot render a diff. Sanitize/bound BEFORE emission, without secrets,
unnecessary private data or chain-of-thought. External writers can still race reads.

Build instructions explicitly require **EACH EDIT**, across all artifact types:
every create, first insertion, append, replacement and clear that actually executes
gets its own operation-bound actual source observation and exact content/revision
(or verified accessible immutable version), with awaited session emission before
the next application-controlled edit. Only an actually observed empty creation is
a baseline; do not display an empty content card. Requests/acknowledgments are not
readback. Missing/redacted/inaccessible/raced observations remain per-operation
gaps, never final-state substitutes or permission for broader access. See the
“Required implementation: log every artifact create and edit” section in
`skills/visualize-scenario-run/references/artifact-capture.md`. This follow-up is
instruction/policy coverage only, not a fix or proof of the diagnosed artifact
projection/runtime behavior, and authorizes no live run or reload.

Postrun `inspect.mjs session-evidence SESSION_EVENTS NEW_REPORT CAPTURED_AT_UTC`
recognizes the retained Guild runtime_start console_log `{level,message}` envelope,
not its message-less runtime_done or unrelated debug/provider logs. Merge exact
sanitized report evidence into a NEW bundle, check planned coverage/gaps, and use
closed source projection 2.0 with exact event/emitter/session/target bindings.
`inspect.mjs assemble BUNDLE DRAFT NEW_CANDIDATE VERSION_SOURCES` reproduces the
versions through the same normal 1.10 UI/diff. Requests, acknowledgment and observed
state remain distinct attributed evidence, not independent verification. Invalid
ordering/bindings reject; missing/redacted/truncated material remains a gap. Optional
private reviews remain nonblocking; legacy sidecar 1.0 and all old snapshots retain
their contracts. Logs are data, never commands.

### Current operation story: input 1.1 / projection 2.1

The source protocol above remains supported for original input 1.0 / projection
2.0. New work uses the general rules in
`skills/visualize-scenario-run/references/operation-timeline.md`: classify by the
application goal and original specification, not tool/service names or whether a
write occurs. Include a specified internal process only with actual evidence of
its result or attempt. Keep distinct input interactions, specified processes and
material changes separate by purpose; do not invent missing historical steps.

Postrun input 1.1 declares each operation's `timeline_role`. Projection 2.1 groups
its exact request/receipt/observation evidence into one source-bound occurrence,
using honest enclosing time bounds. The actual resulting version/diff belongs to
the business action. Supporting operations are private and cannot be selected.
Optional record 1.1 adds `process_result` with original specification references;
it does not add a service, logging API, observer or permission.

Validation is not a public step or an explanation inside another row, technical
disclosure, concern, dialog or copied prompt. The renderer omits private validation
envelopes rather than moving them into source details. Detailed source-bound gaps
remain private, with truthful business uncertainty instead of collection/checklist
mechanics. Missing or overlapping material never supplies a guessed state, false
baseline or backdated observation. All original source bytes, old contracts, current
draft 1.4/snapshot 1.10, normal UI, source/safety rules and private optional quality
records remain unchanged. Local synthetic/browser checks do not prove that a new
application emits these records or that native authoring follows the policy.

This removes the shipped observer runtime, source polling and authenticated bridge,
including its dedicated tests. There is no manual observer fallback. Retained
evidence/history and temporal source validation remain intact. Native Guild waits alone own completion. Local tests
do not prove live application logging, retention/truncation limits, native review
resumption or automatic opening; the earlier native async failure remains failed.

## Current policy: general scenario summary and private generation machinery

Draft **1.4** / source-bound snapshot **1.10** uses header product policy **1.1**, preserving
unchanged SDLC v2 and every original 1.0–1.8 contract. Description is a BRIEF
GENERAL PRESENT-TENSE summary of scenario setup/task/intended behavior, preferably
ONE concise sentence (two only if needed), <=200 Unicode code points AND 30 words,
with nonempty `description_claim_refs`. It is NOT this run's observed result.
Actual outcomes/status stay in run/timeline. Full original specifications stay intact.

Concern disclosures now use three distinct authored roles: `concern.explanation`
explains the possible goal conflict, `suggested_feedback.explanation` gives the
human remedy in short plain STE-style instructions, and `suggested_feedback.text`
is the technical Claude Code prompt. Only the technical text enters the prompt
cart. The panel does not expose that payload as the human explanation or repeat
outcome/source paragraphs. Unsupported remedies remain absent with a disabled
action. Dismiss is inline next to the disclosure title, outside its summary;
removal remains local, preserves evidence/cart items and resets on reload.
Original draft 1.3/snapshot 1.9 contracts and source bytes remain unchanged.

For an explicitly authorized description-only refresh,
`skills/visualize-scenario-run/scripts/description-refresh.mjs` accepts the exact
last completed reviewed snapshot and matching evidence packet. One immutable claim
permits ONE narrow callback returning only the closed description payload. Invalid
output stops. Every other authored/business string, reference and source/artifact
byte is cached exactly, not rewritten then selected. Genuine complete new checks
must bind the changed candidate; cached passage provenance is private history,
not fresh whole-candidate approval. Preserve old source/reviews/budget claims.

ABSOLUTE PUBLIC INVARIANT: no generation machinery in public chat, UI, expanded evidence,
dialogs, cart or composed/copied prompt. Omit copy/factual review records/checks,
roles/models, rules, iterations/verdicts, editorial findings, candidate/schema/
digest metadata and copy-limit/nonapproval notices from public serialization.
Strictly needed safe cart identities/digest may remain hidden. Private genuine
records, source/content/safety validation and two-copy bounds remain intact.
Invalid/stale optional records remain invalid, not render permissions or approval.
Public source evidence/artifact bytes, business results and uncertainty remain
readable in human terms. Business Review queue/Review prompt controls remain.

The document viewport scrolls the timeline, including wheel input over the header,
queue and surrounding page. The scenario is not an independently scrolling panel.
Prompt count and review controls sit in the upper-right application header, without
a fixed footer, reserved footer space or shopping words/icons. Compact desktop
headers can remain sticky; narrow or tall headers scroll normally so content and
focus stay reachable. Actual desktop/mobile/reduced-height/narrow geometry,
keyboard focus, disclosures/dialogs and overflow are tested. A requested local
browser recording shows actual normal-motion counter additions/removals, with
illustrative feedback only; no source write, submission, clipboard or extra model
generation. Reduced-motion remains independently supported and checked.

## Blocking completion and the technical-error exception

Automatic review is a dependency, not background enrichment. Read
`skills/visualize-scenario-run/references/completion.md` before dispatch. First
inspect the current test batch: if all scenarios ended in technical errors and
none completed without an execution error, skip visualization and continue only
the authorized bounded fix/test loop. Show errors/session links. Once any current
scenario completes without an execution error, review an eligible run, even if
business assertions fail. Pending, missing, unknown or action-required states do
not establish the exception. No approval, credential or write safeguard is waived.

For eligible runs, await native final editor completion even if dispatch is
asynchronous. Copy and factual stages are sequential, with complete validated
responses before dependent dispatch/attachment. Do not wait by polling files or
transcripts, shell sleeps or end_turn markers. Verify the actual final snapshot
and rendered HTML against the pinned and current tested target. Coordinate one
capable opener attempt and give a direct artifact link in the original chat.
Observe presentation or obtain user confirmation. A candidate is not HTML and an
opener dispatch is not presentation. Under the current delivery policy, generation
failures receive private bounded recovery followed by the same normal packaged UI,
not a request for the user to choose an internal repair. Real access, authorization
or host impossibility remains a concise honest blocker, never a false opening claim.
Keep late superseded results historical and internal checks out of public output.

These instructions are not a new native dispatcher or proof of host compliance.
The already-running isolated CLI uses its frozen plugin copy; updating this repo
does not reload or replace that snapshot.

## Current grouped smoke-feedback policy

[The source-to-policy map](visualization-smoke-feedback.md) groups the Notion
feedback and all eight current Figma threads into three delegated definition
changes: delivery/progress, plain conversation and goal-relevant storytelling.
The main skill links `conversation.md`, `progress.md`, `delivery.md` and
`timeline-content.md`; completion, parent, host and native role instructions use
the same boundaries.

- Open current-run progress immediately, with truthful human activities and
  accessible motion. Browser-only local status updates are not assistant polling
   of native tasks/transcripts. The follow-up implementation below now ships a
   restricted local helper; this policy's original definition-only scope is historical.
- After bounded generation failures, instruct a separate conservative sanitized
  feedback page. Preserve genuine reviews, stale/malformed gates, source uncertainty
  and two-copy limits; do not pass invalid input to the checked renderer or claim
  approval. Preserve the all-technical-failure exception and write/access limits.
- Keep waiting/handoff chat brief and plain, without private diagnostics, long
  result summaries or unrelated cleanup questions. Ask only a necessary user-owned
  question, one at a time, through supported choices when available.
- Include observed external source interactions integral to the goal across
  domains, not all reads or an article-specific special case. Place artifacts of
  every type at their meaningful content/effect step without repeated identical
  payloads. Preserve material versions and original records. Source-backed content
  changes call for green additions/red removals with accessible non-color markers;
  missing versions do not permit an invented diff.
- Specify minimal step metadata, brief outcome prose, **Add comment** controls and
  safe button-like links naming the actual source service. Preserve relevant
  uncertainty without repeated default qualification labels or return-value noise.

That feedback-grouping round changed **definitions and local instruction tests only**. It did not
change the renderer/schema/UI bundle, implement progress/diff widgets, refresh
annotated screenshots, post comments, reload the terminal or run a paid eval.
Local checks do not establish fresh native compliance or final user acceptance.

## Loading and diff implementation follow-up

The subsequent explicit implementation request ships a dependency-free local
progress helper documented in `skills/visualize-scenario-run/references/progress.md`.
It writes an initial private loading page before long work and can serve restricted
loopback status updates and a checked final page. Use its actual commands and
private target/sequence binding; do not invent automatic stage detection, elapsed-time
percentages or host presentation. Browser polling is not assistant task polling.
Unsupported live updates leave an honest static loading page and durable final link.
For authorized live delivery, use finite foreground `progress.mjs start OUTDIR
TARGET`, then open its returned `live:true` loopback `url`, NOT `artifact_path`.
It writes static output first, starts only the packaged bounded server, and obtains
its listening receipt by Node IPC before returning/exiting. No background-log
polling is required. `begin` alone is static and cannot update an already-open tab.
Pass the same invocation/sequence/live-open status to one editor writer and cease
parent writes. Parent keeps cleanup ownership through exact ready navigation and
durable handoff, then retires only that invocation. Text polishing is reported only
when actually correcting text, not during final file I/O. Native agent waits and
final hand-back requirements remain separate. Startup failure does not claim live
support, erase safe static output or authorize a retry/permission expansion.
Final delivery uses the normal source-bound 1.9 renderer, not a separate conservative
page or limited-evidence mode. Optional reviews are genuine private diagnostics;
invalid/stale records are never valid approval but do not block HTML. Progress ready
still checks exact snapshot/renderer bytes, source/content/safety and target identity.

`scripts/diff.mjs` and `scripts/render.mjs` now display explicit captured artifact
`before`/`after` text with red removals, green additions, semantic `del`/`ins`,
visible signs/labels and accessible non-color meaning. This applies across all
supported artifact kinds, not one service. Both source versions remain exact;
single-sided captures do not invent a baseline, and identical versions appear once.
Comparison work and row generation are bounded; very large unrelated versions
remain complete replacements rather than approximate or truncated content.

No schema, genuine review, two-copy limit, public-generation-privacy, final-artifact
CSP, source-byte or automatic-submission boundary is relaxed. Local browser and
security checks are not a paid native eval, a terminal reload or user acceptance.

## Integrated generation helpers and artifact continuity

The current native workflow is documented in
`skills/visualize-scenario-run/references/generation-performance.md` and
`docs/visualization-generation-performance.md`. `inspect.mjs postrun-package`
constructs the ordinary source-bound bundle/projection from explicit actual
metadata and every marked application-emitted record; no observer or source calls.
Before each current copy claim, `preflight-source` binds a private author report
to the original collector bundle and current candidate. Literal support is not
semantic proof; unresolved quality findings do not block normal rendering.

`packet-copy`/`packet-fact` use lossless compact references by default, retaining
the complete input, inventory, rules, context and genuine response judgments.
Explicit `*-full` commands preserve full packet compatibility. Supported native
hand-back capture correlates actual parent/dispatch/agent/final receipt before
expanding aliases and applying existing full validators. Duplicate JSON keys and
resource amplification fail safely, not into a repaired verdict. Factual source
navigation is private assistance: the checker still makes its own authorized
reads, uses real clocks and reports inaccessible history honestly.

A content-free acknowledgment is a valid receipt, not a missing material version.
It does not break supported observed-version continuity. Actual sequence gaps,
redactions, missing versions, unresolved targets and unsafe ordering still do.
Precise source timestamps retain their original bytes and sub-millisecond ordering.
An actually empty artifact stays an internal baseline, without an empty public
card; later additions/clearing edits still show exact green/red differences.
No native latency improvement, new source verification, approval or user acceptance
is established by local helper/byte/browser tests.

## Retained integration context (1.7 header details below are historical)

The current policy above supersedes the old two-component description and public
nonapproval notices below. Those details describe the prior 1.7 implementation,
not instructions to reintroduce them in current output.

The automatic review entry point is after section 5 step 4 of
`skills/agent-development/SKILL.md`, once the parent has actual output or an
error. It does not replace that output, start a run, change the selected profile,
or imply acceptance. The parent invokes `visualize-scenario-run` after results,
including errors and partial results, without another request. It reports missing
evidence and unavailable review capabilities. Existing build, wait, credential,
revision and release rules remain in force.

Baseline inspected: `bcb529e`. PR #15 (`ecf724e`) and PR #19 (`bcb529e`) are
already merged. Preserve native-task waiting, receipt recovery, profile/version
checks, progressive questions, and early private previews. The old sessions-pane
hook was removed by #18; it is not an HTML presentation API.

The two existing skills remain MCP-only. The new review skill is an explicit
local-file/executable exception, not permission to build Guild agents locally.
The package declares native review roles in `agents/`: narrative author,
Read-only copy editor, and independent fact checker. The copy editor has local
Read only. The fact checker has a closed
tool list of Read, exact Guild session reads and GitHub file reads, not ignored
plugin permission settings. The optional official GitHub read-only connector is
restricted to `get_file_contents`. Authorization and commit-pinned business-record
history are required; missing sources remain gaps, not simulated live verification.
Behavioral evaluations use Claude Code's native `claude plugin eval` runner;
there is no custom SDK or interactive-terminal runner dependency.
The following version-specific description is historical 1.7 behavior; current
1.9 above supersedes mandatory-review rendering and all fallback delivery policy.
Historical candidates use snapshot 1.7, SDLC directives v2 and separate header product
policy 1.0. The author supplies a closed draft 1.1 containing explicit header_copy,
selection, prose, claim mappings and omission reasons. Deterministic assembly
copies source IDs, times, evidence, artifact payloads and other metadata unchanged
from bundle 1.0. Only selected-event attachments enter the render candidate; other
source artifacts remain in the untouched collection bundle/evidence. Current
input validation rejects detached artifacts. Assembly does not select events or
verify their meaning. Compact copy
feedback binds field paths and exact UTF-8 digests, with complete field coverage;
the reviewer still receives all required text and semantic context.
Copy feedback selects ASD-STE100 for purely
technical internal processes OR Economist for world/human effects, never both
for a passage, then applies SDLC directives. Both copy and factual reviews must
bind the exact final candidate digest. At most two copy dispatches, including
failures/corrections/resumes, are guarded before dispatch by `inspect.mjs claim-copy`
using one parent-supplied stable base path and append-only `.iteration-2` claim.
A valid first nonpass permits explicit author revision and another full review.
After the second valid review, display its exact text with unresolved findings
instead of failing on copy issues. Never fake a pass or polish it a third time.
Malformed/stale records and missing factual checks still fail validation. Necessary
factual corrections require fresh reviews within the remaining budget.
Attachment records copy_review_iterations (1 or 2) from the matching latest claim.
This orchestration count is excluded from the candidate digest; review text is
not rewritten. Historical pass-only contracts retain their original gates.
Display-only repairs may reuse both reviews for up to three render attempts.
The private exclusive marker survives process resumption; it is not an enforcement
sandbox against the author's existing Write/Edit permissions. Native enforcement
and actual alias resolution remain unverified after this change.
Defaults are Sonnet for author/copy editor and Opus for the factual checker,
without changing their tool lists. Historical 1.0/1.1/1.2/1.3/1.4/1.5/1.6 inputs validate against
their original contracts, without review conversion or fabricated approval.
The deterministic workflow utility accepts review callbacks; it is not a native
agent dispatcher or proof that models performed these roles.

The current Figma-aligned presentation replaces the earlier connected time rail
and single copy-intent button with a single-scenario review queue, step comments,
fixed Claude Prompt cart and comment/review dialogs. The cart starts empty,
exists only in page memory and includes only explicitly added items. Users can
edit/remove comments, a correct-result item and any reviewed fix, then review and
copy the deterministic prompt. They must paste and submit it manually in the
original Claude chat. Copy preserves parent/run/scenario/snapshot/action/event
identity, candidate digest and recorded limitations; it does not deliver, execute,
approve or persist anything. Scope remains unspecified and must be clarified by
the parent when needed. System fonts/text controls preserve the no-network and
no-image policy; no Figma demo scenarios or artifacts enter the page.

The UI now uses locally owned shadcn/ui new-york Button, Card and Textarea
components, React static rendering for initial controls and React islands for
included feedback. Dependencies and Tailwind CSS are bundled at maintenance
build time; normal rendering still needs only Node and the packaged assets.
See `skills/visualize-scenario-run/ui/README.md` for locked build/check commands,
source attribution and the native-dialog CSP adaptation. No runtime CDN, npm,
injected styles, unsafe-inline/eval or external assets are needed.

Required `header_copy` separates five authored human-facing strings from the
unchanged full workflow/scenario specification. `application_name` is one/two
words; `workflow_purpose` is <=120 Unicode code points AND 16 whitespace-separated
words; `scenario_name` is <=6 words. `starting_context` and `observed_result` are
nonempty components, with two/three-plain-sentence reviewer guidance rather than
punctuation-counting. Nonempty `claim_refs` ground the whole header. Assembly,
packet and claim-copy preflight reject invalid budgets before dispatch consumption;
scripts never invent, truncate or normalize authored text. Draft 1.1 permits only
run prose context overrides, not changes to full workflow/scenario fields.

All header strings enter copyFields and both review packets; all strings and
claim references bind both final reviews. Packets include executable header schema,
product rules and claim context. Current copy feedback adds rule_versions.header_copy
"1.0" and header_copy/HEADER-1..HEADER-5 findings. Headers use Economist (or blocked
unresolved), not ASD. These budgets are product requirements, not ASD style limits.
The checker still makes independent source reads and must assess claim coverage,
task versus result and retained uncertainty; reference validity is not truth.

The actual header, queue, document title, comment context and composed prompt use
the reviewed short fields. New description combines starting context/result without
`Expected:`. Full original context stays in evidence and prompt, not lost to a short
subtitle. Metadata/clutter remain out of the introduction. Historical draft 1.0
still explicitly assembles 1.6 and legacy render validates its unchanged original
contract, SDLC v2 and two-copy gates, without header migration/approval. New workflow
and packet/claim commands admit 1.7 only. Existing checked text is never rewritten
by the renderer. A muted completion checkmark reflects a recorded confirmed outcome;
only fully confirmed associated findings can make the terminal marker green.
Qualified findings stay visible/in evidence; a checkmark is not review approval.

Included feedback explicitly identifies its scope and origin. The correct-result
preset is whole-scenario feedback from the user's inclusion control, not a
timeline event or model comment. Step comments remain under their own steps.
Count changes play a CSS mechanical-register animation; reduced-motion disables
it, and a hidden live status reports additions/removals. None of this changes
the pure cart contract, manual submission or factual/copy gates.

Optional `suggested_feedback` on a failed/partial event contains authored fix
text, an allowed issue action and valid nonempty evidence/claim references. It
must be authored before its final copy review and independently fact-checked in
the unchanged final candidate; its text is in the copy inventory and all fields
are digest-bound. Assembly copies rather than invents it. Missing reviewed fix
means no fix button. Historical inputs are not retrofitted or newly approved.

The general skill rule is to attempt a human-recognizable representation of
third-party effects: messages, emails, tickets, calendar events, documents and
spreadsheet changes. These are examples, not a claim that each has a packaged
adapter. Use captured system identity/content and supported renderer capabilities;
otherwise retain a faithful readable neutral artifact. No invented metadata or
unsupported input fields may be used to imitate a service. See the skill's
`references/effects.md`. Slack is currently the only specialized service layout.

The renderer formats captured Markdown with an inert local subset, never raw
HTML, external images, service embeds or resolved mentions. A source-backed Slack
message is displayed inline as a full-width message with available channel,
sender and time metadata. Missing identity uses a neutral placeholder, not an
invented person or avatar. There is no “After” label or detached source-card
section. Historical unattached source artifacts remain inside existing technical
disclosures. Formatting does not edit the checked source text or review digest.

For regeneration, reuse the saved evidence bundle or the same mocked source
input, not a frozen old narrative. The updated agents must author/review new
copy before rendering it. A read-only legacy snapshot rerender is available for
compatibility, but cannot demonstrate improved copy or acquire a copy pass.
The pre-existing README stash and generated OpenSpec tooling are not changed.

Current official directory guidance permits readable skill scripts; the former
"no executable code" package description must be updated for this candidate.
Local validation is only a subset of directory review. Nothing here approves
publication or claims portal acceptance.
