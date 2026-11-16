## Context

The existing Guild agent-development skill uses hosted Guild tools. The visualization adds an explicit local renderer exception to the existing skills' MCP-only workflow. Behavioral evaluation uses Claude Code's native `claude plugin eval` runner, not a custom SDK or interactive-terminal harness. See `proposal.md` for motivation and the capability spec for behavior.

The working design's top sequence and input bundle are authoritative: [implementation document](https://app.notion.com/p/415c3e1ce8dc816ca4afce26a6729fd8). Its later sequence and rules supersede the early generator TypeScript draft. [Product architecture](https://app.notion.com/p/414c3e1ce8dc80018091f454f386979b) supplies the broader teaching context, not a mandate to implement the whole ADLC lifecycle here.

The original visual reference was that page's attached [`agentic-sdlc-timeline.html` comp](https://app.notion.com/p/414c3e1ce8dc80018091f454f386979b#5610bca3053d479789a97b074ac9a9e9). Decision 18's Figma reference later superseded its appearance, and decision 37 supersedes the fixed footer/inner scrolling portions of that reference. The implementation document's later evidence semantics and subsequent explicit conversation corrections control over early drafts. The native 7/7 evidence-workflow pass did not test visual fidelity.

## Goals / Non-Goals

**Goals:** Define a bounded vertical slice from supplied run evidence to verified, readable HTML and honest feedback handoff; make unavailable verification and host support observable.

**Non-Goals:** Running or emulating application tests, live eval/profile infrastructure, scenario management, comparison, golden-set writes, rerun execution, a general-purpose bridge, or claims of support for unverified hosts. No actual workflow execution is required to implement fixture-based tests.

## Decisions

### Current architecture and precedence

Current authoring is draft **1.4** / source-bound snapshot **1.10**, bundle **1.0**,
current postrun input **1.1** / projection **2.1**, header policy **1.1** and SDLC
**v2**. Original input 1.0 / projection 2.0 and record 1.0 remain unchanged; optional
record 1.1 adds actual `process_result` evidence. The collector retains the
original sanitized bundle independently; assembly embeds it privately and the
normal offline renderer enforces source/content/identity/safety independently of
optional genuine private copy/factual records. Two immutable copy claims and
three frozen-content render attempts remain. Sonnet author/copy and a distinct
restricted Opus factual checker are unchanged; helper modules do not dispatch them.

Decision 27 supersedes earlier editorial/pass admission and alternate-HTML policies,
including conflicting portions of decisions 1/12–15/18–22/24–26. Invalid records
remain invalid, never fabricated approval; known business-source uncertainty stays
honest. Historical snapshots 1.0–1.8 retain their original validation/review contracts,
and draft 1.3/snapshot 1.9 retains its original shape. Public generation privacy
from decision 22 and brief conversation policy from 25 apply to all presentation.

Decision 31 supplies the current three concern-content roles. Decision 32 removes
decision 30's observer runtime/bridge/tests/manual path entirely, not its evidence.
Decisions 33/34 require finite live startup and EACH edit's actual version logging.
Decision 35 repairs receipt continuity, not the diff algorithm. Decision 36 integrates
all five preparation/transport helpers with that repair, without measured native
speed claims. Decision 37 supersedes fixed-footer and inner-panel/sticky-scenario
layout in decisions 18/23/27; safe compact application-header stickiness is different.
Decision 38 groups operation evidence rather than validation stages into the public
story and admits explicitly specified, evidenced internal processes by meaning.
It supersedes earlier blanket internal-process exclusion and moving validation into
technical disclosures: validation is private on EVERY public surface. Grouped
projection 2.1 changes only its named source/public projection, not historical
projection 2.0, source bytes or draft 1.4/snapshot 1.10 contracts. Decisions 39–40
record the subsequent verified replay, implemented presentation changes and new
locally checked regression case; the earlier pending-work checkpoints are history.

### Conversation decision and rationale chronology

This reconciliation records explicit user corrections and observed failures from
the conversation, not motives inferred from code. The original numbered decisions
below remain the historical record; later supersession does not rewrite source
artifacts, reviews, failed native runs or costs. Checkpoint evidence is in
`docs/visualization-validation.md` and the referenced task sections.

1. **Explain the world, not the trace (decisions 1–9).** The initial problem was
   that technical session/tool narration did not let a user judge the application's
   job. Select goal-relevant external effects and top-level boundaries, with familiar
   artifacts. Later smoke feedback (25/28) clarified that external reads/selections
   integral to that goal are eligible; this is neither blanket exclusion nor inclusion
   of all reads. Internal housekeeping stays supporting detail. The rule is generic
   across services, not a Google Docs or article-specific patch. Preserve intent,
   acceptance and actual observed state as different facts.
2. **Make feedback an explicit manual prompt (18; task 16).** The user chose
   included comments, correct-result presets and supported fixes composed for manual
   paste/submission in the ORIGINAL conversation. This rejects implicit inclusion of
   drafts, automatic delivery/execution and persistent approval. Editing replaces,
   removal excludes and identity-bound deduplication preserves exact items. A source
   link or copy success is not feedback delivery. Hidden private bindings guard stale
   items without exposing generation internals.
3. **Bound copy work without losing the page (15 → 19 → 27).** The one-review stop
   made genuine revise feedback halt before HTML (task 16's 4/7 replay). The user
   explicitly requested two iterations and display afterward, not failure. Decision
   19 implemented that bounded policy; it initially still required valid reviews and
   a factual record. Decision 27 later removes those quality admission gates for
   source-bound content, not source/safety checks. Two claims remain consumed across
   failures/resumes; there is no third copy, fake pass or model downgrade.
4. **Author headers, then correct the description and privacy (20 → 21 → 22).**
   Future prose guidance did not change verbose visible historical names/purpose or
   the Expected-style description. Required authored versioned fields, product
   budgets and digest coverage replaced truncation/display-only shortcuts. The user
   then clarified that the short description explains the GENERAL scenario in the
   present tense, not this run's past result. The one authorized description-only
   refresh cached all other business/source bytes and obtained genuine fresh bindings;
   it did not restamp old reviews. The user's absolute rejection of a copy-review
   line extended privacy to chat/UI/source details/dialogs/cart/copied prompt, while
   retaining real business uncertainty. Public copy-limit warnings are retired.
5. **Keep the earlier scrolling choice historical (23 → 37).** A contained sticky
   scenario panel was implemented and locally demonstrated under the earlier request.
   The latest user correction deliberately replaces it: more vertical timeline space,
   upper-right prompt state, no footer or ecommerce diction/icons, and document wheel
   scrolling over header/queue/content/blank space. This is a changed request, not
   evidence that the earlier recording was false. Safe compact desktop application
   headers may stick; narrow/tall headers flow normally and native modals may scroll.
6. **A launch receipt is not review completion (24; tasks 21/27.3).** Smoke behavior
   advanced development/delivery while an editor was still asynchronous and no HTML
   existed. The user required FINAL native handbacks, exact target/file verification
   and presentation before the next iteration; async resume receipts likewise do not
   allow parent exit. Native waits/notifications replace transcript-marker polling,
   sleeps or fictional synchronous flags. A later native attempt still failed at
   async resumption/parent exit, so 27.3 remains failed/open despite instruction and
   local-test improvements. Only ALL technical execution failures invoke the bounded
   repair/test exception; completed business assertion failure does not. No access,
   cost, approval or write safeguard is waived, and opener dispatch is not observation.
7. **Truthful progress and one normal renderer (25 → 26 → 27).** The user wanted
   immediate accessible motion and actual high-level activities, not fake percentages
   or ETAs. Instructions first defined it, then a packaged runtime/diff implemented
   it. The later ad-hoc limited-evidence white page was explicitly rejected: content
   is good enough after bounded work, so render the normal full UI. A separate
   conservative layout and public generation caveats are not supported alternatives.
   Brief handoffs, no duplicated summaries or unrelated cleanup, and one necessary
   user-owned choice at a time preserve that intent.
8. **Show material chronology and useful concerns (28 → 31).** Repeating the final
   document at earlier steps concealed what actually changed. Place each captured
   material state at its content/effect step, deduplicate only identical references,
   and never backfill missing history. The prototype's concern was also not an
   outcome enum or repeated source paragraph: explain the possible goal conflict,
   explain a supported human change in plain STE-style English, then queue the
   corresponding TECHNICAL Claude Code prompt. Separate authored fields preserve
   those roles; unknown causes/remedies stay unknown/disabled. Dismiss belongs inline
   beside the label, outside the summary, and changes visibility only. Uniform body
   text and actual-provider source buttons remove distracting technical presentation.
9. **Replace observation with application-owned evidence (30 → 32/34).** The user
   rejected the whole observer architecture and chose Guild session console evidence
   as a general build/debugging practice. An observer compensated for missing
   instrumentation while adding races, credential/scope and loop complexity; reads
   could miss overwritten intermediate states. Remove its runtime/bridge/tests and
   manual fallback, not historical captures. Build instructions instead require each
   request, actual acknowledgment and authorized exact readback/immutable material
   to be emitted before the next application-controlled edit. Retained SDK/envelopes
   support awaited `task.console.info` with `consoleTools`, not an assumption that
   plain `console.log` persists. Platform retention/truncation and LLM compliance
   remain unverified; postrun collection cannot invent missing versions.
10. **Fix delivery wiring from actual evidence (33; task 30).** Session `7e163dd8-…`
    opened static `begin` output, so later disk stage/ready writes could never update
    that tab. No CSS, bind denial or server failure was established. Finite foreground
    `start` obtains a bounded IPC listening receipt and returns the live URL to open,
    keeping one writer and parent cleanup through exact final navigation. This loading
    server is unrelated to the removed observer. The requested heading is “Generating
    test run timeline”; remove the static offline paragraph, not truthful live-loss
    messages. This fixes visibility/navigation, not measured native generation speed.
11. **Repair the missing predecessor, not green CSS (35; task 32).** Session
    `9d584e51-…` had 11 exact records and real newline/first-only/final readbacks.
    Rejecting valid body-free acknowledgments as `missing_gap` created sequence holes
    and correctly reset comparison continuity. Admit receipts without material or
    invented gaps, retain every marked record and keep actual missing/redacted states
    as continuity breaks. The provisional creation target is not an alias for the
    assigned document. Exact submillisecond ordering must not collapse into equality.
    The real empty newline stays an internal baseline, not an empty public card.
    Offline reassembly shows 1,389 first additions plus newline context, then 4,151
    SEC additions plus 1,390 context characters, with all seven originals unchanged;
    it is not new native generation or approval. See `docs/visualization-artifact-diff-rca.md`.
12. **Reduce overhead without reducing quality (36, concurrently with 35/37).**
    The historical 14m30s run exposed evidence preparation, authoring, two copy stages
    and facts as separate costs. The user requested all five helpers AND artifact
    correctness together, not deferred correctness or weaker reviewers. Source
    preflight addresses unsupported details such as the historical `maxDepth: 1`;
    deterministic packaging avoids bespoke metadata repair; lossless references keep
    meaning; real handback formats avoid serialization troubleshooting; precise
    navigation helps independent reads without replacing them. Duplicate JSON-key,
    memory-amplification and source-clock fixes preserve judgments and bounds. Local
    5.37%/25.08% packet reductions are not measured native time; 4–6 minutes remains
    an estimate from one defective historical run. See `docs/visualization-generation-performance.md`.
13. **Make the operation the story unit (38; task 35).** The user rejected a
    standalone “read document back” row whose diff belonged to the insertion, and
    clarified that validation must not resurface even as visible explanation. The
    cause was one occurrence per log stage, not missing evidence or an excuse to
    move later material onto an earlier instant. Group request/receipt/observation
    by declared stream and operation, retain an enclosing time interval and attach
    the supported artifact/diff to that action. The user also corrected blanket
    hiding of internal work: a process explicitly required by the original goal is
    eligible when actual evidence establishes it. Keep input selection, specified
    processing and material change distinct by purpose; reject service-specific
    pipelines, tool-name heuristics and specification pointers as execution proof.
    Missing or overlapping states remain uncertain rather than force a comparison.
14. **Validate the generation fix before the next presentation refinement.** The
    user authorized a fork at the genuine evidence-handoff boundary and a generation
    replay/validation loop without rerunning the application. The first replay
    completed generation but failed the feedback checks: the author treated structured
    logs as the only proof, omitted meaningful work that actual native query/process
    results supported, and exposed validation limitations in public prose. This is
    not missing evidence or permission to fabricate process-result logs. Corrective
    general collection/story guidance and public projection are now implemented and
    locally checked; another native replay remains pending, not verified.
    The next UI request separately asks clearer resource nouns/trailing external-link
    icons, changed-only paired diffs with
    expandable context, a link-style Dismiss, and removal of redundant prompt-heading
    text. It preserves source meaning, manual prompt behavior and counter/accessibility.
    Researching a genuine component is not adopting it. After a replay passes, the
    requested UI-only rerender uses that exact successful CLI input; it cannot fake
    a missing before side, reauthor source or convert historical reviews into new
    approval. No dependency choice or feedback-accepted final input is established yet.

### Implementation and acceptance limits

The requested **Add comment** wording remains an unmet request: current markup
uses visible **Comment** and accessible **Comment on step N**. This is not a
deliberate approved alternative or completed refinement. Retain it as a gap without
changing code or adding/closing task checkboxes in this documentation reconciliation.

Prior integrated evidence was 504 cases (502 pass, zero fail, two opt-in skips),
13 expected synthetic fixture outcomes/12 HTML files, exact retained-source diff
and ten document-scroll/header viewport cases. Section 35's current checkpoint is
509 cases (507 pass, zero fail, two opt-in skips), the same 13 expected fixture
outcomes and four scripted operation-story Chromium cases. All technical disclosures
and the copied prompt were checked for private validation leaks; source JSON/CRLF
bytes remained exact (DOM-only newline normalization is a checker detail). These
prove local contracts and presentation, not native compliance. Original reviews,
source files and failed native results remain.
The separately authorized earlier refresh contains 189 packaged files/61 changed,
with actual reload observed in Terminal 47698 (`ttys001`): one plugin, three skills,
nine agents and two MCP servers; conversation preserved and NO test started.
The refresh manifest is `reload-backup-generation-govyfk5u/refresh-manifest.json`
under the existing isolated root; it records file refresh, not itself native reload
observation. Neither this deployment nor local checks establishes new native
completion/render compliance, new application instrumentation compliance, replies
or user acceptance. Tasks 8.1, 18.5 and failed 27.3 stay open. Known tracked inference
was $40.6191975 before the replay below, excluding manual smokes/application charges.

#### Authorized generation replay: completed generation, failed feedback acceptance

The conversation subsequently authorizes replay from the exact evidence handoff of
session `9cfdeeb0-abda-4fd5-8904-d94d5eb82d6f`, not application execution. The retained
JSONL prefix is lines 1–547, preserved byte-for-byte, through tool-result UUID
`52c0721f-602e-4359-87ce-2653f17a75e0` at `2026-11-16T01:14:21.114Z`, before the
original editor dispatch at line 555. A fresh isolated 193-file plugin under
`.../opencode/operation-ui-replay-xh7yj1p4/plugin` and workspace
`.../opencode/claude-plugin-smoke-gu87lbe_/workspace/operation-ui-replay-7edxifpg`
leave the previously installed 189-file plugin and original claims unchanged.
These abbreviated paths use the approved temp base recorded in tasks.md.

The supplied historical evidence includes actual query/input and two child process
results, beyond structured console records. Twenty-four lossless source-event copies
and an index are evidence, not an authored timeline or reviewer judgment. The native
author may select ordinary actual-source-derived occurrences under existing bundle
semantics; missing historical record 1.1 `process_result` entries are NOT fabricated
to fit the grouped console path. Invalid historical structured URLs remain invalid,
and source facts, chronology and causation are not inferred from desired results.

The session-only documented `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=1800000` setting
keeps the foreground native completion owner waiting rather than allowing the former
continuous-idle exit with pending work. It is replay configuration, not a product
dispatcher, polling loop, unsupported tool flag or verified cure for task 27.3.
The parent-supplied `2026-11-16T02:33:31Z` checkpoint was still running; the later
automatic final receipt supersedes only that pending status. Replay session
`8cd7222b-0f91-407f-afab-acfcd5f9c77c` completed in **827,721 ms (13m47s)** for
**$7.4912581 incremental cost**, not a subtraction from inherited session totals.
All four native agents (one editor, two copy reviewers, one checker) completed under
the foreground owner; no async child was killed. Normal full snapshot 1.10 HTML was
produced at `run-progress-1JOZk3/completed-review.html` under the replay workspace
through actual assembly/preflight/two-copy/factual/finalization/render/ready stages
(ready sequence 5). No application call/rerun or MCP write occurred. Four denied
shell ls/grep/cp requests were not bypassed; documented Node alternatives were used.
The 193-file private plugin, source checkout, retained inputs, original prefix and
checkpoint were preserved; the installed 189-file plugin stayed unchanged.

**Feedback acceptance FAILED.** The four actual rows were the first query, creation,
first insertion and second insertion. Two genuinely evidenced specified-processing
steps and the independent second query were missing despite retained native fetch
and child-result evidence. Public supporting prose discussed non-admitted structured
records and missing process-result emission, exposing private validation. The cause
was treating structured logging as the ONLY source route, not lack of real evidence.
The first insertion had the real one-character baseline and 897-character result;
the later 5,565-character state honestly had no before because the invalid historical
query-bearing URL/sequence gap remained. That conservative gap is not the story
failure and must not be repaired by rewriting retained source.

Genuine second-copy `revise` feedback matched digest
`f5ce857c0c0e24803aca7dfe9eafacfb4408ccb191ea208c13f5a49799f43afb`.
The distinct factual checker reported genuine unavailable-read/tool/clock limitations;
its wire record omitted required `observed_at`, failed expansion with
`review_codec_keys` and was NOT attached. No timestamp or approval was fabricated;
optional quality not gating normal HTML worked as intended, not factual confirmation.
The final native handoff was also verbose rather than the requested concise handoff.
No opener was used or user presentation claimed. A generated file and completed
agents therefore establish generation completion only, not accepted story/privacy,
user acceptance, or closure of historical 27.3.

Following that failed attempt, the parent implemented corrective generic collection/
story guidance and a production-boundary regression. `operation-timeline.md` now
explicitly separates evidence routes from story eligibility: ordinary native source
responses/completed child results can support existing bundle 1.0 occurrences without
fabricating console 1.1 emissions. The collector completes native enrichment BEFORE
author handoff and pins the exact final bundle/projection hashes; the author cannot
rewrite the protected collector input. This adds no API, protocol or version.

An ordinary protected artifact can compare two actually captured states of the SAME
physical target with both exact sources and their uncertainty retained. The difference
does not establish immediate pre-write state, no intervening writer, or exclusive
causation. It cannot override projection 2.1 sequence-gap/overlap safeguards, admit an
invalid historical log, reconstruct a missing state or invent a console event.
Marked-console operations still require their existing strict stages/spec pointers.

Current snapshot 1.10 public projection additionally maps private proof-channel
coverage-gap metadata to generic human business uncertainty and omits WHOLE authored
supporting-detail paragraphs describing validation procedures. This acts on authored
metadata, not protected source/artifact strings, and is not a general text rewrite.
Projection 2.1's separate validation-envelope/artifact-dump boundary remains intact.
The sixth `operation-timeline.test.mjs` case uses actual-shaped SCRIPTED native output
with an explicit original specification, no console process log, ordinary source-bound
assembly and source immutability checks. All six focused cases passed per the parent's
verification; the earlier 509-case full-suite checkpoint is not silently restamped as
a newer full-suite run. This is local regression proof, not fresh native compliance.

Another replay within the standing user-authorized loop remains pending; no next
native attempt has run yet. No new run is launched here and no active output is inspected or
polled. Known tracked inference is now **$48.1104556**; this loop's prior $7.5930136
plus the new $7.4912581 is **$15.0842717** against its $100 authorization. These are
actual accounted amounts, not a hard billing guarantee or measured native speedup;
manual smokes/application charges remain excluded. The next outcome is unverified.

#### Historical requested presentation follow-up, before implementation

This is the then-pending checkpoint, not the current component/dependency inventory.
The first two native pages failed feedback checks. The third genuine native replay
subsequently passed the core checks; decisions 39–40 supersede the following pending
status while retaining its original rationale and constraints.

- Use resource-specific source nouns, including “Open page” for generic web content,
  and an external-link icon AFTER the text on every external anchor. Current generic
  artifact-kind fallback can say “Open document” for web pages; no universal trailing
  icon is implemented. Keep credential-free validated destinations and no-network UI.
- Show only changed regions by default for TRUE paired versions, with unchanged
  content expandable and complete exact versions recoverable. Current inert diff
  displays all context. The user requests a genuine existing compatible React diff
  component, not invented shadcn provenance. `react-diff-view` 3.3.3 (MIT) and
  `lucide-react` 1.73.0 (ISC) are research recommendations ONLY, not selected,
  installed or bundled dependencies. A single captured version is not a before/after
  pair. CSP, offline output, source bytes, bounds and accessibility remain constraints.
- Style Dismiss as a link-like button inline OUTSIDE the summary. Its existing
  memory-only visibility/focus/cart/evidence/reload semantics must not change.
- Remove only the duplicate visible `Claude Prompt · 0 items` heading, retaining the
  numeric count, real count-change animation, live accessible status and Review prompt.
  Current markup still contains that heading; removing all prompt state is not requested.

Implementation and the requested generation-script rerender are queued after the
corrective generation replay passes feedback validation. Rerender only the exact
last successful genuine CLI input; do not alter source/copy, restamp review authority, trigger application
execution or claim a feedback-accepted input exists before verification. The separate
Add comment wording gap and tasks 8.1/18.5/27.3 remain open. No new task frontier
or dependency installation is authorized by this planning reconciliation.

### Original numbered decision record

Read each decision in its then-current version/checkpoint context. In particular,
old one-copy/pass gates, public notices, footer/panel layouts and observer behavior
below are superseded as mapped above, not instructions to restore retired features.

1. **Separate collector, narrative author, copy editor, fact checker and renderer.** The parent collects a sanitized bundle at run review. The visualization subagent selects and writes the story, obtains feedback from a distinct copy editor, then sends the unchanged candidate to a distinct fact checker. Both reviews must match the final candidate before the new workflow renders it. The author owns revisions, but the current one-copy-review budget requires stopping if a revision would invalidate its sole pass. The copy editor reviews wording without source-system calls or writes. The fact checker makes its own authorized reads and records claim, source ID, observed time, finding and gap; it never writes. Bundle-only factual review is rejected because it cannot independently verify real-world effects. Synthetic source identity remains recorded internally. If reads fail, retain the gap and qualify or omit the claim rather than imply confirmation; a needed post-review text change cannot render under stale approval.

2. **Versioned boundary data, not trace replay.** Use the document's `VisualizationEvidenceBundle` as the semantic starting point: workflow intended effect; scenario and run identity; actor/session IDs and session levels; occurrences with outcome, time bounds, relevance, relationships and evidence/artifact references; evidence provenance/completeness/redactions; coverage and origin; logical presentation target and allowed actions. Define a versioned render snapshot containing selected story events, inline artifacts, explicit uncertainty/verification findings, origin, IDs and action intents. Preserve uncertain order and causes. The checker review must bind to the factual revision (e.g. a digest or equivalent comparison); nonfactual renderer repairs need not repeat it. The script validates structure and internal references, not whether claims are true.

3. **Reconcile the obsolete draft, do not implement it literally.** The generator draft's decision/tool-call event types conflict with the timeline selection rules; sensitive content hidden behind a toggle is not sanitization; required timestamps/status and single-agent assumptions can fabricate certainty; and `window.postMessage` is not a parent route. Replace or adapt those fields, maintain explicit source/verification provenance and gaps, permit unknown/partial states and multiple sessions, and represent allowed intents separately from execution. No backward compatibility is promised for the unimplemented draft.

4. **Deterministic local HTML with strict boundaries.** Package a local script with the visualization skill, accepting a snapshot file and returning machine-readable success with artifact path or structured errors including field paths and repair guidance. Render escaped text and safe links, disallow executable untrusted markup and external resource loading by default, and never include secrets in the snapshot or output. Use bounded repair/presentation attempts and preserve safe diagnostics. Explain this explicit local executable/file exception in README rather than changing the existing two skills' MCP-only claim silently. Runtime choice and packaging must be documented and checked in each supported host.

5. **Presentation is not transport.** Successful renderer output is opened in a sidebar only if a real host capability is verified; otherwise use an available browser presentation and return its path. An action contains intent plus snapshot/run/scenario/event identifiers; no button performs a golden-set or rerun mutation. Default to copy-to-chat in a terminal browser and wherever a parent-bound bridge is unverified. Only enable an automatic adapter after a real-host test proves it reaches the original parent after editor closure. MCP channels are only a documented research-preview candidate with enablement/allowlisting restrictions, not a dependency or evidence of implementation. Pure postMessage is insufficient. No specific sidebar API is assumed.

6. **Use native plugin evals and distinguish simulation from host evidence.** Use Claude Code's official case files, MCP mocks, graders, baseline comparison and reports for model-driven behavioral evaluations. Cover the 13 scenarios in the implementation document where the runner permits; deterministic unit tests remain for schema, repair, escaping and output. Do not build custom SDK sessions, PTY controllers, mock servers or report builders. The native runner disables the Artifact tool, so generated-file grading cannot establish artifact presentation or post-closure feedback delivery. Keep separate real-host acceptance procedures for those capabilities; mark untested combinations unsupported, not passed. Existing scripted replay cases are unit-coverage smoke tests, not proof of editor/checker instruction-following.

7. **Automatically review test results, not pending actions.** After the parent receives a test result, including an error or partial effects, it shows the actual outcome and initiates visualization without asking separately. It gathers only available authorized evidence, retains the exact tested version, workspace, profile and session, and discloses gaps. Pending waits and actionable requests still follow the existing wait and action rules; no new execution, resend, or external write is authorized merely to visualize. Preserve the distinct narrative author, planned read-only copy editor, independent read-only fact checker, deterministic renderer, presentation and parent feedback boundaries. If the host cannot perform a step, report the limitation rather than assert completion.

8. **Ship native roles and a supported independent reader.** Claude Code discovers the packaged `agents/scenario-run-editor.md` and `agents/scenario-run-checker.md`. The checker has only local Read and exact Guild session-read/GitHub file-read tools, not shell, writes, dispatch, or dynamic tool discovery; plugin `permissionMode` is not relied on. Declare GitHub's official read-only MCP endpoint restricted to `get_file_contents`, not a custom tracker service. For GitHub-backed records, read the authorized file at its supplied immutable commit SHA; stored history can support a before/after claim, but a current file alone cannot establish causation. Do not assume other trackers expose this source or that GitHub is authorized. Missing handles, history, authentication or access remain gaps. Native evals mock this connector and fictional business-record history independently of session logs; no real connector is contacted. Packaged deterministic file utilities may validate, hash and attach checker output, but never author stories, findings or source evidence.

9. **Implement the supplied comp, not a generic audit report.** Match its #191919 dark canvas, 864px content width, 14px system typography, restrained spacing, compact run header, connected vertical time rail, filled agent/hollow external event markers, sentence-led events and inline business artifacts. Put technical metadata and verification qualifications behind “Evidence and technical details”. Do not show “Synthetic data”, “Copy-to-parent intent only”, or standalone gap-impact notes. Below each event description and inline artifact, only “Possibly incorrect behavior” and “Evidence and technical details” accordions are allowed. The former represents actual failure/conflict, not every qualification; do not invent fixes. Unknown and bounded times remain explicit; terminal green requires a confirmed completed event, not simply the last position. Adapt the single supplied scenario without invented tabs, demo records, addresses, actor names or timestamps. The comp's golden button becomes an authorized copy-to-parent intent, never local approval persistence. Keep escaping, CSP, deterministic output, digest binding and new-file protections intact. Re-render the exact checked native snapshot without factual edits; compare reference and output in a local browser at desktop and mobile widths, test disclosures/copy fallback and record screenshots, errors and any acceptance blocker. Browser checks establish local rendering/interaction only, not parent-bound transport.

10. **Treat the corrected appearance as a baseline, not final acceptance.** The user reviewed the comp-aligned RN-42 visualization as much better but still needing refinement. Preserve that improvement and the completed technical checks without treating them as final design approval. Capture the remaining refinements with the user before implementing them; do not invent outstanding visual requirements. Submit the refined result for explicit user visual acceptance, separately from automated, local-browser and evidence-workflow checks.

11. **Separate collection metadata from the HTML input schema.** The evidence bundle stays 1.0, with internal source-origin and coverage metadata. The render snapshot is 1.1 and excludes coverage.data_origin, coverage.gaps[].impact, review.data_origin and review.checks[].data_origin. Retain source evidence, coverage descriptions and claim findings in technical detail. New candidates and checks use 1.1 before computing their digest. For the previously checked native 1.0 snapshot only, validate the complete original schema/digest before an internal display-only projection removes obsolete fields; never rewrite the input or restamp an old review as a checked 1.1 revision.

12. **Add a read-only copy editor with exclusive style routing and universal SDLC directives.** Package a distinct `scenario-run-copy-editor` agent with local Read only, not shell, writes, dispatch, dynamic tool discovery or external connectors. It reads the candidate, semantic context and versioned style references, then returns feedback to the narrative author in the same review pattern as the fact checker. It does not rewrite files, change claims, verify sources, run the renderer or approve application behavior. Select exactly one style guide for each reviewed passage based on what it describes, not its location in the interface. Never apply both guides to the same copy. Apply the SDLC-specific directives afterward in every route. Unclear routing requires clarification, not a combined style pass.

    - **ASD-STE100 route — purely technical application-internal processes:** use short, complete sentences, active voice where the actor is known, one idea per sentence, consistent terms and plain words. Aim for at most 20 words in instructions and 25 in descriptions; report justified exceptions when shorter wording would lose meaning. Preserve necessary modality. This route does not apply Economist rules. This is general adherence to the available rules, not certified compliance with ASD's unbundled dictionary.
    - **Economist route — effects on the world or human experience:** enforce clarity, precision, brevity, restrained tone, sentence-case headings and consistent spelling, punctuation and number conventions. Remove filler and stale metaphors. Ask for missing specifics rather than inventing them. This route does not apply ASD-STE100 rules or its sentence-length targets. Use the [unofficial reference plugin](https://github.com/TAJD/economist-style-guide-plugin/tree/cfb132d62447b959dea5a49940e28da89e1ba75b) as a pinned source, not a runtime dependency or an assertion of Economist endorsement.
    - **SDLC-specific rules — always, after the selected guide:** tell a goal-relevant story in complete actor/action/object sentences. Name the actual application and service boundary. Use supplied fully qualified names as inline-code names followed by “agent” or “workspace”; do not manufacture missing names. Each detail must explain an intended effect, observed result or consequential failure. Keep business artifacts visible and engineer-only evidence in technical details. Preserve the existing timeline inclusion rules and two permitted accordion labels; copy review adds no UI.

    Meaning and evidence are absolute constraints. Preserve actor attribution, negation, scope, quantities, timing, order, causation, status and confidence. Only state what actually happened: a request, acceptance, current state, completed effect and run completion are different facts. Do not delete a necessary qualifier to sound decisive. Do not rewrite captured messages, artifact payloads, quotations, identifiers, URLs or code. Review authored captions and surrounding narrative instead. If the meaning is unclear, return a blocker for the author/fact checker, not a guessed rewrite. SDLC-specific directives take priority over the selected style guide; record necessary exceptions. There is no precedence or fallback between ASD-STE100 and Economist because the routes are mutually exclusive.

    Return a structured copy-review record with reviewer identity, candidate digest, rule-source versions, reviewed field paths/exemptions, the selected guide and routing reason for each reviewed passage, verdict (`pass`, `revise` or `blocked`) and findings. In snapshot 1.3, passages and findings identify exact field text by `field_path` plus its UTF-8 SHA-256 `field_digest`, not repeated `original_text`. The input packet still contains all text and semantic context. Findings retain the selected guide or SDLC directive and rule, required/advisory severity, explanation, optional suggested replacement and semantic risk. Feedback must show that SDLC directives were applied after the selected guide, without applying the other guide. Suggestions are not applied automatically. A pass has no unresolved required issue, routing ambiguity or semantic blocker; it is not factual verification.

    Separate copy and factual reviews bind to one candidate-content digest. Exclude both review records and nonfactual display settings from that digest to avoid circularity. Any authored-text or other factual-content revision invalidates both reviews. Since only one copy invocation is allowed, a required revision after that invocation stops the workflow; neither restarting nor corrective feedback resets its budget. Nonfactual display-only repairs may reuse both matching reviews for at most three render attempts. Missing capability or exhausted budget returns explicit diagnostics, not invented approval. Historical snapshots retain their original contracts and hashes; validated 1.2 dual-review rendering does not upgrade whole-text feedback into compact 1.3 feedback or prove the new policy ran.

13. **Reduce review overhead without reducing review coverage.** Preflight the unreviewed candidate before dispatch. Give each reviewer one focused packet with the same candidate digest, its executable review-contract descriptor and versioned local references. The copy packet includes the complete authored/protected-field inventory and semantic evidence; the factual packet includes the exact candidate. Targeted candidate reads remain available when meaning is unclear. Neither packet classifies copy or replaces the fact checker's own source reads. Use concise complete feedback, not omitted findings or field coverage. When the native host explicitly supplies a task transcript path and agent identity, capture only that agent's completed final assistant review, validate it against the candidate and save the exact parsed record. Reject unfinished, mixed-identity, tool/source-text and stale responses; do not guess transcript paths or treat the supplied file as proof of dispatch. If the host does not expose a path, retain the full hand-back fallback rather than invent an adapter. Scope collection-time source descriptions to their stated time so a later read does not make them false; do not preclaim verification or hide contradictions. Both final reviews and the native timeout remain required; decision 15 supersedes the former multi-copy revision allowance. Local capture tests are not evidence of faster native completion.

14. **Prevent wire-format failures without repairing reviewers' judgments.** Review
packets spell out the runtime UTC timestamp format and exact field binding.
Historical 1.2 feedback requires whole-field original_text; 1.3 requires the
matching field digest. Factual hand-backs can be validated independently before
attachment; date-only observations and mismatched copy findings remain invalid. Timestamp
provenance must be real, with any paired-source capture-clock limitation disclosed,
not a padded date or borrowed lifecycle time. Authors preserve complete feedback
and stop on malformed copy feedback without a corrective second invocation; they never edit reviews.
Omission reasons explain selection rather than asserting unobserved absence of
effects or message delivery. Already accurate qualified prose need not change
merely to duplicate review metadata; real corrections invalidate both reviews and cannot bypass the one-copy budget.

15. **Implement the first speed package with one copy invocation.** A closed draft
1.0 contains model-authored event selection, prose, claims, omissions and optional
named context/caption overrides. `assemble.mjs` deterministically copies bundle
1.0 metadata, source IDs, times, outcomes, relationships and artifact payloads into
candidate 1.3. It validates every selection/omission and rejects dangling relations;
it neither chooses events nor invents prose, evidence, reviews or source reads.
Compact copy responses use field hashes while packets retain complete prose and
coverage. Author and copy-editor frontmatter default to `sonnet`; factual review
defaults to `opus`, with unchanged tools. Actual alias resolution, quality and
latency require native observation, not inference from frontmatter.

    The parent supplies a stable private copy-budget path for each visualization
invocation. Before dispatch, `claim-copy` exclusively creates its consumed marker;
resume, restart, failed dispatch, malformed response, `revise` and `blocked` cannot
reclaim it. Do not delete or replace the marker or choose another path. This local
guard is not a sandbox against an author with Write/Edit permissions; native
behavior still needs verification. Copy passes followed by a necessary factual or
wording correction stop without rendering. Display-only retries retain both exact
reviews and cannot obtain another copy review. Estimated 120–240 seconds versus
the measured prior 622 seconds is a planning estimate, not a measured speedup;
single-pass completion rate may decrease. No new paid replay is implied.

16. **Human-facing SDLC v2 and event-attached artifacts.** New candidate/render
input 1.4 uses `scenario-run-v2` copy directives. Say that the named agent started
and that the session ended, not “top-level Guild test session”. Describe a
successful post to a supplied #channel only when the effect is supported; request
acceptance alone cannot become success. Keep API `ok`, message IDs, connections
and session levels inside technical evidence. These human-facing jargon violations
are required SDLC findings. Exact source text and meaning stay protected.
The 1.4 schema rejects every artifact not referenced by a timeline event. Assembly
copies only selected-event attachments, while preserving the entire collection
bundle and source evidence; it does not invent an event to display a source card.
There is no detached-artifact section or additional render-input layout. Supporting
public-page captures are evidence, not offer cards below the timeline.

17. **Recognizable third-party effects, not a Slack-specific rule.** Attempt to
represent each effect in a form a human would recognize in the affected system:
messages, emails, tickets, calendar events, documents and spreadsheet changes are
examples. Choose the representation from captured system identity and content,
not a word in the narrative. Use only supported layouts and supplied metadata;
when a layout is unavailable, use a faithful readable neutral presentation and
keep the limitation in existing technical details. Examples are not declarations
of implemented adapters: Slack is currently the only specialized service layout.
Do not invent identity, branding, delivery/readership or new renderer fields, load
remote assets, or fetch extra evidence merely to imitate a service. Formatting
does not prove a completed effect or permit rewriting reviewed copy.

A small inert
Markdown subset renders headings, lists, emphasis, code and safe links after
escaping source HTML; it cannot load images, resolve mentions, embed services or
run scripts. A single sent artifact occupies full width without an “After” label.
A Slack-like channel/byline/body layout requires matching structured source
evidence for the message and Slack system boundary. Show supplied channel/sender/
UTC time only; missing identity uses a neutral placeholder, never an invented
person, avatar, reaction or read receipt. Keep the existing two technical/concern
accordions, CSP, private new-file output, one-copy budget and final dual binding.
Original 1.0–1.3 inputs validate against their original contracts/rule versions and
digests. Historical unattached artifacts may appear only inside existing technical
details, not as visible cards. Re-rendering the last checked 1.3 input changes
presentation only: its known metadata/copy errors remain and it gains no v2
editorial approval. This refinement does not authorize another paid evaluation.

18. **Figma feedback cart supersedes the old rail and single-copy control.** The
current reference is [the supplied Figma file](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=0-1),
read at default `26:24120`, comment `62:1506`, prompt review `51:1273` and failure
`54:2088`. Retain its dark palette, 264px review queue, flexible scenario panel,
step/status/comment rows, fixed prompt bar, 400px comment dialog and 1088px
two-column review dialog with narrow-screen stacking. This supersedes decision
9's 864px connected time rail and old golden/single-copy control, not its evidence,
escaping or uncertainty rules. Show only the actual supplied scenario, not the
Figma demo queue. Use system typography and accessible text controls instead of
new remote font/image dependencies; preserve `img-src 'none'`. Keep source-backed
inline artifacts and the two existing concern/evidence disclosures. A step is
visually passed only when its outcome and associated review findings confirm it.

The cart starts empty and exists only in page memory. Explicitly add a step
comment, a correct-result item or a supplied reviewed fix. Cancelled/unsaved
drafts are excluded. Deduplicate by snapshot/kind/action/event identity; editing
replaces in insertion order, removing excludes the item. Cart 1.0 validates all
snapshot/run/scenario/parent/action/event/digest bindings, 100 items maximum and
1–10,000 normalized characters per item. The same pure runtime builds preview
and copied text from included items plus recorded context/limitations; it adds
no model interpretation. The prompt states unspecified scope and execution not
performed. Clipboard failure selects a manual-copy fallback. Always instruct the
user to paste and submit in the original Claude chat; no host bridge, storage,
network, approval, rerun or external operation is added.

Current candidate 1.5 adds optional `timeline[].suggested_feedback` with allowed
issue action, text and nonempty valid evidence/claim references on failed/partial
events. The author supplies it before the sole copy review; assembly only copies
it. Copy inventory and the shared candidate digest cover it, and the independent
fact checker assesses grounding. Missing reviewed remedy means no fix button;
the renderer never invents one or copies the Figma demo failure. Both final
reviews, tool restrictions and the one-copy budget remain unchanged. Original
1.0–1.4 inputs validate against their own contracts and reviews without rewriting
source bytes, upgrading copy or fabricating fixes/approval. Local/browser checks
and historical presentation rerendering are not new native review, delivery or
user visual acceptance. Task 8.1 stays open.

19. **Allow two copy iterations, then display unresolved copy rather than fail.**
    This user-requested policy supersedes the one-copy budget/pass gate in decisions
    12/15/18, not their factual or safety boundaries. New candidate/snapshot 1.6
    retains draft/bundle 1.0, field-hash feedback, SDLC v2 and reviewer tool/models.
    Before each native dispatch, claim the same parent-supplied base path. Private
    exclusive immutable schema 1.1 claims at the base and `.iteration-2` record
    consumed=1/2, max=2 and candidate digest; no overwrite, refund, third call or
    reset across resumes. A first valid nonpass permits explicit author correction
    and a second whole-candidate review. Scripts never apply suggestions.

    After the second valid response, freeze and display that exact text even with
    required findings or verdict revise/blocked. Keep the real verdict, a brief
    scenario notice, actual findings in existing technical details and limitations
    in the composed prompt. Never fake a pass or polish again after iteration two.
    Malformed/stale/incomplete/non-independent records and factual checks remain
    blocking; necessary factual correction requires fresh reviews if one iteration
    remains, otherwise reports the blocker rather than render stale assertions.
    Attachment derives copy_review_iterations (1/2) from the latest matching claim;
    candidates omit it and factualDigest excludes it as orchestration metadata.
    Count 1 requires a genuine pass, count 2 permits a valid nonpass. Historical
    1.0–1.5 validate original contracts/digests, including their original pass gates;
    no migration/restamp. Three shared render attempts remain, not three copies.
    Local regression/browser checks do not authorize another billed eval or close 8.1.

20. **User comments and genuine bundled shadcn/ui, without weakening the artifact.**
    Read all ten threads on iteration page `70:1508`. Use locally owned official
    new-york Button/Card/Textarea source with React, Radix Slot, cva, clsx and
    tailwind-merge; compile Tailwind and bundle browser/static-server JavaScript
    during maintenance, shipping `ui/dist` so review generation needs no npm or
    network. Verify a locked reproducible build and copied dependency-free runtime.
    Retain native dialog shells, not a falsely labeled shadcn Dialog: browser
    modality/focus/Escape avoid Radix scroll-lock style injection under hash-only
    CSP. React text children and the existing pure cart runtime preserve escaping,
    identities, exact composition, no persistence and manual submission.

    Use visible outlined shadcn comment buttons with hover/focus/touch states.
    A confirmed recorded outcome may have a muted completion checkmark even when
    its findings are qualified; green terminal treatment still requires all
    associated findings confirmed. Keep qualification labels/findings intact.
    Remove the default metadata line and redundant guidance, retaining the
    metadata in existing technical evidence and the required unresolved-copy
    notice. The subtitle uses the reviewed workflow purpose. Future authors use
    existing context_copy overrides for short plain job names, a brief why,
    few-word scenario titles and two/three-sentence expected-human-outcome
    descriptions, routed to Economist then SDLC v2. Do not rewrite the exhausted
    checked source or restamp reviews. Naming a proposed display label is not
    inventing an official application identity.

    Correct-result feedback explicitly says whole scenario and identifies its
    inclusion-control preset origin; step feedback identifies its step. Mechanical
    CSS register motion follows count additions/removals only; reduced-motion
    disables it and a hidden live status reports the change. Add new screenshot
    references only, never replace annotated pixels. Replies must state implemented
    versus limited behavior, preserve threads and avoid user/native approval claims.
    If the connector lacks a supported reply operation, report that concrete
    capability blocker and keep exact thread-specific drafts, never claim posting.

21. **Versioned authored short headers, not source-spec shortening or guidance alone.**
    Snapshot/candidate 1.7 requires closed header_copy: application_name (1–2
    whitespace-separated words), workflow_purpose (<=120 Unicode code points AND
    16 words), scenario_name (<=6 words), nonempty starting_context/observed_result
    and nonempty claim_refs. Closed author draft 1.1 supplies these explicitly;
    assembly copies, never invents/truncates/normalizes them. The detailed original
    workflow/scenario fields remain unchanged; context_copy only overrides the
    existing run prose. Historical draft 1.0 still explicitly assembles 1.6 with
    its original overrides; new workflow/packet/claim admission requires 1.7.

    Enforce product budgets during assembly/preflight before either immutable copy
    claim is consumed. Description quality uses two/three-plain-sentence reviewer
    guidance, not punctuation counting. All five strings enter copyFields, both
    packets and both final reviews; all header fields/references enter the same
    candidate digest. Packets expose executable header schema, product policy 1.0,
    claim context and full original specs. Keep SDLC v2 unchanged; add current-only
    rule_versions.header_copy "1.0" and header_copy/HEADER-1..HEADER-5 findings.
    Headers require Economist or unresolved/blocked, never ASD/exemption. Numeric
    checks/reference validity do not prove grounding; the factual checker must
    independently assess every header assertion and preserve uncertainty, failed
    outcomes, source scope and alias-versus-official identity.

    Header, queue, browser title and feedback context use exact short reviewed
    fields. New description combines starting context/result without Expected:;
    full original workflow/scenario context remains in existing evidence details
    and deterministic manual prompt. Historical 1.0–1.6 retain original validation,
    text and fallback without policy migration or review restamping. Preserve two
    copy iterations, real second-nonpass findings and all stale/malformed/factual,
    offline shadcn/hash-CSP/private-no-overwrite/manual-only gates. Test real DOM
    values and long-copy preclaim rejection, not just instruction keywords.
    The user authorized one later mocked native attempt after local checks; no
    native result, fresh preview, reply posting or user acceptance is implied by
    implementation. Keep 8.1 open and 18.5 blocked pending supported reply capability.

22. **General scenario description; generation internals are never public.**
    User corrections supersede decision 21's two-component run description and
    decisions 19/21's public copy-limit warning. New draft 1.2/snapshot 1.8 requires
    scenario_description and description_claim_refs instead of starting_context/
    observed_result. Brief GENERAL PRESENT-TENSE setup/task/intended behavior,
    ONE concise sentence preferred (two only if necessary), <=200 code points AND
    30 words under product policy 1.1. Outcomes/status stay in run/timeline. Keep
    old 1.7 contracts/words/reviews intact, never reinterpret historical documents.

    An explicitly authorized description-only refresh uses the exact completed
    reviewed 1.7 snapshot and matching fact packet. One exclusive immutable claim
    permits ONE author callback returning only the closed description payload.
    Invalid/failed generation stops without retries. Strictly cache every other
    authored/business field, source/artifact byte and reference; only new schema/
    authorship identity and description differ. Genuine full matching checks must
    bind the new candidate, with historical passage provenance disclosed privately.
    Do not reauthor unrelated copy, reset historical budgets or restamp digests.

    PUBLIC HARD INVARIANT: no generation-review machinery in UI, technical/source
    disclosures, dialogs, cart or copied prompt. Strip review records/checks,
    role/model IDs, rule versions, iteration counts/verdicts, editorial findings,
    candidate/schema/digests and nonapproval notices from public serialization.
    Hidden binding data may retain identities/digest strictly needed for safe cart
    validation. Keep private genuine records and all stale/role/source/factual/
    second-nonpass gates intact. Show business outcomes and human source uncertainty,
    not reviewer prose or raw claim-status/checker dumps. Source artifacts remain
    verbatim. Business Review queue/Review prompt controls remain.

23. **Historical, superseded by 37: sticky scenario header belongs to the scenario scroll panel.**
    Layout uses bounded viewport height, fixed-size workflow/cart rows and a
    min-height:0 independently scrolling scenario panel. Its title/description/
    correct-feedback header sticks at that panel's top with an opaque background
    and contained stacking, not at the viewport/workflow top. Timeline scrolls
    beneath; panel clipping ends containment before the cart. Keyboard focus is
    kept below the measured header without inline-style/CSP changes. Verify real
    geometry on desktop and 390px mobile/reduced height, plus disclosures, focus,
    cart/dialog/footer reachability and no horizontal overflow. New screenshots
    use the one-shot cached-copy candidate only; an actual local browser recording
    demonstrates normal-motion count additions/removals, no fabricated animation,
    source write, clipboard action or extra generation. Keep reduced-motion support.

24. **Eligible review blocks iteration through matching HTML presentation.**
    A shared completion.md protocol applies to development, parent, editor and
    host presentation. A host may dispatch asynchronously; retain its ID and
    await native completion notification/supported blocking wait, never fabricate
    a synchronous flag or poll files/transcript end_turn markers/shell sleeps.
    Await each complete copy response and validate/save it before factual dispatch;
    await factual completion before attach/render. Preserve two-copy, factual,
    stale-review and private-generation gates. The parent waits for the editor's
    final hand-back, checks the real reviewed file and rendered HTML against pinned
    AND current workspace/profile/scenario/versions/run IDs, and coordinates one
    capable opener attempt plus a direct artifact link in the original chat.
    Neither an async receipt nor a candidate means HTML exists. Observe presentation
    or obtain user confirmation; otherwise report the precise blocker and safe
    link if any, then pause for a post-report user decision. No auto-advance,
    delivery, next version/test or old artifact substitution. Explicit cancellation
    or supersession keeps late output historical and consumed claims unchanged.
    Before automatic dispatch, exempt a current batch only if ALL scenarios ended
    in technical errors and NONE completed without an execution error. Report errors
    in chat and continue only the already-authorized bounded repair/test loop until
    ANY scenario completes without an execution error; then review that eligible
    run even when business assertions fail. Pending/action-required/missing/unknown
    states are not proof of the exception. Access, billing, user approval, partial
    effects and external-write safeguards remain; this is no unbounded retry grant.
    This is an instruction protocol, not an enforceable new dispatcher or evidence
    of native compliance. Local regression checks require no model/eval calls and
    do not update the already-running isolated plugin snapshot or establish 8.1.

25. **Group smoke feedback into reusable skill policies, not test-case patches.**
    The new Notion smoke notes and eight threads on Figma page `115:2440` are
    grouped in `docs/visualization-smoke-feedback.md`. Separate delegated owners
    update delivery/progress, conversation and narrative/evidence definitions.
    This round changes instructions and local instruction tests, not renderer,
    schema, UI bundle, source evidence or running terminal contents.

    Open a current-run progress page at eligible generation start, before lengthy
    work. Show truthful coarse human activities, engaging accessible motion and
    no fabricated percentages or private review mechanics. Browser-local progress
    status updates do not authorize assistant task/transcript polling. Define
    capability-aware, narrowly scoped local delivery, not a fictional packaged
    server/helper. Final offline HTML retains its security policy and exact-run
    binding; progress is not completed review or permission to advance iteration.

    Historical instruction-only policy formerly directed a separate conservative
    page. Decision 27 removes that policy entirely: use the normal full packaged
    renderer after bounded quality work. Never fabricate approval, restamp old
    reviews or spend another model invocation merely to escape a budget. Retain
    genuine records privately. Unavailable evidence stays unknown in business
    terms. Real authorization/access/host failures remain honest boundaries;
    neither an impossible opener nor absent evidence permits a false success.
    Preserve the all-technical-failure exception and application write safeguards.

    Chat is plain and brief: necessary high-level waiting, then a truthful UI
    handoff and manual prompt paste-back instruction. No generation diagnostics,
    duplicated run summary, cleanup digression or reviewer-choice question.
    Ask at most one necessary user-owned question, using supported choices when
    available; do not conceal a real cost/access/permission decision.

    Select observed goal-relevant interactions with external sources, including
    reads/selections integral to the application's task, across domains. Exclude
    internal reasoning and housekeeping; never invent an omitted action. Place
    artifacts of every type at the meaningful content/effect step without repeating
    identical payloads at creation/return/lifecycle steps. Preserve distinct
    material versions, relevant before/after changes and original source records.
    When both content versions are supplied, use a diff-style green/red change
    view with non-color addition/removal markers. Do not invent a missing version
    or change the source bytes to manufacture a comparison.
    Default steps use number/time/icon/brief business prose, not repeated
    qualification labels or irrelevant return/test plumbing. Necessary uncertainty
    and consequential mismatches remain understandable. Define explicit Add comment
    controls and safe source-service links with honest truncation wording, without
    claiming current renderer controls have already changed.

    Local checks establish instruction packaging/consistency and existing runtime
    regressions, not native compliance, a working progress server/diff widget,
    fresh screenshots, comment replies or visual acceptance. No paid eval or
    automatic reload follows.

26. **Implement the defined loading page and content diff.** Ship a dependency-free
    local progress helper instead of asking each invocation to invent a server.
    Keep initial static HTML usable before long work; optional loopback serving
    exposes only invocation-specific progress/status/final routes, with strict
    Host/Origin/method/path checks and hash CSP. Updates are explicit truthful
    stage transitions, not simulated clocks or assistant polling. Private target
    bindings, monotonic state and terminal/supersession guards prevent late output
    from navigating a newer review. A ready checked file must match the supplied
    validated snapshot and deterministic renderer; it remains independently usable
    after the temporary server exits. Static-only hosts retain honest limitations.

    Artifact comparisons use only explicit before/after text already bound to the
    checked snapshot. A bounded line-sequence comparison keeps unchanged context,
    red removals and green additions with semantic del/ins and visible non-color
    markers. Large unrelated middles become a complete replacement rather than
    unbounded quadratic work or truncation. Preserve exact source versions and
    order; never infer a baseline, readback or missing side. Identical versions
    show one body, and single captured versions keep their existing presentation.
    No runtime dependency/build change or generation metadata enters the final UI.

    Local HTTP/CLI/browser and synthetic source checks establish implemented
    behavior, not native model compliance or final visual acceptance. No paid eval,
    application/source write, existing screenshot replacement or automatic plugin
    reload is included. Earlier instruction-only records remain historical.

27. **Good enough means normal rendering, not another UI.** Closed draft 1.3
    deterministically assembles source-bound candidate/snapshot 1.9 with the exact
    sanitized bundle privately embedded as source_bundle. Runtime validates source
    bundle and content shape, references, immutable source fields, selected/omitted
    accounting, header budgets, credential safety and attached payload bytes.
    This binding is not authentication of the collector or semantic proof of prose.

    Separate editorial review quality from render admission. Optional genuine copy/
    factual JSON records remain private diagnostics. Individual validators still
    reject malformed, incomplete, stale or non-independent records; only valid
    matching records may contribute evidence status or source qualifications.
    Invalid/missing feedback is not approval and must never become a fabricated
    pass, source read, timestamp or matching digest. Content changes invalidate old
    approval authority without blocking source-bound rendering. Known factual
    errors receive source-grounded correction/qualification, not unsupported success.

    Retain TWO immutable copy dispatch claims across resumes and at most THREE
    shared render attempts. After first feedback, bounded author correction may use
    the second copy. After second feedback (including malformed/out-of-inventory
    feedback), freeze copy and attempt the distinct factual stage sequentially.
    Permit one necessary source-grounded factual qualification; no third copy or
    dispatch merely for serialization. A pending launch receipt still requires
    native completion; actual failure/missing response is private diagnostics.

    Once quality work ends, the content is good enough. Finalize and render the
    normal full offline React/shadcn UI with cart/dialogs/diff/sticky header and
    hash-only CSP. No limited-evidence mode, handcrafted fallback, alternate layout
    or public reviewer/generation caveat. Progress ready validates exact snapshot,
    source/content/safety, run identity and deterministic renderer bytes without a
    fake pass. Real structural/safety/access/write/host restrictions remain.
    Preserve historical 1.0–1.8 contracts and review bindings read-only. No force
    downgrade, stale binding treated valid, source mutation or native eval change.

28. **Temporal artifacts and concern interaction are evidence-driven, not domain-specific.**
    Address the six comments on Figma node `126:2446` in concurrent non-overlapping
    implementation waves, followed by integration and independent checks. Preserve
    each meaningful captured artifact version at the step that produced it and
    compare a later supported change with its preceding supported state. A final
    combined body cannot stand in for an earlier version. Target identity, source
    ordering, write-operation semantics and request-versus-readback distinctions
    determine whether a version can be shown; missing history does not justify an
    inferred baseline, guessed append result or altered source bundle. The rule
    applies to all supported artifact types, not a specific document or study.

    Match the referenced prototype's concern structure: “Claude’s concern”, a
    concise grounded explanation of the problem and its consequence, then a
    suggested fix only when actually supported. An outcome enum alone is not
    explanatory content. External-service failure is not itself proof of an agent
    defect, and a repeat trigger alone is not proof of a duplicate effect. Preserve
    unknown causes. Keep the current fix-to-prompt cart rather than restoring the
    prototype's copy-only action. Dismiss hides only that concern in memory, keeps
    evidence/events and existing cart items intact, returns focus sensibly and
    resets on reload; it is neither approval nor a source write.

    Narrative descriptions share one text colour regardless of outcome; icons and
    explicit semantic status retain honest distinctions. Actual safe source links
    use artifact/provider-specific button labels without invented destinations or
    claims of complete content. Preserve private generation diagnostics, the one
    normal full UI, source/safety gates, offline CSP and manual feedback submission.

29. **Recover discovery separately from execution and presentation.**
    The retained smoke response at session `b6290c45-5f20-45a4-8662-558940a23551`
    line 484 claimed a missing review tool without attempting the visualization
    workflow. Its model-visible skill listing had been replaced with two built-ins,
    while the CLI still reported three loaded plugin skills and exposed native
    Skill/Agent/Read/Write/Bash schemas. This establishes stale discovery context
    and an unsupported diagnosis, not the upstream cache implementation or a real
    renderer/permission failure.

    Use the current listing when it names the skill; otherwise read installed
    instructions via the host-provided known base path. Do not guess cache paths
    or invoke unlisted skills. Native dispatch types, deferred MCP tools and
    message-recipient discovery are different capabilities. Use actual schemas,
    retain a distinct author and reviewer allowlists, and establish Node/file
    permission from actual authorized results rather than tool presence alone.
    Missing or invalid optional feedback still leads to the same source-bound
    normal renderer, not an alternate UI or invented approval. A failed opener
    does not erase a saved HTML file. Keep concrete diagnostics private and report
    only an essential demonstrated blocker with the usable artifact if one exists.
    This instruction recovery neither repairs upstream caches nor authorizes a
    reload, model probe, permission expansion, scenario rerun or service write.

### Decision 30 (historical, removed by decision 32): Read-only source observer

The following records the former design and evidence only. Its runtime, bridge,
dedicated tests and supported manual path are removed; do not implement or run it.

The pull-only Guild connector has no advertised event subscription. A bounded
incremental source-event reader is therefore distinct from the prohibited agent
loop polling native task completion. `capture-live.mjs` schedules source reads;
the original `guild_wait_for_session` remains the only run-completion owner.
`capture-host.mjs` dispatches only four explicit read callbacks: pinned session
identity, incremental events, Google Docs read execution, and the same durable
read task's wait. The host owns existing authentication; the Node observer never
loads credentials, invents a remote endpoint or requests arbitrary tools.

Before sending input, bind the exact workspace/profile/version/session and await
the observer's armed barrier. Material write receipts trigger reads without
pausing or changing the application. Persist immutable source responses, real
read start/end, document/revision identity, extracted text and redactions. A read
that ends after the next same-document mutation is not an earlier intermediate
state. Only an actually captured predecessor supplies a comparison baseline;
unknown states remain gaps. Write-to-observation intervals remain bounded times,
not backdated exact write/readback times or independent causal proof.

The invocation-private loopback bridge has fixed capability routes, strict
Host/Origin/method/body bounds, one outstanding job and finite time/storage/call
limits. Persist durable read receipts before waiting; repeat only that wait after
a disconnect, never an uncertain execution. Native completion seals a final event
read and drains captures; stop only the owned observer. The first host adapter is
Google Docs, not a claim of generic service observation. Local tests establish
protocol behavior; only the separately authorized live fork establishes actual
source chronology. Do not repeat a test to force a desired coin-flip outcome.

### 31. Separate concern meaning, human remedies and technical prompt payloads

The annotated review feedback replaces repeated event/source paragraphs with one
authored explanation of how an event may conflict with the application goal.
Draft 1.4 and snapshot 1.10 add source/claim-bound `concern.explanation` and a
separate `suggested_feedback.explanation` for the human remedy. Existing
`suggested_feedback.text` remains the exact technical Claude Code prompt. All
three fields are inventoried for review and bound by the content digest. Original
draft 1.3/snapshot 1.9 contracts remain intact and are not upgraded in place.

Human remedy instructions use short active sentences, one instruction per
sentence, no semicolons and the requested STE route. Prefer elements already
introduced on the review page. The technical prompt describes the same supported
change with implementation details and checks. Only that prompt enters the cart.
An unsupported remedy stays absent and its action disabled; neither unknown causes
nor technical machinery are invented to fill the panel. Optional reviewer
judgments remain private diagnostics, never permission to render the normal UI.

The disclosure shows “Claude’s concern”, “Suggested fix” and “Add suggested fix to
prompt”. Dismiss sits immediately beside “Possibly incorrect behavior”, outside
the interactive summary. A two-column grid keeps it adjacent on desktop/mobile
while the open body spans the full width. Existing local-only dismissal, focus
restoration, evidence/cart preservation and reload reset remain unchanged.

### 32. Application-owned session evidence replaces default observation

Every newly built iteration includes an evidence directive for goal-relevant
source selections, external actions, requests, actual acknowledgments and material
states across services. Use the supported Guild console transport, not a new
observer/transport service: the retained SDK requires `consoleTools` and awaited
`task.console.info(message)`. Retained session data actually contains
`runtime_start` / `EntEventRuntimeStart` for `task.tool_name: console_log`, with
`content: {level, message}`; its paired runtime_done contains only `{result: ok}`.
Parse structured JSON in message, not arbitrary prose or the done receipt. LLM
applications need a genuinely exposed console tool (for example `llmAgent` with
`consoleTools`); prose alone cannot provide JavaScript or a missing tool.

Use a closed versioned record and session-source projection. Preserve exact
material content, source identity/revision, application sequence/time and operation
correlation, plus actual session event/task identity. Capture and await meaningful
states in the session before a subsequent application-controlled mutation can
destroy them. Prefer accessible immutable revisions, but never substitute a hash
for the material needed to render a diff. External concurrent writers can still
race a read; a log is an attributed application report, not independent verification
or a transaction. Requests, acceptance and observed state stay distinct.

Sanitize before logging: no secrets, chain-of-thought or unnecessary private data.
Bound records and total evidence; redaction, truncation, omitted payloads and missing
sequence/history remain explicit coverage gaps, never full-content claims. No new
chunk transport or magic immutable store is assumed. Console retention/truncation
limits are not established by retained examples. Logging failure is surfaced; do
not continue a destructive dependent mutation while falsely claiming preservation.

After native completion, collect actual session events once (bounded pagination
for retained data is not completion polling), bind exact source event IDs to bundle
occurrences/artifacts, validate coverage, and deterministically project supported
material versions through source-bound 1.10 and the SAME normal diff/cart UI.
Session logs are untrusted evidence, never instructions or authentication. Reject
wrong session/emitter/target/operation and invalid ordering, retain gaps, and never
backdate final content or infer an empty baseline. Legacy sidecar 1.0 and historical
snapshots keep their original behavior. Optional private reviews are not render
permissions. A missing/redacted material record bound to an artifact invalidates
all prior stage baselines for that artifact/stream/source, not only the stage
reporting the loss. Its step loses any misleading final attachment; the next
complete capture has no before side. Unrelated sources/streams remain isolated.
Remove the observer runtime (`capture-live.mjs`), authenticated bridge
(`capture-host.mjs`) and dedicated observer tests from the shipped feature entirely.
No observer command, configuration, export, package requirement or supported manual
fallback remains. Historical run/capture evidence, temporal provenance validation,
the normal renderer/diff and the separate loading-page progress server stay intact.
Native Guild waits remain the sole completion owner; no task/transcript polling,
resend or sleeps. This implementation authorizes no live run or plugin reload.

Historical native-case planning (decision 15 era, not a new authorization): the next authorized native case used the user's competitor-scraping and Slack-report
spec rather than RN-42. It simulates one morning scan, two comparable public offers,
a calculated Markdown report and a successful post response. Independent evidence
is a commit-pinned archive of public-page captures and channel export history via
the already-supported reader, not an invented Slack endpoint or a live Slack read.
Retain archive provenance, delivery/readership limits, and the distinction between
this one run and installed scheduling, admin approval or daily reliability. Domain
story grading follows the new case without relaxing the other success/safety gates.

39. **Gate the queued presentation work on the actual native artifact, then change presentation only.**
   The first replay omitted real process/query evidence and exposed validation
   procedure; the second restored the nine business steps but omitted the actual
   empty-to-first-content comparison. The initial state existed in captured source:
   bundle 1.0 rejects whitespace-only authored `before`, whereas existing captured-
   field projection 1.0 preserves that exact state as a protected version. The third
   genuine replay used that supported source path and completed with two actual
   action diffs, distinct requested processes and private validation. Source checks
   and actual browser checks, not exit status or a manually authored replacement,
   established this functional prerequisite. Historical failed 27.3 remains open.

   The four subsequent UX requests are now implemented. Provider/route-specific
   nouns and bundled Lucide `ExternalLink` icons follow external anchor text.
   `react-diff-view` 3.3.3 (MIT), composed with the owned shadcn Card, supplies real
   Diff/Hunk/Decoration components; Lucide React 1.73.0 is ISC. Exact pins, lockfile
   and complete notices accompany the offline bundle. This is not a claimed
   official shadcn diff component. Changed groups are visible by default; native
   accessible disclosures retain ALL unchanged rows. Single snapshots do not gain
   a fabricated before; source bounds, UTF-16/CRLF/empty/final-newline fidelity,
   semantic additions/removals and forced-color markers remain. Dynamic-style
   alternatives, workers, remote resources and unsafe-inline/eval are rejected.

   Dismiss is a link-style real button adjacent to, but outside, the summary, with
   unchanged local visibility/focus/cart/evidence/reload behavior. The redundant
   visible prompt heading is removed, not its count, animation, live status or
   Review prompt control. Production rendering from the exact successful native
   snapshot changes only HTML/CSS/JS presentation. Original input, authored copy,
   digest, judgments and native HTML remain immutable. Twenty-one independent
   browser checks do not constitute user acceptance or a fresh native review.

40. **Keep the successful replay as a fictional, fully mocked regression case.**
   `evals/visualize-scenario-run/operation-timeline-replay` preserves the causal
   regression without publishing private transcripts, identities, source documents,
   authored timelines or approvals. Fixtures contain only synthetic specifications,
   actual-shaped source events, two explicit child-process results and three
   material states, including an actual empty representation. Missing structured
   process logs must not hide genuine native process evidence. Case-local mocks
   prevent real service use and guard against restarting/resending the completed
   application input. The ordinary normal renderer and source bindings remain.

   A scoped scaffold supplies raw source fixtures and a deterministic production-
   renderer verifier. Command witnesses, report checks and a short public-story
   grader test seven distinct semantic units, exact source pairs and action
   placement, private validation and manual prompt controls. Local positive and
   negative tests check the fixture/scaffold/verifier; an agent-visible verifier
   is not a tamper-proof security boundary or independent live verification.
   Existing cases/graders remain unchanged. No billed native run of the new case
   occurred, and none is authorized merely by adding the case. Current local
   totals are 523 cases, 521 pass, zero fail and two opt-in skips, plus 13 expected
   synthetic outcomes. The three authorized native replay costs remain separately
   recorded; no time-saving or universal compliance claim follows from them.

## Risks / Trade-offs

- [Source access or history missing] → Preserve gaps and distinguish current state from causal history; never repeat a write.
- [Subagent/renderer host capabilities vary] → Gate on demonstrated support and report failures; fallback copy is explicit, not automatic.
- [Unsafe evidence or hostile HTML] → Sanitize before handoff/snapshot, escape at render, validate links and avoid executable source content.
- [Concurrent edits] → Rebase changes against current `agent-development` and README content, preserve unrelated work, and review overlapping PR #15/#19 changes before implementation.
- [Bounded retries exhaust] → Return structured diagnostics and useful safe artifact or path; never claim presentation succeeded.

## Migration Plan

### 33. Finite live startup fixes the actual static-file wiring failure

Retained session `7e163dd8-e5f2-46d6-aba6-6ded349906fc` opened the file from
`begin` (main transcript 365–371), never called `serve`, then handed stage writing
to the editor (546). Actual checking/polishing/ready writes succeeded (editor
64–68, 144–151); the final manifest is ready at sequence 5, with no server marker.
The file tab has script/connect-src none, so these disk replacements could not
update it or navigate it. The background Bash schema existed (main 23/47/82),
but file opening did not wire it; no actual bind denial, live CSP failure or
server timeout is established. Parent opened the durable final file separately
(586–587), without observation proof. This is delivery wiring, not artifact capture.

`progress.mjs start OUTDIR TARGET` writes initial static output and forks only the
packaged server with ignored stdio, detached lifetime and Node IPC. Its foreground
caller returns once the child has listened (bounded ten-second startup), with
`live:true,url`; otherwise it retains static output and an honest private diagnostic.
The parent opens that returned URL before long work. No log polling, shell
detachment or native model/task polling is needed. Existing `begin`/`serve` remain
low-level commands. No host adapter/browser API or permission is presumed.

One parent/editor writer uses the same binding and next successful sequence;
reviewers never write progress. Only real authoring/checking/text correction emits
those activities. Parent cleanup ownership survives the editor and keeps the server
through exact ready navigation/presentation and durable link handoff, then retires
the invocation. Strict three-route/Host/Origin/CSP/private-file/identity/source and
exact normal-renderer-byte validation is unchanged. No observer, alternate final
UI, fake review pass, source write or native completion signal is introduced.

### 34. Build instructions explicitly preserve EACH artifact edit

Application build/main instructions and artifact-capture.md require each artifact
edit across types, not final-only logging: await actual source readback and emission
of its exact resulting material or verified accessible immutable revision before
the next application-controlled edit. Empty creation is a baseline only when
actually observed; request/acknowledgment is not observed readback. Inaccessible,
missing, redacted or raced states remain gaps, never earlier copies of final state
or permission to widen source access. This is instruction-only, not a parser,
assembly or artifact-runtime change, and does not authorize a live rerun or reload.

### 35. Content-free acknowledgments preserve sequence, not material state

The linked run is session `9d584e51-ca23-40a5-b977-3b0df2e8d7c1`, not the
previous session in decision 33. Its matching retired progress manifest binds the
exact final HTML and snapshot hashes. Actual readbacks preserve a blank paragraph
(`\n`), first-only content and later combined content. No artifact has a before
side, so the normal renderer correctly emits no diff markup. CSS is not the cause.

The producer emits metadata-only acknowledgments with empty redactions/gaps.
The collector incorrectly rejects these receipts with `missing_gap`. The bundle
also drops the valid creation request. Sequence holes at 1/2/6/10 then invalidate
the observed-version comparison epochs. The stage key correctly prevents request
fragments from becoming observed baselines. It must remain separate.

A metadata-only acknowledgment needs no invented material gap. Keep its actual
status and envelope in the collected sequence, without generating an artifact or
claiming readback. Other incomplete stages still require explicit omissions.
Actual receipt redactions/gaps remain diagnostics. Builders and collectors retain
every marked stream record, including title-only creation requests with no artifact
binding. A pre-creation placeholder cannot satisfy the ordinary exact-target rule.
Optional `unresolved_target:true` on a non-artifact mutation_requested binding
retains that exact source and records uncertainty. It requires the same service
but a different target, with normal session/emitter/time/evidence checks. It
supplies no content, operation-source alias or baseline and breaks stream continuity.
Later actual readbacks establish new baselines. A matching target, acknowledgment
or observed-state binding cannot use that option. Missing/invalid records still
break continuity. Never normalize the blank
paragraph to an invented empty string, merge stages or disable sequence checks.

Existing bundles, logs, sidecars and snapshots remain immutable. Re-rendering the
unchanged original snapshot cannot recover missing predecessors. A local proof may
collect the exact retained envelopes into NEW derived evidence and assemble NEW
normal output. Label that output as an offline retained-source reproduction, not
a new generation, native run or approval. Legacy projection 1.0 is unchanged.

### 36. Optimize evidence and review transport without reducing review quality

The five historical-overhead recommendations and the artifact repair were implemented
in the same concurrent wave. Separate file ownership prevented conflicting edits;
it did not postpone correctness until after performance work. A second integration
wave wired the new modules into real packaged commands and role instructions and
checked their combined contracts. Historical estimates remain unmeasured until a
separately authorized native comparison exercises the completed package.

Private deterministic preflight checks authored implementation details against
their actual cited source context before EACH current copy claim, with the complete
candidate bound to the separately retained original collector bundle. A stale report
fails claim admission; unresolved quality does not gate claims or normal rendering.
`onSourceGrounding` is an optional local author-owner notification; `copyCheck`
receives only the candidate, never private preflight assistance. Literal presence is not
semantic truth, absence is not proof of falsehood, and automated checks do not
apply edits, issue approval or replace either independent reviewer. Existing
copy/factual ordering, two immutable copy claims, three render attempts and
Sonnet/Opus role choices remain unchanged.

Post-run packaging consumes completed application-emitted session evidence and
explicit original scenario/target/emitter metadata and a per-executed-operation
coverage checklist, not aggregate final-only coverage. It emits bundle 1.0 and
projection 2.0 for legacy input 1.0; decision 38's current opt-in input 1.1 emits
projection 2.1 instead. Both preserve exact source records, every
marked stream record, versions, qualifications and operation ordering through
the existing source-bound projection. It does not collect sources, infer missing
state, replace author selection or resurrect the removed observer architecture.

Review compaction uses strict versioned references to immutable candidate-bound
inventories and repeated source context. Deterministic expansion must recover
the original full packet or review before existing validators run. All prose,
protected fields, style routes, rules, exemptions, findings, semantic risks,
source checks and real timestamps remain available. Expansion may substitute
identities and paths from an exact manifest, never author a missing judgment or
repair a stale review. `inspect.mjs packet-copy`/`packet-fact` default to readable
compact packets; explicit `*-full` commands retain original full compatibility.
Strict duplicate-key rejection and cumulative bounded-memory/work checks prevent
discarded judgments or amplified intermediate payloads, without silent truncation.
The compact wire format is private, not public UI copy.

Native capture recognizes the observed async launch plus `SubagentHandback` and
successful turn-ending receipt using exact supplied agent/dispatch/parent/candidate
correlation; the strict legacy assistant `end_turn` format remains separate. A launch receipt, progress update, earlier
response, nested tool/source payload or guessed transcript path is insufficient.
Capture preserves the genuine complete response; it does not authenticate an
arbitrary file merely because its contents resemble a host record. Formatting
problems must not consume another reviewer invocation. Unsupported formats keep
the complete genuine Write handback fallback and original diagnostics; no guessed
paths, repeated capture on unchanged input or judgment/clock repair is permitted.

The factual packet supplies an event/source/claim index and only supported read
navigation. The checker still makes its own authorized source calls and reports
truncation, unreachable history, unavailable tools and missing real read clocks.
Guild `from_id` means AFTER, not older-event pagination. Real UTC observation clocks
come from actual supported reads, not cached capture or event time. Unreachable
history or missing read clocks remain limitations, including in genuine retained
fact handbacks. Cached evidence and the index are not independent source verification. No new
pagination parameters, permissions, task polling, model downgrade, external
write, approval token or alternate rendering mode is introduced.

### 37. Header prompt state and one document scroll surface

The current user request supersedes the fixed bottom prompt footer and bounded
scenario scroll panel in earlier visual decisions. Put the included-item count
and review control in the upper-right application header. Use the existing
feedback language and accessible controls, not shopping terminology or basket,
checkout or other ecommerce imagery. Remove the footer's fixed overlay and
reserved vertical padding so the timeline has more useful space.

The document viewport owns ordinary timeline scrolling. The scenario, queue and
surrounding page must not retain wheel-trapping bounded vertical scroll panels.
Wheel input over any ordinary page region advances the same document when it
can scroll. Native modal dialogs and textareas retain their necessary accessible
scroll behavior. Responsive sticky positioning may keep useful header controls
available, but cannot obscure focused controls, source content or the review
dialogs, especially on narrow and short viewports.

The implementation makes the application header sticky only above 600px width,
when measured height is at most 160px AND one quarter of the viewport. Narrow/tall
headers use normal document flow; the scenario heading is not sticky. Names and
source content wrap, and measured focus correction prevents covered controls.
Default rows show step, actual time/range and status icon, not generic “Recorded”,
“completed”, “bounded” or repeated qualification labels. Source facts/uncertainty
remain in prose and technical details; this is not deletion of real run status.
See `docs/header-prompt-layout.md` and the combined proof paths in tasks 32–34.

This is a presentation change, not a change to feedback meaning or authorization.
Preserve item identities, exact technical fix payloads, draft cancellation,
edit/remove/deduplication, manual copy/paste, local Dismiss and reduced-motion
behavior. All source binding, generation privacy, source-backed diff, optional
private review and strict CSP rules remain intact. Local browser tests demonstrate
layout and input behavior, not native model compliance or user acceptance.

### 38. Tell the goal-relevant operation story, not its validation procedure

The latest feedback rejected standalone technical validation events, not the
underlying evidence or artifact differences. The user explicitly clarified that
validation must not reappear as an explanation in another row, source disclosure,
dialog or copied prompt. The user also required these rules to be general, not a
list of services or a named transformation from one example.

Classify a declared operation by purpose: a goal-relevant source interaction or
change, an internal process explicitly required by the original specification and
established by actual evidence, or private supporting work. Keep distinct input,
specified-process and material-change purposes separate. A write is not necessary
for a meaningful source interaction, and internal execution alone is not grounds
to hide a process the user explicitly asked the application to perform. Conversely,
housekeeping, repeated diagnostic reads and implementation-only validation are not
the user's story. A specification pointer resolves provenance, not semantic truth.

Opt-in postrun input 1.1 and projection 2.1 group every actual stage sharing the
declared stream/operation into one source-bound occurrence. Preserve all original
records privately, actual enclosing time bounds and request/receipt/state
distinctions. Only the supported resulting material supplies the action's artifact
or diff. Do not display request fragments as stored state or promote validation to
another event. Supporting occurrences are rejected if an author or manually built
snapshot tries to select them. Current draft 1.4/snapshot 1.10 and original input
1.0/projection 2.0 remain closed under their existing shapes.

Optional console record 1.1 adds `process_result`, not a new service/logging API.
In the grouped console path, a `specified_process` needs its own declared operation,
`workflow_relevance.basis: user_supplied`, nonempty unique original-specification
references and an actual record/checklist `process_result`. Allowed pointers are
`/workflow/intended_world_effect`, `/scenario/trigger`, `/scenario/initial_conditions`
and `/scenario/expected_outcome`; referenced text must exist and be nonempty. A
process cannot also contain the material mutation: declare the change separately.
Pointer resolution proves neither semantic relevance nor execution. Ordinary retained
source evidence may support a separately authored process under existing bundle
rules without pretending it is a new structured console record. Missing historical process
records stay missing; do not invent a selection, transformation, exact time or
causal relationship to fill a requested story. Future builders emit supported
query-free canonical source URLs, with authorized sanitized request parameters in
material rather than unsafe URLs; invalid historical records remain invalid.

Missing material breaks continuity. Overlapping operations on the same physical
target cannot safely assign a shared state to one action: omit ambiguous material
and retain uncertainty rather than weaken chronology, invent a baseline or imply
causation, including operations in different streams on the same physical target.
At most one actual observed result belongs to an operation; multiple observations
are ambiguous, not permission to choose a convenient one. Nonmutation source selection
may own meaningful material; request fragments/receipts do not. A specified-process
step does not force a duplicate artifact card. Real empty baselines remain internal. The normal accessible green/red
diff, exact source content, human business uncertainty, native waiting, independent
read permissions, private optional quality feedback and strict CSP remain intact.
For projection 2.1, the public serializer omits validation envelopes and duplicate
artifact dumps rather than moving them into an accordion. It shows only meaningful
source/process material and business uncertainty; generated checklist/collection-gap
mechanics stay private, with original detailed source-bound gaps unchanged. This is
a deliberate projection, not blanket word censorship or protected artifact rewriting;
legacy 2.0 serialization is not silently migrated. Local regression/browser proof is not native application
instrumentation or authoring compliance, a new review, approval or user acceptance.

Introduce new skill assets and tests, and invoke the run-review entry point automatically after test results without changing Guild execution or release behavior. Update documentation to distinguish supported hosts and local execution. Disable the new review entry point or remove its packaged assets to roll back; do not migrate historical data or remove user evidence.
