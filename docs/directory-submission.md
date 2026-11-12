# Directory submission findings and owner handoff

The plugin contains two skills, MCP settings, documentation, a text provenance
marker and an icon. Its files use Markdown, text, JSON and image formats.
The plugin contains no mod or executable code.
Claude Code and Guild provide MCP Tasks through MCP.

## Source findings

| Portal finding | Repository response | What remains |
| --- | --- | --- |
| File types outside the directory allowlist | The package contains Markdown, text, JSON and images. The SDK-reference update procedure is in the README, with provenance in `skills/CLI_SKILLS_SOURCE.txt`. | Validate the candidate with the strict directory profile. |
| Publisher name may be confused with an existing listing | Keep the actual publisher, Guild.ai, Inc., with its `guild.ai` author URL and support email. Supply the Guild repository and domain as identity evidence. | Ask Anthropic to review the reported similarity to Built AI, Inc. Do not misrepresent the publisher to evade a name check. |
| Unrecognized field in `plugin.json` | `privacyPolicyUrl`, `termsOfServiceUrl` and `supportUrl` are listing fields the directory reads and Claude Code ignores. | Informational. |
| Images and fonts passed without a code check | The report identifies the bundled `.claude-plugin/icon.png`. | Informational; retain the normal plugin icon. |

The portal also reports that the repository is private. Private source can be
validated and reviewed, but publishing requires a public repository. A
repository admin must change that setting; no code PR changes it.

## Data-handling questions

These are evidence and suggested answers for the authorized submission owner.
The [README](../README.md#data-handling) describes the plugin's data paths.

| Portal question | Suggested answer and evidence |
| --- | --- |
| Does the plugin read or store personal data? | **Reads and stores.** Guild stores submitted agent source and configuration and session inputs and outputs, which can contain personal data. |
| Does any skill send data to a service other than the declared connectors? | **No.** The skills use only Guild MCP tools at `https://api.guild.ai/mcp`. Agents running on Guild can call their configured models and integrations; that is Guild's processing, not a plugin destination. |
| How long does the service retain data received from Claude? | **Longer.** Agent versions and session data are server records with no fixed retention window. The plugin sets no TTL. |
| Is the plugin intended for users under 18? | **No.** It is a business and engineering tool. |

## Compliance acknowledgements

An authorized Guild representative must verify and accept the portal
acknowledgements. A README disclosure is not that acceptance.

- Read and agree to the Software Directory Terms and Directory Policy on
  behalf of Guild only with authority to do so.
- Confirm the linked privacy policy and terms accurately describe the data
  the plugin and connected service handle.
- The acknowledgement about credential exfiltration and executing code
  outside declared MCP servers holds: the plugin ships no code, reads no
  credentials and runs nothing locally.
- Confirm the listed contact address and authorization for Anthropic to use
  it for submission and policy communication.

## Revalidation and escalation

1. Run `claude plugin validate . --profile directory --strict` on the
   candidate commit.
2. In the existing submission, revalidate `main` and record the exact commit
   and findings.
3. Supply the private test account and sample data from the
   [reviewer guide](reviewer-guide.md) when a policy hold needs review.
4. For a remaining publisher or eligibility question, use the submission's
   Get help action, or `directory@anthropic.com`. Include the repository,
   submitting organization, commit and exact finding.

References: [plugin submission checklist](https://claude.com/docs/plugins/pre-submission-checklist),
[manifest fields](https://code.claude.com/docs/en/plugins-reference),
[submission process](https://claude.com/docs/plugins/submit),
[submission status](https://claude.com/docs/directory/submission-status) and
[connector verification](https://claude.com/docs/connectors/verification).
