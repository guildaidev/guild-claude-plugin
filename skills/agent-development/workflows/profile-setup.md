# Prepare a prototype workspace and profile

Resolve real accessible accounts with `guild_whoami` and
`guild_list_my_organizations`. A managed employee may have no personal account.
Use the confirmed organization ID for the candidate and workspace; ask only if
the intended owner is ambiguous. Never infer ownership from a display name.

Use `guild_list_my_workspaces` to reuse a suitable ordinary workspace under
that owner. If needed, `guild_create_workspace` with `name` and `owner_id`.
There is no special hidden prototype workspace. Retain the returned workspace
UUID and owner reference.

## Select the execution profile

`guild_list_gateway_profiles` takes `workspace_id_or_name`. Reuse a suitable
profile selected by the user, or `guild_create_gateway_profile` with the
workspace and `name`. Read it with `guild_get_gateway_profile` using the
returned profile name as `profile_name`. The returned profile `id` is the UUID
for execution; names and UUIDs have different roles.

Use `guild_list_profile_integrations` to inspect declarations. Discover each
required service with `guild_search_integrations` and its exact tools with
`guild_list_integration_tools`. Declare only required services with
`guild_add_profile_integration` (`workspace_id_or_name`, `profile_name`,
`integration_id_or_name`, `required_credentials_mode`).
`guild_update_profile_integration` changes the mode with those same targeting
fields. Don't silently repurpose an existing profile that serves other runs;
clarify or create a separate prototype profile when changing it would matter.

- `MEMBER`: the acting member's connection for their runs.
- `SHARED`: an organization connection for runs on behalf of the organization.
- Null: a personal workspace. A dedicated profile connection can serve either
  organization mode, subject to its actual permissions.

Select the intended mode from the use case and existing configuration. A denied
shared setup requires its admin handoff, not a silent switch to personal mode.
A profile's configuration is live: removal, revocation, policies and archival
can change later calls. Its immutable session link is not a config snapshot.

## Prepare connections in the browser

`guild_list_credentials` with the workspace owner as `account_id_or_name` and
the returned integration full name as `integration` is inventory only.
Membership `target`, workspace restrictions and dedicated grants affect use.
Do not pick the oldest credential or invent a pin from inventory. Ask the user
to choose when multiple plausible connections remain.

Honor actual profile metadata. OAuth detail returns
`connection_status: browser_check_required`, `connection_url` and
`connection_instructions`. Give that anchored link for the user to inspect or
select a connection. When this status is present and the user has not confirmed
browser setup for this profile and integration, show the returned link and wait
for that confirmation **before starting a test that uses it**. Their confirmation is
**user-confirmed setup**, not a server-verified credential pin or proof of
execution readiness. An earlier explicit confirmation for this
profile/integration can be used; don't ask it again. Inspect metadata again after a reported change and retain its actual
limits. The constrained test provides execution evidence.

For a new connection, `guild_get_integration_connect_url` takes the returned
`integration_id_or_name` and exactly the appropriate target:

| Connection | Target arguments |
| --- | --- |
| Acting member's own connection | `workspace_id`, no `owner_id` |
| Organization-shared connection | Organization `owner_id`; admin authority required |
| Dedicated profile connection | Profile UUID as `workspace_agent_id` plus workspace owner's `owner_id`; no `workspace_id` |
| A test's credential-request event | Actual `event_id` only; no owner/workspace/profile targets |

For a dedicated connection only the profile creator or an account admin has
that authority. Redirect providers finish in the browser. Manual keys and
non-OAuth setup use the supported profile/credentials page from the actual
response; explain the required admin or manual setup if unavailable. Re-list
inventory after browser completion, without treating it as credential selection.

Generic OAuth association or credential-policy writes remain denied. Browser
permissions and existing credential operation/resource policies are authoritative.
Never ask for secrets or put them in prompts, source or workspace variables.
Use only the test connections and destinations the user authorized; a profile
does not turn a production provider into a test environment.
