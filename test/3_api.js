'use strict';

goog.require('utils');
goog.require('Server');
goog.require('resources');
goog.require('storage'); // jshint unused:false
goog.require('config');
goog.require('safejson');

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Server helpers', function() {
	var server = new Server();
	var assert = testUtils.unplanned();

	it('serializeObject should work', function() {
		// Test simple objects
		assert.strictEqual(
			server.serializeObject(
				{
					a: 'b'
				}
			),
			'a=b'
		);
		assert.strictEqual(
			server.serializeObject(
				{
					a: 'b',
					c: 'def'
				}
			),
			'a=b&c=def'
		);
		assert.strictEqual(
			server.serializeObject(
				{
					a: 'b',
					e: 123
				}
			),
			'a=b&e=123'
		);
		assert.strictEqual(
			server.serializeObject(
				{
					a: 'fo &)!@# bar'
				}
			),
			'a=fo%20%26)!%40%23%20bar'
		);

		// Test nested objects
		assert.strictEqual(
			server.serializeObject(
				{
					a: {
						b: 'c',
						d: 'e'
					}
				}
			),
			'a.b=c&a.d=e'
		);
		assert.strictEqual(
			server.serializeObject(
				{
					a: {
						b: 'c',
						d: {
							e: 'f',
							g: 'h'
						}
					}
				}
			),
			'a.b=c&a.d.e=f&a.d.g=h'
		);

		// Test arrays
		assert.strictEqual(
			server.serializeObject(
				{
					a: [
						'b',
						'c'
					]
				}
			),
			'a=b&a=c'
		);

		// Test arrays in objects
		assert.strictEqual(
			server.serializeObject(
				{
					a: {
						b: [
							'c',
							'd'
						]
					}
				}
			),
			'a.b=c&a.b=d'
		);
	});

	describe('getUrl', function() {});
});

describe('Server', function() {
	var server = new Server();
	var storage = new BranchStorage([ 'session', 'pojo' ]);
	var xhr;
	var requests;
	var clock;
	beforeEach(function() {
		storage.clear();
		xhr = sinon.useFakeXMLHttpRequest();
		clock = sinon.useFakeTimers();
		server.createScript = function() {};
		sinon.stub(server, "createScript", function(src) {
			requests.push({ src: src, callback: window[src.match(/callback=([^&]+)/)[1]] });
		});

		requests = [];
		xhr.onCreate = function(xhr) {
			requests.push(xhr);
		};
	});

	afterEach(function() {
		if (typeof xhr.restore === 'function') {
			xhr.restore();
		}
		if (typeof clock.restore === 'function') {
			clock.restore();
		}
		if (typeof server.createScript.restore === 'function') {
			server.createScript.restore();
		}
	});

	describe('Resources', function() {
		describe('/v1/open', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key and browser_fingerprint_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(5, done);
				server.request(
					resources.open,
					testUtils.params({ }),
					storage,
					assert.done
				);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					config.api_endpoint + '/v1/open',
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"browser_fingerprint_id=" + browser_fingerprint_id +
					"&identity_id=" + identity_id +
					"&sdk=web" + config.version +
					"&branch_key=" + branch_sample_key +
					"&options=%7B%7D",
					'Data correct');
				requests[0].respond(
					200,
					{ "Content-Type": "application/json" },
					'{ "session_id": 123 }'
				);
			});

			it('should pass as a jsonp request', function(done) {
				storage['set']('use_jsonp', true);

				var assert = testUtils.plan(3, done);

				var completeParams = testUtils.params({ });
				server.request(resources.open, completeParams, storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');

				var encodedData = encodeURIComponent(
					utils.base64encode(goog.json.serialize(completeParams))
				);
				assert.strictEqual(
					requests[0].src,
					config.api_endpoint + '/v1/open?&data=' + encodedData +
					'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);

				requests[0].callback();
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ }, [ 'branch_key' ]),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/open missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should pass without branch_key but with app_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params(
						{ "app_id": "5680621892404085" },
						[ 'branch_key' ]
					),
					storage,
					assert.done
				);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].requestBody,
					"browser_fingerprint_id=" + browser_fingerprint_id +
					"&identity_id=" + identity_id +
					"&sdk=web" + config.version +
					"&app_id=" + "5680621892404085" +
					"&options=%7B%7D",
					'Data correct');
			});

			// param format and type tests
			it('should fail with incorrect branch_key format', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ "branch_key": "ahd&7393j" }),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/open missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail with link_identifier as number, not string', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ "link_identifier": 45433 }),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/open, parameter link_identifier is not a string"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it ('should not include developer identity', function(done) {
				var assert = testUtils.plan(1, done);
				storage.set('use_jsonp', false);
				/*
				 * Branch instance will pass identity, if set, but resources will filter it out.
				 */
				server.request(
					resources.open,
					testUtils.params({ identity: '12345678' }),
					storage,
					assert.done
				);
				var request = requests[0];
				assert.ok(!request.requestBody.includes('identity='), 'Does not include identity');
				requests[0].respond(
					200,
					{ "Content-Type": "application/json" },
					'{ "session_id": 123 }'
				);
			});

		});

		describe('/v1/profile', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key and identity', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(5, done);
				server.request(
					resources.profile,
					testUtils.params({ "identity": "test_id" }),
					storage,
					assert.done
				);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					config.api_endpoint + '/v1/profile', 'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"identity_id=" + identity_id +
					"&identity=test_id" +
					"&browser_fingerprint_id=" + browser_fingerprint_id +
					"&sdk=web" + config.version +
					"&session_id=" + session_id +
					"&branch_key=" + branch_sample_key,
					'Params correct'
				);

				requests[0].respond(
					200,
					{ "Content-Type": "application/json" },
					'{ "session_id": 123 }'
				);
			});

			it('should pass as a jsonp request', function(done) {
				var assert = testUtils.plan(3, done);

				storage['set']('use_jsonp', true);
				var completeParams = testUtils.params({ "identity": "test_id" });
				server.request(resources.profile, completeParams, storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');

				var encodedData = encodeURIComponent(
					utils.base64encode(goog.json.serialize(completeParams))
				);
				assert.strictEqual(
					requests[0].src,
					config.api_endpoint + '/v1/profile?&data=' + encodedData +
					'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);

				requests[0].callback();
			});

			it('should fail without identity', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(resources.profile, testUtils.params(), storage, function(err) {
					err = safejson.parse(err.message);
					assert.strictEqual(
						err.message,
						"API request /v1/profile missing parameter identity",
						'Expected err.message'
					);
				});
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.profile,
					testUtils.params({ "identity": "test_id" }, [ 'branch_key' ]),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/profile missing parameter branch_key or app_id",
							'Expected err.message'
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without identity_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.profile,
					testUtils.params({ identity: 'foo' }, [ 'identity_id' ]),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/profile missing parameter identity_id",
							'Expected err.message'
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/v1/link', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key and identity_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(5, done);

				server.request(resources.link, testUtils.params(), storage, assert.done);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					config.api_endpoint + '/v1/url',
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"identity_id=" + identity_id +
					"&browser_fingerprint_id=" + browser_fingerprint_id +
					"&sdk=web" + config.version +
					"&session_id=" + session_id +
					"&branch_key=" + branch_sample_key
				);

				requests[0].respond(
					200,
					{ "Content-Type": "application/json" },
					'{ "session_id": 123 }'
				);
			});

			it('should pass as a jsonp request', function(done) {
				var assert = testUtils.plan(3, done);
				storage['set']('use_jsonp', true);
				server.request(resources.link, testUtils.params(), storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');
				var encodedData = encodeURIComponent(
					utils.base64encode(goog.json.serialize(testUtils.params()))
				);
				assert.strictEqual(
					requests[0].src,
					config.api_endpoint + '/v1/url?&data=' + encodedData +
					'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);
				requests[0].callback();
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.link,
					testUtils.params({ }, [ 'branch_key' ]),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/url missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without identity_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.link,
					testUtils.params({ }, [ 'identity_id' ]),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/url missing parameter identity_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			// param format and type tests
			it('should fail with tags as string, not array', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.link,
					testUtils.params({ "tags": "Hello, I'm not an array." }),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(
							err.message,
							"API request /v1/url, parameter tags is not an array"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/l', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in link_url and click', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(4, done);
				server.request(
					resources.linkClick,
					testUtils.params({ "link_url": "3hpH54U-58", "click": "click" }),
					storage,
					assert.done
				);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'3hpH54U-58?click=click',
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'GET', 'Method correct');

				requests[0].respond(
					200,
					{ "Content-Type": "application/json" },
					'{ "session_id": 123 }'
				);
			});

			it('should pass as a jsonp request', function(done) {
				var assert = testUtils.plan(3, done);
				storage['set']('use_jsonp', true);
				server.request(
					resources.linkClick,
					testUtils.params({ "link_url": "3hpH54U-58", "click": "click" }),
					storage,
					assert.done
				);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].src,
					'3hpH54U-58?click=click&callback=branch_callback__' +
					(server._jsonp_callback_index - 1),
					'Endpoint correct'
				);
				requests[0].callback();
			});

			it('should fail without link_url', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.linkClick,
					testUtils.params({ "click": "click" }),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(err.message, "API request  missing parameter link_url");
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without click', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.linkClick,
					testUtils.params({ "link_url": "3hpH54U-58" }),
					storage,
					function(err) {
						err = safejson.parse(err.message);
						assert.strictEqual(err.message, "API request  missing parameter click");
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('API tests for trackingDisabled mode', function() {
			it('Tests a v1/open request, includes correct data, tracking disabled and error callback enabled :: request should go through', function(done) {
				// This simulates a call to v1/open as part of the Branch initialization process
				var assert = testUtils.plan(1, done);
				utils.userPreferences.trackingDisabled = true;
				utils.userPreferences.allowErrorsInCallback = false;
				localStorage.setItem('branch_session', {});
				server.request(
					resources.open,
					testUtils.params({
						"link_identifier": "1111111111"
					}),
					storage, assert.done
				);
				assert.strictEqual(requests.length, 1, 'Request made');
			});
		});
	});

	describe('onAPIResponse', function() {
		var assert = testUtils.unplanned();

		beforeEach(function() {
			requests = [];
			storage.clear();
			if (server.onAPIResponse) {
				delete server.onAPIResponse;
			}
		});

		it('receives all relevant fields from an XHR request if present', function(done) {
			storage['set']('use_jsonp', false);

			var params = testUtils.params({
				"link_identifier": "1111111111"
			});
			server.onAPIResponse = function(url, method, requestBody, error, status, responseBody) {
				try {
					assert.strictEqual(url, resources.open.destination + resources.open.endpoint);
					assert.strictEqual(method, resources.open.method);
					// Use regexp to avoid details of different browsers.
					assert.ok(requestBody.match(/link_identifier=1111111111/));
					assert.strictEqual(error, null);
					assert.strictEqual(status, 200);
					assert.deepEqual(responseBody, { 'session_id': 123 }, 'correct response');
					done();
				}
				catch (error) {
					done(error);
				}
			};

			server.request(
				resources.open,
				params,
				storage,
				function(err) {}
			);

			requests[0].respond(
				200,
				{ "Content-Type": "application/json" },
				'{ "session_id": 123 }'
			);
		});
	});
});
