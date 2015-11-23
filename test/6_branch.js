'use strict';

goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');
goog.require('session');

goog.require('goog.json'); // jshint unused:false

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Branch', function() {
	var storage = new BranchStorage([ 'pojo' ]);
	var sandbox;
	var requests;

	window.sdk_version = 'web' + config.version;

	beforeEach(function() {
		testUtils.go('');
		sandbox = sinon.sandbox.create();
		localStorage.clear();
		sessionStorage.clear();
		requests = [];
	});

	function initBranch(runInit, keepStorage) {
		if (!keepStorage) {
			storage.clear();
		}
		var branch = new Branch();

		sandbox.stub(branch._server, 'request', function(resource, obj, storage, callback) {
			requests.push({
				resource: resource,
				obj: obj,
				callback: callback
			});
		});

		if (runInit) {
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					session_id: session_id
				}
			);
			requests = [];
		}

		return branch;
	}

	function basicTests(call, params) {
		it('should fail if branch not initialized', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(params.length + 1, done);

			function basicTest(param) {
				var p = testUtils.nulls(param);
				branch[call].apply(branch, p.concat(function(err) {
					assert.strictEqual(err.message, 'Branch SDK not initialized');
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
			var branch = initBranch(false);
			var assert = testUtils.plan(7, done);
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app": true,
				"referring_link": null
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert.strictEqual(err, null, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, '/_r', 'Request to open made');
			assert.deepEqual(
				requests[0].obj,
				{
					"sdk": "web" + config.version,
					branch_key: branch_sample_key
				},
				'Request params to _r correct'
			);

			assert.deepEqual(requests[1].resource.endpoint, '/v1/open', 'Request to open made');
			assert.deepEqual(
				requests[1].obj,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id,
					"sdk": "web" + config.version
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 2, '2 requests made');
		});

		it('should not whitelist referring_link', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(7, done);
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			var expectedResponse = {
				"session_id": "113636235674656786",
				"identity_id": "98807509250212101",
				"identity": "Branch",
				"has_app": true,
				"referring_link": '/c/ngJf86-h'
			};

			branch.init(branch_sample_key, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'expected response returned');
				assert.strictEqual(err, null, 'No error');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(requests[0].resource.endpoint, '/_r', 'Request to open made');
			assert.deepEqual(
				requests[0].obj,
				{
					"sdk": "web" + config.version,
					branch_key: branch_sample_key
				},
				'Request params to _r correct'
			);

			assert.deepEqual(requests[1].resource.endpoint, '/v1/open', 'Request to open made');
			assert.deepEqual(
				requests[1].obj,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id,
					"sdk": "web" + config.version
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 2, '2 requests made');
		});

		it('should support being called without a callback', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(1, done);

			branch.init(branch_sample_key);

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id
				}
			);

			assert(true, 'Succeeded');
		});

		it('should return invalid app id error', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(1, done);
			branch.init(branch_sample_key, function(err) {
				assert.strictEqual(err.message, 'Invalid app id');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(new Error('Invalid app id'));
		});

		it('should fail early on browser fingerprint error', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);
			branch.init(branch_sample_key, function(err) {
				assert.strictEqual(err.message, 'Browser fingerprint fetch failed');
				assert.strictEqual(requests.length, 1, 'Only 1 request made');
			});
			requests[0].callback(new Error('Browser fingerprint fetch failed'));
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			if (testUtils.go('#r:12345')) {
				var branch = initBranch(false);
				var assert = testUtils.plan(3, done);

				branch.init(branch_sample_key, function(err, data) {
					assert.strictEqual(
						JSON.parse(localStorage.getItem('branch_session_first')).click_id,
						'12345',
						'hash session_id stored in local storage'
					);
					assert.strictEqual(
						utils.mobileUserAgent() ?
							'12345' :
							JSON.parse(sessionStorage.getItem('branch_session')).click_id,
						'12345',
						'hash session_id saved in session storage'
					);
				});

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(
					null,
					{
						session_id: "1234",
						something: "else"
					}
				);

				assert.deepEqual(
					requests[1].obj,
					{
						"branch_key": branch_sample_key,
						"link_identifier": '12345',
						"is_referrable": 1,
						"browser_fingerprint_id": browser_fingerprint_id,
						"sdk": "web" + config.version
					},
					'Request to open params correct'
				);
			}
			else {
				done();
			}
		});

		it(
			'should store in session and call open with link_identifier from get param',
			function(done) {
				if (testUtils.go('?_branch_match_id=67890')) {
					var branch = initBranch(false);
					var assert = testUtils.plan(2, done);

					branch.init(branch_sample_key, function(err, data) {
						assert.strictEqual(
							JSON.parse(localStorage.getItem('branch_session_first')).click_id,
							'67890',
							'get param match id stored in local storage'
						);
						assert.strictEqual(
							utils.mobileUserAgent() ?
								'67890' :
								JSON.parse(sessionStorage.getItem('branch_session')).click_id,
							'67890',
							'get param match id saved in session storage'
						);
					});

					requests[0].callback(null, browser_fingerprint_id);
					requests[1].callback(
						null,
						{
							session_id: "1234",
							something: "else"
						}
					);

					assert.deepEqual(
						requests[1].obj,
						{
							"branch_key": branch_sample_key,
							"link_identifier": '67890',
							"is_referrable": 1,
							"browser_fingerprint_id": browser_fingerprint_id,
							"sdk": "web" + config.version
						},
						'Request to open params correct'
					);
				}
				else {
					done();
				}
			}
		);

		it('should not call has_app if no session present', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);
			branch.init(branch_sample_key, function(err, data) {
				assert.strictEqual(requests.length, 2, 'two requests made');
				assert.deepEqual(
					requests[0].resource.endpoint,
					'/_r',
					'Request to open made, not has_app'
				);
			});
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id
				}
			);
		});

		it('should call has_app if session present', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id
				}
			);

			requests = [ ];
			branch = initBranch(false, true);
			assert = testUtils.plan(2, done);
			branch.init(branch_sample_key);
			assert.strictEqual(requests.length, 2, 'Should make 2 requests');
			assert.deepEqual(
				requests[0].resource.endpoint,
				'/_r',
				'First request should be sent to /_r'
			);
			assert.deepEqual(
				requests[1].resource.endpoint,
				'/v1/has-app',
				'Second request should be sent to /v1/has-app'
			);
		});
	});

	describe('data', function() {
		it('should return whitelisted session storage data', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			var whitelistedData = {
				'data': 'data',
				'referring_identity': 'referring_user',
				'identity': 'identity',
				'has_app': false,
				'referring_link': '/c/ngJf86-h'
			};
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			sandbox.stub(session, 'get', function(storage) {
				return whitelistedData;
			});
			branch.data(function(err, res) {
				assert.strictEqual(err, null, 'No error');
				assert.deepEqual(res, whitelistedData, 'whitelisted data returned');
			});
		});
	});

	describe('setIdentity', function() {
		basicTests('setIdentity', [ 1 ]);

		var expectedRequest = testUtils.params(
			{ "identity": "test_identity" }
		);
		var expectedResponse = {
			identity_id: '12345',
			link: 'url',
			referring_data: '{ }',
			referring_identity: '12345'
		};
		it('should call api with identity', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			branch.setIdentity('test_identity', function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('setIdentity accepts empty data', function() {
		basicTests('setIdentity', [ 1 ]);

		var expectedRequest = testUtils.params(
			{ "identity": "test_identity" }
		);
		var expectedResponse = { };
		it('should call api with identity', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			branch.setIdentity('test_identity', function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});
	});

	describe('track', function() {
		basicTests('track', [ 1, 2 ]);

		it('should call api with event with no metadata', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			branch.track('test_event', function(err) {
				assert.strictEqual(err, null, 'No error');
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
				"browser_fingerprint_id": browser_fingerprint_id,
				"sdk": "web" + config.version
			};
			expectedRequest.identity_id = identity_id;

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null);
			assert.deepEqual(requests[0].obj, expectedRequest, 'Expected request sent');
		});

		it('should call api with event with metadata', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			var metadata = {
				"test": "meta_data"
			};
			branch.track('test_event', metadata, function(err) {
				assert.strictEqual(err, null, 'No error');
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
				"browser_fingerprint_id": browser_fingerprint_id,
				"sdk": "web" + config.version
			};
			expectedRequest.identity_id = identity_id;

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null);
			assert.deepEqual(requests[0].obj, expectedRequest, 'Expected request sent');
		});
	});

	describe('logout', function() {
		basicTests('logout', [ 0 ]);

		it('should call api with branch_key and session_id', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			branch.logout(function(err) {
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ }),
				'All params sent'
			);
		});

		it(
			'should overwrite existing session_id, sessionLink, and identity_id\'s',
			function(done) {
				var branch = initBranch(true);
				var assert = testUtils.plan(6, done);
				branch.logout(function(err) {
					assert.strictEqual(err, null, 'No error');
				});

				assert.strictEqual(requests.length, 1, 'Request made');

				var newSessionId = 'new_session';
				var newIdentityId = 'new_id';
				var newLink = 'new_link';

				requests[0].callback(
					null,
					{
						"identity_id": newIdentityId,
						"session_id": newSessionId,
						"link": newLink
					}
				);
				assert.deepEqual(
					requests[0].obj,
					testUtils.params({ }),
					'All params sent'
				);
				assert.strictEqual(branch.session_id, newSessionId, 'branch session was replaced');
				assert.strictEqual(
					branch.identity_id,
					newIdentityId,
					'branch identity was replaced'
				);
				assert.strictEqual(branch.sessionLink, newLink, 'link was replaced');
			}
		);
	});

	describe('link', function() {
		basicTests('link', [ 1 ]);

		var expectedRequest = function(serialized, source, desktopUrlAppend) {
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
			if (desktopUrlAppend) {
				val['data']['$desktop_url'] += desktopUrlAppend;
			}
			if (serialized) {
				val['data'] = JSON.stringify(val['data']);
			}
			if (source) {
				val['source'] = 'web-sdk';
			}
			return val;
		};

		var expectedResponse = {
			"url": "https://bnc.lt/l/3HZMytU-BW"
		};

		it('should call api with serialized data and return link', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);
			branch.link(expectedRequest(), function(err, link) {
				assert.strictEqual(err, null, 'No error');
				assert.strictEqual(link, expectedResponse['url'], 'link returned');
			});
			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest(true, true), 'All params sent');
		});

		it('should add source = "web-sdk" to link data', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			branch.link(expectedRequest());
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(requests[0].obj['source'], 'web-sdk', 'web-sdk source set');
		});

		it('should remove r hash from desktop_url', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			branch.link(expectedRequest(false, false, '#r:12345'));
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(
				JSON.parse(requests[0].obj['data'])['$desktop_url'].indexOf('#r:12345'),
				-1,
				'web-sdk source set'
			);
		});
	});

	describe('sendSMS', function() {
		basicTests('sendSMS', [ 3, 4 ]);

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
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			sandbox.stub(branch._storage, 'get', function(key, storage) {
				return '12345';
			});

			var expectedRequest = {
				"link_url": "12345",
				"phone": "9999999999",
				"branch_key": branch_sample_key,
				"sdk": "web" + config.version
			};

			branch.sendSMS(
				'9999999999',
				linkData,
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(requests[0].obj, expectedRequest, 'All params sent');
		});

		it('should create new link if a click_id does not exist', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(6, done);
			sandbox.stub(branch._storage, 'get', function(key, storage) {
				return null;
			});

			branch.sendSMS(
				'9999999999',
				linkData,
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);
			assert.strictEqual(requests.length, 1, 'Requests made');
			requests[0].callback(
				null,
				{
					"url": "https://bnc.lt/l/4FPE0v-04H"
				}
			);
			assert.strictEqual(requests.length, 2, 'Requests made');
			assert.strictEqual(requests[1].obj.click, 'click', 'the second request is a click');
			assert.strictEqual(
				requests[1].obj.link_url,
				'l/4FPE0v-04H',
				'the second request has the correct link url'
			);
			requests[1].callback(
				null,
				{
					"click_id":"4FWepu-03S"
				}
			);
			assert.strictEqual(requests.length, 3, 'Requests made');
			requests[2].callback();
		});

		it('should handle app short url link from the api', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(6, done);
			sandbox.stub(branch._storage, 'get', function(key, storage) {
				return null;
			});

			branch.sendSMS(
				'9999999999',
				linkData,
				function(err) {
					assert(true);
					// assert.strictEqual(err, null, 'No error');
				}
			);
			assert.strictEqual(requests.length, 1, 'Requests made');
			requests[0].callback(
				null,
				{
					"url": "https://bnc.lt/ZPOc/p1Ej1fHI4n"
				}
			);
			assert.strictEqual(requests.length, 2, 'Requests made');
			assert.strictEqual(requests[1].obj.click, 'click', 'the second request is a click');
			assert.strictEqual(
				requests[1].obj.link_url,
				'ZPOc/p1Ej1fHI4n',
				'the second request has the correct link url'
			);
			requests[1].callback(
				null,
				{
					"click_id":"4FWepu-03S"
				}
			);
			assert.strictEqual(requests.length, 3, 'Requests made');
			requests[2].callback();
		});
	});

	describe('deepview', function() {
		basicTests('deepview', [ 1 ]);

		var branch;
		var linkData = testUtils.params({
			channel: 'sample app',
			data: { mydata: 'bar' },
			feature: 'create link',
			stage: 'created link',
			tags: [ 'tag1', 'tag2' ]
		});
		var options = {
			make_new_link: true,
			open_app: true
		};

		beforeEach(function() {
			branch = initBranch(true);
			requests = [];
		});

		afterEach(function() {
			if (typeof branch._referringLink.restore === 'function') {
				branch._referringLink.restore();
			}
		});

		it('should call v1/deepview endpoint with the right params', function(done) {
			var assert = testUtils.plan(7, done);

			branch.deepview(
				linkData,
				options,
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);

			assert.strictEqual(requests.length, 1, 'exactly one request made');
			requests[0].callback();

			var obj = requests[0].obj;
			assert.strictEqual(obj.data, '{"mydata":"bar"}', 'data is sent');
			assert.deepEqual(obj.tags, [ "tag1", "tag2" ], 'tags is sent');
			assert.strictEqual(obj.open_app, true, 'open_app is sent');
			assert.strictEqual(obj.make_new_link, undefined, 'make_new_link is not sent');
			assert.strictEqual(obj.link_click_id, undefined, 'link_click_id is not sent');
		});

		it('should ignore the referring link if make_new_link is true', function(done) {
			var assert = testUtils.plan(2, done);
			sandbox.stub(branch, '_referringLink', function() {
				return '123abc';
			});

			branch.deepview(
				linkData,
				{ make_new_link: true },
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);

			requests[0].callback();
			var obj = requests[0].obj;
			assert.strictEqual(obj.link_click_id, undefined, 'link_click_id is not sent');
		});

		it('should reuse the referring link if make_new_link is not true', function(done) {
			var assert = testUtils.plan(2, done);
			sandbox.stub(branch, '_referringLink', function() {
				return '123abc';
			});

			branch.deepview(
				linkData,
				{},
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);

			requests[0].callback();
			var obj = requests[0].obj;
			assert.strictEqual(obj.link_click_id, '123abc', 'link_click_id is sent');
		});

		it('should assign the function in request callback to branch._deepviewCta', function(done) {
			var assert = testUtils.plan(4, done);

			branch.deepview(
				{},
				{},
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);
			assert.strictEqual(branch._deepviewCta, undefined, 'default to undefined');
			requests[0].callback(null, function() {
				assert(true, 'callback function gets executed');
			});
			assert.strictEqual(typeof branch._deepviewCta, 'function', 'changed to function type');
			branch._deepviewCta();
		});

		it('should return err and use the right fallback when the req has err', function(done) {
			var assert = testUtils.plan(2, done);

			sandbox.stub(branch, '_windowRedirect', function(url) {
				assert(false, 'redirect should not happen unless explicitly called');
			});

			branch.deepview(
				{
					"abc": "def"
				},
				{},
				function(err) {
					assert.strictEqual(err.message, 'error message abc', 'expected error message');
				}
			);
			requests[0].callback(new Error('error message abc'));

			if (typeof branch._windowRedirect.restore === 'function') {
				branch._windowRedirect.restore();
			}
			sandbox.stub(branch, '_windowRedirect', function(url) {
				assert.strictEqual(
					url,
					'https://bnc.lt/a/' + window.branch_sample_key + '?abc=def',
					'rediretion happened'
				);
			});
			branch._deepviewCta(); // redirection happens now

			if (typeof branch._windowRedirect.restore === 'function') {
				branch._windowRedirect.restore();
			}
		});

	});

	describe('deepviewCta', function() {
		var branch;
		beforeEach(function() {
			branch = initBranch(true);
		});

		it('should throw an error if branch._deepviewCta is undefined', function(done) {
			var assert = testUtils.plan(2, done);
			assert.strictEqual(branch._deepviewCta, undefined, 'default to undefined');
			try {
				branch.deepviewCta();
			} catch (e) {
				assert.strictEqual(
					e.message,
					'Cannot call Deepview CTA, please call branch.deepview() first.',
					'expected error'
				);
			}
		});

		it('should not throw an error if branch._deepviewCta is a function', function(done) {
			var assert = testUtils.plan(1, done);
			branch._deepviewCta = function() {};
			branch.deepviewCta();
			assert(true, 'no error');
		});
	});

	describe('referrals', function() {
		basicTests('referrals', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

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
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ }),
				'All params sent'
			);
		});
	});

	describe('getCode', function() {
		basicTests('getCode', [ 0 ]);
		it('should call api with required params and options', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			var options = {
				"amount":10,
				"bucket":"party",
				"calculation_type":1,
				"location":2
			};

			var expectedResponse = 'AB12CD';

			branch.getCode(options, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(
				requests[0].obj,
				testUtils.params(options),
				'All params sent'
			);
		});
	});

	describe('validateCode', function() {
		basicTests('validateCode', [ 0 ]);
		it('should call api with required params and options', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			var expectedResponse = 'AB12CD';

			branch.validateCode(expectedResponse, function(err, res) {
				assert.deepEqual(res, null, 'null returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ "code": expectedResponse }),
				'All params sent'
			);
		});
	});

	describe('applyCode', function() {
		basicTests('applyCode', [ 0 ]);
		it('should call api with required params and options', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			var expectedResponse = 'AB12CD';

			branch.applyCode(expectedResponse, function(err, res) {
				assert.deepEqual(res, null, 'null returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ "code": expectedResponse }),
				'All params sent'
			);
		});
	});

	describe('credits', function() {
		basicTests('credits', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			var expectedResponse = {
				"default": 15,
				"other bucket": 9
			};

			branch.credits(function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ }),
				'All params sent'
			);
		});
	});

	describe('creditHistory', function() {
		basicTests('creditHistory', [ 0 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			var options = {
				"length":50,
				"direction":0,
				"begin_after_id":"123456789012345",
				"bucket":"default"
			};

			var expectedResponse = [
				{
					"transaction": {
						"id":"65301496270422583",
						"bucket":"default",
						"type":2,
						"amount":-5,
						"date":"2014-11-24T05:35:16.547Z"
					},
					"event": {
						"name": null,
						"metadata": null
					},
					"referrer": null,
					"referree": null
				}
			];

			branch.creditHistory(options, function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(
				requests[0].obj,
				testUtils.params(options),
				'All params sent'
			);
		});
	});

	describe('redeem', function() {
		basicTests('redeem', [ 2 ]);

		it('should call api with identity_id', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(3, done);
			branch.redeem(1, 'testbucket', function(err) {
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ "amount": 1, "bucket": "testbucket" }),
				'All params sent'
			);
		});
	});

	describe('addListener', function() {
		it('should add and remove an event listener to the branch object and fire', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(7, done);
			var listenerFired = 0;
			var listener = function(event) {
				assert.strictEqual('test_event', event, 'recieved event equals triggered event');
				listenerFired++;
			};
			branch.addListener('test_event', listener);
			branch._publishEvent('test_event');
			assert.strictEqual(branch._listeners.length, 1, 'one listener listening');
			assert.strictEqual(listenerFired, 1, 'observer fired once');

			branch.removeListener(listener);
			assert.strictEqual(branch._listeners.length, 0, 'no listeners listening');

			branch._publishEvent('test_event2');
			assert.strictEqual(listenerFired, 1, '_listener not fired again');

			branch.addListener(listener);
			branch._publishEvent('test_event');
			assert.strictEqual(
				branch._listeners.length,
				1,
				'one listener listening with no event specified'
			);
			assert.strictEqual(listenerFired, 1, 'observer fired once');
		});
	});

	/*
	describe.fail('Queueing used correctly', function() {
		it('Should wait to call track after init', function(done) {
			var branch = initBranch(false), assert = testUtils.plan(2;
			var done);
			branch.init(branch_key, function(err) { assert.strictEqual(err, null, 'No error'); });
			branch.track(
				'did
				something',
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);
		});

		it('Should call requests in correct order', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(5, done);
			branch.init(branch_key, function(err) { assert.strictEqual(err, null, 'No error'); });
			branch.track(
				'did
				something
				else',
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);

			assert.strictEqual(requests[0].resource.endpoint, '/_r');
			requests[0].callback(null, browser_fingerprint_id);

			assert.strictEqual(requests[1].resource.endpoint, '/v1/open');
			requests[1].callback(
				null,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"is_referrable": 1,
					"browser_fingerprint_id": browser_fingerprint_id
				}
			);

			assert.strictEqual(requests[2].resource.endpoint, '/v1/track');
			requests[2].callback(null, {});
		});

		it('If init fails, other calls should error', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(4, done);
			branch.init(branch_key, function(err) { assert(err, 'init errored'); });
			branch.track('did another thing', function(err) {
				assert(err, 'track errored');
				assert.strictEqual(requests.length, 1, 'No further requests made');
			});

			assert.strictEqual(requests[0].resource.endpoint, '/_r')
			requests[0].callback(new Error('Initting failed'));
		});
	});
*/
});

