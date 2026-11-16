# Conversation and handoff policy

The user is here to understand what happened and give feedback, not to manage
this skill. This current policy overrides historical instructions to announce
copy limits, explain internal failures or ask the user how to finish a review.
It does not waive completion, source/safety, privacy, identity or two-copy
boundaries. Optional invalid/stale reviews stay invalid private diagnostics, not
1.9 render gates. [completion.md](completion.md) owns bounded failure
handling; follow [delivery.md](delivery.md) for the bounded delivery policy.

## Public language and private work

Never expose or discuss skill inner workings with the end user. This applies to
public chat, progress pages, final HTML, source evidence panels, dialogs, the cart
and copied prompts. Do not surface bundle/ref terminology, author/reviewer/
fact-checker roles, copy budgets, iterations, schemas, digests, model choices,
capture details, semantic checks, review records, verdicts or internal constraints.
Do not explain why an agent failed those constraints. Keep that information in
private diagnostics and the internal hand-back to the parent, not a user-facing
technical-details disclosure. Do not copy diagnostic output into a public reply.

Use short, ordinary sentences about the work the user recognizes: messages,
documents, people, what changed, and what remains unknown. Preserve relevant
business terminology from the evidence; do not make the user learn platform
plumbing. “Review prompt” and “Review queue” can still name business actions.

Show actual source uncertainty where useful in the business-evidence UI. For
example, say “The message was found, but its earlier text is unavailable,” not
that a checker failed or that a review is unapproved. Do not invent certainty,
hide a business conflict or imply a source was checked when it was not. A source
gap is not a license to reveal generation machinery. Facts about the tested
business agent's actions are evidence; the review skill's own machinery is not.

## Progress without narration

Provide the immediate local progress page through the supported host flow when
available. Do not wait for a finished narrative before presenting progress.
Follow [progress.md](progress.md) for the packaged local progress helper and
[delivery.md](delivery.md) for bounded quality work followed by normal packaged HTML.
There is no alternate page or limited-evidence mode; host opening remains capability-dependent.
Use the documented commands; do not invent browser support or live update APIs.

The progress page may describe truthful human activities: gathering test evidence,
arranging the timeline, checking details, polishing words. Use an activity only
while it is actually happening. This limited high-level progress is allowed; it
is not permission to dump internal logic, roles, counters or failure details.
Do not claim a review is complete because its progress page opened. Keep browser
updates separate from assistant file/transcript polling for completion; use native
completion notifications or a supported blocking wait under completion.md.

The parent's normal waiting message is at most:

> I’m working on getting your feedback UI up and running.

Only if a reliable estimate is actually available may it append “It might take
# minutes or so.” Replace # with that grounded estimate; do not invent a numeric
ETA or send the placeholder. Do not repeatedly say “I’ll send the link when ready”
when the progress page is already open. Do not post technical status dumps or
repeated chat updates in place of that page.

## Finish the bounded review without cleanup questions

Complete a bounded useful review on your own within the existing gates. Do not
ask the user to choose fix wording, approve a second check, shorten the prose or
skip a review. Do not offer more internal review rounds or hide/fake approval.
Use completion.md's normal source-bound HTML after bounded quality work. Review
records are private diagnostics, not render permissions. Never reset consumed claims, fabricate
review responses or continue indefinitely to avoid a blocker.

Real authorization decisions remain the user's: authentication/access, cost,
external writes and changes of scope are not bypassed by “no cleanup questions.”
When such a decision or essential missing business information blocks progress,
ask one necessary question at a time. Use the host's multiple-choice input if it
actually exists, with sensible options and room for the user's own answer. If it
does not exist, ask one concise question in chat. Do not invent a tool, pretend
that free text was a supported choice control or answer on the user's behalf.
Internal review management alone does not require a user decision.

Defer unrelated Google Doc cleanup until the review flow is finished and the user
asks for it, or offer it later as its own timely choice. Never silently delete an
external artifact or infer approval to do so from review feedback.

## Handoff, not a second report

Once opening the completed feedback UI is observed, use only this successful
handoff in the original thread:

> I’ve opened your feedback UI. You can compose a prompt in it which you can then paste back into this thread to continue iterating on the functionality we’re building.

Say “opened” only when presentation was observed or the user confirmed seeing
the completed UI. An opener dispatch is not proof, and an open loading page is
not proof that the completed UI was shown. If only dispatch is known, say:

> Your feedback UI is ready: [Open feedback UI](ACTUAL_USABLE_LINK). I couldn’t confirm that it opened.

Replace the placeholder with the actual safe, usable artifact link. If opening
failed but the UI exists, give the same concise honest link; do not imply it was
shown. Do not paste a raw filesystem path as the handoff. Never invent a link or
claim HTML exists when it does not. If no usable UI can be produced within the
bounds, state that task-level blocker briefly and follow completion.md; do not
make the user choose among internal repairs or continue the next iteration.

Do not append a long summary, caveats, source checks, fact limits, proposed changes,
session/version IDs, copy iterations or cleanup choices to a successful handoff.
Useful business evidence and uncertainty belong in the UI; internal diagnostics
belong in private records. The user's job now is to use the feedback UI, not to
answer cleanup, rewrite or shortness questions. Copying a prompt is intent only,
not execution or automatic delivery; preserve the existing action approvals.

## Verification boundary

This is instruction policy, not a runtime, renderer, schema or host implementation.
Static policy tests check that these instructions remain discoverable and explicit.
They do not prove native agent compliance, browser opening, local progress updates
or the absence of metadata in generated runtime output. Report those limits in
private validation records; do not claim fresh native behavior was verified.
