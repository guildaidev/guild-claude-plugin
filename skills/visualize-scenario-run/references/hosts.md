# Host presentation and acceptance gate

## Current support

| Capability | Status |
| --- | --- |
| Local renderer, Node.js 22+ and writable local files | Implemented; deterministic fixture tests. Node 26 tested here. |
| Manual copy intent, selectable text fallback | Implemented in self-contained HTML. Independent of editor lifetime. |
| Terminal browser opening | Use the available host opener; real-host acceptance pending. |
| Claude Desktop / OpenCode HTML sidebar | Unverified; no adapter/API assumed or enabled. |
| claude.ai local runtime, agent dispatch and file execution | Unverified; report unsupported when prerequisites are unavailable. |
| Automatic parent-bound transport on every host | Unsupported; no production adapter is shipped or enabled. |
| Immediate loading/status page | Packaged local helper in progress.md; finite foreground `start` writes static HTML then returns a listening loopback URL. Open the URL for live updates; static `begin` alone is not live. Requires authorized spawning/listening/opener; not native-host acceptance. |
| Rendering after bounded quality work | Normal source-bound 1.9 renderer/full UI; optional genuine review diagnostics are private, not approval gates. |
| Local generation helpers | Postrun packaging, source preflight, lossless codec, private source navigation and identity-correlated completed hand-back capture; see generation-performance.md. Local data adapters, not native dispatch acceptance. |

This table is not a claim that the new skill works equally across the hosts
supported by the two existing MCP-only skills. Renderer unit tests, browser
dispatch, native plugin eval output and a synthetic bridge are not host acceptance.

## Capability recovery before declaring a blocker

The review page comes from this package's Node scripts, not a dedicated Guild
MCP tool. Keep discovery, execution permissions and presentation separate:

1. Use the current host tool schemas and skill/agent listings. A resumed session
   can carry a headless skill listing that omits an installed plugin. If Skill is
   callable and the exact `guild:visualize-scenario-run` name is listed, invoke it.
   Otherwise Read the installed `SKILL.md` and required references from the known
   host-provided base directory. Agent-development can resolve its sibling
   `../visualize-scenario-run/SKILL.md`. Do not guess a cache/home/plugin path,
   search unrelated directories or invoke an unlisted skill name. A direct read
   loads instructions; it does not register a skill or prove a reload occurred.
2. Inspect the actual dispatch schema and announced agent types. Native
   Agent/Task is distinct from Skill and from Guild application agents. Use the
   announced packaged editor type for the actual authorized work; do not spend
   model calls merely to probe availability. ToolSearch loads only tools announced
   as deferred, using their exact names; it does not discover plugin skills or
   turn an agent type into a tool. ListAgents may list sessions/message recipients,
   not dispatch types: follow its actual description, not its name. Do not invent
   flags, model support or tool restrictions. Keep a distinct author and enforce
   the existing reviewer allowlists; an unrestricted general-purpose agent is not
   a substitute for a restricted checker. A genuinely unavailable author remains
   an author-dispatch blocker, not proof that the renderer is missing.
3. Read the known package's `scripts/inspect.mjs` and `scripts/render.mjs` as
   needed to establish their presence. Probe Node with ONLY `node --version` in
   one Bash call. File presence and an advertised Bash tool do not prove execution
   permission; the actual command result does. Never retry a denied command by
   disguising it, changing tools or expanding permissions. A compound-command
   denial does not establish that standalone Node is unavailable.
4. With authorized evidence, a distinct author, writable approved local files and
   Node 22+, follow the current draft 1.4/source-bound 1.10 workflow. The historical
   normal draft 1.3/source-bound 1.9 workflow retains its original source contract.
   Read [generation-performance.md](generation-performance.md) for actual postrun
   packaging, preflight/claim, compact/full packet and capture/expansion signatures.
   Use separate
   direct calls with absolute paths resolved from that installed skill directory:

   ```sh
   node /absolute/skill/scripts/inspect.mjs bundle /approved/bundle.json
   node /absolute/skill/scripts/inspect.mjs assemble /approved/bundle.json /approved/draft.json /approved/new-candidate.json
   node /absolute/skill/scripts/inspect.mjs finalize /approved/new-candidate.json /approved/new-snapshot.json - -
   node /absolute/skill/scripts/render.mjs /approved/new-snapshot.json /approved/new-review.html
   ```

   The `- -` example is for genuinely absent optional private review records after
   bounded attempts or established reviewer unavailability, not permission to skip
   available authorized reviews. Pass actual records when retained, even when
   invalid; never forge approval. Keep the stable two-copy budget, three shared
   check/render attempts, sanitization and exact target binding. A preflight or
    validation error is its actual error, not a missing tool. Use no alternate UI.
   Available review dispatch still requires source preflight before each current
   claim and complete native waits; the two-dash finalization example is not a
   shortcut around available reviews. Helper quality counts are not render gates.
5. Only after a successful render handle browser opening below. An unavailable
   opener does not erase a saved HTML file. Keep concrete failure stage, tool name,
   attempted call/result and any safe artifact path in private diagnostics. Public
   chat follows conversation.md: state only a necessary real blocker and minimum
   user action, not a generic claim that a review-page tool is unavailable. Do not
   proceed with another application iteration. Do not reload/restart, alter host
   settings, switch models, expand access, rerun the scenario or write integrations
   to repair discovery. If the known package cannot be read or an essential
   capability is truly absent/denied, report that specific limitation; do not hide it.

## Presentation procedure

Follow [completion.md](completion.md), [progress.md](progress.md) and
[delivery.md](delivery.md). Show the separate loading page immediately when
generation starts, after selecting an eligible current run. Its truthful
high-level activities are the narrow exception to private generation internals;
it is not a final review or observed completion. Browser-only loopback status
polling never permits assistant file/transcript wait polling.
When authorized, use `progress.mjs start OUTDIR TARGET` in a finite foreground
call and open its returned `live:true` URL, not its artifact_path. Do not depend
on reading a long-lived background command's output file for a startup URL.
If serving is unavailable, retain static `begin` and honest chat updates, not a
claim that the open file refreshes. Keep the owned server through final handoff.
Pass its current successful sequence and binding to the single editor writer;
the parent ceases stage writes but retains cleanup ownership until handoff.

Before opening a reviewed artifact, match the actual final
snapshot and rendered file to the pinned/current workspace, profile, scenario,
tested versions and run/session. Never open an older or superseded result as
current. After bounded quality work, use the normal source-bound 1.9 renderer under
delivery.md even if optional feedback is missing or invalid. Preserve structural,
source and safety validation; never invent review approval or use alternate HTML.
An internal review failure is not a request for the
user to choose whether/how to finish; a nonexistent file is not an opener task.
The editor must finish all bounded quality work before this final opening or
parent advancement. Keep its native owner alive; do not exit a CLI with pending
children or SendMessage/resume asynchronously without awaiting explicit native
final completion. Use actual native notifications/supported blocking wait, never
invented dispatch/background flags, file/transcript/status polling or sleeps.
For supported async-launch/SubagentHandback/receipt capture, use only exposed
complete paths and independently retained binding. Unsupported foreground/future
formats do not permit invented metadata or a formatting-only model call. Preserve
the genuine hand-back privately and follow generation-performance.md's deterministic
expansion/fallback; exact packet/binding bytes must not be regenerated.

Current final layout uses viewport scrolling, not a bounded timeline scroll panel.
Prompt-item count and “Review prompt” belong in the upper-right header. No bottom
footer bar or ecommerce words/icons; full accessible dialogs, in-memory selection
and manual copy/paste remain. Local browser/layout tests are not native acceptance.

After normal packaged HTML exists,
publish ready through the same invocation. If the live tab's exact final.html
navigation/presentation is observed, do not open a duplicate final tab. Give its
durable completed-review.html link, then retire the owned invocation after handoff.
If live navigation is unavailable/unobserved, the final opener procedure follows:
use a verified HTML sidebar **only** if that host
actually offers one. Otherwise try the host's available browser opener; terminal
Claude Code uses browser presentation. Supply the successful artifact path, not
an invented URL or API. Observe opening where possible. State "open attempted"
if only dispatch is known; do not state "presented". On failure return the valid
path and failure to the original parent. Do not keep retrying indefinitely (one
presentation attempt; a user-requested retry is separate). Use copy-to-chat in
all cases. The artifact has no network connection or automatic delivery route.
The progress page's optional temporary loopback connection is separate; keep the
final artifact self-contained and its CSP unchanged. Do not rerender a final page
to fix a browser problem. Follow the host's external/authenticated-service browser
routing rules for source links; a local artifact never authorizes credential use.

The editor or capable parent owns that one attempt, not both. If the editor lacks
an opener, return the actual final file path and let the parent perform the attempt
if supported. The parent must give a direct usable artifact link in the original
conversation. An opener dispatch is not observed presentation. Until presentation
is observed/user-confirmed, report a real OS/browser/capability blocker and the
minimum concrete user action with the safe link; do not ask review-generation
choices, advance the application or claim the review was shown. The loading-page
opener is not the final-file presentation attempt; record each honestly.

Return artifact path, IDs, genuine private review diagnostics,
verification summary or its absence, gaps, origin, presentation status
and feedback limitation to the parent. Then close the editor. For reviewed HTML,
clipboard access
may fail on file URLs or restricted hosts; the page selects the intent for manual
copy instead and says that nothing was sent. Paste into the original parent,
not a new agent conversation. The parent handles scope and any future action.

## Separately authorized real-host acceptance

Do not run live workflows to perform these checks. Ask for authorization to use
a sanitized existing run or the synthetic artifact, and access to the named host.
For each host/version record date, runtime, dispatch/capabilities, source origin,
snapshot/run/scenario IDs, steps, observed result and evidence location. Keep
observations separate from assumptions. Never collect credentials or raw secrets.

1. Discover the installed plugin and new skill in that actual host. Confirm
   distinct author/copy-editor/fact-checker dispatch and both reviewers' tool restrictions,
   Node version, packaged scripts and permitted local file access.
2. Render the sanitized fixture, open it through the actual host, and observe
   title, inline artifact, the two permitted event accordions and copy control.
   Inspect source gaps in human terms. Check dual-review metadata privately and
   confirm generation internals are absent from the UI and copied prompt.
   Exercise clipboard denial/manual selection. Close the editor completely.
3. Copy the available run intent after closure. Paste into the original parent;
   confirm snapshot, run, scenario and logical parent identifiers. Event intents
   remain a helper contract, not extra event-feedback controls in this UI.
   Confirm the parent receives intent only, with no rerun, write or golden change.
4. Deliberately fail the opener. Confirm the parent receives the still-valid path
   and explicit presentation failure, not success. Record unavailable hosts as
   unsupported rather than passing them by analogy.
5. An automatic transport is **separate future adapter work**, not a flag to set
   in this renderer. Before enabling one, prove in the real host that it is
   parent-owned, reaches the original parent after editor closure, preserves IDs
   and origin, and cannot itself execute feedback. Test terminal browser and each
   other host independently. Do not enable an adapter based on a stub. The current
   package has no automatic allowlist entries or transport code.

MCP channels are a research-preview candidate with host enablement and provider
allowlisting restrictions, not a required dependency or proof of delivery.
`window.postMessage` alone cannot identify or reach the original parent.
