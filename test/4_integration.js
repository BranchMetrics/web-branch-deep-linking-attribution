

goog.require('goog.json'); // jshint unused:false


/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, branch */

describe('Integration tests', function() {
	// TODO: would be great to write some tests here which call the Branch API
	// functions but stub out XHR.

	// With the above, we can actually run these tests against the *minified*
	// version of the SDK, so we can make sure that we didn't do anything to
	// screw up the Closure Compiler.

	var requests = [], xhr, clock;

	beforeEach(function() {
		sessionStorage.clear();
		testUtils.go('');
		xhr = sinon.useFakeXMLHttpRequest();
		clock = sinon.useFakeTimers();
		xhr.onCreate = function(xhr) { requests.push(xhr); };

		// We *may* not be able to use the minified build because we have to grab createScript method to catch jsonp requests :-/
		sinon.stub(branch._server, "createScript", function(src) {
			requests.push({ src: src, callback: window[src.match(/callback=([^&]+)/)[1]] });
		});
	});

	afterEach(function() {
		xhr.restore();
		clock.restore();
		branch._server.createScript.restore();
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
			branch.init('5680621892404085');
			console.log(requests);
			/*
			var assert = testUtils.plan(7, done);
			var expectedResponse = {
				"data": null,
				"has_app": true,
				"identity": "Branch",
				"referring_identity": null
			};

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "v": config.version, branch_key: branch_sample_key }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": undefined,
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');

			assert.equal(requests.length, 2, '2 requests made');
			*/
		});

/*
		it('should support being called without a callback', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(1, done);

			branch.init(branch_sample_key);

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: session_id, browser_fingerprint_id: browser_fingerprint_id, identity_id: identity_id });

			assert(true, 'Succeeded');
		});

		it('should return invalid app id error', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(1, done);
			branch.init(branch_sample_key, function(err) { assert.equal(err.message, 'Invalid app id'); });

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(new Error('Invalid app id'));
		});

		it('should fail early on browser fingerprint error', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(2, done);
			branch.init(branch_sample_key, function(err) {
				assert.equal(err.message, 'Browser fingerprint fetch failed');
				assert.equal(requests.length, 1, 'Only 1 request made');
			});
			requests[0].callback(new Error('Browser fingerprint fetch failed'));
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			testUtils.go("#r:12345");
			var branch = initBranch(false), assert = testUtils.plan(2, done);

			branch.init(branch_sample_key, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '12345', 'click_id from link_identifier hash stored in session_id');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: "1234", something: "else" });

			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": '12345',
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');
		});
*/
	});
});
