# Reviewing the Guild plugin

This guide covers the two skills. They use Guild's declared MCP connector and
work in Claude Code, Claude Desktop and claude.ai. See the
[README](../README.md) for installation and data handling.

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

Use an interactive terminal Claude Code session with
[native MCP Tasks support](https://code.claude.com/docs/en/mcp#mcp-tasks-that-run-on-the-server).
Update the plugin and reload it before starting. Use synthetic feedback or
information you are authorized to send to Guild.

> In the review workspace, build a draft Guild agent that turns a batch of
> customer feedback into a product brief: the three recurring problems,
> supporting quotes, affected customer segments, and suggested next steps.
> Use only the feedback I provide and flag missing evidence. Test it on this
> batch: [paste feedback]. Do not publish, install or schedule it. Show me the
> brief and the session link when it finishes.

While the run is pending, ask Claude to help write a short agenda for reviewing
the brief. Expected: Claude can answer while the existing Guild task runs and
delivers the brief when the result arrives. It does not start a second run or
loop over status tools. Check `/tasks` for the background task. A quick run may
finish before a task is created; that demonstrates direct completion, not a
long-running background wait.

Record the plugin and Claude Code versions, surface, session link, wait call
count and observed result. A native task's completion notification can also
carry an error or an action request; verify Claude reports that outcome. The
client's internal task status requests are expected and are separate from
model-driven polling.

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
