# Colleague trial: build and test Guild agents through Claude

This guide assumes you already have local checkouts of **guildcode** and
**guild-claude-plugin**. Both use the branch `howard/full-adlc-prototyping`.
Switching a Git branch changes the files in your checkout; `cd` only changes
directories.

**Pulling both branches is necessary for the unpublished stack, but is not the
whole setup.** Install/build the backend dependencies, then run the acceptance
command below. Simply starting `claude --plugin-dir ...` loads the new skills
but still connects to hosted Guild, not your local Guildcode changes.

| What you want to try | How to run it | Backend |
| --- | --- | --- |
| Verify the complete unpublished development loop now | Steps 1–5 | Temporary local Guild backend and runtime, with synthetic integrations |
| Type your own prompts and build a real Guild agent | Interactive walkthrough below, after backend deployment | Hosted Guild, with your own account and approved test connections |

The first path runs a real Claude Code conversation automatically. It does not
open an interactive chat for you to type into. An interactive session wired to
the unpublished local backend is not provided by this runner.

The product goal in both cases is for **Guild to build and run the agent**.
The local backend is an engineering test of that platform workflow. Customers
will not need either source repository or a local Guild server.

## 1. Select your existing checkout directories

Open a normal terminal outside any running Claude Code session. Use this same
terminal for all the numbered steps, so the variables remain available.
Change only the two paths here to your actual checkout directories:

```bash
export ADLC_GUILDCODE_DIR="/absolute/path/to/guildcode"
export ADLC_PLUGIN_DIR="/absolute/path/to/guild-claude-plugin"
```

## 2. Switch and update both branches

This block stops if either checkout has uncommitted changes. Commit or set aside
your own work before trying again. It does not reset or discard files.

```bash
(
  set -eu
  for ADLC_REPO_DIR in "$ADLC_GUILDCODE_DIR" "$ADLC_PLUGIN_DIR"; do
    cd "$ADLC_REPO_DIR"
    if [ -n "$(git status --porcelain)" ]; then
      printf 'Stop: uncommitted changes in %s\n' "$ADLC_REPO_DIR" >&2
      exit 1
    fi
    git fetch origin
    git switch howard/full-adlc-prototyping
    git pull --ff-only origin howard/full-adlc-prototyping
    git log -1 --format='%h %s'
  done
)
```

On a first checkout, `git switch` normally creates a local tracking branch from
`origin`. If Git reports that the branch is checked out in another worktree,
use that existing worktree and update the corresponding path from step 1.
If a pull cannot fast-forward, stop and resolve the branch divergence; do not
force-reset your checkout.

## 3. Check prerequisites

You need the normal Guildcode development tools:

- Node.js 25 or newer, and npm 11.7 or newer.
- `uv`; it provisions the Python 3.13 environment required by Guildcode.
- Podman, with a working container engine. On macOS this needs a running
  Podman machine.
- Claude Code installed and signed in. The terminal acceptance was verified
  with Claude Code 2.1.319; use that version or newer.
- Network access for Git dependencies, npm packages, container images and
  Claude's model service.

Check your tools:

```bash
(
  set -eu
  command -v git node npm uv podman claude
  node --version
  npm --version
  uv --version
  claude --version
  podman info > /dev/null
  claude auth status --text
)
```

If Claude reports that you are not signed in, run `claude auth login` and finish
the browser flow. This is your **Claude** login. The automated fixture supplies
its own temporary Guild identity, so it does not require a production Guild
login or a Slack connection.

On macOS, if the Podman machine already exists but is stopped:

```bash
podman machine start
```

If you have never created one, use `podman machine init --now` instead. Missing
tools are covered by the [Guildcode setup instructions](https://github.com/guildaidev/guildcode/blob/howard/full-adlc-prototyping/README.md#getting-started).

## 4. Install dependencies and build

Run after switching branches, including when your checkout already has an older
build. No frontend build, local database reset or Guild CLI login is needed for
this test.

```bash
(
  set -eu
  cd "$ADLC_GUILDCODE_DIR/python"
  uv sync --locked
  cd "$ADLC_GUILDCODE_DIR/guildai"
  npm ci
  npm run build
  podman pull docker.io/library/node:25-alpine
  cd "$ADLC_PLUGIN_DIR"
  claude plugin validate .
  claude plugin test .
)
```

The plugin uses Claude's plugin loader and test runner; there is no separate
`npm install` in the plugin repository. Expected plugin result: validation
passes and all 32 mod tests pass. Those tests cover the sessions pane; the next
step exercises the agent-development skills against Guild.

If any command fails, resolve that error before continuing. `uv`/npm
authentication or download errors are dependency setup problems, not a reason
to change the plugin's connector or use production credentials in the fixture.

## 5. Run the end-to-end Claude acceptance

```bash
export ADLC_EVIDENCE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/guild-adlc-trial.XXXXXX")"
(
  set -eu
  cd "$ADLC_GUILDCODE_DIR"
  PROFILE_TEST_PLUGIN="$ADLC_PLUGIN_DIR" \
  PROFILE_TEST_EVIDENCE="$ADLC_EVIDENCE_DIR" \
    ./scripts/test-profile-prototyping.sh --claude -q
)
```

Keep `--claude` as the first argument. Allow several minutes; a recent run took
about 9 minutes, and cold dependency/container caches can add time. You do not
type replies during this run: the test sends the user turns and performs the
simulated admin connection setup.

The runner starts and stops its own backend, runtime, temporary databases and
local package service. **Do not start development servers for this test.** It
copies the plugin and redirects only that temporary copy to the local MCP
server. Your checkout's `.mcp.json`, installed plugin, production Guild login
and development database stay unchanged.

Agent execution and synthetic integration calls run locally. Claude's reasoning
still uses its hosted model and counts toward your Claude usage. The main
conversation has an $8 budget cap; a separate missing-capability probe has a
$2 cap. The runner unsets `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`, so use a
working Claude sign-in rather than relying only on those environment variables.

### What success means

Pytest ends with **`2 passed`** and exit status 0. The two tests cover:

1. A real Guild SDK agent built and tested through OAuth/MCP/runtime, followed
   by Claude using the plugin to create a workspace/profile, handle connection
   setup, build a private inventory helper, answer its question, revise it and
   accept the exact tested version. Denied integrations/operations and the
   missing-capability stop are checked too.
2. A managed-employee identity performing profile-bound tests, including
   permission boundaries. This uses local OAuth fixtures, not real Okta SSO.

The inventory service is synthetic; this is not a live Slack test or production
release. The acceptance harness disables hooks, so the interactive sessions
pane is covered by the plugin tests rather than this conversation.

### Review the conversation and result

The directory printed at startup is also saved in `$ADLC_EVIDENCE_DIR`:

```bash
ls -lh "$ADLC_EVIDENCE_DIR"
cat "$ADLC_EVIDENCE_DIR/claude-final.json"
cat "$ADLC_EVIDENCE_DIR/claude-accepted-envelope.json"
```

`claude-stream.jsonl` contains the conversation and tool activity;
`claude-tool-calls.json` contains the main workflow's tool calls;
`claude-accepted-readbacks.json` contains the backend readbacks used to verify
the accepted version. The envelope records candidate/version, workspace,
profile, session, test input and result evidence. Acceptance does not activate
an installation or trigger.

Keep evidence private. On failure, share the failing assertion, both Git commit
IDs and the relevant redacted log excerpt; do not upload the whole evidence
directory. The runner handles service cleanup. The evidence directory remains
so you can inspect it after the temporary test data is gone.

### Repeat after pulling changes

Repeat steps 2 and 4, then step 5. Each run uses fresh temporary data. To verify
only the backend/runtime without invoking Claude or spending model usage:

```bash
(
  set -eu
  cd "$ADLC_GUILDCODE_DIR"
  ./scripts/test-profile-prototyping.sh -q
)
```

That still requires the built runtime and Podman. It does not prove the skills
or conversational UX.

## Interactive walkthrough against hosted Guild

Use this section **after the matching backend changes have been deployed**.
Pulling or building Guildcode locally does not update `https://api.guild.ai/mcp`.
The connected server must expose `guild_start_profile_agent_test_session` and
the profile-management tools. The skill stops if they are missing rather than
falling back to an unbound test.

Only the updated plugin checkout is needed for this mode. If you skipped the
local acceptance, complete the plugin portion of steps 1–2 and sign in to
Claude. Start in a fresh directory so Guildcode's repository instructions do
not become part of the customer-style conversation:

```bash
export ADLC_CHAT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/guild-adlc-chat.XXXXXX")"
cd "$ADLC_CHAT_DIR"
claude --plugin-dir "$ADLC_PLUGIN_DIR"
```

`--plugin-dir` loads the checkout for this session without requiring marketplace
publication. See [Claude's local plugin instructions](https://code.claude.com/docs/en/plugins/create#load-a-plugin-for-one-session).
Inside Claude, use `/plugin` to confirm Guild loaded and `/mcp` to check the
Guild connector. Authenticate with your own Guild account if requested. Do not
replace or log out of an existing working Guild connection to run this guide.

Type this request, replacing the channel name with an approved test channel:

```text
Help me build a private Guild agent that summarizes recent messages from our
Slack test channel CHANNEL_NAME. Use a dedicated test workspace and profile.
Ask me which connection to use if there is a choice. Run the agent on Guild
and show the actual result. Keep it private and do not install or schedule it.
```

Answer the planning questions and complete any requested connection setup in
Guild. Then ask for a revision:

```text
Update the same agent to include action items with an owner when one is stated.
Run the revised version with the same test setup and show me the actual result.
```

Review the output, then accept it:

```text
I accept this tested version. Show me the accepted-version handoff, including
the version, workspace, profile, session, test input and result evidence.
Keep it private; do not install it or enable any production triggers.
```

Check that Guild executed the tests, revisions keep the same agent identity,
and the handoff refers to the revised tested version/session. For output review,
the result is available in chat with a structured JSON fallback. Presentation
can evolve independently of the lifecycle.

This mode creates real Guild records and uses your actual approved connections.
A profile governs Guild-brokered integration access; it does not create a
staging copy of Slack or sandbox arbitrary network access. Test sessions retain
normal Guild history. Private candidate publication can occur during building;
production installation, triggers and release gates are separate actions.

Production release/smoke testing, real Okta SSO, Desktop Code tab and Desktop
chat require their own acceptance runs. The commands in this guide target
Claude Code terminal.

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| `claude`, `uv`, `node`, `npm` or `podman` is not found | Fix that tool's installation/PATH, then repeat step 3 in the same terminal. For a Claude executable outside PATH, set `PROFILE_TEST_CLAUDE_BINARY` to its absolute path before step 5. |
| Runtime files or exports are missing | Repeat step 4 on the Guildcode branch; pulling source does not rebuild `dist/`. |
| Podman cannot connect | Start the existing Podman machine on macOS, then confirm `podman info` succeeds. |
| Claude authentication fails | Check `claude auth status --text`; finish Claude sign-in before rerunning. Guild login is separate. |
| Hosted Guild lacks the new profile-test tool | The backend has not supplied the required capability. Use step 5 for unpublished-stack verification, or wait for deployment for an interactive hosted trial. |
| Skill changes do not appear in an interactive session | Exit and restart with the explicit `--plugin-dir` command. Check `/plugin` for load errors and the checkout path. |
| A test fails or hits its model budget | Inspect the first failing assertion and the retained evidence before retrying. Do not remove profile checks or switch to production credentials to get a pass. |

## Release order

Merge and deploy the Guildcode stack before distributing the matching plugin.
For marketplace installations, publication/update and client reload are separate
from merging a PR. Once the backend is deployed, normal users only need the
plugin, their Guild login and approved test connections.
