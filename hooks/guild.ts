import type { EngineInterface } from 'claude-code'

import type { GuildEventRow, GuildRunState, GuildSessionRow } from '../types'

// This plugin's own server, `guild` in .mcp.json, as its tool names spell it:
// called ahead of any other server with Guild's tools (the claude.ai Guild
// connector, a server added by hand), and tried when the tool list names none
// yet.
const OWN_SERVER = 'plugin_guild_guild'
const PROBE_TOOL = 'guild_get_session'

/** One connector call the pane made, newest last; what `pane_state` reports. */
export type GuildCall = { at: string; tool: string; ms: number; outcome: string }

export const calls: GuildCall[] = []
let server: string | undefined

export const FINISHED = new Set(['DONE', 'FAILED', 'ERROR', 'CANCELLED', 'INTERRUPTED'])

const TIMELINE_TYPES = [
  'user_message',
  'agent_notification_message',
  'agent_notification_error',
  'agent_console',
  'runtime_error',
  'runtime_done',
  'system_error',
]

// Every task starts and ends with one of these, the root and its sub-agents
// included, and each carries little: a tool call's arguments, a run's outcome.
const AGENT_TYPES = ['runtime_start', 'runtime_done']

// The agent lookups in flight, by session id: a read of a session while one
// runs waits for its answer rather than asking the events again.
const lookups = new Map<string, Promise<string | null>>()

type Raw = Record<string, any>

// Only a server the tool list names is kept: a server can connect after the
// first refresh (a terminal session's claude.ai connectors do), so the
// fallback is retried.
async function guildServer($: EngineInterface): Promise<string> {
  if (server !== undefined) return server
  const found = (await $.tool.list())
    .map(tool => new RegExp(`^mcp__(.+)__${PROBE_TOOL}$`).exec(tool.name)?.[1])
    .filter((name): name is string => name !== undefined)
  server = found.includes(OWN_SERVER) ? OWN_SERVER : found[0]

  return server ?? OWN_SERVER
}

export async function guildToolName($: EngineInterface, tool: string): Promise<string> {
  return `mcp__${await guildServer($)}__${tool}`
}

async function callGuild($: EngineInterface, tool: string, args: Record<string, unknown>): Promise<Raw> {
  const started = await $.clock.now()
  const note = async (outcome: string) => {
    const ended = await $.clock.now()
    calls.push({ at: new Date(ended).toISOString(), tool, ms: ended - started, outcome })
    calls.splice(0, Math.max(0, calls.length - 30))
  }
  const name = await guildServer($)
  let result
  try {
    result = await $.mcp.call(name, tool, args)
  } catch (error) {
    const message = messageOf(error)
    await note(`threw: ${message}`)
    // A call the pane makes from code has no model request for auto mode's
    // classifier to judge, so only a settings allow rule lets it through.
    if (message.includes('auto mode classifier')) {
      throw new Error(
        `Auto mode can't approve the pane's own calls to Guild. Add allow rules for mcp__${name}__guild_get_session and mcp__${name}__guild_get_session_events to permissions.allow in your settings.`,
      )
    }
    throw new Error(`The Guild connector call ${tool} on server "${name}" failed: ${message}`)
  }
  let text = result.content.map(block => (block.type === 'text' ? (block.text ?? '') : '')).join('')
  if (result.isError) {
    await note(`isError: ${text.slice(0, 300)}`)
    throw new Error(text.slice(0, 300) || `${tool} failed`)
  }
  // A result past the tool-output limit comes back as a notice naming the
  // file the engine saved it to; the whole answer is in that file, which
  // nothing else reads, so it goes once read.
  const saved = /saved to (\/\S+?\.(?:txt|json))\b/.exec(text)
  let fromFile = ''
  if (saved?.[1]) {
    text = await $.fs.read(saved[1])
    fromFile = ` (read from the saved file, ${await removeSaved($, saved[1], tool)})`
  }
  try {
    const parsed = JSON.parse(text) as Raw
    await note(`ok, ${text.length} characters${fromFile}`)

    return parsed
  } catch {
    await note(`not JSON, ${text.length} characters: ${text.slice(0, 200)}`)
    throw new Error(`${tool} answered with text that is not JSON: ${text.slice(0, 200)}`)
  }
}

// The engine's own copy of one Guild tool's answer, in a session's
// tool-results folder; nothing else is ever removed.
const SAVED_FILE = /^\/.+\/\.claude\/projects\/[^/]+\/[^/]+\/tool-results\/mcp-[^/]+\.(?:txt|json)$/

async function removeSaved($: EngineInterface, path: string, tool: string): Promise<string> {
  const name = path.slice(path.lastIndexOf('/') + 1)
  if (!SAVED_FILE.test(path) || path.includes('/../') || !name.includes(`-${tool}-`)) {
    return 'kept: not a saved result file'
  }
  try {
    const { exitCode, stderr } = await $.process.run(['/bin/rm', '-f', '--', path], { timeoutMs: 5000 })

    return exitCode === 0 ? 'removed' : `kept: rm exited ${exitCode}: ${stderr.trim().slice(0, 120)}`
  } catch (error) {
    return `kept: ${messageOf(error)}`
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * A session's row and its root task's state, from one `guild_get_session`.
 * When the record names no agent, the row takes `knownAgent`, an earlier
 * read's, or else the root agent its events name.
 */
export async function getSession(
  $: EngineInterface,
  sessionId: string,
  knownAgent: string | null = null,
): Promise<{ row: GuildSessionRow; run: GuildRunState }> {
  const session = await callGuild($, 'guild_get_session', { session_id: sessionId })
  const root = session.root_task as Raw | null | undefined
  const status = session.interrupted_at ? 'INTERRUPTED' : (root?.status ?? 'PENDING')
  let row = toRow(session)
  if (!row.isAgentKnown) {
    const agent = knownAgent ?? (await rootAgentOf($, sessionId))
    if (agent !== null) row = { ...row, agent, isAgentKnown: true }
  }

  return {
    row,
    run: { status, startedAt: root?.created_at ?? null, updatedAt: root?.updated_at ?? null },
  }
}

// One lookup per session at a time; a read that lands while one runs shares it.
function rootAgentOf($: EngineInterface, sessionId: string): Promise<string | null> {
  const running = lookups.get(sessionId)
  if (running) return running
  const lookup = readRootAgent($, sessionId).finally(() => lookups.delete(sessionId))
  lookups.set(sessionId, lookup)

  return lookup
}

// The root agent task is the agent task with no parent, which every event
// names through its own task or that task's parent; a sub-agent, an agent task
// with a parent, is never taken. Null when the page names no root or the read
// fails: the record was read, so the session is still watched, and `callGuild`
// has listed the failed call for `pane_state`.
async function readRootAgent($: EngineInterface, sessionId: string): Promise<string | null> {
  try {
    const page = await callGuild($, 'guild_get_session_events', {
      session_id: sessionId,
      types: AGENT_TYPES,
      limit: 40,
    })
    const items: Raw[] = Array.isArray(page.items) ? page.items : []
    for (const event of items) {
      for (const task of [event.task, event.task?.parent_task] as (Raw | null | undefined)[]) {
        if (!task || task.entity_type !== 'EntTaskAgent' || task.parent_task_id) continue
        const name = task.agent?.name ?? task.agent?.full_name
        if (name) return String(name)
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * The session's timeline lines, or with `fromId` only those after that event,
 * and the id of the newest event read, for the next call's `fromId`.
 */
export async function getTimeline(
  $: EngineInterface,
  sessionId: string,
  fromId: string | null,
): Promise<{ events: GuildEventRow[]; outcome: string | null; lastEventId: string | null }> {
  const page = await callGuild($, 'guild_get_session_events', {
    session_id: sessionId,
    limit: 40,
    types: TIMELINE_TYPES,
    ...(fromId === null ? {} : { from_id: fromId }),
  })
  const items: Raw[] = Array.isArray(page.items) ? page.items : []
  const sorted = [...items].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  const lastEventId = sorted.length > 0 ? String(sorted[sorted.length - 1]?.id) : fromId
  let outcome: string | null = null
  const events: GuildEventRow[] = []
  for (const event of sorted) {
    const isRootDone =
      event.type === 'runtime_done' &&
      event.task?.entity_type === 'EntTaskAgent' &&
      !event.task?.parent_task_id
    if (event.type === 'runtime_done') {
      if (isRootDone) outcome = textOf(event.content) || outcome
      continue
    }
    events.push({
      id: String(event.id),
      at: String(event.created_at),
      label: LABELS[event.type] ?? event.type,
      text: textOf(event.content).slice(0, 400),
      isError: /error/.test(event.type) || event.level === 'ERROR',
    })
  }

  return { events, outcome, lastEventId }
}

const LABELS: Record<string, string> = {
  user_message: 'input',
  agent_notification_message: 'reply',
  agent_notification_error: 'error',
  agent_console: 'console',
  runtime_error: 'error',
  system_error: 'error',
}

function toRow(raw: Raw): GuildSessionRow {
  const trigger: Raw = raw.trigger ?? {}
  // A test session names its agent only in the version it runs; a chat
  // session names it nowhere in its record.
  const agent: Raw =
    trigger.agent ?? raw.agent ?? raw.workspace_agent?.agent ?? raw.agent_version_override?.agent ?? {}
  const name = agent.name ?? agent.full_name
  const kind = String(raw.session_type ?? 'session')
  const what =
    kind === 'webhook'
      ? [trigger.event_type ?? raw.webhook?.event, trigger.action ?? raw.webhook?.action].filter(Boolean).join(' ')
      : (trigger.name ?? kind)

  return {
    id: String(raw.id),
    agent: String(name ?? kind),
    isAgentKnown: name != null,
    kind,
    trigger: what || kind,
    workspace: String(raw.workspace?.full_name ?? ''),
    createdAt: String(raw.created_at),
    lastActivityAt: String(raw.last_activity_at ?? raw.updated_at ?? raw.created_at),
    isInterrupted: Boolean(raw.interrupted_at),
    url: String(raw.session_url ?? `https://app.guild.ai/sessions/${raw.id}`),
  }
}

function textOf(content: unknown): string {
  if (content == null) return ''
  if (typeof content === 'string') return unfence(content)
  if (typeof content === 'object') {
    const value = content as Raw
    const picked = value.outcome ?? value.text ?? value.message ?? value.result
    if (typeof picked === 'string') return unfence(picked)
  }

  return JSON.stringify(content)
}

// Guild stores a JSON input as a ```json fence; show what is inside it.
function unfence(text: string): string {
  const fenced = /^```[a-z]*\n([\s\S]*?)\n?```\s*$/.exec(text.trim())

  return (fenced?.[1] ?? text).trim()
}
