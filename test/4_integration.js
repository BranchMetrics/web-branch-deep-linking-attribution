goog.require('config');
goog.require('utils');
goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, branch */

describe('Integration tests', function() {
	// TODO: would be great to write some tests here which call the Branch API
	// functions but stub out XHR.

	// With the above, we can actually run these tests against the *minified*
	// version of the SDK, so we can make sure that we didn't do anything to
	// screw up the Closure Compiler.
	// We *may* not be able to use the minified build because we have to grab createScript method to catch jsonp requests :-/

	var requests = [], xhr, clock;

	beforeEach(function() {
		sessionStorage.clear();
		testUtils.go('');
		xhr = sinon.useFakeXMLHttpRequest();
		clock = sinon.useFakeTimers();
		xhr.onCreate = function(xhr) { requests.push(xhr); };
		sinon.stub(branch._server, "createScript", function(src) {
			requests.push({ src: src, callback: window[src.match(/callback=([^&]+)/)[1]] });
		});
	});

	afterEach(function() {
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

	var branchInit = function(init, assert) {
		if (init) { branch.init(browser_fingerprint_id); }
		if (assert) { assert.equal(requests.length, 1); }
		requests[0].callback(browser_fingerprint_id);
		if (assert) { assert.equal(requests.length, 2); }
		requests[1].respond(200,
				{ "Content-Type": "application/json" },
				'{ "session_id":"123088518049178533", "identity_id":"114720603218387056", "device_fingerprint_id":null, "browser_fingerprint_id":"79336952217731267", "link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }');
	};
/*
	function basicTests(call, params) {
		it('should fail if branch not initialized', function(done) {
			var assert = testUtils.plan(params.length * 2, done);

			function basicTest(param) {
				var p = testUtils.nulls(param);
				branch[call].apply(branch, p.concat(function(err) {
					assert.equal(err.message, 'Branch SDK not initialized');
				}));
				assert.throws(function() {
					branch[call].apply(branch, p);
				}, 'Branch SDK not initialized');
			}

			for (var i = 0; i < params.length; i++) {
				basicTest(params[i]);
			}
		});
	}
*/

	describe('init', function() {
		it('should call api with params and version', function(done) {
			var assert = testUtils.plan(4, done);
			branch.init(browser_fingerprint_id, function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true
					},
					'Expected response returned');
			});
			branchInit(false, assert);
			assert.equal(requests[0].src, 'https://bnc.lt/_r?v=' + config.version + '&callback=branch_callback__' + 0, 'Endpoint correct');
		});

		it('should support being called without a callback', function(done) {
			var assert = testUtils.plan(3, done);
			branch.init(browser_fingerprint_id);
			branchInit(false, assert);
			assert.equal(requests[0].src, 'https://bnc.lt/_r?v=' + config.version + '&callback=branch_callback__' + 1, 'Endpoint correct');
		});

		it('should return error to callback', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				 assert.equal(err.message, 'Error in API: 400');
			});
			requests[0].callback(browser_fingerprint_id);
			requests[1].respond(400);
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			var assert = testUtils.plan(1, done);
			testUtils.go("#r:12345");

			branch.init(branch_sample_key, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '12345', 'click_id from link_identifier hash stored in session_id');
			});
			branchInit();
		});
	});

	describe('setIdentity', function() {
		it('make three requests to init and set identity, and return expected data', function(done) {
			var assert = testUtils.plan(1, done);
			branchInit(true);
			branch.setIdentity('identity', function(err, data) {
				assert.deepEqual(data,
					{
						"identity_id":"114720603218387056",
						"link_click_id":"114750153298026746",
						"link":"https://bnc.lt/i/4LYQTXE0_k"
					},
					'Expected response returned'
				);
			});
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "identity_id":"114720603218387056", "link_click_id":"114750153298026746", "link":"https://bnc.lt/i/4LYQTXE0_k" }');
		});
	});

	describe('data', function() {
		it('should make two requests and return session data', function(done) {
			var assert = testUtils.plan(2, done);
			branchInit(true);
			branch.data(function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true
					});
			});
			assert.equal(requests.length, 2);
		});
	});

	describe('logout', function() {
		it('should make three requests and logout session', function(done) {
			var assert = testUtils.plan(4, done);
			branchInit(true, assert);
			branch.logout(function(err) {
				assert.equal(err, null);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{"session_id":"124235352855552203","identity_id":"124235352826192073","link":"https://bnc.lt/i/4tLqIdk017"}');
		});
	});

	describe('track', function() {
		it('should make three requests and return undefined', function(done) {
			var assert = testUtils.plan(4, done);
			branchInit(true, assert);
			branch.track('track', { }, function(err, data) {
				assert.equal(data, undefined);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ }');
		});
	});

	describe('link', function() {
		it('should make three requests and return short link', function(done) {
			var assert = testUtils.plan(4, done);
			branchInit(true, assert);
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
			var assert = testUtils.plan(4, done);
			var expectedResponse = { "install": { "total": 5, "unique": 2 }, "open": { "total": 4, "unique": 3 }, "buy": { "total": 7, "unique": 3 } };
			branchInit(true, assert);
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
			var assert = testUtils.plan(4, done);
			var expectedResponse = { "default":"0" };
			branchInit(true, assert);
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
			var assert = testUtils.plan(6, done);
			branchInit(true, assert);
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
