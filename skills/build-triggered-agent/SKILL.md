---
name: build-triggered-agent
description: Build a Guild agent that runs on a GitHub event (pull request opened, issue opened) and acts on it, for example DMs someone in Slack. Use when the user wants an agent that reacts to a repository event, or when a Guild webhook trigger never fires.
---

# Build an agent that runs on a GitHub event

Do all of this with the Guild MCP tools (`guild_*`). Never run the `guild` CLI,
`npm` or `git`. One decision up front decides whether the trigger ever fires.

## 1. Decide who owns the workspace

A webhook trigger receives events only through the GitHub connection it was
created with. That connection is a GitHub App installation, and events from a
repository arrive under the installation of the account that owns it.

- Repository owned by a GitHub organization: put the agent in a workspace owned
  by the matching Guild organization, whose GitHub connection is that
  organization's installation. A personal GitHub connection is usually the
  person's own installation and never receives the organization's events.
- Repository owned by the user: a personal workspace works.

A private agent owned by a user cannot be installed in an organization's
workspace. When the workspace belongs to an organization, create the agent
under that organization too (`guild_create_agent` with `owner_id`).

## 2. Create and publish the agent

1. `guild_create_agent` with the owner from step 1.
2. `guild_create_agent_version` with every source file and `publish: true`.
   The agent's input is the raw webhook payload, so validate it with a schema
   that matches GitHub's (`action`, `pull_request`, `issue`, `repository`).
3. Poll `guild_get_agent_version_validation` until it passes.
4. `guild_create_workspace` if needed, then `guild_install_agent`.
5. Anything the agent reads from its environment, such as a Slack member ID, goes
   in a workspace variable: `guild_set_workspace_variable`. Never put a secret
   in one.

## 3. Create the triggers

1. `guild_search_integrations` for GitHub. Its `webhook_config` gives the
   config ID, the events and actions it sends, and the `service_config_fields`
   a trigger needs (`repo`, as `owner/repo`).
2. `guild_list_installed_agents` for the install's `workspace_agent_id`.
3. `guild_create_webhook_trigger`, one per event and action, for example
   `pull_request` with `opened`. Filter by action in the trigger rather than in
   the agent, so the agent does not run on every `synchronize` or `labeled`
   event.

If the tool is refused, tell the user to create the trigger in the Guild web app
instead. Don't fall back to the CLI.

## 4. Test with a real event

A test session wraps its input as a text message, so it cannot stand in for a
webhook payload. Cause a real event instead: open an issue whose title matches
the agent's filter, check `guild_list_trigger_sessions`, read the result with
`guild_get_session_events`, then close the issue.

If no session appears within a minute, the trigger is bound to the wrong GitHub
installation. Go back to step 1.

## What to tell the user

Agent messages sent to Slack always end with a footer linking the session that
sent them. Guild adds it for traceability and it cannot be turned off.
