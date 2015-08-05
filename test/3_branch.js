goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');
goog.require('session');

goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Branch', function() {
	var storage = new BranchStorage([ 'pojo' ]),
		sandbox,
		requests;

	window.sdk_version = "web" + config.version;

	beforeEach(function() {
		testUtils.go('');
		sandbox = sinon.sandbox.create();
		localStorage.clear();
		sessionStorage.clear();
		requests = [];
	});

	function initBranch(runInit) {
		storage.clear();
		var branch = new Branch();

		sandbox.stub(branch._server, "request", function(resource, obj, storage, callback) {
			requests.push({
				resource: resource,
				obj: obj,
				callback: callback
			});
		});

		if (runInit) {
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: session_id, browser_fingerprint_id: browser_fingerprint_id, identity_id: identity_id });
			requests = [];
		}

		return branch;
	}

	function basicTests(call, params) {
		it('should fail if branch not initialized', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(params.length * 1 + 1, done);

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
			sandbox.stub(utils, "whiteListSessionData", function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app":true,
				"referring_link": null
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert(!err, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "sdk": "web" + config.version, branch_key: branch_sample_key }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": undefined,
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id,
				"sdk": "web" + config.version
			}, 'Request to open params correct');

			assert.equal(requests.length, 2, '2 requests made');
		});

		it('should not whitelist referring_link', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(7, done);
			sandbox.stub(utils, "whiteListSessionData", function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app":true,
				"referring_link": '/c/ngJf86-h'
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert(!err, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "sdk": "web" + config.version, branch_key: branch_sample_key }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": undefined,
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id,
				"sdk": "web" + config.version
			}, 'Request to open params correct');

			assert.equal(requests.length, 2, '2 requests made');
		});

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
			if (testUtils.go("#r:12345")) {
				var branch = initBranch(false), assert = testUtils.plan(3, done);

				branch.init(branch_sample_key, function(err, data) {
					assert.equal('12345', JSON.parse(localStorage.getItem('branch_session_first')).click_id, 'hash session_id stored in local storage');
					assert.equal('12345', utils.mobileUserAgent() ? '12345' : JSON.parse(sessionStorage.getItem('branch_session')).click_id, 'hash session_id saved in session storage');
				});

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(null, { session_id: "1234", something: "else" });

				assert.deepEqual(requests[1].obj, {
					"branch_key": branch_sample_key,
					"link_identifier": '12345',
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id,
					"sdk": "web" + config.version
				}, 'Request to open params correct');
			}
			else { done(); }
		});

		it('should store in session and call open with link_identifier from get param', function(done) {
			if (testUtils.go("?_branch_match_id=67890")) {
				var branch = initBranch(false), assert = testUtils.plan(2, done);

				branch.init(branch_sample_key, function(err, data) {
					assert.equal('67890', JSON.parse(localStorage.getItem('branch_session_first')).click_id, 'get param match id stored in local storage');
					assert.equal('67890', utils.mobileUserAgent() ? '67890' : JSON.parse(sessionStorage.getItem('branch_session')).click_id, 'get param match id saved in session storage');
				});

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(null, { session_id: "1234", something: "else" });

				assert.deepEqual(requests[1].obj, {
					"branch_key": branch_sample_key,
					"link_identifier": '67890',
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id,
					"sdk": "web" + config.version
				}, 'Request to open params correct');
			}
			else { done(); }
		});
	});

	describe('data', function() {
		it('should return whitelisted session storage data', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(2, done);
			var whitelistedData = {
				'data': 'data',
				'referring_identity': 'referring_user',
				'identity': 'identity',
				'has_app': false,
				'referring_link':  '/c/ngJf86-h'
			};
			sandbox.stub(utils, "whiteListSessionData", function(data) {
				return data;
			});
			sandbox.stub(session, "get", function(storage) {
				return whitelistedData;
			});
			branch.data(function(err, res) {
				assert(!err, 'No error');
				assert.deepEqual(res, whitelistedData, 'whitelisted data returned');
			});
		});
	});

	describe('setIdentity', function() {
		basicTests('setIdentity', [ 1 ]);

		var expectedRequest = testUtils.params({ "identity": "test_identity" }, [ 'browser_fingerprint_id' ]);
		var expectedResponse = {
			identity_id: '12345',
			link: 'url',
			referring_data: '{ }',
			referring_identity: '12345'
		};
		it('should call api with identity', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			branch.setIdentity("test_identity", function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('track', function() {
		// basicTests('track', [ 1, 2 ]);

		it('should call api with event with no metadata', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.track("test_event", function(err) {
				assert(!err, 'No error');
			});
			var expectedRequest = {
				"event": "test_event",
				"metadata": {
					"url": document.URL,
					"user_agent": navigator.userAgent,
					"language": navigator.language
				},
				"branch_key": branch_sample_key,
				"session_id": session_id,
				"sdk": "web" + config.version
			};
			expectedRequest.identity_id = identity_id;

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null);
			assert.deepEqual(requests[0].obj, expectedRequest, 'Expected request sent');
		});

		it('should call api with event with metadata', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			var metadata = {
				"test": "meta_data"
			};
			branch.track("test_event", metadata, function(err) {
				assert(!err, 'No error');
			});
			var expectedRequest = {
				"event": "test_event",
				"metadata": {
					"url": document.URL,
					"user_agent": navigator.userAgent,
					"language": navigator.language,
					"test": "meta_data"
				},
				"branch_key": branch_sample_key,
				"session_id": session_id,
				"sdk": "web" + config.version
			};
			expectedRequest.identity_id = identity_id;

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null);
			assert.deepEqual(requests[0].obj, expectedRequest, 'Expected request sent');
		});
	});

	describe('logout', function() {
		basicTests('logout', [ 0 ]);

		it('should call api with branch_key and session_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.logout(function(err) {
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'browser_fingerprint_id' ]), 'All params sent');
		});

		it('should overwrite existing session_id, sessionLink, and identity_id\'s', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(6, done);
			branch.logout(function(err) {
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');

			var original_session_id = branch.session_id,
				original_identity_id = branch.identity_id,
				original_link = branch.sessionLink;
			var new_session_id = "new_session",
				new_identity_id = "new_id",
				new_link = "new_link";

			requests[0].callback(null, { "identity_id": new_identity_id, "session_id": new_session_id, "link": new_link });
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'browser_fingerprint_id' ]), 'All params sent');
			assert.equal(branch.session_id, new_session_id, "branch session was replaced");
			assert.equal(branch.identity_id, new_identity_id, "branch identity was replaced");
			assert.equal(branch.sessionLink, new_link, "link was replaced");
		});
	});

	describe('link', function() {
		basicTests('link', [ 1 ]);

		var expectedRequest = function(serialized, source, desktop_url_append) {
				var val = testUtils.params({
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
				},
				"sdk": "web" + config.version
			});
			if (desktop_url_append) {
				val['data']['$desktop_url'] += desktop_url_append;
			}
			if (serialized) {
				val['data'] = JSON.stringify(val['data']);
			}
			if (source) {
				val['source'] = 'web-sdk';
			}
			return val;
		};

		var expectedResponse = { "url": "https://bnc.lt/l/3HZMytU-BW" };

		it('should call api with serialized data and return link', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);
			branch.link(expectedRequest(), function(err, link) {
				assert(!err, 'No error');
				assert.equal(link, expectedResponse["url"], 'link returned');
			});
			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest(true, true), 'All params sent');
		});

		it('should add source = "web-sdk" to link data', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(2, done);
			branch.link(expectedRequest());
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(requests[0].obj['source'], 'web-sdk', 'web-sdk source set');
		});

		it('should remove r hash from desktop_url', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(2, done);
			branch.link(expectedRequest(false, false, '#r:12345'));
			assert.equal(requests.length, 1, 'Request made');
			assert.equal(JSON.parse(requests[0].obj['data'])['$desktop_url'].indexOf('#r:12345'), -1, 'web-sdk source set');
		});
	});

	describe('sendSMS', function() {
		// basicTests('sendSMS', [ 3, 4 ]);

		var linkData = testUtils.params({
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

		it('should call SMSLinkSend if a click_id already exists', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			sandbox.stub(branch._storage, "get", function(key, storage) {
				return '12345';
			});

			var expectedRequest = {
				"link_url": "12345",
				"phone": "9999999999",
				"branch_key": branch_sample_key,
				"sdk": "web" + config.version
			};

			branch.sendSMS('9999999999', linkData, function(err) { assert(!err, 'No error'); });

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});

		it('should create new link if a click_id does not exist', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);
			sandbox.stub(branch._storage, "get", function(key, storage) {
				return null;
			});

			branch.sendSMS('9999999999', linkData, function(err) { assert(!err, 'No error'); });
			assert.equal(requests.length, 1, 'Requests made');
			requests[0].callback(null, { "url": "https://bnc.lt/l/4FPE0v-04H" });
			assert.equal(requests.length, 2, 'Requests made');
			requests[1].callback(null, { "click_id":"4FWepu-03S" });
			assert.equal(requests.length, 3, 'Requests made');
			requests[2].callback();
		});
	});

	describe('referrals', function() {
		basicTests('referrals', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			var expectedResponse = {
				"install": {
					"total": 5,
					"unique": 2
				},
				"open": {
					"total": 4,
					"unique": 3
				},
				"buy": {
					"total": 7,
					"unique": 3
				}
			};

			branch.referrals(function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('getCode', function() {
		basicTests('getCode', [ 0 ]);
		it('should call api with required params and options', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			var options = {
				"amount":10,
				"bucket":"party",
				"calculation_type":1,
				"location":2
			};

			var expectedResponse = 'AB12CD';

			branch.getCode(options, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, testUtils.params(options, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('validateCode', function() {
		basicTests('validateCode', [ 0 ]);
		it('should call api with required params and options', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			var expectedResponse = 'AB12CD';

			branch.validateCode(expectedResponse, function(err, res) {
				assert.deepEqual(res, null, 'null returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, testUtils.params({ "code": expectedResponse }, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('applyCode', function() {
		basicTests('applyCode', [ 0 ]);
		it('should call api with required params and options', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			var expectedResponse = 'AB12CD';

			branch.applyCode(expectedResponse, function(err, res) {
				assert.deepEqual(res, null, 'null returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, testUtils.params({ "code": expectedResponse }, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('credits', function() {
		basicTests('credits', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			var expectedResponse = {
				"default": 15,
				"other bucket": 9
			};

			branch.credits(function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('creditHistory', function() {
		basicTests('creditHistory', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(4, done);

			var options = {
				"length":50,
				"direction":0,
				"begin_after_id":"123456789012345",
				"bucket":"default"
			};

			var expectedResponse = [ {
				"transaction": {
					"id":"65301496270422583",
					"bucket":"default",
					"type":2,
					"amount":-5,
					"date":"2014-11-24T05:35:16.547Z"
				},
				"event": {
					"name":null,
					"metadata":null
				},
				"referrer":null,
				"referree":null
			} ];

			branch.creditHistory(options, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, testUtils.params(options, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('redeem', function() {
		basicTests('redeem', [ 2 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			branch.redeem(1, "testbucket", function(err) {
				assert(!err, 'No error');
			});

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ 'browser_fingerprint_id' ]), 'All params sent');
		});
	});

	describe('addListener', function() {
		it('should add and remove an event listener to the branch object and fire', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(7, done);
			var listenerFired = 0;
			var listener = function(event) {
				assert.equal('test_event', event, 'recieved event equals triggered event');
				listenerFired++;
			};
			branch.addListener('test_event', listener);
			branch._publishEvent('test_event');
			assert.equal(branch._listeners.length, 1, 'one listener listening');
			assert.equal(listenerFired, 1, 'observer fired once');

			branch.removeListener(listener);
			assert.equal(branch._listeners.length, 0, 'no listeners listening');

			branch._publishEvent('test_event2');
			assert.equal(listenerFired, 1, '_listener not fired again');

			branch.addListener(listener);
			branch._publishEvent('test_event');
			assert.equal(branch._listeners.length, 1, 'one listener listening with no event specified');
			assert.equal(listenerFired, 1, 'observer fired once');
		});
	});

/*
	describe.fail('Queueing used correctly', function() {
		it('Should wait to call track after init', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(2, done);
			branch.init(branch_key, function(err) { assert(!err, 'No error'); });
			branch.track('did something', function(err) { assert(!err, 'No error'); });
		});

		it('Should call requests in correct order', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(5, done);
			branch.init(branch_key, function(err) { assert(!err, 'No error'); });
			branch.track('did something else', function(err) { assert(!err, 'No error'); });

			assert.equal(requests[0].resource.endpoint, '/_r');
			requests[0].callback(null, browser_fingerprint_id);

			assert.equal(requests[1].resource.endpoint, '/v1/open');
			requests[1].callback(null, { "branch_key": branch_sample_key, "link_identifier": undefined, "is_referrable": 1, "browser_fingerprint_id": browser_fingerprint_id });

			assert.equal(requests[2].resource.endpoint, '/v1/track');
			requests[2].callback(null, {});
		});

		it('If init fails, other calls should error', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(4, done);
			branch.init(branch_key, function(err) { assert(err, 'init errored'); });
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

