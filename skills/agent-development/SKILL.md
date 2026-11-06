---
name: agent-development
description: Build, test, publish and install Guild agents through the Guild MCP tools (guild_*). Use when the user wants to create a Guild agent, change one, run it, or publish it.
---

# Build a Guild agent

Do everything through the Guild MCP tools (`guild_*`). Guild builds and
validates every version on its servers, so there is nothing to install or build
locally. Never run the `guild` CLI, `npm` or `git` for this, and never write the
agent's files to disk: they go to Guild as the `files` of
`guild_create_agent_version`.

If no `guild_*` tools are available, the user hasn't signed in to Guild in this
client yet. Tell them how, then stop:

- Claude Code: run `/mcp`, pick the Guild server, choose Authenticate, and sign
  in to Guild in the browser.
- claude.ai or Claude Desktop: connect Guild under Customize > Connectors.

Don't send them to a terminal or another app to do it.

## 1. Pick the owner and the shape

1. `guild_whoami` for the user. If the agent is for an organization,
   `guild_list_my_organizations` and create it under that organization.
2. Choose the shape. Prefer the first one that fits.
   - **Prompt and tools.** The agent is a system prompt plus integration tools,
     and the model decides what to call. Most agents are this, for example
     "summarize a GitHub PR". Guild writes the code.
   - **Code.** The agent needs fixed steps, loops, state, or calls to other
     agents, or needs no integration tools. You write TypeScript. A prompt-only
     agent with no tools uses `llmAgent({ tools: {}, useWorkspaceAgents: false,
     mode: "one-shot", systemPrompt })`; do not add unrelated tools merely to
     satisfy `guild_configure_llm_agent`, which requires at least one tool.

## 2. Find the tools

1. `guild_search_integrations` for each service the agent needs (GitHub, Slack,
   Jira and so on).
2. `guild_list_integration_tools` for the exact tool names. Never guess a tool
   name; an invented one fails validation.
3. `guild_list_my_workspaces` and pick the workspace you will test in. Then
   `guild_list_credentials` with that workspace's owner as `account_id_or_name`
   and each integration's full name as `integration`. This is an inventory of
   what is connected under that owner, never a token, and not a promise that
   the workspace can use it: a workspace can restrict its owner's credentials,
   and a credential with a membership `target` serves one member's runs only.
   The test session in step 5 is the real check.
4. For each integration with no credential, get a link with
   `guild_get_integration_connect_url` and the integration's full name:
   - For the user's own runs, pass the test workspace as `workspace_id` and no
     `owner_id`. This binds the credential to the user's membership in the
     workspace's organization, or to their own account, and any member can do
     it.
   - For a connection the whole organization shares, such as an agent that runs
     for other people or on a trigger, pass the organization as `owner_id`.
     Only an organization admin may do this. If the call is refused, the user
     is not an admin: tell them which integration an admin must connect, and
     go on with the user's own connection for testing.

   Give the user the link, ask them to open it and say when they are done, then
   `guild_list_credentials` again to confirm it landed. Do not send them to find
   the page in Guild themselves.

## 3. Create the agent

1. `guild_create_agent` with a lowercase, hyphenated `name`, the `owner_id`, and
   a one-line `description`.
2. Call `guild_wait_for_agent` once with the created agent ID to wait for `READY`.

### Prompt and tools

3. `guild_configure_llm_agent` with the system prompt, description and tools.
   Guild writes the code, commits a version, validates it and publishes it once
   it passes. Do not call `guild_publish_agent_version` as well.

### Code

3. `guild_list_agent_versions`, then `guild_get_agent_version_code` on the first
   version. Its files (`package.json`, `tsconfig.json`, `agent.ts` and so on)
   are the project to start from.
4. Write the new `agent.ts`, and add each integration's
   `@guildai-services/<owner>~<name>` package to `dependencies` in
   `package.json`. Read `references/sdk.md` before writing code.
5. `guild_create_agent_version` with **every** file of the project, not just the
   ones you changed, and a short `summary`. Leave out `package-lock.json`; Guild
   resolves the dependencies itself.
6. To publish in the same step, pass `publish: true`. Otherwise publish later
   with `guild_publish_agent_version`.

## 4. Wait for the build

Call `guild_wait_for_job` once with the `version_id` and `job_id` returned by
the create/configure/publish/revalidate operation. If it fails, read
`guild_get_agent_version_validation` for the failing step's log, fix the files,
and commit a new version with `guild_create_agent_version`. Compiler errors
are listed in `references/compiler.md`.

## 5. Test it

1. `guild_start_agent_test_session` on the version, in a workspace where its
   integrations are connected. A draft version can be tested before publishing.
2. `guild_send_session_message` with a realistic input, such as a real PR URL.
3. Call `guild_wait_for_session` once with the session ID, the send result's
   `id` as `user_event_id`, and its `wait_after_event_id` unchanged as
   `after_event_id`. Read the output from the completed event.
4. If the result is `ACTION_REQUIRED`, explain the requested input and stop
   waiting. For a missing connection, hand out the connect link as in step 2,
   with the session's workspace as `workspace_id`, then start a new test
   session once it is confirmed. If it is an error, report that error.

Wait tools hold the call open until completion, required action, or the server's
configured wait window expires. Omit `timeout_seconds` for the normal server
window. If the result is still pending (`wait_complete: false`) with no required
action, renew only the same wait with the same IDs and receipt. A disconnected
wait also does not mean the remote run failed: retry only that wait.

Do not loop over get/status/event tools or shell sleeps. Do not resend input or
create another execution to recover. Read session events once after completion
only if needed to retrieve the final reply.

Show the user the agent's reply, not a summary of the events.

## 6. Install and run it

1. `guild_install_agent` into the workspace. It installs the latest published
   version, so publish first.
2. To run it on a schedule, `guild_schedule_agent`. To run it on a GitHub event,
   use the `build-triggered-agent` skill.
3. Values the agent reads at run time, such as a channel name, go in a workspace
   variable with `guild_set_workspace_variable`. Never put a secret in one;
   secrets belong in the integration's credentials.

## Changing an existing agent

`guild_list_agents`, `guild_list_agent_versions`, then
`guild_get_agent_version_code` on the latest version. Edit those files and
commit the full set with `guild_create_agent_version`, then follow steps 4 to 6.
An agent made with prompt and tools can also be changed by calling
`guild_configure_llm_agent` again.

## References

| Read                         | When                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `references/sdk.md`          | Writing agent code: the SDK, the three agent patterns, calling agents.  |
| `references/compiler.md`     | A `"use agent"` agent fails validation or misbehaves after resuming.   |
| `references/integrations.md` | Integration packages, MCP tool naming, delegating to the coding agent.  |
| `references/project.md`      | `package.json`, external prompts, versioning.                           |

The references come from the Guild CLI's documentation. Where they name a CLI or
npm command, use the MCP tool from the table at the top of each file instead.
