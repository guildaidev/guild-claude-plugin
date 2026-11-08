---
name: agent-development
description: Use when the user wants to create, prototype, test, revise, publish or deploy a Guild agent through Guild MCP tools (guild_*).
---

# Build and test a Guild agent

Use Guild MCP tools (`guild_*`) for this workflow. Guild builds and validates
versions remotely. Send source as `files` to `guild_create_agent_version`;
never require the user to run the Guild CLI, npm or git, or save agent source
locally. Claude Code and Desktop chat use the same workflow. The sessions pane
is optional presentation.

If Guild tools are unavailable, explain how to connect, then stop:

- Claude Code: `/mcp`, select Guild, Authenticate, sign in in the browser.
- Claude Desktop or claude.ai: connect Guild under Customize > Connectors.

**Before any prototype execution, discover
`guild_start_profile_agent_test_session`.** If missing or unknown, explain that
the Guild MCP server must support profile-bound agent tests and profile setup.
Stop before execution. Never substitute `guild_start_agent_test_session` or
pass an unsupported `profile_id` to it.

## Follow the packaged workflow

Read each linked module before its phase. In Claude Code use `Read` with this
skill's base directory; in Desktop chat use its packaged skill-file reader.
If a module cannot be loaded, report the missing skill file and stop that
phase; do not reconstruct its instructions from the filename. These files are
part of the skill, not user files to create or a localhost dependency.

| Phase | Required module |
| --- | --- |
| Owner, ordinary workspace, profile, integrations and browser connections | [workflows/profile-setup.md](workflows/profile-setup.md) |
| Validated version, profile-bound test, required actions and feedback | [workflows/test-and-iterate.md](workflows/test-and-iterate.md) |
| Actual result, review and accepted exact-version handoff | [workflows/result-artifact.md](workflows/result-artifact.md) |

Keep Claude's usual clarification and smart defaults. Use known answers; ask
only when an owner, connection, desired behavior or external effect is unclear.
No initial questionnaire is required. Agree on a realistic test input and safe
test destinations. A profile constrains Guild-brokered integrations; it is not
OS or network isolation for arbitrary code.

## Build one private prototype

Complete profile setup before running. Use `guild_search_integrations` and
`guild_list_integration_tools` for actual integrations and exact tool names.
Choose the simplest shape that fits:

- **Prompt and tools:** most agents, where the model chooses integration calls.
- **Code:** fixed steps, loops, state, child agents, or no integration tools.
  A tool-free prompt uses `llmAgent({ tools: {}, useWorkspaceAgents: false,
  mode: "one-shot", systemPrompt })`; don't add an unrelated tool to satisfy
  `guild_configure_llm_agent`, which requires at least one.

Create with `guild_create_agent`: lowercase hyphenated name, confirmed owner ID,
one-line description. New agents default private. Retain the returned agent ID
throughout iteration, then `guild_wait_for_agent` for `READY`.

For prompt and tools, use `guild_configure_llm_agent` on that ID. It writes,
validates and publishes a **private candidate version** after validation. This
is separate from production installation. Don't publish it a second time.

For code, `guild_list_agent_versions`, then `guild_get_agent_version_code` on
the returned initial version. Read `references/sdk.md` before writing code.
Keep all project files, including package.json and tsconfig.json; declare
required `@guildai-services/<owner>~<name>` dependencies. Send every project
file to `guild_create_agent_version`, with a summary and without
package-lock.json. Source candidates can remain unpublished for testing.

Wait with the exact `version_id` and `job_id` from the build using
`guild_wait_for_job`. A timeout renews only that wait. On failure read
`guild_get_agent_version_validation`, repair the same prototype, and create a
new version. Use `references/compiler.md` for compiler failures. A passed
validation is required before the test phase.

## Revise an existing agent safely

Use `guild_list_agents`, `guild_list_agent_versions` and
`guild_get_agent_version_code` to inspect the intended source. Keep a private
prototype's agent ID when revising. If the source is already installed in
production, create a separate private prototype: publishing a revision of an
auto-updating production agent can affect it immediately. Resolve unclear
intent naturally before changing a live agent. Retain source agent/version
references for handoff.

Follow the test module for every revision, then the result module. A new
version or new test input gets a fresh test session. A completed test is an
invitation to review, never implicit acceptance or installation.

## Production is an explicit handoff

After explicit acceptance, prepare the exact-version handoff in the result
module for Logan, who owns production workspace setup, promotion, smoke and
operation. Prototype requests do not authorize installs, schedules or triggers.
Acceptance alone does not authorize production activation.

For a separately authorized production deployment, retain existing MCP
capabilities under Logan's workflow: publish the accepted source version when
needed and wait for its job; configure nonsecret workspace variables; install
and verify the selected version before activation. `guild_install_agent`
installs the latest published version, so never assume it is the accepted
version. Inspect `guild_list_installed_agents` and use
`guild_update_installed_agent` with the exact `new_version_id` and explicit
auto-update choice where appropriate. Schedules use `guild_schedule_agent`;
GitHub activation uses `build-triggered-agent`. Production connections, version
selection, permissions and smoke are separate gates.

## SDK references

| Read | When |
| --- | --- |
| `references/sdk.md` | Agent code, SDK patterns, child agents |
| `references/compiler.md` | Compiler failures or resume behavior |
| `references/integrations.md` | Integration packages and MCP tool naming |
| `references/project.md` | Project files, external prompts and versions |

These references are synced from the Guild CLI documentation. Where they name
CLI or npm commands, use the corresponding MCP tools. Keep their sync provenance
intact; plugin-owned workflow instructions live in `workflows/`.
