---
name: agent-development
description: Build, test, revise and release Guild agents through Guild MCP tools (guild_*). Use for agent creation or changes on Guild.
---

# Build and test a Guild agent

Use Guild MCP tools (`guild_*`). Guild builds and runs agents.
Do not use the Guild CLI, npm, git or local source files.
If Guild tools are unavailable, ask the user to connect Guild before continuing.
In Claude Code, use `/mcp`. In Desktop chat or claude.ai, use Customize > Connectors.

## 1. Choose the owner and agent behavior

1. Identify the user with `guild_whoami`. For organization work, use `guild_list_my_organizations`.
   Select an accessible owner. Managed employees can lack personal accounts.
2. Ask the next necessary question about the desired behavior, owner or service.
   Reuse answers and suitable defaults. Suggest an agent name. Wait for required answers before dependent actions.
3. Choose prompt and tools for model-directed integration calls.
   Choose code for fixed steps, loops, state, child agents or a prompt without tools.
   For a prompt without tools, use `llmAgent({ tools: {}, useWorkspaceAgents: false, mode: "one-shot", systemPrompt })`.
   Do not add unrelated tools to satisfy `guild_configure_llm_agent`.

## 2. Prepare the test workspace and profile

1. Check for `guild_start_profile_agent_test_session` and the profile setup tools before building.
   If unavailable, explain the server requirement. Stop before building.
   Never substitute `guild_start_agent_test_session`.
2. Select a workspace under the chosen owner with `guild_list_my_workspaces`.
   If needed, use `guild_create_workspace` with `name` and `owner_id`. Keep the workspace UUID.
3. Find a suitable profile with `guild_list_gateway_profiles`.
   If needed, use `guild_create_gateway_profile` with `workspace_id_or_name` and `name`.
   Read the profile with `guild_get_gateway_profile` using `profile_name`. Keep the profile UUID.
   Ask before changing a profile used by other runs.
4. Find services with `guild_search_integrations`. Get exact tool names with `guild_list_integration_tools`.
   Inspect `guild_list_profile_integrations` before adding services with `guild_add_profile_integration`.
   To change a mode, use `guild_update_profile_integration`.
   Set `required_credentials_mode` to `MEMBER` for member runs, `SHARED` for organization runs, or null for personal workspaces.
   A dedicated connection can serve either organization mode.
5. Inspect `guild_list_credentials` with the workspace owner as `account_id_or_name` and the integration full name as `integration`.
   Inventory does not prove connection access. Ask the user when several connections could apply.
6. If `connection_status` is `browser_check_required`, show the profile's `connection_url` and instructions.
   Wait for confirmation unless the user already confirmed setup for this profile.
   Treat confirmation as user-reported setup, not a verified credential selection.
   For new connections, use `guild_get_integration_connect_url`:

   | Connection | Target arguments |
   | --- | --- |
   | Member | `workspace_id`, no `owner_id` |
   | Organization-shared | Organization `owner_id`, admin required |
   | Dedicated profile | Profile UUID as `workspace_agent_id`, owner's `owner_id`, no `workspace_id` |
   | Active session request | Actual `event_id` only, no other targets |

   Dedicated setup requires the profile creator or an account admin.
   Complete OAuth in the browser. For manual keys, show the settings link.

   If access is denied, explain the required admin action. Do not silently switch credentials or owners.
   Keep secrets out of chat, source, prompts and workspace variables.
   Do not change credential grants or policies to bypass a failure.

Profiles govern Guild-brokered calls. They do not isolate external services.
Confirm appropriate test credentials and destinations before execution. Profile configuration remains live during the test.

## 3. Build the private prototype

1. For an existing private prototype, inspect `guild_list_agents`, `guild_list_agent_versions` and `guild_get_agent_version_code`.
   Keep its agent ID. For changes to a production agent, create a separate private prototype.
   Publishing to an agent with auto-updating installs can change production. Keep the original source references.
2. For a new agent, use `guild_create_agent` with a lowercase hyphenated name, owner ID and description.
   Wait for `READY` with `guild_wait_for_agent`. Agents default to private.
3. For prompt and tools, use `guild_configure_llm_agent`.
   This tool validates and publishes the private candidate. Do not publish twice.
4. For code, get any unread project files with `guild_list_agent_versions` and `guild_get_agent_version_code`.
   Read `references/sdk.md`. Declare required `@guildai-services/<owner>~<name>` dependencies.
   Send all project files to `guild_create_agent_version` with a summary. Omit `package-lock.json`.
   Leave the candidate unpublished for testing.

   Use explicit `if` blocks for conditional awaited tool or child-agent calls.
   The compiler can execute awaited ternary or short-circuit branches unexpectedly.

## 4. Wait for validation

1. Call `guild_wait_for_job` with the returned `version_id` and `job_id`.
2. If validation fails, read `guild_get_agent_version_validation`.
   For compiler failures, read `references/compiler.md`.
   Repair the same prototype with a new version. Require successful validation before testing.
3. For any pending or disconnected wait, repeat only that wait with the same IDs.
   Recover native MCP tasks when available. Do not poll status tools, use shell sleeps or restart the operation.
   Canceling a wait does not prove execution stopped.

## 5. Test and revise

1. Agree on test input and safe destinations.
   Call `guild_start_profile_agent_test_session` with `workspace_id_or_name`, exact `agent_version_id` and profile UUID as `profile_id`.
   Check the returned `profile.id`, `profile.workspace.id`, session workspace and `agent_version_override.id` against the selected values.
   If values differ, stop before sending input.
2. Send `content` with `guild_send_session_message`.
   Use its `id` as `user_event_id` and `wait_after_event_id` as `after_event_id`.
   Call `guild_wait_for_session` with those fields and the session ID. Omit `timeout_seconds`.
   If pending, repeat only the same wait. Never resend input to recover a wait.
3. For `ACTION_REQUIRED`, handle the actual request:
   - `user_input`: ask the question unless the user already answered. Send the answer to the same session.
     Wait with the new message receipt.
   - `credentials`: request a connection link with the actual `action.event.id` as `event_id` only.
     Follow the browser instructions. Wait on the same session. A chat confirmation does not fulfill the credential request.
   - `agent_install`: explain the required owner action. Do not install dependencies to widen profile access.
4. Show the actual output or error and session link in chat.
   If needed, read `guild_get_session_events` once for output or action details.
   Preserve structured output. Report missing output, partial effects and uncertain connection access.

   A send receipt does not prove consumption. Completion does not prove quality. Ask for feedback.
5. For behavior changes, create or configure a new version on the same private agent.
   Repeat sections 4 and 5 with a fresh session. Use a fresh session for new test input.
   Answer active questions in the existing session.

   If credentials, policy or profile access fail, report the blocker. Do not switch profiles or connections to bypass it.
   Before repeating an external write, inspect partial effects. Agree with the user on the next action.
6. On explicit acceptance, retain the exact agent/version IDs, input, workspace, profile, session, receipts, connections and limitations.
   Give a short readable handoff. Do not substitute the latest version.
   Acceptance does not authorize installation, schedules or triggers.

## 6. Release only on request

1. Confirm the production workspace, connections and safe smoke test.
   If unpublished, publish the accepted version with `guild_publish_agent_version`. Wait for that exact job.
   Set nonsecret runtime values with `guild_set_workspace_variable`.
2. Find the accepted agent with `guild_list_installed_agents`. If absent, use `guild_install_agent`.
   Installation selects the latest version. Pin the accepted `new_version_id` with `guild_update_installed_agent`.
   Set `should_autoupdate: false` unless the user authorizes auto-updates.
   Verify the installed version before activation. If verification fails, stop.
3. For schedules, use `guild_schedule_agent`. For GitHub events, use `build-triggered-agent` with the accepted IDs and test evidence.
   Source or ownership changes require another test and acceptance.
   Run only the agreed smoke test. Share its session link.

## References

Read the relevant reference only when needed. Use MCP tools instead of its CLI or npm commands.
Keep the Guild CLI provenance intact.

| File | Purpose |
| --- | --- |
| `references/sdk.md` | Agent code and SDK patterns |
| `references/compiler.md` | Compiler failures and resume behavior |
| `references/integrations.md` | Integration packages and tool names |
| `references/project.md` | Project files, prompts and versions |
