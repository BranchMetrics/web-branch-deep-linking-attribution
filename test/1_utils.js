'use strict';

goog.require('utils');

describe('utils', function() {
	var assert = testUtils.unplanned();

	describe('base64encode', function() {
		it('should encode a string', function() {
			var string = 'test string to encode';
			var expectedEncoded = 'dGVzdCBzdHJpbmcgdG8gZW5jb2Rl';
			assert.strictEqual(utils.base64encode(string), expectedEncoded, 'Correctly encoded');
		});
	});

	describe('merge', function() {
		it('should merge two objects despite duplication', function() {
			var obj1 = { "simple": "object" };
			var obj2 = {
				"simple": "object",
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
			assert.deepEqual(utils.merge(obj1, obj2), expectedMerged, 'Correctly merged');
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
			delete data.unwanted;
			assert.deepEqual(
				utils.whiteListSessionData(data),
				data,
				'Unwanted param should be removed'
			);
		});

		it('should make missing params null', function() {
			var data = {
				"data": "string",
				"identity": "67890",
				"referring_identity": "12345"
			};
			var whiteListedData = utils.whiteListSessionData(data);
			assert.strictEqual(whiteListedData['has_app'], null, 'has_app should be null');
		});
	});

	describe('cleanLinkData', function() {
		it('should accept empty linkData', function() {
			var linkData = { };
			var expectedCleanedLinkData = {
				source: "web-sdk",
				data: "{}"
			};
			assert.deepEqual(
				utils.cleanLinkData(linkData),
				expectedCleanedLinkData,
				'Accept empty linkData'
			);
		});

		it('should stringify field "data" and add "source"', function() {
			var linkData = {
				"data": {
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
			assert.deepEqual(
				utils.cleanLinkData(linkData),
				expectedCleanedLinkData,
				'Stringified field "data" and added "source"'
			);
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
			assert.deepEqual(
				utils.cleanLinkData((utils.cleanLinkData(linkData))),
				expectedCleanedLinkData,
				'Refrain from over-stringifying field "data"'
			);
		});
	});

	describe('message', function() {
		it('should produce a missing param message', function() {
			assert.strictEqual(
				utils.message(utils.messages.missingParam, [ 'endpoint', 'param' ]),
				'API request endpoint missing parameter param',
				'Expected missing param message produced'
			);
		});

		it('should produce an invalid param type message', function() {
			assert.strictEqual(
				utils.message(
					utils.messages.invalidType,
					[ 'endpoint', 'param', 'type' ]
				),
				'API request endpoint, parameter param is not type',
				'Expected invalid param type message produced'
			);
		});

		it('should produce a Branch SDK not init message', function() {
			assert.strictEqual(
				utils.message(utils.messages.nonInit),
				'Branch SDK not initialized',
				'Expected Branch SDK not init message produced'
			);
		});

		it('should produce a Branch SDK already init message', function() {
			assert.strictEqual(
				utils.message(utils.messages.existingInit),
				'Branch SDK already initilized',
				'Expected Branch SDK already initialized message produced'
			);
		});

		it('should produce a missing app id', function() {
			assert.strictEqual(
				utils.message(utils.messages.missingAppId),
				'Missing Branch app ID',
				'Expected Branch app id missing message produced'
			);
		});

		it('should produce a call branch init first', function() {
			assert.strictEqual(
				utils.message(utils.messages.callBranchInitFirst),
				'Branch.init must be called first',
				'Expected Branch must be called first message produced'
			);
		});

		it('should produce a timeout message', function() {
			assert.strictEqual(
				utils.message(utils.messages.timeout),
				'Request timed out',
				'Expected Request timed out message produced'
				);
		});

		it('should produce a missing URL error', function() {
			assert.strictEqual(
				utils.message(utils.messages.missingUrl),
				'Required argument: URL, is missing',
				'Expected Missing url message produced'
			);
		});
	});

	describe('getParamValue', function() {
		it('should return search param value', function() {
			if (testUtils.go('?test=testsearch')) {
				assert.strictEqual(
					utils.getParamValue('test'),
					'testsearch',
					'Returns search param'
				);
			}
		});

		it('should return undefined if not set', function() {
			if (testUtils.go('')) {
				assert.strictEqual(undefined, utils.getParamValue('test'), 'returns undefined');
			}
		});
	});

	describe('hashValue', function() {
		it('should return hash param value', function() {
			if (testUtils.go('#test:testhash')) {
				assert.strictEqual(
					utils.hashValue('test'),
					'testhash',
					'Returns hash param'
				);
			}
		});

		it('should return undefined if not set', function() {
			if (testUtils.go('')) {
				assert.strictEqual(undefined, utils.hashValue('test'), 'returns undefined');
			}
		});
	});

	describe('extractDeeplinkPath', function() {
		it('should return deeplink path for an https:// url', function() {
			if (testUtils.go('#test:extractDeeplinkPath')) {
				assert.strictEqual(
					'abc/def/',
					utils.extractDeeplinkPath('https://domain.name/abc/def/'),
					'should extract deeplink path'
				);
			}
		});

		it('should return deeplink path for a url with implicit protocol', function() {
			if (testUtils.go('#test:extractDeeplinkPath')) {
				assert.strictEqual(
					'abc/def/',
					utils.extractDeeplinkPath('domain.name/abc/def/'),
					'should extract deeplink path'
				);
			}
		});

		it('should return empty string if there is no deeplink path', function() {
			if (testUtils.go('#test:extractDeeplinkPath')) {
				assert.strictEqual(
					'',
					utils.extractDeeplinkPath('https://domain.name'),
					'should extract deeplink path as empty string'
				);
			}
		});
	});
});
