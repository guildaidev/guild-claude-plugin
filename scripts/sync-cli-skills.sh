#!/usr/bin/env bash
# Copy the agent-writing reference from the Guild CLI's Claude skill in a
# guildcode checkout into skills/agent-development/references/. guildcode is the
# source of truth; never edit the copies by hand. Rerun this instead, and commit
# the result.
#
# Only the parts about writing agent code are copied. The CLI workflow (init,
# build, save) is replaced by the MCP workflow in agent-development/SKILL.md.
#
# usage: scripts/sync-cli-skills.sh <path-to-guildcode> [ref]   (ref defaults to origin/main)
set -euo pipefail

src=${1:?usage: sync-cli-skills.sh <path-to-guildcode> [ref]}
ref=${2:-origin/main}
root=$(cd "$(dirname "$0")/.." && pwd)
out="$root/skills/agent-development/references"
commit=$(git -C "$src" rev-parse "$ref")

show() { git -C "$src" show "$commit:cli/docs/skills/$1"; }

header() {
  cat <<'EOF'
<!-- Copied from guildcode cli/docs/skills by scripts/sync-cli-skills.sh. Do not edit. -->

> This reference is written for the Guild CLI. In this plugin, use the MCP
> tools instead and never run `guild`, `npm` or `git`:
>
> | CLI                                   | MCP tool                                        |
> | ------------------------------------- | ----------------------------------------------- |
> | `guild integration list`              | `guild_search_integrations`                     |
> | `guild integration operation list`    | `guild_list_integration_tools`                  |
> | `npm install <package>`               | add it to `dependencies` in `package.json`      |
> | `npm run build`, `guild agent save`   | `guild_create_agent_version`, then `guild_get_agent_version_validation` |
> | `guild workspace variable set`        | `guild_set_workspace_variable`                  |

EOF
}

mkdir -p "$out"

# The CLI skill's second half, from "## SDK Essentials" on, is how to write the code.
{ header; show agent-dev.md | awk '/^## SDK Essentials/ { p = 1 } p'; } > "$out/sdk.md"

for f in compiler.md integrations.md project.md; do
  { header; show "agent-dev-references/$f"; } > "$out/$f"
done

echo "$commit" > "$root/skills/CLI_SKILLS_SOURCE"
echo "synced from guildcode $commit"
