goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');

goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id */

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
			branch.init(branch_sample_key);
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
			sandbox.stub(utils, "whiteListSessionData", function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app":true
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert(!err, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, "/_r", "Request to open made");
			assert.deepEqual(requests[0].obj, { "v": config.version, branch_key: branch_sample_key }, 'Request params to _r correct');

			assert.deepEqual(requests[1].resource.endpoint, "/v1/open", "Request to open made");
			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": undefined,
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
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
			testUtils.go("#r:12345");
			var branch = initBranch(false), assert = testUtils.plan(2, done);

			branch.init(branch_sample_key, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '12345', 'click_id from link_identifier hash stored in session_id');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: "1234", something: "else" });

			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": '12345',
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');
		});

		it('should store in session and call open with link_identifier from get param', function(done) {
			testUtils.go("?_branch_match_id=67890");
			var branch = initBranch(false), assert = testUtils.plan(2, done);

			branch.init(branch_sample_key, function(err, data) {
				assert.equal(utils.readStore(branch._storage).click_id, '67890', 'click_id from link_identifier get param stored in session_id');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, { session_id: "1234", something: "else" });

			assert.deepEqual(requests[1].obj, {
				"branch_key": branch_sample_key,
				"link_identifier": '67890',
				"is_referrable": 1,
				"browser_fingerprint_id": browser_fingerprint_id
			}, 'Request to open params correct');
		});
	});

	describe('data', function() {
		it('should return whitelisted session storage data', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(2, done);
			var whitelistedData = {
				'data': 'data',
				'referring_identity': 'referring_user',
				'identity': 'identity',
				'has_app': false
			};
			sandbox.stub(utils, "whiteListSessionData", function(data) {
				return data;
			});
			sandbox.stub(utils, "readStore", function(storage) {
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

		var expectedRequest = testUtils.params({ "identity": "test_identity" }, [ 'session_id', 'browser_fingerprint_id' ]);
		var expectedResponse = {
			identity_id: '12345',
			link: 'url',
			referring_data: { },
			referring_identity: '12345'
		};
		it('should call api with identity', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);

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
		basicTests('track', [ 1, 2 ]);

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
				"session_id": session_id
			};

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
				"session_id": session_id
			};

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
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'identity_id', 'browser_fingerprint_id' ]), 'All params sent');
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
				}
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
			sandbox.stub(utils, "readKeyValue", function(key, storage) {
				return '12345';
			});

			var expectedRequest = {
				"link_url": "12345",
				"phone": "9999999999",
				"branch_key": branch_sample_key
			};

			branch.sendSMS('9999999999', linkData, function(err) { assert(!err, 'No error'); });

			assert.equal(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});

		it('should create new link if a click_id does not exist', function(done) {
			var branch = initBranch(true), assert = testUtils.plan(3, done);
			sandbox.stub(utils, "readKeyValue", function(key, storage) {
				return null;
			});
			sandbox.stub(branch, "link", function(linkData, callback) {
				callback(null, "https://bnc.lt/l/4FPE0v-04H");
			});

			branch.sendSMS('9999999999', linkData, function(err) { assert(!err, 'No error'); });
			assert.equal(requests.length, 1, 'Requests made');
			requests[0].callback(null, { "click_id":"4FWepu-03S" });
			assert.equal(requests.length, 2, 'Requests made');
			requests[1].callback();
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
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'session_id', 'branch_key', 'browser_fingerprint_id' ]), 'All params sent');
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
			assert.deepEqual(requests[0].obj, testUtils.params({ }, [ 'session_id', 'branch_key', 'browser_fingerprint_id' ]), 'All params sent');
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
			assert.deepEqual(requests[0].obj, testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ 'session_id', 'browser_fingerprint_id' ]), 'All params sent');
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

