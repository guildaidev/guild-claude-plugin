import type { On, ToolCallResult } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'guild',
  component: 'Pane',
  requestId: 'guild-sessions',
  props: {
    title: 'Guild sessions',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const FOOTER = {
  plugin: 'guild',
  component: 'SessionMode',
  requestId: 'session-mode',
  props: { modes: ['focus'] },
} as const

const WATCH = 'mcp__guild__watch_sessions'
const UNWATCH = 'mcp__guild__unwatch_sessions'
const STATE = 'mcp__guild__pane_state'

const NOW = Date.parse('2026-10-29T18:52:00Z')

const RECORDER = '01a189ff-d91b-5f3d-0000-addf52bbfdd8'
const FORWARDER = '01a18a00-41c2-7d10-0000-5b0e7c1d2f3a'
const TESTER = '01a18a41-df10-f268-0000-748a5f592e41'
const WATCHER = '01a19a3a-0dba-351a-0000-0faa1966e765'
const MISSING = '01a18a00-0000-7000-0000-000000000000'

// The chat session's root agent task, the agent task with no parent.
const WATCHER_ROOT = '01a19a3a-0dbe-4aa6-0000-876e6bfa67db'
const WATCHER_NOW = Date.parse('2026-11-02T03:21:00Z')

// Trimmed from what guild_get_session answered on 2026-10-29.
const SESSIONS: Record<string, unknown> = {
  [RECORDER]: {
    id: RECORDER,
    session_type: 'webhook',
    created_at: '2026-10-29T18:50:15.762539+00:00',
    last_activity_at: '2026-10-29T18:50:15.762539+00:00',
    session_url: `https://app.guild.ai/sessions/${RECORDER}`,
    interrupted_at: null,
    workspace: { full_name: 'guildai~kristof-review' },
    trigger: {
      name: 'smoke-test-recorder event',
      event_type: 'issues',
      action: 'labeled',
      agent: { name: 'smoke-test-recorder', full_name: 'guildai~smoke-test-recorder' },
    },
    root_task: {
      status: 'DONE',
      created_at: '2026-10-29T18:50:15.779118+00:00',
      updated_at: '2026-10-29T18:50:23.901974+00:00',
    },
  },
  [FORWARDER]: {
    id: FORWARDER,
    session_type: 'webhook',
    created_at: '2026-10-29T18:51:30.000000+00:00',
    last_activity_at: '2026-10-29T18:51:30.000000+00:00',
    session_url: `https://app.guild.ai/sessions/${FORWARDER}`,
    interrupted_at: null,
    workspace: { full_name: 'guildai~github-todo' },
    trigger: {
      name: 'New issue comment received 2',
      event_type: 'issue_comment',
      action: 'created',
      agent: { name: 'pr-activity-forwarder', full_name: 'guildai~pr-activity-forwarder' },
    },
    root_task: {
      status: 'DISPATCHED',
      created_at: '2026-10-29T18:51:30.100000+00:00',
      updated_at: '2026-10-29T18:51:40.000000+00:00',
    },
  },
  // A test session has no trigger, and its root task names no agent; trimmed
  // from what guild_get_session answered on 2026-10-30.
  [TESTER]: {
    id: TESTER,
    session_type: 'agent_test',
    created_at: '2026-10-30T00:42:15.184953+00:00',
    last_activity_at: '2026-10-30T00:42:15.184953+00:00',
    session_url: `https://app.guild.ai/sessions/${TESTER}`,
    interrupted_at: null,
    workspace: { full_name: 'guildai~kristof-review' },
    root_task: {
      status: 'DONE',
      created_at: '2026-10-30T00:42:20.973190+00:00',
      updated_at: '2026-10-30T00:44:20.044973+00:00',
    },
    agent_version_override: {
      version: { version_number: '1.0.7', status: 'PUBLISHED' },
      agent: { name: 'dejargonizer', full_name: 'guildai~dejargonizer' },
    },
  },
  // A chat session names no agent anywhere in its record, its root task
  // included; trimmed from what guild_get_session answered on 2026-11-02.
  [WATCHER]: {
    id: WATCHER,
    session_type: 'chat',
    created_at: '2026-11-02T03:07:38.298715+00:00',
    last_activity_at: '2026-11-02T03:07:38.298715+00:00',
    session_url: `https://app.guild.ai/sessions/${WATCHER}`,
    interrupted_at: null,
    workspace: { full_name: 'guildai~kristof-ai-assistant-mcp' },
    root_task: {
      id: WATCHER_ROOT,
      status: 'DISPATCHED',
      created_at: '2026-11-02T03:07:38.302213+00:00',
      updated_at: '2026-11-02T03:20:13.261040+00:00',
    },
  },
}

const EVENTS = {
  items: [
    {
      id: 'e-console',
      type: 'agent_console',
      level: 'INFO',
      created_at: '2026-10-29T18:50:23.800830+00:00',
      content: '[recorder] The label added is guild-factory, not review-task.',
      task: { entity_type: 'EntTaskTool', parent_task_id: null },
    },
    {
      id: 'e-done',
      type: 'runtime_done',
      created_at: '2026-10-29T18:50:23.928679+00:00',
      content: { outcome: 'Skipped: the label is not review-task.' },
      task: { entity_type: 'EntTaskAgent', parent_task_id: null },
    },
  ],
  pagination: { total_count: 2, limit: 40, offset: 0, has_more: false },
}

// The chat session's newest task start: a sleep the root agent called, whose
// parent is the root and names its agent; trimmed from 2026-11-02's answer.
const ROOT_EVENTS = {
  items: [
    {
      id: '01a19a45-930a-431e-0000-4762b79ae8e1',
      type: 'runtime_start',
      created_at: '2026-11-02T03:20:13.322322+00:00',
      task: {
        id: '01a19a45-92b9-bce2-0000-979c0ffc0f0b',
        entity_type: 'EntTaskTool',
        status: 'STARTED',
        tool_name: 'guild_sleep',
        parent_task: {
          id: WATCHER_ROOT,
          entity_type: 'EntTaskAgent',
          status: 'DISPATCHED',
          parent_task_id: null,
          agent: { entity_type: 'EntAgent', name: 'notion-doc-watcher', full_name: 'guildai~notion-doc-watcher' },
        },
      },
      content: { seconds: 300 },
    },
  ],
}

// A task start inside a sub-agent, whose parent is the root: it names the
// sub-agent, never the root's agent.
const SUBAGENT_EVENTS = {
  items: [
    {
      id: '01a19a45-86f4-431e-0000-19a64b082529',
      type: 'runtime_start',
      created_at: '2026-11-02T03:20:10.228633+00:00',
      task: {
        id: '01a19a45-86d6-bce2-0000-90f3fb6cd004',
        entity_type: 'EntTaskTool',
        tool_name: 'console_log',
        parent_task: {
          id: '01a19a42-d33b-4aa6-0000-60298c36c6aa',
          entity_type: 'EntTaskAgent',
          status: 'DONE',
          parent_task_id: WATCHER_ROOT,
          agent: { name: 'notion-thread-responder', full_name: 'guildai~notion-thread-responder' },
        },
      },
      content: { level: 'info', message: '[thread] skipped before posting' },
    },
  ],
}

function answer(value: unknown) {
  return { value: { content: [{ type: 'text', text: JSON.stringify(value) }], isError: false } }
}

function failure(text: string) {
  return { value: { content: [{ type: 'text', text }], isError: true } }
}

// What the model reads back from a call to one of the mod's tools.
function textOf(out: ToolCallResult): string {
  return out.deny ?? (typeof out.result === 'string' ? out.result : (out.text ?? ''))
}

const OPEN_PANE = { id: 'guild-sessions', title: 'Guild sessions', isShown: true, isFocused: false, isPlaced: true }

// What a session answers beneath the plugin, the Guild connector among its tools.
function host(
  on: On,
  {
    isPaneOpen = false,
    opened = [] as string[],
    statuses = [] as (string | undefined)[],
    registered = [] as { name: string; isDeferred?: boolean }[],
    // Whether the surface places the pane when it opens; a test may flip it.
    placing = { isPlaced: true },
    // The Claude Code session id; a test moves it to stand for a /clear or a resume.
    conversation = { id: 'conversation-1' },
    // What the mod's store holds when the session starts.
    store = {} as Record<string, unknown>,
    // The Guild connector's server name in the tool list; null while it is not connected.
    connector = { server: 'Guild_ai' as string | null },
    // Other servers with Guild's tools, listed ahead of the connector.
    otherServers = [] as string[],
    environment = { HOME: '/Users/k' } as Record<string, string>,
  } = {},
) {
  mock.store(on, store)
  on('env.get', (_, e) => ({ value: environment[e.name] }))
  // The engine's own mode labels, drawn when the mod passes the footer on.
  on('ui.render', { component: 'SessionMode' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>{e.props.modes.join(' & ')}</Text>
  })
  on('ui.status', (_, e) => {
    statuses.push(e.text)

    return { value: undefined }
  })
  on('session.id', () => ({ value: conversation.id }))
  on('command.register', () => ({ value: { command: 'guild-sessions' } }))
  on('tool.register', (_, e) => {
    registered.push({ name: e.name, isDeferred: e.isDeferred })

    return { value: { tool: `mcp__guild__${e.name}` } }
  })
  on('tool.list', () => ({
    value: [
      { name: 'Bash', description: '', mcp: false },
      ...[...otherServers, ...(connector.server === null ? [] : [connector.server])].map(server => ({
        name: `mcp__${server}__guild_get_session`,
        description: '',
        mcp: true,
      })),
    ],
  }))
  on('ui.open', (_, e) => {
    opened.push(e.id)

    return { value: placing.isPlaced ? { isPlaced: true as const } : { isPlaced: false as const, reason: 'no room' } }
  })
  on('ui.panes', () => ({ value: isPaneOpen ? [OPEN_PANE] : [] }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
}

// The agent lookup's side of the connector: what it answers per session, an
// events page or a failure, what it waits for first, and each call's args.
type Lookup = {
  answers: Record<string, ReturnType<typeof answer>>
  args: Record<string, unknown>[]
  wait?: () => Promise<void>
}

function lookupOf(answers: Lookup['answers'] = { [WATCHER]: answer(ROOT_EVENTS) }): Lookup {
  return { answers, args: [] }
}

// The Guild connector, answering from SESSIONS and EVENTS; `asked` records each
// tool called. The agent lookup, the events call asking for `runtime_start`,
// answers from `lookup` instead, an empty page for a session it does not list.
function guild(on: On, asked: string[] = [], lookup: Lookup = lookupOf()) {
  on('mcp.call', async (_, e) => {
    expect(e.server).toBe('Guild_ai')
    asked.push(e.tool)
    if (e.tool === 'guild_get_session') {
      const session = SESSIONS[String(e.args.session_id)]

      return session ? answer(session) : failure('Session not found')
    }
    if (Array.isArray(e.args.types) && e.args.types.includes('runtime_start')) {
      lookup.args.push(e.args)
      await lookup.wait?.()

      return lookup.answers[String(e.args.session_id)] ?? answer({ items: [] })
    }

    return answer(EVENTS)
  })
}

test('with nothing watched there is no footer, no connector call and the pane says so', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  const asked: string[] = []
  const opened: string[] = []
  const registered: { name: string; isDeferred?: boolean }[] = []
  host(on, { opened, registered })
  guild(on, asked)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  await clock.advance(20_000)

  // Claude reads the watch tool's description from turn one.
  expect(registered.find(spec => spec.name === 'watch_sessions')?.isDeferred).toBe(false)
  expect(asked).toEqual([])
  expect(opened).toEqual([])

  for (const surface of ['desktop', 'terminal'] as const) {
    const footer = await $.ui.mount({ ...FOOTER, surface })
    expect(await footer.find({ type: 'Text', text: /^focus$/ })).toBeDefined()
    expect(await footer.find({ key: 'open-sessions' })).toBeUndefined()
    expect(await footer.find({ type: 'Text', text: /Guild/ })).toBeUndefined()
    await footer.unmount()

    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /^No Guild sessions are watched in this conversation yet/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the pane lists only the sessions Claude watches, on desktop and terminal', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  const asked: string[] = []
  host(on)
  guild(on, asked)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const out = await $.tool.call({ tool: WATCH, session_ids: [RECORDER, FORWARDER] })
  expect(textOf(out)).toBe(
    [
      'This conversation watches 2 Guild sessions.',
      `${RECORDER}: watching smoke-test-recorder in guildai~kristof-review, done`,
      `${FORWARDER}: watching pr-activity-forwarder in guildai~github-todo, dispatched`,
    ].join('\n'),
  )
  // Watched again: nothing is read twice.
  const again = await $.tool.call({ tool: WATCH, session_ids: [RECORDER] })
  expect(textOf(again)).toBe(`This conversation watches 2 Guild sessions.\n${RECORDER}: already watched`)
  expect(asked).toEqual(['guild_get_session', 'guild_get_session'])

  // On desktop, Background tasks' layout: the running session, then a Finished
  // section folded while one runs; no heading, refresh button or read time.
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Watched sessions|read .* ago/ })).toBeUndefined()
  expect(await ui.find({ key: 'refresh' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^Running 1$/ })).toBeDefined()
  expect((await ui.find({ key: `row-${FORWARDER}` }))?.text).toBe('guildai~github-todo · pr-activity-forwarder')
  // Running since its root task started at 18:51:30.1.
  expect(await ui.find({ type: 'Text', text: /^29s$/ })).toBeDefined()
  expect((await ui.find({ key: 'finished' }))?.text).toBe('▸ Finished 1')
  expect(await ui.find({ key: `row-${RECORDER}` })).toBeUndefined()

  await ui.press({ key: 'finished' })
  await clock.advance(1)
  expect(await ui.find({ key: `row-${RECORDER}` })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^8s$/ })).toBeDefined()

  // A card opens its session in the pane, as a subagent's card opens its run.
  await ui.press({ key: `row-${RECORDER}` })
  await clock.advance(1)
  expect(await ui.find({ key: 'finished' })).toBeUndefined()
  expect((await ui.find({ type: 'Text', text: /^Skipped/ }))?.text).toBe('Skipped: the label is not review-task.')
  expect(await ui.find({ type: 'Text', text: /^\d+m ago · guildai~kristof-review · issues labeled$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^Done in 8s$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /guild-factory, not review-task/ })).toBeDefined()
  await ui.press({ key: 'back' })
  expect(await ui.find({ type: 'Text', text: /^Skipped/ })).toBeUndefined()
  expect(await ui.find({ key: `row-${RECORDER}` })).toBeDefined()
  await ui.unmount()

  // In a terminal, which keeps clicks to itself, a row is the session's link on Guild.
  const cli = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await cli.find({ key: `row-${RECORDER}` })).toBeUndefined()
  // A Link's text is its href, then what it shows.
  const link = await cli.find({ type: 'Link', text: /smoke-test-recorder/ })
  expect(link?.props.href).toBe(`https://app.guild.ai/sessions/${RECORDER}`)
  expect(link?.text).toBe(`https://app.guild.ai/sessions/${RECORDER}smoke-test-recorder issues labeled · 2m`)
  await cli.unmount()
})

test('a test session is listed under the agent it runs, not its session type', async ($, on) => {
  const clock = mock.clock(on, { now: Date.parse('2026-10-30T00:45:00Z') })
  host(on)
  guild(on)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const out = await $.tool.call({ tool: WATCH, session_ids: [TESTER] })
  expect(textOf(out)).toBe(
    `This conversation watches 1 Guild session.\n${TESTER}: watching dejargonizer in guildai~kristof-review, done`,
  )

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ key: `row-${TESTER}` }))?.text).toBe('guildai~kristof-review · dejargonizer')
  await ui.unmount()
})

test('a chat session is listed under its root agent, read from its events', async ($, on) => {
  const clock = mock.clock(on, { now: WATCHER_NOW })
  const lookup = lookupOf()
  host(on)
  guild(on, [], lookup)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const out = await $.tool.call({ tool: WATCH, session_ids: [WATCHER] })
  expect(textOf(out)).toBe(
    `This conversation watches 1 Guild session.\n${WATCHER}: watching notion-doc-watcher in guildai~kristof-ai-assistant-mcp, dispatched`,
  )
  // One page of the newest task starts and ends, not walked back.
  expect(lookup.args).toEqual([{ session_id: WATCHER, types: ['runtime_start', 'runtime_done'], limit: 40 }])
  expect(Object.keys(lookup.args[0] ?? {})).not.toContain('from_id')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ key: `row-${WATCHER}` }))?.text).toBe('guildai~kristof-ai-assistant-mcp · notion-doc-watcher')
  await ui.press({ key: `row-${WATCHER}` })
  await clock.advance(1)
  expect(await ui.find({ type: 'Text', text: /^notion-doc-watcher$/ })).toBeDefined()
  await ui.unmount()

  const cli = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const link = await cli.find({ type: 'Link', text: /notion-doc-watcher/ })
  expect(link?.text).toBe(`https://app.guild.ai/sessions/${WATCHER}notion-doc-watcher chat · 13m`)
  await cli.unmount()
})

test('a chat session whose newest events are all inside a sub-agent is named on a later poll', async ($, on) => {
  const clock = mock.clock(on, { now: WATCHER_NOW })
  const asked: string[] = []
  const lookup = lookupOf({ [WATCHER]: answer(SUBAGENT_EVENTS) })
  host(on)
  guild(on, asked, lookup)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  // The sub-agent is not the session's agent: until a read names the root,
  // the session type stands in.
  const out = await $.tool.call({ tool: WATCH, session_ids: [WATCHER] })
  expect(textOf(out)).toBe(
    `This conversation watches 1 Guild session.\n${WATCHER}: watching chat in guildai~kristof-ai-assistant-mcp, dispatched`,
  )
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ key: `row-${WATCHER}` }))?.text).toBe('guildai~kristof-ai-assistant-mcp · chat')

  // Still running, so the next poll looks again, and this time finds the root.
  lookup.answers[WATCHER] = answer(ROOT_EVENTS)
  await clock.advance(20_000)
  expect((await ui.find({ key: `row-${WATCHER}` }))?.text).toBe('guildai~kristof-ai-assistant-mcp · notion-doc-watcher')
  expect(asked.filter(tool => tool === 'guild_get_session_events')).toHaveLength(2)
  await ui.unmount()
})

test("a session's agent is looked up once", async ($, on) => {
  const clock = mock.clock(on, { now: WATCHER_NOW })
  const asked: string[] = []
  // The lookup answers 25 s after it is asked, past the next poll.
  const lookup: Lookup = { ...lookupOf(), wait: () => clock.sleep(25_000) }
  host(on)
  guild(on, asked, lookup)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  // A record that names its agent is all a webhook or test session reads.
  await $.tool.call({ tool: WATCH, session_ids: [RECORDER, FORWARDER, TESTER] })
  expect(asked).toEqual(['guild_get_session', 'guild_get_session', 'guild_get_session'])

  // Two reads of the chat session while its lookup runs, and a poll landing
  // meanwhile: the second read waits for the first one's answer. A poll reads
  // only watched sessions, and a session is watched once its read returns, so
  // the second read is a second watch.
  const watching = [0, 1].map(() => $.tool.call({ tool: WATCH, session_ids: [WATCHER] }))
  await clock.settle()
  await clock.advance(20_000)
  await clock.advance(6_000)
  for (const out of await Promise.all(watching)) {
    expect(textOf(out)).toBe(
      `This conversation watches 4 Guild sessions.\n${WATCHER}: watching notion-doc-watcher in guildai~kristof-ai-assistant-mcp, dispatched`,
    )
  }
  expect(asked.filter(tool => tool === 'guild_get_session_events')).toHaveLength(1)

  // Three polls with the session still running: each reads only the records
  // of the two running sessions.
  asked.length = 0
  await clock.advance(60_000)
  expect(asked).toEqual(Array.from({ length: 6 }, () => 'guild_get_session'))
  expect(lookup.args.map(args => args.session_id)).toEqual([WATCHER])
})

test('a failed agent lookup leaves the session watched under its session type', async ($, on) => {
  const clock = mock.clock(on, { now: WATCHER_NOW })
  host(on)
  guild(on, [], lookupOf({ [WATCHER]: failure('Guild is unavailable') }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const out = await $.tool.call({ tool: WATCH, session_ids: [WATCHER] })
  expect(out.deny).toBeUndefined()
  expect(textOf(out)).toBe(
    `This conversation watches 1 Guild session.\n${WATCHER}: watching chat in guildai~kristof-ai-assistant-mcp, dispatched`,
  )
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ key: `row-${WATCHER}` }))?.text).toBe('guildai~kristof-ai-assistant-mcp · chat')
  await ui.unmount()

  const report = JSON.parse(textOf(await $.tool.call({ tool: STATE })))
  expect(report.watched).toEqual([WATCHER])
  const lookupCall = report.calls.find((call: { tool: string }) => call.tool === 'guild_get_session_events')
  expect(lookupCall?.outcome).toBe('isError: Guild is unavailable')
})

test('the footer appears once a session is watched and opens the pane while it is not on screen', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  const opened: string[] = []
  const statuses: (string | undefined)[] = []
  const asked: string[] = []
  const placing = { isPlaced: false }
  host(on, { opened, statuses, placing })
  guild(on, asked)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  // Nothing is pinned to the status line, which the app labels with the mod's name.
  expect(statuses.filter(text => text !== undefined)).toEqual([])

  await $.tool.call({ tool: WATCH, session_ids: [RECORDER, FORWARDER] })

  // The pane is not on screen (ui.panes answers none): the running session is
  // read again for the count, the finished one and the timeline are not.
  await clock.advance(20_000)
  expect(asked).toEqual(['guild_get_session', 'guild_get_session', 'guild_get_session'])

  // Closed: the count is a button that opens the pane, padded at both ends.
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...FOOTER, surface })
    expect(await ui.find({ type: 'Text', text: /^focus$/ })).toBeDefined()
    // Two spaces after the emoji on a terminal, where it can cover the first.
    const gap = surface === 'terminal' ? '  ' : ' '
    expect((await ui.find({ key: 'open-sessions' }))?.text).toBe(` \u{1F916}${gap}1 Guild session running `)
    await ui.unmount()
  }

  // Pressed, the pane is placed: the button gives way to the count as text.
  opened.length = 0
  placing.isPlaced = true
  const ui = await $.ui.mount({ ...FOOTER, surface: 'desktop' })
  await ui.press({ key: 'open-sessions' })
  expect(opened).toEqual(['guild-sessions'])
  const report = JSON.parse(textOf(await $.tool.call({ tool: STATE })))
  expect(report.watched).toEqual([RECORDER, FORWARDER])
  expect(report.footer).toEqual({ shows: '\u{1F916} 1 Guild session running' })
  expect(await ui.find({ key: 'open-sessions' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^\u{1F916} 1 Guild session running$/u })).toBeDefined()
  await ui.unmount()

  // As text on a terminal, two spaces after the emoji, which can cover the first.
  const cli = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect(await cli.find({ type: 'Text', text: /^\u{1F916} {2}1 Guild session running$/u })).toBeDefined()
  await cli.unmount()
})

test("a running session's time counts up each second while the pane is open", async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on)
  guild(on)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  await $.tool.call({ tool: WATCH, session_ids: [FORWARDER] })
  const footer = await $.ui.mount({ ...FOOTER, surface: 'desktop' })
  await footer.press({ key: 'open-sessions' })
  await footer.unmount()

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /^29s$/ })).toBeDefined()
  await clock.advance(3000)
  expect(await ui.find({ type: 'Text', text: /^32s$/ })).toBeDefined()
  // Nothing finished yet, so no Finished section.
  expect(await ui.find({ key: 'finished' })).toBeUndefined()
  await ui.unmount()
})

test('unwatch_sessions takes sessions off, and the footer goes with the last one', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on, { isPaneOpen: true })
  guild(on)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  await $.tool.call({ tool: WATCH, session_ids: [RECORDER, FORWARDER] })

  const out = await $.tool.call({ tool: UNWATCH, session_ids: [FORWARDER] })
  expect(textOf(out)).toBe('This conversation watches 1 Guild session.')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ key: `row-${FORWARDER}` })).toBeUndefined()
  // Nothing runs, so Finished is open; the session opens with its link at the top.
  await ui.press({ key: `row-${RECORDER}` })
  await clock.advance(1)
  expect(await ui.find({ key: 'unwatch' })).toBeUndefined()
  expect((await ui.find({ type: 'Link', text: /Open in Guild/ }))?.props.href).toBe(
    `https://app.guild.ai/sessions/${RECORDER}`,
  )

  // Unwatching the opened session closes it.
  await $.tool.call({ tool: UNWATCH, session_ids: [RECORDER] })
  expect(await ui.find({ key: `row-${RECORDER}` })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^No Guild sessions are watched in this conversation yet/ })).toBeDefined()
  await ui.unmount()

  const footer = await $.ui.mount({ ...FOOTER, surface: 'desktop' })
  expect(await footer.find({ type: 'Text', text: /Guild/ })).toBeUndefined()
  await footer.unmount()
})

test('each conversation has its own list, kept past a /clear and a resume', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  const conversation = { id: 'conversation-1' }
  // An earlier run of the mod watched the forwarder in conversation-2.
  host(on, { conversation, store: { watched: { 'conversation-2': { ids: [FORWARDER], at: NOW - 60_000 } } } })
  guild(on)
  const footerText = async () => {
    const ui = await $.ui.mount({ ...FOOTER, surface: 'desktop' })
    const shown = (await ui.find({ key: 'open-sessions' }))?.text
    await ui.unmount()

    return shown
  }

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  await $.tool.call({ tool: WATCH, session_ids: [RECORDER] })
  expect(await footerText()).toBe(' \u{1F916} 0 Guild sessions running ')

  // A /clear goes on under a new session id, which watches nothing yet.
  conversation.id = 'conversation-3'
  await $.session.end({ reason: 'clear', sessionId: 'conversation-1', resume: { id: 'conversation-1' } })
  expect(await footerText()).toBeUndefined()
  await clock.advance(1)
  expect(await footerText()).toBeUndefined()

  // Resuming conversation-2 brings back the list it kept.
  conversation.id = 'conversation-2'
  await $.session.end({ reason: 'resume', sessionId: 'conversation-3', resume: { id: 'conversation-3' } })
  await clock.advance(1)
  expect(await footerText()).toBe(' \u{1F916} 1 Guild session running ')

  // And conversation-1's own list is still there.
  conversation.id = 'conversation-1'
  await $.session.end({ reason: 'resume', sessionId: 'conversation-2', resume: { id: 'conversation-2' } })
  await clock.advance(1)
  expect(await footerText()).toBe(' \u{1F916} 0 Guild sessions running ')
  const report = JSON.parse(textOf(await $.tool.call({ tool: STATE })))
  expect(report.watched).toEqual([RECORDER])
})

test('a connector that connects after the session starts is found on the next refresh', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  // A resumed conversation that watched the forwarder; the terminal's
  // claude.ai connectors connect only after the first refresh.
  const connector = { server: null as string | null }
  host(on, { connector, store: { watched: { 'conversation-1': { ids: [FORWARDER], at: NOW - 60_000 } } } })
  const servers: string[] = []
  on('mcp.call', (_, e) => {
    servers.push(e.server)
    if (e.server !== 'claude_ai_Guild_ai') return { deny: `no connected MCP tool "${e.tool}" on a server named "${e.server}"` }

    return answer(SESSIONS[String(e.args.session_id)])
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(1)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /no connected MCP tool/ })).toBeDefined()

  connector.server = 'claude_ai_Guild_ai'
  await clock.advance(20_000)
  // The first refresh tried this plugin's own server, which had not connected.
  expect(servers).toEqual(['plugin_guild_guild', 'claude_ai_Guild_ai'])
  expect(await ui.find({ type: 'Text', text: /no connected MCP tool/ })).toBeUndefined()
  expect(await ui.find({ type: 'Link', text: /pr-activity-forwarder/ })).toBeDefined()
  await ui.unmount()
})

test("the plugin's own Guild server is called ahead of a claude.ai connector", async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  // The claude.ai connector comes first in the tool list.
  host(on, {
    connector: { server: 'plugin_guild_guild' },
    otherServers: ['claude_ai_Guild_ai'],
    store: { watched: { 'conversation-1': { ids: [FORWARDER], at: NOW - 60_000 } } },
  })
  const servers: string[] = []
  on('mcp.call', (_, e) => {
    servers.push(e.server)

    return answer(SESSIONS[String(e.args.session_id)])
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(1)
  expect(servers).toEqual(['plugin_guild_guild'])
})

test('a session the connector cannot read is not watched', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on)
  guild(on)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const refused = await $.tool.call({ tool: WATCH, session_ids: [MISSING] })
  expect(refused.deny).toBe(
    `This conversation watches 0 Guild sessions.\n${MISSING}: not watched, Session not found`,
  )

  const mixed = await $.tool.call({ tool: WATCH, session_ids: [MISSING, RECORDER] })
  expect(textOf(mixed)).toBe(
    [
      'This conversation watches 1 Guild session.',
      `${MISSING}: not watched, Session not found`,
      `${RECORDER}: watching smoke-test-recorder in guildai~kristof-review, done`,
    ].join('\n'),
  )
})

test('a connector error after watching shows in the pane and in pane_state', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on)
  const connector = { isDown: false }
  on('mcp.call', (_, e) => {
    if (connector.isDown) return failure('Guild is unavailable')
    if (e.tool === 'guild_get_session') return answer(SESSIONS[String(e.args.session_id)])

    return answer(EVENTS)
  })
  on('tool.call', { tool: 'Bash' }, () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  await $.tool.call({ tool: WATCH, session_ids: [FORWARDER] })
  connector.isDown = true
  await clock.advance(20_000)

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /unavailable/ }))?.text).toBe('Guild is unavailable')
  // The row read before stays listed.
  expect(await ui.find({ key: `row-${FORWARDER}` })).toBeDefined()
  await ui.unmount()

  const report = JSON.parse(textOf(await $.tool.call({ tool: STATE })))
  expect(report.feed.error).toBe('Guild is unavailable')
  expect(report.calls.at(-1).tool).toBe('guild_get_session')
  expect(report.calls.at(-1).outcome).toBe('isError: Guild is unavailable')
})

test('a refused call names the server and the reason', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on)
  on('mcp.call', () => ({ deny: 'the permission check refused it' }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const refused = await $.tool.call({ tool: WATCH, session_ids: [RECORDER] })
  expect(refused.deny).toMatch(/on server "Guild_ai" failed: .*the permission check refused it/)
})

test("auto mode's refusal tells the person which rules to add", async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on)
  on('mcp.call', () => ({
    deny: 'The server-side auto mode classifier gave no verdict for mcp__Guild_ai__guild_get_session: the request that produced this action did not ask for one.',
  }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)

  const refused = await $.tool.call({ tool: WATCH, session_ids: [RECORDER] })
  expect(refused.deny).toContain("Auto mode can't approve")
  expect(refused.deny).toContain('mcp__Guild_ai__guild_get_session_events to permissions.allow')
})

const SAVED_TO = '/Users/k/.claude/projects/-Users-k-code/0f1e/tool-results/mcp-Guild_ai-guild_get_session-1.txt'

for (const [name, savedTo, environment] of [
  ['txt', SAVED_TO, { HOME: '/Users/k' }],
  ['json', SAVED_TO.replace('.txt', '.json'), { HOME: '/Users/k' }],
  ['a custom config directory', SAVED_TO.replace('/Users/k/.claude', '/Users/k/.claude-review'), { HOME: '/Users/k', CLAUDE_CONFIG_DIR: '/Users/k/.claude-review' }],
  ['a config directory with spaces', SAVED_TO.replace('/Users/k/.claude', '/tmp/Claude review'), { HOME: '/Users/k', CLAUDE_CONFIG_DIR: '/tmp/Claude review' }],
] as const) {
  test(`an oversized result in ${name} is read without starting a program`, async ($, on) => {
    const clock = mock.clock(on, { now: NOW })
    host(on, { environment })
    const ran: string[][] = []
    on('process.run', (_, e) => {
      ran.push([...e.argv])

      return {
        value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
      }
    })
    on('mcp.call', () => ({
      value: {
        content: [
          {
            type: 'text',
            text: `Error: result (61,154 characters across 1 line) exceeds maximum allowed tokens. Output has been saved to ${savedTo}.\nFormat: Plain text`,
          },
        ],
        isError: false,
      },
    }))
    on('fs.read', (_, e) => {
      expect(e.path).toBe(savedTo)

      return { value: JSON.stringify(SESSIONS[FORWARDER]) }
    })

    await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
    await clock.advance(1)
    await $.tool.call({ tool: WATCH, session_ids: [FORWARDER] })

    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await ui.find({ key: `row-${FORWARDER}` })).toBeDefined()
    await ui.unmount()
    expect(ran).toEqual([])
  })
}

for (const [name, savedTo] of [
  ['outside tool-results', '/tmp/notes/mcp-Guild_ai-guild_get_session-1.txt'],
  ['with parent traversal', '/Users/k/../k/.claude/projects/-Users-k-code/0f1e/tool-results/mcp-Guild_ai-guild_get_session-1.txt'],
  ['with a dot segment', '/Users/k/./.claude/projects/-Users-k-code/0f1e/tool-results/mcp-Guild_ai-guild_get_session-1.txt'],
  ['for another tool', '/Users/k/.claude/projects/-Users-k-code/0f1e/tool-results/mcp-Guild_ai-guild_get_session_events-1.txt'],
  ['for another server', '/Users/k/.claude/projects/-Users-k-code/0f1e/tool-results/mcp-other-guild_get_session-1.txt'],
  ['with a misleading tool suffix', '/Users/k/.claude/projects/-Users-k-code/0f1e/tool-results/mcp-Guild_ai-other-guild_get_session-1.txt'],
  ['with an extra extension', `${SAVED_TO}.bak`],
  ['with traversal after an extension', `${SAVED_TO}/../../unrelated.txt`],
  ['under another user home', SAVED_TO.replace('/Users/k/', '/Users/other/')],
] as const) {
  test(`a saved result ${name} is refused without reading or deleting it`, async ($, on) => {
    const clock = mock.clock(on, { now: NOW })
    host(on)
    const reads: string[] = []
    const ran: string[][] = []
    on('mcp.call', () => ({
      value: {
        content: [{ type: 'text', text: `Output has been saved to ${savedTo}.\nFormat: Plain text` }],
        isError: false,
      },
    }))
    on('fs.read', (_, e) => {
      reads.push(e.path)

      return { value: JSON.stringify(SESSIONS[FORWARDER]) }
    })
    on('process.run', (_, e) => {
      ran.push([...e.argv])

      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })

    await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
    await clock.advance(1)
    const refused = await $.tool.call({ tool: WATCH, session_ids: [FORWARDER] })

    expect(refused.deny).toContain('expected Claude Code tool-results path')
    expect(reads).toEqual([])
    expect(ran).toEqual([])
    const report = JSON.parse(textOf(await $.tool.call({ tool: STATE })))
    expect(report.watched).toEqual([])
  })
}

test('an open running session reads only the events after the last one shown', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  host(on, { isPaneOpen: true })
  const timelineArgs: Record<string, unknown>[] = []
  on('mcp.call', (_, e) => {
    if (e.tool === 'guild_get_session') return answer(SESSIONS[String(e.args.session_id)])
    timelineArgs.push(e.args)
    if (e.args.from_id === undefined) return answer(EVENTS)

    return answer({
      items: [
        {
          id: 'e-later',
          type: 'agent_console',
          level: 'INFO',
          created_at: '2026-10-29T18:51:50.000000+00:00',
          content: '[forwarder] posted the comment to Slack',
          task: { entity_type: 'EntTaskTool', parent_task_id: null },
        },
      ],
      pagination: { total_count: 1, limit: 40, offset: 0, has_more: false },
    })
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(1)
  await $.tool.call({ tool: WATCH, session_ids: [FORWARDER] })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: `row-${FORWARDER}` })
  await clock.advance(1)
  expect(await ui.find({ type: 'Text', text: /guild-factory, not review-task/ })).toBeDefined()

  await clock.advance(20_000)

  expect(timelineArgs.map(args => args.from_id)).toEqual([undefined, 'e-done'])
  expect(await ui.find({ type: 'Text', text: /guild-factory, not review-task/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /posted the comment to Slack/ })).toBeDefined()
  await ui.unmount()
})
