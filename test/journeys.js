'use strict';

goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');
goog.require('session');
goog.require('branch_view');
goog.require('banner_utils');

goog.require('goog.json'); // jshint unused:false

/* globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Branch', function() {
	const storage = new BranchStorage([ 'pojo' ]);
	let sandbox;
	let requests;

	window.sdk_version = 'web' + config.version;

	beforeEach(function() {
		testUtils.go('');
		sandbox = sinon.sandbox.create();
		localStorage.clear();
		sessionStorage.clear();
		requests = [];
	});

	function initBranch(runInit, keepStorage) {
		[ document.getElementById('branch-banner-iframe'), document.getElementById('branch-banner') ].forEach(function(el) {
			el && el.parentNode && el.parentNode.removeChild(el);
		});

		if (!keepStorage) {
			storage.clear();
		}

		sandbox.stub(utils, 'mobileUserAgent', function() {
			return 'ios';
		});

		const branch = new Branch();

		sandbox.stub(branch._server, 'request', function(resource, obj, storage, callback) {
			requests.push({
				resource: resource,
				obj: obj,
				callback: callback
			});
		});

		if (runInit) {
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);
			requests[2].callback(null, {});
			requests = [];
		}

		return branch;
	}

	afterEach(function() {
		sandbox.restore();
	});

	describe('journeys', function() {
		it('should attempt to pass deeplink data in a banner call', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(3, done);

			const bannerDeeplinkData = {
				tags: [ 'custom' ],
				data: {
					'mydata': 'From Banner',
					'foo': 'bar',
					'$deeplink_path': 'open/item/5678'
				}
			};

			branch.init(branch_sample_key);
			branch.banner(
				{
					immediate: true,
					disableHide: true,
					forgetHide: true
				},
				bannerDeeplinkData
			);

			// _r
			requests[0].callback(null, browser_fingerprint_id);

			// v1/open
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);

			// v1/event
			requests[2].callback(null, {
				branch_view_enabled: false
			});

			// v1/deepview
			requests[3].callback(null, {
				branch_view_enabled: false
			});

			assert.strictEqual(requests[3].resource.endpoint, '/v1/deepview', 'calling deepview');
			assert.strictEqual(JSON.parse(requests[3].obj.data)['mydata'], 'From Banner', 'deep link data was passed by banner');

			assert.strictEqual(requests.length, 4, '4 requests made');
		});

		it('should attempt to pass deeplink data to a journey in a page view event', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(4, done);

			const bannerDeeplinkData = {
				tags: [ 'custom' ],
				data: {
					'mydata': 'From Banner',
					'foo': 'bar',
					'$deeplink_path': 'open/item/5678'
				}
			};

			sandbox.stub(branch_view, 'handleBranchViewData', function(server, branchViewData, data) {
				assert.isDefined(data, 'user data has been defined');
				assert.strictEqual(true, banner_utils.shouldAppend(storage, {
					forgetHide: true,
					showiOS: true
				}), 'branch view should be displayable');
				assert.strictEqual(data.data.mydata, 'From Banner', 'deep link data was passed by banner');
			});

			branch.init(branch_sample_key);
			branch.banner(
				{
					immediate: true,
					disableHide: true,
					forgetHide: true
				},
				bannerDeeplinkData
			);

			// _r
			requests[0].callback(null, browser_fingerprint_id);

			// v1/open
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);

			// v1/event (first time)
			setTimeout(function() {
				requests[2].callback(null, {
					branch_view_enabled: true,
					branch_view_data: {
						id: '345',
						number_of_use: 1000,
						// url: 'https://api.branch.io/v1/branchview/key_live_feebgAAhbH9Tv85H5wLQhpdaefiZv5Dv/279760304565736467?v=1'
						url: 'http://localhost:8000'
					}
				});

				// v1/event (second time)
				requests[3].callback(null, {
					branch_view_enabled: true
				});

				assert.strictEqual(requests.length, 4, '4 requests made');
			}, 10);
		});

		it('should attempt to pass deeplink data to a journey in a custom event', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(4, done);

			const bannerDeeplinkData = {
				tags: [ 'custom' ],
				data: {
					'mydata': 'From Banner',
					'foo': 'bar',
					'$deeplink_path': 'open/item/5678'
				}
			};

			sandbox.stub(branch_view, 'handleBranchViewData', function(server, branchViewData, data) {
				assert.isDefined(data, 'user data has been defined');
				assert.strictEqual(false, banner_utils.shouldAppend(storage, {
					forgetHide: true,
					showiOS: true
				}), 'branch view should not be displayable');
				assert.strictEqual(data.data.mydata, 'From Banner', 'deep link data was passed by banner');
			});

			branch.init(branch_sample_key);
			branch.banner(
				{
					immediate: true,
					disableHide: true,
					forgetHide: true
				},
				bannerDeeplinkData
			);

			// _r
			requests[0].callback(null, browser_fingerprint_id);

			// v1/open
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);

			// v1/event (first time)
			requests[2].callback(null, {
				branch_view_enabled: true
			});

			setTimeout(function() {
				// v1/event (second time)
				requests[3].callback(null, {
					branch_view_enabled: true,
					branch_view_data: {
						id: '345',
						number_of_use: 1000,
						// url: 'https://api.branch.io/v1/branchview/key_live_feebgAAhbH9Tv85H5wLQhpdaefiZv5Dv/279760304565736467?v=1'
						url: 'http://localhost:8000'
					}
				});

				assert.strictEqual(requests.length, 4, '4 requests made');
			}, 10);
		});

		it('should attempt to pass deeplink data in a banner call from init callback', function(done) {
			// An existing user with a branch.banner() call during the callback passed into branch.init(),
			// where a Journey view would be shown. In this case, the data most recently passed to
			// branch.banner() and stored in the data cache would be sent through to the /v1/branchview
			// call. It would be combined on the server with data set in the Dashboard.
			const branch = initBranch(false);
			const assert = testUtils.plan(4, done);

			const bannerDeeplinkData = {
				tags: [ 'custom' ],
				data: {
					'mydata': 'From Banner',
					'foo': 'bar',
					'$deeplink_path': 'open/item/5678'
				}
			};

			sandbox.stub(branch_view, 'handleBranchViewData', function(server, branchViewData, data) {
				assert.isDefined(data, 'user data has been defined');
				assert.strictEqual(true, banner_utils.shouldAppend(storage, {
					forgetHide: true,
					showiOS: true
				}), 'branch view should be displayable');
				assert.strictEqual(data.data.mydata, 'From Banner', 'deep link data was passed by banner');
			});

			branch.init(branch_sample_key, {}, function onInit(errorMessage, branchData) {
				branch.banner(
					{
						immediate: true,
						disableHide: true,
						forgetHide: true
					},
					bannerDeeplinkData
				);
			});


			// _r
			requests[0].callback(null, browser_fingerprint_id);

			// v1/open
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);

			// v1/event (first time)
			setTimeout(function() {
				requests[2].callback(null, {
					branch_view_enabled: true,
					branch_view_data: {
						id: '345',
						number_of_use: 1000,
						url: 'http://localhost:8000'
					}
				});

				assert.strictEqual(requests.length, 4, '4 requests made');
			}, 10);
		});
	});
});

