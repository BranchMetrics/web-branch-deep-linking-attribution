// Pure aggregation helpers — no DOM, no Node APIs. Imported by both the browser
// harness and the Node runner so the numbers are computed identically on both
// paths. Output shape matches EMT-3753-artifacts/perf-results.json (n/mean/
// median/p95/max) plus min/stddev for completeness.

export function percentile(sortedAsc, p) {
	if (sortedAsc.length === 0) return null;
	if (sortedAsc.length === 1) return sortedAsc[0];
	const rank = Math.ceil((p / 100) * sortedAsc.length);
	const idx = Math.min(Math.max(rank - 1, 0), sortedAsc.length - 1);
	return sortedAsc[idx];
}

export function summarize(values) {
	const nums = values.filter((v) => typeof v === 'number' && isFinite(v));
	const n = nums.length;
	if (n === 0) return { n: 0, mean: null, median: null, p95: null, min: null, max: null, stddev: null };
	const sorted = [...nums].sort((a, b) => a - b);
	const sum = sorted.reduce((a, b) => a + b, 0);
	const mean = sum / n;
	const variance = sorted.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
	const round = (x) => (x === null ? null : Math.round(x * 10) / 10);
	return {
		n,
		mean: round(mean),
		median: round(percentile(sorted, 50)),
		p95: round(percentile(sorted, 95)),
		min: round(sorted[0]),
		max: round(sorted[n - 1]),
		stddev: round(Math.sqrt(variance))
	};
}

// Aggregate an array of flat sample objects into { metricKey: summary } for the
// numeric metrics, plus a derived cache_hit_rate over the reload series.
export function aggregateSamples(samples) {
	const metricKeys = [
		'init_callback_ms',
		'total_init_ms',
		'sdk_parse_ms',
		'fcp_ms',
		'sdk_transfer_bytes',
		'sdk_encoded_bytes',
		'sdk_decoded_bytes'
	];
	const agg = {};
	for (const key of metricKeys) {
		agg[key] = summarize(samples.map((s) => s[key]));
	}

	// Cache hit rate: the first load (reloadIndex 0) is always a cold miss, so it
	// is excluded from the denominator. A "hit" is a reload where the SDK asset
	// came from cache (transferSize === 0 but the body was still delivered).
	const reloads = samples.filter((s) => s.reloadIndex > 0);
	const hits = reloads.filter((s) => s.cached === true).length;
	agg.cache_hit_rate = {
		reloads_measured: reloads.length,
		hits,
		rate: reloads.length ? Math.round((hits / reloads.length) * 1000) / 1000 : null
	};

	return agg;
}
