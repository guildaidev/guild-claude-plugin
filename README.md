# Guild plugin for Claude

Connects Claude Code to Guild's hosted MCP server at `https://api.guild.ai/mcp`, so Claude can build, publish, install, run and schedule Guild agents and read their sessions.

## Install

```
/plugin marketplace add guildaidev/guild-claude-plugin
/plugin install guild@guild
```

The first tool call opens a Guild sign-in in your browser. You can disconnect at any time in Guild under Security > Connected apps.

## Skills

Both skills work only through the MCP tools, so they run the same in Claude Code, Claude Desktop and claude.ai. Neither uses the `guild` CLI, `npm` or `git`.

- `agent-development` builds, tests, publishes and installs an agent.
- `build-triggered-agent` builds an agent that runs on a GitHub event.

`skills/agent-development/references/` is the SDK documentation from the Guild CLI's skill in guildcode (`cli/docs/skills`). Don't edit it here. To update it, run `scripts/sync-cli-skills.sh <path-to-guildcode>` and commit. `skills/CLI_SKILLS_SOURCE` records the guildcode commit it came from.

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
