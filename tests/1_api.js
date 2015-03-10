goog.require('utils');
goog.require('BranchAPI');
goog.require('resources');
goog.require('storage');

var server;

describe('Server helpers', function() {
	var server = new BranchAPI();
	it('serializeObject should work', function() {
		// Test simple objects
		assert.equal(server.serializeObject({ a: 'b' }), 'a=b');
		assert.equal(server.serializeObject({ a: 'b', c: 'def' }), 'a=b&c=def');
		assert.equal(server.serializeObject({ a: 'b', e: 123 }), 'a=b&e=123');
		assert.equal(server.serializeObject({ a: 'fo &)!@# bar' }), 'a=fo%20%26)!%40%23%20bar');

		// Test nested objects
		assert.equal(server.serializeObject({ a: { b: 'c', d: 'e' } }), 'a.b=c&a.d=e');
		assert.equal(server.serializeObject({ a: { b: 'c', d: { e: 'f', g: 'h' } } }), 'a.b=c&a.d.e=f&a.d.g=h');

		// Test arrays
		assert.equal(server.serializeObject({ a: [ 'b', 'c' ] }), 'a[]=b&a[]=c');

		// Test arrays in objects
		assert.equal(server.serializeObject({ a: { b: [ 'c', 'd' ] } }), 'a.b[]=c&a.b[]=d');
	});

	describe('getUrl', function() {
		// ...
	});

});

describe('Resources', function() {
	var server = new BranchAPI(), xhr, requests;
	beforeEach(function() {
		xhr = sinon.useFakeXMLHttpRequest();
		requests = [];
		xhr.onCreate = function(xhr) { requests.push(xhr); };
	});
	afterEach(function() { xhr.restore(); });

	describe('/v1/open', function() {
		it('should pass in app_id and browser_fingerprint_id', function(done) {
			server.request(resources.open, params({ "is_referrable": 1 }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/open', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&identity_id=" + identity_id + "&is_referrable=1&browser_fingerprint_id=" + browser_fingerprint_id, 'Data correct');

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should fail without is_referrable', function(done) {
			server.request(resources.open, params(), storage(), function(err) {
				assert.equal(err.message, "API request /v1/open missing parameter is_referrable");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without app_id', function(done) {
			server.request(resources.open, params({}, [ 'app_id' ]), storage(), function(err) {
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
	});

	describe('/v1/profile', function() {
		it('should pass in app_id and identity', function(done) {
			server.request(resources.profile, params({ "identity": "test_id" }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/profile', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&identity_id=" + identity_id + "&identity=test_id");

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should fail without identity', function(done) {
			server.request(resources.profile, params(), storage(), function(err) {
				assert.equal(err.message, "API request /v1/profile missing parameter identity");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without app_id', function(done) {
			server.request(resources.profile, params({}, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/profile missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without identity_id', function(done) {
			server.request(resources.profile, params({ identity: 'foo' }, [ 'identity_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/profile missing parameter identity_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});
});

