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

This table is not a claim that the new skill works equally across the hosts
supported by the two existing MCP-only skills. Renderer unit tests, browser
dispatch, native plugin eval output and a synthetic bridge are not host acceptance.

## Presentation procedure

After a renderer success, use a verified HTML sidebar **only** if that host
actually offers one. Otherwise try the host's available browser opener; terminal
Claude Code uses browser presentation. Supply the successful artifact path, not
an invented URL or API. Observe opening where possible. State "open attempted"
if only dispatch is known; do not state "presented". On failure return the valid
path and failure to the original parent. Do not keep retrying indefinitely (one
presentation attempt; a user-requested retry is separate). Use copy-to-chat in
all cases. The artifact has no network connection or automatic delivery route.

Return artifact path, IDs, verification summary, gaps, origin, presentation status
and feedback limitation to the parent. Then close the editor. Clipboard access
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
   Inspect source origin/gaps and dual-review metadata inside technical details.
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
