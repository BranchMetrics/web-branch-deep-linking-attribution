# Branch Web SDK

The script customers embed on their pages (`branch-latest.min.js` on the CDN,
`branch-sdk` on npm). It runs on other people's sites, so bundle size, browser
support and layout shift are customer-facing.

What it does, all through the `branch` object (`src/6_branch.js`):

- Sessions and attribution: `init`, `data`, `first`, `setIdentity`,
  `logout`, `lastAttributedTouchData`, `crossPlatformIds`
- Links: `link` (create deep links), `qrCode`, `referringLink`
- Deepviews: `deepview` turns the page into a preview of app content, and
  `deepviewCta` opens the app from it
- Events: `track`, `logEvent`, `trackCommerceEvent`
- Journeys banners: shown from `/v1/pageview`, plus `banner`, `closeBanner`,
  `closeJourney`, `setBranchViewData`
- Privacy and config: `disableTracking`, `setDMAParamsForEEA`,
  `setRequestMetaData`, `setAPIUrl`

## Adding a public method: update the snippet

Customers load the SDK with the async snippet in the README, so their code
usually calls `branch` before `build.min.js` has arrived. The snippet makes
that work by creating a stand-in `branch` whose methods only queue calls; the
SDK replays the queue once it loads. It only creates stand-ins for the method
names in its hard-coded list (`"addListener banner closeBanner ...".split(" ")`).

For example, if a new `branch.getFoo()` were added without adding `getFoo` to
that list:

```js
// customer page, right after the snippet; SDK still loading
branch.init('key_live_...'); // in the list: queued, runs once the SDK loads
branch.getFoo();             // not in the list: TypeError, branch.getFoo is not a function
```

The list is copied in three places: the README snippet, `src/onpage.js` and
`examples/example.template.html`. Add a new public method to all three;
`pnpm test:bundle` fails if any of them doesn't match the SDK's public methods.
Customers who already pasted the old snippet won't get the new name, so
document that they can only call it after the SDK has loaded (e.g. in the
`init` callback).

## Commands

```
pnpm install                # Node 24 + pnpm; `nix develop` / direnv provides both
pnpm build                  # dist/build.js, build.min.js, build.min.js.gz
pnpm test                   # Vitest unit tests (jsdom) against src/
pnpm test:min               # same tests against Oxc-minified src/ modules
pnpm test:bundle            # contract tests on dist/build.min.js (build first)
pnpm format && pnpm lint    # Biome
pnpm perf                   # CLS suite, see below
```

## Build and browser target

- Entry is `src/7_initialization.js`; the numbered prefixes in `src/` roughly
  follow dependency order (config, utils, storage/session, api, banner,
  branch, init).
- Output is an ES2015, non-strict IIFE (`scripts/build.mjs`). Newer syntax
  such as `?.` is lowered by the build, but built-in APIs are not polyfilled:
  don't use ones newer than ES2015 (e.g. `Object.hasOwn`, `Array.prototype.at`).
  The one exception is `Array.prototype.includes`, polyfilled in
  `src/0_polyfills.js`.
- The build fails if `build.min.js.gz` exceeds `size-budget.json`
  (28000 bytes). PRs report before/after sizes in the template's JS Budget
  table.
- Minifier bugs are a real risk: run `pnpm test:min` and `pnpm test:bundle`
  after anything that changes how code is structured, not just what it does.

## Lint and hooks

- lefthook: pre-commit formats and lints staged files, pre-push runs
  `biome check` on the whole repo.
- Don't run `biome check --write`: its "safe" lint fixes include ES2022 APIs
  that break the ES2015 target. `pnpm format` only formats.

## Banners (Journeys)

- `/v1/pageview` decides whether a banner shows and which renderer draws it:
  `use_v2_renderer` selects v2 over the legacy renderer (`branch_view.js`,
  `journeys_utils.js`). Both are in production, so check both when changing
  banner code.
- A new render path is in the works.

## CLS suite (`test/perf/`)

Measures the layout shift the SDK and its banners cause, for legacy and v2
banners on phone and desktop, and fails when a change moves it. Details in
`test/perf/README.md`; current numbers and what they mean in
`test/perf/BASELINE.md`.

- Run `pnpm perf` after any change to banner rendering, animation or
  insertion (`journeys_utils.js`, `branch_view.js`, `3_banner_utils.js`,
  `4_banner_*.js`, `5_banner.js`). CI runs it on every push, and the staging
  deploy waits for it.
- A failure means CLS changed. If the change is intended, run
  `pnpm perf:docker` (CI's image) and update `expected` in
  `test/perf/config.mjs` and the tables in `BASELINE.md` together. Don't widen
  tolerances to make a regression pass.
- Runs replay recorded stage responses from `test/perf/fixtures/`; any
  unrecorded request fails. Re-record with `pnpm perf:record` (needs VPN and
  the gitignored `banners.local.json`) when a stage banner changes or the SDK
  starts making new requests.

## Secrets

This repo is public. Branch keys, banner/view ids and stage hostnames go only
in gitignored local config (e.g. `test/perf/banners.local.json`) or env, never
in commits, fixtures or PR text. The perf recorder scrubs fixtures and refuses
to write one if a real value survives.

## Commits and PRs

Titles: `[patch|minor|other] TICKET: summary`, e.g.
`[patch] NO-TICKET: fix exponential backtracking in isValidURL regex`. Use
`NO-TICKET` when there's no Jira ticket. Fill in `.github/pull_request_template.md`.
