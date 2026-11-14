---
name: visualize-scenario-run
description: Review or visualize one Guild scenario run as an evidence-grounded story of world effects, with inline artifacts and feedback to the original conversation. Use automatically after agent-development test results, including partial results or failure, or when the user asks to review a run. Not for running tests, comparing runs, managing scenarios, or executing feedback.
compatibility: Requires distinct narrative-author, read-only copy-editor and read-only fact-checker agents, authorized sources, local files and Node.js 22+. Presentation is host-dependent. Automatic feedback transport is not enabled.
---

# Review one scenario run

## Current 1.8 policy — overrides historical 1.7 header guidance below

Use closed draft **1.2**, snapshot **1.8** and [header product policy **1.1**](references/style/header-copy-v1.1.md).
Description is `header_copy.scenario_description` with `description_claim_refs`:
a BRIEF GENERAL PRESENT-TENSE summary of scenario setup/task/intended behavior,
preferably ONE concise sentence, two only if needed, <=200 Unicode code points
AND 30 words. NOT this run's observed result. Actual results/status remain in
run/timeline; both reviews bind all new text/references. Keep full original specs.

For an explicitly authorized description-only refresh, scripts/description-refresh.mjs
uses the exact last reviewed snapshot and matching evidence packet. One immutable
claim permits ONE narrow author callback emitting ONLY the closed description
payload. Invalid output stops. Cache every other authored/business string, source/
artifact byte and reference exactly. No broad author pipeline or hidden retry.
Obtain genuine complete matching copy/factual checks; cached passage provenance is
not whole-candidate approval. Preserve old reviews/claims and report narrow costs.

ABSOLUTE PUBLIC INVARIANT: no generation machinery in UI, source evidence panels,
dialogs, cart or copied prompt: no role/model IDs, review records/rules, counts/
verdicts, pipeline findings, candidate/schema/digest metadata or nonapproval notice.
Keep these private with all stale/role/factual/two-copy gates intact. Show business
outcomes and source gaps/conflicts in human terms. “Review queue” and “Review prompt”
are business actions and remain. Scenario header sticks inside a bounded scrolling
panel with opaque background, not the viewport; dialogs/cart remain accessible.

Legacy 1.0–1.7 retains original contracts and checked words; current presentation
removes generation internals without modifying input or claiming fresh approval.

Teach through a concrete example: show the familiar messages, documents and
records that changed, what did not change, and what remains unknown. Do not make
the user learn platform plumbing or imply a production-readiness score.

For effects in any third-party system, attempt a visually recognizable form from
that system: a message, email, ticket, calendar event, document or spreadsheet,
not an API dump. Slack is one example, not the boundary of this rule. Follow
[recognizable-effect presentation](references/effects.md): use captured content
and metadata, a supported layout, and a faithful neutral fallback when no suitable
layout exists. Never invent service UI, identity or evidence of success.

This skill is a local renderer/file exception to the plugin's two MCP-only
development skills. It does not authorize local Guild-agent builds, new runs,
writes to integrations, golden-set changes, publication or release.

## 1. Parent: collect and hand off

Read [the contract](references/contracts.md) and
[parent collection instructions](references/parent.md). Keep the original parent
conversation responsible for the review and later feedback. Collect actual
authorized evidence for the requested run; execution method is opaque here.
Sanitize before writing any bundle or handing it to another agent. Capture exact
agent/application versions, scenario trigger, initial conditions, intended effect,
relevant sandbox integrations and resulting observed state. A sandbox label does
not establish safe credentials, destinations or production isolation.

Check capabilities first. Use a distinct narrative author, copy editor and
fact-check agent; do not silently perform all roles in the parent. Require an
authorized **read-only tool allowlist** for the checker. If distinct agents,
read restrictions, local files or Node are unavailable, explain the unsupported
capability and return the evidence/gaps to the parent. Do not invent APIs, calls,
verification, a sidebar or a successful HTML artifact.

For the Node capability probe, invoke **only** `node --version` in one Bash call.
Do not combine it with `ls`, `pwd`, `echo`, environment inspection or any other
shell command: a narrow Node grant does not authorize those commands or a chain.
Use Read/Glob for plugin files and the host-provided working directory for local
output (relative filenames are sufficient). A denied unrelated or compound
command does not establish that Node is unavailable; avoid that probe entirely.
If the standalone Node command itself is denied, report that exact limitation.

In Claude Code this plugin ships `guild:scenario-run-editor` and
`guild:scenario-run-copy-editor` (Read only), plus `guild:scenario-run-checker`
through `agents/` discovery. The fact checker's explicit
tools permit only Read, Guild get_session/get_session_events and GitHub
get_file_contents; it cannot use shell, write, dispatch or expand its tools.
Do not confuse general-purpose agents with this restricted checker. Other hosts
must establish equivalent restrictions rather than assume these files apply.

Production defaults are `model: sonnet` for editor and copy editor, and
`model: opus` for the distinct strong factual checker. Claude Code documents these aliases
in [its subagent reference](https://code.claude.com/docs/en/sub-agents). Aliases and
provider overrides resolve at runtime. This is not a measured model-specific speed
guarantee. If the requested model capability is unsupported, report that limitation
rather than silently inheriting a slower/unknown parent or claiming a faster run.
Keep the existing author tools and exact reviewer allowlists.

Allow at most **two copy-review calls per visualization invocation**, including
corrections, resumes and restarts. The parent retains both consumed claims.
The parent supplies ONE stable INVOCATION_BUDGET_PATH, for example
OUTDIR/copy-review-budget.json, for the whole invocation. If no path is supplied,
stop with an unavailable-capability diagnostic. Never guess a path or search the
home directory. Retain that same path and record across resumes/restarts. Never
delete, replace or rename a claim or choose a fresh base path. Claiming consumes
an iteration before dispatch, even if the native call
then throws, returns malformed feedback or aborts.
Resuming the reviewer or requesting corrected copy feedback consumes another call
and is prohibited after the second. This limit does not replace independent facts.

Give the editor the sanitized bundle, logical parent target, allowed intent
kinds, approved local output directory, and available host capabilities. Do not
omit the stable invocation budget path from this handoff. Do not
give it credentials or permission to execute feedback. Use the host's actual
agent dispatch facility, not a fabricated Guild tool. These are local review
agents, not newly built/deployed Guild application agents.

Use `node /absolute/skill/scripts/inspect.mjs bundle /approved/bundle.json`
for bundle validation. Keep Node invocations direct; shell command chains can
require separate permissions. For GitHub-backed business records, see
[supported source reads](references/sources.md); do not invent a tracker API.

## 2. Editor: select, write and review

Read [editor instructions](references/editor.md). Use complete sentences and
named actors/service boundaries. Select top-level workspace session starts and
terminations, world-affecting workspace-agent actions, and goal-relevant direct
or nth-order external actions. Put reasoning, reads, tool plumbing and child
lifecycle in supporting detail. Unknown session level is not top-level.

Author a closed version 1.1 selection/prose draft with explicit header_copy and claims covering context,
summary, selected events, artifact content and supporting factual prose. Use
`node /absolute/skill/scripts/inspect.mjs assemble BUNDLE DRAFT NEW_CANDIDATE`
to assemble a version 1.7 candidate deterministically. The assembler copies source
IDs, times, actors, evidence, artifact before/after and metadata unchanged. It does
not select events, author prose, classify style or apply review suggestions.
See [the draft contract](references/contracts.md). Complete the author's style and
semantic preflight across ALL authored fields before the first copy call.
Read [header product policy 1.0](references/style/header-copy-v1.md). Required
header_copy has application_name (one/two words), workflow_purpose (<=120 Unicode
code points AND 16 whitespace-separated words), scenario_name (<=6 words),
starting_context, observed_result and nonempty source-backed claim_refs. The
description components should form two or three plain human-facing sentences,
not invent completion or erase uncertainty. Original full workflow/scenario
specifications stay intact; assembly copies the header, never invents/truncates it.
These headers use Economist, then SDLC v2 and the product policy, not stacked ASD.
Both reviews cover all header fields. Invalid budgets fail before a copy claim
is consumed. Historical inputs do not gain rewritten words or policy approval.
Prepare the copy packet first. Immediately before EACH native copy Agent/Task call,
run `node /absolute/skill/scripts/inspect.mjs claim-copy CANDIDATE INVOCATION_BUDGET_PATH`.
This validates the candidate and exclusively creates a new 0600 claim with
consumed=1 or 2, max_copy_reviews=2 and its digest. The second claim uses the
base path's `.iteration-2` companion without rewriting the first. Pass the returned
claim_path to the reviewer. Only a fresh successful claim permits dispatch. A third
returns `copy_review_limit`: stop dispatching without reset or a different path.
Other claim failures also stop. `claim-copy` is a local guard,
not an agent dispatcher or proof that the host cannot bypass it. Author Write/Edit
permissions remain unchanged and do not authorize altering the record.
Invoke the distinct
copy editor with [copy-editor instructions](references/copy-editor.md), the exact
candidate, its digest, claimed budget path and sanitized semantic context. It returns feedback only.
Route purely technical application-internal explanations to ASD-STE100 OR world
effects/human experience to Economist, never both for one passage. Apply SDLC
directives afterward in either route. Only state what actually happened and
preserve meaning. New 1.7 copy passages/findings bind field_path and field_digest
(SHA-256 of the exact current text) instead of repeating original_text. Coverage,
routes, exemptions, final SDLC and semantic safeguards remain mandatory. A required
issue or revise/blocked verdict on the first valid review permits an explicit
author revision and a second whole-candidate review. Use new candidate/packet/review
files but the SAME budget base path. After the second valid review, freeze its
text and display it even if copy issues remain; preserve the genuine verdict and
findings, not a fabricated pass. Never autoapply suggestions or call a third time.
Malformed, incomplete or stale records still fail validation. After a valid pass
or the second valid nonpassing review, invoke
the **different** fact checker with [checker instructions](references/checker.md), the unchanged candidate,
its factual digest and authorized read-only source handles. The checker makes
its own calls; copying the parent bundle is not independent verification.
Synthetic fixture calls are not real-world verification.

Read findings and preserve conflict, failed access, current-state-only observations,
missing history, inference and gaps. An accurate source-scoped statement can retain
qualified findings without unnecessary rewriting. Any necessary candidate correction,
including wording alone, invalidates BOTH reviews. A necessary factual correction
can use the remaining second copy iteration and fresh factual checks. Once both
are consumed, report a factual blocker rather than render altered unsupported text.
Do not polish copy again after the second review or stamp old reviews with a new digest. Only
`display.compact` changes can reuse the same matching pair. A structurally valid
snapshot is not proof of factual truth.

Use `inspect.mjs packet-copy` and `packet-fact` for focused reviewer inputs rather
than pasting inventory, source context and contract implementation repeatedly.
They preflight structure and preserve complete coverage, not editorial or factual
approval. If a host exposes the completed reviewer's exact transcript path,
`capture-copy`/`capture-fact` preserve its actual response without author-generated
JSON duplication; otherwise retain the complete hand-back fallback. Never guess
paths, restamp feedback or skip either reviewer. Scope missing-read statements
to their supplied source and collection time rather than claiming nobody has
read a record; later verification belongs in its review. See contracts.md.

The render snapshot omits bundle origin fields and coverage-gap `impact` prose;
do not copy those fields from the evidence bundle. Keep source provenance and
verification explanations in evidence/supporting detail. Below each event's
sentence and inline artifact, use only “Possibly incorrect behavior” (for an
actual failure/partial outcome/conflict) and “Evidence and technical details” disclosures, never
standalone event qualification notes. A second nonpassing copy review gets a brief
scenario notice and its actual findings in the existing technical disclosure.
New 1.7 candidates may include optional source/claim-bound suggested_feedback on
a failed or partial step. Author it before both reviews; its text is copy-reviewed
and its factual basis independently checked. Never invent a remedy or rewrite
historical checked evidence. Historical contracts remain render-only compatible.

## 3. Editor: render, repair and present

Use the packaged script, with actual absolute paths resolved from this skill's
directory. No installation, npm, remote code, Guild CLI or network fetch is
needed. Check `node --version` (22+).

The packaged UI uses genuine locally owned shadcn/ui React components, compiled
CSS and bundled dependencies. Runtime generation remains offline and install-free.
See the [maintainer build notes](ui/README.md); narrative/reviewer agents must not
run that maintenance build or npm. Native dialogs preserve the strict CSP.

```sh
node /absolute/plugin/skills/visualize-scenario-run/scripts/render.mjs /approved/run.snapshot.json /approved/new-run-review.html
```

It returns JSON: `{ok:true, artifact_path, snapshot_id, verification, gaps}` or
`{ok:false, errors:[{path,code,message,repair}]}` (exit 1). Existing output files
are never overwritten. Supply a new filename, not a delete/rewrite operation.
Use at most **three** shared check/render attempts in total, not three copy reviews.
Only `display.compact` repair may reuse the same matching pair. Other candidate
repairs invalidate both reviews and need the remaining copy iteration plus fresh
factual review. Return bounded,
safe diagnostics on exhaustion. Never paste raw secrets into an error report.
`scripts/workflow.mjs` demonstrates this bounded loop with injected callbacks;
it does not dispatch agents, verify sources or start models itself.

On success, follow [host presentation instructions](references/hosts.md).
Terminal Claude Code uses an available browser opener, not an assumed sidebar.
Only use a sidebar when that host capability has been demonstrated. Dispatch is
not proof of successful presentation. Report a failed or unavailable opener
honestly and return the valid artifact path. Do not rerender simply to fix an
opener problem or execute untrusted artifact code in an unrestricted context.

Return to the original parent: artifact path, snapshot/run/scenario IDs,
observed presentation status, origin, verification summary, conflicts and gaps,
copy-review verdict/digest and factual-review digest,
and the copy-to-chat limitation. The editor can then close. Feedback is not
owned by the editor and must not depend on its continued session.

## 4. Parent: receive intent, not execution

The artifact starts with an empty, memory-only feedback cart. The user explicitly
adds a step comment, a correct-result item or an available reviewed fix; edits and
removals update the deterministic prompt. Unsaved drafts are excluded. Review and
copy the prompt, then paste and submit it manually in the original Claude chat.
The prompt retains snapshot, run, scenario, action, parent, candidate-digest and
optional event identifiers, recorded limitations and `execution: not_performed`.
It performs no operation, persists nothing and claims no automatic delivery.
Interpret user feedback in the original parent: clarify whether it is
scenario-specific or a general rule when needed. A mark-correct intent is not
approval to write a golden example; a rerun request is not a completed rerun.
Broader scenario selection, comparison, approved sandbox promotion to emulated
regressions, production validation and actual mutations are separate work.

## Tests and limitations

Run `node --test skills/visualize-scenario-run/tests/*.test.mjs` from the plugin
checkout. The fixtures cover the 13 review scenarios with separate fake-source
calls and controlled host stubs. They test contracts and orchestration, not LLM
instruction-following or live host operation. See `evals/README.md` for optional
model-driven cases and `references/hosts.md` for the separately authorized
real-host acceptance procedure. Do not run a live workflow to test this skill.

For local cart interaction checks, use
`node skills/visualize-scenario-run/tests/check-feedback-browser.mjs ABSOLUTE_EXISTING_PLAYWRIGHT_PATH NEW_OUTPUT_DIRECTORY [HISTORICAL_HTML]`.
This uses a separately available local Playwright/Chromium installation; do not
install dependencies or run model evaluations merely to check presentation.
Browser checks use synthetic reviews and do not close user visual acceptance.
