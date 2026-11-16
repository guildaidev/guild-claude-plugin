# Smoke-test feedback: grouped skill-definition changes

## Sources and scope

- [Notion feedback](https://app.notion.com/p/smoke-test-feedback-58fc3e1ce8dc82cc8e8e01a64cea58d6): general notes, two failed attempts and the eventual handoff.
- [Figma feedback page](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/ADLC-feedback-UI?node-id=115-2440): all eight current comment threads, anchored to screenshot `115:2441`.
- Original isolated smoke-session logs, read as data only, supply context for failed generation, delayed presentation and source-event selection.

This round updates **skill definitions and their local instruction tests**. It
does not regenerate screenshots, change the renderer/schema, implement a packaged
progress server, rerun a paid eval, mutate source applications, post replies or
reload the running terminal. Existing annotated references and prior work remain.

The user's follow-up corrections apply throughout: generalize source-interaction
selection beyond articles and artifact placement beyond documents. Domain names
below identify feedback anchors, not hard-coded product rules.

## A. Waiting, progress and reliable delivery

Owner: delivery/progress subagent. Main assets: development skill and visualization
`completion.md`, `parent.md`, `hosts.md`, `progress.md`, `delivery.md`.

| Feedback | General rule |
| --- | --- |
| Open a loading page immediately | Open a current-run progress surface before lengthy generation; distinguish it from the completed feedback UI. |
| Engaging progress and current activity | Use truthful coarse activities and accessible/reduced-motion-aware animation, not fabricated percentage completion or reviewer internals. |
| Do not get stuck on imperfect checks | After bounded attempts, deliver a conservative useful evidence-backed page without fabricating approval, changing genuine records or bypassing the checked-snapshot contract. |
| Do not ask the user how to repair generation | Handle internal format/review recovery privately; reserve questions for real access, permission, cost or user-owned choices. |
| Do not advance while review is pending | Preserve logical blocking and exact current-run identity, including asynchronous host dispatch. |

Browser-only local progress updates are distinct from assistant polling of task
transcripts. No new server/helper API is claimed to exist. Preserve the exception
for a batch where every scenario fails technically and none completes without an
execution error, plus bounded attempts, source privacy and external-write limits.

## B. Goal-relevant timeline and artifact placement

Owner: narrative/evidence subagent. Main assets: editor/effects/style/checker
references and the three packaged role definitions.

| Figma thread | Feedback anchor | General rule |
| --- | --- | --- |
| `2008572507` | Missing article selection | Include observed interactions with external sources that materially select, obtain or change information integral to the application's goal. Internal housekeeping and arbitrary reads remain out. Never invent the missing action. |
| `2008572621` | Duplicate document body | Place each artifact at its meaningful content/effect step, across all artifact types. Avoid identical payload repetition at creation/return/lifecycle steps; preserve materially distinct versions and useful before/after changes. Do not delete source records. |
| `2008572748` | Technical “returned” result | Describe supported human/application outcomes, not implementation return values that do not matter to the goal. A returned link alone is not proof of creation. |
| `2008572415` | Irrelevant preview aside | Omit incidental tester/plumbing context from event prose. Preserve a consequential mismatch or failure in the appropriate business concern/evidence rather than concealing it. |
| `2008572016` | Extra step qualification label | Default event metadata consists of step number, timestamp and icon beside brief event prose. Keep necessary uncertainty in truthful wording and relevant evidence, not a repeated status label. |
| `2008572208` | “Source unavailable” label | Remove redundant default-row qualification labels without inventing confirmation or hiding material missing evidence. |
| `2008572074` | Comment control text | Use the explicit action label **Add comment**, retaining keyboard/touch accessibility. |
| `2008572274` | Source link text/style | Use a button-like accessible source link naming the actual service, e.g. **Open in Google Docs**; indicate full text only when the displayed capture is truly truncated. Never invent a URL or service identity. |

Follow-up: **“When there is a change in content, show a diff-style green/red
highlight UI.”** Define this for all artifact types: source-backed additions in
green and removals in red, with accessible non-color markers. Preserve content
and context; never fabricate a missing comparison version. This round specifies
the behavior without claiming a new renderer diff widget exists.

These are instruction requirements, not a claim that old checked copy or current
renderer labels have already changed. Captured artifacts remain verbatim; claims,
times, source references and causal limits remain attributable.

## C. Plain, private and focused conversation

Owner: conversation subagent. Main assets: visualization skill and
`conversation.md`.

| Notion feedback | General rule |
| --- | --- |
| Language is too technical | Use plain business language in chat and the feedback UI. |
| Never expose generation workings | Keep roles, review budgets, formats, rules, digests, diagnostics and generation logic private. Coarse human progress labels are the explicit narrow exception. |
| No verbose final summaries/caveats | Give a short truthful handoff to the UI and explain manual prompt paste-back; do not duplicate the timeline or private diagnostics in chat. |
| One thing/question at a time | Ask only a necessary user-owned question, preferably through supported multiple-choice input. Do not ask review-debugging questions. |
| Unrelated cleanup during waiting | Defer unrelated cleanup, copy-shortening or next-version suggestions. Do not delete externally created artifacts without authorization. |

The requested “I've opened your feedback UI” wording requires actual presentation
evidence. When opening cannot be confirmed, provide a concise honest artifact link
instead of claiming success. Required authorization or access failures remain
real boundaries, not permission to conceal a blocker or invent an estimate.

## Verification boundary

Local tests can check packaged references, consistency, safety language and
existing deterministic behavior. They do not establish fresh native model
compliance, live progress operation, user visual acceptance or comment replies.
The final verification record is appended to `visualization-validation.md` after
the delegated changes are integrated.
