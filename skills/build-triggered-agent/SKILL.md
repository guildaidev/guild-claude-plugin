---
name: build-triggered-agent
description: Build a Guild agent that runs on a GitHub event (pull request opened, issue opened) and acts on it, for example DMs someone in Slack. Use when the user wants an agent that reacts to a repository event, or when a Guild webhook trigger never fires.
---

# Build an agent that runs on a GitHub event

Do all of this with the Guild MCP tools (`guild_*`). Never run the `guild` CLI,
`npm` or `git`. One decision up front decides whether the trigger ever fires.

If no `guild_*` tools are available, the user hasn't signed in to Guild yet.
Tell them how and stop, as the `agent-development` skill describes.

For prototyping or revision, use `agent-development` to test a private candidate
first. Activate a trigger only after the user explicitly requests deployment
and confirms the version and destination. Do not publish prototype changes over
an existing auto-updating production agent.

## 1. Decide who owns the workspace

A webhook trigger receives events only through the GitHub connection it was
created with. That connection is a GitHub App installation, and events from a
repository arrive under the installation of the account that owns it.

- Repository owned by a GitHub organization: put the agent in a workspace owned
  by the matching Guild organization, whose GitHub connection is that
  organization's installation. A personal GitHub connection is usually the
  person's own installation and never receives the organization's events.
- Repository owned by the user: a personal workspace works.

Check the connection before building anything: `guild_list_credentials` with
the workspace's owner as `account_id_or_name` and `guildai~github` as
`integration`. A trigger runs for the organization, not for one member, so it
needs the organization's shared connection: a credential with no `target`. If
there is none, `guild_get_integration_connect_url` for `guildai~github` with
the organization as `owner_id`. Only an organization admin may request that
link. If the call is refused, tell the user an admin must connect GitHub for the
organization in Guild, and stop until they confirm. A member's own connection,
the one made with `workspace_id` alone, does not serve a trigger. Confirm with
`guild_list_credentials` once they say it is done.

A private agent owned by a user cannot be installed in an organization's
workspace. For a new prototype, choose the intended owner before building.
If an accepted prototype cannot be installed under the confirmed owner, stop
and explain the mismatch. Building a replacement under another owner requires
its own testing and acceptance before activation.

## 2. Prepare the accepted version

Retain the accepted agent ID, exact version ID and test evidence from
`agent-development`. If there is no accepted version, use that skill to build,
test and review a prototype before continuing. The agent must handle the raw
GitHub webhook payload (`action`, `pull_request`, `issue`, `repository`). If
adapting it requires source changes, return to testing and review; acceptance
of the earlier version does not cover a new version.

1. Reuse the accepted agent and exact version. Do not call `guild_create_agent`
   or `guild_create_agent_version` as part of activation.
2. If the accepted version is unpublished, use `guild_publish_agent_version`
   on that exact ID. Wait with `guild_wait_for_job` using the returned version
   and job IDs, following `agent-development`'s wait and failure handling.
3. Find or create the confirmed production workspace. Use
   `guild_list_installed_agents` to find an install of the accepted agent ID;
   reuse it, or call `guild_install_agent` if none exists.
4. `guild_install_agent` selects latest, which may differ from the accepted
   version. Use `guild_update_installed_agent` with the accepted version ID as
   `new_version_id` and `should_autoupdate: false` to pin it. Auto-updates
   require the user's explicit authorization. Re-read the installed agents and
   confirm the install's version ID matches before creating any trigger. If
   pinning or verification fails, stop before activation.
5. Anything the agent reads from its environment, such as a Slack member ID,
   goes in a workspace variable: `guild_set_workspace_variable`. Never put a
   secret in one.

## 3. Create the triggers

1. `guild_search_integrations` for GitHub. Its `webhook_config` gives the
   config ID, the events and actions it sends, and the `service_config_fields`
   a trigger needs (`repo`, as `owner/repo`).
2. Use the preceding section's verified install and its `workspace_agent_id`.
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
