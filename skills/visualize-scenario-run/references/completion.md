# Blocking completion and presentation

Review is a dependency of the next development iteration, not background enrichment.
An agent launch receipt says only that work started. It does not mean that a
review finished, HTML exists, or the user has seen it.

Read [progress.md](progress.md) for immediate loading feedback and
[delivery.md](delivery.md) for bounded quality work followed by the normal packaged
HTML. Current draft 1.3/snapshot 1.9 separates source/content validation from
optional private review diagnostics. No alternate page or limited-evidence mode.
Authorization gates and historical read-only review contracts remain unchanged.
Current authoring is draft 1.4/source-bound 1.10. Read
[generation-performance.md](generation-performance.md) for the integrated local
helpers; they change data handling, not native completion or render admission.

## Technical-error exception: select before dispatch

For automatic agent-development review, first inspect the actual results of the
current test batch, not old runs or the pass/fail score alone. If ALL scenarios
ended because of a technical failure/error and NONE completed without an execution
error, do not dispatch a visualization editor, render or display a visualization.
Show the actual errors and session links in chat, then continue the authorized
fix/test loop until at least one scenario completes without an execution error.
This exception waives only the visualization gate, not required approval for a
change, billing, a new test or an external write. Preserve normal retry bounds;
if progress needs credentials, access, new scope or user input, report the blocker.
Do not bypass it or retry indefinitely.

Technical failures include a crashed execution, runtime/tool exception or explicit
infrastructure error that prevents scenario completion. A completed scenario with
failed business assertions, an unexpected result or a qualified outcome is NOT
automatically a technical failure. Pending work, ACTION_REQUIRED, missing results
and unknown status are NOT proof that all scenarios failed technically; use the
existing wait/action/blocker procedure, not this exception.

Once ANY scenario in the current batch completes without an execution error,
apply the blocking gate below to that eligible run before further iteration,
even if its business assertions failed. In a mixed batch, report technical errors
in chat and review an eligible completed run; do not substitute an older success.
This remains a one-run visualization, not permission to invent or merge scenarios.

## Parent gate

Before treating capability as a reason to end without HTML, apply hosts.md's
capability recovery procedure. An absent skill listing, unknown Skill name or
empty tool search is not a failed renderer invocation. Record what was actually
available, attempted and denied privately; distinguish discovery, author dispatch,
optional reviewers, Node/files, validation and browser opening. Use the installed
instructions and normal packaged commands when authorized, rather than claiming
that a review-page tool is unavailable. Do not bypass a real denial. Native launch
receipts still require completion; neither discovery recovery nor optional review
failure waives the exact-target, source/privacy, cost or presentation gates.

1. Pin one review target before dispatch: workspace, profile, scenario, tested
   application/agent versions and run/session IDs. Keep the approved output
   directory, original parent and stable copy-budget path with that target.
   Immediately create/show progress.html per progress.md before long collection/
   authoring work. A loading page is not the completed review. High-level truthful
   activities are the narrow public exception to private generation internals.
   When authorized, use finite foreground `progress.mjs start OUTDIR TARGET` and
   open its returned `live:true` loopback URL, not the static artifact path. Pass
   the same binding/sequence/live-open status to one editor writer; retain parent
   cleanup ownership through ready navigation/presentation and durable handoff.
   Static-only output must not be called live. Never read background logs to await
   startup or task completion; progress.md defines bounded IPC startup and cleanup.
2. Dispatch the editor in the foreground if the host supports it. Use only
   actual supported parameters; do not invent a synchronous-dispatch flag.
   If Agent/Task returns an asynchronous launch receipt, retain its task/agent ID
   and wait for its native completion notification or supported blocking wait.
   Yield while awaiting notification if necessary. Do not configure a new version,
   submit or start another test, send delivery input, publish or schedule while
   this gate is pending. A progress message is fine; proposing the next iteration
    as though review has finished is not.
   Keep the owning native conversation alive through final editor/checker completion.
   Do not exit a CLI invocation with pending children. A SendMessage or async resume
   receipt requires its own explicit native final completion await; it is not a
   completed hand-back. Do not invent `run_in_background` or foreground-dispatch
   flags. All bounded quality work must finish before parent advancement or opening
   the actual matching final HTML.
3. Do not poll files, task status or transcripts, run shell sleeps, or grep for
   `end_turn` to wait. A transcript marker can belong to an intermediate turn or
   a different stage. Browser-only loopback status polling under progress.md is
   separate from forbidden assistant wait polling. If native completion is
   unavailable, record the capability limitation privately and finish the normal
   source-bound HTML under delivery.md; do not continue the application workflow while generating.
4. Await the editor's **final** hand-back. An intermediate repair request,
   candidate path, packet, reviewer launch or incomplete result is not completion.
   Any authorized resume keeps the SAME review target, task identity where the
   host supports resumption, budget path and consumed claims. Do not launch a
   duplicate editor merely because completion has not arrived.
5. Before opening the final review, compare the final snapshot's workspace, profile,
   scenario, versions and run/session IDs with the pinned target and current
   requested target. Check the actual reviewed file and successful renderer
   result, not a filename or a promise to render. The renderer must have produced
   a real HTML file at the returned path from that exact final snapshot for a
   source-bound artifact. Missing/mismatched identity never permits an older HTML
   file. Optional review failure does not authorize another layout or fake approval.
   Keep internal checks private and verify exact renderer bytes under progress.md.
6. Present that HTML according to hosts.md. Either the editor or the parent may
   perform the single opener attempt, whichever actually has the capability;
   report who did it so the other does not open it again. Always give the user a
   direct, usable artifact reference/link in the original conversation. Do not
   merely say the review is running or that files are available somewhere.
7. Close the delivery gate only after matching safe normal packaged HTML
   exists and presentation is observed,
   or the user explicitly confirms seeing it. Review/validation/rendering failure
   triggers bounded recovery then normal rendering, not “skip review vs fix wording”.
   Do not ask the user to steer generation. The two-copy and three-attempt bounds
   remain. Delivery finishes generation, not factual approval or scenario
   acceptance. For genuine local capability/authorization/access/OS/browser
   impossibility, report the concrete blocker and minimum real user action with
   any safe file link. Distinguish dispatch from observed presentation and an
   absent file from a saved one. Do not advance until that real blocker clears
   or the user explicitly cancels/supersedes. An earlier “yes” is not a waiver.

A new user request can cancel or explicitly supersede the pending review. Record
that change before acting; ordinary messages do not silently clear the gate.
Preserve old output and consumed claims. A late result for a superseded run stays
historical: do not auto-open it or present it as the current run. A new completed
test needs its own review target; never relabel the old snapshot or its reviews.

## Editor stage gates

Apply the same native completion discipline to **each** child reviewer:

`author → final copy feedback → final factual feedback → attach → render → present`

- Await the complete copy hand-back, save its genuine full JSON and validate it
  against the unchanged candidate before dispatching the factual checker. Do not
  run copy and fact checks concurrently, even if a fact packet is already prepared.
   A first nonpass or malformed response permits the bounded correction/second-copy flow;
   the second response proceeds without copy polishing or a fabricated pass.
- Await factual completion or a genuine capability/failure result. Save and validate
  actual feedback, then finalize the 1.9 candidate and render normally. Neither a
  checker launch nor a packet is approval. Invalid/missing records remain private
  diagnostics, not render gates. Qualify known factual problems without forging
  matching records. Source, identity, safety and two-copy boundaries remain.
- Read a host-exposed completed transcript only for exact response capture, never
  as a polling clock. If that completed format is unsupported by capture-copy or
  capture-fact, preserve the complete genuine JSON hand-back with Write and validate
  it. Do not repeat a failed capture on the same unchanged input, guess a path,
   repair reviewer judgments or dispatch another reviewer to reformat the response.
- For the observed async-launch/SubagentHandback/turn-ending-receipt shape, use
  `packet-handback` on explicitly exposed complete child/parent JSONL, then
  `capture-native-copy`/`capture-native-fact` with the retained exact binding and
  saved compact packet when needed. See generation-performance.md for signatures
  and review-capture.md for binding/trust limits. Serialization and successful
  parsing are not file authenticity or dispatch proof. Unsupported foreground or
  future formats remain unsupported; never guess paths or invent dispatch metadata.
  Strict legacy `capture-copy`/`capture-fact` remains assistant-end_turn only.
  Preserve genuine complete wire JSON unchanged; `expand-review` deterministically
  expands against the EXACT saved packet and existing full validators, not a
  regenerated packet. Retain original wire/provenance privately; malformed facts
  remain malformed, never repaired judgments or a fake pass. No repeat failed
  capture on unchanged source, automatic model retry or formatting-only review.
- Before EACH current 1.9/1.10 copy claim, require the private source preflight's
  exact candidate/original-source/report binding. Unresolved quality counts NEVER
  become a new admission or render gate. Reassemble/regenerate after scoped author
  changes; no extra author dispatch or report/claim reset. Keep the report outside
  reviewer packets/UI/public prompts. Facts still follow completed copy feedback.
- Do not close with a success claim at “reviewers launched”. Return either a final
   renderer result with the exact source-bound snapshot/target and presentation status.
   Only genuine platform/authorization impossibility may
  end without a page; return the concrete limitation and any safe existing path.
  A loading page or bounded rich-path failure alone never unblocks iteration.

These are host orchestration instructions, not a new dispatcher or an OS sandbox.
Local sequencing tests do not prove native agent compliance or browser acceptance.
