# SDK CLS suite

Measures the Cumulative Layout Shift the Branch Web SDK and its banners cause
on a customer page, and fails when a change moves it.

```
pnpm exec playwright install chromium   # once, after pnpm install
pnpm perf                               # build, then measure every scenario
pnpm perf:baseline                      # each scenario 10 times, prints the CLS range measured
pnpm perf:record                        # refresh fixtures/ (needs VPN + banners.local.json)
pnpm perf:docker [script] [flags]       # any of the above in CI's image (default perf:baseline)
```

All are Playwright Test runs (`playwright.config.mjs`, one project per
device), so the usual flags work: `pnpm perf -g "v2 full page" --project mobile`.
`perf` and `perf:baseline` run in two phases (`run.mjs`): everything in
parallel, then the `serial` banners one at a time. Flags apply to both.

- `config.mjs`: devices, banners and their expected CLS
- `fixtures.mjs`: the `branch` fixture that loads the page with the SDK,
  replays a banner, closes it and reads back layout shifts
- `cls.spec.mjs`: the CLS checks; `baseline-reporter.mjs`: the summary
  `perf:baseline` prints; `summary-reporter.mjs`: the table CI adds to the
  job summary; `record.spec.mjs`: recording from stage,
  only picked up when `PERF_RECORD` is set (as `perf:record` does), so a
  plain `playwright test` never rewrites fixtures mid-run

## What it measures

A synthetic article page (`hosts/article.html`) loads the SDK with the standard
async snippet, on a phone (Pixel 7, 412x839) and a desktop (1280x800). For each banner
the run waits for it to show, taps its close button, and reports CLS as Chrome
counts it (shifts after the close tap included), plus the element that shifted.
After each step it waits until the page has gone 1s without a layout shift, so
animations are measured to the end.

There are eight banners, one per renderer (`legacy` / `v2`) for each kind of
banner a device gets. Phones: `standard top` (pushes content down) and `full
page` (locks scrolling). Desktop has neither, so it gets `desktop center` (a
modal) and `desktop corner` instead. Each runs only on its own device, and the
test checks the banner sits where its name says (`position` in `config.mjs`),
so a recording of the wrong kind of banner fails instead of measuring the
wrong thing. Each runs on two variants of the page (`PAGES` in
`config.mjs`): at the top, and scrolled 400px. A ninth check loads the SDK
with no banner on both and expects zero CLS.

Expected values live in `config.mjs`; `BASELINE.md` explains what they are
and what they mean. Most tests measure the same CLS on every load and on both
macOS and CI's Linux image, so they fail when it drifts by more than 2% (at
least 0.003) in either direction; an expected 0 must measure exactly 0. The
legacy phone banners animate with CSS transitions whose CLS depends on which
frames get painted, and so on machine load. They run one at a time once
everything else is done (`serial` in `config.mjs`), load the page three times
and check the median, 10% (at least 0.01) either side. There are no retries, so
a change that adds a shift only some of the time fails rather than passing as
flaky.

Every banner test also expects zero CLS after the close tap. CLS only keeps
the worst burst of shifts, so a shift after closing that is no bigger than
the entrance would otherwise leave the number unchanged.

If a change is intended, better or worse, run `pnpm perf:docker` (the
baseline in CI's image) and update `config.mjs` and `BASELINE.md`.

## CI

The `CLS suite` job (`.github/workflows/build-push.yml`) runs in the
Playwright image for the pinned `@playwright/test` version, the same one
`pnpm perf:docker` uses. It gets no secrets and only read access to the repo.
The first phase blocks, and the test, build and staging deploy job waits for
it (`needs: perf`); the legacy phone phase is non-blocking until CI has shown
it stays inside its range. Each phase's CLS and expected range go to the
job summary. Bumping Playwright means a new image tag in the workflow and a
fresh baseline.

## Fixtures

Runs replay recorded stage responses from `fixtures/`, so they need no VPN or
keys; any request without a recording fails the run.

`perf:record` needs VPN and `banners.local.json` (gitignored; copy
`banners.example.json`). Keys, banner ids, app/session ids, link domains, IPs
and the recording API host are replaced with dummies in API responses and text
assets (CSS, SVG, JS), and a fixture is not written if any real value survives
in them. Images are kept as recorded. Review `git diff fixtures/` and the
expected values afterwards.

## Emulation quirks

- Chrome's `isMobile` emulation flags every layout shift as user input, so
  CLS reads 0; phones are emulated without it (`config.mjs`).
- Layout-shift entries only exist in Chromium, so every project runs Chromium.
- Recording turns off Chrome's Local Network Access checks: on VPN some
  stage template images resolve to private addresses (`record.spec.mjs`).
- Shifts within 500ms of real input don't count toward CLS, so phones `tap()`
  and desktops `click()` the close button, like a user would.
