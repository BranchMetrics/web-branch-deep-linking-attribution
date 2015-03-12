goog.require('utils');

describe('utils', function() {
	var assert = testUtils.unplanned();

	describe('base64encode', function() {
		it('should encode a string', function() {
			var string = 'test string to encode';
			var encoded = 'dGVzdCBzdHJpbmcgdG8gZW5jb2Rl';
			var testEncoded = utils.base64encode(string);
			assert.equal(encoded, testEncoded, 'Correctly encoded');
		});
	});

	describe('merge', function() {
		it('should merge to objects', function() {
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
		});
	});

	describe('whiteListSessionData', function() {
		it('should filter unwanted params', function() {
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
		});

		it('should make missing params null', function() {
			var data = {
				"data": {
					"sample": "data"
				},
				"referring_identity": "12345",
				"identity": "67890"
			};
			var whiteListedData = utils.whiteListSessionData(data);
			assert.equal(null, data["has_app"], 'Make has_app null');
		});
	});

	describe('message', function() {
		it('should produce a missing param message', function() {
			var message = utils.message(utils.messages.missingParam, [ 'endpoint', 'param' ]);
			assert.equal('API request endpoint missing parameter param', message, 'Expected missing param message produced');
		});

		it('should produce an invalid param type message', function() {
			var message = utils.message(utils.messages.invalidType, [ 'endpoint', 'param', 'type' ]);
			assert.equal('API request endpoint, parameter param is not type', message, 'Expected invalid param type message produced');
		});

		it('should produce a Branch SDK non init message', function() {
			var message = utils.message(utils.messages.nonInit);
			assert.equal('Branch SDK not initialized', message, 'Branch SDK not initialized');
		});

		it('should produce a Branch SDK already init message', function() {
			var message = utils.message(utils.messages.existingInit);
			assert.equal('Branch SDK already initilized', message, 'Branch SDK already initialized');
		});

		it('should produce a missing app id', function() {
			var message = utils.message(utils.messages.missingAppId);
			assert.equal('Missing Branch app ID', message, 'Branch app id missing');
		});

		it('should produce a call branch init first', function() {
			var message = utils.message(utils.messages.callBranchInitFirst);
			assert.equal('Branch.init must be called first', message, 'Branch must be called first message');
		});

		it('should produce a timeout message', function() {
			var message = utils.message(utils.messages.timeout);
			assert.equal('Request timed out', message, 'Request timed out');
		});

		it('should produce a missing URL error', function() {
			var message = utils.message(utils.messages.missingUrl);
			assert.equal('Required argument: URL, is missing', message, 'Missing url');
		});
	});

	describe("getParamValue", function() {
		it('should return search param value', function() {
			testUtils.go('?test=testsearch');
			var value = utils.getParamValue('test');
			assert.equal('testsearch', value, 'Returns search param');
		});

		it('should return undefined if not set', function() {
			testUtils.go('');
			var value = utils.getParamValue('test');
			assert.equal(undefined, value, 'returns undefined');
		});
	});

	describe("hashValue", function() {
		it('should return hash param value', function() {
			testUtils.go('#test:testhash');
			var value = utils.hashValue('test');
			assert.equal('testhash', value, 'Returns hash param');
		});

		it('should return undefined if not set', function() {
			testUtils.go('');
			var value = utils.hashValue('test');
			assert.equal(undefined, value, 'returns undefined');
		});
	});
});
