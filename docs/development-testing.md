# Trying the development workflow

Claude is the interface; Guild builds and runs the agent. Business users do not
need to run a local Guild backend or maintain agent source files on their laptop.

## Backend prerequisite

The connected Guild MCP server must expose
`guild_start_profile_agent_test_session` and the profile-management tools. Deploy
the matching Guildcode changes before distributing this plugin version broadly.
An older server causes an actionable stop before execution. The plugin does not
fall back to an unbound agent test.

The profile governs Guild-brokered integration access. It does not create test
copies of Slack or other services. Choose approved test connections and
destinations. Connection selection or policy setup may require a Guild admin in
the browser; ordinary Claude permissions and Guild authorization still apply.

## Try a checkout against hosted Guild

After the backend prerequisite is available, check out the trial branch:

```bash
git clone https://github.com/guildaidev/guild-claude-plugin.git
cd guild-claude-plugin
git switch howard/full-adlc-prototyping
claude --plugin-dir "$PWD"
```

This loads the checkout for the Claude Code session. The connector still points
to `https://api.guild.ai/mcp`. Authenticate with your own Guild account when
requested. No local Guildcode checkout is needed for this hosted trial.

Try a request using a test Slack channel you can read:

> Help me build a private Guild agent that summarizes recent messages from our
> Slack test channel. Use a dedicated test workspace and profile. Ask me which
> connection to use if there is a choice. Run the agent on Guild and show the
> actual result. Keep it private and do not install or schedule it.

Request a change, such as including action items, then review the fresh result
and explicitly accept that version. Expect the same agent identity, a new
version/session for the revision, actual output and an accepted-version handoff.
The handoff retains workspace/profile/session identifiers, test input, connection
mode and evidence. It does not activate production installs or triggers.

A private prompt-configured candidate can publish a version during validation;
source candidates can remain unpublished. Both remain separate from production
installation and activation. Test sessions retain normal Guild session history.

## Try both repositories before deployment

Engineering contributors can check out `howard/full-adlc-prototyping` in both
Guildcode and this repository. From the Guildcode root, with its normal
development dependencies and built runtime available:

```bash
PROFILE_TEST_PLUGIN=/absolute/path/to/guild-claude-plugin \
./scripts/test-profile-prototyping.sh --claude -q
```

This automated conversation uses a temporary local Guild backend/runtime and
synthetic integrations to verify the unpublished code. Claude uses its normal
hosted model. The runner copies this plugin and redirects only that copy to the
fixture server. It leaves the installed plugin and production login unchanged.
The printed evidence directory contains the real Claude/MCP trace and accepted
result. It is not an interactive launcher or a requirement for normal users.

## Release and acceptance

Merge and deploy the backend before releasing the matching plugin. For an
installed marketplace copy, update the plugin and restart Claude Code to load
it. A successful merge alone does not confirm directory publication or that an
existing installation has refreshed.

The full automated development loop is verified in Claude Code terminal.
Desktop Code tab and Desktop chat need their own acceptance runs. Production
promotion, release gates and smoke testing remain a separate workflow.
