# Guild plugin for Claude

The plugin connects Claude to Guild's hosted MCP server at `https://api.guild.ai/mcp`.
Claude can build, test, publish, install, run and schedule Guild agents through this connection.
Claude can also read Guild sessions.
The plugin works in Claude Code, Claude Desktop and claude.ai.

## Install

```
/plugin marketplace add guildaidev/guild-claude-plugin
/plugin install guild@guild
```

The first tool call opens a Guild sign-in in your browser. You can disconnect at any time in Guild under Security > Connected apps.

## Skills

Both skills use MCP tools. A client's MCP Tasks support determines how it waits for results.
Neither skill uses the `guild` CLI, `npm` or `git`.

- `agent-development` builds, tests, publishes and installs an agent. It checks which integrations the test workspace has connected and hands out a connect link for a missing one.
- `build-triggered-agent` builds an agent that runs on a GitHub event.

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

The plugin contains two skills, MCP settings, documentation and an icon.
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

The plugin sends `X-Guild-MCP-Result-Format: compact` to request compact results for session creation, message submission and session waits.
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
```

The [reviewer guide](docs/reviewer-guide.md) has two example workflows, expected results, and the maintainer steps for a directory submission.

## Data handling

The declared connector is `https://api.guild.ai/mcp`. Building and running agents sends the arguments Claude supplies to Guild, including agent source, configuration, workspace identifiers and test inputs. Guild processes these to build and execute the requested agents. Agents can use the models and integrations configured for their workspace; their credentials and permissions are managed in Guild.

The plugin contains no executable code or hooks module.
It reads no local files, starts no programs and makes no direct HTTP requests.
Claude makes each Guild tool call through the declared connector.
Claude Code applies its normal permission prompts.
The plugin sends no data to other services and collects no analytics.

Guild session inputs, outputs and errors are read back from Guild through the same tools and can themselves contain personal data.

To revoke the connection, use Guild's Security > Connected apps. This does not delete Guild agents or session history. Guild-side use and retention are governed by the applicable customer agreement and [Guild's privacy policy](https://www.guild.ai/privacy-policy); the plugin does not set a server retention period. For deletion or privacy questions, contact privacy@guild.ai, or your organization's administrator when Guild processes the data on its behalf. These controls do not delete copies retained by Claude.

The [directory submission notes](docs/directory-submission.md) map the portal's findings to these disclosures and explain which data-handling answers need the submission owner's confirmation.

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
