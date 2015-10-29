'use strict';

goog.require('utils');
goog.require('Server');
goog.require('resources');
goog.require('storage'); // jshint unused:false
goog.require('config');

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

	describe('XHR Request', function() {
		beforeEach(function() {
			requests = [];
			storage.clear();
		});

		it('should instantiate an XHR', function(done) {
			var assert = testUtils.plan(4, done);
			var spyCallback = sinon.spy();
			server.XHRRequest(
				resources.profile,
				testUtils.params({ "identity": "test_id" }),
				'POST',
				storage,
				spyCallback
			);
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(requests[0].timeout, 5000, 'timeout set to 5s');
			assert.strictEqual(
				requests[0].requestHeaders['Content-Type'],
				'application/x-www-form-urlencoded;charset=utf-8'
			);
			requests[0].ontimeout();
			assert(spyCallback.calledOnce);
		});

		it('should succeed on a status=200', function(done) {
			var assert = testUtils.plan(1, done);
			var responseText = 'response';
			server.XHRRequest(
				resources.profile,
				testUtils.params({ "identity": "test_id" }),
				'POST',
				storage,
				function(err, data) {
					assert.strictEqual(
						Object.getOwnPropertyNames(data).length,
						0,
						'successful response'
					);
				}
			);
			requests[0].status = 200;
			requests[0].readyState = 4;
			requests[0].responseText = responseText;
			requests[0].onreadystatechange();
		});

		it('should error on a status=500', function(done) {
			var assert = testUtils.plan(1, done);
			var responseText = 'response';
			server.XHRRequest(
				resources.profile,
				testUtils.params({ "identity": "test_id" }),
				'POST',
				storage,
				function(err) {
					assert.strictEqual(
						err.message,
						'Error in API: ' + requests[0].status,
						'correct error message'
					);
				}
			);
			requests[0].status = 500;
			requests[0].readyState = 4;
			requests[0].responseText = responseText;
			requests[0].onreadystatechange();
		});

		it('should error on a status=400', function(done) {
			var assert = testUtils.plan(1, done);
			var responseText = 'response';
			server.XHRRequest(
				resources.profile,
				testUtils.params({ "identity": "test_id" }),
				'POST',
				storage,
				function(err) {
					assert.strictEqual(
						err.message,
						'Error in API: ' + requests[0].status,
						'correct error message'
					);
				}
			);
			requests[0].status = 400;
			requests[0].readyState = 4;
			requests[0].responseText = responseText;
			requests[0].onreadystatechange();
		});

		it('should error not enough credits on a status=402', function(done) {
			var assert = testUtils.plan(1, done);
			var responseText = 'response';
			server.XHRRequest(
				resources.profile,
				testUtils.params({ "identity": "test_id" }),
				'POST',
				storage,
				function(err) {
					assert.strictEqual(
						err.message,
						'Not enough credits to redeem.',
						'correct error message'
					);
				}
			);
			requests[0].status = 402;
			requests[0].readyState = 4;
			requests[0].responseText = responseText;
			requests[0].onreadystatechange();
		});

		it('should error on onerror()', function(done) {
			var assert = testUtils.plan(1, done);
			var responseText = 'response';
			server.XHRRequest(
				resources.profile,
				testUtils.params({ "identity": "test_id" }),
				'POST',
				storage,
				function(err) {
					assert.strictEqual(
						err.message,
						'Error in API: 1234',
						'correct error message'
					);
				}
			);
			requests[0].status = 1234;
			requests[0].onerror(new Error('sample error'));
		});
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
					testUtils.params({ "is_referrable": 1 }),
					storage,
					assert.done
				);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/open',
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"browser_fingerprint_id=" + browser_fingerprint_id +
						"&identity_id=" + identity_id +
						"&is_referrable=1&sdk=web" + config.version +
						"&branch_key=" + branch_sample_key,
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

				var completeParams = testUtils.params({ "is_referrable": 1 });
				server.request(resources.open, completeParams, storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');

				var encodedData = encodeURIComponent(
					utils.base64encode(goog.json.serialize(completeParams))
				);
				assert.strictEqual(
					requests[0].src,
					'https://api.branch.io/v1/open?&data=' + encodedData +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);

				requests[0].callback();
			});

			it('should fail without is_referrable', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/open missing parameter is_referrable"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ "is_referrable": 1 }, [ 'branch_key' ]),
					storage,
					function(err) {
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
						{ "app_id": "5680621892404085", "is_referrable": 1 },
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
						"&is_referrable=1&sdk=web" + config.version +
						"&app_id=" + "5680621892404085",
					'Data correct');
			});

			it('should fail without browser_fingerprint_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ is_referrable: 1 }, [ 'browser_fingerprint_id' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/open missing parameter browser_fingerprint_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			// param format and type tests
			it('should fail with incorrect branch_key format', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ "branch_key": "ahd&7393j", "is_referrable": 1 }),
					storage,
					function(err) {
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
					testUtils.params({ "link_identifier": 45433, "is_referrable": 1 }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/open, parameter link_identifier is not a string"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail with is_referrable as string, not number', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.open,
					testUtils.params({ "is_referrable": "1" }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/open, parameter is_referrable is not a number"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
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
					'https://api.branch.io/v1/profile', 'Endpoint correct'
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
					'https://api.branch.io/v1/profile?&data=' + encodedData +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);

				requests[0].callback();
			});

			it('should fail without identity', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(resources.profile, testUtils.params(), storage, function(err) {
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

		describe('/v1/logout', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key and session_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(5, done);
				server.request(resources.logout, testUtils.params({ }), storage, assert.done);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/logout', 'Endpoint correct',
					'Expected url for the first request'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"session_id=" + session_id +
						"&browser_fingerprint_id=" + browser_fingerprint_id +
						"&identity_id=" + identity_id +
						"&sdk=web" + config.version +
						"&branch_key=" + branch_sample_key,
					'Expected request body for the first request'
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

				var completeParams = testUtils.params({ });
				server.request(resources.logout, completeParams, storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');

				var encodedData = encodeURIComponent(
					utils.base64encode(goog.json.serialize(completeParams))
				);
				assert.strictEqual(
					requests[0].src,
					'https://api.branch.io/v1/logout?&data=' + encodedData +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);
				requests[0].callback();
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.logout,
					testUtils.params({ }, [ 'branch_key' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/logout missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without session_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.logout,
					testUtils.params({ }, [ 'session_id' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/logout missing parameter session_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/v1/referrals', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in identity_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(4, done);
				server.request(resources.referrals, testUtils.params({ }), storage, assert.done);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/referrals/' + identity_id +
						"?browser_fingerprint_id=" + browser_fingerprint_id +
						"&identity_id=" + identity_id +
						"&sdk=web" + config.version +
						'&session_id=' + session_id,
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
				server.request(resources.referrals, testUtils.params({ }), storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].src,
					'https://api.branch.io/v1/referrals/' + identity_id +
						"?browser_fingerprint_id=" + browser_fingerprint_id +
						'&identity_id=' + identity_id +
						'&sdk=web' + config.version +
						'&session_id=' + session_id +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);
				requests[0].callback();
			});

			it('should fail without identity_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.referrals,
					testUtils.params({ }, [ 'identity_id' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/referrals missing parameter identity_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/v1/credits', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in identity_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(4, done);
				server.request(resources.credits, testUtils.params({ }), storage, assert.done);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/credits/' + identity_id +
						"?browser_fingerprint_id=" + browser_fingerprint_id +
						'&identity_id=' + identity_id +
						'&sdk=web' + config.version +
						'&session_id=' + session_id,
					'Endpoint correct');
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
				server.request(resources.credits, testUtils.params({ }), storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].src,
					'https://api.branch.io/v1/credits/' + identity_id +
						"?browser_fingerprint_id=" + browser_fingerprint_id +
						'&identity_id=' + identity_id +
						'&sdk=web' + config.version +
						'&session_id=' + session_id +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct');
				requests[0].callback();
			});

			it('should fail without identity_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.credits,
					testUtils.params({ }, [ 'identity_id' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/credits missing parameter identity_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/_r', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			// branch_key is actually not required here
			it('should pass in sdk', function(done) {
				var assert = testUtils.plan(3, done);
				server.request(resources._r, testUtils.params(), storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].src,
					'https://bnc.lt/_r?sdk=web' + config.version +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct');
				requests[0].callback();
			});

			it('should fail without sdk', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources._r,
					testUtils.params({ }, [ 'sdk' ]),
					storage,
					function(err) {
						assert.strictEqual(err.message, "API request /_r missing parameter sdk");
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/v1/has_app', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in sdk', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.hasApp,
					testUtils.params({ }, [ 'identity_id', 'sdk', 'session_id' ]),
					storage,
					assert.done
				);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/has-app/' + branch_sample_key +
						'?browser_fingerprint_id=' + browser_fingerprint_id,
					'Endpoint correct'
				);
			});

			it('should fail without browser_fingerprint_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.hasApp,
					testUtils.params(
						{ },
						[ 'browser_fingerprint_id', 'identity_id', 'sdk', 'session_id' ]
					),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/has-app missing parameter browser_fingerprint_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'Request not made');
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.hasApp,
					testUtils.params({ }, [ 'branch_key', 'identity_id', 'sdk', 'session_id' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/has-app missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'Request not made');
			});
		});

		describe('/v1/redeem', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key, identity_id, amount, and bucket', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(5, done);
				server.request(
					resources.redeem,
					testUtils.params({ "amount": 1, "bucket": "testbucket" }),
					storage,
					assert.done
				);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/redeem',
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"amount=1" +
						"&bucket=testbucket" +
						"&identity_id=" + identity_id +
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

				var completeParams = testUtils.params({ "amount": 1, "bucket": "testbucket" });
				server.request(resources.redeem, completeParams, storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');

				var encodedData = encodeURIComponent(
					utils.base64encode(goog.json.serialize(completeParams))
				);
				assert.strictEqual(
					requests[0].src,
					'https://api.branch.io/v1/redeem?&data=' + encodedData +
						'&callback=branch_callback__' + (server._jsonp_callback_index - 1),
					'Endpoint correct'
				);

				requests[0].callback();
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.redeem,
					testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ 'branch_key' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/redeem missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without identity_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.redeem,
					testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ 'identity_id' ]),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/redeem missing parameter identity_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without amount', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.redeem,
					testUtils.params({ "bucket": "testbucket" }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/redeem missing parameter amount"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without bucket', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.redeem,
					testUtils.params({ "amount": 1 }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/redeem missing parameter bucket"
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
					'https://api.branch.io/v1/url',
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
					'https://api.branch.io/v1/url?&data=' + encodedData +
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
					'https://bnc.lt/3hpH54U-58?click=click',
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
					'https://bnc.lt/3hpH54U-58?click=click&callback=branch_callback__' +
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
						assert.strictEqual(err.message, "API request  missing parameter click");
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/v1/event', function() {
			var metadata = {
					"url": "testurl",
					"user_agent": "test_agent",
					"language": "test_language"
				};
			var metadataString = '&metadata=' + encodeURIComponent(JSON.stringify(metadata));
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key, session_id, event and metadata', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(5, done);

				server.request(
					resources.event,
					testUtils.params({ "event": "testevent", "metadata": metadata }),
					storage,
					assert.done
				);

				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					'https://api.branch.io/v1/event',
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'POST', 'Method correct');
				assert.strictEqual(
					requests[0].requestBody,
					"event=testevent" + metadataString +
						"&browser_fingerprint_id=" + browser_fingerprint_id +
						"&identity_id=" + identity_id +
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

				var completeParams = testUtils.params({
					"event": "testevent",
					"metadata": metadata
				});
				server.request(resources.event, completeParams, storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');

				var encodedData = encodeURIComponent(utils.base64encode(
					goog.json.serialize(completeParams)
				));
				assert.strictEqual(
					requests[0].src,
					'https://api.branch.io/v1/event?&data=' + encodedData +
						'&callback=branch_callback__' +
						(server._jsonp_callback_index - 1),
					'Endpoint correct'
				);
				requests[0].callback();
			});

			it('should fail without branch_key', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.event,
					testUtils.params(
						{ "event": "testevent", "metadata": metadata },
						[ 'branch_key' ]
					),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/event missing parameter branch_key or app_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without session_id', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.event,
					testUtils.params(
						{ "event": "testevent", "metadata": metadata },
						[ 'session_id' ]
					),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/event missing parameter session_id"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without event', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.event,
					testUtils.params({ "metadata": metadata }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/event missing parameter event"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			it('should fail without metadata', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.event,
					testUtils.params({ "event": "testevent" }),
					storage,
					function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/event missing parameter metadata"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});

			// param format and type tests
			it('should fail with metadata as string, not object', function(done) {
				var assert = testUtils.plan(2, done);
				server.request(
					resources.event,
					testUtils.params({
						"metadata": "Hello, I'm not an object.",
						"event": "testevent"
					}),
					storage, function(err) {
						assert.strictEqual(
							err.message,
							"API request /v1/event, parameter metadata is not an object"
						);
					}
				);
				assert.strictEqual(requests.length, 0, 'No request made');
			});
		});

		describe('/v1/creditHistory', function() {
			beforeEach(function() {
				requests = [];
				storage.clear();
			});

			it('should pass in branch_key and session_id', function(done) {
				storage['set']('use_jsonp', false);
				var assert = testUtils.plan(4, done);

				server.request(resources.creditHistory, testUtils.params(), storage, assert.done);
				assert.strictEqual(requests.length, 1, 'Request made');
				assert.strictEqual(
					requests[0].url,
					"https://api.branch.io/v1/credithistory" +
						"?browser_fingerprint_id=" + browser_fingerprint_id +
						"&identity_id=" + identity_id +
						"&sdk=web" + config.version +
						"&session_id=" + session_id +
						"&branch_key=" + branch_sample_key,
					'Endpoint correct'
				);
				assert.strictEqual(requests[0].method, 'GET', 'Method correct');

				requests[0].respond(
					200,
					{ "Content-Type": "application/json" },
					'[{"transaction":{' +
						'"id":"63317099967152399","bucket":"default","type":0,"amount":5' +
						',"date":"2014-11-18T18:09:59.600Z"},' +
						'"event":{"name":"web session start","metadata":{}},' +
						'"referrer":"Branch",' +
						'"referree":null}]'
				);
			});
		});
	});
});
