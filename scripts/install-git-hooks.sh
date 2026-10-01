#!/bin/sh
# Runs on `npm install` (package.json "prepare"). Installs the git hooks declared in lefthook.yml.

# No hooks in CI (matches the lefthook postinstall).
case "$CI" in "" | 0 | false) ;; *) exit 0 ;; esac

if [ "$(git config --get core.hooksPath 2>/dev/null)" = ".husky/_" ]; then
  git config --unset core.hooksPath
fi

# Tolerate missing lefthook or git (e.g. production installs without devDependencies).
lefthook install || exit 0
