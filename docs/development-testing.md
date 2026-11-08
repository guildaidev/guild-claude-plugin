# Development testing

Open a fresh Claude Code session in your existing Guildcode checkout and paste
the block below. Claude will find the plugin checkout, update both branches,
prepare the dependencies and run the development-loop verification. No new
clone is needed.

Before backend deployment, verification uses a temporary local Guild backend
and an automated Claude conversation. Interactive dogfooding against hosted
Guild needs the new backend tools deployed. The prompt handles the setup and
keeps that distinction explicit.

## Paste into Claude Code

```text
Help me set up and test the Guild agent-development workflow from the existing
local guildcode and guild-claude-plugin repositories. Do the setup for me rather
than giving me a long list of commands to run.

The goal is to build, test and revise agents on Guild, using Claude as the
interface, then review the exact tested version before a separate release.

1. Locate the two existing checkouts. Start with the current directory and its
   parent/sibling directories; check Git remotes to confirm the repositories.
   Ask for a path only if you cannot identify it unambiguously. Do not search
   my whole disk or clone another copy. Read the applicable repo instructions.

2. In both repos, fetch origin, switch to howard/full-adlc-prototyping and pull
   that branch with --ff-only. Preserve all my work. If a checkout is dirty,
   diverged or the branch is already checked out in a different worktree, explain
   the situation before proceeding. Do not reset, stash, commit, push or deploy.

3. Check Node >=25, npm >=11.7, uv, Podman and Claude Code >=2.1.319. Confirm
   Podman is running and Claude is signed in. Help me resolve missing tools;
   let me complete any browser login. Preserve my existing Guild connection.
   Install the Python dependencies with uv sync --locked in guildcode/python.
   In guildcode/guildai, run npm ci and npm run build. Pre-pull
   docker.io/library/node:25-alpine with Podman. In the plugin checkout, run
   claude plugin validate . and claude plugin test . Stop on an error and
   explain its cause before retrying.

4. Run the unpublished stack's acceptance test. Use the actual absolute paths
   you found for the two checkouts, and a fresh private evidence directory.
   From the guildcode root, the command is:

   env -u CLAUDECODE PROFILE_TEST_PLUGIN="<absolute plugin path>" \
     PROFILE_TEST_EVIDENCE="<fresh evidence directory>" \
     ./scripts/test-profile-prototyping.sh --claude -q

   Removing CLAUDECODE applies only to this test subprocess, which starts its
   own isolated Claude client. Do not change my shell configuration or Claude
   settings. The fixture owns the temporary backend/runtime/database lifecycle;
   do not start dev servers or modify .mcp.json. Allow the test to finish and
   keep me informed. It uses my normal Claude sign-in and model usage, with an
   $8 main-conversation cap and a separate $2 missing-capability probe.

5. Check the exit code and test summary. Success is 2 passed. Read the retained
   Claude transcript and accepted result envelope, then show me a short account
   of the agent built, the test output, the revision and the accepted version.
   Give me the evidence location and both repository commit IDs. If it fails,
   inspect the first failure and relevant logs; do not change product code or
   weaken checks to get a pass. Keep tokens and credentials out of your reply.

6. Help me move to an interactive dogfood session. If this session has the
   checkout's Guild plugin loaded and its connected server exposes
   guild_start_profile_agent_test_session plus the profile-management tools,
   ask what agent I want to build and guide me through build/test/revise/review.
   Keep the agent private; do not install it, schedule it or release it.
   If the checkout is not loaded, give me one exact external-terminal command
   to start Claude in a fresh directory with --plugin-dir pointing to it. Do
   not launch an interactive Claude process inside your Bash tool or claim to
   load a plugin just by reading its skill files. If the required backend tools
   are missing, tell me that interactive testing needs the backend deployment.

Be clear that the local acceptance is an automated conversation using synthetic
integrations. It is not an interactive session or a live Slack test. Loading a
local plugin checkout still connects to https://api.guild.ai/mcp; it does not
deploy my local Guildcode branch. Never fall back to an unbound agent test.
```

## Start the interactive session

If setup gives you a restart command, run it in a terminal, then paste:

```text
I want to dogfood Guild's agent-development workflow. Check that the Guild
plugin and profile-bound testing tools are available. If they are, help me
choose a small useful agent and guide me through building it, choosing approved
test connections, running it on Guild, reviewing the actual output, revising it
and accepting the tested version. Ask me the questions you need along the way.
Keep it private and do not install, schedule or release it.
```

Starting a session with `claude --plugin-dir /absolute/path/to/guild-claude-plugin`
loads the checkout without marketplace publication. See
[Claude's local plugin instructions](https://code.claude.com/docs/en/plugins/create#load-a-plugin-for-one-session).
Use `/plugin` to check the loaded plugin and `/mcp` to check its connection.
After backend deployment, this interactive path only needs the plugin checkout,
your Guild account and approved test connections.

## What the local verification covers

The runner copies the plugin and connects only that temporary copy to the local
OAuth/MCP/backend/runtime. It does not change the installed plugin, saved Guild
login or development database. It verifies profile setup, connection selection,
agent building, testing, answering a waiting agent, revision and exact-version
acceptance, plus authorization failures and a managed-employee fixture.

Expected results are plugin validation success, 32 plugin tests and 2 acceptance
tests passing. Runtime builds and agent/integration execution are local; Claude
reasoning uses its hosted model. The harness disables hooks, so the sessions
pane is covered by the plugin tests. Real Okta SSO and Desktop surfaces require
separate acceptance runs. There is no interactive local-backend mode in this
runner.

Evidence includes `claude-stream.jsonl`, `claude-final.json`,
`claude-accepted-envelope.json` and `claude-accepted-readbacks.json`. Keep it
private. When reporting a failure, share the assertion, commit IDs and a
redacted excerpt rather than uploading the full directory.

A profile governs Guild-brokered integration access and credential resolution.
It does not create staging copies of services or sandbox arbitrary network
access. Hosted tests use real Guild records and retain normal session history.
Private candidate publication and acceptance are separate from production
installation, triggers and release approval.
