#!/usr/bin/env bash
# Copy the Guild CLI's Claude skills from a guildcode checkout into skills/.
# guildcode is the source of truth; never edit the copies by hand. Rerun this
# instead, and commit the result.
#
# usage: scripts/sync-cli-skills.sh <path-to-guildcode> [ref]   (ref defaults to origin/main)
set -euo pipefail

src=${1:?usage: sync-cli-skills.sh <path-to-guildcode> [ref]}
ref=${2:-origin/main}
root=$(cd "$(dirname "$0")/.." && pwd)
commit=$(git -C "$src" rev-parse "$ref")

show() { git -C "$src" show "$commit:cli/docs/skills/$1"; }

prereq='> These steps use the Guild CLI. Run `guild --version` first. If it is
> missing, install it with `npm install -g @guildai/cli`, then sign in with
> `guild auth login`.'

# <cli doc> <plugin skill name>
write_skill() {
  local doc=$1 name=$2 out="$root/skills/$2/SKILL.md"
  mkdir -p "$(dirname "$out")"
  # Rename the skill, and put the prerequisite under the first heading.
  show "$doc" | PREREQ="$prereq" awk -v name="$name" '
    NR > 1 && !done_name && /^name:/ { print "name: " name; done_name = 1; next }
    !done_prereq && /^# / { print; print ""; print ENVIRON["PREREQ"]; done_prereq = 1; next }
    { print }
  ' > "$out"
}

write_skill agent-dev.md agent-development
write_skill integrations.md integrations
write_skill factory-setup.md factory-setup

mkdir -p "$root/skills/agent-development/references"
for f in compiler.md integrations.md project.md; do
  show "agent-dev-references/$f" > "$root/skills/agent-development/references/$f"
done

echo "$commit" > "$root/skills/CLI_SKILLS_SOURCE"
echo "synced from guildcode $commit"
