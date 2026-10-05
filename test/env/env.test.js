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

  describe('browserEnv inside an iframe', function () {
    const restorers = [];

    function stubProperty(obj, key, value) {
      const original = Object.getOwnPropertyDescriptor(obj, key);
      Object.defineProperty(obj, key, {
        configurable: true,
        get: function () {
          return value;
        },
      });
      restorers.push(function () {
        if (original) {
          Object.defineProperty(obj, key, original);
        } else {
          delete obj[key];
        }
      });
    }

    const sameOriginTop = {
      location: {
        search: '?top=1',
        hash: '#top-hash',
        href: 'https://top.example.com/page?top=1#top-hash',
      },
      document: { referrer: 'https://top-referrer.example.com/' },
    };

    function crossOriginTop() {
      const top = {};
      ['location', 'document'].forEach(function (key) {
        Object.defineProperty(top, key, {
          get: function () {
            throw new Error('SecurityError: cross-origin frame');
          },
        });
      });
      return top;
    }

    beforeEach(function () {
      testUtils.go('?own=1#own-hash');
      stubProperty(document, 'referrer', 'https://frame-referrer.example.com/');
    });

    afterEach(function () {
      while (restorers.length) {
        restorers.pop()();
      }
    });

    describe('same-origin frame', function () {
      beforeEach(function () {
        stubProperty(window, 'top', sameOriginTop);
      });

      it('is an iframe and same-origin', function () {
        expect(browserEnv.isIframe()).toBe(true);
        expect(browserEnv.isSameOriginFrame()).toBe(true);
      });

      it('windowLocation is the frame document.referrer', function () {
        expect(browserEnv.windowLocation()).toBe(
          'https://frame-referrer.example.com/',
        );
      });

      it('locationSearch, locationHash and currentUrl come from window.top.location', function () {
        expect(browserEnv.locationSearch()).toBe('?top=1');
        expect(browserEnv.locationHash()).toBe('#top-hash');
        expect(browserEnv.currentUrl()).toBe(
          'https://top.example.com/page?top=1#top-hash',
        );
      });

      it('initialReferrer is window.top.document.referrer', function () {
        expect(browserEnv.initialReferrer()).toBe(
          'https://top-referrer.example.com/',
        );
      });
    });

    describe('cross-origin frame', function () {
      beforeEach(function () {
        stubProperty(window, 'top', crossOriginTop());
      });

      it('is an iframe but not same-origin', function () {
        expect(browserEnv.isIframe()).toBe(true);
        expect(browserEnv.isSameOriginFrame()).toBe(false);
      });

      it('windowLocation is still the frame document.referrer', function () {
        expect(browserEnv.windowLocation()).toBe(
          'https://frame-referrer.example.com/',
        );
      });

      it('locationSearch, locationHash and currentUrl fall back to the frame location', function () {
        expect(browserEnv.locationSearch()).toBe('?own=1');
        expect(browserEnv.locationHash()).toBe('#own-hash');
        expect(browserEnv.currentUrl()).toBe(window.location.href);
      });

      it('initialReferrer is the empty string', function () {
        expect(browserEnv.initialReferrer()).toBe('');
      });
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
