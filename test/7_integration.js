'use strict';

goog.require('config');
goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, branch */
/*globals device_fingerprint_id */

describe('Integration tests', function() {
	var requests = [ ];
	var xhr;
	var clock;
	var jsonpCallback = 0;

	var clearBranchStorage = function() {
		sessionStorage.clear();
		localStorage.clear();
		var clearCookies = function(temp, perm) {
			var deleteCookie = function(cookie) {
				document.cookie = cookie.substring(0, cookie.indexOf('=')) + '=;expires=-1;path=/';
			};
			var cookieArray = document.cookie.split(';');
			for (var i = 0; i < cookieArray.length; i++) {
				var cookie = cookieArray[i];
				while (cookie.charAt(0) === ' ') {
					cookie = cookie.substring(1, cookie.length);
				}
				if (cookie.indexOf('BRANCH_WEBSDK_COOKIE') === 0) {
					if (temp && cookie.indexOf('branch_expiration_date=') === -1) {
						deleteCookie(cookie);
					}
					else if (perm && cookie.indexOf('branch_expiration_date=') > 0) {
						deleteCookie(cookie);
					}
				}
			}
		};
		clearCookies(true, true);
		branch._storage._store = { };
	};

	before(function() {
		xhr = sinon.useFakeXMLHttpRequest();
		clock = sinon.useFakeTimers();
		xhr.onCreate = function(xhr) {
			requests.push(xhr);
		};
		branch._server.createScript = function() {};
		sinon.stub(branch._server, 'createScript', function(src) {
			requests.push({ src: src, callback: window[src.match(/callback=([^&]+)/)[1]] });
		});
	});

	beforeEach(function() {
		clearBranchStorage();
		testUtils.go('');
		branch.branch_key = 'branch_sample_key';
		branch.identity = 'foo';
		branch.identity_id = identity_id.toString();
		branch.device_fingerprint_id = identity_id.toString();
	});

	afterEach(function() {
		jsonpCallback++;
		requests = [];
	});

	after(function() {
		if (typeof branch._server.createScript.restore === 'function') {
			branch._server.createScript.restore();
		}
		if (typeof xhr.restore === 'function') {
			xhr.restore();
		}
		if (typeof clock.restore === 'function') {
			clock.restore();
		}
	});

	var sampleParams = {
		tags: [ 'tag1', 'tag2' ],
		channel: 'sample app',
		feature: 'create link',
		stage: 'created link',
		type: 1,
		data: {
			mydata: 'bar',
			'$desktop_url': 'https://cdn.branch.io/example.html',
			'$og_title': 'Branch Metrics',
			'$og_description': 'Branch Metrics',
			'$og_image_url': 'http://branch.io/img/logo_icon_white.png'
		}
	};

	var indexOfLastInitRequest = function(requestsAfterInit) {
		return requestsAfterInit + 1;
	};

	var numberOfAsserts = function(assertsAfterInit) {
		return assertsAfterInit + 4;
	};

	var branchInit = function(assert, callback) {
		branch.init.apply(
			branch,
			[
				device_fingerprint_id,
				callback
			]
		);
		if (assert) {
			assert.strictEqual(requests.length, 1, 'Exactly one request was made');
			assert.strictEqual(
				requests[0].src,
				config.app_service_endpoint +
					'/_r?sdk=web' +
					config.version +
					'&branch_key=' +
					branch.branch_key +
					'&callback=branch_callback__' + jsonpCallback.toString(),
				'The first request has the right .src'
			);
		}

		// _r
		requests[0].callback(browser_fingerprint_id);
		// v1/open
		requests[1].respond(
			200,
			{ "Content-Type": "application/json" },
			'{ "identity_id":' + identity_id +
				', "session_id":"123088518049178533", "device_fingerprint_id":null, ' +
				'"browser_fingerprint_id":"79336952217731267", ' +
				'"link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }'
		);
		// v1/event
		requests[2].respond(
			200,
			{ "Content-Type": "application/json" },
			JSON.stringify({
				branch_view_enabled: false
			}));

		if (assert) {
			assert.strictEqual(requests.length, 3, 'Exactly three requests were made');

			var params = requests[1].requestBody.split('&');
			var requestObj = params.reduce(function(a, b) {
				var pair = b.split('=');
				a[pair[0]] = pair[1];
				return a;
			}, {});

			var expectedObj = {
				app_id: browser_fingerprint_id,
				browser_fingerprint_id: browser_fingerprint_id,
				identity_id: identity_id,
				options: "%7B%7D",
				sdk: 'web' + config.version
			};

			if (requestObj.initial_referrer) {
				expectedObj.initial_referrer = requestObj.initial_referrer;
			}

			assert.deepEqual(
				requestObj,
				expectedObj,
				'The second request has the right .requestBody'
			);
		}
	};

	describe('init', function() {
		it('should call api with params and version', function(done) {
			var assert = testUtils.plan(numberOfAsserts(1), done);
			branchInit(assert, function(err, data) {
				assert.deepEqual(data,
					{
						data: "",
						data_parsed: {},
						has_app: true,
						identity: "Branch",
						referring_identity: null,
						referring_link: null
					},
					'Expected response returned');
			});
		});

		it('should support being called without a callback', function(done) {
			var assert = testUtils.plan(numberOfAsserts(0), done);
			branchInit(assert);
		});

		it('should return error to callback', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				assert.strictEqual(err.message, 'Error in API: 400', 'Expect 400 error message');
			});
			requests[0].callback(browser_fingerprint_id);
			requests[1].respond(400);
		});

		it('should attempt 5xx error three times total', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				assert.strictEqual(err.message, 'Error in API: 500', 'Expect 500 error message');
			});
			var requestCount = 0;
			requests[requestCount].callback(browser_fingerprint_id);
			requestCount++;
			requests[requestCount].respond(500);
			clock.tick(250);
			requestCount++;
			requests[requestCount].respond(500);
			clock.tick(250);
			requestCount++;
			requests[requestCount].respond(500);
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			var assert = testUtils.plan(1, done);
			if (testUtils.go('#r:12345')) {
				branchInit();
				assert(
					requests[indexOfLastInitRequest(0)]
						.requestBody
						.indexOf('link_identifier=12345') > -1,
					'Expect link_identifier=12345'
				);
			}
			else {
				jsonpCallback--;
				done();
			}

		});
	});

	describe('setIdentity', function() {
		it('make two requests to init and set identity, and return expected data', function(done) {
			var assert = testUtils.plan(2, done);
			branchInit();
			branch.setIdentity('identity', function(err, data) {
				assert.deepEqual(data,
					{
						"identity_id": identity_id,
						"link_click_id": "114750153298026746",
						"link": config.link_service_endpoint + "/i/4LYQTXE0_k",
						"referring_data_parsed": null
					},
					'Expected response returned'
				);
			});
			assert.strictEqual(
				requests.length,
				indexOfLastInitRequest(3),
				'Expect requests length'
			);
			requests[indexOfLastInitRequest(2)].respond(
				200,
				{ "Content-Type": "application/json" },
				'{ "identity_id":' + identity_id +
					', "link_click_id":"114750153298026746"' +
					', "link":"https://bnc.lt/i/4LYQTXE0_k" }'
			);
		});
	});

	describe('data', function() {
		it('should make two requests and return session data', function(done) {
			var assert = testUtils.plan(numberOfAsserts(2), done);
			branchInit(assert);
			branch.data(function(err, data) {
				assert.deepEqual(
					data,
					{
						data: "",
						data_parsed: {},
						has_app: true,
						identity: "Branch",
						referring_identity: null,
						referring_link: null
					},
					'Expect data in branch.data callback'
				);
			});
			assert.strictEqual(requests.length, indexOfLastInitRequest(2));
		});
	});

	describe('getBrowserFingerprintId', function() {
		it('it should return browser-fingerprint-id with value 79336952217731267', function(done) {
			var assert = testUtils.plan(numberOfAsserts(1), done);
			branchInit(assert);
			branch.getBrowserFingerprintId(function(err, data) {
				assert.strictEqual("79336952217731267", data, 'expected browser-fingerprint-id returned correctly (79336952217731267)');
			});
		});
		it('with tracking disabled, it should return browser-fingerprint-id with value null', function(done) {
			var assert = testUtils.plan(numberOfAsserts(1), done);
			branchInit(assert);
			branch.disableTracking();
			branch.getBrowserFingerprintId(function(err, data) {
				assert.strictEqual(null, data, 'expected browser-fingerprint-id returned correctly (null)');
			});
		});
	});

	describe('link', function() {
		it('should make three requests and return short link', function(done) {
			var assert = testUtils.plan(numberOfAsserts(2), done);
			branchInit(assert);

			branch.link(sampleParams, function(err, data) {
				assert.strictEqual(
					data,
					config.link_service_endpoint + '/l/4manXlk0AJ',
					'Expect data in branch.link callback'
				);
			});
			assert.strictEqual(
				requests.length,
				indexOfLastInitRequest(3),
				'Expect requests length'
			);
			requests[indexOfLastInitRequest(2)].respond(
				200,
				{ "Content-Type": "application/json" },
				'{ "url":"https://bnc.lt/l/4manXlk0AJ" }'
			);
		});
	});
});
