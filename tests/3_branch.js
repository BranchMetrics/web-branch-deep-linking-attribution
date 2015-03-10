goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

var server;

describe('Resources', function() {
	var branch = new Branch(), api, requests;
	before(function() {
		branch.init(app_id, function(err, data) { });
	});

	beforeEach(function() {
		api = sinon.stub(branch._branchAPI, "request", function(resource, obj, storage, callback) {
			// do whatever here
		});
	});

	afterEach(function() {
		// nothing for this yet...
	});

	describe('data', function() {
		var expectedRequest = {
			"event": "test_event",
			"metadata": utils.merge({
				"url": document.URL,
				"user_agent": navigator.userAgent,
				"language": navigator.language
			}, { }),
			"app_id": app_id,
			"session_id": branch.session_id
		};

		it('should pass in app_id and browser_fingerprint_id', function(done) {
			branch.track(expectedRequest["event"], done);
		});

		/*
		it('should pass in app_id and browser_fingerprint_id', function(done) {
			server.request(resources.open, params({ "is_referrable": 1 }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/open', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&identity_id=" + identity_id + "&is_referrable=1&browser_fingerprint_id=" + browser_fingerprint_id, 'Data correct');

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.open, params({ "is_referrable": 1 }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/open', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without is_referrable', function(done) {
			server.request(resources.open, params(), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open missing parameter is_referrable");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without app_id', function(done) {
			server.request(resources.open, params({ }, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without browser_fingerprint_id', function(done) {
			server.request(resources.open, params({ is_referrable: 1 }, [ 'browser_fingerprint_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open missing parameter browser_fingerprint_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		// param format and type tests
		it('should fail with incorrect app_id format', function(done) {
			server.request(resources.open, params({ "app_id": "ahd7393j" }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open, parameter app_id is not in the proper format");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail with link_identifier as number, not string', function(done) {
			server.request(resources.open, params({ "link_identifier": 45433, "is_referrable": 1 }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open, parameter link_identifier is not a string");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail with is_referrable as string, not number', function(done) {
			server.request(resources.open, params({ "is_referrable": "1" }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open, parameter is_referrable is not a number");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
*/
	});
});

