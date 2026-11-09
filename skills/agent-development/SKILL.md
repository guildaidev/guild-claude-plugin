---
name: agent-development
description: Build, test, revise, publish and deploy Guild agents through Guild MCP tools (guild_*). Use when the user wants to create a Guild agent, change one or try it on Guild.
---

# Build and test a Guild agent

Use Guild MCP tools (`guild_*`) throughout. Guild builds and runs agents on its
servers. Send source as `files`; never require the user to run the Guild CLI,
npm or git, or save agent source locally.

If Guild tools are unavailable, explain how to connect and stop: in Claude
Code use `/mcp` and authenticate Guild; in Desktop chat or claude.ai connect
Guild under Customize > Connectors.

## 1. Pick the owner and the shape

1. Use `guild_whoami` and, for organization work, `guild_list_my_organizations`.
   Confirm the accessible owner ID; a managed employee may have no personal
   account. Use known answers and smart defaults, asking only the next useful
   question when the owner, connection or desired behavior is unclear.
2. Choose **prompt and tools** when the model chooses integration calls, or
   **code** for fixed steps, loops, state or child agents. A tool-free prompt
   needs code: `llmAgent({ tools: {}, useWorkspaceAgents: false,
   mode: "one-shot", systemPrompt })`. Don't add an unrelated tool to satisfy
   `guild_configure_llm_agent`, which requires at least one.

## 2. Prepare the test workspace, profile and connections

1. Discover `guild_start_profile_agent_test_session` and the profile setup
   tools before building. If missing or unknown, explain the server requirement
   and stop. Never substitute `guild_start_agent_test_session`.
2. Use `guild_list_my_workspaces` to choose an ordinary workspace under the
   confirmed owner, or `guild_create_workspace` with `name` and `owner_id`.
   Retain its UUID. A profile constrains Guild-brokered calls; test credentials
   and destinations must still be appropriate for the external services.
3. `guild_list_gateway_profiles` with `workspace_id_or_name`; reuse a suitable
   selected profile or `guild_create_gateway_profile` with the workspace and
   `name`. Don't repurpose a profile used by other runs without agreement.
   Read it with `guild_get_gateway_profile` using its `profile_name`; retain
   the returned profile UUID for execution.
4. Discover services with `guild_search_integrations` and exact tool names
   with `guild_list_integration_tools`. Inspect `guild_list_profile_integrations`
   and declare required services with `guild_add_profile_integration`, using
   `workspace_id_or_name`, `profile_name`, `integration_id_or_name` and
   `required_credentials_mode`. Use `guild_update_profile_integration` to
   change a mode: `MEMBER` for the acting member, `SHARED` for organization
   runs, null for personal workspaces. A dedicated connection can serve either
   organization mode. A denied shared setup needs its admin handoff, not a
   silent switch to personal credentials.
5. `guild_list_credentials` with the workspace owner as `account_id_or_name`
   and the integration full name as `integration` is inventory, not selection.
   Membership targets, grants and workspace restrictions still apply. Ask when
   several plausible connections remain; don't choose the oldest.
6. If profile detail reports `connection_status: browser_check_required`, show
   its `connection_url` and instructions. Wait for the user's confirmation
   before testing that integration, unless already explicitly confirmed for
   this profile. Confirmation is user-reported setup, not a verified pin.
   For a new connection, use `guild_get_integration_connect_url`:

   | Connection | Target arguments |
   | --- | --- |
   | Acting member's own connection | `workspace_id`, no `owner_id` |
   | Organization-shared connection | Organization `owner_id`; admin required |
   | Dedicated profile connection | Profile UUID as `workspace_agent_id`, workspace owner's `owner_id`; no `workspace_id` |
   | Session credential request | Actual `event_id` only; no other targets |

   Dedicated connections require the profile creator or an account admin.
   OAuth completes in the browser; for manual keys use the returned settings
   link or explain the admin handoff. Never ask for secrets or place them in
   source, prompts or workspace variables. Honor credential policies; don't
   try generic grant or policy writes. Profile configuration remains live.

## 3. Create the private prototype

1. For an existing private prototype, inspect it with `guild_list_agents`,
   `guild_list_agent_versions` and `guild_get_agent_version_code`, and keep its
   ID. For a new prototype, `guild_create_agent` with a lowercase hyphenated
   name, confirmed `owner_id` and description, then `guild_wait_for_agent` for
   `READY`. Agents default private. To revise a production agent, create a
   separate private prototype: publishing over an auto-updating install can
   change production immediately. Retain the original source references.
2. For prompt and tools, `guild_configure_llm_agent` writes, validates and
   publishes a private candidate version. Don't publish it a second time;
   this is separate from installing it in production.
3. For code, get the initial version with `guild_list_agent_versions` and
   `guild_get_agent_version_code`. Read `references/sdk.md` before writing.
   Keep all project files and declare required `@guildai-services/<owner>~<name>`
   dependencies. Send every file to `guild_create_agent_version` with a summary,
   omitting `package-lock.json`. Candidates can stay unpublished for testing.
   Put conditional awaited tool or child-agent calls in explicit `if` blocks;
   the compiler can evaluate awaited ternary or short-circuit branches anyway.

## 4. Wait for the build

Call `guild_wait_for_job` with the exact returned `version_id` and `job_id`.
On failure read `guild_get_agent_version_validation`, repair the same prototype
and create a new version. Read `references/compiler.md` for compiler failures.
Require passed validation before testing.

For any pending or disconnected wait, repeat only that read-only wait with the
same IDs. Recover a native MCP task when available. Do not restart a build,
resend input, poll get/status tools or use shell sleeps to recover observation.
Cancelling observation does not prove execution stopped.

## 5. Test, show the result and revise

1. Agree on a realistic test input and safe destinations. Call
   `guild_start_profile_agent_test_session` with `workspace_id_or_name`, exact
   `agent_version_id` and profile UUID as `profile_id`. Verify returned
   `profile.id`, `profile.workspace.id`, the session workspace and
   `agent_version_override.id` match before sending input. Stop on a mismatch.
2. `guild_send_session_message` with the session ID and test `content`. Keep
   its `id` as `user_event_id` and `wait_after_event_id` as `after_event_id`.
   Call `guild_wait_for_session` with those three fields. Omit `timeout_seconds`
   for the normal window; renew only the same wait when still pending.
3. For `ACTION_REQUIRED`, surface the actual request:
   - `user_input`: ask the agent's question unless the user already answered.
     Send the answer to the **same session**, then wait with its new receipt.
   - `credentials`: use the real `action.event.id` with the connect-link tool,
     without owner/workspace/profile targets. Follow the browser handoff and
     observe the same session; saying "connected" does not fulfill the request.
   - `agent_install`: explain the dependency and required owner action. Don't
     install a dependency to widen the test profile's permissions.
4. Show the actual output or error and the Guild session link in chat. Read
   `guild_get_session_events` once if needed for the reply or action details.
   Preserve returned JSON as the agent's output; no separate result envelope
   is needed. State missing output, partial effects or connection uncertainty
   honestly. A send receipt doesn't prove consumption, and completion doesn't
   prove the result is useful. Ask the user for feedback.
5. For behavior changes, configure or create a new version on the same
   private agent, then repeat steps 4 and 5 with a fresh test session. A new input uses a
   fresh session; answering an active question is the same-session exception.
   On credential, policy or profile failures, show the actual blocker rather
   than switching credentials or profiles to get a pass. Before rerunning a
   test that may have written externally, inspect partial effects and agree
   how to proceed.
6. On explicit acceptance, retain the accepted agent/version IDs, test input,
   workspace/profile/session references, relevant receipts, connections and
   known limitations in a short readable handoff. Do not substitute latest.
   Acceptance alone does not authorize installation, schedules or triggers.

## 6. Release only when requested

1. Confirm the production workspace, connections and safe smoke test. Publish
   the accepted version with `guild_publish_agent_version` only if needed,
   then wait for that exact job. Configure nonsecret workspace variables with
   `guild_set_workspace_variable`.
2. Find the accepted agent in `guild_list_installed_agents`, or install it with
   `guild_install_agent`. Installation selects latest; verify its version and
   use `guild_update_installed_agent` with the accepted `new_version_id` and
   `should_autoupdate: false` unless auto-updates were explicitly authorized.
   Re-read and confirm the version before activation; stop if it cannot be pinned.
3. Schedules use `guild_schedule_agent`. For GitHub activation, hand the
   accepted agent/version IDs, test evidence and confirmed production workspace
   to `build-triggered-agent`. Source or ownership changes require a new test
   and acceptance. Run only the agreed smoke test and share its session link.

## References

| Read | When |
| --- | --- |
| `references/sdk.md` | Agent code, SDK patterns and child agents |
| `references/compiler.md` | Compiler failures or resume behavior |
| `references/integrations.md` | Integration packages and MCP tool naming |
| `references/project.md` | Project files, external prompts and versions |

These references come from the Guild CLI documentation. Where they name CLI or
npm commands, use the corresponding MCP tools. Keep their provenance intact.
