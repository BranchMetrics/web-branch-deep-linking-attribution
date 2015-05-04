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

			assert.equal(requests.length, 1);
			assert.equal(requests[0].src, 'https://bnc.lt/_r?v=' + config.version + '&callback=branch_callback__' + 0, 'Endpoint correct');
			requests[0].callback(browser_fingerprint_id);
			assert.equal(requests.length, 2);
			requests[1].respond(200,
				{ "Content-Type": "application/json" },
				'{ "session_id":"123088518049178533", "identity_id":"114720603218387056", "device_fingerprint_id":null, "browser_fingerprint_id":"79336952217731267", "link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }');
		});

		it('should support being called without a callback', function(done) {
			var assert = testUtils.plan(3, done);
			branch.init(browser_fingerprint_id);

			assert.equal(requests.length, 1);
			assert.equal(requests[0].src, 'https://bnc.lt/_r?v=' + config.version + '&callback=branch_callback__' + 1, 'Endpoint correct');
			requests[0].callback(browser_fingerprint_id);
			assert.equal(requests.length, 2);
			requests[1].respond(200,
				{ "Content-Type": "application/json" },
				'{ "session_id":"123088518049178533", "identity_id":"114720603218387056", "device_fingerprint_id":null, "browser_fingerprint_id":"79336952217731267", "link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }');
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
			testUtils.go("#r:12345");
			var assert = testUtils.plan(1, done);

			branch.init(branch_sample_key, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '12345', 'click_id from link_identifier hash stored in session_id');
			});

			requests[0].callback(browser_fingerprint_id);
			requests[1].respond(200,
				{ "Content-Type": "application/json" },
				'{ "branch_key": branch_sample_key, "link_identifier": "12345", "is_referrable": 1, "browser_fingerprint_id": browser_fingerprint_id }');
		});
	});
	/*
	describe('data', function() {
		it('should return ', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id);
			branch.data(function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true
					},
					'Expected response returned'
				);
			});
		});
	});


	describe('setIdentity', function() {
		it('should do this one thing', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id);
			branch.setIdentity('identity', function(err, data) {
				console.log(data);
				assert.equals(true, true);
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true
					},
					'Expected response returned'
				);
			});
		});
	});
	*/
});
