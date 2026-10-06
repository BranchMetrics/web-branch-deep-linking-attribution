import { createContext } from '../../src/core/context.js';
import { openGraphDataAsObject } from '../../src/core/page-data.js';
import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
} from '../../src/core/platform.js';
import { cleanLinkData, getParamValue, hashValue } from '../../src/core/url.js';
import { browserEnv, getEnv, setEnv } from '../../src/env/env.js';
import { setDMAParams, shouldAddDMAParams } from '../../src/lib/dma.js';
import { base64encode } from '../../src/lib/encoding.js';
import {
  mergeHostedDeeplinkData,
  prioritizeDeeplinkPaths,
  processHostedDeepLinkData,
} from '../../src/lib/hosted-data.js';
import { formatMessage, messages } from '../../src/lib/messages.js';
import {
  addPropertyIfNotNullorEmpty,
  convertObjectValuesToString,
  convertValueToString,
  delay,
  merge,
  validateParameterType,
} from '../../src/lib/objects.js';
import { whiteListSessionData } from '../../src/lib/session-data.js';
import {
  extractDeeplinkPath,
  extractMobileDeeplinkPath,
  isValidURL,
  removeTrailingDotZeros,
} from '../../src/lib/url.js';
import {
  isStandardEvent,
  separateEventAndCustomData,
} from '../../src/lib/validation.js';
import { makeFakeEnv } from '../helpers/fake-env.js';

describe('legacy helpers (lib, core/url, core/platform, env)', function () {
  const assert = testUtils.unplanned();
  describe('base64encode', function () {
    it('should encode a string', function () {
      const string = 'test string to encode';
      const expectedEncoded = 'dGVzdCBzdHJpbmcgdG8gZW5jb2Rl';
      assert.strictEqual(
        base64encode(string),
        expectedEncoded,
        'Correctly encoded',
      );
    });
  });

  describe('merge', function () {
    it('should merge two objects despite duplication', function () {
      const obj1 = { 'simple': 'object' };
      const obj2 = {
        'simple': 'object',
        'nested': {
          'object': 'here',
        },
      };
      const expectedMerged = {
        'simple': 'object',
        'nested': {
          'object': 'here',
        },
      };
      assert.deepEqual(merge(obj1, obj2), expectedMerged, 'Correctly merged');
    });
    it('should handle an non-object for first argument', function () {
      const obj1 = null;
      const obj2 = {
        'simple': 'object',
        'nested': {
          'object': 'here',
        },
      };
      const expectedMerged = {
        'simple': 'object',
        'nested': {
          'object': 'here',
        },
      };
      assert.deepEqual(merge(obj1, obj2), expectedMerged, 'Correctly merged');
    });
    it('should handle an non-object for second argument', function () {
      const obj1 = { 'simple': 'object' };
      const obj2 = null;
      const expectedMerged = { 'simple': 'object' };
      assert.deepEqual(merge(obj1, obj2), expectedMerged, 'Correctly merged');
    });
  });

  describe('whiteListSessionData', function () {
    it('should remove unwanted params', function () {
      /*
       * This is only used with responses to /v1/open, so there will never
       * be a developer_identity (or user_data.developer_identity), just
       * identity. As of 2.56.2, both params in every open response are null.
       * This has been changed so that each is mapped to itself in the
       * whitelisted response passed to the developer. Removing
       * developer_identity seems risky, but setting identity to the correct
       * value is an improvement over two nulls.
       */
      const input = {
        'data': 'string',
        'data_parsed': {
          'key': 'value',
        },
        'has_app': true,
        'identity': '90210',
        'developer_identity': '67890',
        'referring_identity': '12345',
        'referring_link': null,
        'unwanted': 'param',
      };
      const expected = {
        'data': 'string',
        'data_parsed': {
          'key': 'value',
        },
        'has_app': true,
        'identity': '90210',
        'developer_identity': '90210',
        'referring_identity': '12345',
        'referring_link': null,
      };
      // determine whitelisted fields before deleting unwanted param
      const actual = whiteListSessionData(input);
      assert.deepEqual(actual, expected, 'Unwanted param should be removed');
    });

    it('should make missing params null', function () {
      const data = {
        'data': 'string',
        'identity': '67890',
        'referring_identity': '12345',
      };
      const whiteListedData = whiteListSessionData(data);
      assert.strictEqual(
        whiteListedData.has_app,
        null,
        'has_app should be null',
      );
    });
  });

  describe('cleanLinkData', function () {
    const windowLocation = 'http://someurl/pluspath';
    const ogTitle = 'OGTitle';
    const ogDescription = 'OGDescription';
    const ogImage = 'OGImage';
    const ogVideo = 'OGVideo';
    const ogType = 'OGType';

    beforeEach(function () {
      setEnv(
        makeFakeEnv({
          windowLocation: () => windowLocation,
          openGraphContent: vi
            .fn()
            .mockImplementation(function () {})
            .mockReturnValueOnce(ogTitle)
            .mockReturnValueOnce(ogDescription)
            .mockReturnValueOnce(ogImage)
            .mockReturnValueOnce(ogVideo)
            .mockReturnValueOnce(ogType),
        }),
      );
    });

    afterEach(function () {
      setEnv(null);
    });

    it('should accept empty linkData', function () {
      const linkData = {};
      const dataString = [
        '{',
        '"$canonical_url":"' + windowLocation + '",',
        '"$og_title":"' + ogTitle + '",',
        '"$og_description":"' + ogDescription + '",',
        '"$og_image_url":"' + ogImage + '",',
        '"$og_video":"' + ogVideo + '",',
        '"$og_type":"' + ogType + '"',
        '}',
      ].join('');
      const expectedCleanedLinkData = {
        source: 'web-sdk',
        data: dataString,
      };
      assert.deepEqual(
        cleanLinkData(linkData),
        expectedCleanedLinkData,
        'Accept empty linkData',
      );
    });

    it('should stringify field "data" and add "source"', function () {
      const linkData = {
        'data': {
          subfield1: 'bar',
          'subfield2': false,
        },
        field1: 12345,
        field2: '67890',
        'field 3': true,
        field4: null,
      };
      const dataString = [
        '{',
        '"subfield1":"bar",',
        '"subfield2":false,',
        '"$canonical_url":"' + windowLocation + '",',
        '"$og_title":"' + ogTitle + '",',
        '"$og_description":"' + ogDescription + '",',
        '"$og_image_url":"' + ogImage + '",',
        '"$og_video":"' + ogVideo + '",',
        '"$og_type":"' + ogType + '"',
        '}',
      ].join('');
      const expectedCleanedLinkData = {
        'data': dataString,
        field1: 12345,
        field2: '67890',
        'field 3': true,
        field4: null,
        source: 'web-sdk',
      };
      assert.deepEqual(
        cleanLinkData(linkData),
        expectedCleanedLinkData,
        'Stringified field "data" and added "source"',
      );
    });

    it('should not stringify pre-stringified field "data"', function () {
      const linkData = {
        'data': {
          subfield1: 'bar',
          'subfield2': false,
        },
        field1: 12345,
        field2: '67890',
        'field 3': true,
        field4: null,
      };
      const dataString = [
        '{',
        '"subfield1":"bar",',
        '"subfield2":false,',
        '"$canonical_url":"' + windowLocation + '",',
        '"$og_title":"' + ogTitle + '",',
        '"$og_description":"' + ogDescription + '",',
        '"$og_image_url":"' + ogImage + '",',
        '"$og_video":"' + ogVideo + '",',
        '"$og_type":"' + ogType + '"',
        '}',
      ].join('');
      const expectedCleanedLinkData = {
        'data': dataString,
        field1: 12345,
        field2: '67890',
        'field 3': true,
        field4: null,
        source: 'web-sdk',
      };
      assert.deepEqual(
        cleanLinkData(cleanLinkData(linkData)),
        expectedCleanedLinkData,
        'Refrain from over-stringifying field "data"',
      );
    });
  });

  describe('formatMessage', function () {
    it('should produce a missing param message', function () {
      assert.strictEqual(
        formatMessage(messages.missingParam, ['endpoint', 'param']),
        'API request endpoint missing parameter param',
        'Expected missing param message produced',
      );
    });

    it('should produce an invalid param type message', function () {
      assert.strictEqual(
        formatMessage(messages.invalidType, ['endpoint', 'param', 'type']),
        'API request endpoint, parameter param is not type',
        'Expected invalid param type message produced',
      );
    });

    it('should produce a Branch SDK not init message', function () {
      assert.strictEqual(
        formatMessage(messages.nonInit),
        'Branch SDK not initialized',
        'Expected Branch SDK not init message produced',
      );
    });

    it('should produce a Branch SDK already init message', function () {
      assert.strictEqual(
        formatMessage(messages.existingInit),
        'Branch SDK already initialized',
        'Expected Branch SDK already initialized message produced',
      );
    });

    it('should produce a missing app id', function () {
      assert.strictEqual(
        formatMessage(messages.missingAppId),
        'Missing Branch app ID',
        'Expected Branch app id missing message produced',
      );
    });

    it('should produce a call branch init first', function () {
      assert.strictEqual(
        formatMessage(messages.callBranchInitFirst),
        'Branch.init must be called first',
        'Expected Branch must be called first message produced',
      );
    });

    it('should produce a timeout message', function () {
      assert.strictEqual(
        formatMessage(messages.timeout),
        'Request timed out',
        'Expected Request timed out message produced',
      );
    });

    it('should produce a missing URL error', function () {
      assert.strictEqual(
        formatMessage(messages.missingUrl),
        'Required argument: URL, is missing',
        'Expected Missing url message produced',
      );
    });

    it('should produce a missing identity error', function () {
      assert.strictEqual(
        formatMessage(messages.missingIdentity),
        'setIdentity - required argument identity should have a non-null value',
        'Expected Missing identity message produced',
      );
    });
  });

  describe('getParamValue', function () {
    it('should return search param value', function () {
      testUtils.go('?test=testsearch');
      assert.strictEqual(
        getParamValue('test'),
        'testsearch',
        'Returns search param',
      );
    });

    it('should return undefined if not set', function () {
      testUtils.go('');
      assert.strictEqual(undefined, getParamValue('test'), 'returns undefined');
    });
  });

  describe('hashValue', function () {
    it('should return hash param value', function () {
      if (testUtils.go('#test:testhash')) {
        assert.strictEqual(hashValue('test'), 'testhash', 'Returns hash param');
      }
    });

    it('should return undefined if not set', function () {
      if (testUtils.go('')) {
        assert.strictEqual(undefined, hashValue('test'), 'returns undefined');
      }
    });
  });

  describe('extractDeeplinkPath', function () {
    it('should return deeplink path for an https:// url', function () {
      if (testUtils.go('#test:extractDeeplinkPath')) {
        assert.strictEqual(
          'abc/def/',
          extractDeeplinkPath('https://domain.name/abc/def/'),
          'should extract deeplink path',
        );
      }
    });

    it('should return deeplink path for a url with implicit protocol', function () {
      if (testUtils.go('#test:extractDeeplinkPath')) {
        assert.strictEqual(
          'abc/def/',
          extractDeeplinkPath('domain.name/abc/def/'),
          'should extract deeplink path',
        );
      }
    });

    it('should return empty string if there is no deeplink path', function () {
      if (testUtils.go('#test:extractDeeplinkPath')) {
        assert.strictEqual(
          '',
          extractDeeplinkPath('https://domain.name'),
          'should extract deeplink path as empty string',
        );
      }
    });
  });
  describe('extractMobileDeeplinkPath', function () {
    it('should return deeplink path mobile scheme url', function () {
      if (testUtils.go('#test:extractMobileDeeplinkPath')) {
        assert.strictEqual(
          'abc/def/',
          extractMobileDeeplinkPath('AppName://abc/def/'),
          'should extract deeplink path',
        );
      }
    });

    it('should return deeplink path if no protocol is given', function () {
      if (testUtils.go('#test:extractMobileDeeplinkPath')) {
        assert.strictEqual(
          'abc/def/',
          extractMobileDeeplinkPath('abc/def/'),
          'should extract deeplink path',
        );
      }
    });

    it('should return a deeplink path if "/" is prepended', function () {
      if (testUtils.go('#test:extractMobileDeeplinkPath')) {
        assert.strictEqual(
          'abc/def/',
          extractMobileDeeplinkPath('/abc/def/'),
          'should extract deeplink path',
        );
      }
    });

    it('should return empty string if there is no deeplink path', function () {
      if (testUtils.go('#test:extractMobileDeeplinkPath')) {
        assert.strictEqual(
          '',
          extractMobileDeeplinkPath('AppName://'),
          'should extract deeplink path as empty string',
        );
      }
    });
  });
  describe('getHostedDeepLinkData', function () {
    it('should return an object', function () {
      assert.strictEqual(
        'object',
        typeof getEnv().hostedDeepLinkData(),
        'should return an object type',
      );
    });
    it.skip('should return OG tags', function () {
      const expected = {
        $og_type: 'product',
      };
      assert.deepEqual(expected, openGraphDataAsObject(), 'should be equal');
    });
    it('should find applink, twitter and branch hosted data on page', function () {
      // Inject the meta tags directly via the jsdom DOM so getHostedDeepLinkData picks them
      // up; hosted iOS is absent, so $ios_deeplink_path falls back to al:ios:url, and Android
      // has no hosted/applinks tag so it falls back to twitter:app:url:googleplay.
      const injected = [
        '<meta name="twitter:app:url:iphone" content="appuri://twitter/hamilton/khaki/ios">',
        '<meta name="twitter:app:url:googleplay" content="appuri://twitter/hamilton/khaki/android">',
        '<meta property="al:ios:url" content="appuri://applinks/hamilton/khaki/ios" />',
        '<meta name="branch:deeplink:watch_brand" content="Hamilton" />',
        '<meta name="branch:deeplink:type" content="Khaki Aviation Stainless Steel Automatic Leather-Strap Watch" />',
      ];
      const added = injected.map(function (html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const el = tpl.content.firstChild;
        document.head.appendChild(el);
        return el;
      });
      try {
        const expected = {
          watch_brand: 'Hamilton',
          type: 'Khaki Aviation Stainless Steel Automatic Leather-Strap Watch',
          $ios_deeplink_path: 'applinks/hamilton/khaki/ios',
          $android_deeplink_path: 'twitter/hamilton/khaki/android',
        };
        assert.deepEqual(
          expected,
          getEnv().hostedDeepLinkData(),
          'should be equal',
        );
      } finally {
        added.forEach(function (el) {
          el.parentNode.removeChild(el);
        });
      }
    });
    it('$ios_deeplink_path and $android_deeplink_path should be formed from hosted metadata', function () {
      const params = { '$key1': 'val1', '$key2': 'val2' };
      const deeplinkPaths = {
        'hostedIOS': 'hosteddld/ios',
        'hostedAndroid': 'hosteddld/android',
        'applinksIOS': 'appllinks/ios',
        'applinksAndroid': 'applinks/android',
        'twitterIOS': 'twitter/ios',
        'twitterAndroid': 'twitter/android',
      };
      const expected = {
        '$key1': 'val1',
        '$key2': 'val2',
        '$ios_deeplink_path': 'hosteddld/ios',
        '$android_deeplink_path': 'hosteddld/android',
      };
      assert.deepEqual(
        expected,
        prioritizeDeeplinkPaths(params, deeplinkPaths),
        'should be equal',
      );
    });
    it('$ios_deeplink_path should be formed from applinks tag and $android_deeplink_path from hosted metadata tag', function () {
      const params = { '$key1': 'val1', '$key2': 'val2' };
      const deeplinkPaths = {
        'hostedIOS': null,
        'hostedAndroid': 'hosteddld/android',
        'applinksIOS': 'appllinks/ios',
        'applinksAndroid': 'applinks/android',
        'twitterIOS': 'twitter/ios',
        'twitterAndroid': 'twitter/android',
      };
      const expected = {
        '$key1': 'val1',
        '$key2': 'val2',
        '$ios_deeplink_path': 'appllinks/ios',
        '$android_deeplink_path': 'hosteddld/android',
      };
      assert.deepEqual(
        expected,
        prioritizeDeeplinkPaths(params, deeplinkPaths),
        'should be equal',
      );
    });
    it('$ios_deeplink_path and $android_deeplink_path should be formed from twitter tags', function () {
      const params = {};
      const deeplinkPaths = {
        'twitterIOS': 'twitter/ios',
        'twitterAndroid': 'twitter/android',
      };
      const expected = {
        '$ios_deeplink_path': 'twitter/ios',
        '$android_deeplink_path': 'twitter/android',
      };
      assert.deepEqual(
        expected,
        prioritizeDeeplinkPaths(params, deeplinkPaths),
        'should be equal',
      );
    });
    it('$ios_deeplink_path and $android_deeplink_path should be formed from twitter tags. $deeplink_path should also be present', function () {
      const params = {};
      const deeplinkPaths = {
        'twitterIOS': 'twitter/some/path',
        'twitterAndroid': 'twitter/some/path',
      };
      const expected = {
        '$ios_deeplink_path': 'twitter/some/path',
        '$android_deeplink_path': 'twitter/some/path',
        '$deeplink_path': 'twitter/some/path',
      };
      assert.deepEqual(
        expected,
        prioritizeDeeplinkPaths(params, deeplinkPaths),
        'should be equal',
      );
    });
    it('Original key:value pairs in params should be present', function () {
      const params = { '$key1': 'val1', '$key2': 'val2' };
      const deeplinkPaths = {};
      const expected = {
        '$key1': 'val1',
        '$key2': 'val2',
      };
      assert.deepEqual(
        expected,
        prioritizeDeeplinkPaths(params, deeplinkPaths),
        'should be equal',
      );
    });
  });

  describe('processHostedDeepLinkData', function () {
    // Helper: build a mock meta element matching the DOM interface processHostedDeepLinkData uses
    // (only getAttribute('name') / getAttribute('property') / getAttribute('content')).
    function meta(attrs) {
      return {
        getAttribute: function (key) {
          return Object.prototype.hasOwnProperty.call(attrs, key)
            ? attrs[key]
            : null;
        },
      };
    }

    it('returns an empty object when there are no meta tags', function () {
      assert.deepEqual({}, processHostedDeepLinkData([]));
      assert.deepEqual({}, processHostedDeepLinkData(null));
    });

    it('ignores meta tags that have no name/property or no content', function () {
      const metadata = [
        meta({ name: 'twitter:app:url:iphone' }), // missing content
        meta({ content: 'appuri://path/ios' }), // missing name/property
        meta({ name: 'description', content: 'irrelevant' }),
      ];
      assert.deepEqual({}, processHostedDeepLinkData(metadata));
    });

    it('scrapes twitter:app:url:iphone into $ios_deeplink_path (path only, no scheme)', function () {
      const metadata = [
        meta({
          name: 'twitter:app:url:iphone',
          content: 'aetvplus://showid/SERIES5053',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('showid/SERIES5053', result.$ios_deeplink_path);
    });

    it('scrapes twitter:app:url:googleplay into $android_deeplink_path', function () {
      const metadata = [
        meta({
          name: 'twitter:app:url:googleplay',
          content: 'aetvplus://showid/SERIES5053',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('showid/SERIES5053', result.$android_deeplink_path);
    });

    it('scrapes both Twitter iphone + googleplay tags in one pass', function () {
      const metadata = [
        meta({
          name: 'twitter:app:url:iphone',
          content: 'aetvplus://ios/path',
        }),
        meta({
          name: 'twitter:app:url:googleplay',
          content: 'aetvplus://android/path',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('ios/path', result.$ios_deeplink_path);
      assert.strictEqual('android/path', result.$android_deeplink_path);
    });

    it('scrapes al:ios:url / al:android:url App Links tags', function () {
      const metadata = [
        meta({ property: 'al:ios:url', content: 'appuri://applinks/ios' }),
        meta({
          property: 'al:android:url',
          content: 'appuri://applinks/android',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('applinks/ios', result.$ios_deeplink_path);
      assert.strictEqual('applinks/android', result.$android_deeplink_path);
    });

    it('scrapes Branch-hosted branch:deeplink:$ios_deeplink_path / $android_deeplink_path', function () {
      const metadata = [
        meta({
          name: 'branch:deeplink:$ios_deeplink_path',
          content: 'hosted://ios/path',
        }),
        meta({
          name: 'branch:deeplink:$android_deeplink_path',
          content: 'hosted://android/path',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('ios/path', result.$ios_deeplink_path);
      assert.strictEqual('android/path', result.$android_deeplink_path);
    });

    it('forwards other branch:deeplink:* tags through as link data params', function () {
      const metadata = [
        meta({ name: 'branch:deeplink:custom_key', content: 'custom_value' }),
        meta({ name: 'branch:deeplink:another_key', content: 'another_value' }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('custom_value', result.custom_key);
      assert.strictEqual('another_value', result.another_key);
    });

    it('prefers hosted > App Links > Twitter when multiple sources are present', function () {
      const metadata = [
        meta({
          name: 'branch:deeplink:$ios_deeplink_path',
          content: 'hosted://ios',
        }),
        meta({ property: 'al:ios:url', content: 'applinks://ios' }),
        meta({ name: 'twitter:app:url:iphone', content: 'twitter://ios' }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('ios', result.$ios_deeplink_path);
    });

    it('falls back from missing hosted → App Links for one OS while another OS uses Twitter', function () {
      const metadata = [
        meta({ property: 'al:ios:url', content: 'applinks://ios' }), // no hosted iOS
        meta({
          name: 'twitter:app:url:googleplay',
          content: 'twitter://android',
        }), // no hosted/applinks android
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('ios', result.$ios_deeplink_path);
      assert.strictEqual('android', result.$android_deeplink_path);
    });

    it('uses name over property when both are set on the same tag', function () {
      // name takes precedence in processHostedDeepLinkData's `name || property` logic
      const metadata = [
        meta({
          name: 'twitter:app:url:iphone',
          property: 'al:ios:url', // would-be App Links if name weren't present
          content: 'aetvplus://twitter/wins',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      assert.strictEqual('twitter/wins', result.$ios_deeplink_path);
    });
  });

  describe('getClickIdAndSearchStringFromLink', function () {
    it.skip('If /123abc is passed in, 123abc should be returned"', function () {
      const expected = '123abc';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink('/123abc'),
        'should be equal',
      );
    });
    it.skip('If /c/123abc is passed in, 123abc should be returned"', function () {
      const expected = '123abc';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink('/c/123abc'),
        'should be equal',
      );
    });
    it.skip('If /c/123abc?key1=val1 is passed in, 123abc?key1=val1 should be returned"', function () {
      const expected = '123abc?key1=val1';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink('/c/123abc?key1=val1'),
        'should be equal',
      );
    });
    it('If {} is passed in, "" should be returned"', function () {
      const expected = '';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(''),
        'should be equal',
      );
    });
    it('If "" is passed in, "" should be returned"', function () {
      const expected = '';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(''),
        'should be equal',
      );
    });
    it('If undefined is passed in, "" should be returned"', function () {
      const expected = '';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(undefined),
        'should be equal',
      );
    });
    it('If null is passed in, "" should be returned"', function () {
      const expected = '';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(null),
        'should be equal',
      );
    });
    it('If "http://example.com:3000?test=test" is passed in, ?test=test should be returned"', function () {
      const expected = '?test=test';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(
          'http://example.com:3000?test=test',
        ),
        'should be equal',
      );
    });
    it('If "http://example.com:3000/?test=test" is passed in, ?test=test should be returned"', function () {
      const expected = '?test=test';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(
          'http://example.com:3000/?test=test',
        ),
        'should be equal',
      );
    });
    it('If "http://example.com:3000/c/clickid?search=test#hash" is passed in, clickid?search=test should be returned"', function () {
      const expected = 'clickid?search=test';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(
          'http://example.com:3000/c/clickid?search=test#hash',
        ),
        'should be equal',
      );
    });
    it('If "http://example.com:3000/c/clickid/?search=test#hash" is passed in, clickid?search=test should be returned"', function () {
      const expected = 'clickid?search=test';
      assert.strictEqual(
        expected,
        getEnv().clickIdAndSearchStringFromLink(
          'http://example.com:3000/c/clickid/?search=test#hash',
        ),
        'should be equal',
      );
    });
  });
  describe('convertObjectValuesToString', function () {
    it("a simple object's values should be stringified", function () {
      const initial = {
        key1: 1,
        key2: 2,
      };
      const expected = {
        key1: '1',
        key2: '2',
      };
      assert.deepEqual(
        expected,
        convertObjectValuesToString(initial),
        'objects values are not strings',
      );
    });
    it("a complex object's values should be stringified", function () {
      const initial = {
        'revenue': 123,
        'currency': 'USD',
        'custom_key_0': { 'sku': 'foo-sku-7', 'price': 8.5, 'quantity': 4 },
        'custom_key_1': [
          { 'sku': 'foo-sku-7', 'price': 8.5, 'quantity': 4 },
          'testing',
        ],
      };
      const expected = {
        'revenue': '123',
        'currency': 'USD',
        'custom_key_0': '{"sku":"foo-sku-7","price":8.5,"quantity":4}',
        'custom_key_1':
          '[{"sku":"foo-sku-7","price":8.5,"quantity":4},"testing"]',
      };
      assert.deepEqual(
        expected,
        convertObjectValuesToString(initial),
        'objects values are not strings',
      );
    });
    it('should return empty object', function () {
      const initial = {};
      assert.deepEqual(
        {},
        convertObjectValuesToString(initial),
        'should return empty object',
      );
    });
  });

  describe('convertValueToString', function () {
    it('should stringify a number', function () {
      const initial = 0;
      const expected = '0';
      assert.strictEqual(
        expected,
        convertValueToString(initial),
        '0 should be converted to "0"',
      );
    });

    it('should stringify a boolean', function () {
      const initial = true;
      const expected = 'true';
      assert.strictEqual(
        expected,
        convertValueToString(initial),
        'true should be converted to "true"',
      );
    });

    it('should stringify null', function () {
      const initial = null;
      const expected = 'null';
      assert.strictEqual(
        expected,
        convertValueToString(initial),
        'null should be converted to "null"',
      );
    });

    it('should stringify an object', function () {
      const initial = { 'sku': 'foo-sku-7', 'price': 8.5, 'quantity': 4 };
      const expected = '{"sku":"foo-sku-7","price":8.5,"quantity":4}';
      assert.strictEqual(
        expected,
        convertValueToString(initial),
        'object should be stringified',
      );
    });

    it('should stringify an array', function () {
      const initial = [
        { 'sku': 'foo-sku-7', 'price': 8.5, 'quantity': 4 },
        'testing',
      ];
      const expected =
        '[{"sku":"foo-sku-7","price":8.5,"quantity":4},"testing"]';
      assert.strictEqual(
        expected,
        convertValueToString(initial),
        'array should be stringified',
      );
    });
  });

  describe('isSafari11OrGreater', function () {
    const originalUa = navigator.userAgent;

    function setUserAgent(ua) {
      navigator.__defineGetter__('userAgent', function () {
        return ua;
      });
    }

    afterEach(function () {
      setUserAgent(originalUa);
    });

    const popularBrowsers = [
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
      'Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 5.0) Opera 7.02 Bork-edition [en]',
    ];

    it('should return false for non safari browsers', function () {
      let isSafari11 = false;
      popularBrowsers.forEach(function (ua) {
        setUserAgent(ua);
        if (navigator.userAgent === ua && isSafari11OrGreater()) {
          isSafari11 = true;
        }
      });

      assert.strictEqual(
        isSafari11,
        false,
        'should return false for all browsers',
      );
    });

    const safari11 = [
      'Mozilla/5.0 (iPod touch; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.31 (KHTML, like Gecko) Version/11.0 Mobile/15A5327g Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304j Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304i Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.31 (KHTML, like Gecko) Version/11.0 Mobile/15A5327g Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Mobile/15A5318g Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304j Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.21 (KHTML, like Gecko) Version/11.0 Mobile/15A5278f Safari/602.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A5304i Safari/604.1',
    ];

    it('should return true for safari 11 browsers', function () {
      let isSafari11 = true;
      safari11.forEach(function (ua) {
        setUserAgent(ua);
        if (navigator.userAgent === ua && !isSafari11OrGreater()) {
          isSafari11 = false;
        }
      });

      assert.strictEqual(
        isSafari11,
        true,
        'should return true for all browsers',
      );
    });
  });
  describe('separateEventAndCustomData ', function () {
    it('extracted custom and event data should equal initial objects', function () {
      const event_data = {
        'transaction_id': '1AB23456C7890123D',
        'revenue': 6.0,
        'currency': 'USD',
        'shipping': 3.0,
        'tax': 3.0,
        'coupon': '8891701',
        'affiliation': 'xyz_affiliation',
        'search_query': 'boat shoes sperrys',
        'description': 'Sperry Authentic Original',
      };

      const custom_data = {
        'custom_key_1': 'custom_val_1',
        'custom_key_2': 'custom_val_2',
        'custom_key_3': 'custom_val_3',
      };

      const event_and_custom_data = {};

      merge(event_and_custom_data, event_data);
      merge(event_and_custom_data, custom_data);

      const extractedEventAndCustomData = separateEventAndCustomData(
        event_and_custom_data,
      );
      assert.deepEqual(
        event_data,
        extractedEventAndCustomData.event_data,
        'extracted event_data should equal initial event_data',
      );
      assert.deepEqual(
        custom_data,
        extractedEventAndCustomData.custom_data,
        'extracted custom_data should equal initial custom_data',
      );
    });

    it('isStandardEvent() should return true for standard events and false for custom events', function () {
      const standardEvent = 'ADD_TO_WISHLIST';
      const customEvent = 'ADD_TO_WISHLISTT';

      assert.strictEqual(
        true,
        isStandardEvent(standardEvent),
        'should return true for ADD_TO_WISHLIST',
      );
      assert.strictEqual(
        false,
        isStandardEvent(customEvent),
        'should return false for ADD_TO_WISHLISTT',
      );
    });

    it('should return true or false for a given parameter and type', function () {
      const parameter1 = {};
      const parameter2 = [];
      const parameter3 = 'test';
      const type1 = 'object';
      const type2 = 'array';
      const type3 = 'string';
      assert.strictEqual(
        false,
        validateParameterType(null, type1),
        'should return false',
      );
      assert.strictEqual(
        false,
        validateParameterType(parameter1, null),
        'should return false',
      );

      assert.strictEqual(
        true,
        validateParameterType(parameter1, type1),
        'should return true',
      );
      assert.strictEqual(
        false,
        validateParameterType(parameter1, type2),
        'should return false',
      );
      assert.strictEqual(
        false,
        validateParameterType(parameter1, type3),
        'should return false',
      );

      assert.strictEqual(
        false,
        validateParameterType(parameter2, type1),
        'should return false',
      );
      assert.strictEqual(
        true,
        validateParameterType(parameter2, type2),
        'should return true',
      );
      assert.strictEqual(
        false,
        validateParameterType(parameter2, type3),
        'should return false',
      );

      assert.strictEqual(
        false,
        validateParameterType(parameter3, type1),
        'should return false',
      );
      assert.strictEqual(
        false,
        validateParameterType(parameter3, type2),
        'should return false',
      );
      assert.strictEqual(
        true,
        validateParameterType(parameter3, type3),
        'should return true',
      );
    });
  });

  describe('mergeMetadataFromInitToHostedMetadata', function () {
    it.skip('override previous hosted_deeplink_data keys via user-supplied metadata object', function () {
      const additionalMetadata = {};
      additionalMetadata.hosted_deeplink_data = getEnv().hostedDeepLinkData();
      const userSuppliedMetadata = { watch_brand: 'Seiko', type: 'Presage' };
      const response = mergeHostedDeeplinkData(
        additionalMetadata.hosted_deeplink_data,
        userSuppliedMetadata,
      );
      const expected = {
        watch_brand: 'Seiko',
        type: 'Presage',
        $ios_deeplink_path: 'applinks/hamilton/khaki/ios',
        $android_deeplink_path: 'twitter/hamilton/khaki/android',
      };
      assert.deepEqual(expected, response, 'should be equal');
    });

    it.skip('merge hosted_deeplink_data and user-supplied metadata', function () {
      const additionalMetadata = {};
      additionalMetadata.hosted_deeplink_data = getEnv().hostedDeepLinkData();
      const userSuppliedMetadata = { productA: '12345' };
      const response = mergeHostedDeeplinkData(
        additionalMetadata.hosted_deeplink_data,
        userSuppliedMetadata,
      );
      const expected = {
        watch_brand: 'Hamilton',
        type: 'Khaki Aviation Stainless Steel Automatic Leather-Strap Watch',
        $ios_deeplink_path: 'applinks/hamilton/khaki/ios',
        $android_deeplink_path: 'twitter/hamilton/khaki/android',
        productA: '12345',
      };
      assert.deepEqual(expected, response, 'should be equal');
    });

    it('tests with metadata and without hosted_deeplink_data', function () {
      const additionalMetadata = {};
      const userSuppliedMetadata = { productA: '12345' };
      const response = mergeHostedDeeplinkData(
        additionalMetadata.hosted_deeplink_data,
        userSuppliedMetadata,
      );
      const expected = { productA: '12345' };
      assert.deepEqual(expected, response, 'should be equal');
    });

    it("ensure that additionalMetadata['hosted_deeplink_data'] does not get mutated", function () {
      const additionalData = { 'root_key': '1234' };
      additionalData.hosted_deeplink_data = { productA: '12345' };
      const userSuppliedMetadata = { productB: '12345' };
      mergeHostedDeeplinkData(
        additionalData.hosted_deeplink_data,
        userSuppliedMetadata,
      );
      const expected = {
        'root_key': '1234',
        'hosted_deeplink_data': { productA: '12345' },
      };
      assert.deepEqual(expected, additionalData, 'should be equal');
    });

    it('ensure that userSuppliedMetadata does not get mutated', function () {
      const additionalData = {};
      additionalData.hosted_deeplink_data = { productA: '12345' };
      const userSuppliedMetadata = { productB: '12345' };
      mergeHostedDeeplinkData(
        additionalData.hosted_deeplink_data,
        userSuppliedMetadata,
      );
      const expected = { productB: '12345' };
      assert.deepEqual(expected, userSuppliedMetadata, 'should be equal');
    });
  });
  describe('Tests for ctx.userPreferences.shouldBlockRequest()', function () {
    it('should return true with v1/bogus as url endpoint', function () {
      assert.strictEqual(
        true,
        createContext().userPreferences.shouldBlockRequest(
          'https://api2.branch.io/v1/bogus',
        ),
      );
    });
    it('should return true with v1/open as url endpoint and no request data provided', function () {
      assert.strictEqual(
        true,
        createContext().userPreferences.shouldBlockRequest(
          'https://api2.branch.io/v1/open',
        ),
      );
    });
    it('should return false with v1/open as url endpoint and valid request data provided', function () {
      assert.strictEqual(
        false,
        createContext().userPreferences.shouldBlockRequest(
          'https://api2.branch.io/v1/open',
          { link_identifier: '111111111111' },
        ),
      );
    });
    it('should return true with v1/xyz as url endpoint and with bogus request data', function () {
      assert.strictEqual(
        true,
        createContext().userPreferences.shouldBlockRequest(
          'https://api2.branch.io/v1/xyz',
          { link_identifier: '111111111111' },
        ),
      );
    });
    it('should allow raw links', function () {
      assert.strictEqual(
        false,
        createContext().userPreferences.shouldBlockRequest(
          'https://bnctestbed.app.link/abcdefg',
        ),
      );
    });
  });

  describe('delay function', function () {
    it('calls synchronously for a non-numeric delay argument', function () {
      let executed = false;
      delay(function () {
        executed = true;
      }, NaN);
      // executed is true immediately after the call
      assert.equal(true, executed);
    });

    it('calls synchronously for a zero delay argument', function () {
      let executed = false;
      delay(function () {
        executed = true;
      }, 0);
      // executed is true immediately after the call
      assert.equal(true, executed);
    });

    it('calls synchronously for a negative delay argument', function () {
      let executed = false;
      delay(function () {
        executed = true;
      }, -25);
      // executed is true immediately after the call
      assert.equal(true, executed);
    });

    it('delays for any positive numeric argument', function () {
      let executed = false;
      vi.useFakeTimers();
      delay(function () {
        executed = true;
      }, 100);
      // executed is still false immediately after the call
      assert.equal(false, executed);
      vi.advanceTimersByTime(101);
      assert.equal(true, executed);
      vi.useRealTimers();
    });
  });

  describe('isWebKitBrowser function', function () {
    const originalWebKitURL = window.webkitURL;

    it('returns true when window.webkitURL is defined', function () {
      // pretend to be webkit
      if (!window.webkitURL) {
        window.webkitURL = 'https://example.com';
      }
      assert.equal(browserEnv.isWebKit(), true);
    });

    it('returns false when window.webkitURL is not defined', function () {
      // pretend not to be webkit
      if (window.webkitURL) {
        delete window.webkitURL;
      }
      assert.equal(browserEnv.isWebKit(), false);
    });

    if (originalWebKitURL !== undefined) {
      window.webkitURL = originalWebKitURL;
    } else {
      delete window.webkitURL;
    }
  });

  describe('isIOSWKWebView function', function () {
    const originalUa = navigator.userAgent;
    const originalWebKitURL = window.webkitURL;
    const iOSBrowsers = {
      safari:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
      chrome:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/84.0.4147.71 Mobile/15E148 Safari/604.1',
      firefox:
        'Mozilla/5.0 (iPhone; CPU OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/28.0 Mobile/15E148 Safari/605.1.15',
      edge: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 EdgiOS/45.7.3 Mobile/15E148 Safari/605.1.15',
      opera:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPT/2.4.4 Mobile/15E148',
      yandex:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 YaBrowser/20.7.2.279.10 Mobile/15E148 Safari/604.1',
      wkwebview:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
      uiwebview:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    };

    function setUserAgent(ua) {
      navigator.__defineGetter__('userAgent', function () {
        return ua;
      });
    }

    afterEach(function () {
      setUserAgent(originalUa);
      if (originalWebKitURL !== undefined) {
        window.webkitURL = originalWebKitURL;
      } else {
        delete window.webkitURL;
      }
    });

    it('should return false for Firefox', function () {
      setUserAgent(iOSBrowsers.firefox);
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), false);
    });

    it('should return false for Chrome', function () {
      setUserAgent(iOSBrowsers.chrome);
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), false);
    });

    it('should return false for Edge', function () {
      setUserAgent(iOSBrowsers.edge);
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), false);
    });

    it('should return false for Yandex', function () {
      setUserAgent(iOSBrowsers.yandex);
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), false);
    });

    it('should return false for Opera', function () {
      setUserAgent(iOSBrowsers.firefox);
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), false);
    });

    it('should return true when UA includes iPhone & window.webkitURL is defined', function () {
      setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)',
      );
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), true);
    });

    it('should return true when UA includes iPad & window.webkitURL is defined', function () {
      setUserAgent(
        'Mozilla/5.0 (iPad; U; CPU OS 5_1 like Mac OS X) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B367 Safari/531.21.10 UCBrowser/3.4.3.532',
      );
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), true);
    });

    it('should return true when UA includes iPod & window.webkitURL is defined', function () {
      // fake, based on iPhone from above
      setUserAgent(
        'Mozilla/5.0 (iPod; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)',
      );
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), true);
    });

    it('should return false when UA is not iOS but window.webkitURL is defined', function () {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0',
      );
      window.webkitURL = function () {};

      assert.equal(isIOSWKWebView(), false);
    });

    it('should return false when UA is iOS but window.webkitURL is not defined', function () {
      setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; http://www.bing.com/bingbot.htm)',
      );
      delete window.webkitURL;

      assert.equal(isIOSWKWebView(), false);
    });
  });

  describe('addPropertyIfNotNullorEmpty', function () {
    it('should not add property if value is empty', function () {
      const obj = { 'prop1': 'value1' };
      const expectedObj = {
        'prop1': 'value1',
      };
      assert.deepEqual(
        addPropertyIfNotNullorEmpty(obj, 'prop2', ''),
        expectedObj,
        'Correctly added property to object',
      );
    });
    it('should not add property if value is null', function () {
      const obj = { 'prop1': 'value1' };
      const expectedObj = {
        'prop1': 'value1',
      };
      assert.deepEqual(
        addPropertyIfNotNullorEmpty(obj, 'prop2', null),
        expectedObj,
        'Correctly added property to object',
      );
    });
    it('should add property if value is not empty', function () {
      const obj = { 'prop1': 'value1' };
      const expectedObj = {
        'prop1': 'value1',
        'prop2': 'value2',
      };
      assert.deepEqual(
        addPropertyIfNotNullorEmpty(obj, 'prop2', 'value2'),
        expectedObj,
        'Correctly added property to object',
      );
    });
  });

  describe('removeTrailingDotZeros', function () {
    it('should return empty if value is empty', function () {
      const versionNumber = '';
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        versionNumber,
        'Correctly matched empty',
      );
    });
    it('should return null if value is null', function () {
      const versionNumber = null;
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        versionNumber,
        'Correctly matched null',
      );
    });
    it('no dot- should not strip trailing dot zero', function () {
      const versionNumber = '10';
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        versionNumber,
        'Correctly strip trailing zeros',
      );
    });
    it('with dot and no zeros- should not strip trailing dot zero', function () {
      const versionNumber = '10.10';
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        versionNumber,
        'Correctly strip trailing zeros',
      );
    });
    it('single dot- should not strip trailing dot zero', function () {
      const versionNumber = '10.0';
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        versionNumber,
        'Correctly strip trailing zeros',
      );
    });
    it('multi-dot : should return string with trailing dot zeros stripped', function () {
      const versionNumber = '10.0.0';
      const expected = '10';
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        expected,
        'Correctly strip trailing zeros',
      );
    });
    it('should not strip trailing dot zero', function () {
      const versionNumber = '10.0.1';
      assert.deepEqual(
        removeTrailingDotZeros(versionNumber),
        versionNumber,
        'Correctly strip trailing zeros',
      );
    });
  });
  describe('getPlatformByUserAgent', function () {
    const originalScreenHeight = screen.height;
    const originalScreenWidth = screen.width;
    const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'navigator',
    );
    const userAgentsList = {
      android_chrome: {
        ua: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36',
        platform: 'android',
      },
      iOS_safari: {
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        platform: 'ios',
      },
      iOS_chrome: {
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.169 Mobile/15E148 Safari/604.1',
        platform: 'ios',
      },
      iOS_ipad_safari: {
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15',
        platform: 'ipad',
      },
      macOS_safari: {
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        platform: 'desktop',
      },
      macOS_chrome: {
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        platform: 'desktop',
      },
      windows_edge: {
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.2151.93',
        platform: 'desktop',
      },
      windows_chrome: {
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        platform: 'desktop',
      },
      linux_chrome: {
        ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        platform: 'desktop',
      },
    };

    function setUserAgent(ua) {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        get: function () {
          return {
            userAgent: ua,
          };
        },
      });
    }

    afterEach(function () {
      Object.defineProperty(
        globalThis,
        'navigator',
        originalNavigatorDescriptor,
      );
      Object.defineProperty(window.screen, 'width', {
        writable: true,
        configurable: true,
        value: originalScreenWidth,
      });
      Object.defineProperty(window.screen, 'height', {
        writable: true,
        configurable: true,
        value: originalScreenHeight,
      });
    });
    it('should return "android" for Android chrome user agent', function () {
      setUserAgent(userAgentsList.android_chrome.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.android_chrome.platform,
      );
    });
    it('should return "ios" for ios safari user agent', function () {
      setUserAgent(userAgentsList.iOS_safari.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.iOS_safari.platform,
      );
    });
    it('should return "ios" for ios chrome user agent', function () {
      setUserAgent(userAgentsList.iOS_chrome.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.iOS_chrome.platform,
      );
    });
    it('should return "ipad" for iOS ipad safari user agent', function () {
      setUserAgent(userAgentsList.iOS_ipad_safari.ua);
      Object.defineProperty(window.screen, 'width', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window.screen, 'height', {
        writable: true,
        configurable: true,
        value: 1366,
      });
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.iOS_ipad_safari.platform,
      );
    });
    it('should return "desktop" for macOS safari user agent', function () {
      setUserAgent(userAgentsList.macOS_safari.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.macOS_safari.platform,
      );
    });
    it('should return "desktop" for macOS chrome user agent', function () {
      setUserAgent(userAgentsList.macOS_chrome.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.macOS_chrome.platform,
      );
    });
    it('should return "desktop" for windows edge user agent', function () {
      setUserAgent(userAgentsList.windows_edge.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.windows_edge.platform,
      );
    });
    it('should return "desktop" for windows chrome user agent', function () {
      setUserAgent(userAgentsList.windows_chrome.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.windows_chrome.platform,
      );
    });
    it('should return "desktop" for linux chrome user agent', function () {
      setUserAgent(userAgentsList.linux_chrome.ua);
      assert.equal(
        getPlatformByUserAgent(),
        userAgentsList.linux_chrome.platform,
      );
    });
  });

  describe('shouldAddDMAParams', function () {
    it('should return true for valid endpoints', function () {
      assert.equal(shouldAddDMAParams('/v1/open'), true);
      assert.equal(shouldAddDMAParams('/v1/pageview'), true);
      assert.equal(shouldAddDMAParams('/v2/event/standard'), true);
      assert.equal(shouldAddDMAParams('/v2/event/custom'), true);
    });

    it('should return false for invalid endpoints', function () {
      assert.equal(shouldAddDMAParams('/v3/invalid'), false);
      assert.equal(shouldAddDMAParams('/v2/others'), false);
    });
  });

  describe('setDMAParams', function () {
    it('should add DMA parameters for valid endpoints: v1/open', () => {
      const data = {};
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };
      setDMAParams(data, dmaObj, '/v1/open');
      assert.deepEqual(data, {
        dma_eea: true,
        dma_ad_personalization: true,
        dma_ad_user_data: false,
      });
    });
    it('should add DMA parameters for valid endpoints: v2/event/standard', () => {
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };

      const data2 = {};
      setDMAParams(data2, dmaObj, '/v2/event/standard');
      assert.deepEqual(data2, {
        'user_data':
          '{"dma_eea":true,"dma_ad_personalization":true,"dma_ad_user_data":false}',
      });
    });
    it('should add DMA parameters for valid endpoints: v2/event/custom', () => {
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };

      const data2 = {};
      setDMAParams(data2, dmaObj, '/v2/event/custom');
      assert.deepEqual(data2, {
        'user_data':
          '{"dma_eea":true,"dma_ad_personalization":true,"dma_ad_user_data":false}',
      });
    });
    it('should add DMA parameters for valid endpoints: v2/event/custom', () => {
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };

      const data2 = {};
      data2.user_data = JSON.stringify({
        'test': true,
      });
      setDMAParams(data2, dmaObj, '/v2/event/custom');
      assert.deepEqual(data2, {
        'user_data':
          '{"test":true,"dma_eea":true,"dma_ad_personalization":true,"dma_ad_user_data":false}',
      });
    });
    it('should add DMA parameters for valid endpoints: v1/pageview', () => {
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };

      const data2 = {};
      setDMAParams(data2, dmaObj, '/v1/pageview');
      assert.deepEqual(data2, {
        dma_eea: true,
        dma_ad_personalization: true,
        dma_ad_user_data: false,
      });
    });
    it('should not add DMA parameters for invalid endpoints: v1/invalid', () => {
      const data = {};
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };

      setDMAParams(data, dmaObj, '/v1/invalid');
      assert.deepEqual(data, {});
    });
    it('should not add DMA parameters for invalid endpoints: v1/dismiss', () => {
      const data = {};
      const dmaObj = {
        eeaRegion: true,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };

      setDMAParams(data, dmaObj, '/v1/dismiss');
      assert.deepEqual(data, {});
    });
  });
  describe('isValidUrl', function () {
    // Invalid schemes
    it('should return false for invalid scheme htt', function () {
      assert.equal(isValidURL('htt://www.example.com'), false);
    });
    it('should return false for missing scheme', function () {
      assert.equal(isValidURL('://www.example.com'), false);
    });

    // Invalid domain names
    it('should return false for missing domain', function () {
      assert.equal(isValidURL('https://example'), false);
    });
    it('should return false for missing domain after dot', function () {
      assert.equal(isValidURL('https://example.'), false);
    });
    it('should return false for missing domain before dot', function () {
      assert.equal(isValidURL('https://.example.com'), false);
    });

    // Invalid domain names
    it('should return false for Invalid domain names', function () {
      assert.equal(isValidURL('www.example.com'), false);
    });
    it('should return false for Invalid domain names 2', function () {
      assert.equal(isValidURL('example.com'), false);
    });
    // Empty URL
    it('should return false for empty url', function () {
      assert.equal(isValidURL(''), false);
    });

    it('should return false for Invalid domain names 2', function () {
      assert.equal(isValidURL(''), false);
    });

    it('should return false for null', function () {
      assert.equal(isValidURL(null), false);
    });

    it('should return false for undefined', function () {
      assert.equal(isValidURL(undefined), false);
    });

    it('should return false for invalid path', function () {
      assert.equal(
        isValidURL('https://www.example.com/path with spaces'),
        false,
      );
    });

    it('should return true for valid url - https', function () {
      assert.equal(isValidURL('https://api2.branch.io'), true);
    });

    it('should return true for valid url - http', function () {
      assert.equal(isValidURL('http://api2.branch.io'), true);
    });
  });
});
