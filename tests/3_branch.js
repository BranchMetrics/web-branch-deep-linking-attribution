goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

var server;

describe('Branch Integration', function() {

});

describe('Branch', function() {
	var sandbox, requests;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		requests = [];
	});

	function initBranch(runInit) {
		storage().clear();
		var branch = new Branch();
		if (runInit) {
			branch.initialized = true;
			branch.app_id = app_id;
			branch.session_id = session_id;
			branch.identity_id = identity_id;
		}

		sandbox.stub(branch._server, "request", function(resource, obj, storage, callback) {
			requests.push({
				resource: resource,
				obj: obj,
				callback: callback
			});
		});
		return branch;
	}

	function basicTests(call, params) {
		it('should fail if branch not initialized', function(done) {
			var branch = initBranch(false), d = testUtils.after(params.length * 2, done);

			for (var i = 0; i < params.length; i++) {
				var p = testUtils.nulls(params[i]);

				branch[call].apply(branch, p.concat(function(err) {
					assert.equal(err.message, 'Branch SDK not initialized');
					d();
				}));
				assert.throws(function() {
					branch[call].apply(branch, p);
				}, 'Branch SDK not initialized');
				d();
			}
		});
	}

	afterEach(function() {
		sandbox.restore();
	});

	describe('init', function() {
		it('should call api with params and version', function() {
			var branch = initBranch(false), e;

			branch.init(app_id, function(err) { e = err; });

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

			assert(!e, 'No error');
		});

		it('should return invalid app id error', function() {
			var branch = initBranch(false), err;
			branch.init(app_id, function(e) { err = e; });

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(new Error('Invalid app id'));

			assert.equal(err.message, 'Invalid app id');
		});
	});

	describe('data', function() {
		it('should return session storage contents', function(done) {
			var branch = initBranch(true);

			branch.data(function(err, data) {
				// todo: this seems very bogus?
				assert.equal(data.identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'identity matches');
				assert.equal(data.has_app, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'has_app matches');
				assert.equal(data.referring_identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'referring_identity matches');
				assert.equal(data.data, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'data matches');
				done();
			});
		});
	});

	describe('setIdentity', function() {
		basicTests('setIdentity', [ 1 ]);

		var expectedRequest = testUtils.params({ "identity": "test_identity" }, [ 'session_id', 'browser_fingerprint_id' ]);
		it('should call api with identity', function() {
			var branch = initBranch(true), ran, err, res;

			branch.setIdentity("test_identity", function(e, r) { ran = true; err = e; res = r; });

			// todo: make some assertions about res
			assert.equal(requests.length, 1, 'Request made');

			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('track', function() {
		basicTests('track', [ 1, 2 ]);

		it('should call api with event', function() {
			var branch = initBranch(true), ran, err;
			branch.track("test_event", function(e) { ran = true; err = e; });

			assert.equal(requests.length, 1, 'Request made');

			// todo: call back with something specific, make more assertions
			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
			assert.equal(requests[0].obj["event"], "test_event", 'All params sent');
		});
	});

	describe('logout', function() {
		basicTests('logout', [ 0 ]);

		it('should call api with app_id and session_id', function() {
			var branch = initBranch(true), ran, err;
			branch.logout(function(e) { ran = true; err = e; });

			// todo: call back with something specific, make more assertions
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
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

		it('should call api with identity', function() {
			var branch = initBranch(true), ran, err;
			branch.link(expectedRequest, function(e) { ran = true; err = e; });

			// todo: call back with something specific, make more assertions
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('referrals', function() {
		basicTests('referrals', [ 0 ]);

		it('should call api with identity_id', function() {
			var branch = initBranch(true), ran, err;
			branch.referrals(function(e) { ran = true; err = e; });

			// todo: call back with something specific, make more assertions
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'session_id', 'app_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('credits', function() {
		basicTests('credits', [ 0 ]);

		it('should call api with identity_id', function() {
			var branch = initBranch(true), ran, err;
			branch.credits(function(e) { ran = true; err = e; });

			// todo: call back with something specific, make more assertions
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'session_id', 'app_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('redeem', function() {
		basicTests('redeem', [ 2 ]);

		it('should call api with identity_id', function() {
			var branch = initBranch(true), ran, err;
			branch.redeem(1, "testbucket", function(e) { ran = true; err = e; });

			// todo: call back with something specific, make more assertions
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert(ran, 'Callback ran');
			assert(!err, 'No error');
			assert.deepEqual(requests[0].obj, testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ 'session_id', 'browser_fingerprint_id' ]), 'All params sent');
		});
	});
});

