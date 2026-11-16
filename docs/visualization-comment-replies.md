# Figma comment replies — drafts, NOT POSTED

## Current replacement drafts — description-only refresh (14 November 2026)

**Posted replies: zero.** Task 18.5 is still blocked by the connector's absent
post/reply operation; no workaround, thread resolution or deletion was attempted.
The drafts below supersede the historical drafts later in this file. All old
pages, comments and evidence remain retained. Task 8.1 still requires explicit
user visual acceptance; screenshots and local checks do not supply it.

Current references are on a NEW page:
[scenario description and sticky header](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?page-id=95%3A1508),
[desktop](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=95-1513),
[whole-scenario feedback](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=95-1525),
[prompt](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=95-1530),
[mobile](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=95-1547),
[mobile scrolled](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=95-1564),
[short mobile scrolled](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=95-1568).
Fourteen raster references show the current UI; local example feedback is labeled,
not delivered or persisted. Source uncertainty and the application-version
disagreement remain in business/source details without generation-process dumps.

### Current thread-specific reply text (ready for supported/manual posting)

| Thread | Replacement draft |
| --- | --- |
| 2008381372 | This is the preset inserted by “Add to prompt as correct”, about the whole scenario—not a timeline event or someone else's comment. The included card explicitly names that origin and scope. Step comments stay below their step. The cart starts empty; inclusion does not save or approve the run. See the whole-scenario reference. |
| 2008381207 | Comment controls now use genuine outlined shadcn Buttons, with visible hover/pressed/focus states and mobile touch targets. Local checks cover keyboard opening, Escape, return focus and controls staying below the sticky header. See the desktop and mobile references. |
| 2008381139 | The count now has a stepped mechanical-register animation for actual additions and removals. Edits/cancellations/deduplication do not animate a count change; reduced motion disables it. A 12.6-second real browser recording is attached in chat, showing both directions with local example feedback. The video was not imported into Figma. |
| 2008380898 | The recorded completed outcome uses a checkmark. It stays muted where the source evidence has limitations; failed, unknown or conflicting outcomes do not become passed results. Source uncertainty remains available in the details. |
| 2008380877 | Removed the redundant guidance and generation-process notices. The visible feedback controls carry the interaction. Public source details and prompt show business context and source uncertainty, not internal review records. |
| 2008380856 | The execution/version/workspace line is removed from the scenario introduction. Business source details retain those values and explicitly disclose the application-version disagreement. The header stays inside its own scrolling panel. |
| 2008380763 | The description now summarizes the general scenario in present tense, not what happened in one run: “A simulated morning trigger has the agent fetch two competitors' public Berlin offers for 20–23 November, two guests, and post a like-for-like EUR comparison to rental-market-intel.” Actual results stay in the timeline. Only this description changed; other business copy is preserved. |
| 2008380510 | The heading is “Berlin price comparison posted to Slack” (six words), kept exactly from the previous completed output. The full original scenario remains in source details and the prompt. See the current desktop/mobile references. |
| 2008379940 | The application name is “Rental Monitor” (two words), preserved exactly. Full original workflow and source identities remain available; earlier screenshots are untouched. |
| 2008379476 | The subtitle explains the job: “Compare competitor rental prices each morning and post a readable report to Slack.” It is preserved exactly, with the full original purpose available in source details and the prompt. |
| 2008386742 | The current screenshots show “Rental Monitor”, not the old long workflow title. This short display name is kept exactly; the original workflow specification and earlier annotated references remain intact. |
| 2008386697 | The current subtitle is “Compare competitor rental prices each morning and post a readable report to Slack.” It is 82 code points/13 words and is unchanged by the description-only refresh. The long original purpose is still available in source details and the prompt. |
| 2008386788 | You were right: the earlier description still narrated a particular run. The current description is one concise present-tense sentence about the general setup and intended behavior. Only that description changed; the other business content is preserved. The new page shows desktop/mobile states and the header staying within its own scrolling panel. Actual observed outcomes remain in the timeline. |

Private cost/cache/review evidence and remaining source limits are recorded in
`docs/visualization-validation.md`, not inserted into these public reply drafts.

## Historical drafts and evidence — retained, superseded above

File: `7yXu0y0ZfzZl7wfkXGP6oC`, iteration pages `70:1508` and `82:1508`.
Read all ten comments and checked again after implementation. Both responses
contained all ten root threads, no replies and no next cursor. No thread was
resolved or deleted. **Posted reply IDs: none.**

## Posting blocker

The connected Figma MCP catalog contains 44 tools and exposes `get_comments`,
but no create/post/reply-comment operation. Exact comment/reply searches and the
full Figma tool inventory confirmed this. `use_figma` is a design Plugin API,
not an exposed comment-posting API. No browser credential/cookie automation or
invented endpoint was used to bypass the limitation. These drafts are ready for
manual posting or a separately enabled supported reply connector.

## New references (all previous screenshots retained)

- [Default refresh](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=80-1510)
- [Whole-scenario feedback](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=80-1514)
- [Step comment](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=80-1518)
- [Prompt review](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=80-1522)
- [Mobile prompt](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=80-1526)

These are presentation-only references of the same checked synthetic native
input. Feedback in them is illustrative browser-local text, not new user
comments, model review, delivery, execution or acceptance.

## Thread-specific drafts

### 2008381372 — Where does this comment come from?

Anchor: `74:1522`, correct-result screenshot, x422/y445.

That text is the preset inserted when “Add to prompt as correct” is clicked; it
is feedback about the whole scenario, not a timeline event or a model comment.
I have made that explicit: the card now says “Correct result · Whole scenario”
and “Preset from ‘Add to prompt as correct’ · included by you”. Actual step
comments say which step they belong to and remain below that step. The cart
still starts empty, and including this preset does not approve or save the run.
See the new whole-scenario feedback reference (80:1514).

### 2008381207 — Comment buttons should look clickable

Anchor: `70:1509`, x1367/y363.

Updated these to genuine shadcn/ui outline Buttons with a visible border and
background, hover/pressed and keyboard-focus states, and 44px-high touch targets
on narrow screens. Keyboard opening, focus containment and Escape/return-focus
were checked locally. See the new default reference (80:1510).

### 2008381139 — Old-school cash-register animation

Anchor: `74:1518`, x62/y1093.

Added a mechanical register-style counter animation for actual additions and
removals, with stepped rolling/bounce motion and a split counter face. Edits,
cancelled drafts and deduplication do not trigger a new count animation. It is
silent, respects reduced-motion settings and has a hidden live count announcement.
Both directions and reduced-motion behavior were checked locally; the saved
screenshots are still images, not proof of animation or feedback delivery.

### 2008380898 — Use a checkmark

Anchor: `70:1509`, x328/y936, the session-ended marker.

Changed the recorded completed outcome to a checkmark. It stays muted when its
evidence is qualified; the qualified status and findings are retained. Green
terminal treatment still requires all associated findings to be confirmed, and
failed/conflicting/unknown outcomes do not turn into passed results. See 80:1510.

### 2008380877 — Remove this

Anchor: `70:1509`, x445/y308, the redundant comment-control guidance.

Removed the “Add feedback with the comment controls…” line. The visible comment
buttons and cart now carry the interaction without that extra instruction. The
required unresolved-copy notice is retained because this checked text still has
real outstanding copy feedback. See the new default reference (80:1510).

### 2008380856 — Remove junk after the description

Anchor: `70:1509`, x369/y251, the execution/version/workspace metadata line.

Removed that metadata line from the scenario introduction. Its exact execution,
application-version and workspace values remain inside “Evidence and technical
details”, so the known version conflict is not concealed or “fixed” by deleting
evidence. See the cleaner default reference (80:1510).

### 2008380763 — Plain explanatory description, Economist style

Anchor: `70:1509`, x433/y198.

The pipeline now requires separate authored starting_context and observed_result
in snapshot 1.7, reviewed under Economist, SDLC v2 and header product policy 1.0.
The new visible description combines them without “Expected:”. Local DOM/browser
tests verify those exact words and preserve the full original context in evidence
and prompt. One authorized fresh native run now produced that description on new
page 87:1508. It scored 6/7; final whole-copy verdict remains revise, with source
and grounding limits disclosed. This is not user acceptance or overall copy
approval, and the old 1.6 input is untouched. Draft only, not posted.

### 2008380510 — Short plain scenario name

Anchor: `70:1509`, x728/y135.

The pipeline now requires an explicitly authored scenario_name of at most six
words, independent of the full original scenario specification. Preflight enforces
that bound before a copy claim is consumed, and both reviews bind its words. Local
render/browser checks verify that name in the heading, queue, page title and
feedback context. The single authorized native run now visibly shows “Berlin price
comparison posted to Slack” (six words) on new page 87:1508. Result 6/7 and final
whole-copy revise remain, not acceptance. Old words are untouched. Draft, not posted.

### 2008379940 — Plain short application name

Anchor: `70:1509`, x334/y26.

Snapshot 1.7 now requires an authored application_name of one or two words,
separate from the full workflow title. The validator rejects the reported long
name before copy-budget consumption; both reviews bind the short name and its
claim references. Local rendered/browser tests verify the actual displayed name.
Exact agent identity and full specs remain in evidence/prompt, and old inputs are
not renamed. The single authorized native run now visibly shows “Rental Monitor”
on new page 87:1508. All header fields passed its copy checks, but whole-copy revise,
source conflicts and the 6/7 story failure remain. Draft only, not posted.

### 2008379476 — Show the agent's why, not “scenario run review”

Anchor: `70:1509`, x66/y61.

The pipeline now uses a separate authored workflow_purpose, capped at 120 Unicode
code points AND 16 words before review-budget consumption. Both reviews bind it;
local rendered/browser tests check the actual subtitle. The full original purpose
stays intact in evidence/prompt; the old 1.6 reference is not shortened or restamped.
The single authorized native run now visibly shows an 82-character/13-word purpose
on new page 87:1508. Header copy checks passed; final whole-copy revise and 6/7
story failure mean no overall acceptance is claimed. This reply remains unposted.

## New page 82:1508 — three follow-up drafts, NOT POSTED

All three anchors target group `82:1514`, image `82:1517`, on the retained
“Latest eval · shadcn refresh · 14 Nov 2026” page. The image begins 75px below
the group origin. That screenshot reused old 1.6 copy; no new approval is implied.

### 2008386742 — Previous application-title notes were not applied

You are right: the screenshot still used the old checked title. This is now a
pipeline change, not only guidance: closed draft 1.1 explicitly authors a separate
application_name, snapshot 1.7 enforces one/two words before either copy claim,
and both final reviews bind it. Local tests verify exact visible title/queue/prompt
mapping and reject the actual old long title without consuming a claim. The old
image/input is untouched. One authorized native run now displays “Rental Monitor”
on new page 87:1508; the screenshot is genuinely new 1.7, not restamped 1.6. Its
header copy checks passed, but whole-copy remains revise and the eval scored 6/7.
Source/claim-coverage limits remain disclosed. This reply has not been posted.

### 2008386697 — Purpose should be at most half as long

The 249-character/33-word source purpose was being used directly as the subtitle.
The new separate authored workflow_purpose is capped at 120 Unicode code points
AND 16 words, before copy-budget consumption. Both reviewers receive that field,
product policy and grounding; the renderer uses its exact reviewed words. Local
DOM/browser tests pass. Full original purpose remains in evidence/prompt, not
truncated. The single fresh native run now shows “Compare competitor rental prices
each morning and post a readable report to Slack.” (82 code points/13 words) on
new page 87:1508. Whole-copy still revises and story failed (6/7), not acceptance.
Old screenshots remain unchanged. Draft only, not posted.

### 2008386788 — Previous description notes were not applied

The new description no longer reuses the expected-outcome specification. Authors
must supply separate nonempty starting_context and observed_result, guided to two
or three plain sentences under Economist, SDLC v2 and header product policy 1.0.
Both reviews bind every word and claim reference; factual checking must preserve
uncertainty and cannot invent a completed outcome. The actual new description,
without “Expected:”, is covered by local rendering/browser assertions, while full
original specs remain available. The single authorized native run produced the
new two-component description on page 87:1508, after its first copy review required
shortening from five to three sentences. Header checks passed on review two, but
whole-copy remains revise. The checker also reported incomplete header claim_refs
coverage and a retained application-version conflict; the 6/7 eval is not acceptance.
Draft only, not posted.

## Fresh native follow-up — references and limits

One paid mocked native attempt ran after local verification; no retry followed.
Result **6/7**, **529 seconds**, **$1.9636303 including judges**, cumulative
**$16.3882804**. Snapshot 1.7/draft 1.1, header product policy 1.0 and both genuine
final review bindings were checked, and actual native HTML equals the frozen
packaged renderer byte-for-byte. No post-render text/review/source fix was made.

Twelve fresh raster references are on a genuinely new page:
[Fresh native 1.7 · 6 of 7 · 14 Nov 2026](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?page-id=87%3A1508),
[default](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=87-1513),
[prompt](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=87-1530),
[mobile](https://www.figma.com/design/7yXu0y0ZfzZl7wfkXGP6oC/Untitled?node-id=87-1547).
Old annotated pages 0:1/70:1508/82:1508 and all comments are unchanged. Illustrative
local comments/preset inclusion are labeled; nothing is sent/applied/persisted.
No failed native state, fix or duplicate-trigger case was invented. Unknown
application version despite source market-monitor-1.0, incomplete header claim_refs
and scenario-only trigger/release statements remain disclosed. The story judges
failed all votes; this is not overall copy approval, source truth or user acceptance.
**Posted replies: zero.** The unsupported reply capability still blocks task 18.5;
8.1 stays open. Full evidence: `docs/visualization-validation.md`.
