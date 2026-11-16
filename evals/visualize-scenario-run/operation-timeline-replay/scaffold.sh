#!/bin/sh
set -eu
case_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
mkdir fixtures
cp "$case_dir/files/verify-review.mjs" verify-review.mjs
cp "$case_dir/mocks/guild/fixtures/events.json" fixtures/source-events.json
cp "$case_dir/mocks/guild/fixtures/session.json" fixtures/session.json
chmod 444 verify-review.mjs fixtures/source-events.json fixtures/session.json
