# Guild plugin for Claude

The plugin connects Claude to Guild's hosted MCP server at `https://api.guild.ai/mcp`.
Claude can build, test and revise private Guild agents through this connection.
You can then request a release, installation, schedule or trigger.
Claude can also read Guild sessions.
The plugin works in Claude Code, Claude Desktop and claude.ai.

## Install

```
/plugin marketplace add guildaidev/guild-claude-plugin
/plugin install guild@guild
```

The first tool call opens a Guild sign-in in your browser. You can disconnect at any time in Guild under Security > Connected apps.

## Skills

The two development skills use Guild MCP tools. A client's MCP Tasks support determines how it
waits for results. Neither skill requires the user to run the `guild` CLI,
`npm` or `git`.

- `agent-development` guides workspace and connection setup. It builds a private
  candidate, tests it on Guild and revises it from feedback. Acceptance records
  the exact tested version. Production release requires a separate request.
- `build-triggered-agent` builds an agent that runs on a GitHub event.
- `visualize-scenario-run` reviews one supplied run as a story of world effects,
  with inline artifacts, independent read-only verification and copyable feedback.
  It has additional local runtime and agent-dispatch requirements described below.

Tests use a gateway profile to select integrations and credentials.
The connected Guild server must expose `guild_start_profile_agent_test_session`
and the profile setup tools. The skill stops if those tools are unavailable.
A profile controls Guild-brokered calls. It does not convert production services
into test services.

To try a local checkout:

1. Start Claude Code with `claude --plugin-dir /absolute/path/to/guild-claude-plugin`.
2. Authenticate Guild through `/mcp`.
3. Invoke `/guild:agent-development` with your agent idea.

A local plugin does not deploy changes to the connected Guild backend.

### Optional run visualization

Ask to visualize or review an existing run. The parent collects sanitized evidence;
a distinct narrative author selects the story, a Read-only copy editor returns
editorial feedback, and a separate fact checker makes authorized source reads.
The author renders the exact final candidate with both matching reviews. This
does not run a workflow, execute feedback, write golden examples or approve release.

This skill is an explicit **local-file/executable exception**, not a change to
the two development skills' MCP-only build workflow. Its readable scripts live
under `skills/visualize-scenario-run/scripts/` and require **Node.js 22+**, local
file access, a writable approved output directory and distinct author/copy/factual
agents with enforceable read-only reviewer permissions. There are no npm packages
to install.

The default `agents/` package contains `scenario-run-editor`,
`scenario-run-copy-editor` (local Read ONLY) and `scenario-run-checker`.
Copy uses ASD-STE100 for internal technical processes OR Economist for world/human
effects, never both for a passage, then SDLC directives. Meaning never changes.
The fact checker has an explicit read-only tool list: local Read, Guild session
reads, and GitHub `get_file_contents`; it has no shell, writes or dispatch tools.
The optional GitHub connector is the official read-only endpoint restricted to
file reads. It requires separately authorized access and suitable source handles;
commit-pinned record history is not available for every tracker. See
[source limits](skills/visualize-scenario-run/references/sources.md).
New snapshots use 1.8, SDLC directives v2 and header product policy 1.1: the author supplies explicit short header copy plus selection/prose in closed draft 1.2, and
`inspect.mjs assemble` copies unchanged source metadata from the evidence bundle.
The brief scenario description summarizes general setup/task/intended behavior
in present tense, preferably one sentence, not this run's observed results.
It is capped at 200 Unicode code points AND 30 words. Actual outcomes stay in the
timeline. An explicitly authorized description-only refresh generates that closed
payload once and byte-caches all other business copy and source/artifact content;
genuine complete new reviews must bind the changed candidate.
Copy feedback uses exact field digests instead of repeating every passage. Default
models are Sonnet for author/copy editor and Opus for factual checking; actual
model selection and speed require a native check, not just these declarations.
There are **at most two copy iterations** per visualization, using one stable
private base claim and an append-only `.iteration-2` companion before dispatch.
After first-review issues the author explicitly revises and reviews again. After
the second valid review, display its exact business text and retain real unresolved
findings privately rather than fail on copy issues or fabricate a pass. No generation
review records, roles/models, rules, counts/verdicts, schema/digests or nonapproval
notices appear in UI, source disclosures, dialogs, cart or copied prompt. Business
source uncertainty remains visible. No third copy call. Malformed/stale
records and factual checks still block; content corrections need fresh matching
reviews within that budget. Display-only repairs may reuse reviews for up to
three render attempts. Claims are local guards, not a file-write sandbox.
Historical 1.0/1.1 input renders read-only without a copy pass; 1.2 retains its
original full-text dual reviews, 1.3 retains SDLC v1 hash reviews, and 1.4/1.5
retain original SDLC v2 contracts and pass-only gates.
Historical 1.6 retains its two-copy contract; 1.7 retains its original two-component
header and policy 1.0 without migration or review restamping. The scenario header
stays inside a bounded scrolling panel, with accessible cart and dialogs.
Neither acquires current editorial approval. New HTML input rejects detached
artifacts: only attachments referenced by timeline events are allowed. Source
pages remain collection evidence, not unexplained cards below the timeline.
Third-party effects should be recognizable to a human: messages, emails, tickets,
calendar events, documents and spreadsheet changes are examples, not a list of
implemented adapters. Use supplied content/metadata and supported layouts, with a
faithful neutral fallback when a familiar layout is unavailable. Slack is currently
the specialized layout. Captured Markdown is formatted inertly, without invented
senders, avatars or an “After” panel for a sent artifact.
Human-facing events describe starting, ending and supported effects, not API
return codes, session levels or transport identifiers.

For an already sanitized, checked snapshot:

```bash
node skills/visualize-scenario-run/scripts/render.mjs /approved/run.snapshot.json /approved/new-run-review.html
```

The script validates versioned contracts and references, returning JSON with an
HTML artifact path or field-level repair errors. It reads that local snapshot,
writes a new private-mode HTML file, refuses overwrites, and makes no network
requests. It does not fact-check or write the story. The parent must remove
secrets **before** saving or sharing evidence; the defensive scan is not a general
secret detector. The HTML escapes source content, loads no remote resources and
performs no feedback action.

Terminal Claude Code uses an available browser opener; a sidebar requires an
actually verified host capability. Default feedback is copy-to-chat, including
manual text selection if clipboard access fails. Automatic parent-bound transport
is **unsupported** and no adapter is enabled. The editor can close before feedback.
Do not infer this new skill's support across Claude Desktop, claude.ai or OpenCode
from the existing MCP-only skills. See the [host matrix and acceptance gate](skills/visualize-scenario-run/references/hosts.md)
and [integration notes](docs/visualization-integration.md).

### Updating the SDK reference

`skills/agent-development/references/` is a copy of the agent-writing half of the Guild CLI's skill in guildcode (`cli/docs/skills`). guildcode is the source of truth. Do not edit the copies here. `skills/CLI_SKILLS_SOURCE.txt` records the guildcode commit they came from.

To update them from a guildcode checkout at `$SRC`:

1. Write the header below to the top of each of the four files. It tells Claude which MCP tool stands in for each CLI command the text mentions.
2. Below the header, put the `## SDK Essentials` section and everything after it from `cli/docs/skills/agent-dev.md` into `sdk.md`.
3. Below the header, put `cli/docs/skills/agent-dev-references/compiler.md`, `integrations.md` and `project.md` into the files of the same name.
4. Write the guildcode commit hash to `skills/CLI_SKILLS_SOURCE.txt` and commit.

```markdown
<!-- Copied from guildcode cli/docs/skills. See "Updating the SDK reference" in the README. Do not edit. -->

> This reference is written for the Guild CLI. In this plugin, use the MCP
> tools instead and never run `guild`, `npm` or `git`:
>
> | CLI                                   | MCP tool                                        |
> | ------------------------------------- | ----------------------------------------------- |
> | `guild integration list`              | `guild_search_integrations`                     |
> | `guild integration operation list`    | `guild_list_integration_tools`                  |
> | `npm install <package>`               | add it to `dependencies` in `package.json`      |
> | `npm run build`, `guild agent save`   | `guild_create_agent_version`, then `guild_get_agent_version_validation` |
> | `guild workspace variable set`        | `guild_set_workspace_variable`                  |
```

## Wait for remote work

The plugin contains three skills, local review scripts, MCP settings, documentation and an icon.
It does not include a mod or a sessions pane.
Claude Code and Guild provide [native MCP Tasks](https://code.claude.com/docs/en/mcp#mcp-tasks-that-run-on-the-server) through the MCP connection.

If a wait returns an MCP Task, Claude Code tracks that task in the background.
You can continue the conversation while the Guild agent runs.
Claude Code makes short status requests and gets the result when it is ready.
It notifies Claude of the result without repeated model tool calls.
A wait returns its result directly if the work is already complete.

Clients without MCP Tasks support use an HTTP/SSE wait in the foreground.
Guild sends progress and the result through that connection.
If the wait window ends, the skill repeats the wait with the same execution IDs and receipt.
Claude reports errors and requests for user action.
Completion of a wait does not mean that the agent succeeded.
Cancellation of a wait does not stop the remote agent.

The plugin sends `X-Guild-MCP-Result-Format: compact` to request compact results.
The following session tools support this preference:

- `guild_start_agent_test_session`
- `guild_send_session_message`
- `guild_wait_for_session`

The guided test workflow uses `guild_start_profile_agent_test_session`.
Compact results for that tool require [Guildcode PR #17049](https://github.com/guildaidev/guildcode/pull/17049) to be merged and deployed.
Until then, profile-based starts return complete receipts.
The workflow still checks the selected profile, workspace and version before sending input.

Compact results keep execution IDs, status, required actions and the complete output.
They omit repeated entity metadata.
Other tools, including `guild_get_session` and `guild_get_session_events`, return complete responses.
Servers without compact-result support return complete responses.

To try this behavior:

1. Update the Guild plugin through `/plugin`.
2. Run `/reload-plugins`, or start a new Claude Code session.
3. Open `/mcp` to check the Guild connection.
4. Open `/tasks` to check MCP Tasks in the background.

The [reviewer guide](docs/reviewer-guide.md#try-a-background-run) gives a customer-feedback example and the expected results.

## Working on the plugin

Run the plugin from a checkout with `claude --plugin-dir .`. Before a commit:

```bash
claude plugin validate . --profile directory --strict
node --test skills/visualize-scenario-run/tests/*.test.mjs
```

The [reviewer guide](docs/reviewer-guide.md) has two example workflows, expected results, and the maintainer steps for a directory submission.

### Plugin evaluations

Use Claude Code's [native plugin evals](https://code.claude.com/docs/en/plugin-evals)
(Claude Code 2.1.269+) rather than a custom SDK or terminal test runner:

```bash
claude plugin eval init
claude plugin eval . --no-publish --max-cost-usd 5
```

Cases use `prompt.md`, `graders/*.md`, optional `case.yaml` context and native MCP
mocks under `evals/`. The default run compares with-plugin and no-plugin arms,
three runs each. These commands make billed model calls; inspect cases and grants
before running. Do not enable real servers for fixture evaluations.
See [visualization evals](skills/visualize-scenario-run/evals/README.md) for that
suite's command and current coverage limits. Renderer unit tests remain separate.
The native runner disables the Artifact tool; opening HTML and feedback delivery
still need real-host acceptance, not a replacement custom runner.

## Data handling

The declared connectors are `https://api.guild.ai/mcp` and the optional read-only evidence source `https://api.githubcopilot.com/mcp/readonly`. Building and running agents sends the arguments Claude supplies to Guild, including agent source, configuration, workspace identifiers and test inputs. Guild processes these to build and execute the requested agents. Agents can use the models and integrations configured for their workspace; their credentials and permissions are managed in Guild. Authorized GitHub evidence reads send repository, path and revision identifiers to GitHub and return file contents to Claude; no GitHub credential is stored in the plugin. GitHub access and revocation are separate from the Guild connection.

The two development skills use the declared Guild connector and do not require
local programs. The optional visualization skill starts the packaged Node.js
renderer, reads a sanitized local snapshot and writes a local HTML artifact.
It asks distinct review agents to use authorized source reads through available
connectors; confirm their access and read-only scope in the host. Local snapshots,
artifacts and copied feedback may contain personal data and remain until you
delete them. Sanitize and minimize them before sharing. The renderer and HTML
send no network requests or analytics; clicking a source link opens that service
in your browser. There is no hooks module or automatic feedback transport.
Claude makes Guild tool calls through the declared connector.
Claude Code applies its normal permission prompts.
The packaged renderer sends no data to other services and collects no analytics.

Guild session inputs, outputs and errors are read back from Guild through the same tools and can themselves contain personal data.

To revoke the connection, use Guild's Security > Connected apps. This does not delete Guild agents or session history. Guild-side use and retention are governed by the applicable customer agreement and [Guild's privacy policy](https://www.guild.ai/privacy-policy); the plugin does not set a server retention period. For deletion or privacy questions, contact privacy@guild.ai, or your organization's administrator when Guild processes the data on its behalf. These controls do not delete copies retained by Claude.

The [directory submission notes](docs/directory-submission.md) map the portal's findings to these disclosures and explain which data-handling answers need the submission owner's confirmation.

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
