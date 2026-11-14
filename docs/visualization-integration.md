# Run-review integration

## Current policy: general scenario summary and private generation machinery

Draft **1.2** / snapshot **1.8** uses header product policy **1.1**, preserving
unchanged SDLC v2 and every original 1.0–1.7 contract. Description is a BRIEF
GENERAL PRESENT-TENSE summary of scenario setup/task/intended behavior, preferably
ONE concise sentence (two only if needed), <=200 Unicode code points AND 30 words,
with nonempty `description_claim_refs`. It is NOT this run's observed result.
Actual outcomes/status stay in run/timeline. Full original specifications stay intact.

For an explicitly authorized description-only refresh,
`skills/visualize-scenario-run/scripts/description-refresh.mjs` accepts the exact
last completed reviewed snapshot and matching evidence packet. One immutable claim
permits ONE narrow callback returning only the closed description payload. Invalid
output stops. Every other authored/business string, reference and source/artifact
byte is cached exactly, not rewritten then selected. Genuine complete new checks
must bind the changed candidate; cached passage provenance is private history,
not fresh whole-candidate approval. Preserve old source/reviews/budget claims.

ABSOLUTE PUBLIC INVARIANT: no generation machinery in UI, expanded evidence,
dialogs, cart or composed/copied prompt. Omit copy/factual review records/checks,
roles/models, rules, iterations/verdicts, editorial findings, candidate/schema/
digest metadata and copy-limit/nonapproval notices from public serialization.
Strictly needed safe cart identities/digest may remain hidden. Private genuine
records and every structural/stale/role/source/factual/two-check gate remain intact.
Public source evidence/artifact bytes, business results and uncertainty remain
readable in human terms. Business Review queue/Review prompt controls remain.

The scenario has a bounded independently scrolling panel between workflow header
and cart. Its title/brief description/correct-feedback control stick at that
container's top with opaque background and contained stacking, not at the viewport.
Actual desktop/390px mobile/reduced-height scroll geometry, keyboard/focus,
disclosures/dialog/footer reachability and overflow are tested. A requested local
browser recording shows actual normal-motion counter additions/removals, with
illustrative feedback only; no source write, submission, clipboard or extra model
generation. Reduced-motion remains independently supported and checked.

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
New candidates use snapshot 1.7, SDLC directives v2 and separate header product
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
