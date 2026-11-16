# Workflow operations, not validation traces

Apply these rules to every application and artifact type. Select events by their
meaning relative to the original specification, not by service, tool name or whether
an operation is technically internal. These rules introduce postrun input **1.1**,
source projection **2.1** and the optional console record **1.1** `process_result`
stage. Bundle 1.0, draft 1.4 and snapshot 1.10 remain unchanged. Original postrun
input 1.0 / projection 2.0 / record 1.0 remain readable under their original rules.

## Three general roles

- `goal_action`: a source interaction, selection or external effect integral to the
  user's intended result. Not every retrieval or write is automatically meaningful.
- `specified_process`: an internal process explicitly required by the application
  specification. It has a distinct supported result or attempt. Being internal is
  not a reason to omit this work; being a child call is not a reason to include it.
- `supporting`: implementation-only validation, transport, housekeeping, repeated
  diagnostic reads or other work that only establishes whether an action succeeded.
  Keep it private, not a timeline row or a public explanation of the action.

A goal-relevant source interaction, a specified transformation and a material
change are distinct operations when they have distinct purposes in the workflow.
Do not combine them into a single insertion or return-value sentence. Conversely,
do not split a single change into public request, acknowledgment and validation
events. The story describes the application, not the proof-gathering procedure.

## Build-time evidence, not invented story events

During each application iteration, declare an operation ID and role for meaningful
work. Preserve the existing awaited console emission, sanitization, size limits,
actual source identity, session/emitter pins, sequence, time and coverage rules in
artifact-capture.md. No observer, new service capability, tool or logging API is
introduced here. Logs remain attributed evidence, not independent confirmation.

For every material change, retain `mutation_requested`, its actual
`mutation_acknowledged`, and `artifact_observed` or an explicit `gap` under the SAME
stream and operation ID. These private stages establish the effect and material
version; they are not three user-facing events. Preserve a genuinely observed empty
baseline internally. A create acknowledgment alone does not establish emptiness.
An explicit initial content representation or separate actual observation can
establish that state; retain its exact material and source reference. Do not discard
needed material as transport metadata merely because its provenance is private.
Use that actual initial state as the first comparison's protected `before`, rather
than omitting the baseline to avoid an empty public card. The renderer hides an
empty card without deleting the state. Requested fragments are not stored state.
Await preservation before the next application-controlled change; retain external
writer races and unknown outcomes.

Bundle 1.0's ordinary artifact text fields reject whitespace-only values. Do not
delete a genuine empty observation to make that contract pass. Retain the exact
value in evidence and use the existing captured-field projection 1.0 when ordinary
native responses supply the versions: bind the initial capture and successive
captures to one artifact identity with exact evidence JSON pointers. Enclose each
capture in its actual operation window. The projection supplies the protected empty
baseline and following comparisons without changing bundle 1.0 or inventing text.
An internal initial capture can belong to creation or remain an omitted supporting
occurrence; it must not become a public validation row. See contracts.md. The
marked-console 2.1 route already retains its actual empty observations separately.

For an explicitly specified internal process, emit a record 1.1 `process_result`
containing its actual sanitized result or a truthful limitation. Use the supported
console mechanism already available to that application. Do not emit reasoning,
chain-of-thought, private model diagnostics or invented output. A source-selection
record is not the result of a transformation. A specification reference is not proof
that the process ran. Do not retrofit missing events into historical session logs.

Source URLs must satisfy the existing credential-free, query-free URL contract.
Keep necessary sanitized request parameters in material content instead; never
silently rewrite an already emitted invalid record to make it admissible.

## Evidence routes are not eligibility rules

The three roles describe the workflow, not a required logging channel. A genuine
native source response or completed child result can establish a goal-relevant
action or specified process without a marked `process_result` console record.
Read that actual source and its original specification. A missing console record
does not establish that the work did not occur or permit combining it with a later
write. A specification or expected result alone still cannot establish execution.

For such evidence, the collector may use the existing ordinary bundle 1.0 route:
retain source-linked, sanitized actual responses, source identities, real time
windows and coverage limitations. Define the distinct supported occurrences before
the author receives the independently retained bundle. The normal draft 1.4 and
snapshot 1.10 source-binding checks still apply. Do not fabricate console records,
edit protected collector data in the author, or relabel native output as an emitted
record. If combining ordinary occurrences with a 2.1 projection, finish collection
first and bind the projection to that exact final collector bundle.

An ordinary protected artifact may compare two actually captured states of the same
physical target, with both exact sources referenced. This describes differences
between those observations. It does not prove an immediate pre-write state, absence
of intervening writers, or exclusive causation. Preserve those limitations. Do not
infer a state from a request, reconstruct an earlier state from final content, or
override the 2.1 projection's missing-state and overlap safeguards. An invalid log
stays invalid; a separate genuine native source does not repair or authenticate it.

Keep collection-channel failures and proof procedures private. Public uncertainty
describes the business fact that remains unknown, not which record, checker,
schema or validation step was missing. Do not repeat those procedures in authored
supporting detail, concerns, source excerpts or the copied prompt.

Do not add caveats about unretained internal processing steps merely because a
specified process is visible. Explain a concrete business omission or uncertainty
instead. Keep that business information separate from private proof commentary.

The current 1.10 renderer omits redundant artifact-supporting envelopes, while
displaying the exact business artifact content. Other recognized native source
events expose their actual result, not the surrounding task/transport envelope.
The complete original records remain private and source-bound. Protected business
content is not word-censored. These presentation rules do not excuse a wrong story:
author business effects and uncertainty, never the procedure used to establish them.

## Postrun input 1.1 and source projection 2.1

Use the same private CLI:

```sh
node /absolute/skill/scripts/inspect.mjs postrun-package INPUT NEW_BUNDLE NEW_PROJECTION
node /absolute/skill/scripts/inspect.mjs assemble NEW_BUNDLE AUTHORED_DRAFT NEW_CANDIDATE NEW_PROJECTION
```

This section describes the marked-console route only. The input retains the
closed 1.0 root fields. Set `schema_version: "1.1"`; every
operation additionally requires `timeline_role`. A `specified_process` requires:

- `workflow_relevance.basis: "user_supplied"` with actual evidence references;
- a nonempty, unique `specification_refs` list pointing to original specification
  text, not a reviewer-generated rationale;
- a `process_result` checklist entry and an actual matching record. It cannot also
  contain a material mutation. Declare the resulting change separately.

Supported specification pointers are `/workflow/intended_world_effect`,
`/scenario/trigger`, `/scenario/initial_conditions` and `/scenario/expected_outcome`.
The pointed text must exist and be nonempty. The author and independent reviewers
still assess meaning; the validator does not prove that any arbitrary process is
required merely because a pointer resolves. Other operation roles cannot declare
`process_result`. All existing per-executed-operation coverage requirements remain.

Packaging groups each exact `(stream_id, operation_id)` into one occurrence. It
retains every original source record and reference. The occurrence time is an
honest enclosing interval from the first application timestamp through the final
source log instant, rounded outward to the supported precision. It is not an exact
mutation time. Never attach a later observation to an earlier point by backdating.

The generated 2.1 projection contains `operations` with `occurrence_id`, `stream_id`,
`operation_id`, `timeline_role` and optional `specification_refs`. All source bindings
remain exact. Only the resulting observation, a meaningful selected source, or a
gap owns a material slot. Requests and receipts do not become displayed artifacts.
More than one observation under a single operation is ambiguous; declare distinct
material changes and their exact operation IDs rather than choosing arbitrarily.

For each material action, display its supported resulting artifact and comparison
at that ACTION. Do not create an extra validation step. Consecutive exact states of
the same artifact, stream and source may form a diff only when ordering and coverage
support continuity. Missing states break the baseline. Overlapping operations on
the same physical target cannot assign a shared observation to one change, even
across streams: suppress the ambiguous attachment and retain the uncertainty.
An unrelated target remains independent. Do not infer a missing baseline or cause.

## Authoring and public/private boundaries

Use `authoring.timeline_operations` to interpret the grouped candidates. Each
operation is selected at most once. The `private_occurrence_ids` must be omitted;
the assembler and source-bound validator reject attempts to promote them.
Neutral packaging descriptions are not final prose. Write the supported business
effect or attempt, preserving uncertainty, without explaining internal validation.

The application may use its private observations as evidence for an insertion,
update, send or other business action. Do not mention that observation procedure
in the row, concern, supporting explanation, source disclosure, dialog or copied
prompt merely to explain why the action is supported. Do not rename the private
validation step or move its sentence into another visible accordion.

Projection 2.1 retains supporting and mutation-stage evidence privately. Public
details omit those raw validation records and envelope mechanics. Meaningful source
or specified-process content can remain visible when relevant. Exact business
artifact bytes, actual source identity and material business uncertainty remain
unchanged. No rewrite of protected content, fabricated confirmation or approval.

The grouping is source projection, not automatic narrative inference. Missing
selection, process result or material state stays missing. Do not invent a step
from its expected specification, rebuild a previous state from final text, alter
historical source records or claim that local fixtures prove native compliance.
