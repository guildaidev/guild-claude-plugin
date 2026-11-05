/** One row of the list: a watched session as `guild_get_session` gives it. */
export type GuildSessionRow = {
  id: string
  /** The agent's short name, `smoke-test-recorder`. */
  agent: string
  /**
   * Whether `agent` names the agent, from the record or the session's events;
   * while it is false, `agent` holds the session type, `chat`.
   */
  isAgentKnown: boolean
  /** `webhook`, `chat`, `time` or `agent_test`. */
  kind: string
  /** What started it: `issues labeled`, a schedule's name, `chat`. */
  trigger: string
  /** The workspace's full name, `guildai~kristof-review`. */
  workspace: string
  createdAt: string
  lastActivityAt: string
  isInterrupted: boolean
  url: string
}

/** The root task's state, read per session from `guild_get_session`. */
export type GuildRunState = {
  /** `DONE`, `DISPATCHED`, `FAILED`, ...; `PENDING` before a root task exists. */
  status: string
  startedAt: string | null
  updatedAt: string | null
}

/** One line of the selected session's timeline. */
export type GuildEventRow = {
  id: string
  at: string
  /** A short label for the event type: `input`, `reply`, `console`, `error`. */
  label: string
  text: string
  isError: boolean
}

export type GuildSessionDetail = {
  id: string
  isLoading: boolean
  events: GuildEventRow[]
  /** The root task's `runtime_done` outcome, when the run wrote one. */
  outcome: string | null
  error: string | null
  fetchedAt: number | null
  /** The newest event read; the next read asks only for events after it. */
  lastEventId: string | null
}

export type GuildFeed = {
  isLoading: boolean
  error: string | null
  fetchedAt: number | null
}

/** The Guild sessions one conversation watches, newest watch first. */
export type GuildWatchList = {
  /** The Claude Code session id the list belongs to; null before the first read. */
  conversation: string | null
  ids: string[]
}

declare module 'claude-code' {
  // The mod's own tools, which the session's generated MCP declarations do
  // not list, so a `tool.call` matcher on one narrows to its arguments.
  interface McpToolInputs {
    'mcp__guild__watch_sessions': { session_ids: string[] }
    'mcp__guild__unwatch_sessions': { session_ids: string[] }
    'mcp__guild__pane_state': Record<never, never>
  }

  interface PluginState {
    guild: {
      watched: Shaped<GuildWatchList>
      feed: Shaped<GuildFeed>
      /** The watched sessions read so far, newest session first. */
      sessions: Shaped<GuildSessionRow[]>
      runs: Shaped<Record<string, GuildRunState>>
      selected: Shaped<string | null>
      detail: Shaped<GuildSessionDetail | null>
      /** Whether the pane is on screen; the footer is a button only while it is not. */
      paneOpen: Shaped<boolean>
      /** The Finished section's toggle; null follows the default, open while nothing runs. */
      finishedOpen: Shaped<boolean | null>
      /** Bumped each second while a running session is on screen, so its time counts up. */
      tick: Shaped<number>
    }
  }
}
