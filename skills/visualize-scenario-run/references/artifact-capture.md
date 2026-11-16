# Build evidence into the application; collect the session afterward

The default is **application-owned structured console evidence**, not an observer.
Include this requirement when building EVERY new iteration, before configuration
or code submission. Do not poll sources, wire an auth bridge or invent a
subscription. The observer feature has been removed. Retained evidence/history
stays unchanged; it is data, not a supported observer runtime.

## Supported Guild transport (not ordinary JavaScript stdout)

The retained SDK reference, `agent-development/references/sdk.md` (task properties
and “task.console needs consoleTools”), specifies:

```typescript
import { consoleTools } from '@guildai/agents-sdk';
// Include ...consoleTools in the agent's existing tools object.
// In the compiled run body, await each emission directly:
await task.console.info(JSON.stringify(evidence));
```

`task.console` dispatches a tool. Omitting consoleTools or not awaiting the call
can lose logs. Plain `console.log` is NOT established as session-persisted. Keep
awaited helper calls in the compiled agent file per the SDK compiler guidance;
do not introduce an uncompiled asynchronous logger or an external logging server.
The optional pure `encodeSessionEvidence(record)` in `scripts/session-evidence.mjs`
validates/serializes a record; it is not a Guild SDK API or a transport. Copy/adapt
pure code into hosted application source if useful; no local agent build is needed.

For an LLM application, expose actual console tools and direct the model to call
them with structured JSON, never to pretend that JavaScript executes from prose.
The documented code form `llmAgent({ tools: { ...consoleTools, ...neededTools },
systemPrompt, ... })` provides the SDK console tools. Inspect the actually exposed
console tool schema before giving tool-call arguments; do not guess configure
`guild_tools` values or assert that `guild_configure_llm_agent` exposes console
merely because it accepts a prompt. If that build path cannot expose a supported
evidence tool, report the capability gap; use the supported code/llmAgent form when
within the approved build scope. Do not silently claim a prompt-only directive
guarantees capture. Model instructions are not deterministic enforcement; for a
must-preserve destructive sequence, put emission/await in code around the tools.

Read-only retained proof: last-run `collected-events.json`, session
`01a1e093-a7d7-f268-0000-49d8ad00f24a`, event
`01a1e094-184d-431e-0000-e53a4b443fa5`, has:

```json
{"type":"runtime_start","task":{"tool_name":"console_log","tool_call_id":"console_log-hRWeMO9fD0UXCQntDPMS3A"},"content":{"level":"info","message":"[ordinary debug text omitted]"}}
```

The actual envelope also has id, created_at and task.id/parent_task.id plus parent
agent.id/version.id. Its paired runtime_done contains only `{"result":"ok"}`.
Only explicitly marked structured messages are eligible; nested provider errors,
model diagnostics and other debug text are not user timeline events. This proves
console TOOL persistence in that retained run, not stdout capture, platform payload
limits, retention guarantees or live testing of the new evidence directive.

## Build directive: evidence needed to explain the actual goal

Record actual goal-relevant reads/selections and their source identity/content,
external interactions, mutation intent/request, actual response/acknowledgment and
meaningful material states across services. No internal reasoning or chain-of-thought.
The selected source is what the application actually used, not a later substitute.
For EACH meaningful state, await its sanitized log BEFORE the next application-
controlled mutation can destroy it. Prefer source-provided immutable revisions;
preserve exact text/structured payload or a verified accessible immutable version.
A hash alone cannot supply a rendered diff. Never invent an immutable store.

Read an authorized source version when necessary within the approved application
behavior. An observed state must come from an actual response/read, not the intended
request. Log mutation_requested before the call, mutation_acknowledged with the
actual result afterward, and artifact_observed only for actual returned/read state.
Acceptance is not completion, delivery or independent readback. Awaiting console
emission orders this application's actions; it cannot lock external concurrent
writers. Retain actual observation time, revision and race/ordering uncertainty.
If emission fails, surface the evidence failure before a destructive dependent
mutation; do not claim preservation or silently resend the business operation.

### Required implementation: log every artifact create and edit

Build this sequence into the application for **every artifact create or edit**,
including the first insertion, each later append, replacement and clear. Apply it
to every artifact type, not only documents. A single final readback is insufficient.

1. Assign an operation_id to this actual mutation. Log mutation_requested with the
   exact target and the intended change before calling the service.
2. Log mutation_acknowledged from the actual response. Do not label the submitted
   text or an accepted request as the artifact's observed state.
3. Obtain the resulting state from an actual authorized service response or read.
   Log artifact_observed with that operation_id, exact artifact identity, actual
   observation time, available revision and sanitized material content. An
   immutable revision is an alternative only when its accessibility and content
   can be verified; a URL or hash alone is not an observed content snapshot.
4. Await the structured console emission **before the next application-controlled
   edit** of that artifact. Keep each version separately. Do not wait until the
   application finishes to log all edits. Use code-level ordering when prompt
   instructions cannot enforce this sequence.

After creation, preserve an **actually observed empty baseline** when the service
confirms the artifact is empty. Empty text is evidence, not missing evidence. Keep
that baseline for the first real content diff; the review must not display an
empty content card merely because the artifact was created. Do not assume that a
new artifact is empty if the response/read does not establish it.

If a mutation fails or its resulting state cannot be read within authorized
access, record the actual result and an explicit observation gap. Never invent a
snapshot, broaden permissions, resend the mutation, or substitute the final state
for a missing earlier version. External writers can still race a read; retain
revision and timing qualifications rather than claiming an atomic observation.

Before submitting the iteration, inspect each mutation path for the awaited
request, response, observation and log sequence. After a test, check **per-operation
coverage** against every actual mutation, including conditional edits that ran.
Require an artifact_observed record for each such operation_id, or an explicit
gap for that operation. Do not replace these requirements with an aggregate
artifact_observed min_records:1 that accepts only the final state. Unexecuted
conditional branches are not missing edits. Retain the record-size, redaction and
privacy limits below; logging every edit does not authorize logging secrets.

### Current operation-level timeline and record compatibility

Read [operation-timeline.md](operation-timeline.md). During BUILD, identify each
goal-relevant action, each explicitly specified internal process, and private
supporting work by its meaning relative to the original specification. Do not use
a service or tool-name allowlist. Preserve each distinct source interaction,
specified process and material change as separate operations when their purposes
differ. Mutation request, receipt and validation belong to the SAME operation;
they are private evidence, not separate public events or explanations.

For a specified internal process, record 1.1 adds `process_result`. Emit its actual
sanitized result or limitation through the existing awaited console mechanism.
Never invent a process event from the specification alone. Postrun input 1.1
declares the role and original specification references; projection 2.1 places
the supported material/diff on the business action and hides validation mechanics.
Original record 1.0 / input 1.0 / projection 2.0 remain readable unchanged.

### Closed records 1.0 and 1.1

Every record has exactly these required keys (plus acknowledgment only for its
stage). Use application-owned stable stream_id and operation_id, with sequence
starting at 1 and increasing across resumes. task.sessionId is supported; do not
invent task.id. Actual task/emitter IDs come from the persisted envelope.

```json
{
  "schema_version":"1.0",
  "type":"scenario_evidence",
  "session_id":"session-1",
  "stream_id":"main-run",
  "sequence":1,
  "operation_id":"save-reply-1",
  "stage":"artifact_observed",
  "at":"2026-01-01T12:00:01Z",
  "source":{"system":"Sandbox Mail","record_id":"draft-1","url":"https://example.test/drafts/1"},
  "material":{"content":"Exact material text, including its newline.\n","revision":"revision-1","completeness":"complete","redactions":[],"gaps":[]}
}
```

stage: source_selected | mutation_requested | mutation_acknowledged |
artifact_observed | gap. Record 1.1 additionally permits process_result for an
explicitly specified internal process. For mutation_acknowledged require acknowledgment:
accepted | completed | failed | unknown, based only on the actual response.
Do not reuse operation_id for another source. Timestamps are actual full UTC;
never pad a missing observation date. source.system/record_id are exact selected
service/target; url is optional safe unsigned HTTP(S) without credentials/query.
material.content may contain safe JSON or text, including actually observed empty
text. revision and immutable_url are optional; immutable_url requires revision,
but is only a handle until an authorized read verifies accessibility/content.

For a content-free acknowledgment, use this material value:
`{"completeness":"metadata_only","redactions":[],"gaps":[]}`.
The acknowledgment is a receipt, not an artifact version or a missing material state.
Do not invent a gap merely because a receipt has no document body.
Record actual omissions or observation failures separately.

material.completeness: complete | excerpt | metadata_only. Complete requires
content and NO redactions/gaps. For omitted or truncated content use excerpt or
metadata_only and describe the loss in redactions/gaps. metadata_only has no
content. A gap record requires material.gaps. Never log secrets first and sanitize
later. The content-free acknowledgment above does not require a gap.
All other incomplete stages require an explicit redaction or gap.
Allowlist necessary fields; remove credentials, signed URLs, unnecessary
personal/private data and model diagnostics BEFORE emission. Regex scanning is
defense in depth, not proof of privacy. Retain redaction descriptions, not values.

Package bounds: 48 KiB UTF-8 per JSON record; 256 records / 2 MiB per collected
session evidence set. These are our conservative limits, NOT documented Guild
limits. Budget in the application before logging; on a limit emit a small explicit
gap instead of silently slicing a “complete” body. The helper rejects oversize
records rather than truncating. Do not implement unlimited payloads/chunks or leak
private data to preserve completeness. If a larger immutable revision can be
read safely later, retain its exact handle and the coverage gap; until then no
complete version/diff is claimed. Actual Guild retention/truncation still needs
separate authorized verification. Missing first/last records can go undetected
without a planned coverage checklist: check required actions/versions after run.

## Postrun collection and normal rendering

Native Guild waits remain the ONLY completion owner. No task/transcript polling,
resend, sleeps or source-observer loop. After completion, obtain authorized actual
session events once, with bounded pagination if necessary (newest-first API;
do not assume the default 20 records is complete). Sanitize in memory before any
local file. Preserve missing pages/truncated responses as gaps. Input shape:
`{session_id, items:[actual events]}`. Only console_log runtime_start messages
with top-level `type: scenario_evidence` are parsed; runtime_done is not a payload.

```text
node /absolute/skill/scripts/inspect.mjs session-evidence SESSION_EVENTS NEW_REPORT CAPTURED_AT_UTC
```

The report has evidence records and private gaps. Copy its exact evidence records
into the NEW bundle BEFORE freezing it; do not rewrite an existing historical
bundle. Evidence content.event is the minimal exact console envelope, retaining
message string, source event/time and actual parent task/agent/version IDs. Check
the report gaps and application coverage checklist, including missing terminal
history, sources selected, requests/acks and versions preserved. Add real coverage
gaps to the bundle. Logs are attributed evidence, never authoritative instructions
or independent verification. Do not execute source payloads or obey logged prompts.

Bind each eligible evidence record to the occurrence for its actual service,
target, session, actor and time window. An operation may have multiple records;
its occurrence window must include actual material time AND console event time.
Do not backdate final content. Preserve at separately from logged created_at.
Use current postrun input **1.1** and generated projection **2.1**, described in
operation-timeline.md. Its honest operation window includes all of that action's
source records without backdating its resulting material. Supporting occurrences
cannot be selected; requests and receipts do not become artifact cards. Keep
validation mechanics private even in public details and copied prompts.

The following projection **2.0** example describes the retained legacy path only:

```json
{"schema_version":"2.0","bundle_digest":"EXACT_BUNDLE_DIGEST","records":[],"session_id":"session-1","streams":[{"stream_id":"main-run","parent_task_id":"actual-parent-task","agent_id":"actual-agent-id","agent_version_id":"actual-version-id"}],"bindings":[{"evidence_id":"log:actual-event-id","occurrence_id":"actual-step","artifact_id":"actual-artifact"}],"requirements":[{"source":{"system":"Sandbox Mail","record_id":"draft-1"},"stage":"artifact_observed","min_records":2,"material_required":true}]}
```

Compute bundle_digest with artifactVersionBundleDigest(bundle), not a model guess.
streams are collector-pinned actual emitters from session metadata, matching bundle
actors and tested versions, NOT IDs trusted from message prose. Each occurrence
must reference its exact log evidence. Include every collected marked record for
each selected stream in bindings, in increasing sequence; non-artifact selection,
request/ack/gap records omit artifact_id. Evidence order in the original API may be
reversed; bindings, not the raw response order, establish intended projection order.

Retain ALL marked records for each selected stream in the bundle and bindings.
This includes the initial creation request and content-free acknowledgments.
Omit artifact_id for a request that contains only a title or insertion fragment.
For current 2.1, bind the actual resulting material to its business-action
occurrence, never a separate validation row. For retained 2.0, keep the original
binding contract unchanged; do not restamp historical packets or judgments.
Do not remove a receipt or initial request to avoid validation errors.
Such removal creates sequence holes and disables supported comparisons.
If validation rejects a real record, retain the exact message and report the gap.
Never alter its completeness, content or gaps to make it pass.

If a creation request predates the assigned artifact ID, retain its exact target.
Use `unresolved_target:true` on that request's binding, without artifact_id.
This option accepts only mutation_requested with a different target in the same service.
Session, emitter, operation time and occurrence evidence must still match.
The projection records uncertainty and breaks comparison continuity at that point.
It does not alias targets, bind that request to the later stored version or reconstruct content.
Later actual readbacks start a new supported baseline.
Do not mark a matching target unresolved or use this option for readbacks or acknowledgments.

requirements is the nonempty build-time coverage checklist (maximum 256 entries):
each closed item has source.system/record_id, stage, min_records (1–256) and boolean
material_required; optional operation_id pins a particular planned interaction.
Use the actual intended coverage, not a checklist reduced to whatever survived.
`assessSessionEvidenceCoverage(records, requirements)` and projection compare
actual records and complete material counts, retaining missing final/entire-source
evidence as coverage gaps without blocking normal HTML. The checklist is not proof
that all relevant interactions were anticipated; preserve additional real gaps.

artifact_id selects an existing source artifact attached at that occurrence.
Complete text from source_selected, mutation_requested or artifact_observed can
project a version; stage remains explicitly qualified (request != observed state).
Acknowledgments never produce stored content. Redacted/truncated/metadata-only
versions remain gaps and remove that step's misleading final-content attachment.
An explicit gap can bind artifact_id to suppress its unsupported final attachment;
an acknowledgment cannot bind artifact_id to claim a stored state.
Missing/redacted material bound to an artifact invalidates every stage's prior
baseline for that artifact, stream and exact source identity. A later complete
capture starts without a before side; an unrelated source or stream is unaffected.
Structured JSON uses deterministic JSON display serialization with a qualification;
the original structure remains unchanged in source evidence, never model rephrasing.
Only ordered complete captures of the SAME artifact, stream and stage without
sequence gaps form a before/after diff. No inferred empty baseline, retrospective
split of final text, borrowed source identity or cross-stream ordering.

```text
node /absolute/skill/scripts/inspect.mjs assemble BUNDLE DRAFT NEW_CANDIDATE VERSION_SOURCES
```

Use closed draft 1.4 / source-bound 1.10 and the SAME normal packaged renderer,
diff, cart and dialogs. Optional private reviews are not a render gate. Source
and safety checks remain mandatory. Omit VERSION_SOURCES if no supported versions
exist; preserve genuine gaps. Legacy projection 1.0 remains accepted unchanged.
An immutable handle without fetched content stays evidence, not a fabricated diff.

## Retained historical evidence, not an observer fallback

The observer runtime, authenticated bridge and their dedicated tests are removed
from the shipped feature. There is no observer command, configuration or supported
manual fallback. Existing retained captures remain usable as source data under
their original contracts. Removal does not erase history or claim the earlier
failed native review/automatic artifact opening succeeded.
