#!/bin/sh
# Runs a pnpm script in CI's image: `pnpm perf:docker perf -g "v2 full page"`.
set -e
version=$(pnpm exec playwright --version | cut -d' ' -f2)
script=${1:-perf:baseline}
[ $# -gt 0 ] && shift
exec docker run --rm --ipc=host -v "$PWD":/work -v /work/node_modules -w /work \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c 'corepack enable && CI=1 pnpm install --frozen-lockfile > /dev/null && pnpm "$@"' \
  sh "$script" "$@"
