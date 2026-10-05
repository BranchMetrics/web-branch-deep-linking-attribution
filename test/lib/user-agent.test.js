import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
} from '../../src/lib/user-agent.js';
import { UA } from '../behavior/fixtures.js';

// Characterization tests: these pin what the ua helpers do today, quirks
// included. Do not "fix" expectations here without a behavior change.

describe('lib/user-agent', () => {
  describe('getPlatformByUserAgent', () => {
    const cases = [
      ['desktop Chrome', UA.desktopChrome, false, 'desktop'],
      ['desktop Safari 17', UA.desktopSafari17, false, 'desktop'],
      ['iPhone Safari', UA.iphoneSafari, false, 'ios'],
      ['iOS WKWebView', UA.iosWKWebView, false, 'ios'],
      ['Android Chrome', UA.androidChrome, false, 'android'],
      ['Windows Edge', UA.windowsEdge, false, 'desktop'],
      // ChromeOS UAs use "X11; CrOS ..." rather than "Linux", so they are not
      // recognized by the Windows|Macintosh|Linux desktop check at all.
      [
        'ChromeOS (CrOS)',
        'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        false,
        'other',
      ],
      // The ios check is the unanchored /i(os|p(hone|od))/i, which matches
      // the "ios" inside "KioskBrowser" (K-i-o-s-k), so this Linux kiosk
      // browser is misclassified as iOS rather than desktop.
      [
        'Linux kiosk browser',
        'Mozilla/5.0 (Linux; KioskBrowser) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
        false,
        'ios',
      ],
      // iPadOS 13+ "Request Desktop Website" (the default) sends a Mac
      // Safari UA with no iPad/iPhone/iPod token; the portrait-screen
      // heuristic is how it's told apart from an actual Mac.
      [
        'Mac Safari 17 UA, portrait screen (iPad desktop mode)',
        UA.desktopSafari17,
        true,
        'ipad',
      ],
    ];

    it.each(cases)('%s -> %s', (_name, ua, isPortraitScreen, expected) => {
      expect(getPlatformByUserAgent(ua, () => isPortraitScreen)).toBe(expected);
    });

    it('only reads the screen on the Mac Safari 13+ path', () => {
      const isPortraitScreen = vi.fn(() => false);
      getPlatformByUserAgent(UA.androidChrome, isPortraitScreen);
      getPlatformByUserAgent(UA.desktopChrome, isPortraitScreen);
      expect(isPortraitScreen).not.toHaveBeenCalled();
      getPlatformByUserAgent(UA.desktopSafari17, isPortraitScreen);
      expect(isPortraitScreen).toHaveBeenCalledTimes(1);
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

  describe('isIOSWKWebView', () => {
    it('is true for an iOS WKWebView UA when isWebKit is true', () => {
      expect(isIOSWKWebView(UA.iosWKWebView, true)).toBe(true);
    });

    it('is false for a non-iOS UA', () => {
      expect(isIOSWKWebView(UA.androidChrome, true)).toBe(false);
    });

    it('is false when isWebKit is false', () => {
      expect(isIOSWKWebView(UA.iosWKWebView, false)).toBe(false);
    });
  });
});
