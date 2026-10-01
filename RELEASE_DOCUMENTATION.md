# Branch Web SDK Build and Release Documentation

Building, testing, staging and releasing the Web SDK all run in GitHub Actions.

## Building locally

Requires Node 24 (the `flake.nix` dev shell provides it).

| Command | What it does |
|:--|:--|
| `npm run release` | Cleans `dist/` and builds it with Vite/Rolldown (`scripts/build.mjs`): `build.js` (readable), `build.min.js` (minified with Oxc) and `build.min.js.gz`. Fails if the gzipped bundle exceeds `size-budget.json`. |
| `npm test` | Unit tests (Vitest + jsdom) against `src/`. |
| `npm run test:min` | The same unit tests against `src/` modules minified with the production minifier. |
| `npm run test:bundle` | Checks the public contract of the built `dist/build.min.js`. Run `npm run release` first. |
| `npm run cover` | Unit tests with coverage. |
| `npm run format:check` / `npm run lint:src` | Biome formatting check, and undeclared/unused variable check across `src/`. |

## Versioning

The version is not bumped by hand. Both workflows compute the next version with `next-version` from [BranchMetrics/branch-github-actions](https://github.com/BranchMetrics/branch-github-actions): it starts from the latest GitHub release and looks at the first line of every commit since then.

- Any commit containing `[major]` → major bump.
- Otherwise, any commit containing `[minor]` → minor bump.
- Otherwise → patch bump (so `[patch]`, `[other]` and untagged commits all release as a patch).

`deployment/write-versions.sh` then writes that version into `package.json` and `src/0_config.js` before building, so the version in the repo is only a placeholder.

## On every push: Build and Push

`.github/workflows/build-push.yml` runs on every branch: format check, lint, unit tests (plain and minified), coverage, a release build and the bundle contract test.

On `main` it also deploys to staging (`deployment/deploy-qa.sh`):

- `s3://branch-builds-usw2/web-sdk/branch-latest.min.js` and `branch.js`
- `https://cdn.branch.io/branch-staging-latest.min.js` and `example-staging.html` (CloudFront is invalidated)

## Releasing: Publish Next Release (Manual)

Run the **Publish Next Release (Manual)** workflow (`.github/workflows/deploy-release.yml`) from the Actions tab against `main`. It:

1. Computes and writes the next version (see above).
2. Runs `deployment/release-s3.sh`, which rebuilds `dist/`, runs `test:bundle`, and uploads to the CDN:
   - `branch-v<version>.min.js`, `branch-latest.min.js` and `branch-latest.js`
   - `example.html`
   - then invalidates CloudFront for `branch-latest.min.js` and `example.html`
3. Publishes `branch-sdk` to npm.
4. Creates the GitHub release for the version.

Publishing the GitHub release triggers `.github/workflows/sync-readme-changelog.yml`, which prepends the release notes to the Web version history page on readme.com.

After a release, check that `https://cdn.branch.io/branch-v<version>.min.js` loads and that [npm](https://www.npmjs.com/package/branch-sdk) shows the new version.

## Documentation

Public integration docs live at [help.branch.io](https://help.branch.io/developers-hub/docs/web-sdk-overview). The JSDoc comments on the `branch.*` methods in `src/6_branch.js` are the in-code reference.
