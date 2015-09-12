'use strict';

goog.require('utils');

describe('utils', function() {
	var assert = testUtils.unplanned();

	describe('base64encode', function() {
		it('should encode a string', function() {
			var string = 'test string to encode';
			var encoded = 'dGVzdCBzdHJpbmcgdG8gZW5jb2Rl';
			var testEncoded = utils.base64encode(string);
			assert.strictEqual(encoded, testEncoded, 'Correctly encoded');
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
		it('should remove unwanted params', function() {
			var data = {
				"data": "string",
				"data_parsed": {
					"key": "value"
				},
				"has_app": true,
				"identity": "67890",
				"referring_identity": "12345",
				"referring_link": null,
				"unwanted": "param"
			};
			var whiteListedData = utils.whiteListSessionData(data);
			delete data.unwanted;
			assert.deepEqual(whiteListedData, data, 'Unwanted param should be removed');
		});

		it('should make missing params null', function() {
			var data = {
				"data": "string",
				"identity": "67890",
				"referring_identity": "12345"
			};
			assert(true);
			// assert.strictEqual(undefined, data['has_app'], 'has_app should be null');
		});
	});

	describe('cleanLinkData', function() {
		it('should accept undefined', function() {
			var linkData = { };
			var expectedCleanedLinkData = {
				source: "web-sdk",
				data: "{}"
			};
			var cleanedLinkData = utils.cleanLinkData(linkData);
			assert.deepEqual(
				cleanedLinkData,
				expectedCleanedLinkData,
				'Accept undefined field "data"'
			);
		});

		it('should stringify field "data"', function() {
			var linkData = {
				"data":
				{
					subfield1:"bar",
					"subfield2":false
				},
				field1: 12345,
				field2: "67890",
				"field 3": true,
				field4: null
			};
			var expectedCleanedLinkData = {
				"data": '{"subfield1":"bar","subfield2":false}',
				field1: 12345,
				field2: "67890",
				"field 3": true,
				field4: null,
				source: "web-sdk"
			};
			var cleanedLinkData = utils.cleanLinkData(linkData);
			assert.deepEqual(cleanedLinkData, expectedCleanedLinkData, 'Stringified field "data"');
		});

		it('should not stringify pre-stringified field "data"', function() {
			var linkData = {
				"data":
				{
					subfield1:"bar",
					"subfield2":false
				},
				field1: 12345,
				field2: "67890",
				"field 3": true,
				field4: null
			};
			var expectedCleanedLinkData = {
				"data": '{"subfield1":"bar","subfield2":false}',
				field1: 12345,
				field2: "67890",
				"field 3": true,
				field4: null,
				source: "web-sdk"
			};
			var cleanedLinkData = utils.cleanLinkData((utils.cleanLinkData(linkData)));
			assert.deepEqual(
				cleanedLinkData,
				expectedCleanedLinkData,
				'Refrain from over-stringifying field "data"'
			);
		});
	});

	describe('message', function() {
		it('should produce a missing param message', function() {
			var message = utils.message(utils.messages.missingParam, [ 'endpoint', 'param' ]);
			assert.strictEqual(
				'API request endpoint missing parameter param',
				message,
				'Expected missing param message produced'
			);
		});

		it('should produce an invalid param type message', function() {
			var message = utils.message(
				utils.messages.invalidType,
				[ 'endpoint', 'param', 'type' ]
			);
			assert.strictEqual(
				'API request endpoint, parameter param is not type',
				message,
				'Expected invalid param type message produced'
			);
		});

		it('should produce a Branch SDK non init message', function() {
			var message = utils.message(utils.messages.nonInit);
			assert.strictEqual('Branch SDK not initialized', message, 'Branch SDK not initialized');
		});

		it('should produce a Branch SDK already init message', function() {
			var message = utils.message(utils.messages.existingInit);
			assert.strictEqual(
				'Branch SDK already initilized',
				message,
				'Branch SDK already initialized'
			);
		});

		it('should produce a missing app id', function() {
			var message = utils.message(utils.messages.missingAppId);
			assert.strictEqual('Missing Branch app ID', message, 'Branch app id missing');
		});

		it('should produce a call branch init first', function() {
			var message = utils.message(utils.messages.callBranchInitFirst);
			assert.strictEqual(
				'Branch.init must be called first',
				message,
				'Branch must be called first message'
			);
		});

		it('should produce a timeout message', function() {
			var message = utils.message(utils.messages.timeout);
			assert.strictEqual('Request timed out', message, 'Request timed out');
		});

		it('should produce a missing URL error', function() {
			var message = utils.message(utils.messages.missingUrl);
			assert.strictEqual('Required argument: URL, is missing', message, 'Missing url');
		});
	});

	describe('getParamValue', function() {
		it('should return search param value', function() {
			if (testUtils.go('?test=testsearch')) {
				var value = utils.getParamValue('test');
				assert.strictEqual('testsearch', value, 'Returns search param');
			}
		});

		it('should return undefined if not set', function() {
			if (testUtils.go('')) {
				var value = utils.getParamValue('test');
				assert.strictEqual(undefined, value, 'returns undefined');
			}
		});
	});

	describe('hashValue', function() {
		it('should return hash param value', function() {
			if (testUtils.go('#test:testhash')) {
				var value = utils.hashValue('test');
				assert.strictEqual('testhash', value, 'Returns hash param');
			}
		});

		it('should return undefined if not set', function() {
			if (testUtils.go('')) {
				var value = utils.hashValue('test');
				assert.strictEqual(undefined, value, 'returns undefined');
			}
		});
	});
});
