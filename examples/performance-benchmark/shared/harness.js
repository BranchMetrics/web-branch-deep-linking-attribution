// Browser-side measurement harness shared by both test pages. One "load" =
// one branch.init() lifecycle measured end to end. The page can run in two
// drivers, selected by the `?auto=` query param:
//
//   ?auto=1  (manual path)  — the page self-reloads `iterations` times using
//                             sessionStorage to accumulate samples, then renders
//                             the aggregate table. Just open it in a browser.
//   ?auto=0  (runner path)  — the page measures exactly one load and parks the
//                             sample on window.__BENCH_SAMPLE__. The Playwright
//                             runner controls reloads, throttling and cache.
//
// Per-load metrics:
//   init_callback_ms  — performance.now() from the branch.init() call to its
//                       callback firing. Comparable across BOTH methods.
//   total_init_ms     — getPerformanceMetrics().durations.total_init_ms when the
//                       build exposes it (script-load -> init callback). Null for
//                       the npm path (no script Resource Timing entry, by design).
//   sdk_parse_ms      — script parse for the <script> path (from gPM); module
//                       eval time for the npm path (passed in by the page).
//   sdk_*_bytes       — Resource Timing transfer/encoded/decoded size of the SDK
//                       asset. `cached` is true when the body was served from
//                       cache (transferSize 0, decodedBodySize > 0).

import { aggregateSamples } from './stats.js';

// Namespaced per page so navigating between the two test pages in the SAME tab
// can't append one method's samples onto the other's in-progress series.
const SS_KEY = 'emt3769_samples_' + (typeof location !== 'undefined' ? location.pathname : 'default');

export function qp(name, fallback) {
	const v = new URLSearchParams(location.search).get(name);
	return v === null ? fallback : v;
}

function initBranchAsync(branch, key) {
	return new Promise((resolve) => {
		const tStart = performance.now();
		let settled = false;
		let safety = null;
		const done = (err, data) => {
			if (settled) return;
			settled = true;
			if (safety) clearTimeout(safety);
			resolve({ err, data, tStart, tCallback: performance.now() });
		};
		// Arm the safety timeout BEFORE init() so a synchronous callback can clear
		// it (otherwise a sync `done()` runs while `safety` is still null, leaving a
		// dangling 15s timer). Never hangs the series if a callback is dropped.
		safety = setTimeout(() => done(new Error('init timeout'), null), 15000);
		try {
			branch.init(key, done);
		} catch (e) {
			done(e, null);
		}
	});
}

function sdkResourceTiming(match, fallbackLargestScript) {
	const all = performance.getEntriesByType ? performance.getEntriesByType('resource') : [];
	let entries = all.filter((e) => e.name.indexOf(match) !== -1);
	// npm path: the SDK is inlined into a hashed app chunk (build) or a Vite dep
	// (dev), so a name match can miss. Fall back to the largest same-origin
	// script resource — that is the chunk carrying the bundled SDK.
	if (!entries.length && fallbackLargestScript) {
		const scripts = all.filter(
			(e) => e.initiatorType === 'script' && e.name.indexOf(location.origin) === 0 && (e.decodedBodySize || 0) > 0
		);
		scripts.sort((a, b) => (b.decodedBodySize || 0) - (a.decodedBodySize || 0));
		entries = scripts.slice(0, 1);
	}
	if (!entries.length) return null;
	const e = entries[entries.length - 1];
	const transfer = typeof e.transferSize === 'number' ? e.transferSize : null;
	const encoded = typeof e.encodedBodySize === 'number' ? e.encodedBodySize : null;
	const decoded = typeof e.decodedBodySize === 'number' ? e.decodedBodySize : null;
	const status = typeof e.responseStatus === 'number' ? e.responseStatus : null;
	// "Cached" = the response BODY was reused, not re-downloaded. Two shapes:
	//   • full cache hit (immutable / disk): no request, transferSize === 0
	//   • 304 revalidation (no-cache): a conditional request returns 304, body from
	//     cache. Chrome reports transferSize ≈ header bytes and encodedBodySize 0
	//     here, so size comparisons fail — responseStatus (Resource Timing L2) is
	//     the reliable signal. Fallback (older engines, no responseStatus): a body
	//     smaller than its own encoded size means it wasn't fully transferred.
	const cached =
		status === 304 ||
		(transfer === 0 && (decoded > 0 || (encoded || 0) > 0)) ||
		(status === null && encoded > 0 && transfer !== null && transfer < encoded);
	return { transferSize: transfer, encodedBodySize: encoded, decodedBodySize: decoded, responseStatus: status, cached };
}

// Run a single measured load. `opts`:
//   branch        — the SDK instance (window.branch or imported module)
//   key           — Branch key
//   method        — 'script-tag' | 'npm-import'
//   sdkAssetMatch — substring identifying the SDK asset in Resource Timing
//   moduleEvalMs  — (npm path only) measured import()/eval time, used as parse
//   settleMs      — wait after init callback for pageview/banner to finish
export async function measureLoad(opts) {
	const { branch, key, method, sdkAssetMatch, moduleEvalMs = null, settleMs = 1200, fallbackLargestScript = false } = opts;
	const init = await initBranchAsync(branch, key);
	await new Promise((r) => setTimeout(r, settleMs));

	let gpm = null;
	if (branch && typeof branch.getPerformanceMetrics === 'function') {
		try {
			gpm = branch.getPerformanceMetrics();
		} catch (e) {
			gpm = null;
		}
	}

	const res = sdkResourceTiming(sdkAssetMatch, fallbackLargestScript);
	const durations = (gpm && gpm.durations) || {};

	// First Contentful Paint — render-time metric (was in the original AC). Reflects
	// how each delivery method affects when the page first paints content.
	const paint = performance.getEntriesByType ? performance.getEntriesByType('paint') : [];
	const fcpEntry = paint.filter((e) => e.name === 'first-contentful-paint')[0];

	// sdk_parse_ms: script parse for the <script> path (from gPM); module-eval time
	// for the lazy npm path (passed in). Null for the inline-bundled npm path — the
	// SDK is compiled as part of the entry chunk and is not separately attributable.
	const parseMs = moduleEvalMs !== null ? round(moduleEvalMs) : numOrNull(durations.sdk_parse_ms);

	const sample = {
		method,
		ts: Date.now(),
		reloadIndex: readReloadIndex(),
		init_error: init.err ? String(init.err && init.err.message ? init.err.message : init.err) : null,
		init_callback_ms: round(init.tCallback - init.tStart),
		total_init_ms: numOrNull(durations.total_init_ms),
		sdk_parse_ms: parseMs,
		fcp_ms: fcpEntry ? round(fcpEntry.startTime) : null,
		sdk_transfer_bytes: res ? res.transferSize : null,
		sdk_encoded_bytes: res ? res.encodedBodySize : null,
		sdk_decoded_bytes: res ? res.decodedBodySize : null,
		cached: res ? res.cached : null,
		performance_supported: gpm ? gpm.performance_supported : null
	};
	return sample;
}

function numOrNull(v) {
	return typeof v === 'number' && isFinite(v) ? round(v) : null;
}
function round(v) {
	return v === null || v === undefined ? null : Math.round(v * 10) / 10;
}

// ---- reload-series state (manual ?auto=1 path) -------------------------------

function readState() {
	try {
		return JSON.parse(sessionStorage.getItem(SS_KEY)) || null;
	} catch (e) {
		return null;
	}
}
function writeState(s) {
	sessionStorage.setItem(SS_KEY, JSON.stringify(s));
}
function readReloadIndex() {
	const s = readState();
	return s ? s.samples.length : 0;
}

// Manual driver: keep reloading until `iterations` samples collected, then call
// onDone(samples, agg). Returns true if the series is still running (i.e. the
// page is about to reload and the caller should stop).
export async function runSeries(measureFn, iterations, onProgress, onDone) {
	let state = readState();
	if (!state || state.iterations !== iterations) {
		state = { iterations, samples: [] };
		writeState(state);
	}

	const sample = await measureFn();
	state.samples.push(sample);
	writeState(state);

	if (onProgress) onProgress(state.samples.length, iterations, sample);

	if (state.samples.length < iterations) {
		setTimeout(() => location.reload(), 250);
		return true;
	}

	const agg = aggregateSamples(state.samples);
	sessionStorage.removeItem(SS_KEY);
	if (onDone) onDone(state.samples, agg);
	return false;
}

export function resetSeries() {
	sessionStorage.removeItem(SS_KEY);
}

// ---- rendering ---------------------------------------------------------------

export function renderResult(rootEl, title, samples, agg, extra) {
	// Titles/labels may contain literal angle brackets (e.g. "<script> tag"), which
	// would corrupt the table when injected via innerHTML — escape them.
	const esc = (s) =>
		String(s == null ? '' : s).replace(
			/[&<>"]/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
		);
	const fmt = (v, unit) => (v === null || v === undefined ? '<span class="null">null</span>' : v + (unit || ''));
	const rows = (obj, keys, unit) =>
		keys
			.map((k) => {
				const s = obj[k] || {};
				return `<tr><td class="k">${k}</td><td>${fmt(s.mean, unit)}</td><td>${fmt(s.median, unit)}</td><td>${fmt(
					s.p95,
					unit
				)}</td><td>${fmt(s.max, unit)}</td><td>${fmt(s.n)}</td></tr>`;
			})
			.join('');

	const timing = rows(agg, ['init_callback_ms', 'total_init_ms', 'sdk_parse_ms', 'fcp_ms'], ' ms');
	const size = rows(agg, ['sdk_transfer_bytes', 'sdk_encoded_bytes', 'sdk_decoded_bytes'], ' B');
	const chr = agg.cache_hit_rate || {};

	rootEl.innerHTML = `
    <h2>${esc(title)}</h2>
    <p class="meta">${samples.length} loads · ${esc(extra || '')}</p>
    <table>
      <tr><th class="k">metric</th><th>mean</th><th>median</th><th>p95</th><th>max</th><th>n</th></tr>
      ${timing}${size}
    </table>
    <p class="chr">Cache hit rate across reloads: <b>${
		chr.rate === null || chr.rate === undefined ? 'n/a' : Math.round(chr.rate * 100) + '%'
	}</b> (${chr.hits || 0}/${chr.reloads_measured || 0} reloads cached)</p>
    <details><summary>Raw samples + aggregate (JSON)</summary><pre>${JSON.stringify(
		{ aggregate: agg, samples },
		null,
		2
	)}</pre></details>`;

	// Expose for the Playwright runner / copy-paste.
	window.__BENCH_RESULT__ = { title, samples, aggregate: agg };
}
