goog.require('cordova_config');
goog.require('goog.json'); // jshint unused:false

/* globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, branch */

describe('Integration tests', function() {
	var requests = [ ], xhr, clock, jsonpCallback = 0;

	var clearBranchStorage = function() {
		sessionStorage.clear();
		localStorage.clear();
		var clearCookies = function(temp, perm) {
			var deleteCookie = function(cookie) {
				document.cookie = cookie.substring(0, cookie.indexOf('=')) + "=;expires=-1;path=/";
			};
			var cookieArray = document.cookie.split(';');
			for (var i = 0; i < cookieArray.length; i++) {
				var cookie = cookieArray[i];
				while (cookie.charAt(0) == ' ') { cookie = cookie.substring(1, cookie.length); }
				if (cookie.indexOf("BRANCH_WEBSDK_COOKIE") == 0) {
					if (temp && cookie.indexOf("branch_expiration_date=") == -1) { deleteCookie(cookie); }
					else if (perm && cookie.indexOf("branch_expiration_date=") > 0) { deleteCookie(cookie); }
				}
			}
		};
		clearCookies(true, true);
		branch._storage._store = {
			"TEMP": { },
			"PERM": { }
		};
	};

	before(function() {
		xhr = sinon.useFakeXMLHttpRequest();
		clock = sinon.useFakeTimers();
		xhr.onCreate = function(xhr) { requests.push(xhr); };
		sinon.stub(branch._server, "createScript", function(src) {
			requests.push({ src: src, callback: window[src.match(/callback=([^&]+)/)[1]] });
		});
		sinon.stub(cordova, "require", function() {
			return function() { arguments[0]({ }); }
		});
	});

	beforeEach(function() {
		clearBranchStorage();
		testUtils.go('');
		branch.identity_id = identity_id.toString();
		branch.device_fingerprint_id = identity_id.toString();
	});

	afterEach(function() {
		jsonpCallback++;
		requests = [];
	});

	after(function() {
		branch._server.createScript.restore();
		xhr.restore();
		clock.restore();
	});

	var sampleParams = {
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
	};

	var branchInit = function(assert, callback) {
		branch.init(device_fingerprint_id, { isReferrable: true }, callback);
		requests[0].respond(200,
				{ "Content-Type": "application/json" },
				'{ "identity_id":' + identity_id + ', "session_id":"123088518049178533", "device_fingerprint_id":"79336952217731267", "browser_fingerprint_id":null, "link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }');
		if (assert) {
			assert.equal(requests.length, 1);
			assert.equal(requests[0].requestBody, 'sdk=cordova' + config.version + '&app_id=' + device_fingerprint_id);
		}
	};

	describe('init', function() {
		it('should call api with params and version', function(done) {
			var assert = testUtils.plan(3, done);
			branchInit(assert, function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true,
						referring_link: null
					},
					'Expected response returned');
			});
		});

		it('should support being called without a callback', function(done) {
			var assert = testUtils.plan(2, done);
			branchInit(assert);
		});

		it('should return error to callback', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				jsonpCallback--;
				assert.equal(err.message, 'Error in API: 400');
			});
			requests[0].respond(400);
		});

		it('should attempt 5xx error three times total', function(done) {
			var assert = testUtils.plan(1, done);
			branch.init(browser_fingerprint_id, function(err) {
				assert.equal(err.message, 'Error in API: 500');
			});
			requests[0].respond(500);
			clock.tick(250);
			requests[1].respond(500);
			clock.tick(250);
			requests[2].respond(500);
		});

		it('should store in session and call open with link_identifier from hash', function(done) {
			var assert = testUtils.plan(1, done);
			if (testUtils.go("#r:12345")) {
				branchInit();
				assert.equal(true, requests[1].requestBody.indexOf('link_identifier=12345') > -1);
			} else { done(); }

		});
	});

	describe('setIdentity', function() {
		it('make two requests to init and set identity, and return expected data', function(done) {
			var assert = testUtils.plan(2, done);
			branchInit();
			branch.setIdentity('identity', function(err, data) {
				assert.deepEqual(data,
					{
						"identity_id": identity_id,
						"link_click_id":"114750153298026746",
						"link":"https://bnc.lt/i/4LYQTXE0_k",
						"referring_data_parsed": null
					},
					'Expected response returned'
				);
			});
			assert.equal(requests.length, 2);
			requests[1].respond(200,
				{ "Content-Type": "application/json" },
				'{ "identity_id":' + identity_id + ', "link_click_id":"114750153298026746", "link":"https://bnc.lt/i/4LYQTXE0_k" }');
		});
	});

	describe('data', function() {
		it('should make two requests and return session data', function(done) {
			var assert = testUtils.plan(4, done);
			branchInit(assert);
			branch.data(function(err, data) {
				assert.deepEqual(data,
					{
						data: null,
						referring_identity: null,
						identity: "Branch",
						has_app: true,
						referring_link: null
					});
			});
			assert.equal(requests.length, 1);
		});
	});

	describe('logout', function() {
		it('should make three requests and logout session', function(done) {
			var assert = testUtils.plan(4, done);
			branchInit(assert);
			branch.logout(function(err) {
				assert.equal(err, null);
			});
			assert.equal(requests.length, 2);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{"session_id":"124235352855552203","identity_id":' + identity_id + ',"link":"https://bnc.lt/i/4tLqIdk017"}');
		});
	});

	describe('track', function() {
		it('should make three requests and return undefined, no metadata', function(done) {
			var assert = testUtils.plan(6, done);
			branchInit(assert);
			branch.track('track', { }, function(err, data) {
				assert.equal(data, undefined);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ }');
		});

		it('should make three requests and return undefined, with metadata', function(done) {
			var assert = testUtils.plan(6, done);
			var testMetadata = { "test": "meta_data" };
			branchInit(assert);
			branch.track('track', testMetadata, function(err, data) {
				assert.equal(data, undefined);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				JSON.stringify(testMetadata));
		});
	});

	describe('link', function() {
		it('should make three requests and return short link', function(done) {
			var assert = testUtils.plan(6, done);
			branchInit(assert);
			branch.link(sampleParams, function(err, data) {
				assert.equal(data, "https://bnc.lt/l/4manXlk0AJ");
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "url":"https://bnc.lt/l/4manXlk0AJ" }');
		});
	});

	describe('referrals', function() {
		it('should make three requests and return referral data', function(done) {
			var assert = testUtils.plan(6, done);
			var expectedResponse = { "install": { "total": 5, "unique": 2 }, "open": { "total": 4, "unique": 3 }, "buy": { "total": 7, "unique": 3 } };
			branchInit(assert);
			branch.referrals(function(err, data) {
				assert.deepEqual(data, expectedResponse);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "install": { "total": 5, "unique": 2 }, "open": { "total": 4, "unique": 3 }, "buy": { "total": 7, "unique": 3 } }');
		});
	});

	describe('credits', function() {
		it('should make three requests and return credits', function(done) {
			var assert = testUtils.plan(6, done);
			var expectedResponse = { "default":"0" };
			branchInit(assert);
			branch.credits(function(err, data) {
				assert.deepEqual(data, expectedResponse);
			});
			assert.equal(requests.length, 3);
			requests[2].respond(200,
				{ "Content-Type": "application/json" },
				'{ "default":"0" }');
		});
	});
});
