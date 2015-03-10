goog.require('utils');
goog.require('BranchAPI');
goog.require('resources');
goog.require('config');
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
	var server = new BranchAPI(), xhr, jsonp, requests;
	beforeEach(function() {
		storage().clear();
		xhr = sinon.useFakeXMLHttpRequest();
		jsonp = sinon.stub(server, "jsonpRequest", function(requestURL, requestData, requestMethod, callback) {
			jsonp.url = requestURL;
			jsonp.method = 'JSONP';
			requests.push(jsonp);
		});

		requests = [];
		xhr.onCreate = function(xhr) { requests.push(xhr); };
	});
	afterEach(function() {
		xhr.restore();
		server.jsonpRequest.restore();
	});

	describe('/v1/open', function() {
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

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.profile, params({ "identity": "test_id" }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/profile', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without identity', function(done) {
			server.request(resources.profile, params(), storage(), function(err) {
				assert.equal(err.message, "API request /v1/profile missing parameter identity");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without app_id', function(done) {
			server.request(resources.profile, params({ }, [ 'app_id' ]), storage(), function(err) {
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

	describe('/v1/logout', function() {
		it('should pass in app_id and session_id', function(done) {
			server.request(resources.logout, params({ }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/logout', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&session_id=" + session_id);

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.logout, params({ }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/logout', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without app_id', function(done) {
			server.request(resources.logout, params({ }, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/logout missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without session_id', function(done) {
			server.request(resources.logout, params({ }, [ 'session_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/logout missing parameter session_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});

	describe('/v1/referrals', function() {
		it('should pass in identity_id', function(done) {
			server.request(resources.referrals, params({ }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/referrals/' + identity_id + '?', 'Endpoint correct');
			assert.equal(requests[0].method, 'GET', 'Method correct');

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.referrals, params({ }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/referrals/' + identity_id + '?', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without identity_id', function(done) {
			server.request(resources.referrals, params({ }, [ 'identity_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/referrals missing parameter identity_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});

	describe('/v1/credits', function() {
		it('should pass in identity_id', function(done) {
			server.request(resources.credits, params({ }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/credits/' + identity_id + '?', 'Endpoint correct');
			assert.equal(requests[0].method, 'GET', 'Method correct');

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.credits, params({ }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/credits/' + identity_id + '?', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without identity_id', function(done) {
			server.request(resources.credits, params({ }, [ 'identity_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/credits missing parameter identity_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});

	describe('/_r', function() {
		it('should pass in identity_id and v', function(done) {
			server.request(resources._r, params({ "v": config.version }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://bnc.lt/_r?app_id=' + app_id + '&v=' + config.version, 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without app_id', function(done) {
			server.request(resources._r, params({ "v": config.version }, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /_r missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without v', function(done) {
			server.request(resources._r, params(), storage(), function(err) {
				assert.equal(err.message, "API request /_r missing parameter v");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});


	describe('/v1/redeem', function() {
		it('should pass in app_id, identity_id, amount, and bucket', function(done) {
			server.request(resources.redeem, params({ "amount": 1, "bucket": "testbucket" }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/redeem', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&identity_id=" + identity_id + "&amount=1&bucket=testbucket");

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.redeem, params({ "amount": 1, "bucket": "testbucket" }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/redeem', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without app_id', function(done) {
			server.request(resources.redeem, params({ }, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/redeem missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without identity_id', function(done) {
			server.request(resources.redeem, params({ }, [ 'identity_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/redeem missing parameter identity_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without amount', function(done) {
			server.request(resources.redeem, params({ "bucket": "testbucket" }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/redeem missing parameter amount");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without bucket', function(done) {
			server.request(resources.redeem, params({ "amount": 1 }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/redeem missing parameter bucket");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});

	describe('/v1/link', function() {
		it('should pass in app_id and identity_id', function(done) {
			server.request(resources.link, params(), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/url', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&identity_id=" + identity_id);

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.link, params({ "amount": 1, "bucket": "testbucket" }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/url', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without app_id', function(done) {
			server.request(resources.link, params({ }, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/url missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without identity_id', function(done) {
			server.request(resources.link, params({ }, [ 'identity_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/url missing parameter identity_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		// param format and type tests
		it('should fail with tags as string, not array', function(done) {
			server.request(resources.link, params({ "tags": "Hello, I'm not an array." }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/url, parameter tags is not an array");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});

	describe('/l', function() {
		it('should pass in link_url and click', function(done) {
			server.request(resources.linkClick, params({ "link_url": "3hpH54U-58", "click": "click" }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://bnc.lt/3hpH54U-58?click=click', 'Endpoint correct');
			assert.equal(requests[0].method, 'GET', 'Method correct');

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.linkClick, params({ "link_url": "3hpH54U-58", "click": "click" }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://bnc.lt/3hpH54U-58?click=click', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without link_url', function(done) {
			server.request(resources.linkClick, params({ "click": "click" }), storage(), function(err) {
				assert.equal(err.message, "API request  missing parameter link_url");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without click', function(done) {
			server.request(resources.linkClick, params({ "link_url": "3hpH54U-58" }), storage(), function(err) {
				assert.equal(err.message, "API request  missing parameter click");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});

	describe('/v1/event', function() {
		var metadata = {
				"url": "testurl",
				"user_agent": "test_agent",
				"language": "test_language"
			};
		var metadataString = "&metadata.url=testurl&metadata.user_agent=test_agent&metadata.language=test_language";

		it('should pass in app_id, session_id, event and metadata', function(done) {
			server.request(resources.event, params({ "event": "testevent", "metadata": metadata }), storage(), done);

			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/event', 'Endpoint correct');
			assert.equal(requests[0].method, 'POST', 'Method correct');
			assert.equal(requests[0].requestBody, "app_id=" + app_id + "&session_id=" + session_id + "&event=testevent" + metadataString);

			requests[0].respond(200, { "Content-Type": "application/json" }, '{ "session_id": 123 }');
		});

		it('should pass as a jsonp request', function(done) {
			storage()['setItem']('use_jsonp', true);
			server.request(resources.event, params({ "event": "testevent", "metadata": metadata }), storage(), done);
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].url, 'https://api.branch.io/v1/event', 'Endpoint correct');
			assert.equal(requests[0].method, 'JSONP', 'Method correct');
			done();
		});

		it('should fail without app_id', function(done) {
			server.request(resources.event, params({ "event": "testevent", "metadata": metadata }, [ 'app_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/event missing parameter app_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without session_id', function(done) {
			server.request(resources.event, params({ "event": "testevent", "metadata": metadata }, [ 'session_id' ]), storage(), function(err) {
				assert.equal(err.message, "API request /v1/event missing parameter session_id");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without event', function(done) {
			server.request(resources.event, params({ "metadata": metadata }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/event missing parameter event");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		it('should fail without metadata', function(done) {
			server.request(resources.event, params({ "event": "testevent" }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/event missing parameter metadata");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});

		// param format and type tests
		it('should fail with metadata as string, not object', function(done) {
			server.request(resources.event, params({ "metadata": "Hello, I'm not an object.", "event": "testevent" }), storage(), function(err) {
				assert.equal(err.message, "API request /v1/event, parameter metadata is not an object");
				done();
			});
			assert.equal(requests.length, 0, 'No request made');
		});
	});
});

