# Evidence bundle 1.0, author draft 1.4 and source-bound snapshot 1.10 contracts

## Current 1.10 rendering contract

`draftContract` is closed draft **1.4**; `snapshotContract` and `candidateContract`
use **1.10**. Draft 1.3 continues to assemble its original 1.9 contract. Header policy
1.1 and the normal full UI remain. Assembly copies
the original sanitized bundle into required private `source_bundle`. Every render
validates that bundle plus copied source identity, workflow/scenario specs, actors,
sessions, evidence, run metadata, coverage, occurrence metadata/selection accounting
and attached artifact bytes. Only authored prose/title/run prose fields may differ
where assembly already allows them. Source binding is not semantic fact checking
or cryptographic authentication of the collector's source data.

Content/source/safety validation is separate from review quality. Optional `review`
and `copy_review` are genuine private JSON diagnostics, not required approval tokens;
optional `copy_review_iterations` is private orchestration only. `validateCopyReview`
and `validateFactualReview` still reject malformed, incomplete, stale and non-independent
records. `optionalReviewRecords` classifies them without editing them. Only matching
valid records contribute source qualifications/status. Invalid or stale records
remain private and never become confirmation. `factualDigest` includes the exact
source bundle/content and excludes both records/count/display, never source identity.

After bounded quality work, the content is good enough: the normal packaged
renderer produces the full shadcn/cart/dialog/diff UI even if review feedback is
revise, malformed, incomplete or absent. No alternate layout, limited-evidence mode,
handcrafted fallback, fabricated pass or public generation caveat. Known factual
uncertainties remain business-qualified; unsupported success is never authorized.
See delivery.md for the two-copy and three-render bounds, sequential native waits
and exact-target presentation.

`inspect.mjs finalize CANDIDATE NEW_SNAPSHOT [COPY_RECORD_OR_-] [FACT_RECORD_OR_-]`
creates a private exclusive new snapshot after content/source/safety validation.
JSON records are preserved unchanged with private validity diagnostics. Unreadable/
non-JSON files are left untouched and recorded as invalid diagnostics, never repaired
into approvals. `render.mjs SNAPSHOT NEW_HTML` uses the same full UI. Progress `ready`
validates the resulting normal HTML against exact snapshot/renderer bytes and run
identity, independently of optional review approval.

All 1.0–1.8 contracts retain their historical read-only behavior and original review
requirements. Historical drafts 1.0/1.1/1.2 still assemble 1.6/1.7/1.8 explicitly.
Never downgrade, relabel historical input or preserve a stale binding as valid.
The description-refresh utility below remains an explicit historical 1.7→1.8
one-shot operation; it is not the new-run path and cannot reset old budgets.

### Authored concern and two-part suggested fix (1.10)

Timeline `concern` is optional and closed: `{explanation, evidence_refs, claim_refs}`.
Its plain-English explanation connects the supported event behavior to a possible
conflict with the application's stated goal. It is not an enum, duplicate event
description or private review diagnostic. References name existing evidence and
claims. Source binding treats this field as authored prose, never a source edit.

Optional `suggested_feedback` is closed: `{action_id, explanation, text, evidence_refs,
claim_refs}`. It requires a concern and an allowed `flag_issue` action. `explanation`
is the plain STE-style human fix; `text` is the separate technical implementation
prompt, limited to 10,000 characters. All three authored strings enter the copy
inventory and factual digest. The technical prompt alone enters the cart through
“Add suggested fix to prompt”. This never executes, approves or persists a change.
Unknown remedies are omitted, with a truthful disabled fix control. Dismiss affects
only local visibility. Original 1.9 inputs retain their original closed shape;
never relabel them or invent human explanations from old technical prompt text.

### Source-backed artifact versions (1.9 and 1.10)

`assembleCandidate(bundle, draft, { artifactVersionSource })` optionally accepts a
private **collector** sidecar; it is not an author content override. The unchanged
bundle remains embedded as `source_bundle`. The snapshot retains the exact sidecar
as `artifact_version_source`. Both enter the existing factual digest. Drafts before
1.3 do not accept this extension. Draft 1.4 uses the same source-bound projection
in 1.10; original 1.9 behavior remains unchanged without this extension.

The closed sidecar has `schema_version: "1.0"`, `bundle_digest` (from exported
`artifactVersionBundleDigest(bundle)`), `records` (additional normal evidence
records, with unique IDs that cannot replace original evidence), and nonempty
`versions`. Each version has `id`, `artifact_id` (an original artifact),
`occurrence_id` (the meaningful source world-action step), `operation`, and
`value_ref`. References are closed `{evidence_id, pointer}` objects: RFC 6901
pointers into original or additive evidence **content**, not code or filenames.
Unknown properties, free authored content, nonexistent references, conflicting
baselines, duplicate artifact/step slots, cycles/forward predecessors, reversed
known event times, stale bundle bindings and out-of-bounds indices fail. Successive
versions require strictly ordered, nonoverlapping known occurrence windows.
An external capture must fall within its attached step's known time window;
future, earlier or unknown-time readbacks cannot be retrofitted onto that step.

Operations are closed and provider-independent:

- `capture`: copy the referenced string or JSON state. No base/index is allowed.
- `append`: append referenced text to the prior version or exact `base_ref` text.
- `insert`: insert referenced text at exact numeric `index_ref`, with explicit
  `index_base: 0` or `1`. Indices count UTF-16 units and cannot split a surrogate.
- `replace`: replace the prior/base text with referenced text.

The immediately preceding supplied version of the same artifact is selected
automatically. Optional `previous_version_id` may assert that identity, never skip
it or suppress its before-state. `base_ref` is only for a first mutation and must
resolve to captured text; missing baselines never mean an invented empty string.
Optional `readback_ref` must reference complete external-record content exactly
equal to the projected result. No trimming, whitespace normalization, invented
separator, prefix slicing or provider-specific interpretation is performed.

Payload evidence must associate with the occurrence by evidence ID or the same
captured source system/record ID. When request and receipt are separate records,
optional closed `operation_binding: {request_ref, receipt_ref}` references their
matching nonempty operation IDs. The request reference must come from the payload
record, and the receipt must associate with the occurrence. This establishes
record consistency, not authenticity. Available external target IDs and URLs
must agree with the occurrence and original artifact. Baselines need an associated
earlier same-target occurrence; an unrelated source cannot supply a before-state.

Projection automatically attaches `version:<id>` at each selected meaningful step,
replaces that step's original attachment for the same artifact, and retains every
other attachment unchanged. Assembly maps derived artifacts to the step's existing
claim references. A first material version shows its actual content without a
manufactured empty diff; subsequent textual versions always carry the exact prior
`before` and new `after`, even when the author did not request a diff. Structured
JSON states remain structured. Kind/title/media/source URL come from the original
artifact. Additional evidence is copied exactly and passes normal safety checks.
`validateSourceBinding` independently reruns projection and compares every copied
record, attachment and derived artifact byte. Derived fields are not editable.

Every projected field remains an excerpt and preserves relevant source redactions,
including predecessor and receipt qualifications. Selecting a title or arbitrary
field from a complete source record does not establish complete artifact content.
Reconstruction remains an excerpt with a human source limitation; accepted requests
are not silently promoted to observed state. Exact agreement with a later readback
does not establish mutation timing/causation or a contemporaneous earlier readback.
A direct captured record without a matching known event window is rejected.
Collectors/reviewers must establish that the operations belong to the same target
and that no intervening mutation is missing; the projector cannot authenticate
source captures or infer arbitrary provider semantics from JSON. Source content is
never executed. Keep sidecars private, preserve originals, and use the unchanged
normal renderer and bounded review flow—not an alternate rendering mode.

## Historical 1.8 contract (supersedes historical 1.7 guidance below)

Historical closed draft **1.2** assembles snapshot **1.8**.
The bundle remains **1.0**. Current assembly preserves the original complete
workflow/scenario specifications, source IDs/times, artifact payloads and selected
event relationships. Draft context_copy permits only the existing run prose
overrides. Historical draft 1.1 explicitly assembles 1.7; draft 1.0 assembles 1.6.
No historical contract, reviewed word, review binding or budget is migrated.

Current closed `header_copy` contains:

- application_name: one or two whitespace-separated words (HEADER-1).
- workflow_purpose: <=120 Unicode code points AND 16 words (HEADER-2).
- scenario_name: <=6 words (HEADER-3).
- scenario_description: nonempty, <=200 Unicode code points AND 30 words (HEADER-4).
- claim_refs and description_claim_refs: nonempty arrays of existing claim IDs.

scenario_description replaces starting_context/observed_result; those fields are
not permitted in 1.8. It is a BRIEF GENERAL PRESENT-TENSE summary of scenario
setup/task/intended behavior, preferably ONE concise sentence, two only if needed.
It is NOT what happened in this run or a reliability/source-review disclaimer.
Actual observed results/status remain in run/timeline. Reviewers assess semantic
tense, brevity and grounding; no regex pretends to parse English tense/sentences.

All four strings enter copyFields and both review packets. Both genuine complete
reviews bind the whole new candidate and all references. Current copy rule versions
are `SUMMARY_HEADER_COPY_RULE_VERSIONS`: unchanged ASD/Economist/SDLC v2 plus
header_copy **1.1**. Header passages use Economist (or unresolved/blocked), not ASD
or source exemptions. Product findings use header_copy and HEADER-1..HEADER-4.
Read [header policy 1.1](style/header-copy-v1.1.md). Numeric validity is not approval.

### Explicit description-only refresh

`scripts/description-refresh.mjs` accepts the exact last completed reviewed 1.7
snapshot and its matching fact packet. `descriptionRefreshPacket` rejects any
packet whose candidate/digest does not match. The author emits exactly this closed
payload once: `{schema_version: "1.0", scenario_description, claim_refs}`. The
payload claim_refs become description_claim_refs. No other authored field is an
author output. `generateDescriptionOnce` writes an exclusive private immutable
claim BEFORE invoking the callback. Invalid output, callback failure or an existing
claim stops; there is no retry or author revision after feedback.

`cachedDescriptionProjection` removes only reviews/orchestration, new schema/
authorship identity (schema_version/editor_id/snapshot_id), and replaced/new
description fields. Every other property, authored business string, reference,
source and artifact stays identical. Cache digest and unaffected field-digest
proofs must match before review. Historical copy/factual records remain provenance,
never whole-candidate approval for the new digest. Obtain genuine complete matching
checks and preserve unresolved findings. At most two fresh copy claims/checks share
one stable new invocation budget; no text change or old-budget reset is authorized.

### Public projection is separate from private review contracts

No generation machinery may appear in UI, expanded technical/source details,
dialogs, cart or composed/copied prompt: no reviewer records/checks, roles/models,
rules, iterations/verdicts, editorial findings, schema/candidate/digest metadata or
nonapproval notices. Public serialization omits these, rather than hiding them
with CSS. The hidden validated feedback context may retain binding identities and
candidate_digest required for safe cart validation. Public prompt includes the
scenario description, full original business context, run/scenario IDs, selected
step/outcome, human source limitations and included feedback—not private bindings.
Private genuine records and all stale/role/source/factual/two-copy gates remain.
Human source conflicts/gaps stay visible; raw source/artifact bytes are not edited.
This supersedes every historical public copy-notice/reviewer-dump instruction.

The document viewport scrolls the timeline; the scenario is not a bounded scroll
container. Prompt count and review controls occupy the application's upper-right
header, without a fixed bottom bar, reserved footer space, shopping words or icons.
Only compact desktop headers remain sticky; narrow or tall headers scroll normally
so they do not obstruct content. Focus, disclosures and dialogs require actual
desktop/mobile/reduced-height geometry checks. Reduced-motion support remains
separate from normal-motion count animation checks. Genuine empty artifact text
remains an internal baseline rather than an empty content card; additions and
clearing edits still display source-backed green/red differences.

## Shared structures and retained 1.7 reference

The source structures and review gates below remain applicable unless the current
section explicitly supersedes their version/header/public-presentation semantics.
References below to “new 1.7” or draft 1.1 describe that historical release only;
current new-workflow admission uses 1.10/draft 1.4 and the policy above, while
original 1.9/draft 1.3 inputs retain their closed contracts.

`../scripts/contracts.mjs` is the executable contract, exported as
`bundleContract`, `snapshotContract`, `copyReviewContract`, `copyFields`,
`validateCopyReview`, `validate` and `factualDigest`. It uses
closed objects (unknown fields fail), required fields unless marked optional,
and explicit enum values. See `../tests/fixtures.mjs` for a complete synthetic
bundle and checked snapshot. This replaces, rather than supports, the old draft
generator schema. Empty arrays are valid unless the executable contract specifies
a minimum. Never manufacture identifiers, timestamps, outcomes or source reads.

## Evidence bundle

- `schema_version: "1.0"`, `bundle_id`.
- `workflow`: title, intended_world_effect, relevant_systems; optional id.
- `scenario`: id, title, trigger, initial_conditions, expected_outcome.
- `run`: id, workspace_id, agent_version_ids, application_version,
  sandbox_integrations, status, observed_resulting_state, source_refs; optional
  execution_label. Status supports running/completed/failed/partial/cancelled/unknown.
- `actors`: id, label, kind (agent/person/external_system); optional workspace_id
  and agent_version_id. `sessions`: id, workspace_id, level
  (top_level/child/unknown), agent_actor_id, source_refs; optional parent_session_id.
- `evidence`: id, kind, source (system, optional record_id and url), captured_at,
  sanitized JSON content, completeness (complete/excerpt/summary), redactions;
  optional occurred_at. Observation time is not event time.
- `occurrences`: id, kind, actor_id, description, outcome, evidence_refs,
  artifact_refs, relationships; optional session_id, time, world_effect,
  workflow_relevance. Kinds: session_started/session_terminated/agent_world_action/
  external_world_action/supporting_activity. Outcomes:
  confirmed/failed/partial/unconfirmed/unknown. `time` has either `at` or bounds
  `earliest`/`latest`; omitted means unknown. Relationships identify another
  occurrence, relation (caused_by/responds_to/follows), basis
  (observed/inferred/user_supplied) and evidence_refs. World effects identify
  system, change and optional target. External relevance identifies explanation,
  basis and evidence_refs. Inferential relationships are not observed causes.
- `artifacts`: id, kind, title, media_type, evidence_refs, completeness
  (complete/excerpt/metadata_only), redactions, change
  (created/modified/sent/unchanged/unknown); optional content, structured_content,
  source_url, before, after. Content is always treated as text, never HTML.
- `coverage`: optional observation_window (from/through), gaps
  (id/description/affected_refs/impact), data_origin (observed/synthetic/mixed).
  Empty affected_refs means a coverage-wide gap. Unknown levels require a gap.
- `presentation`: logical parent_conversation_ref, interaction_target, and
  allowed_actions (id, kind, label); kinds are mark_run_correct/flag_issue/
  request_rerun. No delivery endpoint, executable callback or credentials.

Use "unknown" text with an explicit coverage gap for unavailable context that
has a required text field. Missing versions need source access, not a made-up
version: if no exact agent version is available, return incomplete handoff and
ask the parent to resolve it. Execution infrastructure is opaque to this skill.

## Render snapshot

### Current operation timeline projection 2.1; retained source projection 2.0

See [operation-timeline.md](operation-timeline.md) and
[artifact-capture.md](artifact-capture.md) for current postrun input 1.1, source
projection 2.1, optional record 1.1 `process_result`, and their closed bindings.
Original record 1.0, postrun input 1.0 and projection 2.0 keep their original
contracts. The normal draft 1.4/snapshot 1.10 shape is unchanged.
Group the request, receipt and material observation of one declared operation into
one source-bound occurrence with an honest enclosing time window. Only its actual
result owns the artifact/diff, never the request fragment or a separate validation
event. Supporting operations are private and cannot be selected into the snapshot.
An explicitly specified internal process requires original specification references
and actual `process_result` evidence; a resolvable reference alone does not establish
semantic relevance. Missing states and overlapping same-target operations remain
gaps, not permission to infer content, timing or causation.

The retained source protocol below supplies transport proof, privacy/size bounds
and executable commands shared by the current operation projection.
`session-evidence.mjs` exports validateSessionEvidence, encodeSessionEvidence,
consoleEvidenceEnvelope, collectSessionEvidence, assessSessionEvidenceCoverage and
projectSessionEvidence. Required nonempty projection requirements retain the
build-time source/stage/minimum-count/material checklist; missing expected evidence
becomes deterministic coverage gaps, never a reduced success checklist.
`projectArtifactVersions` dispatches projection 2.0 or 2.1 only after exact bundle-digest
binding; original projection 1.0 remains unchanged. Projection 2.x records is an
empty array: actual console envelopes live in the immutable original bundle's
session_event evidence, not model-authored replacements. Bindings require exact
occurrence evidence, actor/emitter/version, service/target, session, sequence and
time support. Incomplete material never supplies an inline version. Sequence and
material gaps extend source-bound coverage deterministically. Captured text stays
exact; structured JSON uses deterministic display serialization with an explicit
qualification and unchanged original structure in evidence. Only matching complete
stage/stream/target versions without sequence gaps supply a diff. Acknowledgments
never become readback. This is source consistency validation, not authentication,
independent factual verification or a guarantee of complete session retention.

Use `schema_version: "1.7"` for new candidates/snapshots. The evidence bundle stays
1.0. Retain common bundle context, evidence, actors,
sessions and presentation. Snapshot `coverage` contains only the optional
observation_window and gaps (id/description/affected_refs): **omit data_origin
and gap impact**. These are not HTML input fields. Source evidence remains
unchanged; the bundle's internal origin metadata is not a standalone UI label.
Replace occurrences with selected `timeline` and
`omitted_occurrences` (id/reason); do not copy internal traces onto the timeline.
Timeline events retain the occurrence fields, add claim_refs and supporting_detail,
and disallow supporting_activity. Lifecycle requires a known top-level session.
Selected relationships must refer to selected events. The assembler preserves
relationships, not silently dropping references to omitted occurrences. Select
eligible referenced events or report the selection limitation if safe assembly
is impossible. Keep supporting context in detail and artifact references inline.

In 1.7 (also historical 1.5/1.6), an event with a recorded failed or partial outcome may optionally include
`suggested_feedback: {action_id, text, evidence_refs, claim_refs}`. All references
must exist; action_id must name an allowed flag_issue action. Text is authored,
nonblank and at most 10,000 characters. Its factual basis and proposed remedy need
explicit claims and evidence, independent factual review and copy review of the
exact text. It is a suggestion, not an executed fix. Omit it when the sources do
not support a remedy. The renderer never infers one from an error or a Figma demo.
Changing the suggestion or any of its bindings invalidates both review digests.

Add snapshot_id, editor_id, parent_agent_id, summary, claims
(id/text/evidence_refs), artifact_claims (artifact_id/claim_refs),
`display: {"compact": false}`, `copy_review` and factual `review` below. Final
snapshots also require copy_review_iterations (1 or 2), attached from the latest
matching local claim. Candidates omit this orchestration metadata. Use complete sentences and
include claims for factual context, summary, events, artifact contents and any
supporting assertions. The hash binds **all** factual fields, including prose,
IDs, presentation labels and evidence. It is not proof that a statement is true
or that an agent really made the logged reads.

### Required authored header copy and product policy 1.0

Snapshot/candidate 1.7 requires the closed `header_copy` object, independent of
the unchanged full `workflow` and `scenario` specifications:

- `application_name`: nonempty plain display name, one or two words (HEADER-1).
- `workflow_purpose`: nonempty brief why, at most **120 Unicode code points AND
  16 whitespace-separated words** (HEADER-2).
- `scenario_name`: nonempty distinguishing name, at most six words (HEADER-3).
- `starting_context`: nonempty relevant starting situation/task (HEADER-4).
- `observed_result`: nonempty supported end state, including uncertainty/failure
  where appropriate (HEADER-5).
- `claim_refs`: nonempty array of existing claim IDs grounding the whole header.

Words are nonempty whitespace-separated tokens; code points include whitespace.
Checks do not normalize, truncate or invent text. Starting/result components
should form two or three plain sentences; no punctuation-counting rule decides
this. All five strings enter `copyFields`, both packets and both final reviews;
the candidate digest also binds claim_refs. References validate mechanically;
the factual checker must independently assess whether their sources actually
support every header assertion. A short alias is not an official identity; do
not invent completion, delivery, readership, triggers, absence or causation.

These human-experience passages require Economist or unresolved/blocked, never
ASD or protected-source exemption. Apply SDLC v2 followed by the separate
[header product policy 1.0](style/header-copy-v1.md). These are UI budgets, not
ASD sentence limits imposed on Economist. Assembly, packet preflight and
claim-copy reject over-budget headers **before consuming either dispatch claim**.
The full original specs have no new UI budgets and remain in existing evidence
details and composed prompt. Renderer, queue, browser title and feedback context
use the exact reviewed short fields; the new visible description joins starting
and result without an `Expected:` prefix. Legacy wording is not rewritten.

### Compact author draft and deterministic assembly

The author writes a closed draft with `schema_version: "1.1"` and these fields:

- snapshot_id, editor_id, parent_agent_id, summary.
- Required header_copy with exactly the fields and budgets above.
- claims: `{id, text, evidence_refs}`.
- events: `{occurrence_id, description, claim_refs, supporting_detail}`; optional
  `suggested_feedback` has the same closed shape and requirements as above.
- artifact_claims: `{artifact_id, claim_refs}`.
- omitted_occurrences: `{id, reason}`.
- Optional artifact_titles: `{artifact_id, title}`.
- Optional display: `{compact}`.
- Optional context_copy: only the named prose overrides below. Each section and
  each listed field is optional:
  - run: execution_label, observed_resulting_state.

All listed arrays except artifact_titles are required. Unknown fields fail. This
draft version identifies author input, not a reviewed snapshot or evidence bundle.
The author selects events/omissions and explicitly writes header/prose/claims.
New draft 1.1 cannot override workflow/scenario specs. Use context_copy only
for the listed run prose before review, never to alter facts or metadata.
Do not put source
evidence, copied lifecycle fields or fabricated timestamps into the draft.

`node /absolute/skill/scripts/inspect.mjs assemble BUNDLE DRAFT NEW_CANDIDATE`
invokes deterministic `assembleCandidate(bundle, draft)`. It preserves source IDs,
times, actors, evidence, artifact before/after and other metadata while assembling
the selected timeline and explicit prose overrides. It applies the documented
snapshot projection, such as removing bundle-only coverage origin/impact. It
does not author prose, choose relevance, classify style, apply suggestions or
produce either review. Do not reserialize the full bundle manually. Preflight
ALL assembled authored fields for source scope, semantic meaning, content routing,
the selected guide and final SDLC rules before the first copy-review call.

An explicit historical draft 1.0 still assembles 1.6, without header_copy, and
retains its named workflow (title/intended_world_effect), scenario (title/trigger/
initial_conditions/expected_outcome) and run prose overrides. This compatibility
path is not current workflow admission: new packet/claim/workflow commands require
1.7. `validateCandidate(doc, {legacy: true})` explicitly checks 1.6 assembly.

## Copy review

`copy_review`: reviewer_id, candidate_digest, rule_versions, verdict
(pass/revise/blocked), passages, exemptions and findings. Versions must match
`HEADER_COPY_RULE_VERSIONS` in the executable contract and local references exactly
for 1.7: original ASD/Economist versions, `sdlc: "scenario-run-v2"` and
`header_copy: "1.0"`. Historical 1.6 retains `COPY_RULE_VERSIONS` without header
metadata; never restamp those reviews.
The copy reviewer is distinct from parent, author and factual checker.

`copyFields(candidate)` inventories authored prose and protected source fields.
Each inventory entry exposes field_digest: SHA-256 of its exact current field text.
For 1.7, each authored field needs one passage: field_path, field_digest, guide
(asd-ste100/economist/unresolved), routing_reason, final sdlc_review
(pass/revise/blocked), exceptions. Select by CONTENT, not UI location. Technical
internal processes use ASD only; world effects/human experience use Economist
only; apply SDLC afterward in either route. Never stack/fall back between guides.
Unresolved routing requires a blocked verdict. These records assert the reviewer's
decisions; schema validation cannot independently judge semantic routing or style.

Each protected field needs an exemption (field_path/reason). Captured source
names, artifact content/before/after stay verbatim. Authored captions cannot be
exempted. Raw evidence and structured payloads are not copy-editable prose.
Each 1.7 finding: field_path, field_digest, rule_group
(selected guide/sdlc/header_copy/meaning), rule_id, severity (required/advisory), explanation,
optional suggestion, semantic_risk (none/possible/changes_meaning). A finding
cannot apply the other guide. A pass requires complete field coverage, final
SDLC passes, no required issue, ambiguity or semantic risk. Copy the inventory's
field_digest into both passage and finding. Hashes bind exact text, not excerpts,
rewrites, normalized strings or serialized JSON. Do not include original_text in
1.7 passages/findings. Product findings use `header_copy` and the matching
HEADER-1..HEADER-5 field rule. Field coverage, routes, exemptions and semantic safeguards
are unchanged. Historical 1.2 feedback retains its full-text contract.

At most TWO copy-review calls are allowed per visualization invocation, including
corrections, resumes and restarts. After a valid first revise/blocked response,
the author explicitly revises source-grounded prose and assembles new candidate,
packet and response files for a second full review. Scripts never apply suggestions.
After a valid second review, freeze and display its exact text even if required
findings or revise/blocked remain. Preserve actual findings and verdict, never
manufacture a pass. Independent factual checking remains mandatory. Malformed,
incomplete, stale or non-independent review records still fail validation.
The parent supplies ONE stable INVOCATION_BUDGET_PATH for the whole visualization
invocation, for example OUTDIR/copy-review-budget.json. Without that supplied path,
stop with an unavailable-capability diagnostic. Do not guess a path or search the
home directory. Retain the same path and record across resumes/restarts. Never
delete, replace or rename claims or choose a fresh base path to reset the budget.

After preparing each copy packet, immediately before EACH native copy Agent/Task
call, run:

`node /absolute/skill/scripts/inspect.mjs claim-copy CANDIDATE INVOCATION_BUDGET_PATH`

The command validates the unreviewed candidate, then exclusively creates a new
0600 claim BEFORE dispatch. Claim schema 1.1 records max_copy_reviews=2,
copy_reviews_consumed=1 or 2 and candidate_digest. The first lives at the base path;
the second at `INVOCATION_BUDGET_PATH.iteration-2`. Neither is overwritten. Only a
fresh successful claim permits dispatch. Pass its returned claim_path to the
reviewer. A third returns `copy_review_limit`: stop dispatching without reset or
a different path. Other claim failures also stop. Claiming consumes the
call even if the native call throws, produces malformed feedback, aborts or never
completes. A successful claim must not be reused for a later dispatch after a
resume/restart. The record is retained even if dispatch never happened.

This is a local guard, not an agent dispatcher, copy approval or proof that the
host cannot bypass it. Author Write/Edit permissions remain unchanged; they do
not authorize changing the budget record. The copy reviewer only Reads the
supplied actual claim to confirm consumed=1 or 2, max_copy_reviews=2 and its digest.

## Factual checker review

The 1.7 factual contract retains the 1.2 ID-based shape and provenance semantics:
`review`: checker_id, factual_digest, checks, findings. There is no data_origin
field in the snapshot review or its checks.
Each check: id, checker_id, operation **read**, source_id, observed_at (UTC ISO),
result (read/unavailable). Each final finding: claim_id, check_refs,
finding (confirmed/qualified/conflict/unavailable/inconclusive), explanation,
gaps. Every claim needs exactly one final finding and its separate read trace;
every artifact needs a claim mapping. Nonconfirmation needs a recorded gap,
available inside “Evidence and technical details”, not a standalone event note.
Record failed authorized reads too. No invented calls to fill this structure.

The checker must independently make the calls; supplying a plausible trace is
not independent verification. The renderer checks internal consistency only.
Use source history for historical or causal claims; current presence alone is
not proof of creation by this run. Checkers have no write/retrigger authority.

Compute `factualDigest(candidate)` before dispatching it for review. It is
SHA-256 over canonically key-sorted JSON excluding review, copy_review, display and
copy_review_iterations (review/orchestration metadata, not authored candidate text).
Both reviewers return that digest for the SAME final candidate. Do not restamp
old findings. Any candidate change, including wording alone, invalidates BOTH
reviews. A necessary correction can use the remaining second copy iteration and
fresh factual review. After two, no further copy polishing; report any necessary
factual correction instead of rendering altered unsupported text. A display.compact repair alone can reuse the same
matching pair, within the shared three-attempt check/render bound. That bound
never permits three copy reviews. Review fields are excluded
from the content hash to avoid circular binding, not from contract validation.

`inspect.mjs copy CANDIDATE COPY_REVIEW` validates feedback structure and binding
without requiring a pass. `inspect.mjs fact CANDIDATE FACT_REVIEW` validates the
complete factual hand-back before attachment, without manufacturing copy approval.
Every 1.7 copy finding's field_digest must match its passage and the entire
inventoried field. Every factual observed_at must be a supported full UTC timestamp, never
a date padded with invented midnight. Source capture metadata used from a paired
read must be attributed with its clock-scope limitation in the findings. Missing
timestamp support is a capability diagnostic, not permission to invent a clock.
The author never fixes reviewer text, timestamps or digests. Malformed copy
feedback stops without another call. A factual checker may supply its own complete
corrected response for the unchanged candidate within the shared attempt bound.
Preserve complete revise/blocked responses, not just selected findings.
`inspect.mjs attach CANDIDATE FACT_REVIEW NEW_OUTPUT COPY_REVIEW INVOCATION_BUDGET_PATH`
attaches both actual returned records and requires a fully valid dual-reviewed
snapshot. It reads the latest matching claim to attach copy_review_iterations.
Count 1 requires a genuine copy pass; count 2 accepts valid pass/revise/blocked
feedback without changing its verdict. It never authors feedback or changes a digest.

### Focused packets and exact native feedback capture

`inspect.mjs packet-copy CANDIDATE NEW_PACKET` first validates the complete
unreviewed 1.7 candidate (schema, header budgets, credentials, identities and references). It writes
the full copy inventory, semantic evidence, exact rule versions, hashed local rule
texts and copy-feedback contract into one Read-friendly packet. `packet-fact`
writes the exact candidate, factual contract and checker instructions. These
packets neither classify passages nor verify facts. Do not paste their contents
into the delegation prompt again. Reviewers can Read additional context if needed;
the factual checker still makes its own authorized source calls.
Both packets include executable `header_copy_policy`, closed `header_copy_contract`
(patterns serialized as regex source strings) and `header_review` paths, claim
references, matching claims and source-review requirements. The copy packet also
retains the full original workflow/scenario specs in semantic_context; the fact
packet contains the complete exact candidate.

When the host explicitly supplies a completed agent's native task-output or
transcript path, use:

```sh
node /absolute/skill/scripts/inspect.mjs capture-copy CANDIDATE NATIVE_OUTPUT NEW_COPY_REVIEW ACTUAL_AGENT_ID
node /absolute/skill/scripts/inspect.mjs capture-fact CANDIDATE NATIVE_OUTPUT NEW_FACT_REVIEW ACTUAL_AGENT_ID
```

The narrow Claude Code JSONL adapter reads only that supplied file. It accepts
only the matching sidechain agent's final end-turn assistant text containing one
review object (optionally a whole JSON fence). It rejects incomplete/malformed
output, mixed identities, tool/source text, missing findings and stale digests.
It never executes a transcript, searches sessions, selects an earlier response,
invents feedback or replaces a digest. It validates before writing a new private
file and returns the actual findings plus a compact summary. This avoids having
the author generate a second copy of the review JSON. Feedback may say revise or
blocked; preserving it is not a pass. Final attachment/rendering still requires
both matching reviews. A genuine pass is required after one iteration; after two,
valid unresolved copy feedback is displayed, not represented as approval.

Claude Code documents subagent transcripts under
`~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`, but
availability and task-output paths vary. Never construct a path from that pattern
or scan other conversations. Use an exact host-exposed path, or the complete JSON
hand-back/Write fallback. The input file and its identity metadata alone do not
prove independent dispatch; native transcript/tool evidence remains necessary.
See [Claude Code subagent documentation](https://code.claude.com/docs/en/sub-agents#resume-subagents).

### Existing checked 1.0 / 1.1 / 1.2 / 1.3 / 1.4 / 1.5 / 1.6 snapshots

New inputs must follow 1.7; `validate(doc)` rejects missing copy review and old
versions. Renderer compatibility through `prepareRenderSnapshot` validates each
complete ORIGINAL contract and factual digest before any display projection.
Already factual-checked 1.0/1.1 snapshots retain `review_mode: legacy-factual-only`
and copy status not_performed. Validate 1.0 origin consistency, then drop its
origin/impact fields only for display without mutating source or restamping review.
The limitation remains inside existing technical details, not a new UI label.

Already dual-reviewed 1.2 snapshots retain their full original_text copy-feedback
contract and both original digest bindings, with `review_mode: legacy-dual-review`.
Never manufacture field-hash feedback or claim these historical reviews ran the
new 1.7 pipeline. Never save a display projection as newly reviewed 1.7, add a fake
copy pass, relabel a schema or restamp either review. Editing old prose still
fails stale-review validation. These paths permit honest re-rendering without
another model run, not a bypass for new-workflow 1.7 checks.

Historical 1.3 hash reviews validate their ORIGINAL SDLC v1 contract and digests,
with legacy-dual-review mode. They do not establish review against SDLC v2.
Historical 1.4 snapshots retain SDLC v2 and their original closed contract/digests,
with legacy-dual-review mode. They cannot contain suggested_feedback. Do not add
fixes to, migrate, relabel or restamp historical snapshots for this UI.
Historical 1.5 retains its original suggested-feedback contract and copy-pass gate,
without copy_review_iterations. Never relabel it to bypass that historical gate.
Historical 1.6 retains SDLC v2, two-copy claims/count and valid second-nonpass
display with genuine findings. Its closed contract rejects header_copy and header
policy metadata; it still uses full original fields and the `Expected:` description.
No migration, restamping or fresh source/model approval occurs on legacy rendering.
New 1.7 inputs require scenario-run-v2 and reject any artifact not referenced by a
selected timeline event (`detached_artifact`). There is no detached-card section:
the scenario has only its header and timeline. The assembler retains selected
event attachments only; supporting pages remain in the internal bundle/evidence.
Legacy detached source artifacts are disclosed as technical evidence, never cards.

Captured Markdown is formatted through a small inert escaped subset. Single sent
messages are full-width event attachments with no “After” label. Source-confirmed
Third-party effects should use a human-recognizable representation from their
system, not an API dump; see effects.md. This applies beyond chat to email, tickets,
calendar events, documents and spreadsheet changes. Use supported source-specific
layouts or the faithful neutral artifact fallback, never invented metadata or
unsupported renderer fields. Slack is the currently implemented specialized layout.
Slack messages use supplied channel/sender/time metadata and neutral placeholders
when absent. No invented avatar, reaction, person, delivery or readership state.

## Local feedback cart 1.0 and deterministic prompt

The Figma-aligned page contains one supplied scenario, step comments, an optional
reviewed fix, an explicit run-correct item, a fixed Claude Prompt bar and a review
modal. The queue does not invent sibling scenarios. Unknown or qualified findings
are not styled as passed. Comment drafts are excluded until Add to prompt; Cancel
and Escape discard them. Included comments, fixes and correct items can be edited
or removed before copying. Empty carts cannot be reviewed or copied. Reloading
clears the memory-only cart; there is no persistence or transport.
System typography and accessible text controls adapt the reference without new
remote fonts, images or network access; source artifacts remain unchanged.

`feedbackRuntime()` in `scripts/feedback.mjs` is shared by browser and Node tests.
It provides item/add/remove/validate/compose. Cart shape is closed:
`{schema_version: "1.0", items: [...]}`. Up to 100 nonblank items, each at most
10,000 characters; CRLF is normalized to LF and outside whitespace is trimmed.
Items carry item_id, kind (comment/fix/correct), action_id, intent_id, action,
snapshot_id, run_id, scenario_id, parent_conversation_ref, candidate_digest,
optional event_id, feedback, scope unspecified and execution not_performed.
Identity is bound to the supplied context. Item identity uses snapshot, kind,
allowed action and optional event; adding the same identity replaces it without
reordering, while a comment and fix on the same step remain distinct. Unknown
targets, duplicate identities, forged/stale bindings and extra fields fail.

Only explicit additions enter the final prompt, in insertion order. The composer
combines business scenario/description/original specifications, run/scenario IDs,
human source limitations, selected step text/outcome and current feedback with
fixed non-execution and clarification guidance. Parent/snapshot/digest bindings
remain hidden validated context, not composed/copied prompt content.
It uses no model, interpretation, inferred remediation or source-content changes.
Correct result is a request to preserve this behavior, not persisted approval or
golden-set promotion. Fix means a proposed request, not an applied change. Final
preview is read-only; edit included items, then review the regenerated prompt.
Copy only writes clipboard after a click, with a selectable-text fallback if it
fails. The user must paste and submit in the original Claude chat. No button sends,
executes, reruns, deploys, approves, updates a golden set or authorizes an external
write. The original parent must clarify ambiguous scope and obtain authorization
separately. The cart is not a source review or cryptographic authenticity proof.

## Safety and failures

IDs use letters/digits plus `_.:-`, maximum 160 characters. URLs must be absolute
HTTP(S), without userinfo, query or fragment. Strip signed-link credentials at
collection, not merely at render. Embedded images, scripts and active document
markup are not supported. Diagnostics contain field paths and repair guidance,
not rejected values. A defensive scan rejects recognizable credentials and
credential fields; it is **not** a general secret detector. The parent must
sanitize **before** any bundle/snapshot file is written.

`validate(doc, "bundle")` or `validate(doc)` returns `{ok, errors}`. Errors have
`path`, `code`, `message`, `repair`. A renderer success returns an HTML path,
not verification, presentation or intent-delivery success.
