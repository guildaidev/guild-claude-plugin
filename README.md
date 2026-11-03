# Guild plugin for Claude

Connects Claude Code to Guild's hosted MCP server at `https://api.guild.ai/mcp`, so Claude can build, publish, install, run and schedule Guild agents and read their sessions. In Claude Code it also adds a pane beside the chat that follows the Guild sessions a conversation works with.

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

## Guild sessions pane

The pane runs in Claude Code only: the terminal, and the Code tab of the Claude desktop app. It is a hooks module (`hooks/register.tsx`), which Claude Desktop's chat and claude.ai do not load; the connector and the skills work there without it.

- Each conversation keeps a list of watched Guild sessions. Claude adds a session with the `mcp__guild__watch_sessions` tool as soon as it becomes relevant: one Claude starts or triggers, one you name or link, one Claude reads or debugs. The tool is in Claude's tool list from the first turn, so Claude needs no search to find it. Watching reads the session first and refuses an id Guild cannot read. Claude takes sessions off with `mcp__guild__unwatch_sessions`.
- `/guild-sessions` opens the pane. On the desktop it lists running sessions, then finished ones in a section that folds. A card shows the workspace, the agent and the run time; clicking it opens the session's first input, when it started, its trigger, how it ended, the last 12 events of its timeline and its outcome, with an Open in Guild link. In a terminal each row is the session's link on app.guild.ai.
- While the conversation watches a session, the prompt footer shows `🤖 N Guild sessions running`. It is a button that opens the pane while the pane is closed.
- `mcp__guild__pane_state` lets Claude read what the pane shows, including the last 30 Guild calls and how each ended, when you say the pane is wrong.

Every 20 seconds each watched session that is still running is read again with `guild_get_session`, so the footer count stays current; a finished session is read once. A chat session's agent is read once from its events. The list is kept under the Claude Code session id, so it survives a restart and a resume; `/clear` starts an empty one. The pane keeps the 200 conversations that watched something most recently, up to 50 sessions each.

### What the pane needs

1. Two allow rules in `permissions.allow` in `~/.claude/settings.json`, one per read-only Guild tool the pane calls:

   ```json
   "mcp__plugin_guild_guild__guild_get_session",
   "mcp__plugin_guild_guild__guild_get_session_events"
   ```

   The pane calls Guild from code, with no model request behind the call, so auto mode's classifier refuses it and only an allow rule lets it through. The pane calls this plugin's own server first. When that server is not connected it uses any other server with Guild's tools, such as the claude.ai Guild connector, and the rules then carry that server's name. If a rule is missing, the `watch_sessions` refusal and the pane show the exact names to add.
2. For clickable rows in the desktop app's Terminal panel, `FORCE_HYPERLINK=1` in the CLI's environment. Claude Code sends links only to terminals it recognizes, and that panel (`TERM_PROGRAM=claude-desktop`) is not one of them, though it opens links. Without it a row is plain text there. iTerm, Ghostty, kitty, WezTerm and VS Code need nothing. One line in `~/.zshrc` sets it for that panel alone:

   ```bash
   [[ "$TERM_PROGRAM" == claude-desktop ]] && export FORCE_HYPERLINK=1
   ```

### Working on the pane

| File | What it holds |
| --- | --- |
| `hooks/hooks.json` | Names the hooks module |
| `hooks/register.tsx` | The watched list, the pane, the footer, the command, the `watch_sessions`, `unwatch_sessions` and `pane_state` tools, the refresh loop |
| `hooks/guild.ts` | The Guild calls: finding the server, reading an oversized result from the file Claude Code saved it to (then removing that file), parsing sessions and timelines, looking up a chat session's agent in its events |
| `types/index.d.ts` | The pane's `$.state` contract, named in `plugin.json` as `types` |
| `tests/guild-sessions.test.tsx` | Tests against recorded Guild answers |

Run the plugin from a checkout with `claude --plugin-dir .`; saving a file reloads the hooks module. Before a commit:

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
