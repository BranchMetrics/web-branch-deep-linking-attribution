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

/* globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Branch', function() {
	const storage = new BranchStorage([ 'pojo' ]);
	let sandbox;
	let requests;

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
		const branch = new Branch();

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
			const branch = initBranch(false);
			const assert = testUtils.plan(params.length * 2, done);

			function basicTest(param) {
				const p = testUtils.nulls(param);
				branch[call].apply(branch, p.concat(function(err) {
					assert.strictEqual(err.message, 'Branch SDK not initialized');
				}));
			}

			for (let i = 0; i < params.length; i++) {
				basicTest(params[i]);
			}
			done();
		});
	}

	const originalUa = navigator.userAgent;
	function setUserAgent(ua) {
		navigator.__defineGetter__('userAgent', function() {
			return ua;
		});
	}


	afterEach(function() {
		setUserAgent(originalUa);
		sandbox.restore();
	});

	describe('init', function() {
		it('should call api with params and version', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(7, done);
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			const expectedResponse = {
				'session_id': '113636235674656786',
				'identity_id': '98807509250212101',
				'identity': 'Branch',
				'has_app': true,
				'referring_link': null
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
					'sdk': 'web' + config.version,
					'branch_key': branch_sample_key
				},
				'Request params to _r correct'
			);

			assert.deepEqual(requests[1].resource.endpoint, '/v1/open', 'Request to open made');
			assert.deepEqual(
				requests[1].obj,
				{
					'branch_key': branch_sample_key,
					'link_identifier': undefined,
					'initial_referrer': requests[1].obj.initial_referrer,
					'browser_fingerprint_id': browser_fingerprint_id,
					'alternative_browser_fingerprint_id': undefined,
					'sdk': 'web' + config.version,
					'options': { },
					'current_url': utils.getCurrentUrl(),
					'screen_height': utils.getScreenHeight(),
					'screen_width': utils.getScreenWidth()
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 3, '3 requests made');
		});

		it('should not whitelist referring_link', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(7, done);
			sandbox.stub(utils, 'whiteListSessionData', function(data) {
				return data;
			});
			const expectedResponse = {
				'session_id': '113636235674656786',
				'identity_id': '98807509250212101',
				'identity': 'Branch',
				'has_app': true,
				'referring_link': '/c/ngJf86-h'
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
					'sdk': 'web' + config.version,
					'branch_key': branch_sample_key
				},
				'Request params to _r correct'
			);

			assert.deepEqual(requests[1].resource.endpoint, '/v1/open', 'Request to open made');
			assert.deepEqual(
				requests[1].obj,
				{
					'branch_key': branch_sample_key,
					'link_identifier': undefined,
					'initial_referrer': requests[1].obj.initial_referrer,
					'browser_fingerprint_id': browser_fingerprint_id,
					'alternative_browser_fingerprint_id': undefined,
					'sdk': 'web' + config.version,
					'options': { },
					'current_url': utils.getCurrentUrl(),
					'screen_height': utils.getScreenHeight(),
					'screen_width': utils.getScreenWidth()
				},
				'Request to open params correct'
			);

			assert.strictEqual(requests.length, 3, '3 requests made');
		});

		it('should support being called without a callback', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(1, done);

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
			const branch = initBranch(false);
			const assert = testUtils.plan(1, done);
			branch.init(branch_sample_key, function(err) {
				assert.strictEqual(err.message, 'Invalid app id');
			});

			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(new Error('Invalid app id'));
		});

		it('should fail early on browser fingerprint error', function(done) {
			const branch = initBranch(false);
			const assert = testUtils.plan(2, done);
			branch.init(branch_sample_key, function(err) {
				assert.strictEqual(err.message, 'Browser fingerprint fetch failed');
				assert.strictEqual(requests.length, 1, 'Only 1 request made');
			});
			requests[0].callback(new Error('Browser fingerprint fetch failed'));
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			if (testUtils.go('#r:12345')) {
				const branch = initBranch(false);
				const assert = testUtils.plan(3, done);

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
						session_id: '1234',
						something: 'else'
					}
				);
				requests[2].callback(null, {});

				assert.deepEqual(
					requests[1].obj,
					{
						'branch_key': branch_sample_key,
						'link_identifier': '12345',
						'initial_referrer': requests[1].obj.initial_referrer,
						'browser_fingerprint_id': '12345',
						'alternative_browser_fingerprint_id': undefined,
						'sdk': 'web' + config.version,
						'options': { },
						'current_url': utils.getCurrentUrl(),
						'screen_height': utils.getScreenHeight(),
						'screen_width': utils.getScreenWidth()
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
					const branch = initBranch(false);
					const assert = testUtils.plan(3, done);

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
							session_id: '1234',
							something: 'else'
						}
					);
					requests[2].callback(null, {});

					assert.deepEqual(
						requests[1].obj,
						{
							'branch_key': branch_sample_key,
							'link_identifier': '67890',
							'initial_referrer': requests[1].obj.initial_referrer,
							'browser_fingerprint_id': '67890',
							'alternative_browser_fingerprint_id': undefined,
							'sdk': 'web' + config.version,
							'options': { },
							'current_url': utils.getCurrentUrl(),
							'screen_height': utils.getScreenHeight(),
							'screen_width': utils.getScreenWidth()
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
			const branch = initBranch(false);
			const assert = testUtils.plan(2, done);
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
				let branch = initBranch(false);
				const assert = testUtils.plan(3, done);
				branch.init(branch_sample_key);
				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: browser_fingerprint_id,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + '//' +
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
			const assert = testUtils.plan(3, done);
			if (testUtils.go('?_branch_match_id=67890')) {
				let branch = initBranch(false);
				branch.init(branch_sample_key);

				requests[0].callback(null, browser_fingerprint_id);
				requests[1].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: browser_fingerprint_id,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + '//' +
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
							'$desktop_url': window.location.protocol + '//' +
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
			const safari11Ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1';
			setUserAgent(safari11Ua);
			if (navigator.userAgent !== safari11Ua) {
				return done();
			}

			const branch = initBranch(false);
			const assert = testUtils.plan(1, done);

			branch.init(branch_sample_key);

			requests[0].callback(
				null,
				{
					session_id: '1234',
					something: 'else'
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
					'branch_key': branch_sample_key,
					'link_identifier': undefined,
					'initial_referrer': requests[0].obj.initial_referrer,
					'browser_fingerprint_id': undefined,
					'alternative_browser_fingerprint_id': undefined,
					'sdk': 'web' + config.version,
					'options': { },
					'current_url': utils.getCurrentUrl(),
					'screen_height': utils.getScreenHeight(),
					'screen_width': utils.getScreenWidth()
				},
				'Request to open params correct'
			);
		});

		it('should not call _r if session present but no link_identifier and safari 11 or greater',
			function(done) {
				const safari11Ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1';
				setUserAgent(safari11Ua);
				if (navigator.userAgent !== safari11Ua) {
					return done();
				}

				let branch = initBranch(false);
				const assert = testUtils.plan(2, done);

				branch.init(branch_sample_key);
				requests[0].callback(
					null,
					{
						session_id: session_id,
						browser_fingerprint_id: undefined,
						identity_id: identity_id,
						data: JSON.stringify({
							'$desktop_url': window.location.protocol + '//' +
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
			const branch = initBranch(true);
			const assert = testUtils.plan(2, done);
			const data = safejson.stringify({'key_1': 'value_1'});
			const whitelistedData = {
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
		it('should invoke callback with data when a non-null value for identity is passed', function(done) {
			const expectedResponse = {
				'session_id': '113636235674656786',
				'identity_id': '98807509250212101',
				'link': 'https://bnctestbed.app.link/?%24identity_id=98807509250212101',
				'developer_identity': 'test_identity'
			};
			const branch = initBranch(true);
			const assert = testUtils.plan(4, done);

			branch.setIdentity('test_identity', function(err, res) {
				assert.deepEqual(res, expectedResponse, 'response returned');
			});
		});

		it('should update identity and identity_id in local storage', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(2, done);
			branch.setIdentity('12345678', function(err, data) {
				const localData = safejson.parse(localStorage.getItem('branch_session_first'));
				assert.strictEqual(localData['identity'], '12345678');
				assert.strictEqual(localData['identity_id'], '7654321');
			});
			requests[0].callback(null, {identity: '12345678', identity_id: '7654321'});
		});

		it('should invoke callback with error when a null value for identity is passed', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(4, done);

			branch.setIdentity(null, function(err, res) {
				assert.strictEqual(err, utils.messages.missingIdentity, 'error matched for missing identity');
			});
		});
	});


	describe('track', function() {
		basicTests('track', [ 0 ]);
		const spy = sinon.spy(console, 'warn');
		it('should print console warning about method deprecation for track', function() {
			const branch = initBranch(true);
			const assert = testUtils.unplanned();
			branch.track();
			assert(spy.calledWith('track method currently supports only pageview event.'));
		});
	});

	describe('logout', function() {
		basicTests('logout', [ 0 ]);

		it('should call api with branch_key and session_id', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(3, done);
			branch.logout(function(err) {
				assert.strictEqual(err, null, 'No error');
			});

			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback();
			assert.deepEqual(
				requests[0].obj,
				testUtils.params({ }, [ '_t' ]),
				'All params sent'
			);
		});

		it(
			'should overwrite existing session_id, sessionLink, and identity_id\'s',
			function(done) {
				const branch = initBranch(true);
				const assert = testUtils.plan(6, done);
				branch.logout(function(err) {
					assert.strictEqual(err, null, 'No error');
				});

				assert.strictEqual(requests.length, 1, 'Request made');

				const newSessionId = 'new_session';
				const newIdentityId = 'new_id';
				const newLink = 'new_link';

				requests[0].callback(
					null,
					{
						'identity_id': newIdentityId,
						'session_id': newSessionId,
						'link': newLink
					}
				);
				assert.deepEqual(
					requests[0].obj,
					testUtils.params({ }, [ '_t' ]),
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

		const expectedRequest = function(serialized, source, desktopUrlAppend) {
			const val = testUtils.params({
				'tags': [ 'tag1', 'tag2' ],
				'channel': 'sample app',
				'feature': 'create link',
				'stage': 'created link',
				'type': 1,
				'data': {
					'mydata': 'bar',
					'$desktop_url': 'https://cdn.branch.io/example.html',
					'$og_title': 'Branch Metrics',
					'$og_description': 'Branch Metrics',
					'$og_image_url': 'http://branch.io/img/logo_icon_white.png',
					'$canonical_url': 'https://cdn.branch.io/example.html',
					'$og_video': null,
					'$og_type': 'product'
				},
				'sdk': 'web' + config.version
			}, [ '_t' ]);
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

		const expectedResponse = {
			'url': 'https://bnc.lt/l/3HZMytU-BW'
		};

		it('should call api with serialized data and return link with browser_fingerprint_id appended', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(4, done);
			branch.link(expectedRequest(), function(err, link) {
				assert.strictEqual(err, null, 'No error');
				assert.strictEqual(link, expectedResponse['url'], 'link returned');
			});
			assert.strictEqual(requests.length, 1, 'Request made');
			requests[0].callback(null, expectedResponse);
			assert.deepEqual(requests[0].obj, expectedRequest(true, true), 'All params sent');
		});

		it('an error should be returned causing .link() to return a bnc.lt long link', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(20, done);
			branch.link(expectedRequest(), function(err, link) {
				const urlParser = document.createElement('a');
				urlParser.href = link;
				assert.strictEqual(urlParser.protocol, 'https:', 'Dynamic BNC link\'s protocol is correct');
				let hostWithoutPort = urlParser.host;
				if (hostWithoutPort.indexOf(':') > -1) {
					hostWithoutPort = hostWithoutPort.substring(0, hostWithoutPort.indexOf(':'));
				}
				assert.strictEqual(hostWithoutPort, 'bnc.lt', 'Dynamic BNC link\'s host correct');
				// making sure that this test doesn't fail in IE10
				let pathName = urlParser.pathname;
				if (pathName[0] === '/') {
					pathName = pathName.substring(1, pathName.length);
				}
				assert.strictEqual(pathName, 'a/key_live_ljmAgMXod0f4V0wNEf4ZubhpphenI4wS', 'Dynamic BNC link\'s pathname correct');

				let queryParams = urlParser.search.replace('?', '');
				queryParams = queryParams.split('&');

				const expectedQueryParams = {
					tags: [ 'tag1', 'tag2' ],
					channel: 'sample app',
					feature: 'create link',
					stage: 'created link',
					type: '1',
					sdk: 'web' + config.version,
					source: 'web-sdk',
					data: {'mydata': 'bar', '$desktop_url': 'https://cdn.branch.io/example.html', '$og_title': 'Branch Metrics', '$og_description': 'Branch Metrics', '$og_image_url': 'http://branch.io/img/logo_icon_white.png', '$canonical_url': 'https://cdn.branch.io/example.html', '$og_video': null, '$og_type': 'product'}
				};
				const actual = {};
				for (let i = 0; i < queryParams.length; i++) {
					const keyValuePair = queryParams[i].split('=');
					const key = keyValuePair[0];
					const value = decodeURIComponent(keyValuePair[1]);
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
				for (const property in expectedQueryParams) {
					if (expectedQueryParams.hasOwnProperty(property)) {
						assert.strictEqual(true, actual.hasOwnProperty(property), 'property exists in dynamic bnc link');
						let valActual = decodeURIComponent(actual[property]);
						if (property === 'data') {
							valActual = atob(valActual);
							valActual = JSON.parse(valActual);
							assert.deepEqual(expectedQueryParams['data'], valActual, 'data object appended correctly to dynamic BNC link');
						}
						else if (property === 'tags') {
							valActual = valActual.split(',');
							for (let t = 0; t < expectedQueryParams[property].length; t++) {
								const valueExists = expectedQueryParams[property].indexOf(valActual[t]) > -1;
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
			const branch = initBranch(true);
			const assert = testUtils.plan(2, done);
			branch.link(expectedRequest());
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(requests[0].obj['source'], 'web-sdk', 'web-sdk source set');
		});

		it('should remove r hash from desktop_url', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(2, done);
			branch.link(expectedRequest(false, false, '#r:12345'));
			assert.strictEqual(requests.length, 1, 'Request made');
			assert.strictEqual(
				JSON.parse(requests[0].obj['data'])['$desktop_url'].indexOf('#r:12345'),
				-1,
				'web-sdk source set'
			);
		});
	});

	describe('banner', function() {
		basicTests('banner', [ 0 ]);

		// set to desktop
		sandbox.stub(utils, 'mobileUserAgent', function(server, branchViewData, data) {
			return false;
		});
		const spy = sinon.spy(console, 'info');
		it('should print console warning about method deprecation for sendMS', function() {
			const branch = initBranch(true);
			const assert = testUtils.unplanned();
			branch.banner();
			assert(spy.calledWith('banner functionality is not supported on desktop'));
		});
	});

	describe('deepview', function() {
		basicTests('deepview', [ 1 ]);

		let branch;
		const linkData = testUtils.params({
			channel: 'sample app',
			data: {mydata: 'bar'},
			feature: 'create link',
			stage: 'created link',
			tags: [ 'tag1', 'tag2' ]
		}, [ '_t' ]);
		const options = {
			make_new_link: true,
			open_app: true,
			append_deeplink_path: true
		};
		const windowLocation = 'http://someurl/pluspath';
		const ogTitle = 'OGTitle';
		const ogDescription = 'OGDescription';
		const ogImage = 'OGImage';
		const ogVideo = 'OGVideo';
		const ogType = 'OGType';

		beforeEach(function() {
			sinon.stub(utils, 'getWindowLocation')
				.returns(windowLocation);

			sinon.stub(utils, 'getHostedDeepLinkData')
				.returns({});

			// check starting with 10th call since first 9 are called by openGraphDataAsObject
			sinon.stub(utils, 'getOpenGraphContent')
				.onCall(10).returns(ogTitle)
				.onCall(11).returns(ogDescription)
				.onCall(12).returns(ogImage)
				.onCall(13).returns(ogVideo)
				.onCall(14).returns(ogType);

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
			const assert = testUtils.plan(7, done);
			const dataString = [
				'{',
				'"mydata":"bar",',
				'"$canonical_url":"' + windowLocation + '",',
				'"$og_title":"' + ogTitle + '",',
				'"$og_description":"' + ogDescription + '",',
				'"$og_image_url":"' + ogImage + '",',
				'"$og_video":"' + ogVideo + '",',
				'"$og_type":"' + ogType + '"',
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
			const obj = requests[0].obj;

			assert.strictEqual(obj.data, dataString, 'data is sent');
			assert.deepEqual(obj.tags, [ 'tag1', 'tag2' ], 'tags is sent');
			assert.strictEqual(obj.open_app, true, 'open_app is sent');
			// assert.strictEqual(obj.append_deeplink_path,
			// 	utils.mobileUserAgent() ? true : undefined,
			// 	'append_deeplink_path is sent');
			assert.strictEqual(obj.make_new_link, undefined, 'make_new_link is not sent');
			assert.strictEqual(obj.link_click_id, undefined, 'link_click_id is not sent');
			assert.strictEqual(obj.deepview_type, 'deepview', 'deepview_type is sent as \'deepview\'');
		});

		it('should call v1/deepview endpoint with the right params for branch.banner() calls', function(done) {
			const assert = testUtils.plan(2, done);

			// we're testing banner, which means we need to be mobile
			sandbox.stub(utils, 'mobileUserAgent', function(server, branchViewData, data) {
				return true;
			});

			// allow the banner to be shown
			sandbox.stub(banner_utils, 'shouldAppend', function(server, branchViewData, data) {
				return true;
			});

			// create a fake banner div so we don't fill up the dom with real banners
			const bannerDiv = document.createElement('iframe');
			bannerDiv.src = 'about:blank';
			bannerDiv.id = 'branch-mobile-action';
			document.body.appendChild(bannerDiv);
			sandbox.stub(banner_html, 'markup', function(server, branchViewData, data) {
				return bannerDiv;
			});

			assert.strictEqual(requests.length, 1, 'exactly one request made');

			const obj = requests[0].obj;
			assert.strictEqual(obj.deepview_type, 'banner', 'deepview_type is sent as \'banner\'');

			document.body.removeChild(bannerDiv);
		});

		it('should ignore the referring link if make_new_link is true', function(done) {
			const assert = testUtils.plan(2, done);
			sandbox.stub(branch, '_referringLink', function() {
				return '123abc';
			});

			branch.deepview(
				linkData,
				{make_new_link: true},
				function(err) {
					assert.strictEqual(err, null, 'No error');
				}
			);

			requests[0].callback();
			const obj = requests[0].obj;
			assert.strictEqual(obj.link_click_id, undefined, 'link_click_id is not sent');
		});

		it('should reuse the referring link if make_new_link is not true', function(done) {
			const assert = testUtils.plan(2, done);
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
			const obj = requests[0].obj;
			assert.strictEqual(obj.link_click_id, '123abc', 'link_click_id is sent');
		});

		it('should assign the function in request callback to branch._deepviewCta', function(done) {
			const assert = testUtils.plan(4, done);

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
			const assert = testUtils.plan(3, done);

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
				const urlParser = document.createElement('a');
				urlParser.href = link;
				assert.strictEqual(urlParser.protocol, 'https:', 'Dynamic BNC link\'s protocol is correct');
				let hostWithoutPort = urlParser.host;
				if (hostWithoutPort.indexOf(':') > -1) {
					hostWithoutPort = hostWithoutPort.substring(0, hostWithoutPort.indexOf(':'));
				}
				assert.strictEqual(hostWithoutPort, 'bnc.lt', 'Dynamic BNC link\'s host correct');
				// making sure that this test doesn't fail in IE10
				let pathName = urlParser.pathname;
				if (pathName[0] === '/') {
					pathName = pathName.substring(1, pathName.length);
				}
				assert.strictEqual(pathName, 'a/key_live_ljmAgMXod0f4V0wNEf4ZubhpphenI4wS', 'Dynamic BNC link\'s pathname correct');

				let queryParams = urlParser.search.replace('?', '');
				queryParams = queryParams.split('&');

				const expectedQueryParams = {
					channel: 'testChannel',
					source: 'web-sdk',
					data: {'$canonical_url': 'http://someurl/pluspath', '$og_title': 'OGTitle', '$og_description': 'OGDescription', '$og_image_url': 'OGImage', '$og_video': 'OGVideo', '$og_type': 'OGType', 'akey': 'aval'}
				};
				const actual = {};
				for (let i = 0; i < queryParams.length; i++) {
					const keyValuePair = queryParams[i].split('=');
					const value = decodeURIComponent(keyValuePair[1]);
					actual[keyValuePair[0]] = value;
				}
				for (const key in expectedQueryParams) {
					if (expectedQueryParams.hasOwnProperty(key)) {
						assert.strictEqual(true, actual.hasOwnProperty(key), 'property exists in dynamic bnc link');
						let actualVal = decodeURIComponent(actual[key]);
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
		let branch;
		beforeEach(function() {
			branch = initBranch(true);
		});

		it('should throw an error if branch._deepviewCta is undefined', function(done) {
			const assert = testUtils.plan(2, done);
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
			const assert = testUtils.plan(2, done);
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
			const assert = testUtils.plan(1, done);
			branch._deepviewCta = function() {};
			branch.deepviewCta(function(err) {
				assert.strictEqual(err, undefined, 'no error should be present in callback');
			});
		});
	});
	describe('addListener', function() {
		it('should add and remove an event listener to the branch object and fire', function(done) {
			const branch = initBranch(true);
			const assert = testUtils.plan(7, done);
			let listenerFired = 0;
			const listener = function(event) {
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
			const branch = initBranch(false);
			const assert = testUtils.plan(6, done);
			branch.init(branch_sample_key, function(err, data) {
				assert.strictEqual(err, null, 'No error');
			});
			requests[0].callback(null, browser_fingerprint_id);
			requests[1].callback(
				null,
				{
					session_id: '1234',
					something: 'else'
				}
			);
			requests[2].callback(null, {});

			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', sessionStorage.getItem('branch_session'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', localStorage.getItem('branch_session_first'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');

			branch.disableTracking(true);
			assert.strictEqual('{}', sessionStorage.getItem('branch_session'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
			assert.strictEqual('{}', localStorage.getItem('branch_session_first'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');

			branch.disableTracking(false);
			requests[3].callback(null, browser_fingerprint_id);
			requests[4].callback(
				null,
				{
					session_id: '1234',
					something: 'else'
				}
			);
			requests[5].callback(null, {});
			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', sessionStorage.getItem('branch_session'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
			assert.strictEqual('{"session_id":"1234","something":"else","identity":null}', localStorage.getItem('branch_session_first'), 'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]');
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
