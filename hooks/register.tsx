import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren, Timer } from 'claude-code'

import type { GuildFeed, GuildRunState, GuildSessionDetail, GuildSessionRow, GuildWatchList } from '../types'
import { calls, FINISHED, getSession, getTimeline, guildToolName } from './guild'

const PANE = 'guild-sessions'
const STATE_TOOL = 'mcp__guild__pane_state'
const WATCH_TOOL = 'mcp__guild__watch_sessions'
const UNWATCH_TOOL = 'mcp__guild__unwatch_sessions'
const TITLE = 'Guild sessions'
const POLL_MS = 20_000
// Each conversation's list outlives the process in the store under this key,
// keyed by the session id, for the newest conversations that watched any.
const STORE_KEY = 'watched'
const KEPT_CONVERSATIONS = 200
const MAX_WATCHED = 50
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const IDLE_FEED: GuildFeed = { isLoading: false, error: null, fetchedAt: null }
const NO_WATCH: GuildWatchList = { conversation: null, ids: [] }

const SESSION_IDS_SCHEMA = {
  type: 'object',
  properties: {
    session_ids: {
      type: 'array',
      items: { type: 'string', pattern: SESSION_ID.source },
      minItems: 1,
      maxItems: 20,
      description: 'Guild session ids, such as 01a189ff-d91b-5f3d-0000-addf52bbfdd8',
    },
  },
  required: ['session_ids'],
}

// Each value outlives a reload; bump its tag when its shape changes.
const watched = atom({ plugin: 'guild', key: 'watched' } as const, NO_WATCH, { shape: 'watched-1' })
const feed = atom({ plugin: 'guild', key: 'feed' } as const, IDLE_FEED, { shape: 'feed-2' })
const sessions = atom({ plugin: 'guild', key: 'sessions' } as const, [] as GuildSessionRow[], {
  shape: 'sessions-3',
})
const runs = atom({ plugin: 'guild', key: 'runs' } as const, {} as Record<string, GuildRunState>, {
  shape: 'runs-2',
})
const selected = atom({ plugin: 'guild', key: 'selected' } as const, null as string | null, {
  shape: 'selected-2',
})
const detail = atom({ plugin: 'guild', key: 'detail' } as const, null as GuildSessionDetail | null, {
  shape: 'detail-2',
})
const paneOpen = atom({ plugin: 'guild', key: 'paneOpen' } as const, false, { shape: 'pane-open-1' })
const finishedOpen = atom({ plugin: 'guild', key: 'finishedOpen' } as const, null as boolean | null, {
  shape: 'finished-open-1',
})
const tick = atom({ plugin: 'guild', key: 'tick' } as const, 0, { shape: 'tick-1' })

// The desktop's Background tasks card: a faint fill that reads on a light or a
// dark theme, a little stronger under the pointer.
const CARD = 'rgba(127, 127, 127, 0.08)'
const CARD_HOVER = 'rgba(127, 127, 127, 0.14)'

type KeptLists = Record<string, { ids: string[]; at: number }>
type Read = { row: GuildSessionRow; run: GuildRunState }

let poller: Timer | undefined
let ticker: Timer | undefined
const loadingDetail = new Set<string>()

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // The count lives in the footer now; clear what an earlier version pinned
    // to the status line, which the app labels with the mod's name.
    $.ui.status(undefined)
    await $.command.register({
      name: 'guild-sessions',
      description: 'Show the Guild sessions this conversation watches',
    })
    // In the prompt's tool list from turn one, so Claude knows to watch a
    // session without searching for the tool first.
    await $.tool.register({
      name: 'watch_sessions',
      description:
        "Add Guild sessions to the list this conversation watches. The Guild sessions pane beside the chat shows only watched sessions, with each one's status and timeline, and its footer button appears once a session is watched. Call this as soon as a Guild session becomes relevant to the conversation, running or finished: one you start or trigger, one the person names or links, one you read, debug or wait on. Pass each session's id, the UUID that ends its app.guild.ai/sessions/ URL. A session already watched stays as it is.",
      inputSchema: SESSION_IDS_SCHEMA,
      isDeferred: false,
    })
    later($, () =>
      $.tool.register({
        name: 'unwatch_sessions',
        description:
          'Remove Guild sessions from the list this conversation watches, when they no longer matter to it or the person asks. Pass the session ids.',
        inputSchema: SESSION_IDS_SCHEMA,
      }),
    )
    // Lets Claude read what the pane shows when the person says it is wrong.
    later($, () =>
      $.tool.register({
        name: 'pane_state',
        description:
          'Read what the Guild sessions pane shows now: the sessions this conversation watches, any error it shows, the opened session, and the last connector calls it made with how each ended.',
        inputSchema: { type: 'object', properties: {} },
      }),
    )
    later($, () => refresh($))
    poller?.cancel()
    poller = $.clock.every(POLL_MS, () => void poll($))
    ticker?.cancel()
    ticker = $.clock.every(1000, () => void tickWhileRunning($))

    return next(e)
  })

  // A /clear or a resume goes on in this process under another session id,
  // whose list is another one; no session.start fires for it.
  on('session.end', async ($, e, next) => {
    const ended = await next(e)
    if (e.reason === 'clear' || e.reason === 'resume') later($, () => refresh($))

    return ended
  })

  // The person's close mark (and any other close) takes the pane off screen;
  // openPane records the opens, which do not pass this mod's own hooks.
  on('ui.close', { id: PANE }, async ($, e, next) => {
    const closed = await next(e)
    await update($, paneOpen, () => false)

    return closed
  })

  // Beside the mode labels at the right of the prompt footer, only while the
  // conversation watches a session: the running count, as text while the pane
  // is open and as a button that opens it while it is closed. The desktop draws
  // that slot flat (no box, padding, SVG, Client region or child order, every
  // button the same pill, cut near 30 characters), so the button's own pill is
  // the box and the mark is a glyph.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const [ids, state, rows, runMap, isOpen] = await Promise.all([
      watchedIds($),
      read($, feed),
      read($, sessions),
      read($, runs),
      read($, paneOpen),
    ])
    if (ids.length === 0 || (state.fetchedAt === null && isOpen)) return next(e)
    const shown = rows.filter(row => ids.includes(row.id))
    const { Box, Text, Button } = $.ui.resolve(e)
    const gap = gapOf(e.surface)

    return (
      <Box flexDirection="row" gap={1}>
        {e.props.modes.length > 0 && <Text dimColor>{e.props.modes.join(' & ')}</Text>}
        {isOpen ? (
          <Text dimColor>{footerLineOf(runningLineOf(shown, runMap), gap)}</Text>
        ) : (
          <Button
            key="open-sessions"
            plain
            onPress={async () => {
              // Opened inside the press, so the surface places it as asked for.
              await openPane($)
              later($, () => refresh($))
            }}
          >
            {pillTextOf(state.fetchedAt === null ? null : runningLineOf(shown, runMap), gap)}
          </Button>
        )}
      </Box>
    )
  })

  on('tool.call', { tool: WATCH_TOOL }, async ($, e) => {
    const asked = idsOf(e.session_ids)
    if (asked.length === 0) return { deny: 'Pass session_ids: one or more Guild session ids.' }
    const ids = await syncConversation($)
    const fresh = asked.filter(id => !ids.includes(id))
    const outcomes = await Promise.all(
      fresh.map(async id => {
        try {
          return { id, read: await getSession($, id) }
        } catch (error) {
          return { id, error: messageOf(error) }
        }
      }),
    )
    const found = outcomes.flatMap(outcome => (outcome.read ? [outcome.read] : []))
    await keepRead($, found)
    // Rows read here count as read for the footer until the next refresh.
    const now = await $.clock.now()
    await update($, feed, current => ({ ...current, fetchedAt: current.fetchedAt ?? now }))
    const list = await changeWatched($, current => [
      ...found.map(({ row }) => row.id).filter(id => !current.includes(id)),
      ...current,
    ])

    const lines = asked.map(id => {
      if (ids.includes(id)) return `${id}: already watched`
      const outcome = outcomes.find(each => each.id === id)
      if (outcome?.read) {
        const { row, run } = outcome.read

        return `${id}: watching ${row.agent} in ${row.workspace}, ${run.status.toLowerCase()}`
      }

      return `${id}: not watched, ${outcome?.error ?? 'not read'}`
    })
    const text = [`This conversation watches ${countOf(list.ids.length)}.`, ...lines].join('\n')

    return found.length === 0 && fresh.length > 0 ? { deny: text } : { result: text }
  })

  on('tool.call', { tool: UNWATCH_TOOL }, async ($, e) => {
    const asked = idsOf(e.session_ids)
    if (asked.length === 0) return { deny: 'Pass session_ids: one or more Guild session ids.' }
    const list = await unwatch($, asked)

    return { result: `This conversation watches ${countOf(list.ids.length)}.` }
  })

  on('tool.call', { tool: STATE_TOOL }, async $ => {
    const [ids, state, rows, runMap, chosen, opened, isOpen] = await Promise.all([
      watchedIds($),
      read($, feed),
      read($, sessions),
      read($, runs),
      read($, selected),
      read($, detail),
      read($, paneOpen),
    ])
    const shown = rows.filter(row => ids.includes(row.id))
    const getTool = await guildToolName($, 'guild_get_session')
    const probe = await $.tool
      .check({ tool: getTool, input: { session_id: ids[0] ?? '00000000-0000-0000-0000-000000000000' } })
      .catch(error => ({ threw: String(error) }))
    const line = state.fetchedAt === null ? null : footerLineOf(runningLineOf(shown, runMap))
    const report = {
      conversation: await $.session.id(),
      watched: ids,
      footer: {
        shows: ids.length === 0 ? null : isOpen ? line : `button: ${pillTextOf(line === null ? null : runningLineOf(shown, runMap))}`,
      },
      feed: state,
      sessions: shown.map(row => ({ ...row, status: runMap[row.id]?.status ?? 'PENDING' })),
      selected: chosen,
      detail: opened,
      calls,
      permission: { tool: getTool, verdict: probe },
    }

    return { result: JSON.stringify(report, null, 2) }
  })

  on('command.run', { command: 'guild-sessions' }, async $ => {
    const opened = await openPane($)
    later($, () => refresh($))
    const ids = await syncConversation($)
    if (!opened.isPlaced) return { text: `The Guild sessions pane did not open: ${opened.reason}` }

    return {
      text:
        ids.length === 0
          ? 'No Guild sessions are watched in this conversation yet.'
          : `Showing the ${countOf(ids.length)} this conversation watches.`,
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const [ids, state, rows, runMap, chosen, opened, isFinishedOpen, now] = await Promise.all([
      watchedIds($),
      read($, feed),
      read($, sessions),
      read($, runs),
      read($, selected),
      read($, detail),
      read($, finishedOpen),
      // Subscribes the drawing to the tick, which moves a running session's time.
      read($, tick).then(() => $.clock.now()),
    ])
    const shown = rows.filter(row => ids.includes(row.id))
    const statusOf = (row: GuildSessionRow) => runMap[row.id]?.status ?? 'PENDING'
    const error = state.error && (
      <Text color="error" wrap="wrap">
        {state.error}
      </Text>
    )

    if (ids.length === 0) {
      return (
        <Text dimColor wrap="wrap">
          No Guild sessions are watched in this conversation yet. Claude adds a session here when it becomes part of
          the work.
        </Text>
      )
    }

    // Outside fullscreen a terminal keeps clicks to itself: it opens a link and
    // never presses a Button, so there a row is the session's link.
    if (e.surface === 'terminal') {
      return (
        <Box flexDirection="column" gap={1}>
          {error}
          <Box flexDirection="column">
            {shown.map(row => (
              <Text>
                <Text color={toneOf(statusOf(row))}>{dotOf(statusOf(row))}</Text>{' '}
                <Link href={row.url}>
                  {row.agent}{' '}
                  <Text dimColor>
                    {row.trigger} · {agoOf(row.createdAt, now)}
                  </Text>
                </Link>
              </Text>
            ))}
          </Box>
        </Box>
      )
    }

    // The desktop pane follows Claude Code's Background tasks panel: running
    // sessions on top, the finished ones in a section that folds, each a card
    // that opens the session in the pane as a subagent's card opens its run.
    // The round border is what rounds the corners on desktop, and it brings its
    // own padding: Background tasks' 46 px row with nothing added inside, and
    // a cell of negative margin on the row inside brings the text to about its
    // 12 px from the edges (measured 2026-10-29). A column, so what it holds
    // spans the card's width.
    const card = (key: string, child: RenderChildren) => (
      <Box
        key={key}
        flexDirection="column"
        backgroundColor={CARD}
        hover={{ backgroundColor: CARD_HOVER }}
        borderStyle="round"
        borderColor={CARD}
      >
        {child}
      </Box>
    )
    const chosenRow = shown.find(row => row.id === chosen)
    if (chosenRow) {
      const status = statusOf(chosenRow)
      const run = runMap[chosenRow.id]
      const isOpened = opened?.id === chosenRow.id
      const events = isOpened ? opened.events : []
      const input = events.find(event => event.label === 'input')

      return (
        <Box flexDirection="column" gap="md">
          <Box flexDirection="row" alignItems="center" gap="xs">
            <Button key="back" plain label="‹" onPress={() => choose($, null)} />
            <Box flexShrink={1}>
              <Text weight="medium" wrap="truncate-end">
                {chosenRow.agent}
              </Text>
            </Box>
            <Box flexGrow={1} />
            <Link href={chosenRow.url} label="Open in Guild" />
          </Box>
          {input &&
            card(
              'input',
              <Box paddingX="md" paddingY="sm">
                <Text wrap="wrap">{input.text}</Text>
              </Box>,
            )}
          <Text dimColor size="footnote" wrap="wrap">
            {[`${agoOf(chosenRow.createdAt, now)} ago`, chosenRow.workspace, chosenRow.trigger].filter(Boolean).join(' · ')}
          </Text>
          <Text color={toneOf(status)} size="footnote">
            {stateLineOf(status, run, chosenRow, now)}
          </Text>
          {error}
          {isOpened && opened.error && (
            <Text color="error" wrap="wrap">
              {opened.error}
            </Text>
          )}
          {(!isOpened || (opened.isLoading && opened.events.length === 0)) && (
            <Text dimColor>Reading the session's events…</Text>
          )}
          {events.length > 0 && (
            <Box flexDirection="column" gap="xs">
              {events
                .filter(event => event !== input)
                .slice(-12)
                .map(event => (
                  <Box flexDirection="row" gap="sm">
                    <Text dimColor size="footnote" tabular>
                      {clockOf(event.at)}
                    </Text>
                    <Text color={event.isError ? 'error' : 'subtle'} size="footnote">
                      {event.label}
                    </Text>
                    <Box flexShrink={1}>
                      <Text wrap="wrap">{event.text}</Text>
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
          {isOpened && opened.outcome && <Text wrap="wrap">{opened.outcome}</Text>}
        </Box>
      )
    }

    const running = shown.filter(row => !FINISHED.has(statusOf(row)))
    const finished = shown.filter(row => FINISHED.has(statusOf(row)))
    const isFinishedShown = isFinishedOpen ?? running.length === 0
    const sessionCard = (row: GuildSessionRow) => {
      const status = statusOf(row)

      // A Button draws its text in one style, whatever the Text inside says, so
      // the title is the press and the chevron and time sit beside it, dimmed.
      return card(
        `card-${row.id}`,
        <Box flexDirection="row" alignItems="center" marginX={-1}>
          <Box flexShrink={1}>
            <Button key={`row-${row.id}`} plain onPress={() => choose($, row.id)}>
              {[row.workspace, row.agent].filter(Boolean).join(' · ')}
            </Button>
          </Box>
          <Text dimColor>›</Text>
          <Box flexGrow={1} />
          <Text
            color={status === 'FAILED' || status === 'ERROR' ? 'error' : undefined}
            dimColor={status !== 'FAILED' && status !== 'ERROR'}
            size="footnote"
            tabular
          >
            {cardTimeOf(status, runMap[row.id], row, now)}
          </Text>
        </Box>,
      )
    }

    return (
      <Box flexDirection="column" gap="lg">
        {error}
        {running.length > 0 && (
          <Box flexDirection="column" gap="sm">
            <Text dimColor size="footnote">{`Running ${running.length}`}</Text>
            {running.map(sessionCard)}
          </Box>
        )}
        {finished.length > 0 && (
          <Box flexDirection="column" gap="sm">
            <Button key="finished" plain dimColor onPress={() => later($, () => toggleFinished($))}>
              {`${isFinishedShown ? '▾' : '▸'} Finished ${finished.length}`}
            </Button>
            {isFinishedShown && finished.map(sessionCard)}
          </Box>
        )}
      </Box>
    )
  })
}

// Flips the Finished section from what it shows now, its default included.
async function toggleFinished($: EngineInterface): Promise<void> {
  const [ids, rows, runMap] = await Promise.all([watchedIds($), read($, sessions), read($, runs)])
  const isRunning = rows.some(row => ids.includes(row.id) && !FINISHED.has(runMap[row.id]?.status ?? 'PENDING'))
  await update($, finishedOpen, current => !(current ?? !isRunning))
}

// Moves a running session's time each second, only while the pane shows one.
async function tickWhileRunning($: EngineInterface): Promise<void> {
  const [isOpen, ids, rows, runMap] = await Promise.all([
    read($, paneOpen),
    watchedIds($),
    read($, sessions),
    read($, runs),
  ])
  if (!isOpen) return
  if (!rows.some(row => ids.includes(row.id) && !FINISHED.has(runMap[row.id]?.status ?? 'PENDING'))) return
  await update($, tick, count => count + 1)
}

async function openPane($: EngineInterface) {
  const opened = await $.ui.open({ id: PANE, title: TITLE })
  await update($, paneOpen, () => opened.isPlaced)

  return opened
}

// Work a press or a timer starts runs on its own timer, not inside the
// dispatch that asked for it.
function later($: EngineInterface, work: () => Promise<unknown>): void {
  $.clock.after(1, () => {
    void work().catch(() => undefined)
  })
}

// The ids drawn: the list, while it is this conversation's. A render cannot
// write, so a list left from before a /clear draws as none until a refresh.
async function watchedIds($: EngineInterface): Promise<string[]> {
  const [list, conversation] = await Promise.all([read($, watched), $.session.id()])

  return list.conversation === conversation ? list.ids : []
}

async function keptLists($: EngineInterface): Promise<KeptLists> {
  const value = await $.store.get(STORE_KEY)

  return value !== null && typeof value === 'object' ? (value as KeptLists) : {}
}

// Loads the conversation's list from the store when the session id moved
// (a new session, a /clear, a resume) and drops what the old list drew.
async function syncConversation($: EngineInterface): Promise<string[]> {
  const conversation = await $.session.id()
  const current = await read($, watched)
  if (current.conversation === conversation) return current.ids
  const ids = (await keptLists($))[conversation]?.ids ?? []
  await update($, watched, () => ({ conversation, ids }))
  await update($, sessions, rows => rows.filter(row => ids.includes(row.id)))
  await update($, selected, () => null)
  await update($, detail, () => null)

  return ids
}

async function changeWatched(
  $: EngineInterface,
  change: (ids: readonly string[]) => string[],
): Promise<GuildWatchList> {
  await syncConversation($)
  const list = await update($, watched, current => ({
    conversation: current.conversation,
    ids: change(current.ids).slice(0, MAX_WATCHED),
  }))
  if (list.conversation === null) return list
  const kept = await keptLists($)
  if (list.ids.length === 0) delete kept[list.conversation]
  else kept[list.conversation] = { ids: list.ids, at: await $.clock.now() }
  const newest = Object.entries(kept)
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, KEPT_CONVERSATIONS)
  await $.store.set(STORE_KEY, Object.fromEntries(newest))

  return list
}

async function unwatch($: EngineInterface, ids: readonly string[]): Promise<GuildWatchList> {
  const list = await changeWatched($, current => current.filter(id => !ids.includes(id)))
  await update($, sessions, rows => rows.filter(row => list.ids.includes(row.id)))
  await update($, runs, current => Object.fromEntries(Object.entries(current).filter(([id]) => list.ids.includes(id))))
  const chosen = await read($, selected)
  if (chosen !== null && !list.ids.includes(chosen)) {
    await update($, selected, () => null)
    await update($, detail, () => null)
  }

  return list
}

// Merges freshly read sessions into the rows, newest session first.
async function keepRead($: EngineInterface, found: readonly Read[]): Promise<void> {
  if (found.length === 0) return
  await update($, sessions, current => {
    const byId = new Map(current.map(row => [row.id, row]))
    for (const { row } of found) byId.set(row.id, row)

    return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  })
  await update($, runs, current => ({
    ...current,
    ...Object.fromEntries(found.map(({ row, run }) => [row.id, run])),
  }))
}

// The footer's count stays current with the pane closed; only the open
// session's timeline waits for the pane.
async function poll($: EngineInterface): Promise<void> {
  const panes = await $.ui.panes()
  await refresh($, { withDetail: panes.some(pane => pane.id === PANE) })
}

// Reads each watched session not yet read or still running; a finished one
// does not change, so it is read once.
async function refresh($: EngineInterface, { withDetail = true } = {}): Promise<void> {
  const ids = await syncConversation($)
  if (ids.length === 0) {
    await update($, feed, () => IDLE_FEED)
    return
  }
  await update($, feed, current => ({ ...current, isLoading: true }))
  const [rows, known] = await Promise.all([read($, sessions), read($, runs)])
  const due = ids.filter(id => !rows.some(row => row.id === id) || !FINISHED.has(known[id]?.status ?? ''))
  // A session's agent never changes: once a row knows it, only the record is read.
  const agentOf = (id: string) => rows.find(row => row.id === id && row.isAgentKnown)?.agent ?? null
  const outcomes = await Promise.all(
    due.map(id => getSession($, id, agentOf(id)).then(
      found => ({ found, error: null }),
      error => ({ found: null, error: messageOf(error) }),
    )),
  )
  await keepRead($, outcomes.flatMap(outcome => (outcome.found ? [outcome.found] : [])))
  const fetchedAt = await $.clock.now()
  const error = outcomes.find(outcome => outcome.error !== null)?.error ?? null
  await update($, feed, () => ({ isLoading: false, error, fetchedAt }))
  if (!withDetail) return

  const runMap = await read($, runs)
  const chosen = await read($, selected)
  const shown = await read($, detail)
  if (chosen && (shown?.id !== chosen || !FINISHED.has(runMap[chosen]?.status ?? ''))) {
    await loadDetail($, chosen)
  }
}

async function choose($: EngineInterface, id: string | null): Promise<void> {
  await update($, selected, () => id)
  if (id === null) return
  const shown = await read($, detail)
  if (shown?.id !== id) {
    await update($, detail, () => ({
      id,
      isLoading: true,
      events: [],
      outcome: null,
      error: null,
      fetchedAt: null,
      lastEventId: null,
    }))
  }
  later($, () => loadDetail($, id))
}

async function loadDetail($: EngineInterface, id: string): Promise<void> {
  // A sparse session's events can take a minute to come back; ask once.
  if (loadingDetail.has(id)) return
  loadingDetail.add(id)
  try {
    // After the first read, ask only for events newer than the last one shown.
    const shown = await read($, detail)
    const since = shown?.id === id ? shown.lastEventId : null
    const page = await getTimeline($, id, since)
    if ((await read($, selected)) !== id) return
    const fetchedAt = await $.clock.now()
    await update($, detail, current => {
      const kept = since !== null && current?.id === id ? current.events : []
      const seen = new Set(kept.map(event => event.id))

      return {
        id,
        isLoading: false,
        events: [...kept, ...page.events.filter(event => !seen.has(event.id))].slice(-200),
        outcome: page.outcome ?? (current?.id === id ? current.outcome : null),
        error: null,
        fetchedAt,
        lastEventId: page.lastEventId,
      }
    })
  } catch (error) {
    if ((await read($, selected)) !== id) return
    await update($, detail, current => ({
      id,
      isLoading: false,
      events: current?.id === id ? current.events : [],
      outcome: current?.id === id ? current.outcome : null,
      error: messageOf(error),
      fetchedAt: current?.id === id ? current.fetchedAt : null,
      lastEventId: current?.id === id ? current.lastEventId : null,
    }))
  } finally {
    loadingDetail.delete(id)
  }
}

// The ids the model passed that are session ids; the schema already asks for
// that shape, and a call can reach the hook without it.
function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const ids = value.filter((id): id is string => typeof id === 'string').map(id => id.trim().toLowerCase())

  return [...new Set(ids.filter(id => SESSION_ID.test(id)))]
}

function isRunning(run: GuildRunState | undefined): boolean {
  return run !== undefined && run.status !== 'PENDING' && !FINISHED.has(run.status)
}

function runningOf(rows: readonly GuildSessionRow[], runMap: Record<string, GuildRunState>): number {
  return rows.filter(row => isRunning(runMap[row.id])).length
}

function countOf(count: number): string {
  return `${count} Guild ${count === 1 ? 'session' : 'sessions'}`
}

function runningLineOf(rows: readonly GuildSessionRow[], runMap: Record<string, GuildRunState>): string {
  return `${countOf(runningOf(rows, runMap))} running`
}

// No-break spaces at the ends: room inside the desktop's pill that a
// renderer collapsing whitespace keeps.
function pillTextOf(line: string | null, gap = ' '): string {
  return ` ${footerLineOf(line ?? 'Guild sessions', gap)} `
}

// 🤖 before the count; an emoji by default, so it needs no selector.
function footerLineOf(line: string, gap = ' '): string {
  return `\u{1F916}${gap}${line}`
}

// A terminal that takes 🤖 for one cell (the desktop's Terminal panel) draws
// it over the cell after it, which the renderer counted as the emoji's second
// half; two spaces leave one showing, in a Text and in a Button's label alike
// (one space cut the emoji's right half off in the pill, 2026-10-29).
function gapOf(surface: string): string {
  return surface === 'terminal' ? '  ' : ' '
}

// How long a session has run: up to now while it runs, start to last change once done.
function runTimeOf(status: string, run: GuildRunState | undefined, row: GuildSessionRow, now: number): string | null {
  const started = Date.parse(run?.startedAt ?? row.createdAt)
  if (!FINISHED.has(status)) return durationOf(now - started)
  if (!run?.startedAt || !run.updatedAt) return null

  return durationOf(Date.parse(run.updatedAt) - started)
}

// The right side of a card: the run time, or as Background tasks shows a task
// that did not finish well, how it ended in its place ("Failed").
function cardTimeOf(status: string, run: GuildRunState | undefined, row: GuildSessionRow, now: number): string {
  if (status === 'FAILED' || status === 'ERROR') return 'Failed'
  if (FINISHED.has(status) && status !== 'DONE') return capitalOf(status)

  return runTimeOf(status, run, row, now) ?? ''
}

function stateLineOf(status: string, run: GuildRunState | undefined, row: GuildSessionRow, now: number): string {
  const time = runTimeOf(status, run, row, now)
  if (status === 'PENDING') return 'Starting'
  if (!FINISHED.has(status)) return `Running for ${time}`
  const word =
    status === 'DONE' ? 'Done in' : status === 'FAILED' || status === 'ERROR' ? 'Failed after' : `${capitalOf(status)} after`

  return time ? `${word} ${time}` : word.replace(/ (in|after)$/, '')
}

function capitalOf(word: string): string {
  return word.charAt(0) + word.slice(1).toLowerCase()
}

// Background tasks' clock: 7s, 1m 06s, 12m 47s, 2h 05m.
function durationOf(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const two = (n: number) => String(n).padStart(2, '0')
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${two(seconds % 60)}s`

  return `${Math.floor(minutes / 60)}h ${two(minutes % 60)}m`
}

function toneOf(status: string): string {
  if (status === 'DONE') return 'success'
  if (status === 'FAILED' || status === 'ERROR') return 'error'
  if (status === 'PENDING' || status === 'INTERRUPTED' || status === 'CANCELLED') return 'subtle'

  return 'warning'
}

function dotOf(status: string): string {
  return status === 'PENDING' ? '○' : '●'
}

function agoOf(iso: string, now: number): string {
  return spanOf(now - Date.parse(iso))
}

function spanOf(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h`

  return `${Math.round(hours / 24)}d`
}

function clockOf(iso: string): string {
  const at = new Date(iso)
  const two = (n: number) => String(n).padStart(2, '0')

  return `${two(at.getHours())}:${two(at.getMinutes())}:${two(at.getSeconds())}`
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
