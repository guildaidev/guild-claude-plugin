# Reviewing the Guild plugin

This guide covers the two development skills. They use Guild's declared MCP connector and
work in Claude Code, Claude Desktop and claude.ai. See the
[README](../README.md) for installation and data handling.

The optional `visualize-scenario-run` skill has a local Node.js renderer,
distinct editor/checker requirements and a separate
[host acceptance gate](../skills/visualize-scenario-run/references/hosts.md).
Its [fixture validation record](visualization-validation.md) is not proof of
live host support or production transport. No automatic feedback adapter is enabled.

## Maintainer setup

Provide Anthropic with a dedicated Guild test account and synthetic sample
data through the submission's private review channel. Do not commit passwords,
tokens, customer session links or customer data to this repository.

Before handing over the account:

1. Confirm that sign-in and OAuth connection to `https://api.guild.ai/mcp`
   work for that account. Give the account permission and sufficient test
   capacity to create agents and run draft-version tests in a dedicated
   workspace, with no production integrations or customer data.
2. Run the two examples below. Keep the resulting successful and failed
   sample sessions available for the review, and privately supply their links,
   the workspace name and the account access instructions.
3. Record the plugin commit, Claude Code version, surface, date and results
   in the private handoff.
4. Identify the Guild support contact (`support@guild.ai`) and supply any
   additional customer data-processing terms that apply to the test account.

## Reviewer setup

Install the plugin as described in the README, then authenticate the Guild
server through `/mcp` in Claude Code, or connect it in claude.ai.

The examples use profile-based test sessions.
The connected Guild server must expose `guild_start_profile_agent_test_session`
and the profile setup tools from the `agent-development` skill.
If those tools are unavailable, stop before agent creation.

Run these prompts in order, in the same conversation, using the dedicated
workspace supplied in the private handoff. Both create agents and test
sessions. They do not require Slack, GitHub or another integration.

## 1. Build and test an agent

> In the review workspace, build a Guild agent named directory-review-echo.
> Use TypeScript code, without an LLM or integration tools: accept a message
> string and return it as an echo string. If the agent already exists, reuse
> it. Create a draft version and test it with message "Guild directory review".
> Do not publish, install, schedule or create triggers. Show me the returned
> output and the Guild test-session link.

Expected: the draft builds, a test session completes, and the output contains
`echo: "Guild directory review"`. Claude supplies a session link. No scheduled
run or third-party integration action is created. If the account lacks workspace
access or capacity, Claude reports the actual error instead of claiming success.

## 2. Diagnose a failed run

> In the review workspace, build a Guild agent named directory-review-failure
> using TypeScript code that throws Error("Directory review sample failure")
> when run. If it already exists, reuse it. Create a draft version and test it.
> Do not publish, install, schedule or create triggers. Inspect the failed
> session and explain the failure using its recorded error. Give me the
> session link.

Expected: the build succeeds and the test execution fails with the intentional
sample error. Claude reports the failure and its evidence rather than a
successful result. An account cannot read sessions Guild refuses it permission
to read.

## Try a background run

This example uses an interactive terminal session in Claude Code.
Claude Code and Guild provide [native MCP Tasks](https://code.claude.com/docs/en/mcp#mcp-tasks-that-run-on-the-server) through MCP.
The example does not require the plugin mod or a sessions pane.

1. Update the Guild plugin through `/plugin`.
2. Run `/reload-plugins`, or start a new Claude Code session.
3. Open `/mcp` to check the Guild connection.
4. Give Claude synthetic feedback or information you have permission to send
   to Guild.
5. Send this prompt:

> In the review workspace, build a draft Guild agent that converts customer
> feedback into a product brief.
> Identify the three recurring problems.
> Include supporting quotes, affected customer segments and suggested next
> steps.
> Use only the feedback I provide.
> Identify missing evidence.
> Use this batch for a test: [paste feedback].
> Do not publish, install or schedule the agent.
> Show me the brief when the agent finishes.
> Include the session link.

If the wait returns an MCP Task, ask Claude to write an agenda while that task
runs.
Open `/tasks` to check the MCP Task.
Claude should answer the agenda request and report the brief when the task
returns its result.
Claude should use the existing execution without repeated status tool calls.

A short run can return its result before Claude Code creates an MCP Task.
That result verifies direct completion. It does not verify a background wait.

Record the plugin version, Claude Code version, client, session link, wait call
count and result.
If an MCP Task returns an error or requests user action, check that Claude
reports that result.
The client's own status requests are expected. They do not require repeated
model tool calls.

## Cleanup

Delete test agents and sessions through the supported Guild controls when the
review finishes, or contact support for cleanup. Revoking the connection in
Guild under Security > Connected apps stops future authenticated access; it
does not delete server records. Keep the test account active during review.

## Release and submission checks

Use the [directory submission notes](directory-submission.md) for the portal's
findings, data-handling questions and compliance acknowledgements.

1. Review the [directory checklist](https://claude.com/docs/plugins/pre-submission-checklist)
   and [directory policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy).
   Keep every file inside the plugin folder as Markdown, text, JSON, YAML or
   an image. The directory accepts code files only from Verified
   organizations. Retain the license and README, and increase `plugin.json`'s
   version for a release.
2. Run `claude plugin validate . --profile directory --strict` from the plugin
   folder.
3. Complete the private test-account handoff and live checks above. Record
   the actual results; the examples in this guide are acceptance criteria,
   not a claim that those checks have already run on a submitted version.
4. Open Guild's existing plugin submission in the
   [developer portal](https://claude.ai/directory/manage), confirm its tracked
   branch, and validate the exact release commit. Do not create a duplicate
   submission for the same repository and folder. After a fix, revalidate or
   check for new commits as the portal instructs.
5. Answer the data-handling questions using the README and the applicable
   Guild terms. Confirm personal-data handling, retention, destinations and
   age suitability with the responsible Guild owner.
6. Confirm the separately submitted Guild MCP connector uses the same URL
   and organization as the plugin.
7. Address blocking findings and security-scan results. A policy hold needs
   Anthropic review; passing local checks does not clear it. Follow the
   portal's publishing instructions after approval. See
   [Submit your plugin](https://claude.com/docs/plugins/submit).
