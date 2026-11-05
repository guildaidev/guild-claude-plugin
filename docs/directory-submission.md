# Directory submission findings and owner handoff

The portal report supplied for `main` at `c56e56f` lists three blocking
findings, three warnings and seven policy holds. The grouped blocking
locations and two unknown field names were not expanded. This document maps
the visible findings to the implementation and the remaining owner actions.
Local validation does not reproduce the portal's mod checks. Revalidate the
exact candidate commit before claiming that a finding is cleared.

## Source findings

| Portal finding | Repository response | What remains |
| --- | --- | --- |
| Couldn't read a use of `$` as a plain `$.noun.method(...)` call, 3 blocking findings | Capability helpers share `hooks/register.tsx`; `$` is passed whole to same-file helpers or the SDK's state helpers. Calls use plain method syntax, and the three local tool matchers use literal names. | Revalidate. If any blocker remains, use its expanded location rather than guessing another refactor. |
| Mod calls tools itself without the model asking | The README lists the two read-only MCP tools, their arguments, polling and permission requirements. Calls name the tools literally. | This capability is intentional and can need reviewer clearance. |
| Mod can read local data and send data out | The README distinguishes local watch lists, environment/path reads and saved tool results from the Guild session IDs sent through MCP. | A disclosure supports review; it does not automatically clear the hold. |
| Mod can read the conversation and send data out | The mod reads the Claude Code session ID and its own state, not conversation messages or prompts. The README explains that ID is not sent in its MCP calls. Guild session content is distinct and can contain personal data. | Ask the reviewer to assess the actual APIs and arguments. Do not claim the classifier proves transcript collection. |
| Mod can fetch from the network and run commands or tools | The mod has no process API calls. Its two MCP calls have fixed read-tool names and send session/event query arguments. | Revalidate; do not assume removal of a process call clears every network/tool hold. |
| Mod may start a program the directory couldn't fully check | Saved-result cleanup uses no process call. The mod leaves saved copies in place after reading them. | Revalidate the updated source. |
| Mod starts other programs | The mod launches no shell commands or local programs. The SDK documentation sync script is a maintainer utility and is not called by the mod or skills. | Revalidate the updated source. |
| Publisher name may be confused with an existing listing | Keep the actual publisher, Guild.ai, Inc., with its `guild.ai` author URL and support email. Supply the Guild repository and domain as identity evidence. | Ask Anthropic to review the reported similarity to Built AI, Inc. Do not misrepresent the publisher to evade a name check. |
| Unrecognized field in `plugin.json`, 2 warnings | The exact keys are unavailable. Current official documentation supports the existing `types` and `privacyPolicyUrl` fields, and local strict validation accepts the manifest. | Expand the warnings when possible, compare each key with the official schema, and report a portal/schema mismatch for documented fields. Do not delete type declarations or the privacy link blindly. Warnings are not blocking findings. |
| Mod may answer a tool call in place of the tool | The README names the three tools the mod registers and implements. Their handlers have exact literal matchers; there is no general replacement for other tools. | A reviewer can confirm these are the mod's own tool implementations. |
| Mod adds tools, commands or agents | The README lists the local tools and `/guild-sessions`. | Informational; no corrective change is required. |
| Mod hooks an event that is also an API call name | The README describes the `ui.close` handler: close its own pane through `next`, then update its open-state flag. | Informational; the hook's purpose is disclosed. |
| Images and fonts passed without a code check | The report identifies the bundled `.claude-plugin/icon.png`. | Informational; retain the normal plugin icon. |
| Mods accepted only from Verified organizations | The supplied portal notice says this restriction is not enforced yet and Guild's organization is not Verified. | The organization owner should confirm eligibility with the directory team. There is no manifest flag that grants organization verification. A connector's listing status is not proof of it. |

The portal also reports that the repository is private. Private source can be
validated and reviewed, but publishing requires a public repository. An owner
must decide when it can be made public; no code PR changes that setting.

## Data-handling questions

These are evidence and suggested answers for the authorized submission owner,
not pre-completed declarations. Confirm the deployed service and applicable
customer terms before submitting. The [README](../README.md#data-handling)
describes the plugin's actual data paths.

| Portal question | Suggested answer and evidence |
| --- | --- |
| Does the plugin read or store personal data? | **Reads and stores.** Guild stores submitted agent source/configuration and session inputs/outputs, which can contain personal data. The pane displays Guild session data and keeps local watch lists, state and diagnostic excerpts. Do not select No simply because a particular sample input contains no personal data. |
| Does any skill send data to a service other than the declared connectors? | **No for direct skill calls:** the bundled skills use Guild MCP tools. The declared endpoint is `https://api.guild.ai/mcp`. Distinguish this from agents running on Guild, which can call their configured models/integrations. The mod calls the plugin's own connector, or the claude.ai Guild connector when the first is not connected, each by fixed name. If the submission treats agent integrations as additional destinations, list them and select Yes instead. |
| How long does the service retain data received from Claude? | Use **Longer** unless the responsible Guild owner can establish an applicable retention guarantee under 30 days. Agent versions and session data are server records, not transient pane reads. The plugin implements no server TTL; its local count limits do not establish one. Confirm the actual retention terms for the submitted service. |
| Is the plugin intended for users under 18? | Confirm the intended audience with the product owner. It is presented as a business/engineering tool, but that alone is not an age policy. Do not infer an under-18 answer from the privacy notice's separate under-13 language. |

The general privacy notice describes Guild's controller practices and
distinguishes customer data processed on a customer's behalf. Supply the
applicable customer terms as well as the public privacy link when they govern
the submitted data. This repository does not establish or change those terms.

## Compliance acknowledgements

An authorized Guild representative must verify and accept the four portal
acknowledgements. A README disclosure or a passing test is not that acceptance.

- Read and agree to the Software Directory Terms and Directory Policy on
  behalf of Guild only with authority to do so.
- Confirm the linked privacy policy and applicable terms accurately describe
  the data the plugin and connected service handle.
- Check the exact acknowledgement about credential exfiltration and executing
  code outside declared MCP servers. The mod reads only `HOME` and
  `CLAUDE_CONFIG_DIR` for file location, uses engine-managed MCP authentication,
  and launches no programs. Its TypeScript handlers still run locally inside
  Claude Code. If the acknowledgement is intended to forbid that local mod
  code too, obtain clarification from Anthropic before accepting it.
- Confirm the listed contact address and authorization for Anthropic to use
  it for submission and policy communication.

Do not check boxes simply to enable Next, alter permissions to bypass a hold,
or submit a duplicate listing to work around organization verification.

## Revalidation and escalation

1. Run `claude plugin test .` and strict local validation on the candidate.
   Retain the report's note that directory coverage for mods is incomplete.
2. In the existing draft, revalidate the intended branch or tag and record
   the exact commit and expanded findings. A report for an earlier commit
   does not establish the candidate's status.
3. Supply the private test account and sample data from the
   [reviewer guide](reviewer-guide.md), plus the README disclosures, when a
   policy hold needs review.
4. For a remaining publisher, schema or eligibility question, use the
   submission's Get help/Contact Anthropic action, or `directory@anthropic.com`.
   Include the listing/repository, submitting organization, commit, exact
   finding and relevant documentation. Keep credentials and customer data
   out of public issue threads.

References: [plugin submission checklist](https://claude.com/docs/plugins/pre-submission-checklist),
[manifest fields](https://code.claude.com/docs/en/plugins-reference),
[mod files and type defaults](https://code.claude.com/docs/en/plugins/mods/reference),
[submission process](https://claude.com/docs/plugins/submit), and
[submission status and support](https://claude.com/docs/directory/submission-status).
