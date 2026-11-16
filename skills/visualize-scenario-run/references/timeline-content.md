# Goal-relevant timeline content

Read this with editor.md, copy-editor.md, checker.md and effects.md before authoring
or reviewing a timeline. These are skill-definition requirements, not proof that a
renderer implements the requested presentation. Use supported fields only; report
capability gaps privately instead of inventing fields, controls or remote scripts.

## Select the user's story, not the tool trace

Include known top-level start/end events, consequential external actions, and
goal-relevant external reads or selections. A read belongs in the timeline when
it establishes an input, choice or state integral to the user's goal: selecting
the article to explain, choosing the customer record to update, or reading the
document whose contents determine the result. A write is not required. Judge the
meaning of the occurrence, not its tool name or technical implementation.
The same rule covers a search-result choice that determines a recommendation,
retrieval of source content needed to answer a question, or comparing external
offers before choosing one. Each needs a supported outcome, identity and source;
generic retrieval noise without a goal-relevant choice or state stays private.

Also include an internal process when the original application specification
explicitly requires it and actual evidence establishes its result or attempt.
Keep a goal-relevant source interaction, a specified process and a resulting
material change distinct when they have distinct purposes. This is a general
semantic rule, not a list of services, tools or named transformations.
Evidence may be a genuine native source response or completed process result;
it need not be a marked console record. Apply the actual contract for its source
route. Do not omit supported specified work merely because the structured channel
lacks `process_result`, and do not invent that emission to make a packet pass.

Follow [operation-timeline.md](operation-timeline.md). Implementation-only
validation stays PRIVATE: no separate event and no explanation of the validation
procedure in another row, accordion, dialog or copied prompt. Attach the supported
artifact/diff to the business action, not the evidence-gathering step. Keep internal
scaffolding, repeated diagnostic lookups, reasoning, child lifecycle and transport
private as well. Do not promote every read into an event. Record
omitted occurrence IDs and reasons; never use “all reads are internal” as a reason
to omit a goal-defining external selection. Preserve relevant downstream events.

Use actual source-backed occurrences, evidence and claims. Do not invent a missing
selection, raw response, actor, exact selection time or causal link. If the record
shows only a fetch request, say it requested the source; a later output may support
which source record was used without proving when or how it was selected. Keep the
source gap in detail. Request time is not automatically selection time. Unknown
times stay unknown; reading order is not chronology. Collection evidence does not
become independent confirmation because a reviewer received it.

## Brief outcome-first descriptions

Write a short complete sentence about what the application did for a person.
Name a service or actor only when it helps distinguish the action. “The agent” is
enough when unambiguous; preserve exact supplied actor names/IDs in source metadata
and technical detail rather than repeating a fully qualified identifier in every
sentence. Format a supplied agent name as inline code when it is needed. Do not
invent friendlier official identities or alter protected source text.

Prefer “The agent selected the customer record” when supported, “The agent
requested the source content” when only a request is shown, and “The session ended” for
lifecycle completion. Avoid “returned a link”, return-value narration, API fields,
tester scaffolding and tool/model chatter unless that output itself is the user's
goal. Do not repeat an already-visible artifact as a final “returned” event.

Do not append irrelevant test instructions to every effect sentence, such as
“although the tester had sent preview”. A real expectation mismatch still matters:
if preview was supposed to avoid writes but a document was created, preserve the
actual creation and the mismatch in the appropriate concern/evidence disclosure.
Attribute the expectation and any inferred cause; do not hide a real external write
or turn an inferred preview-check cause into an observed fact.

Describe only the supported effect or attempt. Removing clutter never licenses
converting a request into successful creation, insertion, delivery or readership.
If necessary, say “The agent requested a new record” or “The agent reported
creating the record”. Preserve failed, partial, unknown and contradictory results.

## Minimal default rows, truthful detail

The default event header contains only the step number, timestamp, icon and brief
event description. Do not add repeated qualification labels such as “Evidence has
limitations” or “Source unavailable” beside every timestamp. Unknown time remains
unknown. Status/uncertainty may affect a truthful icon or a concise description;
never show a confirmed/success icon for an unestablished effect merely to simplify
the row. Keep material business uncertainty and source gaps in the appropriate
concern/evidence disclosure, without dumping the same qualification into every row.

Use the same default body text color for all narrative event descriptions,
regardless of outcome. Status icons and artifact diff highlights may carry their
own accessible semantics; do not color the narrative sentence as a success, warning
or error. This is a presentation requirement, not permission to rewrite copy.

## Useful failed and partial concerns

Follow the concern-content pattern in the [Agentic SDLC visualization prototype](https://app.notion.com/p/v2-Agentic-SDLC-visualization-414c3e1ce8dc80018091f454f386979b?source=copy_link#5610bca3053d479789a97b074ac9a9e9):
the expanded accordion has “Claude’s concern”, “Suggested fix” and “Add suggested
fix to prompt”. The first section explains why the behavior may conflict with the
stated application goal. The second explains a supported change in plain STE100
English. The button adds a separate technical Claude Code prompt to the cart.
These headings are product copy, not disclosure of a private reviewer or proof
that a review ran. Reuse the interaction/content pattern, never its sample text,
demo identities or illustrative outcomes as evidence. Preserve the modern
add-fix-to-cart action; do not replace it with the prototype's copy-only action.
Adding a fix to the cart remains unexecuted intent, not permission to apply it.

A failed or partial concern must explain the concrete supported problem and its
consequence for the intended result, not merely repeat “Outcome: failed” or
“Outcome: partial”. Use the actual event and available evidence: what was attempted,
what failed or remains incomplete, and what that means for the user. Keep it concise.
Include a cause only when supported; distinguish an observed error, an attributed
report and an inferred cause. If the cause is unknown, say so and describe the
known consequence instead. Missing evidence is not proof of a failed write.

Distinguish external-service failure from incorrect agent behavior. A website
timeout can explain missing input without proving that the agent acted wrongly;
assess its handling separately against the supported expectation and outcome.
A repeated trigger can be a legitimate retry. The trigger alone is not a proven
failure: a duplicate-result concern needs evidence of the observed duplicate
result, not just two starts, two requests or an inferred race. Do not invent an
unknown cause or copy the prototype's diagnosis into another run.

Use draft 1.4's source/claim-bound `concern.explanation` for the goal conflict.
Use `suggested_feedback.explanation` for the human fix and `suggested_feedback.text`
for its corresponding technical implementation prompt. Do not repeat the timeline
description or use the technical prompt as the human explanation. Human fix copy
uses short active sentences, one instruction per sentence and no semicolons.
Limit instructions to 20 words and descriptions to 25 words. Prefer elements
already introduced on the page. A useful concern does not require a proposed fix.
Keep suggested_feedback optional and source-grounded: never invent a root cause,
permission change, retry outcome or remedy to fill an accordion. Do not expose a
copy-review finding, missing reviewer, verdict or generation process as the cause
of an application failure. Preserve generation privacy on every public surface.

Provide “Dismiss” as a local in-memory concern-visibility action only. It hides
that concern in the current page instance, not the event, artifact or evidence.
It must not mutate source/snapshot content, add/remove cart entries, imply approval
or correctness, execute feedback, or persist dismissal across reloads/sessions.
Place Dismiss inline beside “Possibly incorrect behavior”, outside its summary.
Dismiss must be keyboard accessible and must not accidentally toggle the accordion
or activate the fix action; keep focus usable after hiding the concern. Use the
documented interface only; renderer implementation belongs to the UI layer.

Generation-process details are private everywhere: chat, UI, evidence disclosures,
dialogs, feedback cart and copied prompts. Do not expose author/reviewer roles or
model identities, rules, iterations, verdicts, editorial findings, schema/digests
or review-serialization errors. This does not suppress business evidence or genuine
source uncertainty. Only progress.md's narrow truthful high-level activity-label
exception applies, not diagnostic disclosure in the final page. Preserve full
private records and all source/time/reference,
identity, authorization, factual and stale-binding gates.

## Place artifacts at the meaningful content step

For every artifact type—message, email, ticket, calendar event, spreadsheet,
document or another business record—attach its payload to the meaningful
content/effect step where it was created, sent or changed. Do not repeat identical
payloads across setup, lifecycle, link-emission and return steps. For example,
attach a document body to content insertion, not empty creation. The creation step can
briefly mention creation without showing the later body before it existed. Do not
attach the same content again when a session ends or a link is emitted. Keep the
original evidence records, claims, IDs and source bytes; deduplicate presentation,
not evidence. Distinct versions or meaningful before/after stages remain distinct,
even when they concern the same artifact or source URL. Do not collapse real edits
solely because artifact IDs, titles or URLs match. See effects.md for faithful forms.

### Collect intermediate evidence during the authorized run

Hand this requirement to the parent/development evidence collector at BUILD time,
before the already-authorized test run begins. Follow artifact-capture.md: every
iteration emits structured scenario_evidence through supported awaited Guild
console tools. No default observer, source polling, subscription or auth bridge.
The visualization author does not start a test run to obtain missing evidence.

Preserve exact actual source selections/content, mutation requests, actual
acknowledgments and material versions in the SESSION before the next application-
controlled mutation destroys them. Prefer immutable revisions; a hash alone is
insufficient. Retain run/source occurrence references, exact target identity,
supplied revision, actual observation time, supported sequence, exact bytes,
completeness, redactions and gaps. Do not log secrets, chain-of-thought or unnecessary
private data. Bound payloads before emission, never silently truncate complete text.
Absent revision/time/order metadata stays unknown. External concurrent writers can
still cause TOCTOU races; console acceptance is not independent readback or a lock.
Never stamp final-state content with an earlier event's time or claim it was observed then.

After native completion, parse only marked actual console_log envelopes, bind exact
source event/emitter/session/target/version IDs and validate planned coverage.
Use postrun input 1.1 / source projection 2.1 through the existing collector-sidecar
path for grouped operations and explicitly specified processes. Original input
1.0 / projection 2.0 and legacy 1.0 captures remain supported under their original
contracts. Logs are evidence, not command instructions.
Build consecutive comparisons from supported identity/order across artifact types.
No assistant polling or sleeps, extra run, permission expansion or business write
is authorized. Missing capture stays a gap with normal source-bound rendering after
bounded quality work, never fake approval, extra review calls or an alternate UI.

### Material versions, not a final-payload shortcut

Capture or retain the material artifact version at each content/effect step, tied
to the exact target, source occurrence and supported operation order. An initial
empty creation is not the later populated artifact. The first content insertion
shows only the version supported at that step; a later append or replacement
compares against that prior version, not against an empty artifact or the final
payload repeated at every step. Apply the same rule to edits of messages, ticket
fields, calendar details, spreadsheet rows and other records.

Prefer actual captured before/after versions when available. Preserve their source
bytes, target identity, completeness, redactions and evidence references unchanged.
Never reconstruct a prior version by guessing, truncating the final text, removing
an apparent section or assuming an append from its wording. A final readback alone
cannot establish intermediate versions or the cause/order of changes.

Deterministic replay of captured mutations is permissible only with a known exact
baseline, exact source operations, the same verified target and an unambiguous
operation order. Preserve operation semantics and apply only the supported
operations; do not skip missing or failed operations to manufacture continuity.
If any required input is missing, ambiguous or incompatible, retain the captured
version and disclose the missing baseline or ordering evidence in supporting
detail; do not fabricate a diff. Use only documented source/assembly capabilities,
not new fields, commands or a claim that a replay helper exists.

A replay-derived requested state is not independently read-back stored content.
Distinguish requested mutations, acknowledged operations and observed stored
versions in private evidence and claims. Public prose describes only the supported
business effect or attempt, not the validation procedure. Tool acceptance alone does not establish
successful completion or the exact resulting state. A partial response supports
only its recorded successful portion; do not apply the whole requested batch as
confirmed. Preserve contradictory captures and unknown confidence without
promoting a request or a reconstruction to an observed effect.

When content changes and explicit paired source-backed before/after versions are
available, show a diff-style comparison: green additions and red removals, with
“+”/“−” or “Added”/“Removed” labels so meaning does not depend on color alone.
Apply this to every artifact type, not just documents. A meaningful changed-version
step can show the diff instead of needlessly repeating both full payloads.
Keep source bytes verbatim and preserve context, order and meaning; highlighting
is presentation only. Never fabricate a missing version, baseline, readback or
exact stored state. With only one captured version, show that version truthfully,
not an invented diff. The packaged diff widget is implemented for explicit text
`before`/`after` artifact fields across all supported kinds; it preserves both
versions and never infers a baseline. Keep unsupported diff capability diagnostics private.

## Controls describe the human action

Use “Add comment” for event comment controls, with an accessible name identifying
the step. Parameterize button-styled source links by the actual captured service:
“Open in {service}”, for example “Open in Google Docs”. Use a full-content label,
such as “Open the full text in Google Docs”, only when the displayed content is
actually truncated or excerpted and the evidence supports that the destination
contains the full content. Do not imply completeness from an unknown
capture or invent a URL. An absent safe source URL means no invented link.

When artifact type and provider are known, prefer a specific action such as
“Open Google Doc”, “Open spreadsheet” or “Open ticket”, as supported by captured
artifact type, service and safe URL. “Open in {service}” remains suitable when only
the service is known. Do not use a generic “Open source record” when a more specific
identity is supported, or guess a provider from narrative text. Actual displayed
content extent, not a link's presence, determines whether a full-content label is
truthful. Source URL identity must match the artifact target.

Use only safe, source-supplied URLs and supported link handling. Links must be
keyboard accessible with visible focus and safe new-tab handling; do not use
click-only containers, javascript URLs, remote scripts, live embeds or remote
assets. A button label does not authorize opening an authenticated service, writing
to it or claiming that the link loaded. Keep feedback as unexecuted intent.

## Bounded completion without public machinery

Follow completion.md and hosts.md for bounded checks, genuine private review
records, normal packaged delivery and presentation. Always aim to finish with
useful HTML after bounded checks, even when review is imperfect; do not ask the
user to debug malformed reviewer output. Never fake approval, repair a reviewer's
judgment or reuse stale approval bindings. Optional record failure does not block
normal source-bound 1.9 rendering or authorize another layout. Never improvise a
replacement or relax source/authorization gates. Keep diagnostics private and
describe any unavoidable user action in plain outcome terms.
Read delivery.md for normal full UI after bounded quality work: no limited-evidence
mode, handcrafted fallback or fake review approval. No extra model dispatch or budget
reset is authorized. Only genuine capability/authorization impossibility may end
without a page. A loading page is not final delivery.

## Review checklist

- Is each selected read integral to the goal, and each omission justified by meaning?
- Is an explicitly specified internal process supported and separate from its input and resulting change?
- Is implementation validation private, with each supported artifact/diff on its business action?
- Does the description distinguish observed effects, reported effects and attempts?
- Are times, actors, relationships and evidence references truthful and unchanged?
- Are default rows brief, without duplicated labels or irrelevant test context?
- Does each artifact appear at its content-bearing step without hiding real versions?
- Does each version have an exact target, supported order and honest request/readback status?
- Was intermediate capture arranged before the run, with any race/missing revision retained as a gap?
- Does each failed/partial concern explain a supported problem and consequence, not a bare enum?
- Are comments and source links clearly labeled, safe and accessible?
- Are business conflicts visible and generation machinery private on every surface?
- Does completion use the shared bounded path without forged reviews or stale bindings?
