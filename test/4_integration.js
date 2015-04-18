goog.require('utils');
goog.require('Server');
goog.require('Queue');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

goog.require('goog.json'); // jshint unused:false

describe('Integration tests', function() {
	// TODO: would be great to write some tests here which call the Branch API
	// functions but stub out XHR.

	// With the above, we can actually run these tests against the *minified*
	// version of the SDK, so we can make sure that we didn't do anything to
	// screw up the Closure Compiler.

	var sandbox, requests;

	beforeEach(function() {
		testUtils.go('');
		sandbox = sinon.sandbox.create();
		requests = [];
	});

	function initBranch(runInit) {
		storage().clear();
		var branch = new Branch();

		sandbox.stub(branch._server, "request", function(resource, obj, storage, callback) {
			requests.push({
				resource: resource,
				obj: obj,
				callback: callback
			});
		});

		if (runInit) {
			branch.init(app_id);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: session_id, browser_fingerprint_id: browser_fingerprint_id, identity_id: identity_id });
			requests = [];
		}

		return branch;
	}

	function basicTests(call, params) {
		it('should fail if branch not initialized', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(params.length * 2, done);

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

	afterEach(function() {
		sandbox.restore();
	});

		describe('init', function() {
		it('should call api with params and version', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(7, done);
			var expectedResponse = {
				"data": null,
				"has_app": true,
				"identity": "Branch",
				"referring_identity": null
			};

			branch.init(app_id, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert(!err, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "v": config.version, app_id: app_id }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"app_id": app_id,
				"link_identifier": undefined,
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');

			assert.equal(requests.length, 2, '2 requests made');
		});
	});
});
