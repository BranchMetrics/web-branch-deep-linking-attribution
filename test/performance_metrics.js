'use strict';
/*jshint esversion: 6 */
goog.require('utils');
goog.require('Branch');

// Covers EMT-3753 Deliverable 1 — branch.getPerformanceMetrics().
// These tests exercise the pure assembly/null-safety logic by seeding
// utils.performanceTimings directly, so they do not need a full init round-trip.
describe('getPerformanceMetrics', function() {
	var assert = testUtils.unplanned();

	var TIMING_KEYS = [
		'sdk_script_load_start', 'sdk_script_load_end', 'sdk_parse_end',
		'_r_request_start', '_r_response_received',
		'v1_open_request_start', 'v1_open_response_received',
		'v1_pageview_request_start', 'v1_pageview_response_received',
		'banner_render_start', 'banner_render_end', 'init_callback_fired'
	];
	var DURATION_KEYS = [
		'sdk_script_download_ms', 'sdk_parse_ms',
		'_r_roundtrip_ms', 'v1_open_roundtrip_ms', 'v1_pageview_roundtrip_ms',
		'banner_render_ms', 'total_init_ms'
	];

	beforeEach(function() {
		// Reset the module-global collector between tests.
		utils.performanceTimings = {};
	});

	// FR-001: contract shape
	it('returns the { performance_supported, timings, durations } contract with every key present', function() {
		var metrics = new Branch().getPerformanceMetrics();
		assert.deepEqual(Object.keys(metrics).sort(), ['durations', 'performance_supported', 'timings'], 'top-level keys');
		assert.strictEqual(typeof metrics.performance_supported, 'boolean', 'performance_supported is a boolean');
		TIMING_KEYS.forEach(function(k) {
			assert(metrics.timings.hasOwnProperty(k), 'timings.' + k + ' present');
		});
		DURATION_KEYS.forEach(function(k) {
			assert(metrics.durations.hasOwnProperty(k), 'durations.' + k + ' present');
		});
	});

	// FR-006: null-safety when nothing was marked
	it('returns null for every timing and duration when no phase was marked', function() {
		var metrics = new Branch().getPerformanceMetrics();
		TIMING_KEYS.forEach(function(k) {
			assert.strictEqual(metrics.timings[k], null, 'timings.' + k + ' is null');
		});
		DURATION_KEYS.forEach(function(k) {
			assert.strictEqual(metrics.durations[k], null, 'durations.' + k + ' is null');
		});
	});

	// FR-002 + contract math: durations computed as differences
	it('computes durations from seeded timestamps', function() {
		utils.performanceTimings = {
			'sdk_parse_end': 250,
			'_r_request_start': 300,
			'_r_response_received': 1100,
			'v1_open_request_start': 1110,
			'v1_open_response_received': 1800,
			'v1_pageview_request_start': 1810,
			'v1_pageview_response_received': 2200,
			'init_callback_fired': 1800
		};
		var d = new Branch().getPerformanceMetrics().durations;
		assert.strictEqual(d._r_roundtrip_ms, 800, '_r roundtrip');
		assert.strictEqual(d.v1_open_roundtrip_ms, 690, 'open roundtrip');
		assert.strictEqual(d.v1_pageview_roundtrip_ms, 390, 'pageview roundtrip');
	});

	// FR-004: /_r skipped (Safari 11+) yields null _r timings, others populated
	it('keeps _r timings null when /_r is skipped but reports the other phases', function() {
		utils.performanceTimings = {
			'v1_open_request_start': 100,
			'v1_open_response_received': 700
		};
		var m = new Branch().getPerformanceMetrics();
		assert.strictEqual(m.timings._r_request_start, null, '_r start null');
		assert.strictEqual(m.timings._r_response_received, null, '_r received null');
		assert.strictEqual(m.durations._r_roundtrip_ms, null, '_r roundtrip null');
		assert.strictEqual(m.durations.v1_open_roundtrip_ms, 600, 'open roundtrip computed');
	});

	// FR-005: absent banner yields null banner timings
	it('returns null banner timings when no banner was rendered', function() {
		utils.performanceTimings = { 'init_callback_fired': 500 };
		var m = new Branch().getPerformanceMetrics();
		assert.strictEqual(m.timings.banner_render_start, null, 'banner start null');
		assert.strictEqual(m.timings.banner_render_end, null, 'banner end null');
		assert.strictEqual(m.durations.banner_render_ms, null, 'banner duration null');
	});

	// EDGE-07: markPerformance is first-write-wins
	it('markPerformance records only the first value for a given name', function() {
		utils.markPerformance('v1_open_request_start');
		var first = utils.performanceTimings.v1_open_request_start;
		utils.markPerformance('v1_open_request_start');
		assert.strictEqual(utils.performanceTimings.v1_open_request_start, first, 'value not overwritten');
		assert.strictEqual(typeof first, 'number', 'value is a numeric performance.now() timestamp');
	});

	// NFR-PERF-001: instrumentation overhead < 1ms for the full set of marks
	it('marks all init phases in well under 1ms total', function() {
		var names = TIMING_KEYS.slice();
		var start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
		names.forEach(function(n) { utils.markPerformance(n); });
		var elapsed = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - start;
		assert(elapsed < 1, 'marking ' + names.length + ' phases took ' + elapsed.toFixed(4) + 'ms (< 1ms)');
	});
});
