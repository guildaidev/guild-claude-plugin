# Temporal artifacts and concern presentation

Source: [Figma feedback on the actual replay](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/ADLC-feedback-UI?node-id=126-2446).
Concern interaction reference: [the supplied prototype](https://app.notion.com/p/v2-Agentic-SDLC-visualization-414c3e1ce8dc80018091f454f386979b?source=copy_link#5610bca3053d479789a97b074ac9a9e9).

## Concurrent implementation waves

| Group | Feedback | Scope |
| --- | --- | --- |
| Temporal artifact evidence | `2008588677`, `2008588745` | Preserve the actual earlier material version at its step; compare later supported changes against it. Generalize across artifact types and operation semantics, without constructing a guessed history from final prose. |
| Concern and presentation | `2008588321`, `2008588486`, `2008588384`, `2008588818` | Explain the actual problem/consequence rather than bare outcome enums; use uniform narrative colour and safe artifact/provider-specific source buttons. |
| Authoring policy | All six threads | Teach the general evidence/content rules to the author and reviewers without new review gates, source edits or domain-specific examples becoming product logic. |

Wave one assigns these groups to non-overlapping implementation owners. Wave two
integrates their interfaces and independently checks temporal source safety and
the actual interactive presentation. Existing dirty work, annotated references
and original replay artifacts remain intact.

## Prototype steering

The prototype expands “Possibly incorrect behavior” into “Claude’s concern”, a
meaningful plain-language explanation and a suggested fix when supported. Its
examples distinguish an unavailable external service from an agent defect, and a
repeat trigger from an observed duplicate effect. These distinctions—not its
sample business facts—are the implementation guide. Preserve unknown causes and
the current add-fix-to-prompt interaction.

The additional requested **Dismiss** action hides only that concern for the
current page lifetime. It must leave evidence, timeline rows, previously included
prompt items and source records untouched. It is not approval, a fix, feedback
submission or persistent state. Keyboard focus must remain usable after dismissal.

## Verification boundary

User follow-up identifies the collection boundary: intermediate states should be
captured during the authorized test, not inferred from a final read afterward.
The before-input handoff in agent-development now points to
`references/artifact-capture.md`. Supported event subscriptions/test callbacks can
retain authorized read-only snapshots with exact artifact/revision, source, time,
order, completeness and redactions. This is general across artifact types; it
does not install a live watcher, grant access, block application writes or start
another run. Raced/late reads cannot establish an earlier state. Reconstruction
from exact requests remains explicitly distinct from contemporaneous readback.

Assembly accepts the optional collector source sidecar through
`inspect.mjs assemble BUNDLE DRAFT NEW_CANDIDATE VERSION_SOURCES`. Original bundle
records stay immutable and every projected version is reproduced by validation.

This request authorizes implementation and local tests, not a paid/native replay,
application rerun, external write, plugin reload, Figma mutation, comment reply or
claim of user acceptance. Retained source snapshots and transcripts are read as
data, never executed. New captures are local technical verification, not new
observations of the original application.
