## Context

The existing Guild agent-development skill uses hosted Guild tools. The visualization adds an explicit local renderer exception to the existing skills' MCP-only workflow. Behavioral evaluation uses Claude Code's native `claude plugin eval` runner, not a custom SDK or interactive-terminal harness. See `proposal.md` for motivation and the capability spec for behavior.

The working design's top sequence and input bundle are authoritative: [implementation document](https://app.notion.com/p/415c3e1ce8dc816ca4afce26a6729fd8). Its later sequence and rules supersede the early generator TypeScript draft. [Product architecture](https://app.notion.com/p/414c3e1ce8dc80018091f454f386979b) supplies the broader teaching context, not a mandate to implement the whole ADLC lifecycle here.

The visual reference is that page's attached [`agentic-sdlc-timeline.html` comp](https://app.notion.com/p/414c3e1ce8dc80018091f454f386979b#5610bca3053d479789a97b074ac9a9e9). Its appearance guides implementation; the newer implementation document still controls timeline inclusion and evidence semantics. The native 7/7 evidence-workflow pass did not test visual fidelity.

## Goals / Non-Goals

**Goals:** Define a bounded vertical slice from supplied run evidence to verified, readable HTML and honest feedback handoff; make unavailable verification and host support observable.

**Non-Goals:** Running or emulating application tests, live eval/profile infrastructure, scenario management, comparison, golden-set writes, rerun execution, a general-purpose bridge, or claims of support for unverified hosts. No actual workflow execution is required to implement fixture-based tests.

## Decisions

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

23. **Sticky scenario header belongs to the scenario scroll panel.**
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

## Risks / Trade-offs

The next authorized native case uses the user's competitor-scraping and Slack-report
spec rather than RN-42. It simulates one morning scan, two comparable public offers,
a calculated Markdown report and a successful post response. Independent evidence
is a commit-pinned archive of public-page captures and channel export history via
the already-supported reader, not an invented Slack endpoint or a live Slack read.
Retain archive provenance, delivery/readership limits, and the distinction between
this one run and installed scheduling, admin approval or daily reliability. Domain
story grading follows the new case without relaxing the other success/safety gates.

- [Source access or history missing] → Preserve gaps and distinguish current state from causal history; never repeat a write.
- [Subagent/renderer host capabilities vary] → Gate on demonstrated support and report failures; fallback copy is explicit, not automatic.
- [Unsafe evidence or hostile HTML] → Sanitize before handoff/snapshot, escape at render, validate links and avoid executable source content.
- [Concurrent edits] → Rebase changes against current `agent-development` and README content, preserve unrelated work, and review overlapping PR #15/#19 changes before implementation.
- [Bounded retries exhaust] → Return structured diagnostics and useful safe artifact or path; never claim presentation succeeded.

## Migration Plan

Introduce new skill assets and tests, and invoke the run-review entry point automatically after test results without changing Guild execution or release behavior. Update documentation to distinguish supported hosts and local execution. Disable the new review entry point or remove its packaged assets to roll back; do not migrate historical data or remove user evidence.
