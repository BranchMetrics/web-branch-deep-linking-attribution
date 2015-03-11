goog.require('utils');

describe('utils', function() {
	var searchStub = sinon.stub(utils, "getLocationSearch");
	var hashStub = sinon.stub(utils, "getLocationHash");

	describe('base64encode', function() {
		it('should encode a string', function(done) {
			var string = 'test string to encode';
			var encoded = 'dGVzdCBzdHJpbmcgdG8gZW5jb2Rl';
			var testEncoded = utils.base64encode(string);
			assert.equal(encoded, testEncoded, 'Correctly encoded');
			done();
		});
	});

	describe('merge', function() {
		it('should merge to objects', function(done) {
			var obj1 = { "simple": "object" };
			var obj2 = {
				"nested": {
					"object": "here"
				}
			};
			var expectedMerged = {
				"simple": "object",
				"nested": {
					"object": "here"
				}
			};
			var mergedObject = utils.merge(obj1, obj2);
			assert.deepEqual(mergedObject, expectedMerged, 'Correctly merged');
			done();
		});
	});

	describe('whiteListSessionData', function() {
		it('should filter unwanted params', function(done) {
			var data = {
				"data": {
					"sample": "data"
				},
				"referring_identity": "12345",
				"identity": "67890",
				"has_app": true,
				"unwanted": "param"
			};
			var whiteListedData = utils.whiteListSessionData(data);
			delete data["unwanted"];
			assert.deepEqual(whiteListedData, data, 'Filtered unwanted param');
			done();
		});

		it('should make missing params null', function(done) {
			var data = {
				"data": {
					"sample": "data"
				},
				"referring_identity": "12345",
				"identity": "67890"
			};
			var whiteListedData = utils.whiteListSessionData(data);
			assert.equal(null, data["has_app"], 'Make has_app null');
			done();
		});
	});

	describe('message', function() {
		it('should produce a missing param message', function(done) {
			var message = utils.message(utils.messages.missingParam, [ 'endpoint', 'param' ]);
			assert.equal('API request endpoint missing parameter param', message, 'Expected missing param message produced');
			done();
		});

		it('should produce an invalid param type message', function(done) {
			var message = utils.message(utils.messages.invalidType, [ 'endpoint', 'param', 'type' ]);
			assert.equal('API request endpoint, parameter param is not type', message, 'Expected invalid param type message produced');
			done();
		});

		it('should produce a Branch SDK non init message', function(done) {
			var message = utils.message(utils.messages.nonInit);
			assert.equal('Branch SDK not initialized', message, 'Branch SDK not initialized');
			done();
		});

		it('should produce a Branch SDK already init message', function(done) {
			var message = utils.message(utils.messages.existingInit);
			assert.equal('Branch SDK already initilized', message, 'Branch SDK already initialized');
			done();
		});

		it('should produce a missing app id', function(done) {
			var message = utils.message(utils.messages.missingAppId);
			assert.equal('Missing Branch app ID', message, 'Branch app id missing');
			done();
		});

		it('should produce a call branch init first', function(done) {
			var message = utils.message(utils.messages.callBranchInitFirst);
			assert.equal('Branch.init must be called first', message, 'Branch must be called first message');
			done();
		});

		it('should produce a timeout message', function(done) {
			var message = utils.message(utils.messages.timeout);
			assert.equal('Request timed out', message, 'Request timed out');
			done();
		});

		it('should produce a missing URL error', function(done) {
			var message = utils.message(utils.messages.missingUrl);
			assert.equal('Required argument: URL, is missing', message, 'Missing url');
			done();
		});
	})

	describe('urlValue', function() {
		searchStub.onCall(0).returns("?test=testsearch");
		searchStub.onCall(1).returns("");
		hashStub.onCall(0).returns("#test:testhash");
		hashStub.onCall(2).returns("#test:testhash");

		// both call 0
		it('should default to search param value', function(done) {
			var value = utils.urlValue('test');
			assert.equal('testsearch', value, 'Defaults to search param');
			done();
		});

		// both call 1
		it('should return hash value if not search param', function(done) {
			var value = utils.urlValue('test');
			assert.equal('testhash', value, 'Returns hash param');
			done();
		});

		// both call 2
		it('should return undefined if neither is set', function(done) {
			var value = utils.urlValue('test');
			assert.equal(undefined, value, 'returns undefined');
			done();
		});
	});

	describe("getParamValue", function() {
		searchStub.onCall(3).returns("?test=testsearch");
		searchStub.onCall(4).returns("");

		// search call 3
		it('should return search param value', function(done) {
			var value = utils.getParamValue('test');
			assert.equal('testsearch', value, 'Returns search param');
			done();
		});

		// search call 4
		it('should return undefined if not set', function(done) {
			var value = utils.getParamValue('test');
			assert.equal(undefined, value, 'returns undefined');
			done();
		});
	});

	describe("hashValue", function() {
		hashStub.onCall(3).returns("?test=testhash");
		hashStub.onCall(4).returns("");

		// hash call 3
		it('should return hash param value', function(done) {
			var value = utils.hashValue('test');
			assert.equal('testhash', value, 'Returns hash param');
			done();
		});

		// hash call 4
		it('should return undefined if not set', function(done) {
			var value = utils.hashValue('test');
			assert.equal(undefined, value, 'returns undefined');
			done();
		});
	});
});
