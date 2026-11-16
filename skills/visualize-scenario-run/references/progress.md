# Immediate, truthful generation progress

Read [completion.md](completion.md) and [delivery.md](delivery.md) first. The
packaged dependency-free Node runtime is `scripts/progress.mjs`, with static/live
HTML in `scripts/progress-page.mjs`. It is a standalone local CLI, NOT an automatic
plugin hook, model dispatcher, browser opener, fallback renderer or verified host
adapter. Wire its commands explicitly with existing authorized local Write/Bash
(`node*`) and presentation tools. No installation, permission expansion or external
service access is needed. Local tests do not establish native-host acceptance.

## Explicit command wiring

Use absolute paths in the commands below. `OUTDIR` must already be an approved
writable local output directory. Before long visualization work, Write a sanitized
private `TARGET.json` containing exactly these non-secret, already established IDs:

```json
{
  "workspace_id": "workspace-1",
  "profile_id": "profile-1",
  "scenario_id": "scenario-1",
  "run_id": "run-1",
  "session_ids": ["session-1"],
  "agent_version_ids": ["version-1"],
  "application_version": "application-1",
  "parent_conversation_ref": "original-parent-1"
}
```

Use the exact complete session/version sets for the reviewed snapshot. Unknown
identity is NOT license to invent values: report that private binding limitation
and continue safe normal rendering under delivery.md. The snapshot has no first-class profile field:
the runtime pins the parent-established `profile_id` privately and checks every
writer against it; it cannot independently prove profile/source authenticity.
All other listed identity fields are compared with the checked snapshot at ready.

## Default live startup: one finite command, then open its URL

When local serving and opening are authorized, run this direct FOREGROUND command
(no `run_in_background`, shell `&`, output redirection or task-output polling):

```sh
node /absolute/skill/scripts/progress.mjs start /approved/OUTDIR /approved/TARGET.json
```

`start` first writes offline `progress.html` and private control files in a fresh
`0700` directory. It starts ONLY the packaged server in an owned detached Node
child, waits for its listening receipt over Node IPC (at most ten seconds), then
returns ONE JSON result and exits. The child has ignored stdio, no shell or model,
the same scoped routes/security as `serve`, and a maximum one-hour lifetime.
The finite receipt includes `directory`, `artifact_path`, `manifest_path`,
`writer_path`, and **`live:true,url` only after listening succeeds**. The server
survives launcher/editor exit; it is not a native-agent completion signal.

**Open the returned `url`, NOT `artifact_path`, before long collection or dispatch.**
For example, an authorized macOS terminal opener takes that exact loopback URL as
its argument. Use the actual host tool schema and permitted browser, never an
invented browser API. Retain the current invocation and opener status privately.
An opener dispatch alone does not prove the tab loaded. No browser/credentials/
cookie access is added. The parent keeps server cleanup responsibility while the
editor can own stage writes; retain the binding until final presentation/handoff.

If the result is `live:false`, it contains no URL: preserve its static artifact
and private diagnostic, say live updates are unavailable in brief chat, and finish
normal final rendering. If serving is known unavailable/unauthorized, use
`node /absolute/skill/scripts/progress.mjs begin /approved/OUTDIR /approved/TARGET.json`
for static-only output instead. Neither command bypasses an actual denial. Do not
retry denied startup, remove its marker, expand permission or create a broad server.

`begin` alone is NOT live startup. A file tab has no script/network connection;
rewriting `progress.html` or publishing ready cannot refresh/navigate that tab.
Keep the static page's clean title/layout; do not add an offline warning to it.
The lower-level `serve MANIFEST_PATH` remains for hosts that expose its native
startup stdout while it runs. Do not use it through a host background tool that
returns only a task handle and withholds stdout until exit: use `start` instead,
not repeated reads of background logs. Node presence alone does not prove that
spawning, listening or browser opening is authorized. Keep only sanitized opaque
invocation identity public; all target/writer/control data remain private.

The single owner uses the returned manifest/writer paths for actual transitions.
The parent initially owns gathering. Before editor dispatch it supplies the same
manifest, writer, directory, current successful sequence, live URL/open status and
cleanup owner. It then STOPS writing. The editor acknowledges that binding, writes
`arranging` when authoring actually starts, `checking` immediately before native
quality work, and `polishing` only for actual text corrections (not final file I/O).
Repeated/paused checks stay checking; skip polishing if no text is being polished.
The editor publishes ready after finalization/rendering; it does not start another
server or retire the live page before the parent can present it. Reviewers never
receive writer authority. This is coordinated single-writer use, not reissued tokens.
Sequences are positive integers, exactly one greater than the previous successful
sequence (initially zero). Supported activities are fixed high-level labels, not
arbitrary messages or tool output:

```sh
node /absolute/skill/scripts/progress.mjs update MANIFEST_PATH WRITER_PATH 1 arranging
node /absolute/skill/scripts/progress.mjs update MANIFEST_PATH WRITER_PATH 2 checking
node /absolute/skill/scripts/progress.mjs update MANIFEST_PATH WRITER_PATH 3 polishing
```

These are examples; do not emit them until their activities genuinely begin.
`gathering`, `arranging`, `checking`, `polishing` map to the four activities below;
there is no timed percentage, ETA or compulsory ordering. Each successful command
atomically replaces the private manifest and refreshes the offline page. The
server watches only this directory for control-record changes and rereads state
on browser requests; it does not poll assistant files, transcripts or tasks.
Concurrent writers get an exclusive-lock error, not retries. Retain the same
owner, claims and sequence; do not delete a lock or restart with fresh budgets.

After bounded quality work and source/content/safety checks succeed, place the exact
snapshot and rendered HTML in the returned `directory` and publish ready:

```sh
node /absolute/skill/scripts/progress.mjs ready MANIFEST_PATH WRITER_PATH 4 checked.snapshot.json checked.html
```

Snapshot/HTML arguments are filenames ONLY, not paths. `ready` independently calls
the existing `renderHtml(snapshot)`, requires its successful contract validation,
matches the pinned target, and requires byte-for-byte equality with the supplied
HTML. It captures exclusive read-only `completed.snapshot.json` and
`completed-review.html` copies, records their digests privately, and makes only
the completed HTML available over HTTP. The server validates this capture again
and serves immutable in-memory bytes, not mutable caller files. Arbitrary supplied
HTML, invalid source/content, partial captures and mismatched identity fail closed.
For 1.9, malformed/stale optional reviews remain private invalid diagnostics, not
ready gates. Historical contracts retain their original strict review validation.
Nothing here authenticates reviewer signatures or substitutes source reads.

Give the user the durable returned `completed-review.html` artifact path after
the observed final presentation, never just the temporary localhost URL. The
browser navigates once to `final.html` on matching ready; a status response or
navigation dispatch alone is not observed presentation. Final CSP/code stay intact.

For a real failure or supersession, respectively:

```sh
node /absolute/skill/scripts/progress.mjs blocked MANIFEST_PATH WRITER_PATH 4
node /absolute/skill/scripts/progress.mjs retire MANIFEST_PATH WRITER_PATH 5
```

Use the next actual sequence, not these illustrative numbers. `blocked` stops
animation/polling with a neutral next-update message. It does not ask the user to
debug or choose repairs. `ready` and `blocked` are terminal except for `retire`;
`retired` accepts no further writes. `retire` stops the exact server through its
directory notification; SIGINT/SIGTERM on the retained process handle also cleanly
close it. The server has a one-hour maximum lifetime and an exclusive lifetime
marker preventing duplicate `serve` starts. Do not remove that marker to recover
an old invocation. A deliberately new progress invocation may be used only for a
new/current owner/target, never to reset review budgets or replace a current final.

After bounded quality work, finalize source-bound 1.9 and render the normal full UI
under delivery.md, then publish its exact snapshot/HTML through `ready`. No fake
pass, limited-evidence mode or separately handcrafted page is needed or permitted.
Only actual content/source/safety, local capability or authorization failure blocks
ready. The parent finishes useful delivery without asking generation choices.

## Start before the long work

After selecting an eligible current run and pinning the target, immediately write
a small sanitized `progress.html` in the approved invocation directory and attempt
to show it, BEFORE visualization-specific evidence collection, narrative work or
reviewer dispatch. The all-current-scenarios technical-error exception is decided
first: do not create a visualization/loading page for that exception.

Show a friendly heading, a progress bar and a modest, engaging CSS animation
(for example, dots arranging into a timeline). Respect `prefers-reduced-motion`,
include a text status/accessible live region, and avoid flashing. Start with an
indeterminate bar. Use high-level activities only when they are actually underway:

- Gathering evidence.
- Arranging the timeline.
- Checking details.
- Polishing the text.

These are examples, not a compulsory order or simulated clock. A paused reviewer
is still “Checking details”; do not rotate activities on a timer. Update on actual
stage transitions or supported native progress events. Use determinate progress
only for completed, known milestones, never a fabricated percentage, ETA or 100%
before a final file is ready. Animation signals ongoing work, not measurable work
completed. On a real blocker, stop implying active progress.

**Narrow public exception:** these human high-level activity labels and loading
animation may be visible even though generation internals are private. Do not
show agent/model identities, review verdicts/counts, claims, budgets, schemas,
digests, raw tool output, prompts, filesystem paths or pipeline diagnostics.
Business results and genuine evidence gaps belong in the final page, not guessed
loading-page claims. Sanitize all text before writing it.

## Optional browser-only status updates

The packaged `start`/`serve` commands implement the following boundary. `start`
writes static output first, but open its returned dynamic URL for live work. Do not hand-build
a broader file server, add network routes or expand the runtime's permissions:

1. Bind only to `127.0.0.1` on an OS-assigned ephemeral port, never `0.0.0.0` or
   a LAN address. Use a fresh unpredictable invocation route prefix; do not reuse
   another run's route. It is a local routing boundary, not a credential or a
   production authentication mechanism. Do not put credentials in it or logs.
2. Serve only three exact read-only routes under that prefix: `progress.html`,
   `status.json` and, once ready, `final.html`. Allow GET/HEAD only. Reject other
   paths/methods, traversal, unexpected Host headers and foreign Origin headers.
   No directory listing, arbitrary file-path parameter, proxying, CORS, request
   body handling, callbacks, tool execution or feedback submission endpoint.
   Do not serve the workspace root, evidence bundle, private manifest or reviews.
3. Keep an explicit route-to-file map confined to the approved invocation
   directory; refuse symlinks escaping it. Server reads are only of these known
   authored files, not transcripts or task state. Return `Cache-Control: no-store`
   for status/loading responses and no sensitive diagnostics in errors.
4. The editor/parent uses the CLI to write private state atomically at real
   transitions (temporary file then rename within that directory). Public status
   contains only an opaque invocation identity, monotonic sequence, truthful
   activity and `working`, `ready`, `blocked` or `retired`. The packaged runtime
   deliberately uses an indeterminate bar, with no milestone count. Only a matching
   record for the pinned target may update the page. Use supported child notifications
   or parent/editor transitions; do not inspect a running transcript for progress.
   Choose one status writer. On parent fallback takeover or supersession, retire
   the old invocation; the runtime does not transfer/reissue its writer authority.
   Its late writes are rejected, even for the same run. Do not let a late rich
   result overwrite ready state or auto-open a second final page. An HTTP response
   already in flight at retirement cannot be recalled; parent target checks remain
   necessary before treating any final page as current.
5. Only the **browser** polls its same-origin `status.json`, at a modest interval
   (for example, once per second), with one outstanding request. Stop on ready,
   blocked, unload or three consecutive connection errors. On disconnect
   say updates are unavailable; do not imply the work failed or completed. Use
   `textContent`, not source-derived `innerHTML`. No external assets or requests.
6. Give the loading page its own restrictive CSP: default deny; only its local
   hash-authorized script/style blocks (or exact same-origin static assets), and
   same-origin status connection. Forbid frames, forms, remote media and plugins.
   Do not permit unsafe-inline/eval or interpolate source text into code/styles.
   Do NOT loosen the final artifact's CSP or add polling/network code to it.
7. Set runtime `ready` only after the actual normal packaged final file passes its
   source/content/safety contract checks and matches the still-current target.
   Optional 1.9 review records are not render gates. Alternate HTML is not accepted.
   The browser may then navigate once to the exact same-origin `final.html` route;
   never accept a URL/path from arbitrary status text or navigate to an old file.
   A loading page, ready flag or HTTP response alone does not prove presentation.
   Serve the final file unchanged with its own restrictive CSP and correct HTML
   MIME type/`nosniff`; do not replace its policy with the loading-page policy.

File boundaries: the server never serves the workspace/output root, target file,
manifest, writer, lock, snapshot or an arbitrary supplied path. Input files must
be ordinary single-link files under the invocation directory, without symlinks;
reads use `O_NOFOLLOW`, size caps and changed-file checks. Control records are
limited to 32 KiB, snapshots to 8 MiB and final HTML to 32 MiB. Requests have an
8 KiB header limit, bounded connection/time limits, no request-body/upgrade/proxy
support and exact Host/Origin checks. All responses use `no-store`/`nosniff`;
progress uses hash-authorized script/style CSP, and final HTML keeps its original
hash CSP. This is not an OS sandbox or defense against another process with the
same user's filesystem authority. Private files/digests are not credentials or
cryptographic reviewer authentication. Protect the directory and source evidence
using the host's existing permissions; do not copy secrets into any of them.

Local verification:
`node --test skills/visualize-scenario-run/tests/progress.test.mjs` covers real
loopback HTTP/CLI lifecycle plus browser-controller stubs. No model, integration,
automatic plugin hook or real-browser acceptance is implied. Relevant runtime APIs
are documented in the official [Node HTTP](https://nodejs.org/api/http.html) and
[Node filesystem](https://nodejs.org/api/fs.html) references.

This browser-only status polling is NOT assistant wait polling. The assistant
still awaits native final notifications or a supported blocking wait. Never use
shell sleeps, repeated file/status/transcript reads, or `end_turn` searches to
learn when an agent finished. Do not start another application iteration while
the page is being generated. Do not dispatch an extra model merely to animate
progress or escape the review budget after it is exhausted.

## Static hosts, final handoff and cleanup

If a safe loopback server or browser script is unavailable, keep the static local
loading page, update its authored status at actual transitions where the host can
refresh it, and give concise truthful chat updates. Explain that live page updates
are unavailable; do not imply that rewriting a file refreshes an already open tab.
Do not ask the user to debug the progress mechanism or choose how to generate the
review. A missing progress capability does not block safe final HTML authoring.

Progress is never the completed review and does not satisfy the iteration gate.
Use [hosts.md](hosts.md) to present the final file and provide its durable direct
artifact link, not a temporary localhost URL. Keep the final self-contained HTML
usable after editor/server exit. Record the temporary server handle privately;
stop only that invocation's server after final presentation/handoff, cancellation
or failure, using next-sequence `retire` (or the supported handle for explicit
low-level `serve`). Do not kill unrelated processes.
On supersession, stop its updates and never auto-navigate/open a late old result.
If the host cannot show a page, report the actual capability/action concisely;
never claim “always opened” from an opener dispatch.
