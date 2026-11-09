# Guild plugin for Claude

Connects Claude Code to Guild's hosted MCP server at `https://api.guild.ai/mcp`, so Claude can build, privately test and revise agents on Guild, then publish, install, run and schedule them and read their sessions. It works in Claude Code, Claude Desktop and claude.ai.

## Install

```
/plugin marketplace add guildaidev/guild-claude-plugin
/plugin install guild@guild
```

The first tool call opens a Guild sign-in in your browser. You can disconnect at any time in Guild under Security > Connected apps.

## Skills

Both skills work through Guild MCP tools in Claude Code, Claude Desktop and
claude.ai. Neither requires the user to run the `guild` CLI, `npm` or `git`.

- `agent-development` guides workspace and connection setup, builds a private
  candidate, tests it on Guild, and revises it from feedback. Acceptance records
  the exact tested version for a separately requested production release.
- `build-triggered-agent` builds an agent that runs on a GitHub event.

Tests use a gateway profile to select integrations and credentials. The connected
Guild server must expose `guild_start_profile_agent_test_session` and the profile
setup tools; the skill stops if they are unavailable. A profile governs
Guild-brokered calls and does not make production services into test services.

To try a local checkout, start a new Claude Code session with
`claude --plugin-dir /absolute/path/to/guild-claude-plugin`, authenticate Guild
through `/mcp`, then invoke `/guild:agent-development` with your agent idea.
Loading a local plugin does not deploy changes to the connected Guild backend.

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

## Working on the plugin

Run the plugin from a checkout with `claude --plugin-dir .`. Before a commit:

```bash
claude plugin validate . --profile directory --strict
```

The [reviewer guide](docs/reviewer-guide.md) has two example workflows, expected results, and the maintainer steps for a directory submission.

## Data handling

The declared connector is `https://api.guild.ai/mcp`. Building and running agents sends the arguments Claude supplies to Guild, including agent source, configuration, workspace identifiers and test inputs. Guild processes these to build and execute the requested agents. Agents can use the models and integrations configured for their workspace; their credentials and permissions are managed in Guild.

The plugin is two skills, an icon and the connector declaration. It has no hooks module, runs no code of its own, reads no local files, starts no programs and makes no direct HTTP requests. Every Guild call is a tool call Claude makes through the declared connector, with Claude Code's normal permission prompts. The plugin does not send data to any other service and has no analytics.

Guild session inputs, outputs and errors are read back from Guild through the same tools and can themselves contain personal data.

To revoke the connection, use Guild's Security > Connected apps. This does not delete Guild agents or session history. Guild-side use and retention are governed by the applicable customer agreement and [Guild's privacy policy](https://www.guild.ai/privacy-policy); the plugin does not set a server retention period. For deletion or privacy questions, contact privacy@guild.ai, or your organization's administrator when Guild processes the data on its behalf. These controls do not delete copies retained by Claude.

The [directory submission notes](docs/directory-submission.md) map the portal's findings to these disclosures and explain which data-handling answers need the submission owner's confirmation.

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
