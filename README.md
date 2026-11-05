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

   You or your administrator add these rules. The plugin does not edit permission settings or approve its own calls.
2. For clickable rows in the desktop app's Terminal panel, `FORCE_HYPERLINK=1` in the CLI's environment. Claude Code sends links only to terminals it recognizes, and that panel (`TERM_PROGRAM=claude-desktop`) is not one of them, though it opens links. Without it a row is plain text there. iTerm, Ghostty, kitty, WezTerm and VS Code need nothing. One line in `~/.zshrc` sets it for that panel alone:

   ```bash
   [[ "$TERM_PROGRAM" == claude-desktop ]] && export FORCE_HYPERLINK=1
   ```

### Working on the pane

| File | What it holds |
| --- | --- |
| `hooks/hooks.json` | Names the hooks module |
| `hooks/register.tsx` | The pane, footer, command, local tools, refresh loop and Guild reads. Capability helpers share the hooks module so the directory scanner can trace them. |
| `types/index.d.ts` | The pane's `$.state` contract, named in `plugin.json` as `types` |
| `tests/guild-sessions.test.tsx` | Tests against recorded Guild answers |

Run the plugin from a checkout with `claude --plugin-dir .`; saving a file reloads the hooks module. Before a commit:

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

The [reviewer guide](docs/reviewer-guide.md) has three example workflows, expected results, and the maintainer steps for a directory submission.

## Data handling

The declared connector is `https://api.guild.ai/mcp`. Building and running agents sends the arguments Claude supplies to Guild, including agent source, configuration, workspace identifiers and test inputs. Guild processes these to build and execute the requested agents. Agents can use the models and integrations configured for their workspace; their credentials and permissions are managed in Guild.

The pane calls this plugin's Guild connector, or another connected server exposing Guild's tools as described above. It sends watched Guild session IDs to read their status and events, which can include the agent's input, output and errors. Polling continues while the pane is closed and the Claude Code session is running. With nothing watched, the pane makes no Guild session reads.

The mod uses Claude Code's plugin store to persist watched Guild session IDs, keyed by Claude Code session ID, and a last-watched timestamp. Its 200-conversation and 50-session limits are count limits, not expiration periods. It uses plugin state for the displayed session metadata and timeline. The last 30 connector-call diagnostics are held in module memory, including tool names, timing, errors and short response excerpts. `pane_state` returns the pane's data and diagnostics to Claude when called. The mod does not include a separate analytics uploader or a Claude transcript collector.

When Claude Code saves an oversized Guild tool result to a file, the pane reads `CLAUDE_CONFIG_DIR`, or `HOME` for the default `~/.claude`, to locate Claude Code's configuration directory. It checks the complete reported path is under that directory with a `projects/<project>/<session>/tool-results/` layout, has no `.` or `..` path segments, and names the server and tool it called. It reads the saved result without deleting it. A refused path is not read. The mod starts no programs or shell commands; saved copies remain under Claude Code's file management.

To remove a session from the stored watch list and stop polling it, ask Claude to unwatch it. Unwatching the last session removes that conversation's stored list. `/clear` starts a different list; resuming an older conversation restores its saved list. Closing the pane does not unwatch sessions. To stop the hooks, disable or uninstall the plugin and reload or close active Claude Code sessions. This does not delete Guild agents or session history. To revoke the connection, use Guild's Security > Connected apps.

Guild-side use and retention are governed by the applicable customer agreement and [Guild's privacy policy](https://www.guild.ai/privacy-policy); the plugin does not set a server retention period. The policy describes retaining personal data as necessary for the stated purposes and legal obligations. For deletion or privacy questions, contact privacy@guild.ai, or your organization's administrator when Guild processes the data on its behalf. These controls do not delete copies retained by Claude.

## Docs

https://docs.guild.ai/api-reference/mcp

Support: support@guild.ai
