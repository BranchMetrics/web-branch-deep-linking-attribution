import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
  isWebKitBrowser,
} from '../../src/lib/ua.js';
import { UA } from '../golden/fixtures.js';

// Characterization tests: these pin what the ua helpers do today, quirks
// included. Do not "fix" expectations here without a behavior change.

function stubProperty(obj, key, value) {
  const original = Object.getOwnPropertyDescriptor(obj, key);
  Object.defineProperty(obj, key, {
    configurable: true,
    get: function () {
      return value;
    },
  });
  return function () {
    if (original) {
      Object.defineProperty(obj, key, original);
    } else {
      delete obj[key];
    }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lib/ua', () => {
  describe('getPlatformByUserAgent', () => {
    const cases = [
      ['desktop Chrome', UA.desktopChrome, 'desktop'],
      ['desktop Safari 17', UA.desktopSafari17, 'desktop'],
      ['iPhone Safari', UA.iphoneSafari, 'ios'],
      ['iOS WKWebView', UA.iosWKWebView, 'ios'],
      ['Android Chrome', UA.androidChrome, 'android'],
      ['Windows Edge', UA.windowsEdge, 'desktop'],
      // ChromeOS UAs use "X11; CrOS ..." rather than "Linux", so they are not
      // recognized by the Windows|Macintosh|Linux desktop check at all.
      [
        'ChromeOS (CrOS)',
        'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'other',
      ],
      // The ios check is the unanchored /i(os|p(hone|od))/i, which matches
      // the "ios" inside "KioskBrowser" (K-i-o-s-k), so this Linux kiosk
      // browser is misclassified as iOS rather than desktop.
      [
        'Linux kiosk browser',
        'Mozilla/5.0 (Linux; KioskBrowser) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
        'ios',
      ],
    ];

    it.each(cases)('%s -> %s', (_name, ua, expected) => {
      expect(getPlatformByUserAgent(ua)).toBe(expected);
    });
  });

  describe('isSafari11OrGreater', () => {
    it('is true for Safari 17', () => {
      expect(isSafari11OrGreater(UA.desktopSafari17)).toBe(true);
    });

    it('is false for non-Safari browsers', () => {
      expect(isSafari11OrGreater(UA.desktopChrome)).toBe(false);
      expect(isSafari11OrGreater(UA.androidChrome)).toBe(false);
    });
  });

  describe('isWebKitBrowser', () => {
    it('reflects window.webkitURL regardless of the ua argument', () => {
      const restore = stubProperty(window, 'webkitURL', function () {});
      expect(isWebKitBrowser(UA.desktopChrome)).toBe(true);
      restore();
    });

    it('is false when webkitURL is absent', () => {
      const restore = stubProperty(window, 'webkitURL', undefined);
      expect(isWebKitBrowser(UA.iosWKWebView)).toBe(false);
      restore();
    });
  });

  describe('isIOSWKWebView', () => {
    it('is true for an iOS WKWebView UA when webkitURL is present', () => {
      const restore = stubProperty(window, 'webkitURL', function () {});
      expect(isIOSWKWebView(UA.iosWKWebView)).toBe(true);
      restore();
    });

    it('is false for a non-iOS UA', () => {
      const restore = stubProperty(window, 'webkitURL', function () {});
      expect(isIOSWKWebView(UA.androidChrome)).toBe(false);
      restore();
    });

    it('is false when webkitURL is absent', () => {
      const restore = stubProperty(window, 'webkitURL', undefined);
      expect(isIOSWKWebView(UA.iosWKWebView)).toBe(false);
      restore();
    });
  });
});
