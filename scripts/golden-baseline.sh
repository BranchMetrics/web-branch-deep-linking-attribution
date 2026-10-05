#!/bin/sh
# Regenerates test/golden/__golden__ from a reference build (default
# origin/main). Only for creating the baseline or deliberately accepting a
# reviewed behavior change; never to make a refactor pass.
set -eu
REF="${1:-origin/main}"
TMP="$(mktemp -d)"
git worktree add --detach "$TMP" "$REF" >/dev/null
trap 'rm -f "$TMP/node_modules"; git worktree remove --force "$TMP"' EXIT
ln -s "$PWD/node_modules" "$TMP/node_modules"
(cd "$TMP" && node scripts/build.mjs >/dev/null)
rm -rf test/golden/__golden__
GOLDEN_BUNDLE="$TMP/dist/build.min.js" pnpm exec vitest run -c vitest.golden.config.mjs -u
