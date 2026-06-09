# Web SDK delivery benchmark — npm import vs `<script>` tag

**Ticket:** EMT-3769 · **Relates to:** EMT-3753 (performance spike), EMT-3770 (init waterfall)

| | |
| --- | --- |
| **Run timestamp** | 2026-06-09T21:51:38Z |
| **Raw data (committed)** | [`examples/performance-benchmark/results/2026-06-09-baseline.json`](../examples/performance-benchmark/results/2026-06-09-baseline.json) |
| **Harness** | [`examples/performance-benchmark/`](../examples/performance-benchmark/README.md) (`npm run bench`) |
| **Iterations** | 20 per cell · cold (fresh context) + warm (19 reloads) · normal + Slow-4G |
| **SDK build measured** | `dist/build.min.js` — 77.4 KB raw / 23.6 KB gzip |
| **Environment** | single host, localhost-served assets, live Branch API. **Numbers are relative — do not quote absolute ms as production truth** (see Validity). |

## TL;DR — which method is faster, and by how much?

**Within run-to-run noise on this setup, neither.** With the npm SDK bundled inline (the recommended layout), the two delivery methods land on top of each other on every measured metric:

| Metric (cold, normal network) | `<script>` tag | npm import (inline) | Δ |
| ------------------------------ | -------------- | ------------------- | ------------------- |
| `branch.init()` callback (median) | 526.8 ms | 526.3 ms | ~0 ms |
| First Contentful Paint (median) | 24 ms | 20 ms | ~4 ms |
| SDK wire size (gzip) | 23.6 KB | 24.0 KB | 0.4 KB (script wins) |
| Warm (repeat-load) init | 0.5 ms | 0.5 ms | ~0 ms |
| Cache hit rate across reloads | 100% | 100% | tie |

Cold `init()` is set by the sequential `_r → v1/open → v1/pageview` API waterfall (~527 ms here; under Slow-4G the script-tag's full `total_init` stretches to **849 ms**), which is **identical regardless of delivery** and is the ~70% of real-world load time tracked separately in **EMT-3770**. Warm loads short-circuit in ~0.5 ms because the Branch session cache makes `init()` a no-op.

**Bottom line for the customer escalation:** the SDK-delivery phase (script vs bundle) is **not** the lever — optimizing it cannot move the ~859 ms the customer saw. The lever is the request waterfall (EMT-3770). Pick the integration method on developer-experience grounds (below). The one delivery-side pitfall worth stating: **bundle the SDK inline; do not lazy-load it as a separate chunk** (that adds a network round-trip — see §5).

> **Scope honesty:** this benchmark serves the SDK from localhost, so delivery-layer latency (CDN edge RTT, third-party DNS/TLS) is ~free here. That biases the result toward "no difference." The script tag's real-world structural *edge* (a shared-CDN file already cached from another site on a visitor's first visit; edge Brotli) and its structural *cost* (an extra third-party origin; blocked by strict CSP) are **not** captured. The "tie" is robust for the same-version, same-host comparison; it is not a claim that delivery never matters anywhere. See Validity.

## Methodology

Both methods exercise the **same locally-built SDK** (`dist/build.min.js`, via the `file:../..` dependency), isolating the *delivery mechanism* rather than two SDK versions. (The public CDN build predates `getPerformanceMetrics()` from EMT-3753; the harness's `?cdn=1` mode loads the real CDN for a load-only reading until that ships.) Driven by Playwright (Chromium), `npm run bench`.

- **20 iterations** per (method × profile × scenario); reported mean / median / p95 / max.
- **Cold** = a fresh browser context per iteration (empty HTTP cache *and* Branch session) — where delivery could matter, `n = 20`. **Warm** = one context, first load cold then 19 reloads — cache hit rate + repeat-visit path, `n = 19`.
- **Profiles:** `normal` and `throttled` (Slow 4G: ~1.6 Mbps down, 150 ms RTT) via CDP.
- The benchmark static server **gzips** assets (verified: encoded 24,203 B < decoded 79,255 B) and sends immutable `Cache-Control` on hashed chunks, so wire size and cache behaviour approximate a CDN — **gzip, not Brotli** (see Validity). The `npm run dev` server emulates the same immutable caching for the SDK, so the manual view matches; the cache-hit metric counts both 0-RTT hits and 304 revalidation.
- Per-iteration failures (flaky live-API loads) are skipped and counted, not fatal. This run: **0 failures** across all 160 loads.

## Results (full)

### 1. Bundle / transfer size (deterministic, stddev 0)

| Method | gzip (wire) | uncompressed | note |
| ------------------ | ----------- | ------------ | ----------------------------------------------------- |
| `<script>` tag | **23.6 KB** | 77.4 KB | the published `build.min.js` artifact |
| npm import (inline) | **24.0 KB** | 76.1 KB | SDK inlined into the entry chunk + ~1 KB page glue |

A tie. The SDK itself is ~23.6 KB gzip either way; the npm entry chunk is ~0.4 KB larger only because it also carries the page's own bootstrap. Closure-compiled UMD internals don't tree-shake, so npm gains nothing there.

### 2. Cold `branch.init()` callback (ms) — mean / median / p95 / max

| Method · profile | mean | median | p95 | max |
| ------------------------- | ----- | ------ | ----- | ------ |
| `<script>` tag · normal | 538.4 | 526.8 | 586.2 | 591.5 |
| npm import · normal | 539.2 | 526.3 | 586.1 | 670.8 |
| `<script>` tag · throttled | 569.3 | 550.6 | 630.7 | 737.1 |
| npm import · throttled | 579.1 | 549.0 | 807.4 | 831.4 |

Medians are within ~2 ms across methods at both network profiles — a genuine tie. `total_init_ms` (script load → init callback, **script-tag only**; npm has no script Resource Timing entry) was **561 ms normal / 849 ms throttled** (median), showing the network round-trips — not delivery — drive cold cost.

### 3. First Contentful Paint (ms, median) — render metric

| Method · profile | cold FCP | warm FCP |
| ------------------------- | -------- | -------- |
| `<script>` tag · normal | 24 | 12 |
| npm import · normal | 20 | 12 |
| `<script>` tag · throttled | 360 | 172 |
| npm import · throttled | 360 | 176 |

Tie within ~4 ms. Neither delivery method blocks first paint differently in this setup. (FCP was in the original AC; TTI was descoped — `init()` is async and does not block the main thread, so TTI ≈ FCP here.)

### 4. Warm init + cache

| Method · profile | warm init (median) | cache hit rate |
| ------------------------- | ------------------ | -------------- |
| `<script>` tag · normal | 0.5 ms | 100% (19/19) |
| npm import · normal | 0.5 ms | 100% (19/19) |
| `<script>` tag · throttled | 0.6 ms | 100% (19/19) |
| npm import · throttled | 0.7 ms | 100% (19/19) |

On repeat loads both cache the SDK asset and `init()` returns from the cached session in <1 ms. **Cache hit** here means the SDK body was *reused, not re-downloaded* — counting both a 0-RTT cache hit (`transferSize 0`) and a 304 revalidation (body from cache). Within-site hit is 100% by construction (immutable asset); the *cross-origin* first-visit edge that would favour the shared-CDN `<script>` is not measured (see Validity).

### 5. ⚠️ Code-split / lazy npm is the one real delivery pitfall

The headline npm arm uses a **static** `import branch from 'branch-sdk'`, bundled inline. If instead you **lazy-load** it — `const branch = await import('branch-sdk')` as its own chunk — the SDK becomes a separate request. Measured in an earlier run of this harness, that chunk's fetch+eval cost **~280 ms (median) on Slow 4G** versus ~13 ms when inlined. Reproduce by swapping the static import in `examples/performance-benchmark/npm-import/main.js` for `await import('branch-sdk')`.

**Guidance: bundle the SDK inline; don't put it behind a dynamic import** unless you deliberately want it off the critical path.

## Comparison metrics — side by side

| Dimension | `<script>` tag | npm import (inline) | Winner |
| ---------------------- | ------------------------ | -------------------------- | ----------------- |
| Cold init (median) | 527 ms | 526 ms | tie |
| Throttled cold init | 551 ms | 549 ms | tie |
| FCP (cold/normal) | 24 ms | 20 ms | tie |
| Wire size (gzip) | 23.6 KB | 24.0 KB | `<script>` (+0.4KB) |
| Warm init | 0.5 ms | 0.5 ms | tie |
| Cache hit (within-site) | 100% | 100% | tie |
| Parse measurable | yes (~14 ms) | no (inlined) | n/a |
| Cross-site first cache | possible (shared CDN) | never (per-app chunk) | `<script>` * |
| Works under strict CSP | often blocked | yes | npm |
| Build tooling required | none | bundler | depends |
| Lazy-load footgun | n/a | +280 ms if code-split | avoid |

\* not measured here — see Validity.

## Integration guidance

Performance is a wash, so choose on developer experience:

- **`<script>` tag** — zero build tooling, drop-in (CMS/landing pages), and the shared-CDN first-visit cache edge. Cost: an extra third-party origin; blocked by strict `script-src 'self'` CSP.
- **npm import** — you already have a bundler, want TypeScript types and `package.json` version pinning, or have a strict CSP. **Must** be bundled inline (§5), not lazy-loaded.

Either way, the performance win to chase is the `_r → v1/open → v1/pageview` waterfall (EMT-3770), which no delivery method affects.

## Reproduce

```bash
cd examples/performance-benchmark
npm install
npm run bench          # writes results/latest.json + prints a summary
# eyeball it instead:
npm run dev            # http://localhost:4317/landing.html
```

See [`examples/performance-benchmark/README.md`](../examples/performance-benchmark/README.md). The committed [`results/2026-06-09-baseline.json`](../examples/performance-benchmark/results/2026-06-09-baseline.json) is the dated record of the run tabulated above.

## Validity & threats

- **Relative, not absolute.** Single host, one live-API window, methods run sequentially (not interleaved). The absolute ms reflect this machine/network — quote the *comparison* (tie), not the numbers.
- **Localhost ≈ free delivery.** Assets served from localhost, so CDN edge RTT, third-party DNS/TLS, HTTP/2-vs-new-connection, and HTTP/3 are not modeled. This biases toward "no difference"; it removes the `<script>` tag's only structural network disadvantage.
- **gzip, not Brotli.** Real `cdn.branch.io` serves Brotli (~15–20% smaller on JS), so absolute wire bytes are an upper bound. The *relative* size tie holds (both gzip).
- **Cross-site cache unmeasured.** The shared-CDN first-visit advantage of the `<script>` tag is real but outside this within-site harness.
- **Same SDK version both sides.** Deliberate, to isolate delivery; the released CDN build lacks `getPerformanceMetrics()` until EMT-3753 ships.
- **Demo key.** Repo example key; no Journey configured, so banner-render timings are null (expected). If the key is later disabled, cold samples drop (skipped, counted) — re-run rather than trust a degraded result.
- **Valid as of** the `dist/build.min.js` measured on 2026-06-09. Re-run if the SDK size, CDN config, or HTTP version materially changes.
