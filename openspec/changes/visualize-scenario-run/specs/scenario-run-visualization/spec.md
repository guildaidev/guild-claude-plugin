## Purpose

Let a user review a scenario run as an evidence-grounded narrative of consequential effects, and provide feedback to the parent conversation without obscuring uncertainty.

## ADDED Requirements

### Requirement: Automatically initiate review after test results
After an agent-development test returns results, the parent SHALL show the actual output or error and automatically initiate the visualization workflow without a separate user request or confirmation. This applies to partial results and failures as well as success. The parent SHALL retain the exact tested version, workspace, profile and session, sanitize available evidence, and identify missing evidence. It SHALL NOT rerun the application, resend input, or perform an external write merely to visualize. Pending waits and required actions SHALL continue to follow their existing handling. Missing narrative-author, copy-editor, independent read-only factual verification, renderer or presentation capabilities SHALL be reported honestly rather than claimed as completed.

#### Scenario: Results include partial effects or failure
- **WHEN** the test returns an error or partial result with available evidence
- **THEN** the parent reports the observed outcome and initiates review without another visualization request, preserving confirmed effects and evidence gaps without repeating the run or writes.

#### Scenario: Test is still waiting for an action
- **WHEN** the test is pending or requires an action rather than returning results
- **THEN** the parent follows the existing wait and action handling rather than triggering another execution or claiming a completed review.

### Requirement: Evidence handoff preserves review context
The parent SHALL provide the visualization editor a sanitized evidence bundle identifying the workflow goal, scenario, run and versions, actors, workspace sessions, candidate occurrences, source evidence, artifacts, observation coverage and gaps, data origin, and logical parent feedback target and allowed intents. Execution method SHALL be opaque to visualization. Unknown session level SHALL NOT be treated as top-level.

#### Scenario: Incomplete evidence
- **WHEN** source coverage or session level is unknown
- **THEN** the editor retains the gap and does not invent coverage or a top-level session.

### Requirement: Timeline selects relevant consequential events
The editor SHALL select starts and terminations of top-level workspace sessions, world-affecting workspace-agent actions, and direct or nth-order external-system actions relevant to the stated workflow goal. Internal reasoning, reads, tool plumbing and child lifecycle SHALL be supporting details only. The story SHALL use complete sentences, identify actors and service boundaries, show relevant artifacts inline and make technical details expandable.

#### Scenario: Relevant effect triggers a second session
- **WHEN** an agent action is supported as causing a goal-relevant second-order external event that starts a second top-level session
- **THEN** the timeline includes both sessions and the supported chain, excluding unrelated effects and child plumbing.

#### Scenario: Relevant omission among noise
- **WHEN** the evidence includes a goal-relevant downstream effect among unrelated changes and internal activity
- **THEN** the editor includes the relevant effect and excludes the noise from the main timeline.

### Requirement: Assemble a candidate without regenerating source metadata
The narrative author SHALL submit a closed draft containing its selected occurrence IDs, prose, claims, omission reasons and optional named context/caption overrides or source-grounded suggested feedback. A deterministic packaged assembler SHALL validate evidence bundle 1.0 and the draft, then produce candidate 1.6 by copying source metadata, identifiers, times, outcomes, relationships and selected-event artifact payloads unchanged. Only artifacts referenced by selected timeline events SHALL enter HTML input; supporting source artifacts SHALL remain in the unmodified collection bundle/evidence. It SHALL NOT select events, author narrative, verify claims or create reviews. Every unselected occurrence SHALL have an explicit omission reason; unknown IDs, duplicate/overlapping selections, unaccounted omissions and relations to omitted events SHALL be rejected rather than silently rewritten. The assembler SHALL preserve attributed gaps, including references to accounted-for omitted occurrences.

#### Scenario: A draft attempts to overwrite source fields
- **WHEN** a draft supplies an undeclared metadata override or references an occurrence absent from the bundle
- **THEN** assembly rejects it without changing source data or writing a candidate; valid drafts produce a private new file without overwriting inputs or creating approval.

### Requirement: Independently review copy without changing meaning
A distinct read-only copy-editor agent SHALL route each reviewed passage to exactly one style guide: ASD-STE100 for purely technical explanations of processes internal to the application, or Economist for effects of the application on the world or human experience. It SHALL NOT apply both guides to the same copy, combine their rules or use the other guide as a fallback. Routing SHALL follow the described content rather than its location in the interface. It SHALL apply SDLC-specific directives afterward in every route. It SHALL return structured feedback to the narrative author, not modify the snapshot or source systems. Feedback SHALL identify the reviewed revision, reviewer, rule sources, reviewed fields and selected guide with a routing reason for each passage. In contract 1.3, passages and findings SHALL identify exact field text through field_path and its UTF-8 SHA-256 field_digest instead of repeating original_text. Complete prose and semantic context SHALL remain in the input packet; hashes SHALL NOT substitute for reading text, coverage or semantic review. Findings SHALL retain selected guide or SDLC directive/rule, required/advisory severity, reason, semantic risk and an optional suggested replacement. The review SHALL distinguish pass, required revision and blocked review, and show final SDLC review. Style approval SHALL NOT count as factual confirmation or user acceptance.

The copy editor SHALL preserve semantic meaning, including actors, service boundaries, negation, scope, quantities, timing, order, causation, status and uncertainty. It SHALL NOT turn a request, accepted operation or current-state observation into a completed effect. It SHALL NOT invent names, numbers, causes or evidence, remove a necessary qualification, or rewrite verbatim source artifacts, quotations, identifiers, URLs or code. It SHALL flag ambiguous meaning or routing rather than guess. Meaning and evidence SHALL override all style preferences; SDLC-specific rules SHALL override the selected guide. There SHALL be no stacked-guide precedence between ASD-STE100 and Economist. Necessary exceptions SHALL be explained, not silently applied. Compliance SHALL be described as general adherence to available rules, not certified ASD dictionary compliance or Economist endorsement.

SDLC copy SHALL use short, complete sentences naming the actual actor, service and relevant action or outcome. Supplied fully qualified names SHALL be formatted as inline-code names followed by “agent” or “workspace”; absent names SHALL NOT be manufactured. Each displayed detail SHALL contribute to understanding the workflow goal or result. Business artifacts SHALL remain visible, engineer-only details SHALL remain expandable, and copy review SHALL NOT change timeline inclusion or add UI.

Current 1.6 copy review SHALL record SDLC directives `scenario-run-v2`. Human-facing lifecycle copy SHALL say that the named agent started and that the session ended, not narrate a “top-level Guild test session”. Supported successful posting SHALL describe the human outcome and supplied #channel, not API `ok`, message timestamps, connection plumbing or channel IDs. Request-only evidence SHALL NOT become a successful post, and an unobserved trigger SHALL NOT be asserted. Unnecessary technical jargon in human-facing events SHALL remain a required SDLC finding even on iteration two, not be softened to obtain a pass. Internal technical explanations still use their exclusive ASD route; world/human copy uses Economist, with SDLC afterward in either case.

#### Scenario: Human-facing session and Slack outcome
- **WHEN** selected lifecycle and posting events have supported outcomes
- **THEN** copy uses short business-facing sentences such as “The `market-monitor` agent started.”, a supported successful post to #rental-market-intel, and “The session ended.” Technical protocol fields remain in the existing disclosure; the reviewer does not simplify an unconfirmed request into success.

#### Scenario: Purely technical internal explanation
- **WHEN** authored copy explains a highly technical process internal to the application
- **THEN** the copy editor selects ASD-STE100 only, records the routing reason and applicable findings, then applies SDLC-specific directives without applying Economist rules or editing the candidate.

#### Scenario: Application effect or human experience
- **WHEN** authored copy describes an application effect on the world or human experience, including in a technical disclosure
- **THEN** the copy editor selects Economist only, records the routing reason and applicable findings, then applies SDLC-specific directives without applying ASD-STE100 rules or sentence-length targets.

#### Scenario: Universal SDLC directives and unclear routing
- **WHEN** either style route produces feedback or the route cannot be established safely
- **THEN** SDLC-specific directives still apply, any routing ambiguity is reported for clarification, and the review does not claim a pass by applying both guides or changing semantic meaning.

#### Scenario: A shorter sentence would invent an outcome
- **WHEN** evidence says the agent asked Slack to post but proposed wording says Slack posted
- **THEN** copy review rejects the semantic change and preserves the supported request; removing a hedge or adding missing specifics SHALL NOT be used to manufacture certainty.

#### Scenario: Exact source content or unknown identity
- **WHEN** a displayed artifact contains an original message or the candidate lacks a fully qualified actor name
- **THEN** the copy editor preserves the verbatim source and identifiers, reviews only authored surrounding prose, and flags missing identity context without inventing a name.

#### Scenario: Review cannot establish safe wording
- **WHEN** meaning is ambiguous, a required rule source is unavailable or the copy-editor capability is missing
- **THEN** the workflow reports the specific blocker or coverage gap rather than claiming a completed copy review or guessing a rewrite.

### Requirement: Bind both reviews to the final candidate
The narrative author SHALL obtain copy review before factual verification of the same unchanged candidate and retain both separate records. Each visualization SHALL permit at most TWO copy dispatches, including failed, corrective, resumed or restarted calls. The parent SHALL supply one stable base budget path; exclusive append-only claims at that path and its `.iteration-2` companion SHALL consume iterations before dispatch even if dispatch fails. Neither claim SHALL be overwritten or reset. A third claim SHALL refuse dispatch. After a valid first revise/blocked review the author MAY explicitly revise and obtain the second full review. After the second valid response the workflow SHALL display that exact text despite unresolved copy issues, retaining genuine findings and verdict rather than fabricating a pass. Malformed, incomplete, stale or non-independent records SHALL still fail validation. Snapshot 1.6 SHALL record copy_review_iterations (1 or 2) from the latest matching claim; this orchestration metadata SHALL be excluded from the candidate digest. Count 1 SHALL require a copy pass; count 2 SHALL permit valid pass/revise/blocked feedback. A matching factual review SHALL remain mandatory. Any candidate change SHALL invalidate both reviews; necessary factual correction MAY use the remaining iteration and fresh factual checks but SHALL NOT render stale assertions after exhaustion. Only nonfactual display repairs SHALL reuse matching reviews within three render attempts. Historical contracts SHALL retain their original pass gates and hashes without restamping.

#### Scenario: Fact checking requires another revision
- **WHEN** a copy-reviewed candidate is changed after fact-check feedback
- **THEN** both reviews are stale; if one copy iteration remains, explicit correction gets fresh copy and factual reviews. After two, necessary factual correction stops rather than render unsupported text; neither reviewer edits or restamps the snapshot.

#### Scenario: Copy-only rewrite after factual verification
- **WHEN** the author changes wording after a factual review
- **THEN** both earlier reviews are stale and cannot authorize rendering of the new wording; the spent copy budget cannot reset by resuming, restarting or using another path.

#### Scenario: Unchanged display repair or historical re-render
- **WHEN** only a nonfactual display setting changes or a historical snapshot is re-rendered through its validated compatibility path
- **THEN** unchanged matching reviews may be reused for at most three display-only renders, while historical rendering validates original contracts and hashes without upgrading its old review record or claiming the new two-review policy ran.

#### Scenario: Focused review handoff and exact native feedback capture
- **WHEN** reviewers receive a focused packet or the host exposes a completed native task transcript
- **THEN** complete copy coverage, semantic evidence, versioned rules and the exact factual candidate remain available; factual reviewers still make their own authorized reads. Feedback capture validates the explicitly identified agent's final response and candidate digest without authoring, restamping or substituting earlier/tool/source output. Missing native-path support uses the ordinary hand-back fallback, and unfinished or stale feedback cannot authorize rendering.

#### Scenario: Later source read does not invalidate a historical collection statement
- **WHEN** a candidate accurately describes evidence available at collection time and a checker later reads a source
- **THEN** the historical statement retains its stated scope rather than claiming nobody has read the source. Necessary corrections invalidate both reviews and need fresh checks within the remaining second iteration; collection scoping cannot hide a contradiction or preclaim verification.

#### Scenario: Malformed reviewer response cannot be repaired by the author
- **WHEN** a factual hand-back has a date-only observation timestamp or a compact copy finding has an incorrect field digest
- **THEN** validation rejects the response before attachment without changing timestamps or digests. Malformed copy feedback is not the valid second nonpass allowed for display; dispatch consumption is never refunded. Source-clock limitations remain explicit; missing clock support is not invented. Omission explanations describe selection rather than unobserved effects or delivery. Validated legacy 1.2 feedback still requires its original whole-field text.

#### Scenario: Second copy review still requests changes
- **WHEN** two copy dispatches are consumed and the second complete matching response has required findings or verdict revise/blocked
- **THEN** the exact reviewed text proceeds to factual checking and rendering, with genuine verdict/findings retained privately, no third copy dispatch, no further copy edits and no fabricated approval. Current public UI, evidence and copied prompt SHALL NOT expose the review process, its notices or findings; source uncertainty remains human-readable.

#### Scenario: Faster models are role defaults rather than verified performance
- **WHEN** the packaged author and copy editor declare model sonnet and the factual checker declares model opus
- **THEN** their tool boundaries and final-review requirements remain unchanged, and runtime alias resolution, actual model usage, quality and latency require observation rather than a guaranteed speed claim or implicit permission for a billed eval.

### Requirement: Independently verify real-world claims
A distinct fact-check agent SHALL independently make authorized read-only source calls for proposed claims of real-world effects; it SHALL NOT repeat writes or trigger the workflow. It SHALL record claim-level findings, source identifiers, observation times and gaps, and distinguish observed, synthetic and mixed data. Required content correction SHALL invalidate both reviews and require fresh reviews within the two-copy budget; exhaustion SHALL NOT authorize stale assertions. Unavailable or conflicting evidence SHALL remain recorded, not silently resolved. The relaxed second-copy verdict gate SHALL NOT waive factual checks.

#### Scenario: Editorial correction
- **WHEN** independent verification disproves or qualifies a proposed claim
- **THEN** the editor explicitly corrects and obtains fresh reviews if an iteration remains, otherwise reports the factual blocker without rendering a contradicted story or automatically resetting review.

#### Scenario: Contradiction or inaccessible source
- **WHEN** independent evidence conflicts with the bundle or a source read is unavailable
- **THEN** the output explicitly preserves the conflict or verification gap rather than claiming confirmation.

#### Scenario: Present state without historical causation
- **WHEN** an independent read only establishes that a record exists now
- **THEN** the story does not claim the run created it or establish when it did so without historical support.

#### Scenario: Native checker reads a GitHub-backed historical record
- **WHEN** an authorized GitHub-backed business record has a supplied repository, path and immutable commit SHA
- **THEN** a distinct checker restricted to local Read, Guild session reads and GitHub file reads makes its own session and file calls, checks the stored historical record rather than copying session evidence, and retains synthetic-origin, access and causality limits. Missing source access is not bypassed by expanding tools or inventing an adapter.

### Requirement: Represent outcome and uncertainty truthfully
The story SHALL distinguish attempts from completed effects, retain confirmed effects alongside failures, and avoid unsupported timestamps, ordering, causation, and overall success. Inferences SHALL be identified as such and supported artifacts and evidence SHALL remain attributable.

#### Scenario: Attempt versus effect
- **WHEN** the evidence only confirms acceptance of a request
- **THEN** the narrative does not claim delivery or completed change.

#### Scenario: Partial failure and ambiguous order
- **WHEN** some effects succeed and other steps fail or their order is unknown
- **THEN** the story reports each supported outcome and leaves the unknown order or cause explicit.

### Requirement: Validate and safely render the checked snapshot
A deterministic packaged renderer SHALL accept a sanitized render snapshot, validate its schema and references, and return either actionable structured errors or a successful HTML artifact path. It SHALL escape untrusted source text and safely handle URLs and embedded content; secrets SHALL be removed before snapshots rather than hidden behind a control. It SHALL NOT collect evidence, fact-check, author the narrative or perform feedback actions. Content changes SHALL invalidate both reviews and need fresh reviews within the two-copy budget; final rendered content SHALL match the candidate assessed by both reviewers. Valid unresolved second-copy feedback alone SHALL NOT prevent rendering.

#### Scenario: Invalid snapshot is repaired
- **WHEN** validation rejects a snapshot
- **THEN** display-only repair may reuse matching reviews within the render bound; content repair needs fresh reviews within the remaining budget. Malformed feedback cannot be replaced with invented approval.

#### Scenario: Render failure
- **WHEN** rendering cannot succeed within bounded retries
- **THEN** the parent receives an honest failure and references to useful safe output, without a claimed successful artifact.

### Requirement: Follow the supplied visual comp
The HTML SHALL follow the newer supplied Figma file `7yXu0y0ZfzZl7wfkXGP6oC` (default `26:24120`, comment `62:1506`, prompt review `51:1273`, failure `54:2088`) as its current visual reference, superseding the earlier attached connected time rail: restrained dark canvas, compact workflow header, single-scenario review queue, flexible scenario panel, step/status/comment rows, inline business artifacts, fixed prompt cart and comment/review dialogs. Narrow layouts SHALL stack without horizontal overflow. Technical metadata SHALL NOT dominate the default story. Below event descriptions and inline artifacts, only “Possibly incorrect behavior” and “Evidence and technical details” accordions SHALL appear. Origin labels, standalone copy-intent disclaimers and qualification/coverage notes SHALL NOT appear; the prompt dialogs SHALL explain manual submission and non-execution. Verification qualifications SHALL remain available inside technical details; actual failure/partial outcome or conflict SHALL use “Possibly incorrect behavior”. A passed marker SHALL require a confirmed outcome and confirmed associated review findings. Unknown or bounded times SHALL NOT be converted into exact times. Only supplied scenario data and authorized intents SHALL be shown; prototype demo data, fake tabs, golden persistence and invented fixes SHALL NOT be imported. System fonts and accessible text controls MAY replace reference-only images while retaining the strict no-image/no-network policy. Visual acceptance SHALL be assessed separately from model-driven evidence evaluation.

The user's absolute privacy rule supersedes the former copy-limit-notice exception: generation review records, counts/verdicts, identities, pipeline findings and notices SHALL remain private even after a valid second nonpass. Public technical/source details and composed/copied prompts SHALL contain business/source context and human uncertainty, not generation machinery. Internal gates and genuine records are unchanged.

#### Scenario: HTML input excludes discarded presentation metadata
- **WHEN** an editor prepares a new render snapshot
- **THEN** its current 1.6 schema continues the exclusions introduced in 1.1: coverage.data_origin, coverage.gaps[].impact, review.data_origin and review.checks[].data_origin. Source evidence, coverage descriptions and checker findings remain attributable in technical details. The internal bundle is unchanged. Checked 1.0/1.1/1.2/1.3/1.4/1.5 inputs can be re-rendered only after original contract/rule-version/digest validation, without source mutation, editorial upgrade or restamping.

#### Scenario: Header and timeline exclude detached source cards
- **WHEN** new HTML input includes an artifact that no timeline event references
- **THEN** schema validation rejects it before review or rendering. The page has a header and timeline with event-attached business artifacts, not a detached artifact section. Supporting public-offer captures remain evidence; historical unattached artifacts may appear only inside existing technical disclosures.

#### Scenario: Recognizable effects across third-party systems
- **WHEN** a selected event contains a captured effect in a third-party system
- **THEN** the skill attempts a representation a human would recognize in that system, such as a message, email, ticket, calendar event, document or spreadsheet change. The choice uses captured system identity/content and supported renderer capabilities, not invented metadata, adapters or new schema fields. Slack is one example, not the scope of this rule. If a familiar layout is unavailable, a faithful readable neutral artifact remains inline with the event and its limitation stays inside existing technical details. No fabricated people, branding, reactions, read receipts, remote assets or additional visible cards are introduced; recognizable formatting does not prove execution or change reviewed source content.

#### Scenario: Captured Markdown Slack message
- **WHEN** a selected event contains a captured Markdown message and matching structured Slack source metadata
- **THEN** the renderer displays a full-width Slack-like message with inert formatted text and supplied channel/byline/time, without an “After” label, raw Markdown markers, invented people/avatars or read receipts. Raw HTML, images and active embeds remain disabled, and the original checked message bytes and review digests do not change. Missing service metadata uses neutral presentation rather than invented identity.

#### Scenario: Re-render an independently checked run
- **WHEN** the renderer's presentation changes without factual snapshot changes
- **THEN** the exact checked snapshot retains its factual digest and findings, and its HTML follows the comp without adding claims or actions.

#### Scenario: Desktop and narrow viewport review
- **WHEN** the reference and rendered run are checked in a local browser at desktop and mobile widths
- **THEN** the step narrative, inline artifacts and cart dialogs remain readable without horizontal overflow, disclosures are operable, copied prompts retain their included-item identities, and screenshots and browser errors or unavailable-check limitations are recorded without claiming automatic transport.

#### Scenario: User requests further visual refinement
- **WHEN** local visual checks pass but the user identifies the visualization as improved and still needing refinement
- **THEN** the corrected visualization remains an improved baseline, not a final accepted design; the remaining refinements SHALL be captured with the user, implemented and submitted for user review. Passing automated or local browser checks SHALL NOT substitute for final user visual acceptance.

### Requirement: Apply user refinements through a genuine offline component build
The UI SHALL use locally owned genuine shadcn/ui React Button, Card and Textarea
components, including compiled utility styling and bundled dependencies. Rendering
SHALL remain install-free and offline. Maintenance builds SHALL be locked and
reproducibly checked, with third-party notices preserved. Native dialog shells MAY
retain modal semantics to avoid runtime style injection; they SHALL NOT be falsely
claimed to be shadcn Dialog. The CSP SHALL remain hash-only without unsafe-inline
or eval; external connections/images, storage, feedback delivery and execution
SHALL remain disabled. Private no-overwrite output and all review gates remain.

#### Scenario: Header feedback on a frozen checked input
- **WHEN** a presentation-only rerender uses an already checked candidate whose copy budget is exhausted
- **THEN** its reviewed words and digest remain unchanged; the subtitle uses the supplied workflow purpose, redundant guidance/default technical metadata disappear, and exact metadata stay in existing evidence details. Future authoring guidance requests a short plain job name, brief why, few-word scenario name and two/three-sentence elaboration of relevant starting context and intended human outcome, using Economist then SDLC without claiming historical text was fixed or newly approved.

#### Scenario: Completion is not unqualified review approval
- **WHEN** an event has a recorded confirmed outcome but qualified associated findings
- **THEN** a muted completion checkmark MAY replace its hollow marker, with qualification labels/findings retained. Green terminal styling still requires confirmed associated findings, and conflicts/failures/unknown outcomes do not become passed.

#### Scenario: Visible controls and scoped feedback
- **WHEN** a user views steps or includes a correct-result item
- **THEN** comment controls have visible button borders, backgrounds, hover/focus and narrow-screen touch targets; included correct-result text identifies its whole-scenario scope and inclusion-control preset origin rather than appearing to be a timeline event or generated model comment. Step comments remain associated with their exact event.

#### Scenario: Mechanical register count change
- **WHEN** an item is explicitly added or removed
- **THEN** the counter plays a CSS register-like animation and a hidden live status reports the count change; reduced-motion disables animation. Draft/cancel/edit/deduplication without a count change does not trigger new count motion or authorize any operation.

#### Scenario: Comment reply capability is unavailable
- **WHEN** user comments have been read and implementation verified but the connector provides no supported post/reply operation
- **THEN** the task reports the capability blocker and retains thread-specific factual reply drafts, without claiming replies were posted, using credentials/browser automation as a bypass, or resolving/deleting threads. Existing annotated screenshot pixels remain untouched; added screenshots are labeled references, not new native review or user acceptance.

### Requirement: Compose included feedback into a deterministic manual prompt
The page SHALL start with an empty memory-only cart and disabled prompt-review control. It SHALL allow explicit step comments, an authorized correct-result item and optional reviewed fixes, with edit/remove controls. Cart 1.0 SHALL bind each item to snapshot, run, scenario, parent, candidate digest, allowed action and optional event; its closed shape SHALL reject unknown/stale identities and duplicate item keys. Snapshot/kind/action/event SHALL determine stable identity, deduplication and insertion-order replacement. Each normalized comment SHALL contain 1–10,000 characters; the cart SHALL contain at most 100 items. The same pure composer SHALL produce preview and copied text from only current included items, supplied context and recorded limitations, without model-generated interpretation. Scope SHALL remain unspecified and execution SHALL remain not_performed. There SHALL be no storage, automatic delivery or operation; users SHALL paste and submit manually in the original Claude chat.

#### Scenario: Draft, edit, remove and copy
- **WHEN** a user drafts a comment, cancels or presses Escape, then explicitly adds and edits included feedback
- **THEN** unsaved drafts stay excluded, edits replace rather than duplicate, removals disappear from the prompt, and the item count and preview update deterministically. Empty carts cannot be reviewed or copied. Clipboard failure selects the complete current prompt for manual copying; success still requires manual paste and submission and SHALL NOT claim delivery or application.

#### Scenario: Source-grounded optional fix
- **WHEN** a failed or partial event has authored suggested_feedback in snapshot 1.6
- **THEN** its closed action_id/text/evidence_refs/claim_refs fields SHALL identify an allowed issue action and nonempty valid evidence/claim references. The copy inventory and final candidate digest SHALL cover its text and references; both genuine final reviews SHALL assess the unchanged candidate, with factual grounding checked independently. The existing concern disclosure offers explicit fix inclusion with edit/remove. Missing reviewed feedback SHALL produce no fix button; no demo remedy, cause, scope or retry SHALL be inferred. Historical rendering SHALL NOT manufacture this field or upgrade approval.

#### Scenario: Correct result is not approval
- **WHEN** a user includes a correct-result item
- **THEN** it deduplicates as an editable prompt item and preserves the original run status/findings. No approval, golden-set mutation, rerun or external write occurs or is authorized by the page.

### Requirement: Present artifact and route intent honestly
On successful rendering, the editor SHALL attempt presentation using a supported host mechanism, return the artifact reference, verification summary and gaps to the parent, and be able to close without owning later feedback. A user action SHALL be an intent with snapshot, run, scenario and where applicable event identifiers, not an assertion of an executed action. Automatic routing SHALL be offered only through a verified parent-bound host transport that survives editor closure; otherwise the artifact SHALL offer explicit copy-to-chat feedback and SHALL NOT claim automatic delivery. Terminal Claude Code SHALL use browser presentation and either such a verified bridge or the copy fallback.

#### Scenario: Interaction after editor closure
- **WHEN** the user interacts after the editor closes and a host-verified parent-bound bridge is available
- **THEN** the intent reaches the original parent with the correct identifiers without executing the requested operation.

#### Scenario: No verified bridge
- **WHEN** automatic transport is absent, including in a terminal browser
- **THEN** the user can copy the intent and paste it into the parent conversation, and the artifact does not claim delivery.

#### Scenario: Presentation fails
- **WHEN** the host cannot open a valid artifact
- **THEN** the parent receives the artifact reference and presentation failure rather than a false success claim.

### Requirement: Evaluate the visualization boundary
Fixture-based workflow evaluations SHALL cover simple success, relevant downstream session, editorial correction, renderer repair, post-closure interaction with host-specific automatic and manual variants, attempt versus effect, contradictory verification, unavailable verification, current state versus causation, omission and noise, partial failure, ambiguous ordering, and render or presentation failure. Independent verification SHALL be checked across applicable cases using separate fixture source calls. Synthetic fixtures SHALL NOT be presented as real verification, and real-host tests SHALL separately establish host presentation and any automatic transport.

#### Scenario: Simple successful workflow
- **WHEN** a synthetic run includes a session start, independently confirmed world action with artifact, and termination
- **THEN** the evaluation checks the complete narrative and inline artifact and records synthetic origin in its report rather than adding a discarded origin label to the HTML.

### Requirement: Author and enforce separately reviewed short header copy
The 1.7 requirements below describe its historical contract. The current 1.8 requirements in the following section supersede its description and public-process presentation semantics without changing historical input records.
New candidate/snapshot 1.7 SHALL require closed header_copy with application_name, workflow_purpose, scenario_name, starting_context, observed_result and nonempty existing claim_refs. Closed draft 1.1 SHALL supply those words explicitly; deterministic assembly SHALL copy rather than invent, normalize or truncate them, preserving the complete original workflow/scenario specification and source payloads. New draft context_copy SHALL permit only existing run prose overrides. Product header policy 1.0 SHALL enforce application name one/two whitespace-separated words, purpose at most 120 Unicode code points AND 16 words, scenario name at most six words, and nonempty starting/result components. Reviewers SHALL assess two/three-plain-sentence description guidance without a punctuation-counting validator. These are UI budgets, not ASD restrictions on Economist prose.

#### Scenario: Overlong current copy fails before a claim
- **WHEN** new authored header text exceeds either purpose bound or the application/scenario word bounds, including the reported 62-character application name and 249-character purpose
- **THEN** assembly, packet and claim-copy preflight SHALL reject it before creating either copy-budget claim or dispatching a reviewer. Full original specifications SHALL NOT acquire these UI budgets; invalid headers SHALL NOT be silently shortened or moved under digest-excluded display.

#### Scenario: Complete review coverage and independent grounding
- **WHEN** a valid 1.7 candidate is sent to either reviewer
- **THEN** all five header strings SHALL appear in copyFields and both review packets, alongside executable closed header schema/product policy, claim references and context. Current copy feedback SHALL include rule_versions.header_copy "1.0" alongside unchanged SDLC v2 and permit matching header_copy/HEADER-1..HEADER-5 product findings. Header passages SHALL use Economist or unresolved/blocked, not ASD or protected exemptions. The factual checker SHALL independently assess whether the listed claims/sources support each header assertion without invented completion, identity, triggers, absence, delivery, readership or causation. Both final reviews SHALL bind all header fields/references and the full original specs; any header change SHALL invalidate both reviews.

#### Scenario: Exact visible short fields and full original context
- **WHEN** a valid reviewed 1.7 input is rendered
- **THEN** its header, queue, document title, comment context and manual prompt SHALL use the exact authored short fields. Its visible description SHALL combine starting_context and observed_result without Expected:. Full original workflow/scenario details SHALL remain in existing evidence and composed prompt. Tests SHALL assert actual rendered/browser values, not only instruction keywords. Valid second-nonpass copy SHALL retain real findings and limitations, not a fabricated pass; factual/stale/malformed gates, offline compiled shadcn assets, strict hash-only CSP and private/manual-only output SHALL remain unchanged.

#### Scenario: Historical contracts are not migrated
- **WHEN** historical draft 1.0 is explicitly assembled or an original reviewed 1.0–1.6 snapshot is displayed
- **THEN** draft 1.0 SHALL retain its 1.6 assembly path and original overrides, while rendering SHALL validate the complete original contract/digests and keep original words/fallback. Historical 1.6 SHALL retain SDLC v2 without new header metadata and its two-copy gates; no source input, review record, budget or version SHALL be migrated/restamped. New workflow/packet/claim admission SHALL require 1.7, and historical rerendering SHALL NOT be called fresh header approval.

### Requirement: Summarize the general scenario, not this run
Current snapshot 1.8/closed draft 1.2 SHALL require scenario_description and nonempty description_claim_refs instead of starting_context/observed_result. Under product header policy 1.1 the description SHALL be a brief GENERAL PRESENT-TENSE summary of scenario setup/task/intended behavior, preferably ONE concise sentence, two only if necessary, <=200 Unicode code points AND 30 whitespace-separated words. Actual observations/results/status SHALL stay in run/timeline. Both genuine final reviews SHALL bind the changed description/references and whole candidate; numeric checks SHALL NOT pretend to establish English tense. Historical 1.7 SHALL retain original contracts, words and review bindings.

#### Scenario: One authorized description-only refresh with exact cache
- **WHEN** the user authorizes regenerating only the description from the last completed reviewed snapshot/evidence packet
- **THEN** an immutable exclusive generation claim SHALL permit exactly ONE callback emitting only the closed description payload. All other authored/business strings, original specifications, references and evidence/artifact bytes SHALL be byte-identical to the source cache. Invalid/failed output SHALL stop without retry or broad authoring. New genuine complete copy/factual checks SHALL bind the new candidate, retaining cached passage provenance privately, without stale approvals, author revisions, historical budget reset or full eval rerun.

### Requirement: Never surface generation machinery
Public UI, expanded source/technical evidence, dialogs, cart and composed/copied prompt SHALL contain no generation review records/checks, reviewer/role/model identities, rule versions, counts/verdicts, editorial field findings, candidate/schema/digest metadata or copy-limit/nonapproval notices. Serialization SHALL omit these, not merely hide them with CSS. Strictly necessary identity/digest data MAY remain in hidden validated cart context. Genuine private review records and all structural/stale/role/source/factual/second-nonpass gates SHALL remain unchanged. Business outcomes and source uncertainty/missing data/conflicting evidence SHALL remain visible in human terms. Verbatim external artifacts SHALL remain unchanged. Business Review queue and Review prompt actions SHALL remain usable.

#### Scenario: Valid second nonpass is displayed without pipeline disclosure
- **WHEN** a structurally valid candidate has a genuine matching second nonpass copy record and complete factual record
- **THEN** it SHALL render the unchanged business copy without a copy-process warning or private findings. Expanded details and composed/copied prompt SHALL still omit all generation machinery while retaining source limitations and safe hidden feedback bindings. Missing/stale/malformed/non-independent records SHALL still block rendering.

### Requirement: Contain the sticky scenario header and demonstrate actual motion
The scenario panel SHALL have a bounded independently scrolling area. Its title, brief general description and correct-feedback control SHALL remain sticky at that container top with opaque background and contained stacking, not pinned to viewport/workflow top. Timeline content SHALL scroll beneath and containment SHALL end at the panel boundary before the cart. Desktop/mobile/reduced-height keyboard focus, disclosures, cart/dialogs and footer SHALL stay reachable without horizontal overflow or obscured controls.

#### Scenario: Real scrolling and local animation recording
- **WHEN** current UI is checked on desktop and 390px mobile/reduced-height viewports
- **THEN** browser geometry SHALL prove the header stays at the panel top while timeline positions change, the body does not substitute for panel scroll, and header/cart bounds remain contained. A requested 10–20-second browser recording SHALL show actual normal-motion count additions/removals with settled pauses and illustrative local feedback, without fabricated frames, clipboard/submission/source writes, extra model generation or encoder installation. Reduced-motion SHALL remain separately verified. New public screenshots/Figma captions SHALL expose no generation machinery; prior annotated pages SHALL remain untouched.
