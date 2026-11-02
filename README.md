# Guild plugin for Claude

Connects Claude Code to Guild's hosted MCP server at `https://api.guild.ai/mcp`, so Claude can build, publish, install, run and schedule Guild agents and read their sessions.

## Install

```
/plugin marketplace add guildaidev/guild-claude-plugin
/plugin install guild@guild
```

The first tool call opens a Guild sign-in in your browser. You can disconnect at any time in Guild under Security > Connected apps.

## Skills

- `agent-development`, `integrations` and `factory-setup` are the Guild CLI's own skills, the ones `guild setup` installs. They are copied from `cli/docs/skills` in guildcode; do not edit them here. To update them, run `scripts/sync-cli-skills.sh <path-to-guildcode>` and commit. `skills/CLI_SKILLS_SOURCE` records the guildcode commit they came from.
- `build-triggered-agent` is written for this plugin.

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
