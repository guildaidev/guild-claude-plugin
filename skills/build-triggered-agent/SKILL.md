---
name: build-triggered-agent
description: Build and activate Guild agents for GitHub events. Use for repository-event workflows or webhook triggers that do not fire.
---

# Run a Guild agent on GitHub events

Use Guild MCP tools only. If unavailable, follow the connection instructions in `agent-development`.
Activate a trigger only after the user requests release and confirms the version and destination.

## 1. Choose the workspace and GitHub connection

1. Match the workspace owner to the repository owner.
   For organization repositories, use the Guild organization with that organization's GitHub App installation.
   For personal repositories, use the user's workspace and installation.
   A trigger receives events from its GitHub App installation.
2. Inspect `guild_list_credentials` with the workspace owner as `account_id_or_name` and `guildai~github` as `integration`.
   Organization triggers need a shared credential with no `target`. A member's connection does not serve them.
3. If missing, use `guild_get_integration_connect_url` with `guildai~github` and the workspace owner as `owner_id`.
   Organization setup requires an admin. If denied, explain the admin action. Stop until setup is confirmed.
   Recheck `guild_list_credentials` after browser setup.
4. Check that the accepted agent's owner permits installation in this workspace.
   A user's private agent cannot be installed in an organization's workspace.
   If ownership differs, stop before activation. A replacement requires another test and acceptance.

## 2. Prepare the accepted version

1. Retain the accepted agent ID, version ID and test evidence from `agent-development`.
   If absent, use that skill to build and test a private prototype first.
   The agent must handle the GitHub webhook payload: `action`, `pull_request`, `issue` and `repository`.
   If source changes are needed, repeat testing and acceptance. Do not publish over an auto-updating production agent.
2. Follow section 6, steps 1 and 2, of `agent-development` to publish and install the accepted version.
   That procedure pins and verifies the version before activation. Keep the verified `workspace_agent_id`.
   Do not recreate the agent or version during activation.

## 3. Create the triggers

1. Find GitHub with `guild_search_integrations`.
   Read its `webhook_config` for the config ID, events, actions and `service_config_fields`.
   Set `repo` to `owner/repo`.
2. Use the verified install's `workspace_agent_id` with `guild_create_webhook_trigger`.
   Create one trigger per required event and action, such as `pull_request` with `opened`.
   Set action filters on the trigger to avoid unnecessary runs.
3. If the tool refuses the operation, direct the user to the Guild web app.
   Do not use the CLI as a fallback.

## 4. Test the trigger

1. Agree on a safe real event, such as a test issue.
   A text-message test session cannot reproduce webhook input delivery.
2. Create only the agreed event. Check `guild_list_trigger_sessions`.
   Read the result with `guild_get_session_events`. Remove the test issue if agreed.
3. If no session appears, check the GitHub installation and event filters.
   Show the result and session link.
   Explain that Guild adds a session-link footer to Slack messages. This footer cannot be disabled.
