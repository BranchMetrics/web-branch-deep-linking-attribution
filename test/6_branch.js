'use strict';

goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');
goog.require('session');
goog.require('banner_utils');
goog.require('banner_html');
goog.require('safejson');

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
			requests[2].callback(null, {});
			requests = [];
		}

		return branch;
	}

	function basicTests(call, params) {
		it('should silently fail if branch not initialized', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(params.length * 2, done);

			function basicTest(param) {
				var p = testUtils.nulls(param);
				branch[call].apply(branch, p.concat(function(err) {
					assert.strictEqual(err.message, 'Branch SDK not initialized');
				}));
			}

			for (var i = 0; i < params.length; i++) {
				basicTest(params[i]);
			}
			done();
		});
	}

	var originalUa = navigator.userAgent;
	function setUserAgent(ua) {
		navigator.__defineGetter__("userAgent", function() {
			return ua;
		});
	}


	afterEach(function() {
		setUserAgent(originalUa);
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
			requests[2].callback(null, {});

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
					"initial_referrer": requests[1].obj.initial_referrer,
					"browser_fingerprint_id": browser_fingerprint_id,
					"alternative_browser_fingerprint_id": undefined,
					"sdk": "web" + config.version,
					"options": { }
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 3, '3 requests made');
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
			requests[2].callback(null, {});

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
					"initial_referrer": requests[1].obj.initial_referrer,
					"browser_fingerprint_id": browser_fingerprint_id,
					"alternative_browser_fingerprint_id": undefined,
					"sdk": "web" + config.version,
					"options": { }
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 3, '3 requests made');
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
			requests[2].callback(null, {});

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
				requests[2].callback(null, {});

				assert.deepEqual(
					requests[1].obj,
					{
						"branch_key": branch_sample_key,
						"link_identifier": '12345',
						"initial_referrer": requests[1].obj.initial_referrer,
						"browser_fingerprint_id": '12345',
						"alternative_browser_fingerprint_id": undefined,
						"sdk": "web" + config.version,
						"options": { }
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
					var assert = testUtils.plan(3, done);

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
					requests[2].callback(null, {});

					assert.deepEqual(
						requests[1].obj,
						{
							"branch_key": branch_sample_key,
							"link_identifier": '67890',
							"initial_referrer": requests[1].obj.initial_referrer,
							"browser_fingerprint_id": '67890',
							"alternative_browser_fingerprint_id": undefined,
							"sdk": "web" + config.version,
							"options": { }
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
			requests[2].callback(null, {});
		});

		it('should call has_app if session present but no link_identifier from get param',
			function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(3, done);
			branch.init(branch_sample_key);
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: browser_fingerprint_id,
					identity_id: identity_id,
					data: JSON.stringify({
						'$desktop_url': window.location.protocol + "//" +
										window.location.host +
										window.location.pathname
					})
				}
			);
			requests[2].callback(null, {});

			requests = [ ];
			branch = initBranch(false, true);
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

		it('should not call has_app if session and link_identifier present', function(done) {
			var assert = testUtils.plan(3, done);
			if (testUtils.go('?_branch_match_id=67890')) {

				var branch = initBranch(false);
				branch.init(branch_sample_key);

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: browser_fingerprint_id,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + "//" +
											window.location.host +
											window.location.pathname
						})
					}
				);

				branch = initBranch(false, true);
				branch.init(branch_sample_key);

				requests[3].callback(null, browser_fingerprint_id);
				requests[4].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: browser_fingerprint_id,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + "//" +
											window.location.host +
											window.location.pathname
						})
					}
				);
				requests[5].callback(null, {});

				assert.strictEqual(requests.length, 6, 'Should make 6 requests');
				assert.deepEqual(
					requests[3].resource.endpoint,
					'/_r',
					'First request should be sent to /_r'
				);
				assert.deepEqual(
					requests[4].resource.endpoint,
					'/v1/open',
					'Second request should be sent to /v1/open'
				);
			}
			else {
				assert.fail();
			}
		});

		it('should not call _r if userAgent is safari 11 or greater',	function(done) {
			var safari11Ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1';
			setUserAgent(safari11Ua);
			if (navigator.userAgent !== safari11Ua) {
				return done();
			}

			var branch = initBranch(false);
			var assert = testUtils.plan(1, done);


			branch.init(branch_sample_key);

			requests[0].callback(
				null,
				{
					session_id: "1234",
					something: "else"
				}
			);
			requests[1].callback(null, {});


			assert.deepEqual(
				requests[0].resource.endpoint,
				'/v1/open',
				'First request should be sent to /v1/open'
			);

			assert.deepEqual(
				requests[0].obj,
				{
					"branch_key": branch_sample_key,
					"link_identifier": undefined,
					"initial_referrer": requests[0].obj.initial_referrer,
					"browser_fingerprint_id": undefined,
					"alternative_browser_fingerprint_id": undefined,
					"sdk": "web" + config.version,
					"options": { }
				},
				'Request to open params correct'
			);
		});

		it('should not call _r if session present but no link_identifier and safari 11 or greater',
			function(done) {
			var safari11Ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1';
			setUserAgent(safari11Ua);
			if (navigator.userAgent !== safari11Ua) {
				return done();
			}

			var branch = initBranch(false);
			var assert = testUtils.plan(2, done);

			branch.init(branch_sample_key);
			requests[0].callback(
				null,
				{
					session_id: session_id,
					browser_fingerprint_id: undefined,
					identity_id: identity_id,
					data: JSON.stringify({
						'$desktop_url': window.location.protocol + "//" +
										window.location.host +
										window.location.pathname
					})
				}
			);
			requests[1].callback(null, {});

			requests = [ ];
			branch = initBranch(false, true);
			branch.init(branch_sample_key);

			assert.strictEqual(requests.length, 1, 'Should make 2 requests');
			assert.deepEqual(
				requests[0].resource.endpoint,
				'/v1/has-app',
				'Second request should be sent to /v1/has-app'
			);
		});

	});

	describe('data', function() {
		it('should return whitelisted session storage data', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(2, done);
			var data = safejson.stringify({ 'key_1': 'value_1' });
			var whitelistedData = {
				'data': data,
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
			{ "identity": "test_identity" },
			[ "_t" ]
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
			{ "identity": "test_identity" },
			[ "_t" ]
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
				"sdk": "web" + config.version,
				"initial_referrer": requests[0].obj.initial_referrer
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
				"sdk": "web" + config.version,
				"initial_referrer": requests[0].obj.initial_referrer
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
				testUtils.params({ }, [ "_t" ]),
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
					testUtils.params({ }, [ "_t" ]),
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
					'$og_image_url': 'http://branch.io/img/logo_icon_white.png',
					'$canonical_url': 'https://cdn.branch.io/example.html',
					'$og_video': null
				},
				"sdk": "web" + config.version
			}, [ "_t" ]);
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

		it('should call api with serialized data and return link with browser_fingerprint_id appended', function(done) {
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

		it('an error should be returned causing .link() to return a bnc.lt long link', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(20, done);
			branch.link(expectedRequest(), function(err, link) {
				var urlParser = document.createElement("a");
				urlParser.href = link;
				assert.strictEqual(urlParser.protocol, "https:", "Dynamic BNC link's protocol is correct");
				var hostWithoutPort = urlParser.host;
				if (hostWithoutPort.indexOf(':') > -1) {
					hostWithoutPort = hostWithoutPort.substring(0, hostWithoutPort.indexOf(':'));
				}
				assert.strictEqual(hostWithoutPort, "bnc.lt", "Dynamic BNC link's host correct");
				// making sure that this test doesn't fail in IE10
				var pathName = urlParser.pathname;
				if (pathName[0] === '/') {
					pathName = pathName.substring(1, pathName.length);
				}
				assert.strictEqual(pathName, "a/key_live_ljmAgMXod0f4V0wNEf4ZubhpphenI4wS", "Dynamic BNC link's pathname correct");

				var queryParams = urlParser.search.replace('?', '');
				queryParams = queryParams.split('&');

				var expectedQueryParams = {
					tags: [ 'tag1', 'tag2' ],
					channel: 'sample app',
					feature: 'create link',
					stage: 'created link',
					type: "1",
					sdk: 'web' + config.version,
					source: 'web-sdk',
					data: { "mydata":"bar", "$desktop_url":"https://cdn.branch.io/example.html", "$og_title":"Branch Metrics", "$og_description":"Branch Metrics", "$og_image_url":"http://branch.io/img/logo_icon_white.png", "$canonical_url":"https://cdn.branch.io/example.html", "$og_video":null }
				};
				var actual = {};
				for (var i = 0; i < queryParams.length; i++) {
					var keyValuePair = queryParams[i].split('=');
					var key = keyValuePair[0];
					var value = decodeURIComponent(keyValuePair[1]);
					if (key === 'tags') {
						if (!actual[key]) {
							actual[key] = [];
						}
						actual[key].push(value);
					}
					else {
						actual[key] = value;
					}
				}
				// jshint maxdepth:5
				for (var property in expectedQueryParams) {
					if (expectedQueryParams.hasOwnProperty(property)) {
						assert.strictEqual(true, actual.hasOwnProperty(property), "property exists in dynamic bnc link");
						var valActual = decodeURIComponent(actual[property]);
						if (property === 'data') {
							valActual = atob(valActual);
							valActual = JSON.parse(valActual);
							assert.deepEqual(expectedQueryParams['data'], valActual, 'data object appended correctly to dynamic BNC link');
						}
						else if (property === 'tags') {
							valActual = valActual.split(',');
							for (var t = 0; t < expectedQueryParams[property].length; t++) {
								var valueExists = expectedQueryParams[property].indexOf(valActual[t]) > -1;
								assert.strictEqual(true, valueExists, 'tag is correctly appended to dynamic bnc.lt link');
							}
						}
						else {
							assert.strictEqual(expectedQueryParams[property], valActual, 'property\'s value exists in dynamic bnc link');
						}
					}
				}
			});
			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(new Error('error message abc'));
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
		}, [ "_t" ]);

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
				'https://bnc.lt/l/4FPE0v-04H',
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
				'https://bnc.lt/ZPOc/p1Ej1fHI4n',
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
		}, [ "_t" ]);
		var options = {
			make_new_link: true,
			open_app: true,
			append_deeplink_path: true
		};
		var windowLocation = 'http://someurl/pluspath';
		var ogTitle = 'OGTitle';
		var ogDescription = 'OGDescription';
		var ogImage = 'OGImage';
		var ogVideo = 'OGVideo';


		beforeEach(function() {
			sinon.stub(utils, 'getWindowLocation')
				.returns(windowLocation);

			sinon.stub(utils, 'getHostedDeepLinkData')
				.returns({});

			// check starting with 4th call since first four are called by openGraphDataAsObject
			sinon.stub(utils, 'getOpenGraphContent')
				.onCall(8).returns(ogTitle)
				.onCall(9).returns(ogDescription)
				.onCall(10).returns(ogImage)
				.onCall(11).returns(ogVideo);

			branch = initBranch(true);
			requests = [];
		});

		afterEach(function() {
			if (typeof branch._referringLink.restore === 'function') {
				branch._referringLink.restore();
			}

			utils.getOpenGraphContent.restore();
			utils.getHostedDeepLinkData.restore();
			utils.getWindowLocation.restore();
		});

		it('should call v1/deepview endpoint with the right params for branch.deepview() calls', function(done) {
			var assert = testUtils.plan(7, done);
			var dataString = [
				'{',
				'"mydata":"bar",',
				'"$canonical_url":"' + windowLocation + '",',
				'"$og_title":"' + ogTitle + '",',
				'"$og_description":"' + ogDescription + '",',
				'"$og_image_url":"' + ogImage + '",',
				'"$og_video":"' + ogVideo + '"',
				'}'
			].join('');

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

			assert.strictEqual(obj.data, dataString, 'data is sent');
			assert.deepEqual(obj.tags, [ "tag1", "tag2" ], 'tags is sent');
			assert.strictEqual(obj.open_app, true, 'open_app is sent');
			// assert.strictEqual(obj.append_deeplink_path,
			// 	utils.mobileUserAgent() ? true : undefined,
			// 	'append_deeplink_path is sent');
			assert.strictEqual(obj.make_new_link, undefined, 'make_new_link is not sent');
			assert.strictEqual(obj.link_click_id, undefined, 'link_click_id is not sent');
			assert.strictEqual(obj.deepview_type, 'deepview', 'deepview_type is sent as \'deepview\'');
		});

		it('should call v1/deepview endpoint with the right params for branch.banner() calls', function(done) {
			var assert = testUtils.plan(2, done);

			// we're testing banner, which means we need to be mobile
			sandbox.stub(utils, 'mobileUserAgent', function(server, branchViewData, data) {
				return true;
			});

			// allow the banner to be shown
			sandbox.stub(banner_utils, 'shouldAppend', function(server, branchViewData, data) {
				return true;
			});

			// create a fake banner div so we don't fill up the dom with real banners
			var bannerDiv = document.createElement('iframe');
			bannerDiv.src = 'about:blank';
			bannerDiv.id = 'branch-mobile-action';
			document.body.appendChild(bannerDiv);
			sandbox.stub(banner_html, 'markup', function(server, branchViewData, data) {
				return bannerDiv;
			});


			var bannerDeeplinkData = {
				tags: [ 'custom' ],
				data: {
					mydata: 'From Banner',
					foo: 'bar',
					'$deeplink_path': 'open/item/5678'
				}
			};

			var banner = branch.banner(
				{
					immediate: true,
					disableHide: true,
					forgetHide: true
				},
				bannerDeeplinkData
			);

			assert.strictEqual(requests.length, 1, 'exactly one request made');

			var obj = requests[0].obj;
			assert.strictEqual(obj.deepview_type, 'banner', 'deepview_type is sent as \'banner\'');

			document.body.removeChild(bannerDiv);
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
			var assert = testUtils.plan(3, done);

			sandbox.stub(branch, '_windowRedirect', function(url) {
				assert(false, 'redirect should not happen unless explicitly called');
			});

			branch.deepview(
				{
					channel: 'testChannel',
					data: {
						akey: 'aval'
					}
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
			sandbox.stub(branch, '_windowRedirect', function(link) {
				var urlParser = document.createElement("a");
				urlParser.href = link;
				assert.strictEqual(urlParser.protocol, "https:", "Dynamic BNC link's protocol is correct");
				var hostWithoutPort = urlParser.host;
				if (hostWithoutPort.indexOf(':') > -1) {
					hostWithoutPort = hostWithoutPort.substring(0, hostWithoutPort.indexOf(':'));
				}
				assert.strictEqual(hostWithoutPort, "bnc.lt", "Dynamic BNC link's host correct");
				// making sure that this test doesn't fail in IE10
				var pathName = urlParser.pathname;
				if (pathName[0] === '/') {
					pathName = pathName.substring(1, pathName.length);
				}
				assert.strictEqual(pathName, "a/key_live_ljmAgMXod0f4V0wNEf4ZubhpphenI4wS", "Dynamic BNC link's pathname correct");

				var queryParams = urlParser.search.replace('?', '');
				queryParams = queryParams.split('&');

				var expectedQueryParams = {
					channel: 'testChannel',
					source: 'web-sdk',
					data: { "$canonical_url":"http://someurl/pluspath", "$og_title":"OGTitle", "$og_description":"OGDescription", "$og_image_url": "OGImage", "$og_video":"OGVideo", "akey": "aval" }
				};
				var actual = {};
				for (var i = 0; i < queryParams.length; i++) {
					var keyValuePair = queryParams[i].split('=');
					var value = decodeURIComponent(keyValuePair[1]);
					actual[keyValuePair[0]] = value;
				}
				for (var key in expectedQueryParams) {
					if (expectedQueryParams.hasOwnProperty(key)) {
						assert.strictEqual(true, actual.hasOwnProperty(key), "property exists in dynamic bnc link");
						var actualVal = decodeURIComponent(actual[key]);
						if (key === 'data') {
							actualVal = atob(actualVal);
							actualVal = JSON.parse(actualVal);
							assert.deepEqual(expectedQueryParams['data'], actualVal, 'data object appended correctly to dynamic BNC link');
						}
						else {
							assert.strictEqual(expectedQueryParams[key], actualVal, 'property\'s value exists in dynamic bnc link');
						}
					}
				}
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
			branch.deepviewCta(function(err) {
				assert.strictEqual(
					err.message,
					'Cannot call Deepview CTA, please call branch.deepview() first',
					'error returned through callback correctly in normal operation'
				);
			});
		});

		it('should throw an error if tracking is disabled and branch._deepviewCta is undefined', function(done) {
			var assert = testUtils.plan(2, done);
			assert.strictEqual(branch._deepviewCta, undefined, 'default to undefined');
			branch.disableTracking();
			branch.deepviewCta(function(err) {
				assert.strictEqual(
					err.message,
					'Requested operation cannot be completed since tracking is disabled',
					'error returned through callback correctly when tracking is disabled'
				);
			});
		});

		it('should not throw an error if branch._deepviewCta is a function', function(done) {
			var assert = testUtils.plan(1, done);
			branch._deepviewCta = function() {};
			branch.deepviewCta(function(err) {
				assert.strictEqual(err, undefined, 'no error should be present in callback');
			});
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
				testUtils.params({ }, [ "_t" ]),
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
				testUtils.params(options, [ "_t" ]),
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
				testUtils.params({ "code": expectedResponse }, [ "_t" ]),
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
				testUtils.params({ "code": expectedResponse }, [ "_t" ]),
				'All params sent'
			);
		});
	});

	describe('credits', function() {
		basicTests('credits', [ 0 ]);

		it('should call api with identity', function(done) {
			var branch = initBranch(true);
			var assert = testUtils.plan(4, done);

			var expectedResponse = {
				"default": 15,
				"other bucket": 9
			};

			var expectedResponseSetIdentity = {
				identity_id: '12345',
				link: 'url',
				referring_data: '{ }',
				referring_identity: '12345'
			};

			branch.setIdentity('foo', function(err, res) {});
			requests[0].callback(null, expectedResponseSetIdentity);

			branch.credits(function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 2, 'Request made');
			requests[1].callback(null, expectedResponse);

			assert.deepEqual(
				requests[1].obj,
				testUtils.params({ identity: 'foo', identity_id: "12345" }, [ "_t" ]),
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
				testUtils.params(options, [ "_t" ]),
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
				testUtils.params({ "amount": 1, "bucket": "testbucket" }, [ "_t" ]),
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
			assert.strictEqual(listenerFired, 2, 'historically, observer fired twice');
		});
	});

	describe('disableTracking() tests', function() {
		it('Flow with branch.init(), branch.disableTracking(true), branch.disableTracking(false)', function(done) {
			var branch = initBranch(false);
			var assert = testUtils.plan(6, done);
			branch.init(branch_sample_key, function(err, data) {
				assert.strictEqual(err, null, 'No error');
			});
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: "1234",
					something: "else"
				}
			);
			requests[2].callback(null, {});

			assert.strictEqual('{"session_id":"1234","something":"else"}', sessionStorage.getItem('branch_session'), 'data stored in session storage is correct');
			assert.strictEqual('{"session_id":"1234","something":"else"}', localStorage.getItem('branch_session_first'), 'data stored in local storage is correct');

			branch.disableTracking(true);
			assert.strictEqual("{}", sessionStorage.getItem('branch_session'), 'data stored in session storage is correct');
			assert.strictEqual("{}", localStorage.getItem('branch_session_first'), 'data stored in local storage is correct');

			branch.disableTracking(false);
			requests[3].callback(null, browser_fingerprint_id);
			requests[4].callback(
				null,
				{
					session_id: "1234",
					something: "else"
				}
			);
			requests[5].callback(null, {});
			assert.strictEqual('{"session_id":"1234","something":"else"}', sessionStorage.getItem('branch_session'), 'data stored in session storage is correct');
			assert.strictEqual('{"session_id":"1234","something":"else"}', localStorage.getItem('branch_session_first'), 'data stored in local storage is correct');
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

