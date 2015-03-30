goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

describe('Branch', function() {
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

			for (var i = 0; i < params.length; i++) {
				var p = testUtils.nulls(params[i]);

				branch[call].apply(branch, p.concat(function(err) {
					assert.equal(err.message, 'Branch SDK not initialized');
				}));
				assert.throws(function() {
					branch[call].apply(branch, p);
				}, 'Branch SDK not initialized');
			}
		});
	}

	afterEach(function() {
		sandbox.restore();
	});

	describe('init', function() {
		it('should call api with params and version', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(6, done);

			// Todo: assert the data actually passed back here.
			branch.init(app_id, function(err) { assert(!err, 'No error'); });

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: "1234", something: "else" });

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

		it('should support being called without a callback', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(1, done);

			branch.init(app_id);

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: session_id, browser_fingerprint_id: browser_fingerprint_id, identity_id: identity_id });

			assert(true, 'Succeeded');
		});

		it('should return invalid app id error', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(1, done);
			branch.init(app_id, function(err) { assert.equal(err.message, 'Invalid app id'); });

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(new Error('Invalid app id'));
		});

		it('should fail early on browser fingerprint error', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(2, done);
			branch.init(app_id, function(err) {
				assert.equal(err.message, 'Browser fingerprint fetch failed');
				assert.equal(requests.length, 1, 'Only 1 request made');
			});
			requests[0].callback(new Error('Browser fingerprint fetch failed'));
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			window.location = window.location.href + "#r:12345";
			var branch = initBranch(false), assert = testUtils.plan(6, done);

			branch.init(app_id, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '12345', 'click_id from link_identifier hash stored in session_id');
				assert(!err, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: "1234", something: "else" });

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "v": config.version, app_id: app_id }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"app_id": app_id,
				"link_identifier": '12345',
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');

			assert.equal(requests.length, 2, '2 requests made');
		});

		it('should store in session and call open with link_identifier from get param', function(done) {
			window.history.replaceState({ }, '', window.location.href + "?_branch_match_id=67890");
			var branch = initBranch(false), assert = testUtils.plan(6, done);

			branch.init(app_id, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '67890', 'click_id from link_identifier get param stored in session_id');
				assert(!err, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: "1234", something: "else" });

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "v": config.version, app_id: app_id }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"app_id": app_id,
				"link_identifier": '67890',
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');

			assert.equal(requests.length, 2, '2 requests made');
		});
	});

	describe('data', function() {
		it('should return session storage contents', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			branch.data(function(err, data) {
				// todo: this seems very bogus?
				assert.equal(data.identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'identity matches');
				assert.equal(data.has_app, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'has_app matches');
				assert.equal(data.referring_identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'referring_identity matches');
				assert.equal(data.data, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'data matches');
			});
		});
	});

	describe('setIdentity', function() {
		basicTests('setIdentity', [ 1 ]);

		var expectedRequest = testUtils.params({ "identity": "test_identity" }, [ 'session_id', 'browser_fingerprint_id' ]);
		it('should call api with identity', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);

			branch.setIdentity("test_identity", function(err, res) {
				// todo: make some assertions about res
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('track', function() {
		basicTests('track', [ 1, 2 ]);

		it('should call api with event', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.track("test_event", function(err) {
				// todo: call back with something specific, make more assertions
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.equal(requests[0].obj["event"], "test_event", 'All params sent');
		});
	});

	describe('logout', function() {
		basicTests('logout', [ 0 ]);

		it('should call api with app_id and session_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.logout(function(err) {
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'identity_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('link', function() {
		basicTests('link', [ 1 ]);

		var expectedRequest = testUtils.params({
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
		});

		it('should call api with identity', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.link(expectedRequest, function(err) { assert(!err, 'No error'); });

			// todo: call back with something specific, make more assertions
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('referrals', function() {
		basicTests('referrals', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.referrals(function(err, res) {
				// todo: call back with something specific, make assertions on res
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'session_id', 'app_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('credits', function() {
		basicTests('credits', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.credits(function(err) {
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'session_id', 'app_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('redeem', function() {
		basicTests('redeem', [ 2 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.redeem(1, "testbucket", function(err) {
				// todo: call back with something specific, make more assertions
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ 'session_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});
/*
	describe.fail('Queueing used correctly', function() {
		it('Should wait to call track after init', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(2, done);
			branch.init(app_id, function(err) { assert(!err, 'No error'); });
			branch.track('did something', function(err) { assert(!err, 'No error'); });
		});

		it('Should call requests in correct order', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(5, done);
			branch.init(app_id, function(err) { assert(!err, 'No error'); });
			branch.track('did something else', function(err) { assert(!err, 'No error'); });

			assert.equal(requests[0].resource.endpoint, '/_r');
			requests[0].callback(null, browser_fingerprint_id);

			assert.equal(requests[1].resource.endpoint, '/v1/open');
			requests[1].callback(null, { "app_id": app_id, "link_identifier": undefined, "is_referrable": 1, "browser_fingerprint_id": browser_fingerprint_id });

			assert.equal(requests[2].resource.endpoint, '/v1/track');
			requests[2].callback(null, {});
		});

		it('If init fails, other calls should error', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(4, done);
			branch.init(app_id, function(err) { assert(err, 'init errored'); });
			branch.track('did another thing', function(err) {
				assert(err, 'track errored');
				assert.equal(requests.length, 1, 'No further requests made');
			});

			assert.equal(requests[0].resource.endpoint, '/_r')
			requests[0].callback(new Error('Initting failed'));
		});
	});
*/
});

