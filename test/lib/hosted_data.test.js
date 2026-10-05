import {
  mergeHostedDeeplinkData,
  prioritizeDeeplinkPaths,
  processHostedDeepLinkData,
} from '../../src/lib/hosted_data.js';

function metaTag({ name, property, content }) {
  return {
    getAttribute: (attr) => {
      if (attr === 'name') return name || null;
      if (attr === 'property') return property || null;
      if (attr === 'content') return content || null;
      return null;
    },
  };
}

describe('lib/hosted_data', () => {
  describe('prioritizeDeeplinkPaths', () => {
    it('returns params unchanged when there are no deeplink paths', () => {
      expect(prioritizeDeeplinkPaths({ a: 1 }, {})).toEqual({ a: 1 });
    });

    it('prefers hosted over applinks over twitter paths, per platform', () => {
      const result = prioritizeDeeplinkPaths(
        {},
        {
          hostedIOS: 'hosted-ios',
          applinksIOS: 'applinks-ios',
          twitterAndroid: 'twitter-android',
        },
      );
      expect(result.$ios_deeplink_path).toBe('hosted-ios');
      expect(result.$android_deeplink_path).toBe('twitter-android');
    });

    it('sets $deeplink_path when ios and android paths match', () => {
      const result = prioritizeDeeplinkPaths(
        {},
        { hostedIOS: 'same/path', hostedAndroid: 'same/path' },
      );
      expect(result.$deeplink_path).toBe('same/path');
    });
  });

  describe('processHostedDeepLinkData', () => {
    it('returns {} for empty metadata', () => {
      expect(processHostedDeepLinkData([])).toEqual({});
      expect(processHostedDeepLinkData(null)).toEqual({});
    });

    it('extracts branch:deeplink:* meta tags', () => {
      const metadata = [
        metaTag({
          name: 'branch:deeplink:$ios_deeplink_path',
          content: 'myapp://some/path',
        }),
        metaTag({
          name: 'branch:deeplink:$custom_param',
          content: 'custom-value',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      expect(result.$ios_deeplink_path).toBe('some/path');
      expect(result.$custom_param).toBe('custom-value');
    });

    it('extracts applinks and twitter meta tags', () => {
      const metadata = [
        metaTag({ property: 'al:ios:url', content: 'applinks://ios/path' }),
        metaTag({
          name: 'twitter:app:url:googleplay',
          content: 'twitter://android/path',
        }),
      ];
      const result = processHostedDeepLinkData(metadata);
      expect(result.$ios_deeplink_path).toBe('ios/path');
      expect(result.$android_deeplink_path).toBe('android/path');
    });
  });

  describe('mergeHostedDeeplinkData', () => {
    it('returns a clone of hosted data when there is no metadata', () => {
      const hosted = { a: 1 };
      const result = mergeHostedDeeplinkData(hosted, null);
      expect(result).toEqual({ a: 1 });
      expect(result).not.toBe(hosted);
    });

    it('merges metadata onto hosted data', () => {
      expect(mergeHostedDeeplinkData({ a: 1 }, { b: 2 })).toEqual({
        a: 1,
        b: 2,
      });
    });

    it('merges metadata alone when there is no hosted data', () => {
      expect(mergeHostedDeeplinkData(null, { b: 2 })).toEqual({ b: 2 });
    });
  });
});
