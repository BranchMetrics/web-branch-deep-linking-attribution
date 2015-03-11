goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

var server;

describe('Branch Integration', function() {

});

describe('Branch', function() {
	var branch = new Branch(), request, requests;
	before(function() {

	});

	beforeEach(function() {
		branch.initialized = true;
		branch.app_id = app_id;
		branch.session_id = session_id;
		branch.identity_id = identity_id;
		request = request || sinon.stub(branch._branchAPI, "request", function(resource, obj, storage, callback) {
			request.resource = resource;
			request.obj = obj;
			requests.push(request);
			callback();
		});
		requests = [];
	});

	afterEach(function() {
		// nothing for this yet...
	});

	describe('data', function() {
		it('should return session storage contents', function(done) {
			branch.data(function(err, data) {
				assert.equal(data.identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'identity matches');
				assert.equal(data.has_app, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'has_app matches');
				assert.equal(data.referring_identity, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'referring_identity matches');
				assert.equal(data.data, utils.whiteListSessionData(utils.readStore(branch._storage)).identity_id, 'data matches');
				done();
			});
		});
	});

// need to revisit how to test api calls with callbacks to a second or third api call
/*
	describe('init', function() {
		it('should call api with params and version', function(done) {
			branch.initialized = false;
			branch.init(app_id, function() {
				assert.deepEqual(requests[0].obj, params({ "v": config.version }, [ 'session_id', 'browser_fingerprint_id', 'identity_id' ]), 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.setIdentity(expectedRequest, function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});
*/

	describe('setIdentity', function() {
		var expectedRequest = params({ "identity": "test_identity" }, [ 'session_id', 'browser_fingerprint_id' ]);

		it('should call api with identity', function(done) {
			branch.setIdentity("test_identity", function() {
				assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.setIdentity(expectedRequest, function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});

	describe('track', function() {
		it('should call api with event', function(done) {
			branch.track("test_event", function() {
				assert.equal(requests[0].obj["event"], "test_event", 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.track("test_event", function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});

	describe('logout', function() {
		it('should call api with app_id and session_id', function(done) {
			branch.logout(function() {
				assert.deepEqual(requests[0].obj, params({ }, [ 'identity_id', 'browser_fingerprint_id' ]), 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.logout(function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});

	describe('link', function() {
		var expectedRequest = params({
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
			branch.link(expectedRequest, function() {
				assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});

		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.link(expectedRequest, function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});

	describe('referrals', function() {
		it('should call api with identity_id', function(done) {
			branch.referrals(function() {
				assert.deepEqual(requests[0].obj, params({ }, [ 'session_id', 'app_id', 'browser_fingerprint_id' ]), 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.referrals(function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});

	describe('credits', function() {
		it('should call api with identity_id', function(done) {
			branch.credits(function() {
				assert.deepEqual(requests[0].obj, params({ }, [ 'session_id', 'app_id', 'browser_fingerprint_id' ]), 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.credits(function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});

	describe('redeem', function() {
		it('should call api with identity_id', function(done) {
			branch.redeem(1, "testbucket", function() {
				assert.deepEqual(requests[0].obj, params({ "amount": 1, "bucket": "testbucket" }, [ 'session_id', 'browser_fingerprint_id' ]), 'All params sent');
				assert.equal(requests.length, 1, 'Request made');
				done();
			});
		});

		it('should fail if branch not initialized', function(done) {
			branch.initialized = false;
			branch.redeem(1, "testbucket", function(err) {
				assert.equal(err.message, 'Branch SDK not initialized');
				done();
			});
		});
	});
});

