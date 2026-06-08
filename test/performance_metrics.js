'use strict';
/*jshint esversion: 6 */
var sinon = require('sinon');
goog.require('utils');
goog.require('Branch');
goog.require('branch_view');
goog.require('journeys_utils');

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

	it('returns null for every timing and duration when no phase was marked', function() {
		var metrics = new Branch().getPerformanceMetrics();
		TIMING_KEYS.forEach(function(k) {
			assert.strictEqual(metrics.timings[k], null, 'timings.' + k + ' is null');
		});
		DURATION_KEYS.forEach(function(k) {
			assert.strictEqual(metrics.durations[k], null, 'durations.' + k + ' is null');
		});
	});

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

	it('returns null banner timings when no banner was rendered', function() {
		utils.performanceTimings = { 'init_callback_fired': 500 };
		var m = new Branch().getPerformanceMetrics();
		assert.strictEqual(m.timings.banner_render_start, null, 'banner start null');
		assert.strictEqual(m.timings.banner_render_end, null, 'banner end null');
		assert.strictEqual(m.durations.banner_render_ms, null, 'banner duration null');
	});

	it('markPerformance records only the first value for a given name', function() {
		utils.markPerformance('v1_open_request_start');
		var first = utils.performanceTimings.v1_open_request_start;
		utils.markPerformance('v1_open_request_start');
		assert.strictEqual(utils.performanceTimings.v1_open_request_start, first, 'value not overwritten');
		assert.strictEqual(typeof first, 'number', 'value is a numeric performance.now() timestamp');
	});

	it('marks all init phases in well under 1ms total', function() {
		var names = TIMING_KEYS.slice();
		var start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
		names.forEach(function(n) { utils.markPerformance(n); });
		var elapsed = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - start;
		assert(elapsed < 1, 'marking ' + names.length + ' phases took ' + elapsed.toFixed(4) + 'ms (< 1ms)');
	});

	describe('getScriptResourceTiming', function() {
		var original;
		function stubEntries(entries) {
			original = window.performance.getEntriesByType;
			window.performance.getEntriesByType = function() { return entries; };
		}
		afterEach(function() {
			if (original) { window.performance.getEntriesByType = original; original = null; }
		});

		it('matches the Branch SDK script (script initiator + branch*.js filename) and returns its timing', function() {
			stubEntries([
				{ name: 'https://analytics.example.com/analytics.js', initiatorType: 'script', startTime: 1, responseEnd: 2 },
				{ name: 'https://cdn.branch.io/branch/loader.css', initiatorType: 'link', startTime: 3, responseEnd: 4 },
				{ name: 'https://api2.branch.io/v1/open', initiatorType: 'xmlhttprequest', startTime: 5, responseEnd: 6 },
				{ name: 'https://cdn.branch.io/branch-latest.min.js', initiatorType: 'script', startTime: 10, responseEnd: 25 }
			]);
			assert.deepEqual(utils.getScriptResourceTiming(), { start: 10, end: 25 }, 'returns the branch script start/end');
		});

		it('ignores a /branch/ directory segment and non-script resources (no false positive)', function() {
			stubEntries([
				{ name: 'https://cdn.branch.io/branch/loader.js', initiatorType: 'script', startTime: 3, responseEnd: 4 },
				{ name: 'https://x/app.js', initiatorType: 'script', startTime: 1, responseEnd: 2 },
				{ name: 'https://cdn.branch.io/branch-latest.min.js', initiatorType: 'xmlhttprequest', startTime: 7, responseEnd: 9 }
			]);
			assert.strictEqual(utils.getScriptResourceTiming(), null, 'no match -> null');
		});

		it('treats a cross-origin responseEnd of 0 as null (no misleading zero)', function() {
			stubEntries([
				{ name: 'https://cdn.branch.io/branch-latest.min.js', initiatorType: 'script', startTime: 12, responseEnd: 0 }
			]);
			assert.deepEqual(utils.getScriptResourceTiming(), { start: 12, end: null }, 'end null when responseEnd is 0');
		});
	});

	describe('banner render timings', function() {
		var fs = require('fs');
		var path = require('path');
		var bannerHtml = fs.readFileSync(path.join(__dirname, 'blob-banner.html'), 'utf8');
		var sb;

		beforeEach(function() {
			utils.performanceTimings = {};
			sb = sinon.createSandbox();
			// Minimal SDK state the render path reads.
			journeys_utils.branch = { _publishEvent: function() {}, _storage: { get: function() { return null; }, set: function() {} } };
			// Isolate from the journey-rendering internals; this test only asserts the perf marks.
			['finalHookups', 'addHtmlToIframe', 'addIframeOuterCSS', 'addIframeInnerCSS', 'addDynamicCtaText', 'animateBannerEntrance', 'getJsAndAddToParent'].forEach(function(fn) {
				if (typeof journeys_utils[fn] === 'function') { sb.stub(journeys_utils, fn); }
			});
		});
		afterEach(function() { sb.restore(); });

		it('marks banner_render_start when displayJourney runs and banner_render_end when the iframe loads', function() {
			var requestData = { has_app_websdk: false, callback_string: 'branch_view_callback__test' };
			branch_view.displayJourney(bannerHtml, requestData, '345', { id: '345' }, false, { type: 'desktop', variant: 'default' });
			assert(utils.performanceTimings.hasOwnProperty('banner_render_start'), 'banner_render_start marked when displayJourney runs');

			var iframe = document.getElementById('branch-banner-iframe');
			assert(iframe, 'banner iframe was created');
			// Fire the load handler deterministically; null it first so jsdom's own async
			// load event does not re-run the cleanup (which would throw NotFoundError).
			var onload = iframe.onload;
			iframe.onload = null;
			if (typeof onload === 'function') { onload.call(iframe); }
			assert(utils.performanceTimings.hasOwnProperty('banner_render_end'), 'banner_render_end marked after the iframe loads');
		});
	});
});
