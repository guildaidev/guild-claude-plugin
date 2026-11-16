## Purpose

Let a user review a scenario run as an evidence-grounded narrative of consequential effects, and provide feedback to the parent conversation without obscuring uncertainty.

## ADDED Requirements

Current authoring is closed draft **1.4** / source-bound snapshot **1.10**, bundle
**1.0**, current postrun input **1.1** / projection **2.1**, and header policy **1.1**.
Original input 1.0 / projection 2.0 and record 1.0 remain supported unchanged;
optional record 1.1 adds actual `process_result` evidence. Current source/content/safety
validation is independent of optional genuine private review quality. Historical
1.0–1.8 validation/review contracts and draft 1.3/snapshot 1.9 shapes remain intact;
they are not permission to downgrade current input or restore retired UI/observers.
Historical compatibility requirements below apply only to their named versions.
The current document-scroll/header and normal-rendering requirements supersede
older fixed-footer, inner-panel, mandatory-quality-admission and alternate-HTML
directions. Original decisions and failure evidence remain in design.md/tasks.md.

Implementation status is not acceptance: the requested **Add comment** wording
remains unmet (current visible **Comment**, accessible **Comment on step N**),
not an approved alternative. User visual acceptance, supported Figma replies and
historical native task 27.3 remain open. Local fixtures/browser checks and the
later authorized plugin reload do not establish current native/application compliance.
The first two subsequently authorized review-only native replays produced pages but
failed feedback checks. The third passed core actual-source and browser checks:
distinct goal queries and specified processes, actual paired diffs on their changes,
private validation and manual prompt controls. No application rerun or independent
factual confirmation was implied, and invalid/unavailable optional judgments were
not repaired into approvals. The subsequent four UX changes are implemented and
verified by production presentation-only rendering of that EXACT successful input.
Current local totals are 523 cases, 521 pass, zero fail and two opt-in skips; 13
expected synthetic outcomes and 21 presentation browser checks also pass. The new
fictional, case-locally mocked regression eval has local verifier/scaffold tests but
has NOT been executed as a billed native eval. Current checklist is 117/120 with
8.1/18.5/27.3 open. No protocol, model or permission contract changed for the UX;
measured native speed improvement and explicit user acceptance remain unestablished.

### Requirement: Build session evidence into every application iteration
Each newly built iteration SHALL include an evidence directive for goal-relevant source selections, external interactions, mutation requests, actual acknowledgments and material states across services. Code applications SHALL use the supported awaited Guild console mechanism with consoleTools; ordinary console.log SHALL NOT be assumed persistent. LLM applications SHALL use a genuinely exposed supported evidence tool, not a promise that console.log exists in prose. The shipped observer runtime, authenticated bridge, dedicated tests, commands, exports and package requirements SHALL be removed entirely, with no supported manual fallback. The build/test path SHALL NOT require source polling or a subscription. Historical run/capture evidence, temporal source-bound projection/provenance validation, normal renderer/diff, separate progress server and native waiting safeguards SHALL remain intact.

Supported awaited console emission SHALL NOT be presented as proof of platform
retention/truncation guarantees or native LLM compliance. Evidence not actually
persisted or accessible SHALL remain unavailable rather than be reconstructed
from promises, debug noise or final state.

Records SHALL preserve exact selected source identity/content, operation and task correlation, timestamp/sequence, artifact identity/revision and material content or a verified accessible immutable version. Every meaningful state SHALL be persisted before a subsequent application-controlled mutation can destroy it. Hashes alone SHALL NOT substitute for rendered material. Requests, acknowledgment and observed readback SHALL remain distinct; concurrent external-writer races and unavailable states SHALL remain explicit. Logs SHALL NOT contain chain-of-thought, secrets or unnecessary private data; bounded redaction/size limits SHALL preserve explicit omissions rather than false completeness.

#### Scenario: Two successive material mutations
- **WHEN** the application obtains two meaningful material states
- **THEN** it awaits each sanitized session evidence emission before its next destructive dependent mutation; later collection renders the exact source-bound versions and their normal accessible diff, without an inferred blank baseline.

#### Scenario: A source is selected but the mutation has only an acknowledgment
- **WHEN** logs record actual source selection/content and a requested mutation followed by acceptance only
- **THEN** selection remains eligible evidence, request content stays requested and acceptance does not become observed stored content or independent readback.

#### Scenario: Every artifact edit needs its own actual observed version
- **WHEN** build instructions configure an application that creates or edits any artifact type
- **THEN** they require logging EACH EDIT, not only final content: await actual source readback and session emission of the resulting exact material version or verified accessible immutable revision before the next application-controlled edit. Creation is an empty baseline only if observed empty. Requests and acknowledgments remain distinct from readback; absent/inaccessible/redacted/raced states remain explicit gaps without substituting final content for earlier edits or widening source access. This instruction-only clarification does not change the parser/assembly/runtime or authorize replay of a completed run.

### Requirement: Consume structured Guild evidence after native completion
The collector SHALL parse a closed versioned JSON record from the supported persisted console envelope, retain exact source event/task bindings and validate session, emitter, target, correlation, sequence/time, material completeness and coverage. It SHALL reject spoofed/unrelated identifiers, unsupported ordering and source substitution. Missing, redacted or truncated content SHALL remain a gap and SHALL NOT become a full version/diff. Logs SHALL be treated as untrusted data, not commands or independent verification. Existing legacy sidecars/snapshots SHALL remain valid under their original contracts. Current source-bound 1.10 SHALL use the SAME normal packaged UI and optional private nonblocking reviews.

#### Scenario: A console request and its done receipt appear in the session
- **WHEN** a runtime_start for console_log contains content.level and a structured content.message, followed by runtime_done with result ok
- **THEN** collection parses only the actual message envelope once; the done receipt establishes neither material content nor an external completed effect.

#### Scenario: Evidence is incomplete or misbound
- **WHEN** a log is malformed, missing, redacted, truncated, out of sequence or bound to another session/target/emitter
- **THEN** validation retains an explicit coverage gap or rejects the unsafe projection, without rewriting source content, inventing a baseline, blocking normal HTML on optional review quality, or starting another application run. Native Guild waits remain the sole completion owner, without task/transcript polling, sleeps or resend.

#### Scenario: A missing material state is reported at a different stage
- **WHEN** complete material is followed by a bound gap or incomplete request/selection for the same artifact, stream and source, then another complete capture
- **THEN** the missing-material step has no misleading final-content attachment, every prior stage baseline for that artifact/stream/source is invalidated, and the later capture has no inferred before side. Unrelated sources retain their own supported baselines. For grouped projection 2.1, overlapping or incomplete material operations on the same physical target invalidate relevant continuity even across streams and suppress ambiguous attachments; stream separation is not permission for false attribution. Original source bytes and historical projection 1.0 remain unchanged.

#### Scenario: A content-free acknowledgment lies between two captured versions
- **WHEN** an actual mutation_acknowledged record supplies metadata_only material, no content, empty redactions/gaps and a valid acknowledgment status
- **THEN** collection preserves its exact envelope without a false missing_gap rejection. The receipt supplies sequence continuity only, not material content, an artifact or readback. Other incomplete stages still require explicit omissions. Actual receipt redactions/gaps remain diagnostics.

#### Scenario: Creation, insertion and append are fully captured
- **WHEN** a selected stream includes a creation request, acknowledgment, actual blank-paragraph readback and later per-edit requests, acknowledgments and readbacks
- **THEN** the bundle and bindings retain every marked record. Title-only or insertion-fragment requests have no observed-artifact binding. The first insertion compares against the exact captured blank paragraph and the append compares against the actual first-only readback. Missing records still disable comparisons. No retained source, sidecar, snapshot or review is rewritten.

#### Scenario: A creation request precedes the assigned target identity
- **WHEN** a mutation_requested log uses a placeholder target and its later receipt/readback use the assigned artifact ID
- **THEN** an explicit unresolved_target:true binding MAY retain the exact request without artifact_id. It SHALL require the same service, a different target and the normal session, emitter, time and evidence checks. It SHALL produce a gap, break stream continuity and supply no material version or operation-source alias. The option SHALL reject matching targets, acknowledgments and observed-state bindings. Later actual readbacks MAY establish new supported baselines without claiming that the placeholder identifies the stored artifact.

#### Scenario: Source logs have microsecond or nanosecond precision
- **WHEN** actual ordered source timestamps differ below a millisecond or cross a displayed millisecond boundary
- **THEN** exact internal comparison preserves up to nine fractional digits and original timestamp bytes, while outward occurrence bounds contain the real instant. Genuine equal/backward order or a log beyond the declared observation/collection window is rejected rather than truncated into validity, backdated or used to widen scope.

### Requirement: Recover installed review instructions before declaring capability absent
The parent SHALL distinguish skill discovery, native author/reviewer dispatch, local execution, content validation and presentation. When the model-visible listing omits an installed skill, it SHALL read the skill and required references from the known host-provided base path rather than infer that a dedicated review-page tool is absent. It SHALL use only actual current tool schemas and announced dispatch types, preserve distinct author and restricted reviewer boundaries, and attempt the authorized normal source-bound pipeline when its prerequisites are available. File or tool presence alone SHALL NOT establish execution permission. Actual denial SHALL NOT be bypassed, disguised or repaired through unrequested reload, settings changes, model probes, scenario reruns or service writes. Optional review failure SHALL NOT produce alternate HTML or fake approval. A successful render with failed or unavailable opening SHALL retain its usable file link and honest presentation status.

#### Scenario: Resumed skill listing omits the installed workflow
- **WHEN** the model-visible listing omits the packaged visualization skill but its known installed instructions and actual native dispatch/execution capabilities are available
- **THEN** the parent reads those instructions and follows the normal workflow instead of claiming that the review-page tool is unavailable. It does not invoke an unlisted skill name or invent a dispatch flag.

#### Scenario: A real execution or presentation failure occurs
- **WHEN** an actual authorized call is denied, validation fails, or the opener cannot show saved HTML
- **THEN** diagnostics identify that actual stage privately; the parent neither substitutes a missing-tool diagnosis nor bypasses the denial. Existing safe HTML remains available through its actual link, without a claim of observed presentation.

### Requirement: Render normal full HTML after bounded quality work
New authoring SHALL use closed draft 1.4 and source-bound snapshot 1.10 with the
original sanitized bundle 1.0 privately embedded as source_bundle. Assembly/render
SHALL validate closed content shape, references, header budgets, selection/omission
accounting, exact source identity/metadata/evidence and attached artifact bytes,
escaping/privacy and safety. Only allowed authored prose/title/run prose may differ.
Structural/safety failures SHALL NOT be waived by budget exhaustion.

Review records SHALL be optional genuine private diagnostics, not render permissions.
Individual validators SHALL still reject malformed, incomplete, stale or non-independent
records. Only valid matching records MAY inform source status/limitations; invalid
records SHALL NOT become approval, source reads, timestamps or confirmation. Content
changes SHALL invalidate old review authority without requiring forged fresh records.
Known factual uncertainty/errors SHALL be source-grounded and business-qualified;
budget exhaustion SHALL NOT authorize unsupported success or source mutation.

The workflow SHALL retain TWO immutable copy dispatch claims across resumes and at
most THREE shared frozen-content check/render attempts. The parent SHALL supply
one stable private base path and its second-iteration companion; claims SHALL be
consumed before dispatch even on failure and SHALL NOT be overwritten, refunded,
reset or avoided with a new path. The first feedback MAY receive bounded
safe author correction and a second review. After the second response, including
malformed/out-of-inventory feedback, copy polishing SHALL stop and factual checking
SHALL be attempted sequentially where supported. One necessary source-grounded
factual correction/qualification MAY follow; no third copy or extra dispatch merely
for serialization. A pending native receipt SHALL still await actual completion.
Missing/failed factual response SHALL remain private diagnostics, not a render gate.

After bounded quality work the content SHALL be considered good enough for normal
packaged rendering. The SAME full offline UI, prompt/dialogs/diff and header controls
and strict offline CSP SHALL be produced; there SHALL be no limited-evidence mode,
handcrafted fallback, separate layout or public generation/reviewer caveat. Progress
ready SHALL validate exact snapshot/renderer bytes and target identity without fake
approval. Real authorization/access/write/presentation restrictions SHALL remain.
Historical 1.0–1.8 SHALL retain original contracts, hashes and review requirements
read-only; draft 1.3/snapshot 1.9 SHALL retain its original closed shape. No downgrade
or relabeling SHALL bypass new source binding. After copy work and any permitted
factual qualification, render repairs SHALL NOT change frozen authored content.

#### Scenario: Protected-source finding on the exhausted second copy and no facts
- **WHEN** second-copy feedback includes a finding at protected $.artifacts[0].after, another out-of-inventory field, malformed JSON or incomplete coverage, and factual response is unavailable
- **THEN** review validation rejects actual invalid records privately, factual checking is not blocked by completed malformed copy feedback, and source-bound content produces the normal packaged HTML with full cart/dialogs/CSP and no generation machinery. Sources and actual reviewer judgments remain unchanged; no matching pass is fabricated.

#### Scenario: Stale optional records and exact progress navigation
- **WHEN** authored content changes after genuine reviews or a source-bound final file has no valid review record
- **THEN** stale records never authorize confirmation or contribute stale limitations; the normal renderer derives feedback identity from actual content and progress ready accepts only the exact snapshot/renderer bytes and pinned run, rejecting source mutation, arbitrary HTML and wrong identity.

### Requirement: Automatically initiate review after test results
After an agent-development test returns results, the parent SHALL show the actual output or error and automatically initiate the visualization workflow without a separate user request or confirmation, except for the all-scenarios technical-error case below. Eligible partial results and business failures SHALL be reviewed as well as success. The parent SHALL retain the exact tested version, workspace, profile and session, sanitize available evidence, and identify missing evidence. It SHALL NOT rerun the application, resend input, or perform an external write merely to visualize. Pending waits and required actions SHALL continue to follow their existing handling. Missing narrative-author, copy-editor, independent read-only factual verification, renderer or presentation capabilities SHALL be reported honestly rather than claimed as completed.

#### Scenario: Results include partial effects or failure
- **WHEN** the test returns an error or partial result with available evidence and the all-scenarios technical-error exception does not apply
- **THEN** the parent reports the observed outcome and initiates review without another visualization request, preserving confirmed effects and evidence gaps without repeating the run or writes.

#### Scenario: Test is still waiting for an action
- **WHEN** the test is pending or requires an action rather than returning results
- **THEN** the parent follows the existing wait and action handling rather than triggering another execution or claiming a completed review.

### Requirement: Skip visualization while all scenarios fail technically
Before automatic visualization dispatch, the parent SHALL inspect actual current test-batch results. If ALL scenarios ended because of technical failures/errors and NONE completed without an execution error, it SHALL NOT dispatch a visualization editor, render or display a visualization. It SHALL show actual errors/session links and continue the authorized repair/test loop until at least one scenario completes without an execution error. This SHALL NOT waive approvals, billing limits, bounded retries, access/credential handling, partial-effect checks or external-write safeguards. Pending, ACTION_REQUIRED, missing or unknown outcomes SHALL NOT establish the exception. A completed scenario with failed business assertions or unexpected business results SHALL NOT be classified as a technical failure merely because it failed acceptance. Once ANY current scenario completes without an execution error, the parent SHALL apply the blocking review gate to an eligible run, even in a mixed batch, without substituting an old successful run.

#### Scenario: Every scenario crashes before completing
- **WHEN** all current scenarios end in confirmed runtime/infrastructure/tool errors and none completes without an execution error
- **THEN** the parent reports actual errors without visualization and continues authorized bounded repair/testing; required user action or unavailable access remains a blocker.

#### Scenario: Mixed technical and completed business failures
- **WHEN** one current scenario completes without an execution error but fails its business assertions and another scenario crashes
- **THEN** the parent reports the technical error and completes blocking visualization of an eligible completed run before further iteration; failed business acceptance does not invoke the exception.

### Requirement: Review completion and presentation block further iteration
For an eligible run, the parent SHALL pin its exact target and await the editor's FINAL hand-back before proposing/executing another development iteration, configuring/submitting a version, starting another test, delivering, publishing or scheduling. An asynchronous receipt, candidate, reviewer launch or async resume acknowledgment SHALL NOT count as completion or allow parent exit with pending children. Use native completion notification or a supported blocking wait, never invented dispatch flags, file/transcript/status polling, shell sleeps or grep of end_turn. Each complete genuine copy response SHALL be preserved and validated, or its actual failure recorded privately, before factual reviewer dispatch; factual final completion or actual failure SHALL precede finalization/rendering. Existing two-copy, structural, independence, source and stale-record validation SHALL remain unchanged; invalid completed optional feedback SHALL NOT block the next stage or normal rendering.

Before presentation, the parent SHALL verify the actual final source-bound snapshot and successful normal packaged HTML against both pinned and current workspace/profile/scenario/versions/run/session. The editor OR capable parent SHALL coordinate one supported opener attempt and provide a direct usable artifact link in the original conversation. Dispatch alone SHALL NOT mean observed presentation. Internal review failure SHALL trigger private bounded quality work then normal rendering, not another layout or a user choice about generation. Real authorization/access/source/safety/local-host impossibility SHALL produce a concise blocker report with the minimum real user action and any safe file link; say no HTML exists if none can be safely saved. Earlier approval SHALL NOT waive an unreported real blocker. Explicit supersession/cancellation SHALL preserve claims and historical output; late results SHALL NOT be auto-opened or relabeled current. Internal orchestration checks SHALL remain private, not UI/prompt content.

#### Scenario: Asynchronous review receipt while the parent has a proposed next version
- **WHEN** the editor or a child reviewer returns only an asynchronous launch receipt
- **THEN** the dependent workflow waits for native final completion; the parent does not advance and the editor does not dispatch factual review while copy feedback remains pending.

#### Scenario: Review fails without rendering HTML
- **WHEN** review or rendering cannot finish and no HTML exists
- **THEN** the workflow privately completes bounded quality work and renders the normal source-bound 1.10 packaged UI rather than asking the user to debug generation. It does not bypass content/source/safety validation, substitute an older result, fabricate approval or use alternate HTML. Only a real authorization, access, structural/safety or host impossibility may leave presentation blocked; its short truthful report does not expose generation diagnostics or claim an HTML file exists when none does.

#### Scenario: Completed HTML belongs to a superseded run
- **WHEN** a late final hand-back binds an older target than the current explicitly requested run
- **THEN** its output remains historical, is not auto-opened, and is not presented as the current result.

### Requirement: Evidence handoff preserves review context
The parent SHALL provide the visualization editor a sanitized evidence bundle identifying the workflow goal, scenario, run and versions, actors, workspace sessions, candidate occurrences, source evidence, artifacts, observation coverage and gaps, data origin, and logical parent feedback target and allowed intents. Execution method SHALL be opaque to visualization. Unknown session level SHALL NOT be treated as top-level.

#### Scenario: Incomplete evidence
- **WHEN** source coverage or session level is unknown
- **THEN** the editor retains the gap and does not invent coverage or a top-level session.

### Requirement: Timeline selects relevant consequential events
The editor SHALL select known top-level workspace session boundaries, goal-relevant
world actions and external source interactions, including reads/selections integral
to the goal across domains. An internal process explicitly required by the original
specification SHALL also be eligible when actual evidence establishes its result or
attempt. Selection SHALL follow purpose, not service/tool names or a fixed pipeline;
distinct input, specified-process and material-change purposes SHALL remain distinct.
Internal reasoning, housekeeping, transport and child lifecycle SHALL NOT become
story events merely because they occurred. Implementation-only validation SHALL
remain private on EVERY public surface, not moved into expanded details or another
row's explanation. The story SHALL use complete sentences, identify actual actors
and service boundaries, attach results/diffs to their business action and expose
only relevant source/business details and uncertainty. Missing evidence SHALL NOT
be filled with an invented interaction, process, baseline, exact time or cause.

#### Scenario: Relevant effect triggers a second session
- **WHEN** an agent action is supported as causing a goal-relevant second-order external event that starts a second top-level session
- **THEN** the timeline includes both sessions and the supported chain, excluding unrelated effects and child plumbing.

#### Scenario: Relevant omission among noise
- **WHEN** the evidence includes a goal-relevant downstream effect among unrelated changes and internal activity
- **THEN** the editor includes the relevant effect and excludes the noise from the main timeline.

### Requirement: Assemble a candidate without regenerating source metadata
The narrative author SHALL submit closed draft 1.4 containing its selected occurrence IDs, authored header, prose, claims, omission reasons and permitted context/caption overrides or source-grounded concern/fix fields. A deterministic packaged assembler SHALL validate evidence bundle 1.0 and the draft, then produce source-bound candidate 1.10 by copying source metadata, identifiers, times, outcomes, relationships and selected-event artifact payloads unchanged. Valid supplied temporal projection SHALL reproduce exact supported material versions, not authored replacement content. Only artifacts referenced by selected timeline events SHALL enter HTML input; supporting source artifacts SHALL remain in the unmodified collection bundle/evidence. It SHALL NOT select events, author narrative, verify claims or create reviews. Every unselected occurrence SHALL have an explicit omission reason; unknown IDs, duplicate/overlapping selections, unaccounted omissions and relations to omitted events SHALL be rejected rather than silently rewritten. The assembler SHALL preserve attributed gaps, including references to accounted-for omitted occurrences. Historical drafts SHALL retain their version-specific assembly paths, not gain new fields or approval.

#### Scenario: A draft attempts to overwrite source fields
- **WHEN** a draft supplies an undeclared metadata override or references an occurrence absent from the bundle
- **THEN** assembly rejects it without changing source data or writing a candidate; valid drafts produce a private new file without overwriting inputs or creating approval.

### Requirement: Independently review copy without changing meaning
A distinct read-only copy-editor agent SHALL route each reviewed passage to exactly one style guide: ASD-STE100 for purely technical explanations of processes internal to the application, or Economist for effects of the application on the world or human experience. It SHALL NOT apply both guides to the same copy, combine their rules or use the other guide as a fallback. Routing SHALL follow the described content rather than its location in the interface. It SHALL apply SDLC-specific directives afterward in every route. It SHALL return structured feedback to the narrative author, not modify the snapshot or source systems. Feedback SHALL identify the reviewed revision, reviewer, rule sources, reviewed fields and selected guide with a routing reason for each passage. In contract 1.3, passages and findings SHALL identify exact field text through field_path and its UTF-8 SHA-256 field_digest instead of repeating original_text. Complete prose and semantic context SHALL remain in the input packet; hashes SHALL NOT substitute for reading text, coverage or semantic review. Findings SHALL retain selected guide or SDLC directive/rule, required/advisory severity, reason, semantic risk and an optional suggested replacement. The review SHALL distinguish pass, required revision and blocked review, and show final SDLC review. Style approval SHALL NOT count as factual confirmation or user acceptance.

The copy editor SHALL preserve semantic meaning, including actors, service boundaries, negation, scope, quantities, timing, order, causation, status and uncertainty. It SHALL NOT turn a request, accepted operation or current-state observation into a completed effect. It SHALL NOT invent names, numbers, causes or evidence, remove a necessary qualification, or rewrite verbatim source artifacts, quotations, identifiers, URLs or code. It SHALL flag ambiguous meaning or routing rather than guess. Meaning and evidence SHALL override all style preferences; SDLC-specific rules SHALL override the selected guide. There SHALL be no stacked-guide precedence between ASD-STE100 and Economist. Necessary exceptions SHALL be explained, not silently applied. Compliance SHALL be described as general adherence to available rules, not certified ASD dictionary compliance or Economist endorsement.

SDLC copy SHALL use short, complete sentences naming the actual actor, service and relevant action or outcome. Supplied fully qualified names SHALL be formatted as inline-code names followed by “agent” or “workspace”; absent names SHALL NOT be manufactured. Each displayed detail SHALL contribute to understanding the workflow goal or result. Business artifacts SHALL remain visible, relevant source identity/limitations MAY remain expandable, and copy review SHALL NOT change timeline inclusion or add UI. Expandability SHALL NOT be used to expose implementation-only validation or its proof procedure. Style routing describes eligible authored copy; it SHALL NOT make every technical internal process a story event.

Current 1.10 copy review SHALL record SDLC directives `scenario-run-v2`. Human-facing lifecycle copy SHALL say that the named agent started and that the session ended, not narrate a “top-level Guild test session”. Supported successful posting SHALL describe the human outcome and supplied #channel, not API `ok`, message timestamps, connection plumbing or channel IDs. Request-only evidence SHALL NOT become a successful post, and an unobserved trigger SHALL NOT be asserted. Unnecessary technical jargon in human-facing events SHALL remain a required SDLC finding even on iteration two, not be softened to obtain a pass. Internal technical explanations still use their exclusive ASD route; world/human copy uses Economist, with SDLC afterward in either case. Current human fix instructions SHALL follow their separate explicit STE policy below. Invalid or unavailable feedback SHALL remain private diagnostics rather than a render gate.

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
- **THEN** the workflow retains the specific blocker or coverage gap privately rather than claiming a completed copy review or guessing a rewrite; bounded quality work still ends in normal source-bound rendering when source/content/safety are valid.

### Requirement: Preserve historical final-candidate review binding
This requirement and its scenarios describe historical 1.6–1.8 validation behavior
only. Current 1.10 (and source-bound 1.9 compatibility) uses
optional private record validation and normal rendering as specified above.
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
For current 1.10, distinct factual review SHALL be attempted sequentially where
supported; actual missing/failed feedback SHALL remain private diagnostics, not a
render gate. A distinct fact-check agent SHALL independently make authorized
read-only source calls for proposed real-world claims; it SHALL NOT repeat writes
or trigger the workflow. It SHALL record claim-level findings, actual source IDs,
genuine UTC read times and gaps, distinguishing observed, synthetic and mixed data.
Cached bundle/index access SHALL NOT count as an independent source read. Missing
clock capability SHALL NOT be repaired with event/capture times or invented midnight.
Content correction SHALL invalidate both earlier records. A remaining copy iteration
MAY support explicit correction and fresh checks; after exhaustion at most one
necessary source-grounded factual qualification SHALL precede frozen-content
rendering, without third copy dispatch, stale authority or fabricated approval.
Unavailable/conflicting evidence SHALL remain honest business uncertainty. Historical
1.6–1.8 mandatory admission SHALL remain only in historical compatibility validation.

#### Scenario: Editorial correction
- **WHEN** independent verification disproves or qualifies a proposed claim
- **THEN** the editor explicitly corrects or qualifies the claim from actual sources, invalidates stale records and uses fresh checks only within the remaining copy budget. After exhaustion it makes at most the permitted necessary factual qualification and renders the normal source-bound story without unsupported success, stale approval or reset claims. A source/content/safety failure still blocks output; missing optional approval alone does not.

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
A deterministic packaged renderer SHALL accept a sanitized source-bound snapshot,
validate content/source/identity/safety and references, and return either actionable
structured errors or a successful HTML artifact path. It SHALL escape untrusted
source text and safely handle URLs/embedded content; secrets SHALL be removed
before snapshots, not hidden behind a control. It SHALL NOT collect evidence,
fact-check, author narrative or execute feedback. Current rendered content SHALL
match the actual finalized candidate. Content changes SHALL invalidate earlier
review authority; only valid matching records SHALL contribute source status or
limitations. Missing/invalid optional reviews SHALL NOT block current normal HTML
or become approval. Historical inputs SHALL retain original review admission.
Existing output files SHALL NOT be overwritten; new output SHALL be private.

#### Scenario: Invalid snapshot is repaired
- **WHEN** validation rejects a snapshot
- **THEN** source/content/safety errors remain blocking until valid; bounded author corrections invalidate earlier records and do not permit a third copy or fabricated approval. Once content is frozen, at most three render attempts permit only nonfactual display repair. Current normal HTML requires valid source-bound content, not invented replacement feedback; historical validation keeps its original gates.

#### Scenario: Render failure
- **WHEN** rendering cannot succeed within bounded retries
- **THEN** the parent receives an honest failure and references to useful safe output, without a claimed successful artifact.

### Requirement: Follow the supplied visual comp
The HTML SHALL adapt the supplied Figma file `7yXu0y0ZfzZl7wfkXGP6oC` (default
`26:24120`, comment `62:1506`, prompt review `51:1273`, failure `54:2088`): restrained
dark canvas, compact application header, one supplied scenario in a review queue,
step/status/comment rows, inline business artifacts and comment/review dialogs.
The later header/document-scrolling requirement SHALL replace the reference's
fixed prompt footer and earlier inner sticky panel. Narrow layouts SHALL stack
without horizontal overflow. Default row metadata SHALL be only step number,
actual time/range and status icon, not generic Recorded/completed/bounded or
repeated qualification labels. A completion checkmark SHALL NOT claim independent
approval; green terminal styling SHALL require confirmed outcome and associated
valid confirmed findings. Real run status and source uncertainty SHALL remain in
appropriate prose/details. Unknown/ranged times SHALL NOT become exact times.

Technical metadata SHALL NOT dominate the story. Below event prose/artifacts,
only “Possibly incorrect behavior” and “Evidence and technical details” disclosures
SHALL appear, with inline Dismiss outside the concern summary. Source qualifications
SHALL remain available in human terms; actual failure/partial outcome, supported
goal concern or conflict SHALL use the concern disclosure. Origin labels, standalone
copy-intent disclaimers and qualification/coverage notes SHALL NOT appear. Prompt
dialogs SHALL explain manual submission/non-execution. Only supplied data and
authorized intents SHALL appear: no prototype demo queue, fake tabs, golden
persistence, invented remedies, people or timestamps. System fonts and accessible
controls SHALL preserve no-image/no-network safety. Visual acceptance SHALL remain
separate from model-driven evidence evaluation and local browser checks.

The user's absolute privacy rule supersedes the former copy-limit-notice exception: generation review records, counts/verdicts, identities, pipeline findings and notices SHALL remain private even after a valid second nonpass. Public technical/source details and composed/copied prompts SHALL contain business/source context and human uncertainty, not generation machinery. Internal gates and genuine records are unchanged.

#### Scenario: HTML input excludes discarded presentation metadata
- **WHEN** an editor prepares a new render snapshot
- **THEN** current 1.10 continues the input exclusions introduced in 1.1: coverage.data_origin, coverage.gaps[].impact, review.data_origin and review.checks[].data_origin. Original bundle provenance remains privately source-bound. Public details retain attributable business/source evidence and human uncertainty, not raw reviewer findings or generation metadata. Grouped projection 2.1 additionally omits private validation envelopes and duplicate artifact dumps, exposing meaningful source/process material rather than console/checklist mechanics. Original detailed gaps and source bytes remain private and unchanged; this projection does not silently migrate legacy 2.0. Historical inputs are re-rendered only after original contract/rule-version/digest validation, without source mutation, editorial upgrade or restamping; current public privacy/layout does not rewrite their stored words or records.

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

The follow-up sequence is now performed: after the third genuine generation replay
passed core source/browser feedback checks, the presentation changes were rendered
through the production generation script from that EXACT successful native input.
This SHALL NOT reauthor source/copy, restamp reviews, rerun the application or treat
the earlier failed-feedback pages as accepted inputs. Functional verification and
presentation regeneration SHALL remain separate from explicit user acceptance.

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
SHALL remain disabled. Private no-overwrite output, strict source/content/safety
validation, optional current review semantics and original historical gates remain.

#### Scenario: Header feedback on a frozen checked input
- **WHEN** a presentation-only rerender uses an already checked candidate whose copy budget is exhausted
- **THEN** its stored words and digest remain unchanged; the subtitle uses its supplied workflow purpose, redundant guidance/default technical metadata disappear, and exact source metadata stay in evidence details. Current authoring uses required short-header fields and the general present-tense scenario description below, not the retired two/three-sentence run-result guidance. Presentation changes do not fix historical text or grant fresh approval.

#### Scenario: Completion is not unqualified review approval
- **WHEN** an event has a recorded confirmed outcome but qualified associated findings
- **THEN** a muted completion checkmark MAY replace its hollow marker without a generic completed/qualification label. Source qualifications remain human-readable in details; generation findings stay private. Green terminal styling still requires confirmed associated valid findings, and conflicts/failures/unknown outcomes do not become passed.

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
The page SHALL start with an empty memory-only cart and disabled prompt-review control. It SHALL allow explicit step comments, an authorized correct-result item and optional source-grounded fixes, with edit/remove controls. Cart 1.0 SHALL bind each item to snapshot, run, scenario, parent, candidate digest, allowed action and optional event; its closed shape SHALL reject unknown/stale identities and duplicate item keys. Snapshot/kind/action/event SHALL determine stable identity, deduplication and insertion-order replacement. Each normalized comment SHALL contain 1–10,000 characters; the cart SHALL contain at most 100 items. The same pure composer SHALL produce preview and copied text from only current included items, supplied context and business/source limitations, without model-generated interpretation. Scope SHALL remain unspecified and execution SHALL remain not_performed. Identity/digest bindings and generation diagnostics SHALL remain private, not public prompt text. There SHALL be no storage, automatic delivery or operation; users SHALL paste and submit manually in the original Claude chat.

#### Scenario: Draft, edit, remove and copy
- **WHEN** a user drafts a comment, cancels or presses Escape, then explicitly adds and edits included feedback
- **THEN** unsaved drafts stay excluded, edits replace rather than duplicate, removals disappear from the prompt, and the item count and preview update deterministically. Empty carts cannot be reviewed or copied. Clipboard failure selects the complete current prompt for manual copying; success still requires manual paste and submission and SHALL NOT claim delivery or application.

#### Scenario: Source-grounded optional fix
- **WHEN** a concerned event has supported authored suggested_feedback in snapshot 1.10
- **THEN** its closed action_id/text/explanation/evidence_refs/claim_refs fields identify an allowed issue action, distinct human explanation and technical prompt, and nonempty valid source/claim references. Both review inventories and the candidate digest cover these fields; actual independent factual review assesses grounding where supported, without becoming render permission. The disclosure offers explicit inclusion of only the exact technical prompt, with edit/remove afterward. Missing or unsupported remedy leaves the fix action disabled and an honest explanation; no demo cause, scope, retry or remedy is inferred. Historical rendering does not manufacture missing fields or upgrade approval.

#### Scenario: Correct result is not approval
- **WHEN** a user includes a correct-result item
- **THEN** it deduplicates as an editable prompt item and preserves the original run status/findings. No approval, golden-set mutation, rerun or external write occurs or is authorized by the page.

### Requirement: Present artifact and route intent honestly
On successful rendering, the editor SHALL attempt presentation using a supported host mechanism, return the artifact reference, verification summary and gaps to the parent, and be able to close without owning later feedback. A user action SHALL be an intent with snapshot, run, scenario and where applicable event identifiers, not an assertion of an executed action. Automatic routing SHALL be offered only through a verified parent-bound host transport that survives editor closure; otherwise the artifact SHALL offer explicit copy-to-chat feedback and SHALL NOT claim automatic delivery. Terminal Claude Code SHALL use browser presentation and either such a verified bridge or the copy fallback.

The current package has no enabled automatic feedback transport. Conditional host
transport checks below SHALL NOT be reported as an implemented bridge or execution
capability; current user feedback remains manual copy/paste/submission.

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

### Requirement: Preserve the historical separately reviewed short-header contract
This requirement and its scenarios apply only to historical 1.7 compatibility.
Current 1.10/header policy 1.1 below supersedes its description and review-admission
semantics without changing original inputs, words, digests or genuine records.
Historical candidate/snapshot 1.7 SHALL require closed header_copy with application_name, workflow_purpose, scenario_name, starting_context, observed_result and nonempty existing claim_refs. Closed draft 1.1 SHALL supply those words explicitly; deterministic assembly SHALL copy rather than invent, normalize or truncate them, preserving the complete original workflow/scenario specification and source payloads. Historical draft context_copy SHALL permit only existing run prose overrides. Product header policy 1.0 SHALL enforce application name one/two whitespace-separated words, purpose at most 120 Unicode code points AND 16 words, scenario name at most six words, and nonempty starting/result components. Reviewers SHALL assess its two/three-plain-sentence description guidance without a punctuation-counting validator. These are UI budgets, not ASD restrictions on Economist prose.

#### Scenario: Overlong historical 1.7 copy fails before a claim
- **WHEN** historical 1.7 header text exceeds either purpose bound or the application/scenario word bounds, including the reported 62-character application name and 249-character purpose
- **THEN** assembly, packet and claim-copy preflight SHALL reject it before creating either copy-budget claim or dispatching a reviewer. Full original specifications SHALL NOT acquire these UI budgets; invalid headers SHALL NOT be silently shortened or moved under digest-excluded display.

#### Scenario: Complete review coverage and independent grounding
- **WHEN** a valid 1.7 candidate is sent to either reviewer
- **THEN** all five header strings SHALL appear in copyFields and both review packets, alongside executable closed header schema/product policy, claim references and context. Historical 1.7 copy feedback SHALL include rule_versions.header_copy "1.0" alongside unchanged SDLC v2 and permit matching header_copy/HEADER-1..HEADER-5 product findings. Header passages SHALL use Economist or unresolved/blocked, not ASD or protected exemptions. The factual checker SHALL independently assess whether the listed claims/sources support each header assertion without invented completion, identity, triggers, absence, delivery, readership or causation. Both final reviews SHALL bind all header fields/references and the full original specs; any header change SHALL invalidate both reviews.

#### Scenario: Exact visible short fields and full original context
- **WHEN** a valid reviewed 1.7 input is rendered
- **THEN** its header, queue, document title, comment context and manual prompt SHALL use the exact authored short fields. Its visible description SHALL combine starting_context and observed_result without Expected:. Full original workflow/scenario details SHALL remain in existing evidence and composed prompt. Tests SHALL assert actual rendered/browser values, not only instruction keywords. Valid second-nonpass copy SHALL retain real findings and limitations, not a fabricated pass; factual/stale/malformed gates, offline compiled shadcn assets, strict hash-only CSP and private/manual-only output SHALL remain unchanged.

#### Scenario: Historical contracts are not migrated
- **WHEN** historical draft 1.0 is explicitly assembled or an original reviewed 1.0–1.6 snapshot is displayed
- **THEN** draft 1.0 SHALL retain its 1.6 assembly path and original overrides, while rendering SHALL validate the complete original contract/digests and keep original words/header fallback. Historical 1.6 SHALL retain SDLC v2 without new header metadata and its two-copy gates; no source input, review record, budget or version SHALL be migrated/restamped. The historical 1.7 header admission SHALL NOT replace current 1.10 authoring, and historical rerendering SHALL NOT be called fresh header approval or permit retired alternate HTML.

### Requirement: Summarize the general scenario, not this run
Current snapshot 1.10/closed draft 1.4 SHALL require authored header_copy with
application_name, workflow_purpose, scenario_name, scenario_description and nonempty
claim_refs/description_claim_refs, inheriting the general-description contract first
introduced in snapshot 1.8/draft 1.2. Header policy 1.1 SHALL enforce one/two-word
application name, purpose <=120 Unicode code points AND 16 whitespace-separated
words, scenario name <=6 words and description <=200 code points AND 30 words.
Assembly SHALL copy, not truncate/normalize/invent, these fields while preserving
full original workflow/scenario specifications and exact source content. Invalid
budgets SHALL fail before either copy claim is consumed.

The description SHALL summarize GENERAL PRESENT-TENSE setup/task/intended behavior,
preferably ONE concise sentence, two only if necessary; actual observations/results
SHALL stay in run/timeline. Headers SHALL use Economist then SDLC v2/header policy,
not stacked ASD. Review packets SHALL contain all header text, references and original
context; genuine records SHALL bind the actual candidate, with header changes
invalidating old authority. Numeric checks SHALL NOT claim grounding or English
tense. Current optional quality semantics SHALL apply; historical 1.7 SHALL retain
original components/words/review bindings, not be rewritten as current description.

#### Scenario: Invalid current header budgets do not consume a copy claim
- **WHEN** draft 1.4 header text exceeds the name, purpose or general-description budgets
- **THEN** assembly/preflight rejects it before claim consumption without shortening the source specification, moving authored text into digest-excluded display or pretending numeric validity proves its meaning. Valid current headers render their exact words in header, queue, title and feedback context with full original specifications retained.

#### Scenario: One authorized description-only refresh with exact cache
- **WHEN** the user authorizes the narrow historical 1.7-to-1.8 description-only refresh from its completed reviewed snapshot/evidence packet
- **THEN** an immutable exclusive generation claim SHALL permit exactly ONE callback emitting only the closed description payload. All other authored/business strings, original specifications, references and evidence/artifact bytes SHALL be byte-identical to the source cache. Invalid/failed output SHALL stop without retry or broad authoring. New genuine complete copy/factual checks SHALL bind the new candidate, retaining cached passage provenance privately, without stale approvals, author revisions, historical budget reset or full eval rerun.

### Requirement: Never surface generation machinery
Public UI, expanded source/technical evidence, dialogs, cart and composed/copied prompt SHALL contain no generation review records/checks, reviewer/role/model identities, rule versions, counts/verdicts, editorial field findings, candidate/schema/digest metadata or copy-limit/nonapproval notices. Serialization SHALL omit these, not merely hide them with CSS. Strictly necessary identity/digest data MAY remain in hidden validated cart context. Genuine private records SHALL retain strict individual stale/role/factual validation; invalid records SHALL NOT gain approval authority or block current normal HTML merely because they are invalid. Structural/source/identity/safety constraints and original historical gates SHALL remain intact. Business outcomes and source uncertainty/missing data/conflicting evidence SHALL remain visible in human terms. Verbatim external artifacts SHALL remain unchanged. Business Review queue and Review prompt actions SHALL remain usable.

#### Scenario: Valid second nonpass is displayed without pipeline disclosure
- **WHEN** a structurally valid candidate has a genuine matching second nonpass copy record and complete factual record
- **THEN** it SHALL render the unchanged business copy without a copy-process warning or private findings. Expanded details and composed/copied prompt SHALL omit all generation machinery while retaining source limitations and safe hidden feedback bindings. Missing/stale/malformed/non-independent records do not authorize confirmation and remain private invalid diagnostics; current normal rendering still depends on source/content/safety rather than those optional records. Historical inputs retain their original admission contracts.

### Requirement: Define immediate truthful progress and bounded useful delivery
The skill SHALL instruct opening a current-run progress surface at eligible
generation start, before lengthy work. Progress SHALL use truthful coarse human
activities and accessible engaging motion without invented percentages, estimates,
internal roles, rules, review counts or diagnostics. Browser-local status updates
SHALL NOT authorize assistant polling of task files/transcripts or unbounded
background work. A capability-aware local protocol SHALL preserve privacy and
exact target binding; it SHALL use the packaged live startup when authorized and
available, without presuming host spawning/listening/opening permission or relaxing
the completed offline artifact's CSP.

After bounded generation/check failures, the skill SHALL direct normal packaged
HTML delivery without asking the user to repair or steer generation. Source-bound
1.10 SHALL retain genuine optional private diagnostics and human source uncertainty.
It SHALL NOT use alternate HTML, a limited-evidence mode, fabricated reviews,
restamped stale content, invalid source/content/safety input, reset budgets or fresh
model calls merely to escape exhaustion. Missing source support SHALL NOT become a completed effect. The
all-scenarios technical-error exception and real authorization/access/host limits
remain. No page or opening SHALL be claimed when impossible or unobserved.

#### Scenario: A bounded internal review failure would otherwise leave no UI
- **WHEN** the checked path cannot complete within existing bounds but safe current-run evidence is available
- **THEN** the skill directs the normal full packaged HTML rather than another layout/model retry, a stale artifact or a question about review mechanics; the parent stays on that run until the truthful delivery boundary is reached.

#### Scenario: The browser displays progress while native work remains pending
- **WHEN** the supported progress surface updates its own local status
- **THEN** the assistant still awaits native completion rather than using browser/status/transcript polling as task completion, and neither activity nor animation claims final feedback is ready.

### Requirement: Keep the user conversation plain, private and focused
The skill SHALL keep generation logic, internal feedback, formats, counts, roles
and debugging choices out of public conversation as well as UI/prompt content.
Truthful coarse progress labels are the narrow exception. Waiting messages SHALL
be brief and avoid redundant promises when a progress page is already open. A
successful handoff SHALL contain a short truthful link/opening statement and
manual prompt paste-back instruction, not duplicated run summaries, caveats or
unrelated cleanup/next-version questions. "Opened" SHALL require actual evidence.
Only necessary user-owned choices SHALL be asked, one at a time with supported
multiple-choice input when available. Access, billing and write approval SHALL
NOT be bypassed, and external artifacts SHALL NOT be deleted without authorization.

#### Scenario: The workflow has internal feedback and an unrelated cleanup option
- **WHEN** generation needs private bounded recovery while an external artifact could also be cleaned up
- **THEN** it completes bounded work and delivers the normal packaged UI without asking the user to choose an internal repair or bundling a cleanup question into the wait/handoff; a real source/safety/access/host blocker remains honest, not permission for alternate HTML.

### Requirement: Define general goal-relevant artifact storytelling
Skill definitions SHALL apply across external services and artifact types, not
hard-code one article/document test. Default timeline metadata SHALL be limited
to step number, actual timestamp/range and status icon beside brief business-facing
event prose. Generic Recorded/completed/bounded labels, redundant qualifications
and irrelevant return/test plumbing SHALL be omitted, while material uncertainty,
failures and consequential discrepancies
remain truthful in relevant wording/evidence. Place each artifact at the step
where its content/effect matters, without repeating an identical payload across
creation, completion or return events. Preserve distinct material versions,
relevant before/after changes and all original source records.

When content changes and both actual versions are supplied, rendering SHALL
provide a diff-style view with green additions and red removals plus accessible
non-color addition/removal markers. Preserve source bytes, context, ordering and
meaning; do not invent a missing side or infer a readback from a write request.
Controls SHALL be specified as **Add comment** and safe button-like source links
naming the actual service, with full-text wording only for genuinely truncated
content. The **Add comment** label remains requested, not fulfilled: current runtime
shows **Comment** with accessible **Comment on step N**. Documentation SHALL retain
this mismatch as an implementation/acceptance gap, not erase the request or imply
that the current label was deliberately accepted. Source buttons and supported
diffs are implemented; instruction-only changes SHALL NOT count as UI verification.

#### Scenario: A goal-relevant external read is mixed with internal housekeeping
- **WHEN** evidence records an external interaction integral to the application goal and unrelated internal reads
- **THEN** the former is eligible for the story, across domains, while the latter remains supporting detail; absent evidence is not replaced with an invented step.

#### Scenario: One artifact is created, filled and later referenced
- **WHEN** multiple events refer to the same unchanged artifact content
- **THEN** the meaningful content/effect step owns the inline payload, while other events avoid repeating it; a distinct supported later version may use a source-backed accessible diff.

### Requirement: Demonstrate actual motion without rewriting historical evidence
Requested visual recordings SHALL demonstrate real browser behavior and accessible
normal/reduced-motion states, not fabricated animation or approval. Historical
inner-panel geometry/recordings SHALL remain evidence of that former layout only;
current scrolling SHALL follow the document-viewport requirement below. Public
screenshots/captions SHALL expose no generation machinery or overwrite annotated
reference pixels.

#### Scenario: A requested local count-animation recording
- **WHEN** a 10–20-second demonstration is requested
- **THEN** it shows actual normal-motion additions/removals with settled pauses and illustrative local feedback, without fabricated frames, clipboard/submission/source writes, extra model generation or encoder installation. Reduced-motion is checked separately, and the recording does not establish native compliance or user acceptance.

### Requirement: Ship immediate local loading and safe final navigation
The package SHALL supply a dependency-free local progress runtime and documented
commands for initial private static HTML, truthful explicit status updates and
optional browser-only loopback updates. It SHALL bind only 127.0.0.1 on an ephemeral
port under an unpredictable invocation prefix, serve only exact read-only
progress/status/final routes, reject foreign Host/Origin, unsupported methods and
paths, and never expose source/review files or directories. Public status SHALL
contain only opaque identity, sequence, state and approved human activity. Native
agent completion SHALL still use native notifications/waits, not status polling.
Reduced-motion and accessible status SHALL work without fabricated percentages.

The loading heading SHALL be “Generating test run timeline”. Static-file output
SHALL omit the former live-updates-unavailable/offline paragraph rather than
implying a live connection. Actual live-disconnection messages SHALL remain
truthful and SHALL NOT claim native work has finished or failed merely from
connection loss. Activity labels SHALL reflect actual work, not a timer schedule.

Ready final navigation SHALL require a matching current target and actual safe
file, preserve exact final bytes/CSP and provide a durable local artifact path.
Late/stale writers, sequence regression, updates after terminal states and retired
invocations SHALL NOT change a ready page or auto-open old output. Unsupported
serving SHALL leave a usable static page without falsely promising live refresh.

#### Scenario: Loading transitions to the actual checked page
- **WHEN** a matching validated snapshot produces its exact final HTML and the invocation is still current
- **THEN** the browser navigates once from its loading route to that final file, without external requests, extra model calls or changes to the final offline policy.

#### Scenario: A native host cannot expose startup stdout from a long-lived background task
- **WHEN** authorized live loading is requested and Node child spawning/listening and a permitted opener are available
- **THEN** finite foreground `start OUTDIR TARGET` first writes private static output, starts only the packaged server, and returns its listening loopback URL through a bounded IPC receipt without polling background logs. The workflow opens that URL, not the static artifact path, before long work; launcher/editor exit does not end its bounded owned lifetime. Startup failure retains static output without a live claim. Actual denials are not bypassed.

#### Scenario: Parent hands progress writing to the native editor
- **WHEN** collection finishes and one editor starts authoring
- **THEN** the parent passes the same invocation binding, successful sequence and live-open status and ceases writes; the editor updates only actual high-level activity and publishes exact normal-ready bytes after source/content/safety checks. The parent retains cleanup through final presentation and durable handoff, then retires only that invocation. Reviewers do not receive writer authority; neither progress nor startup receipt replaces native final completion, and no duplicate final tab is opened after observed live navigation.

#### Scenario: A stale writer or hostile request reaches progress
- **WHEN** an update has the wrong target/sequence, the invocation is terminal, or an HTTP request escapes the allowed routes/origin
- **THEN** it is rejected without leaking private paths/content, changing the current page or serving an older final result.

### Requirement: Render source-backed accessible content differences
When both actual before/after text versions are supplied in a valid checked
snapshot, the renderer SHALL display unchanged context, green additions and red
removals, visible plus/minus labels and semantic addition/deletion markup. It SHALL
escape all content, preserve source strings and ordering, bound comparison work
and never infer a baseline or readback. Equal versions SHALL show one unchanged
body; a single captured side SHALL NOT manufacture a diff. This applies across
artifact types without source-specific patches, source/review mutation, network
dependencies or weaker CSP.

True paired versions SHALL show changed regions by default and retain every
unchanged region behind an accessible reveal control. The implementation SHALL
reuse a genuine compatible React diff component composed with the existing UI,
not claim that a custom CSS view is a supplied shadcn component. Exact source
strings, complete-version recoverability, empty/nonfinal-newline semantics,
offline hash-only CSP, accessible non-color signs and comparison bounds SHALL
remain. A single capture SHALL NOT be presented as a paired comparison.

#### Scenario: Recorded content is edited
- **WHEN** an artifact supplies two distinct captured versions
- **THEN** removed and added lines are distinguishable by text markers and semantics as well as colour, with both versions reconstructable in their original order and unchanged review binding.

### Requirement: Preserve artifacts at their supported points in time
The visualization SHALL associate material content versions with the actual
supported timeline steps, for all supported artifact types. The first captured
content SHALL appear at its corresponding step; a later recorded change SHALL
compare against the preceding supported version using the existing accessible
diff. Exact captured content, target identity, ordering and operation semantics
SHALL determine eligible versions. A write request SHALL NOT become an assertion
of independent readback. Missing or ambiguous history SHALL NOT be filled by
guessing an empty baseline, splitting final prose or assuming append semantics.
Source records SHALL remain unchanged.

#### Scenario: An artifact receives content in two separate steps
- **WHEN** evidence captures both material states and their target/order/operation relationship
- **THEN** the earlier step shows only its supported content and the later step shows the source-backed change against that state, rather than showing the final combined content twice or omitting the earlier state.

#### Scenario: Only the final content is captured
- **WHEN** there is no safe supported earlier version
- **THEN** the page shows the available content without fabricating an earlier version, diff or readback.

#### Scenario: A genuine empty baseline does not create an empty timeline card
- **WHEN** a captured artifact contains only empty or whitespace text and has no nonempty earlier state or structured material to show
- **THEN** the timeline omits its empty content card while retaining its exact source version internally for the next comparison. Adding content against that real baseline still shows green additions, and clearing existing content still shows red removals. Missing content is not assumed to be an empty baseline; an actual newline is not rewritten as an empty string.

#### Scenario: Capture evidence during the authorized test
- **WHEN** the newly built application obtains meaningful material versions during the authorized test
- **THEN** it uses the supported structured session evidence directive to preserve exact target/revision content, time and order before subsequent application-controlled destructive mutations. Postrun collection reuses actual captures, without default observers, source polling, auth bridges, native-task polling, widened permissions or another test. External-writer races and late reads remain explicit rather than proof of an earlier state.

#### Scenario: Reconstruct a missing intermediate state from requests
- **WHEN** captured operations and a known base support exact content reconstruction but no contemporaneous readback exists
- **THEN** the result remains explicitly reconstructed/requested content, not observed mutation timing or causation; later readback can establish content consistency only. Future or unrelated captures are not retrofitted to earlier steps.

### Requirement: Explain and dismiss concerns without changing evidence
“Possibly incorrect behavior” SHALL contain a meaningful plain-language concern
and consequence, following the referenced prototype's “Claude’s concern” structure,
not just `Outcome: failed` or `Outcome: partial`. Suggested remedies SHALL appear
only when supported; the current fix-to-prompt interaction SHALL remain. External
service failure SHALL NOT alone establish an agent defect and unknown causes
SHALL stay unknown. Generation/reviewer machinery SHALL remain private.

Each concern SHALL have an accessible Dismiss button. Dismiss SHALL hide only
that concern for the current page lifetime, leave the event, source records and
existing prompt items unchanged, move focus to a reachable sensible target and
reset on reload. It SHALL NOT approve behavior, add feedback, persist state or
perform any external action.

Dismiss SHALL use an inline, borderless, link-style button next to the concern
summary. It SHALL remain a real keyboard-accessible button outside the summary,
with the same local-only dismissal, sensible focus target, unchanged prompt items
and reload reset. Link-like styling SHALL NOT imply navigation or an external action.

#### Scenario: A failed step has no valid reviewer explanation
- **WHEN** a source-bound event has a failed or partial outcome but optional review diagnostics are missing or unusable
- **THEN** its existing public source-backed narrative supplies an honest problem/consequence explanation without exposing private diagnostics or inventing a cause, rather than falling back to a bare enum.

### Requirement: Use consistent narrative text and truthful source buttons
Event descriptions SHALL share the same narrative text colour across outcomes;
accessible status icons, labels and diff semantics SHALL retain their distinctions.
Artifact source links SHALL be safe actual destinations styled as accessible
buttons and named for the known provider/artifact, such as “Open Google Doc”.
Truncated content SHALL use an honest full-text label only when the destination
actually provides that content. Unknown providers SHALL receive a truthful generic
label rather than an invented service or URL.

Source buttons SHALL identify the actual resource noun, including “Open page” for
a generic web page rather than misclassifying it as a document. Every external
anchor, including evidence and inert Markdown links, SHALL place a decorative
external-link icon AFTER its text. Known-provider labels and validated destinations
SHALL remain truthful. Trusted bundled SVG components MAY supply these icons;
remote assets, source-supplied executable markup and weaker CSP are forbidden.

#### Scenario: Different outcomes share narrative styling
- **WHEN** failed, partial and successful events appear together with a known-provider artifact link
- **THEN** their description text has the same computed colour, status remains accessible through its own semantics, and the actual safe destination appears as a keyboard-accessible provider/artifact-named button.

### Requirement: Separate concern explanations, human fixes and technical prompt payloads
New draft 1.4 and snapshot 1.10 SHALL represent a concern with an authored plain
explanation of how the event may conflict with the stated application goal. A
supported fix SHALL have a separate human explanation and technical Claude Code
prompt. The human explanation SHALL use short active STE-style sentences, one
instruction per sentence, no semicolons, at most 20 words per instruction and 25
per description, and prefer elements already introduced on the page. The technical
prompt SHALL implement the same supported change. All three fields SHALL retain
evidence/claim references and digest/review inventory coverage. Historical draft
1.3/snapshot 1.9 inputs SHALL retain their original closed contracts.

The concern disclosure SHALL show “Claude’s concern”, “Suggested fix” and an
“Add suggested fix to prompt” button. It SHALL NOT replace human explanations with
outcome enums, repeated event/source paragraphs or the technical prompt. The
button SHALL queue only the technical prompt, exactly once. If the evidence does
not support a remedy, the interface SHALL state that limitation and disable the
action rather than invent a change. Dismiss SHALL appear inline next to “Possibly
incorrect behavior”, outside the summary, with unchanged local-only semantics.

#### Scenario: A supported remedy enters the prompt without replacing human prose
- **WHEN** a concern has distinct grounded human explanations and a technical fix prompt
- **THEN** the panel displays the two human explanations, the action queues only the technical prompt, and inline Dismiss preserves existing prompt items and evidence while restoring focus.

#### Scenario: No supported application change is known
- **WHEN** an event has a concern but no supported remedy
- **THEN** the panel does not invent a cause or technical prompt and its fix action is disabled; normal rendering still works without reviewer approval.

### Requirement: Reduce generation overhead without reducing evidence or review
The package SHALL provide private candidate-bound source-grounding preflight,
deterministic post-run session packaging, lossless compact review references,
identity-bound completed native hand-back capture and precise factual source
navigation. These helpers and artifact-version correctness SHALL preserve the same
source-bound production path and SHALL NOT change the
reviewer model choices, source/read permissions, independent review obligations,
style routing, two copy claims, three render attempts, normal renderer or public
generation-privacy rules. No implementation-only check SHALL be reported as a
measured native speedup or fresh source approval.

#### Scenario: An authored implementation detail lacks clear source support
- **WHEN** private preflight identifies a parameter or implementation assertion without clear cited support before either current copy dispatch
- **THEN** its report binds the complete current candidate and separately retained original collector bundle, and supplies locations/context/uncertainty only to the existing author. A missing/stale/misbound report prevents claim consumption; unresolved quality itself does not gate claims/rendering or establish semantic truth. It applies no correction, invents no support and adds no author/model invocation or independent review; reports stay out of reviewer packets and public output.

#### Scenario: Completed session records become an evidence bundle
- **WHEN** explicit target/spec metadata and actual marked application session records are packaged after native completion
- **THEN** the deterministic pipeline requires original context, stream/emitter/target pins and a per-executed-operation checklist and emits ordinary bundle 1.0 with projection 2.1 for current opt-in input 1.1, or unchanged projection 2.0 for legacy input 1.0. Current grouping retains all exact records privately under their declared stream/operation, not one public row per validation stage. Source payloads, identity, precision, per-operation gaps/coverage and material versions remain source-bound; no missing state/checklist/readback is invented and no observer runs. The author still selects and interprets the story; conversion supplies no source call, business outcome judgment or semantic execution proof.

#### Scenario: Compact genuine feedback is expanded
- **WHEN** a reviewer returns compact references against the exact candidate-bound manifest
- **THEN** deterministic expansion losslessly restores the full packet/record with every original identity, passage reference and genuine judgment before the existing full validators run. Readable manifests/dictionaries and field/claim aliases do not remove text/rules/coverage; explicit full-format compatibility remains. Stale/missing/ambiguous/tampered references and duplicate JSON keys are rejected with bounded resource diagnostics, not truncated payloads, default judgments, repaired timestamps or invented source checks. Local byte savings, which can be negative on small packets, are not native latency measurements.

#### Scenario: The native host exposes a completed hand-back
- **WHEN** actual supplied agent, dispatch and parent identities correlate with a supported complete native response
- **THEN** capture preserves that exact response through the supported completed async handback/turn-ending receipt and parent correlation, or the separate strict legacy assistant-end-turn format. Launch receipts, incomplete/superseded work, mixed-agent data, nested source/tool payloads and unsupported formats fail capture rather than trigger polling/path guesses or review repair. Caller-supplied files are not authenticated native proof. Unsupported capture retains complete genuine JSON through the ordinary handback/Write fallback and validation, without a formatting-only model retry, guessed identity or fabricated clock.

#### Scenario: The factual checker uses a source index
- **WHEN** the packet supplies claim/event/artifact references and supported targeted-read suggestions
- **THEN** the checker still makes its own authorized independent calls and obtains actual supported UTC read clocks, not cached capture/event time. Guild from_id means AFTER, not older-event pagination. Unreachable history, unavailable clocks or rejected index remain private limitations with honest business uncertainty; complete candidate context remains available, and neither cached content nor an index becomes a source call, new permission or confirmation.

### Requirement: Review prompt controls live in the header and the document scrolls
The application header SHALL place the included prompt state and review control
in its upper-right area. The page SHALL NOT retain a fixed bottom prompt footer
or reserve space for it. Public wording and iconography SHALL describe feedback
and prompts, not ecommerce. All existing item identities, exact technical fix
payloads, draft/edit/remove/copy behavior and manual submission boundaries remain.

The ordinary document viewport SHALL scroll the timeline. The scenario content
SHALL NOT be a bounded vertical scroll container. Wheel input over ordinary
header, queue, timeline and surrounding page regions SHALL scroll the document
when scrolling is possible. Necessary native modal/textarea scrolling remains
allowed. Responsive headers SHALL NOT conceal focused controls or prevent access
to source artifacts and feedback dialogs. This requirement supersedes the earlier
fixed-footer and inner-panel scrolling requirements, not the source or privacy rules.

Compact application headers MAY remain sticky only when safe for the viewport;
narrow/tall headers SHALL use normal flow rather than conceal content. The scenario
heading SHALL NOT introduce a second sticky overlay. Full names/source content
SHALL wrap, with keyboard focus and native dialog access preserved.

The duplicate visible `Claude Prompt · 0 items` heading SHALL be absent. The numeric
counter, actual count-change animation, live accessible status and Review prompt
control SHALL remain. This presentation change SHALL NOT remove accessible prompt
identity, in-memory feedback, disabled-empty behavior or manual copy/paste boundaries.

#### Scenario: The user reviews a long timeline from any page region
- **WHEN** a long timeline is displayed on a desktop, narrow or short viewport
- **THEN** document scrolling moves its contents with the cursor over ordinary page regions, no inner timeline scroller traps the wheel, the header exposes prompt state without shopping language, and all content and controls remain reachable.

#### Scenario: Included feedback remains exact after the layout change
- **WHEN** comments, correct-result feedback and a supported technical fix are included, edited or removed
- **THEN** the header count and review control reflect those exact items, the existing dialogs preserve draft cancellation and manual copy behavior, and local Dismiss does not alter included feedback or source evidence.

### Requirement: Select the operation story by goal and specification, not implementation mechanics
The timeline SHALL show goal-relevant external interactions and internal processes
explicitly required by the original application specification when actual evidence
establishes their result or attempt. Selection SHALL depend on purpose, not a
service name, a fixed list of transformations, a tool classification or whether
an external write occurred. Distinct goal-relevant input, specified-process and
material-change purposes SHALL remain distinct. Missing historical evidence SHALL
NOT be replaced with an invented selection, transformation, actor, time or cause.

Implementation-only validation, housekeeping, diagnostic retrieval, transport and
reasoning SHALL remain private. Validation SHALL NOT appear as a separate event,
a renamed event, or an explanation in another row, source disclosure, concern,
dialog or copied prompt. Public business uncertainty SHALL remain honest without
describing the private collection/checklist procedure. Verbatim business artifact
content SHALL NOT be rewritten to enforce this metadata boundary.

#### Scenario: An internal process is an explicit part of the application goal
- **WHEN** the original specification explicitly requires a process and actual source evidence establishes its result or attempt
- **THEN** it is eligible as its own meaningful step, distinct from a separate input interaction and resulting change; a specification pointer alone does not prove execution or semantic relevance.

### Requirement: Attach material results to their business action using grouped operation evidence
Current opt-in postrun input 1.1 / projection 2.1 SHALL bind each operation's exact
stream, operation ID, actor, session, target and source records into one occurrence.
Each operation SHALL declare `goal_action`, `specified_process` or `supporting`.
A specified process SHALL reference original specification text and actual record
1.1 `process_result` evidence, not a promised or inferred process. Supporting
occurrences SHALL be unselectable by both draft assembly and snapshot validation.
Original input 1.0 / projection 2.0 and record 1.0 SHALL retain their original
closed contracts; current draft 1.4/snapshot 1.10 remains unchanged.

The `process_result` requirement applies to this grouped structured-console path,
not a claim that structured logging is the ONLY admissible evidence. Under existing
ordinary bundle semantics, actual retained native source interactions or process
results MAY support separately authored goal-relevant occurrences. Missing historical
1.1 emission SHALL NOT cause the author to ignore actual native evidence, invent a
new console record or expose validation limitations as public story. A specification
pointer alone still proves neither meaning nor execution, regardless of source route.

The collector SHALL complete ordinary native-source enrichment before author handoff
and bind any projection to the exact final independently retained bundle, preserving
its bundle/projection hash identity. The author SHALL NOT rewrite protected collector
input or invent a console emission to change eligibility. An ordinary protected
artifact MAY compare two actual captured states of the SAME physical target with
both exact source references and uncertainty retained. Such comparison SHALL NOT
claim immediate pre-write state, absence of intervening writers or exclusive
causation, override projection 2.1 missing-state/overlap guards, repair an invalid
past log, reconstruct missing material or fabricate a process result.

Requests, receipts and observations SHALL remain separate private evidence, not
separate public validation events. An actual resulting version and its supported
diff SHALL belong to the action that changed the material, not the observation
procedure. The occurrence SHALL use an honest enclosing source time window rather
than backdate later evidence into an exact earlier time. Source records, content,
redactions and qualifications SHALL remain unchanged. Request fragments and
acknowledgments SHALL NOT become stored-version cards or comparison baselines.

The grouped path SHALL accept at most one actual observed material result per
operation, rejecting ambiguous multiple observations rather than choosing one.
Supported nonmutation source-selection material MAY attach to its own meaningful
interaction; a specified-process step SHALL NOT force a duplicate content card.
For projection 2.1, generated collection/checklist-gap mechanics SHALL remain private
while source uncertainty is conveyed in business terms. Original gap detail and
protected artifact bytes SHALL remain unchanged; this is not blanket word censorship
or automatic migration of legacy 2.0 presentation.

For current snapshot 1.10, private proof-channel coverage-gap metadata SHALL be
projected to human business uncertainty, and whole authored supporting-detail
paragraphs about validation procedures SHALL be omitted rather than partially
rewritten into new claims. This authored-metadata projection SHALL leave protected
source/artifact strings unchanged and SHALL NOT introduce a new schema or relax
the marked-console 2.1 validation boundary.

#### Scenario: Two successive material changes have complete source evidence
- **WHEN** actual continuous same-target operation evidence establishes an initial state and two later material states
- **THEN** each action contains its own exact resulting version/diff, with the later change compared against its supported predecessor, and no private validation event or explanation is displayed.

#### Scenario: Material evidence is missing or operations overlap
- **WHEN** a state is unavailable or different operations overlap on the same physical target so their material cannot safely be assigned
- **THEN** continuity is broken or ambiguous material is omitted with honest business uncertainty, never an invented baseline, final-state fallback, false exact time, silently widened source access or implied causation.

### Requirement: Preserve the passing operation-story replay as an isolated regression eval
The plugin repository SHALL provide the `operation-timeline-replay` case with
fictional source-only session fixtures and case-local mocked external services.
Its original specification SHALL explicitly require two source selections, two
internal processing steps and two material changes. Genuine-shaped native child
results SHALL establish the processing evidence without invented console records.
The fixtures SHALL retain actual empty, first and later content states, separate
mutation requests/receipts from observed material, and contain no preauthored
timeline, draft, claim judgments, reviewer approval or generated HTML.

The case SHALL resume one already-started synthetic test through its existing
completion receipt, forbid another application start or input, and require the
normal source-bound production snapshot and matching renderer output. Its local
verification command SHALL check seven distinct ordered business units, both
source-exact comparisons attached to their changes, public validation privacy,
manual feedback controls and unchanged offline security. Missing baseline or
processing evidence SHALL fail the relevant check rather than invent a state.
Graders SHALL combine matching output files, the actual verification-command
witness, its structured result and semantic public-story checks. The agent-visible
verifier SHALL NOT be represented as a tamper-proof security boundary.

#### Scenario: A regression drops a requested process or the initial comparison
- **WHEN** the generated story folds a source-backed explicitly requested process into a later change, omits the actual initial baseline, or surfaces implementation validation
- **THEN** the case fails the corresponding verification or story criterion even if an HTML file exists; an empty creation card or a manually authored substitute is not success.

#### Scenario: Local case validation does not authorize a billed evaluation
- **WHEN** fixture, scaffold, verifier, unit and browser checks pass locally
- **THEN** those results remain local evidence, external services stay mocked, existing cases are unchanged, and a paid native eval requires separate authorization rather than being claimed as already run.

#### Scenario: UX changes are displayed from the successful native input
- **WHEN** the verified native core replay passes before the four requested presentation refinements
- **THEN** the production renderer uses that exact immutable successful snapshot for a new presentation-only HTML file, preserving its factual digest and genuine private judgments without a new application run, model review or approval; the user receives the actual file and an honestly qualified display result.
