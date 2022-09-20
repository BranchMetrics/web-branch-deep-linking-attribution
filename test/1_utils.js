'use strict';

goog.require('utils');
goog.require('journeys_utils');

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
		it('should handle an non-object for first argument', function() {
			var obj1 = null;
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
		it('should handle an non-object for second argument', function() {
			var obj1 = { "simple": "object" };
			var obj2 = null;
			var expectedMerged = { "simple": "object" };
			assert.deepEqual(utils.merge(obj1, obj2), expectedMerged, 'Correctly merged');
		});
	});

	describe('whiteListSessionData', function() {
		it('should remove unwanted params', function() {
			/*
			 * This is only used with responses to /v1/open, so there will never
			 * be a developer_identity (or user_data.developer_identity), just
			 * identity. As of 2.56.2, both params in every open response are null.
			 * This has been changed so that each is mapped to itself in the
			 * whitelisted response passed to the developer. Removing
			 * developer_identity seems risky, but setting identity to the correct
			 * value is an improvement over two nulls.
			 */
			var input = {
				"data": "string",
				"data_parsed": {
					"key": "value"
				},
				"has_app": true,
				"identity": "90210",
				"developer_identity": "67890",
				"referring_identity": "12345",
				"referring_link": null,
				"unwanted": "param"
			};
			var expected = {
				"data": "string",
				"data_parsed": {
					"key": "value"
				},
				"has_app": true,
				"identity": "90210",
				"developer_identity": "90210",
				"referring_identity": "12345",
				"referring_link": null
			};
			// determine whitelisted fields before deleting unwanted param
			var actual = utils.whiteListSessionData(input);
			assert.deepEqual(
				actual,
				expected,
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
		var windowLocation = 'http://someurl/pluspath';
		var ogTitle = 'OGTitle';
		var ogDescription = 'OGDescription';
		var ogImage = 'OGImage';
		var ogVideo = 'OGVideo';
		var ogType = 'OGType';

		beforeEach(function() {
			sinon.stub(utils, 'getWindowLocation')
				.returns(windowLocation);

			sinon.stub(utils, 'getOpenGraphContent')
				.onCall(0).returns(ogTitle)
				.onCall(1).returns(ogDescription)
				.onCall(2).returns(ogImage)
				.onCall(3).returns(ogVideo)
				.onCall(4).returns(ogType);
		});

		afterEach(function() {
			utils.getOpenGraphContent.restore();
			utils.getWindowLocation.restore();
		});

		it('should accept empty linkData', function() {
			var linkData = { };
			var dataString = [
				'{',
				'"$canonical_url":"' + windowLocation + '",',
				'"$og_title":"' + ogTitle + '",',
				'"$og_description":"' + ogDescription + '",',
				'"$og_image_url":"' + ogImage + '",',
				'"$og_video":"' + ogVideo + '",',
				'"$og_type":"' + ogType + '"',
				'}'
			].join('');
			var expectedCleanedLinkData = {
				source: "web-sdk",
				data: dataString
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
			var dataString = [
				'{',
				'"subfield1":"bar",',
				'"subfield2":false,',
				'"$canonical_url":"' + windowLocation + '",',
				'"$og_title":"' + ogTitle + '",',
				'"$og_description":"' + ogDescription + '",',
				'"$og_image_url":"' + ogImage + '",',
				'"$og_video":"' + ogVideo + '",',
				'"$og_type":"' + ogType + '"',
				'}'
			].join('');
			var expectedCleanedLinkData = {
				"data": dataString,
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
			var dataString = [
				'{',
				'"subfield1":"bar",',
				'"subfield2":false,',
				'"$canonical_url":"' + windowLocation + '",',
				'"$og_title":"' + ogTitle + '",',
				'"$og_description":"' + ogDescription + '",',
				'"$og_image_url":"' + ogImage + '",',
				'"$og_video":"' + ogVideo + '",',
				'"$og_type":"' + ogType + '"',
				'}'
			].join('');
			var expectedCleanedLinkData = {
				"data": dataString,
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
				'Branch SDK already initialized',
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
	describe('extractMobileDeeplinkPath', function() {
		it('should return deeplink path mobile scheme url', function() {
			if (testUtils.go('#test:extractMobileDeeplinkPath')) {
				assert.strictEqual(
					'abc/def/',
					utils.extractMobileDeeplinkPath('AppName://abc/def/'),
					'should extract deeplink path'
				);
			}
		});

		it('should return deeplink path if no protocol is given', function() {
			if (testUtils.go('#test:extractMobileDeeplinkPath')) {
				assert.strictEqual(
					'abc/def/',
					utils.extractMobileDeeplinkPath('abc/def/'),
					'should extract deeplink path'
				);
			}
		});

		it('should return a deeplink path if "/" is prepended', function() {
			if (testUtils.go('#test:extractMobileDeeplinkPath')) {
				assert.strictEqual(
					'abc/def/',
					utils.extractMobileDeeplinkPath('/abc/def/'),
					'should extract deeplink path'
				);
			}
		});

		it('should return empty string if there is no deeplink path', function() {
			if (testUtils.go('#test:extractMobileDeeplinkPath')) {
				assert.strictEqual(
					'',
					utils.extractMobileDeeplinkPath('AppName://'),
					'should extract deeplink path as empty string'
				);
			}
		});
	});
	describe('getHostedDeepLinkData', function() {
		it('should return an object', function() {
			assert.strictEqual(
				'object',
				typeof utils.getHostedDeepLinkData(),
				'should return an object type'
			);
		});
		it('should return OG tags', function() {
			var expected = {
				$og_type:'product'
			};
			assert.deepEqual(
				expected,
				utils.openGraphDataAsObject(),
				'should be equal'
			);
		});
		it('should find applink, twitter and branch hosted data on page', function() {
			var expected = {
				watch_brand: 'Hamilton',
				type: 'Khaki Aviation Stainless Steel Automatic Leather-Strap Watch',
				$ios_deeplink_path: 'applinks/hamilton/khaki/ios',
				$android_deeplink_path: 'twitter/hamilton/khaki/android'
			};
			assert.deepEqual(
				expected,
				utils.getHostedDeepLinkData(),
				'should be equal'
			);
		});
		it('$ios_deeplink_path and $android_deeplink_path should be formed from hosted metadata', function() {
			var params = { "$key1":"val1", "$key2":"val2" };
			var deeplinkPaths = { "hostedIOS":"hosteddld/ios", "hostedAndroid":"hosteddld/android", "applinksIOS":"appllinks/ios", "applinksAndroid":"applinks/android", "twitterIOS":"twitter/ios", "twitterAndroid":"twitter/android" };
			var expected = {
				"$key1":"val1",
				"$key2":"val2",
				"$ios_deeplink_path":"hosteddld/ios",
				"$android_deeplink_path":"hosteddld/android"
			};
			assert.deepEqual(
				expected,
				utils.prioritizeDeeplinkPaths(params, deeplinkPaths),
				'should be equal'
			);
		});
		it('$ios_deeplink_path should be formed from applinks tag and $android_deeplink_path from hosted metadata tag', function() {
			var params = { "$key1":"val1", "$key2":"val2" };
			var deeplinkPaths = { "hostedIOS":null, "hostedAndroid":"hosteddld/android", "applinksIOS":"appllinks/ios", "applinksAndroid":"applinks/android", "twitterIOS":"twitter/ios", "twitterAndroid":"twitter/android" };
			var expected = {
				"$key1":"val1",
				"$key2":"val2",
				"$ios_deeplink_path":"appllinks/ios",
				"$android_deeplink_path":"hosteddld/android"
			};
			assert.deepEqual(
				expected,
				utils.prioritizeDeeplinkPaths(params, deeplinkPaths),
				'should be equal'
			);
		});
		it('$ios_deeplink_path and $android_deeplink_path should be formed from twitter tags', function() {
			var params = {};
			var deeplinkPaths = { "twitterIOS":"twitter/ios", "twitterAndroid":"twitter/android" };
			var expected = {
				"$ios_deeplink_path":"twitter/ios",
				"$android_deeplink_path":"twitter/android"
			};
			assert.deepEqual(
				expected,
				utils.prioritizeDeeplinkPaths(params, deeplinkPaths),
				'should be equal'
			);
		});
		it('$ios_deeplink_path and $android_deeplink_path should be formed from twitter tags. $deeplink_path should also be present', function() {
			var params = {};
			var deeplinkPaths = { "twitterIOS":"twitter/some/path", "twitterAndroid":"twitter/some/path" };
			var expected = {
				"$ios_deeplink_path":"twitter/some/path",
				"$android_deeplink_path":"twitter/some/path",
				"$deeplink_path":"twitter/some/path"
			};
			assert.deepEqual(
				expected,
				utils.prioritizeDeeplinkPaths(params, deeplinkPaths),
				'should be equal'
			);
		});
		it('Original key:value pairs in params should be present', function() {
			var params = { "$key1":"val1", "$key2":"val2" };
			var deeplinkPaths = {};
			var expected = {
				"$key1":"val1",
				"$key2":"val2"
			};
			assert.deepEqual(
				expected,
				utils.prioritizeDeeplinkPaths(params, deeplinkPaths),
				'should be equal'
			);
		});
	});

	describe('getClickIdAndSearchStringFromLink', function() {
		it('If /123abc is passed in, 123abc should be returned"', function() {
			var expected = "123abc";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("/123abc"),
				'should be equal'
			);
		});
		it('If /c/123abc is passed in, 123abc should be returned"', function() {
			var expected = "123abc";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("/c/123abc"),
				'should be equal'
			);
		});
		it('If /c/123abc?key1=val1 is passed in, 123abc?key1=val1 should be returned"', function() {
			var expected = "123abc?key1=val1";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("/c/123abc?key1=val1"),
				'should be equal'
			);
		});
		it('If {} is passed in, "" should be returned"', function() {
			var expected = "";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink(""),
				'should be equal'
			);
		});
		it('If "" is passed in, "" should be returned"', function() {
			var expected = "";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink(""),
				'should be equal'
			);
		});
		it('If undefined is passed in, "" should be returned"', function() {
			var expected = "";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink(undefined),
				'should be equal'
			);
		});
		it('If null is passed in, "" should be returned"', function() {
			var expected = "";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink(null),
				'should be equal'
			);
		});
		it('If "http://example.com:3000?test=test" is passed in, ?test=test should be returned"', function() {
			var expected = "?test=test";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("http://example.com:3000?test=test"),
				'should be equal'
			);
		});
		it('If "http://example.com:3000/?test=test" is passed in, ?test=test should be returned"', function() {
			var expected = "?test=test";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("http://example.com:3000/?test=test"),
				'should be equal'
			);
		});
		it('If "http://example.com:3000/c/clickid?search=test#hash" is passed in, clickid?search=test should be returned"', function() {
			var expected = "clickid?search=test";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("http://example.com:3000/c/clickid?search=test#hash"),
				'should be equal'
			);
		});
		it('If "http://example.com:3000/c/clickid/?search=test#hash" is passed in, clickid?search=test should be returned"', function() {
			var expected = "clickid?search=test";
			assert.strictEqual(
				expected,
				utils.getClickIdAndSearchStringFromLink("http://example.com:3000/c/clickid/?search=test#hash"),
				'should be equal'
			);
		});
	});
	describe('convertObjectValuesToString', function() {
		it('a simple object\'s values should be stringified', function() {
			var initial = {
				key1: 1,
				key2: 2
			};
			var expected = {
				key1: "1",
				key2: "2"
			};
			assert.deepEqual(
				expected,
				utils.convertObjectValuesToString(initial),
				"objects values are not strings"
			);
		});
		it('a complex object\'s values should be stringified', function() {
			var initial = {
				"revenue": 123,
				"currency": "USD",
				"custom_key_0": { "sku": "foo-sku-7", "price": 8.50, "quantity": 4 },
				"custom_key_1": [
					{ "sku": "foo-sku-7", "price": 8.50, "quantity": 4 },
					'testing'
				]
			};
			var expected = {
				"revenue":"123",
				"currency":"USD",
				"custom_key_0":"{\"sku\":\"foo-sku-7\",\"price\":8.5,\"quantity\":4}",
				"custom_key_1": "[{\"sku\":\"foo-sku-7\",\"price\":8.5,\"quantity\":4},\"testing\"]"
			};
			assert.deepEqual(
				expected,
				utils.convertObjectValuesToString(initial),
				"objects values are not strings"
			);
		});
		it('should return empty object', function() {
			var initial = {};
			assert.deepEqual(
				{},
				utils.convertObjectValuesToString(initial),
				"should return empty object"
			);
		});
	});

	describe('convertValueToString', function() {
		it('should stringify a number', function() {
			var initial = 0;
			var expected = "0";
			assert.strictEqual(
				expected,
				utils.convertValueToString(initial),
				"0 should be converted to \"0\""
			);
		});

		it('should stringify a boolean', function() {
			var initial = true;
			var expected = "true";
			assert.strictEqual(
				expected,
				utils.convertValueToString(initial),
				"true should be converted to \"true\""
			);
		});

		it('should stringify null', function() {
			var initial = null;
			var expected = "null";
			assert.strictEqual(
				expected,
				utils.convertValueToString(initial),
				"null should be converted to \"null\""
			);
		});

		it('should stringify an object', function() {
			var initial = { "sku": "foo-sku-7", "price": 8.50, "quantity": 4 };
			var expected = "{\"sku\":\"foo-sku-7\",\"price\":8.5,\"quantity\":4}";
			assert.strictEqual(
				expected,
				utils.convertValueToString(initial),
				"object should be stringified"
			);
		});

		it('should stringify an array', function() {
			var initial = [
				{ "sku": "foo-sku-7", "price": 8.50, "quantity": 4 },
				'testing'
			];
			var expected = "[{\"sku\":\"foo-sku-7\",\"price\":8.5,\"quantity\":4},\"testing\"]";
			assert.strictEqual(
				expected,
				utils.convertValueToString(initial),
				"array should be stringified"
			);
		});
	});


	describe('setJourneyLinkData', function() {
		it('should set journeys_utils.journeyLinkData with bannerid and journey link data', function() {
			var ctaLinkData = {
				"data":{ "a":"b" },
				"tags":[ "Top_View" ],
				"feature":"journeys",
				"campaign":"campaign_name (2)"
			};
			journeys_utils.branchViewId = "428699261402931211";
			journeys_utils.setJourneyLinkData(ctaLinkData);
			var expected = {
				"banner_id": "428699261402931211",
				"journey_link_data":{
					"data":{ "a":"b" },
					"tags":[ "Top_View" ],
					"feature":"journeys",
					"campaign":"campaign_name (2)"
				}
			};

			assert.deepEqual(
				expected,
				journeys_utils.journeyLinkData,
				'should be equal'
			);
		});
		it('should set journeys_utils.journeyLinkData with bannerid ', function() {
			var html = '<script type="application/json">var name = "test";</script>';
			journeys_utils.branchViewId = "428699261402931211";
			journeys_utils.setJourneyLinkData(html);
			var expected = { "banner_id":"428699261402931211" };
			assert.deepEqual(
				expected,
				journeys_utils.journeyLinkData,
				'should be equal'
			);
		});
	});

	describe('isSafari11OrGreater', function() {
		var originalUa = navigator.userAgent;

		function setUserAgent(ua) {
			navigator.__defineGetter__("userAgent", function() {
				return ua;
			});
		}

		afterEach(function() {
			setUserAgent(originalUa);
		});

		var popularBrowsers = [
			'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36',
			'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
			'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
			'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0',
			'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0',
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
			'mindUpBot (datenbutler.de)',
			'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0)',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)',
			'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; Media Center PC',
			'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0',
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.112 Safari/535.1',
			'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0',
			'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
			'Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko',
			'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
			'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0; Trident/5.0)',
			'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
			'Mozilla/5.0 (iPad; U; CPU OS 5_1 like Mac OS X) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B367 Safari/531.21.10 UCBrowser/3.4.3.532',
			'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; FSL 7.0.6.01001)',
			'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; FSL 7.0.7.01001)',
			'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; FSL 7.0.5.01003)',
			'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0',
			'Mozilla/5.0 (X11; U; Linux x86_64; de; rv:1.9.2.8) Gecko/20100723 Ubuntu/10.04 (lucid) Firefox/3.6.8',
			'Mozilla/5.0 (Windows NT 5.1; rv:13.0) Gecko/20100101 Firefox/13.0.1',
			'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:11.0) Gecko/20100101 Firefox/11.0',
			'Mozilla/5.0 (X11; U; Linux x86_64; de; rv:1.9.2.8) Gecko/20100723 Ubuntu/10.04 (lucid) Firefox/3.6.8',
			'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; .NET CLR 1.0.3705)',
			'Mozilla/5.0 (Windows NT 5.1; rv:13.0) Gecko/20100101 Firefox/13.0.1',
			'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0.1',
			'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
			'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
			'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)',
			'Opera/9.80 (Windows NT 5.1; U; en) Presto/2.10.289 Version/12.01',
			'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)',
			'Mozilla/5.0 (Windows NT 5.1; rv:5.0.1) Gecko/20100101 Firefox/5.0.1',
			'Mozilla/5.0 (Windows NT 6.1; rv:5.0) Gecko/20100101 Firefox/5.02',
			'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.112 Safari/535.1',
			'Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 5.0) Opera 7.02 Bork-edition [en]'
		];

		it('should return false for non safari browsers', function() {
			var isSafari11 = false;
			popularBrowsers.forEach(function(ua) {
				setUserAgent(ua);
				if (navigator.userAgent === ua && utils.isSafari11OrGreater()) {
					isSafari11 = true;
				}
			});

			assert.strictEqual(isSafari11, false, 'should return false for all browsers');
		});

		var safari11 = [
			'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1',
			'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.31 (KHTML, like Gecko) Version/11.0 Mobile/15A5327g Safari/604.1',
			'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1',
			'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304j Safari/604.1',
			'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304i Safari/604.1',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.31 (KHTML, like Gecko) Version/11.0 Mobile/15A5327g Safari/604.1',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304j Safari/604.1',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.21 (KHTML, like Gecko) Version/11.0 Mobile/15A5278f Safari/602.1',
			'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304i Safari/604.1'
		];

		it('should return true for safari 11 browsers', function() {
			var isSafari11 = true;
			safari11.forEach(function(ua) {
				setUserAgent(ua);
				if (navigator.userAgent === ua && !utils.isSafari11OrGreater()) {
					isSafari11 = false;
				}
			});

			assert.strictEqual(isSafari11, true, 'should return true for all browsers');
		});
	});
	describe('separateEventAndCustomData ', function() {

		it('extracted custom and event data should equal initial objects', function() {
			var event_data = {
				"transaction_id": "1AB23456C7890123D",
				"revenue": 6.00,
				"currency": "USD",
				"shipping": 3.00,
				"tax": 3.00,
				"coupon": "8891701",
				"affiliation": "xyz_affiliation",
				"search_query": "boat shoes sperrys",
				"description": "Sperry Authentic Original"
			};

			var custom_data = {
				"custom_key_1": "custom_val_1",
				"custom_key_2": "custom_val_2",
				"custom_key_3": "custom_val_3"
			};

			var event_and_custom_data = {};

			utils.merge(event_and_custom_data, event_data);
			utils.merge(event_and_custom_data, custom_data);

			var extractedEventAndCustomData = utils.separateEventAndCustomData(event_and_custom_data);
			assert.deepEqual(
				event_data,
				extractedEventAndCustomData['event_data'],
				'extracted event_data should equal initial event_data'
			);
			assert.deepEqual(
				custom_data,
				extractedEventAndCustomData['custom_data'],
				'extracted custom_data should equal initial custom_data'
			);
		});

		it('utils.isStandardEvent() should return true for standard events and false for custom events', function() {
			var standardEvent = 'ADD_TO_WISHLIST';
			var customEvent = 'ADD_TO_WISHLISTT';

			assert.strictEqual(true,
				utils.isStandardEvent(standardEvent),
				'should return true for ADD_TO_WISHLIST');
			assert.strictEqual(false,
				utils.isStandardEvent(customEvent),
				'should return false for ADD_TO_WISHLISTT');
		});

		it('should return true or false for a given parameter and type', function() {
			var parameter1 = {};
			var parameter2 = [];
			var parameter3 = "test";
			var type1 = "object";
			var type2 = "array";
			var type3 = "string";
			assert.strictEqual(false,
				utils.validateParameterType(null, type1),
				'should return false');
			assert.strictEqual(false,
				utils.validateParameterType(parameter1, null),
				'should return false');

			assert.strictEqual(true,
				utils.validateParameterType(parameter1, type1),
				'should return true');
			assert.strictEqual(false,
				utils.validateParameterType(parameter1, type2),
				'should return false');
			assert.strictEqual(false,
				utils.validateParameterType(parameter1, type3),
				'should return false');

			assert.strictEqual(false,
				utils.validateParameterType(parameter2, type1),
				'should return false');
			assert.strictEqual(true,
				utils.validateParameterType(parameter2, type2),
				'should return true');
			assert.strictEqual(false,
				utils.validateParameterType(parameter2, type3),
				'should return false');

			assert.strictEqual(false,
				utils.validateParameterType(parameter3, type1),
				'should return false');
			assert.strictEqual(false,
				utils.validateParameterType(parameter3, type2),
				'should return false');
			assert.strictEqual(true,
				utils.validateParameterType(parameter3, type3),
				'should return true');

		});
	});

	describe('mergeMetadataFromInitToHostedMetadata', function() {
		it('override previous hosted_deeplink_data keys via user-supplied metadata object', function() {
			var additionalMetadata = {};
			additionalMetadata['hosted_deeplink_data'] = utils.getHostedDeepLinkData();
			var userSuppliedMetadata = { watch_brand: 'Seiko',
				type: 'Presage'
			};
			var response = utils.mergeHostedDeeplinkData(additionalMetadata['hosted_deeplink_data'], userSuppliedMetadata);
			var expected = {
				watch_brand: 'Seiko',
				type: 'Presage',
				$ios_deeplink_path: 'applinks/hamilton/khaki/ios',
				$android_deeplink_path: 'twitter/hamilton/khaki/android'
			};
			assert.deepEqual(
				expected,
				response,
				'should be equal'
			);
		});

		it('merge hosted_deeplink_data and user-supplied metadata', function() {
			var additionalMetadata = {};
			additionalMetadata['hosted_deeplink_data'] = utils.getHostedDeepLinkData();
			var userSuppliedMetadata = { productA: '12345' };
			var response = utils.mergeHostedDeeplinkData(additionalMetadata['hosted_deeplink_data'], userSuppliedMetadata);
			var expected = {
				watch_brand: 'Hamilton',
				type: 'Khaki Aviation Stainless Steel Automatic Leather-Strap Watch',
				$ios_deeplink_path: 'applinks/hamilton/khaki/ios',
				$android_deeplink_path: 'twitter/hamilton/khaki/android',
				productA: '12345'
			};
			assert.deepEqual(
				expected,
				response,
				'should be equal'
			);
		});

		it('tests with metadata and without hosted_deeplink_data', function() {
			var additionalMetadata = {};
			var userSuppliedMetadata = { productA: '12345' };
			var response = utils.mergeHostedDeeplinkData(additionalMetadata['hosted_deeplink_data'], userSuppliedMetadata);
			var expected = { productA: '12345' };
			assert.deepEqual(
				expected,
				response,
				'should be equal'
			);
		});

		it('ensure that additionalMetadata[\'hosted_deeplink_data\'] does not get mutated', function() {
			var additionalData = { 'root_key': '1234' };
			additionalData['hosted_deeplink_data'] = { productA: '12345' };
			var userSuppliedMetadata = { productB: '12345' };
			utils.mergeHostedDeeplinkData(additionalData['hosted_deeplink_data'], userSuppliedMetadata);
			var expected = { 'root_key': '1234', 'hosted_deeplink_data': { productA: '12345' } };
			assert.deepEqual(
				expected,
				additionalData,
				'should be equal'
			);
		});

		it('ensure that userSuppliedMetadata does not get mutated', function() {
			var additionalData = {};
			additionalData['hosted_deeplink_data'] = { productA: '12345' };
			var userSuppliedMetadata = { productB: '12345' };
			utils.mergeHostedDeeplinkData(additionalData['hosted_deeplink_data'], userSuppliedMetadata);
			var expected = { productB: '12345' };
			assert.deepEqual(
				expected,
				userSuppliedMetadata,
				'should be equal'
			);
		});
	});
	describe('Tests for utils.userPreferences.shouldBlockRequest()', function() {
		it('should return true with v1/bogus as url endpoint', function() {
			assert.strictEqual(true, utils.userPreferences.shouldBlockRequest('https://api.branch.io/v1/bogus'));
		});
		it('should return true with v1/open as url endpoint and no request data provided', function() {
			assert.strictEqual(true, utils.userPreferences.shouldBlockRequest('https://api.branch.io/v1/open'));
		});
		it('should return false with v1/open as url endpoint and valid request data provided', function() {
			assert.strictEqual(false, utils.userPreferences.shouldBlockRequest('https://api.branch.io/v1/open', { link_identifier: '111111111111' }));
		});
		it('should return true with v1/xyz as url endpoint and with bogus request data', function() {
			assert.strictEqual(true, utils.userPreferences.shouldBlockRequest('https://api.branch.io/v1/xyz', { link_identifier: '111111111111' }));
		});
		it('should allow raw links', function() {
			assert.strictEqual(false, utils.userPreferences.shouldBlockRequest('https://bnctestbed.app.link/abcdefg'));
		});
	});

	describe('delay function', function() {
		it('calls synchronously for a non-numeric delay argument', function() {
			var executed = false;
			utils.delay(function() {
				executed = true;
			}, NaN);
			// executed is true immediately after the call
			assert.equal(true, executed);
		});

		it('calls synchronously for a zero delay argument', function() {
			var executed = false;
			utils.delay(function() {
				executed = true;
			}, 0);
			// executed is true immediately after the call
			assert.equal(true, executed);
		});

		it('calls synchronously for a negative delay argument', function() {
			var executed = false;
			utils.delay(function() {
				executed = true;
			}, -25);
			// executed is true immediately after the call
			assert.equal(true, executed);
		});

		it('delays for any positive numeric argument', function(done) {
			var executed = false;
			var clock = sinon.useFakeTimers();
			utils.delay(function() {
				executed = true;
				done();
			}, 100);
			// executed is still false immediately after the call
			assert.equal(false, executed);
			// ensure that done() gets called.
			clock.tick(101);
		});
	});

	describe('isWebKitBrowser function', function() {
		var originalWebKitURL = window.webkitURL;

		it('returns true when window.webkitURL is defined', function() {
			// pretend to be webkit
			if (!window.webkitURL) {
				window.webkitURL = 'https://example.com';
			}
			assert.equal(utils.isWebKitBrowser(), true);
		});

		it('returns false when window.webkitURL is not defined', function() {
			// pretend not to be webkit
			if (window.webkitURL) {
				delete window.webkitURL;
			}
			assert.equal(utils.isWebKitBrowser(), false);
		});

		if (originalWebKitURL !== undefined) {
			window.webkitURL = originalWebKitURL;
		}
		else {
			delete window.webkitURL;
		}
	});

	describe('isIOSWKWebView function', function() {
		var originalUa = navigator.userAgent;
		var originalWebKitURL = window.webkitURL;
		var iOSBrowsers = {
			safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
			chrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/84.0.4147.71 Mobile/15E148 Safari/604.1',
			firefox: 'Mozilla/5.0 (iPhone; CPU OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/28.0 Mobile/15E148 Safari/605.1.15',
			edge: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 EdgiOS/45.7.3 Mobile/15E148 Safari/605.1.15',
			opera: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPT/2.4.4 Mobile/15E148',
			yandex: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 YaBrowser/20.7.2.279.10 Mobile/15E148 Safari/604.1',
			wkwebview: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
			uiwebview: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
		};

		function setUserAgent(ua) {
			navigator.__defineGetter__("userAgent", function() {
				return ua;
			});
		}

		afterEach(function() {
			setUserAgent(originalUa);
			if (originalWebKitURL !== undefined) {
				window.webkitURL = originalWebKitURL;
			}
			else {
				delete window.webkitURL;
			}
		});

		it('should return false for Firefox', function() {
			setUserAgent(iOSBrowsers.firefox);
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), false);
		});

		it('should return false for Chrome', function() {
			setUserAgent(iOSBrowsers.chrome);
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), false);
		});

		it('should return false for Edge', function() {
			setUserAgent(iOSBrowsers.edge);
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), false);
		});

		it('should return false for Yandex', function() {
			setUserAgent(iOSBrowsers.yandex);
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), false);
		});

		it('should return false for Opera', function() {
			setUserAgent(iOSBrowsers.firefox);
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), false);
		});

		it('should return true when UA includes iPhone & window.webkitURL is defined', function() {
			setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)');
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), true);
		});

		it('should return true when UA includes iPad & window.webkitURL is defined', function() {
			setUserAgent('Mozilla/5.0 (iPad; U; CPU OS 5_1 like Mac OS X) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B367 Safari/531.21.10 UCBrowser/3.4.3.532');
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), true);
		});

		it('should return true when UA includes iPod & window.webkitURL is defined', function() {
			// fake, based on iPhone from above
			setUserAgent('Mozilla/5.0 (iPod; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)');
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), true);
		});

		it('should return false when UA is not iOS but window.webkitURL is defined', function() {
			setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0');
			window.webkitURL = function() {};

			assert.equal(utils.isIOSWKWebView(), false);
		});

		it('should return false when UA is iOS but window.webkitURL is not defined', function() {
			setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)');
			delete window.webkitURL;

			assert.equal(utils.isIOSWKWebView(), false);
		});
	});

	describe('journey_cta', function(done) {
		var html = 'html - validate("https://wdar9-alternate-qa.branchbeta.link/8ih4nDDQH8?__branch_flow_type=journeys_cta_override&__branch_flow_id=819580012495711960&__branch_mobile_deepview_type=4&_branch_match_id=814182034125937862&referrer=link_click_id%3D814182034125937862%26utm_source%3DBranch%26utm_campaign%3DChannel%20Test%26utm_medium%3Djourneys&_t=814182034125937862"); - html';

		var assert = testUtils.plan(4, done);

		it('journey link should replace by $journeys_cta value', function() {
			var link = "http://test.com";

			journeys_utils.branch = {
				_branchViewData: {
					data: {
						$journeys_cta: link
					}
				}

			};

			assert.equal(journeys_utils.tryReplaceJourneyCtaLink(html).indexOf(link) > -1, true);
		});


		it('exists no $journeys_cta the html should be untouched', function() {
			journeys_utils.branch = {
				_branchViewData: {
					data: {
						$journeys_cta: undefined
					}
				}

			};

			assert.equal(journeys_utils.tryReplaceJourneyCtaLink(html), html);
		});

		it('only the link should be replaced', function() {
			var link = "http://test.com";
			journeys_utils.branch = {
				_branchViewData: {
					data: {
						$journeys_cta: link
					}
				}

			};
			var htmlWithoutLink = 'html - validate("") - html';
			assert.equal(journeys_utils.tryReplaceJourneyCtaLink(html).replace(link, ""), htmlWithoutLink);
		});
	});

	describe('addHtmlToIframe', function() {
		var iframe = {
			contentDocument: {
				createElement: function() {
					return {};
				}
			},
			head: {},
			body: {}
		};

		it('adds the specified HTML as the body.innerHTML of the supplied iframe', function() {
			journeys_utils.addHtmlToIframe(iframe, '<p>A paragraph</p>', 'ios');
			assert.equal(iframe.contentDocument.body.innerHTML, '<p>A paragraph</p>');
		});

		it('sets the body class to branch-banner-ios when UA is ios', function() {
			journeys_utils.addHtmlToIframe(iframe, '<p>A paragraph</p>', 'ios');
			assert.equal(iframe.contentDocument.body.className, 'branch-banner-ios');
		});

		it('sets the body class to branch-banner-ios when UA is ipad', function() {
			journeys_utils.addHtmlToIframe(iframe, '<p>A paragraph</p>', 'ipad');
			assert.equal(iframe.contentDocument.body.className, 'branch-banner-ios');
		});

		it('sets the body class to branch-banner-android when UA is android', function() {
			journeys_utils.addHtmlToIframe(iframe, '<p>A paragraph</p>', 'android');
			assert.equal(iframe.contentDocument.body.className, 'branch-banner-android');
		});

		it('sets the body class to branch-banner-other when UA is any other value', function() {
			journeys_utils.addHtmlToIframe(iframe, '<p>A paragraph</p>', '');
			assert.equal(iframe.contentDocument.body.className, 'branch-banner-other');
		});
	});

	describe("animateBannerEntrance and animateBannerExit", function() {
		var clock;
		beforeEach(function() {
			clock = sinon.useFakeTimers();
		});
		it("sets body class to branch-banner-is-active and branch-banner-no-scroll", function() {
			var iframe = {
				contentDocument: {
					createElement: function() {
						return {};
					}
				},
				head: {},
				body: {}
			};
			journeys_utils.isFullPage = true;
			journeys_utils.sticky = "fixed";
			journeys_utils.animateBannerEntrance(iframe);
			assert.equal(document.body.className, " branch-banner-is-active branch-banner-no-scroll");
		});

		it("removes branch-banner-is-active and branch-banner-no-scroll class on animateBannerExit", function() {
			var iframe = {
				contentDocument: {
					createElement: function() {
						return {};
					}
				},
				head: {},
				body: {},
				style: {},
				parentNode: {
					removeChild: function() {}
				}
			};
			journeys_utils.branch._publishEvent = function() {};
			journeys_utils.animateBannerExit(iframe);
			clock.tick(270);
			assert.equal(document.body.className, " ");
		});
	});
});
