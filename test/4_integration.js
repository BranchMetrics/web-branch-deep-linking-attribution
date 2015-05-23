goog.require('config');
goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, branch */

describe('Integration tests', function() {
	var requests = [], xhr, clock, jsonpCallback = 0;

	beforeEach(function() {
		sessionStorage.clear();
		testUtils.go('');
		xhr = sinon.useFakeXMLHttpRequest();
		clock = sinon.useFakeTimers();
		xhr.onCreate = function(xhr) { requests.push(xhr); };
		sinon.stub(branch._server, "createScript", function(src) {
			requests.push({ src: src, callback: window[src.match(/callback=([^&]+)/)[1]] });
		});
		branch.identity_id = identity_id.toString();
	});

	afterEach(function() {
		jsonpCallback++;
		xhr.restore();
		clock.restore();
		branch._server.createScript.restore();
		requests = [];
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

	var branchInit = function(assert, callback) {
		branch.init(browser_fingerprint_id, callback);
		if (assert) {
			assert.equal(requests.length, 1);
			assert.equal(requests[0].src, 'https://bnc.lt/_r?v=' + config.version + '&callback=branch_callback__' + jsonpCallback.toString());
		}
		requests[0].callback(browser_fingerprint_id);
		requests[1].respond(200,
				{ "Content-Type": "application/json" },
				'{ "identity_id":' + identity_id + ', "session_id":"123088518049178533", "device_fingerprint_id":null, "browser_fingerprint_id":"79336952217731267", "link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }');
		if (assert) {
			assert.equal(requests.length, 2);
			assert.equal(requests[1].requestBody, 'identity_id=' + identity_id + '&is_referrable=1&sdk=web' + config.version + '&browser_fingerprint_id=' + browser_fingerprint_id + '&app_id=' + browser_fingerprint_id);
		}
	};

	describe('init', function() {
		it('should call api with params and version', function(done) {
			var assert = testUtils.plan(5, done);
			branchInit(assert, function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true,
						referring_link: null
					},
					'Expected response returned');
			});
		});

		it('should support being called without a callback', function(done) {
			var assert = testUtils.plan(4, done);
			branchInit(assert);
		});

		it('should return error to callback', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				 assert.equal(err.message, 'Error in API: 400');
			});
			requests[0].callback(browser_fingerprint_id);
			requests[1].respond(400);
		});

		it('should attempt 5xx error three times total', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				 assert.equal(err.message, 'Error in API: 500');
			});
			requests[0].callback(browser_fingerprint_id);
			requests[1].respond(500);
			clock.tick(250);
			requests[2].respond(500);
			clock.tick(250);
			requests[3].respond(500);
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			var assert = testUtils.plan(1, done);
			testUtils.go("#r:12345");
			branchInit();
			assert.equal(true, requests[1].requestBody.indexOf('link_identifier=12345') > -1);
		});
	});

	describe('setIdentity', function() {
		it('make three requests to init and set identity, and return expected data', function(done) {
			var assert = testUtils.plan(2, done);
			branchInit();
			branch.setIdentity('identity', function(err, data) {
				assert.deepEqual(data,
					{
						"identity_id":identity_id,
						"link_click_id":"114750153298026746",
						"link":"https://bnc.lt/i/4LYQTXE0_k",
						"referring_data_parsed": null
					},
					'Expected response returned'
				);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "identity_id":' + identity_id + ', "link_click_id":"114750153298026746", "link":"https://bnc.lt/i/4LYQTXE0_k" }');
		});
	});

	describe('data', function() {
		it('should make two requests and return session data', function(done) {
			var assert = testUtils.plan(6, done);
			branchInit(assert);
			branch.data(function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true,
						referring_link: null
					});
			});
			assert.equal(requests.length, 2);
		});
	});

	describe('logout', function() {
		it('should make three requests and logout session', function(done) {
			var assert = testUtils.plan(6, done);
			branchInit(assert);
			branch.logout(function(err) {
				assert.equal(err, null);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{"session_id":"124235352855552203","identity_id":' + identity_id + ',"link":"https://bnc.lt/i/4tLqIdk017"}');
		});
	});

	describe('track', function() {
		it('should make three requests and return undefined, no metadata', function(done) {
			var assert = testUtils.plan(6, done);
			branchInit(assert);
			branch.track('track', { }, function(err, data) {
				assert.equal(data, undefined);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ }');
		});

		it('should make three requests and return undefined, with metadata', function(done) {
			var assert = testUtils.plan(6, done);
			var testMetadata = { "test": "meta_data" };
			branchInit(assert);
			branch.track('track', testMetadata, function(err, data) {
				assert.equal(data, undefined);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				JSON.stringify(testMetadata));
		});
	});

	describe('link', function() {
		it('should make three requests and return short link', function(done) {
			var assert = testUtils.plan(6, done);
			branchInit(assert);
			branch.link(sampleParams, function(err, data) {
				assert.equal(data, "https://bnc.lt/l/4manXlk0AJ");
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "url":"https://bnc.lt/l/4manXlk0AJ" }');
		});
	});

	describe('referrals', function() {
		it('should make three requests and return referral data', function(done) {
			var assert = testUtils.plan(6, done);
			var expectedResponse = { "install": { "total": 5, "unique": 2 }, "open": { "total": 4, "unique": 3 }, "buy": { "total": 7, "unique": 3 } };
			branchInit(assert);
			branch.referrals(function(err, data) {
				assert.deepEqual(data, expectedResponse);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "install": { "total": 5, "unique": 2 }, "open": { "total": 4, "unique": 3 }, "buy": { "total": 7, "unique": 3 } }');
		});
	});

	describe('credits', function() {
		it('should make three requests and return credits', function(done) {
			var assert = testUtils.plan(6, done);
			var expectedResponse = { "default":"0" };
			branchInit(assert);
			branch.credits(function(err, data) {
				assert.deepEqual(data, expectedResponse);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "default":"0" }');
		});
	});

	describe('sendSMS', function() {
		it('should make five requests and return an empty object', function(done) {
			var assert = testUtils.plan(8, done);
			branchInit(assert);
			branch.sendSMS('9999999999',
				sampleParams,
				{ },
				function(err, data) {
					assert.equal(data, undefined);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "url":"https://bnc.lt/l/4manXlk0AJ" }');
			assert.equal(requests.length, 4);
			requests[3].respond(200,
				{ "Content-Type": "application/json" },
				'{ "click_id":"4uImgLU00t" }');
			assert.equal(requests.length, 5);
			requests[4].respond(200,
				{ "Content-Type": "text/html" },
				'<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="/static/styles.css" /></head><body><div class="container"><h2>Sent!</h2></div></body></html>');
		});
	});
});
