# Directory submission findings and owner handoff

The candidate now contains three skills, three local review agents, MCP settings, documentation, a text
provenance marker, an icon and readable JavaScript (.mjs) review scripts/tests.
It contains no mod or hooks module. The optional visualization skill executes a
local Node.js renderer and reads/writes sanitized local files; it is no longer
accurate to describe the entire package as instruction-only or non-executable.
Claude Code and Guild provide MCP Tasks through MCP.

## Source findings

| Portal finding | Repository response | What remains |
| --- | --- | --- |
| File types outside the directory allowlist | The package also contains readable .mjs review scripts/tests. The SDK-reference update procedure and new local runtime disclosure are in the README. | Validate the candidate with the strict directory profile and re-review the executable/file-access disclosures in the portal. Local validation is not policy approval. |
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
| Does the plugin read or store personal data? | **Reads and stores.** Guild stores submitted agent source/configuration and session data. The optional review skill also reads/writes sanitized local snapshots and HTML, which may contain personal data and have no automatic deletion. |
| Does any skill send data to a service other than the declared connectors? | The local renderer and artifact make no network requests. Review agents independently use authorized source connectors available in the host; the owner must confirm their declared connector scope for the submitted candidate. Source links are explicit browser navigation. Guild-hosted agents can use their configured models and integrations. Do not reuse the previous blanket answer without reviewing this change. |
| How long does the service retain data received from Claude? | **Longer.** Agent versions and session data are server records with no fixed retention window. The plugin sets no TTL. |
| Is the plugin intended for users under 18? | **No.** It is a business and engineering tool. |

The declared optional evidence connector is GitHub's official read-only MCP
endpoint restricted to `get_file_contents`. Authorized reads send repository,
path and revision identifiers and return file contents to Claude; access and
revocation are separate from Guild. It supports suitable GitHub-backed records,
not an independent history adapter for every integration.

## Compliance acknowledgements

An authorized Guild representative must verify and accept the portal
acknowledgements. A README disclosure is not that acceptance.

- Read and agree to the Software Directory Terms and Directory Policy on
  behalf of Guild only with authority to do so.
- Confirm the linked privacy policy and terms accurately describe the data
  the plugin and connected service handle.
- Reassess the acknowledgement about executing code outside declared MCP
  servers: the optional renderer now runs locally. It must not receive
  credentials, but a prior "runs nothing locally" answer is no longer accurate.
  Current submission guidance permits readable skill scripts; the authorized
  owner must still confirm the policy interpretation and disclosures. Do not
  accept acknowledgements or submit on the owner's behalf from this change.
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
