import { browserEnv, getEnv, setEnv } from '../../src/env/env.js';
import { makeFakeEnv, UA } from '../helpers/fake-env.js';

const ENV_KEYS = [
  'windowLocation',
  'locationSearch',
  'locationHash',
  'currentUrl',
  'initialReferrer',
  'isIframe',
  'isSameOriginFrame',
  'isWebKit',
  'userAgent',
  'userAgentData',
  'browserLanguageCode',
  'screenHeight',
  'screenWidth',
  'timeSinceNavigationStart',
  'navigationTimingAPIEnabled',
  'openGraphContent',
  'title',
  'description',
  'canonicalURL',
  'hostedDeepLinkData',
  'clickIdAndSearchStringFromLink',
];

function addToHead(html) {
  const holder = document.createElement('div');
  holder.innerHTML = html;
  const nodes = Array.from(holder.childNodes);
  nodes.forEach(function (node) {
    document.head.appendChild(node);
  });
  return nodes;
}

describe('env', function () {
  let added = [];

  afterEach(function () {
    added.forEach(function (node) {
      node.parentNode?.removeChild(node);
    });
    added = [];
    testUtils.go('');
    setEnv(null);
  });

  describe('browserEnv in jsdom', function () {
    it('implements every Env member as a function', function () {
      ENV_KEYS.forEach(function (key) {
        expect(typeof browserEnv[key]).toBe('function');
      });
    });

    it('reads location, search and hash from window.location', function () {
      testUtils.go('?a=1&b=2#r:abc');
      expect(browserEnv.windowLocation()).toBe(String(window.location));
      expect(browserEnv.currentUrl()).toBe(window.location.href);
      expect(browserEnv.locationSearch()).toBe('?a=1&b=2');
      expect(browserEnv.locationHash()).toBe('#r:abc');
    });

    it('is not an iframe at the top level', function () {
      expect(browserEnv.isIframe()).toBe(false);
      expect(browserEnv.isSameOriginFrame()).toBe(true);
    });

    it('uses document.referrer as the initial referrer outside an iframe', function () {
      expect(browserEnv.initialReferrer()).toBe(document.referrer);
    });

    it('reads the user agent and screen size', function () {
      expect(browserEnv.userAgent()).toBe(navigator.userAgent);
      expect(browserEnv.screenHeight()).toBe(screen.height || 0);
      expect(browserEnv.screenWidth()).toBe(screen.width || 0);
      expect(browserEnv.isWebKit()).toBe(!!window.webkitURL);
    });

    it('returns null for og tags that are absent, or the given default', function () {
      expect(browserEnv.openGraphContent('title')).toBeNull();
      expect(browserEnv.openGraphContent('title', 'fallback')).toBe('fallback');
    });

    it('returns og tag content when present', function () {
      added = addToHead(
        '<meta property="og:title" content="OG Title">' +
          '<meta name="description" content="A page">' +
          '<link rel="canonical" href="https://example.com/canonical">',
      );
      expect(browserEnv.openGraphContent('title')).toBe('OG Title');
      expect(browserEnv.openGraphContent('title', 'fallback')).toBe('OG Title');
      expect(browserEnv.description()).toBe('A page');
      expect(browserEnv.canonicalURL()).toBe('https://example.com/canonical');
    });

    it('parses hosted deep link meta tags', function () {
      expect(browserEnv.hostedDeepLinkData()).toEqual({});
      added = addToHead(
        '<meta name="branch:deeplink:$ios_deeplink_path" content="app://some/path">' +
          '<meta name="branch:deeplink:custom" content="value">',
      );
      expect(browserEnv.hostedDeepLinkData()).toEqual({
        $ios_deeplink_path: 'some/path',
        custom: 'value',
      });
    });

    it('extracts the click id and search string from a link', function () {
      expect(
        browserEnv.clickIdAndSearchStringFromLink(
          'https://example.app.link/abc123?x=1',
        ),
      ).toBe('abc123?x=1');
      expect(browserEnv.clickIdAndSearchStringFromLink('')).toBe('');
    });
  });

  describe('getEnv / setEnv', function () {
    it('returns browserEnv by default', function () {
      expect(getEnv()).toBe(browserEnv);
    });

    it('swaps in a fake env and restores browserEnv with null', function () {
      const fake = makeFakeEnv({ userAgent: () => UA.iphoneSafari });
      setEnv(fake);
      expect(getEnv()).toBe(fake);
      expect(getEnv().userAgent()).toBe(UA.iphoneSafari);
      expect(getEnv().windowLocation()).toBe('https://shop.example.com/p');
      setEnv(null);
      expect(getEnv()).toBe(browserEnv);
    });

    it('makeFakeEnv provides every Env member', function () {
      const fake = makeFakeEnv();
      expect(Object.keys(fake).sort()).toEqual([...ENV_KEYS].sort());
    });
  });
});
