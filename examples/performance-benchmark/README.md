# EMT-3769 — Web SDK delivery benchmark

> **Internal benchmarking tool — NOT a supported integration reference.** It lives under `examples/` for proximity to the SDK build it measures (`file:../..`); do not copy its embed wiring, demo key, or `?cdn=1` mode as a customer integration pattern. Excluded from the published npm package.

Benchmarks the two Branch Web SDK integration methods and feeds the verdict in [`docs/npm-vs-script-tag-performance.md`](../../docs/npm-vs-script-tag-performance.md):

| Method | How the SDK is delivered | Page |
| ------------- | -------------------------------------------------------------- | ----------------------------------- |
| `<script>` tag | classic `<script src=…>` (CDN) | `script-tag/test-script-tag.html` |
| npm import | **static** `import branch from 'branch-sdk'`, bundled **inline** | `npm-import/test-npm-import.html` |

The npm arm uses a static import so the SDK is inlined into the entry chunk (the recommended layout). The lazy/code-split variant (`await import('branch-sdk')`) costs an extra round-trip (~280 ms on Slow 4G) and is documented as a caveat in the report; reproduce it by swapping the static import in `npm-import/main.js`.

Both pages exercise the **same locally-built SDK** (`dist/build.min.js`, synced into `public/` by `copy-sdk.mjs`) so the comparison isolates the delivery mechanism rather than two different SDK versions. The released CDN build predates `getPerformanceMetrics()` (added in EMT-3753), so pointing the script tag at the public CDN (`?cdn=1`) gives a load-only reading without the metrics API — use the default local source for the full comparison.

## What it measures (per load, 20 iterations, mean / median / p95 / max)

- **`init_callback_ms`** — `branch.init()` call → callback. Comparable across both methods.
- **`total_init_ms`** — `getPerformanceMetrics().durations.total_init_ms` (script load → init callback). Null for npm by design (no script Resource Timing entry).
- **`fcp_ms`** — First Contentful Paint, from `performance.getEntriesByType('paint')`. Render-time metric across both methods.
- **`sdk_parse_ms`** — script parse (script-tag, from the metrics API). Null for the inline npm arm (SDK compiled into the entry chunk, not separately attributable).
- **`sdk_*_bytes`** — transfer / encoded (gzip wire) / decoded size of the SDK asset, from Resource Timing.
- **cache hit rate** — fraction of reloads where the SDK body was reused, not re-downloaded (0-RTT cache hit `transferSize === 0`, or a 304 revalidation).
- **bundle size** — authoritative gzip size from the build (`public/sdk-build-info.json` for the SDK; `dist/` chunk sizes for the npm bundle).

## Prerequisites

```bash
# 1. Build the SDK with Node 24 (Node 26 breaks the SDK build/tests).
cd ../..                 # repo root
mise exec node@24 -- make        # or: mise exec node@24 -- npm run build

# 2. Install the benchmark subproject deps.
cd examples/performance-benchmark
npm install
```

## How to test

### A. Manual (just a browser — best for eyeballing the waterfall)

```bash
npm run dev              # syncs the SDK, starts Vite on http://localhost:4317
```

Open <http://localhost:4317/landing.html>, then:

1. Open DevTools → Network → throttle to **Slow 4G** (optional but realistic).
2. Click **Run `<script>` tag test** or **Run npm import test** (each opens in its own tab).
3. The page reloads itself 20× and renders the aggregate table + raw JSON. Use **Re-run series** to repeat, or `?iterations=N&key=key_live_…` to tune.

The dev server serves the SDK with CDN-like immutable caching, so the manual cache-hit numbers match the automated run.

### B. Automated (Playwright — cold+warm cache, normal+throttled, CI-friendly)

```bash
npm run bench            # builds, serves, drives both pages headlessly
npm run bench:headed     # same but watch the browser
```

Writes `results/latest.json` (both methods × {normal, throttled} × {cold, warm}, with per-load samples + aggregates) and prints a summary table. Flags: `--iterations 20`, `--key key_live_…`, `--headed`.

> Network: `branch.init()` calls the live Branch API, so the init/total timings need network access. The size / parse / cache metrics work offline.

## Persisted results

`results/latest.json` is overwritten every run (git-ignored, transient). Dated snapshots — e.g. `results/2026-06-09-baseline.json` — are **committed** as the record behind the report's tables.

## Updating the report

Run option B, copy `results/latest.json` to a dated `results/YYYY-MM-DD-<label>.json`, then refresh the tables + verdict in [`docs/npm-vs-script-tag-performance.md`](../../docs/npm-vs-script-tag-performance.md) and update the run-timestamp header.
