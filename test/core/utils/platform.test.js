import { config } from '../../../src/core/config.js';
import { utils } from '../../../src/core/utils.js';
import { browserEnv, setEnv } from '../../../src/env/env.js';
import { makeFakeEnv } from '../../helpers/fake-env.js';

// Characterization tests: these pin what the platform helpers do today,
// quirks included. Do not "fix" expectations here without a behavior change.

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneSafari10:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
  ipodSafari:
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1',
  ipadLegacySafari:
    'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ "Request Desktop Website" (the default) sends a Mac UA.
  ipadDesktopModeSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  ipadDesktopModeFirefox:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Safari/605.1.15',
  macSafari12:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36',
  androidWebView:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240705.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.71 Mobile Safari/537.36',
  androidFirefox:
    'Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0',
  androidSamsung:
    'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  macFirefox:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0',
  macEdge:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.68',
  macOpera:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/111.0.0.0',
  macYandex:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.6.0.0 Safari/537.36',
  winChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  winFirefox:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  winEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.68',
  winOpera:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/111.0.0.0',
  winYandex:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.6.0.0 Safari/537.36',
  linuxFirefox:
    'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  chromeOS:
    'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  iosChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  iosFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  iosEdge:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.2592.56 Mobile/15E148 Safari/605.1.15',
  iosOpera:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPT/4.6.1 Mobile/15E148',
  iosYandex:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 YaBrowser/24.6.3.346.10 SA/3 Mobile/15E148 Safari/604.1',
  iosWKWebView:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  iosFacebookInApp:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.108;FBBV/617040474;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
  windowsPhone8:
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)',
  windowsPhone10:
    'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.15063',
  blackberry10:
    'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+',
  kindleEreader:
    'Mozilla/5.0 (Linux; U; en-US) AppleWebKit/528.5+ (KHTML, like Gecko, Safari/528.5+) Version/4.0 Kindle/3.0 (screen 600X800; rotate)',
  kindleFireSilk:
    'Mozilla/5.0 (Linux; Android 9; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/126.4.1 like Chrome/126.0.6478.183 Safari/537.36',
  silkDesktopMode:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Silk/126.4.1 like Chrome/126.0.6478.183 Safari/537.36',
  googlebot:
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  curl: 'curl/8.7.1',
  empty: '',
};

// --- global stubbing helpers -------------------------------------------------

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

function setUserAgent(ua) {
  stubProperty(navigator, 'userAgent', ua);
}

function setScreen(width, height) {
  stubProperty(screen, 'width', width);
  stubProperty(screen, 'height', height);
}

afterEach(function () {
  while (restorers.length) {
    restorers.pop()();
  }
  vi.restoreAllMocks();
  setEnv(null);
});

// --- tests -------------------------------------------------------------------

describe('platform utils (characterization)', function () {
  describe('getPlatformByUserAgent', function () {
    // Default screen is landscape (wider than tall) so the iPad heuristic
    // does not fire unless a row asks for a portrait screen.
    const cases = [
      ['iPhone Safari', UA.iphoneSafari, 'ios'],
      ['iPod touch Safari', UA.ipodSafari, 'ios'],
      ['iPad (iPadOS 12, iPad UA) Safari', UA.ipadLegacySafari, 'ipad'],
      ['iOS Chrome (CriOS)', UA.iosChrome, 'ios'],
      ['iOS Firefox (FxiOS)', UA.iosFirefox, 'ios'],
      ['iOS Edge (EdgiOS)', UA.iosEdge, 'ios'],
      ['iOS Opera (OPT)', UA.iosOpera, 'ios'],
      ['iOS Yandex', UA.iosYandex, 'ios'],
      ['iOS WKWebView in-app', UA.iosWKWebView, 'ios'],
      ['iOS Facebook in-app browser', UA.iosFacebookInApp, 'ios'],
      ['Android Chrome', UA.androidChrome, 'android'],
      ['Android WebView', UA.androidWebView, 'android'],
      ['Android Firefox', UA.androidFirefox, 'android'],
      ['Android Samsung Internet', UA.androidSamsung, 'android'],
      ['Kindle Fire Silk (Android UA)', UA.kindleFireSilk, 'android'],
      ['Mac Safari (landscape screen)', UA.ipadDesktopModeSafari, 'desktop'],
      ['Mac Chrome', UA.macChrome, 'desktop'],
      ['Mac Firefox', UA.macFirefox, 'desktop'],
      ['Mac Edge', UA.macEdge, 'desktop'],
      ['Mac Opera', UA.macOpera, 'desktop'],
      ['Mac Yandex', UA.macYandex, 'desktop'],
      ['Windows Chrome', UA.winChrome, 'desktop'],
      ['Windows Firefox', UA.winFirefox, 'desktop'],
      ['Windows Edge', UA.winEdge, 'desktop'],
      ['Windows Opera', UA.winOpera, 'desktop'],
      ['Windows Yandex', UA.winYandex, 'desktop'],
      ['Linux Firefox', UA.linuxFirefox, 'desktop'],
      ['Windows Phone 8.0', UA.windowsPhone8, 'windows_phone'],
      // NOTE: Windows Phone 10 (Edge Mobile) includes "Android" in its UA, so
      // it is classified as 'android' before the Windows Phone check runs.
      ['Windows Phone 10 (contains "Android")', UA.windowsPhone10, 'android'],
      ['BlackBerry 10', UA.blackberry10, 'blackberry'],
      ['Kindle e-reader', UA.kindleEreader, 'kindle'],
      ['Silk desktop mode (Linux UA)', UA.silkDesktopMode, 'kindle'],
      // NOTE: possible bug: ChromeOS UAs contain "X11; CrOS" but none of
      // Windows/Macintosh/Linux, so a Chromebook is reported as 'other'.
      ['ChromeOS Chrome', UA.chromeOS, 'other'],
      ['Googlebot', UA.googlebot, 'other'],
      ['curl', UA.curl, 'other'],
      ['empty string', UA.empty, 'other'],
    ];

    it.each(cases)('%s -> %s', function (_name, ua, expected) {
      setUserAgent(ua);
      setScreen(1920, 1080);
      expect(utils.getPlatformByUserAgent()).toBe(expected);
    });

    describe('iPadOS 13+ desktop-mode detection (Macintosh UA)', function () {
      it('reports ipad for Mac Safari UA (Version >= 13) on a portrait screen', function () {
        setUserAgent(UA.ipadDesktopModeSafari);
        stubProperty(navigator, 'maxTouchPoints', 5);
        setScreen(820, 1180);
        expect(utils.getPlatformByUserAgent()).toBe('ipad');
      });

      it('ignores navigator.maxTouchPoints: a portrait screen alone flips a Mac to ipad', function () {
        // NOTE: possible bug: touch support is never checked, so a real Mac
        // running Safari 13+ on a portrait (rotated) monitor is reported as
        // 'ipad'.
        setUserAgent(UA.ipadDesktopModeSafari);
        stubProperty(navigator, 'maxTouchPoints', 0);
        setScreen(1080, 1920);
        expect(utils.getPlatformByUserAgent()).toBe('ipad');
      });

      it('reports desktop for the iPad desktop-mode UA when the screen is landscape', function () {
        setUserAgent(UA.ipadDesktopModeSafari);
        stubProperty(navigator, 'maxTouchPoints', 5);
        setScreen(1180, 820);
        expect(utils.getPlatformByUserAgent()).toBe('desktop');
      });

      it('reports desktop for a square screen (height must be strictly greater)', function () {
        setUserAgent(UA.ipadDesktopModeSafari);
        setScreen(1024, 1024);
        expect(utils.getPlatformByUserAgent()).toBe('desktop');
      });

      it('reports desktop for Mac Safari below version 13 even on a portrait screen', function () {
        setUserAgent(UA.macSafari12);
        setScreen(820, 1180);
        expect(utils.getPlatformByUserAgent()).toBe('desktop');
      });

      it('reports desktop for Mac Chrome on a portrait screen (not Safari)', function () {
        setUserAgent(UA.macChrome);
        setScreen(820, 1180);
        expect(utils.getPlatformByUserAgent()).toBe('desktop');
      });

      it('reports ios for iPad desktop-mode Firefox (Mac UA containing "FxiOS")', function () {
        // The /i(os|p(hone|od))/i check matches the "iOS" in "FxiOS", and the
        // Safari-based iPad heuristic excludes Firefox, so this is 'ios'.
        setUserAgent(UA.ipadDesktopModeFirefox);
        setScreen(820, 1180);
        expect(utils.getPlatformByUserAgent()).toBe('ios');
      });

      it('reports desktop when the Version/ token is not numeric', function () {
        setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/abc Safari/605.1.15',
        );
        setScreen(820, 1180);
        expect(utils.getPlatformByUserAgent()).toBe('desktop');
      });

      it('reports desktop when the Version/ token is empty', function () {
        setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/ Safari/605.1.15',
        );
        setScreen(820, 1180);
        expect(utils.getPlatformByUserAgent()).toBe('desktop');
      });
    });

    it('matches "ios" anywhere in the UA, case-insensitively', function () {
      // NOTE: possible bug: the iOS check is an unanchored /i(os|p(hone|od))/i,
      // so any UA containing e.g. "kiosk" is reported as 'ios'.
      setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 KioskBrowser/1.0',
      );
      setScreen(1920, 1080);
      expect(utils.getPlatformByUserAgent()).toBe('ios');
    });
  });

  describe('isSafari11OrGreater', function () {
    const cases = [
      ['iPhone Safari 17.5', UA.iphoneSafari, true],
      ['iPhone Safari 10.0', UA.iphoneSafari10, false],
      ['iPad Safari 12.1', UA.ipadLegacySafari, true],
      ['Mac Safari 17.5', UA.ipadDesktopModeSafari, true],
      ['Mac Safari 12.1.2', UA.macSafari12, true],
      ['iOS Chrome', UA.iosChrome, false],
      ['iOS Firefox', UA.iosFirefox, false],
      ['iOS Edge (Version/17.0 but EdgiOS)', UA.iosEdge, false],
      ['iOS Yandex (Version/17.0 but YaBrowser)', UA.iosYandex, false],
      ['iOS Opera (no Safari token)', UA.iosOpera, false],
      ['iOS WKWebView (no Safari token)', UA.iosWKWebView, false],
      ['Android Chrome', UA.androidChrome, false],
      ['Android WebView (Version/4.0)', UA.androidWebView, false],
      ['Mac Chrome', UA.macChrome, false],
      ['Mac Firefox', UA.macFirefox, false],
      ['Windows Edge', UA.winEdge, false],
      ['BlackBerry 10 (Safari, Version/10)', UA.blackberry10, false],
      ['Safari with non-numeric Version', 'Version/x Safari/605', false],
      ['Safari without a Version token', 'AppleWebKit Safari/605', false],
      ['empty string', UA.empty, false],
    ];

    it.each(cases)('%s -> %s', function (_name, ua, expected) {
      setUserAgent(ua);
      expect(utils.isSafari11OrGreater()).toBe(expected);
    });

    it('treats Version 11.0 as the inclusive lower bound', function () {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38',
      );
      expect(utils.isSafari11OrGreater()).toBe(true);
    });

    it('treats Version 10.1 as below the bound', function () {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30',
      );
      expect(utils.isSafari11OrGreater()).toBe(false);
    });
  });

  describe('isWebKitBrowser', function () {
    it('returns true when window.webkitURL is truthy', function () {
      stubProperty(window, 'webkitURL', function () {});
      expect(browserEnv.isWebKit()).toBe(true);
    });

    it('returns false when window.webkitURL is undefined', function () {
      stubProperty(window, 'webkitURL', undefined);
      expect(browserEnv.isWebKit()).toBe(false);
    });
  });

  describe('isIOSWKWebView', function () {
    const cases = [
      ['iOS WKWebView in-app', UA.iosWKWebView, true],
      ['iOS Facebook in-app browser', UA.iosFacebookInApp, true],
      // NOTE: possible bug: plain iOS Safari (and iPad Safari) is not excluded,
      // so it is reported as a WKWebView too.
      ['iPhone Safari', UA.iphoneSafari, true],
      ['iPad Safari (iPad UA)', UA.ipadLegacySafari, true],
      ['iOS Chrome', UA.iosChrome, false],
      ['iOS Firefox', UA.iosFirefox, false],
      ['iOS Edge', UA.iosEdge, false],
      ['iOS Opera', UA.iosOpera, false],
      ['iOS Yandex', UA.iosYandex, false],
      // iPadOS desktop mode has no iPad/iPhone/iPod token.
      ['iPad desktop-mode Safari (Mac UA)', UA.ipadDesktopModeSafari, false],
      ['Android WebView', UA.androidWebView, false],
      ['Mac Safari', UA.macSafari12, false],
    ];

    it.each(cases)('%s with webkitURL -> %s', function (_name, ua, expected) {
      setUserAgent(ua);
      stubProperty(window, 'webkitURL', function () {});
      expect(!!utils.isIOSWKWebView()).toBe(expected);
    });

    it('returns false when webkitURL is missing', function () {
      setUserAgent(UA.iosWKWebView);
      stubProperty(window, 'webkitURL', undefined);
      expect(utils.isIOSWKWebView()).toBe(false);
    });

    it('returns the falsy UA itself when the UA is empty', function () {
      setUserAgent('');
      stubProperty(window, 'webkitURL', function () {});
      expect(utils.isIOSWKWebView()).toBe('');
    });

    it('returns true (boolean) for a WKWebView UA', function () {
      setUserAgent(UA.iosWKWebView);
      stubProperty(window, 'webkitURL', function () {});
      expect(utils.isIOSWKWebView()).toBe(true);
    });

    it('returns false when the "opt"/"opr" substring appears anywhere', function () {
      // The Opera check is an unanchored /(opt|opr)/i, so unrelated tokens
      // containing "opt" also exclude the UA.
      setUserAgent(`${UA.iosWKWebView} AppOptions/1.0`);
      stubProperty(window, 'webkitURL', function () {});
      expect(utils.isIOSWKWebView()).toBe(false);
    });
  });

  describe('getBrowserLanguageCode', function () {
    it('uses the first entry of navigator.languages, upper-cased to 2 chars', function () {
      stubProperty(navigator, 'languages', ['fr-CA', 'en-US']);
      stubProperty(navigator, 'language', 'de-DE');
      expect(utils.getBrowserLanguageCode()).toBe('FR');
    });

    it('falls back to navigator.language when languages is empty', function () {
      stubProperty(navigator, 'languages', []);
      stubProperty(navigator, 'language', 'de-DE');
      expect(utils.getBrowserLanguageCode()).toBe('DE');
    });

    it('falls back to navigator.language when languages is undefined', function () {
      stubProperty(navigator, 'languages', undefined);
      stubProperty(navigator, 'language', 'ja');
      expect(utils.getBrowserLanguageCode()).toBe('JA');
    });

    it('returns a 1-char code unchanged apart from case', function () {
      stubProperty(navigator, 'languages', ['x']);
      expect(utils.getBrowserLanguageCode()).toBe('X');
    });

    it('returns null when neither languages nor language is available', function () {
      stubProperty(navigator, 'languages', undefined);
      stubProperty(navigator, 'language', undefined);
      expect(utils.getBrowserLanguageCode()).toBeNull();
    });

    it('returns an empty string when languages[0] is empty', function () {
      stubProperty(navigator, 'languages', ['']);
      stubProperty(navigator, 'language', 'en-US');
      expect(utils.getBrowserLanguageCode()).toBe('');
    });
  });

  describe('getScreenHeight / getScreenWidth', function () {
    it('returns screen dimensions', function () {
      setScreen(390, 844);
      expect(utils.getScreenWidth()).toBe(390);
      expect(utils.getScreenHeight()).toBe(844);
    });

    it('returns 0 for falsy dimensions', function () {
      setScreen(undefined, null);
      expect(utils.getScreenWidth()).toBe(0);
      expect(utils.getScreenHeight()).toBe(0);
    });
  });

  describe('isIframe / isSameOriginFrame / isIframeAndFromSameOrigin', function () {
    it('isIframe is false when window.top is window', function () {
      expect(utils.isIframe()).toBe(false);
    });

    it('isIframe is true when window.top is a different window', function () {
      stubProperty(window, 'top', { location: { search: '' } });
      expect(utils.isIframe()).toBe(true);
    });

    it('isSameOriginFrame is true when top.location.search is empty', function () {
      stubProperty(window, 'top', { location: { search: '' } });
      expect(browserEnv.isSameOriginFrame()).toBe(true);
    });

    it('isSameOriginFrame is true when top.location.search is non-empty', function () {
      stubProperty(window, 'top', { location: { search: '?a=1' } });
      expect(browserEnv.isSameOriginFrame()).toBe(true);
    });

    it('isSameOriginFrame is false when reading top.location throws', function () {
      const crossOriginTop = {};
      Object.defineProperty(crossOriginTop, 'location', {
        get: function () {
          throw new Error('SecurityError: cross-origin frame');
        },
      });
      stubProperty(window, 'top', crossOriginTop);
      expect(browserEnv.isSameOriginFrame()).toBe(false);
    });

    it('isIframeAndFromSameOrigin is false when not in an iframe', function () {
      expect(utils.isIframeAndFromSameOrigin()).toBe(false);
    });

    it('isIframeAndFromSameOrigin is true for a same-origin iframe', function () {
      stubProperty(window, 'top', { location: { search: '' } });
      expect(utils.isIframeAndFromSameOrigin()).toBe(true);
    });

    it('isIframeAndFromSameOrigin is false for a cross-origin iframe', function () {
      const crossOriginTop = {};
      Object.defineProperty(crossOriginTop, 'location', {
        get: function () {
          throw new Error('SecurityError');
        },
      });
      stubProperty(window, 'top', crossOriginTop);
      expect(utils.isIframeAndFromSameOrigin()).toBe(false);
    });

    it('isIframeAndFromSameOrigin goes through env.isIframe / env.isSameOriginFrame', function () {
      const sameOrigin = vi.fn().mockReturnValue(true);
      setEnv(
        makeFakeEnv({ isIframe: () => true, isSameOriginFrame: sameOrigin }),
      );
      expect(utils.isIframeAndFromSameOrigin()).toBe(true);
      expect(sameOrigin).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeTrailingDotZeros', function () {
    const cases = [
      ['15.0.0', '15'],
      ['10.0.0.0', '10'],
      ['1.0.0', '1'],
      ['13.00.000', '13'],
      // A single ".0" is left alone: the regex needs at least two dot groups.
      ['15.0', '15.0'],
      ['14.2.0', '14.2.0'],
      ['14.2', '14.2'],
      ['0.0.0', '0.0.0'],
      ['15', '15'],
      // NOTE: possible bug: the minor/patch groups are /0\d*/, so a minor or
      // patch that merely starts with 0 is dropped too.
      ['13.05.0', '13'],
      ['13.0.01', '13'],
      ['', ''],
    ];

    it.each(cases)('%j -> %j', function (input, expected) {
      expect(utils.removeTrailingDotZeros(input)).toBe(expected);
    });

    it('returns null / undefined unchanged', function () {
      expect(utils.removeTrailingDotZeros(null)).toBeNull();
      expect(utils.removeTrailingDotZeros(undefined)).toBeUndefined();
    });
  });

  describe('getClientHints', function () {
    let originalUserAgentData;
    beforeEach(function () {
      originalUserAgentData = utils.userAgentData;
    });
    afterEach(function () {
      utils.userAgentData = originalUserAgentData;
    });

    it('sets utils.userAgentData to null when navigator.userAgentData is missing', function () {
      stubProperty(navigator, 'userAgentData', undefined);
      utils.userAgentData = { model: 'stale', platformVersion: '1' };
      expect(utils.getClientHints()).toBeUndefined();
      expect(utils.userAgentData).toBeNull();
    });

    it('requests model + platformVersion and stores them asynchronously', async function () {
      const getHighEntropyValues = vi.fn(function () {
        return Promise.resolve({
          model: 'Pixel 8',
          platformVersion: '14.0.0',
          architecture: 'arm',
        });
      });
      stubProperty(navigator, 'userAgentData', { getHighEntropyValues });
      utils.userAgentData = null;

      utils.getClientHints();

      expect(getHighEntropyValues).toHaveBeenCalledWith([
        'model',
        'platformVersion',
      ]);
      // Not set synchronously.
      expect(utils.userAgentData).toBeNull();
      await Promise.resolve();
      await Promise.resolve();
      expect(utils.userAgentData).toEqual({
        model: 'Pixel 8',
        platformVersion: '14',
      });
    });

    it('stores an empty model from desktop browsers as-is', async function () {
      stubProperty(navigator, 'userAgentData', {
        getHighEntropyValues: function () {
          return Promise.resolve({ model: '', platformVersion: '15.5.0' });
        },
      });
      utils.getClientHints();
      await Promise.resolve();
      await Promise.resolve();
      expect(utils.userAgentData).toEqual({
        model: '',
        platformVersion: '15.5.0',
      });
    });
  });

  describe('getUserData', function () {
    let originalUserAgentData;
    beforeEach(function () {
      originalUserAgentData = utils.userAgentData;
      setUserAgent(UA.androidChrome);
      stubProperty(navigator, 'languages', ['en-US']);
      setScreen(412, 915);
      stubProperty(document, 'referrer', 'https://referrer.example.com/');
    });
    afterEach(function () {
      utils.userAgentData = originalUserAgentData;
    });

    it('collects page, device, identity and sdk fields', function () {
      utils.userAgentData = { model: 'Pixel 8', platformVersion: '14' };
      const data = utils.getUserData({
        browser_fingerprint_id: '12345',
        identity: 'user-1',
      });
      expect(data).toEqual({
        http_origin: document.URL,
        user_agent: UA.androidChrome,
        language: 'EN',
        screen_width: 412,
        screen_height: 915,
        http_referrer: 'https://referrer.example.com/',
        browser_fingerprint_id: '12345',
        // branch.identity is sent under both keys.
        developer_identity: 'user-1',
        identity: 'user-1',
        sdk: 'web',
        sdk_version: config.version,
        model: 'Pixel 8',
        os_version: '14',
      });
    });

    it('omits null/undefined fields and model/os_version without client hints', function () {
      utils.userAgentData = null;
      stubProperty(navigator, 'languages', undefined);
      stubProperty(navigator, 'language', undefined);
      setScreen(0, 0);
      const data = utils.getUserData({});
      expect(data).toEqual({
        http_origin: document.URL,
        user_agent: UA.androidChrome,
        // 0 is not null, so zero-sized screens are still reported.
        screen_width: 0,
        screen_height: 0,
        http_referrer: 'https://referrer.example.com/',
        sdk: 'web',
        sdk_version: config.version,
      });
    });

    it('keeps an empty referrer and drops empty client-hint strings', function () {
      stubProperty(document, 'referrer', '');
      utils.userAgentData = { model: '', platformVersion: '' };
      const data = utils.getUserData({ browser_fingerprint_id: null });
      expect(data.http_referrer).toBe('');
      expect('browser_fingerprint_id' in data).toBe(false);
      expect('model' in data).toBe(false);
      expect('os_version' in data).toBe(false);
    });
  });

  describe('addEvent', function () {
    it('uses addEventListener when available and returns its result', function () {
      const el = document.createElement('div');
      const callback = vi.fn();
      const spy = vi.spyOn(el, 'addEventListener');
      const ret = utils.addEvent(el, 'click', callback, true);
      expect(spy).toHaveBeenCalledWith('click', callback, true);
      expect(ret).toBeUndefined();
      el.dispatchEvent(new Event('click'));
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('falls back to attachEvent with an "on" prefix and returns its result', function () {
      const callback = function () {};
      const el = { attachEvent: vi.fn().mockReturnValue(true) };
      const ret = utils.addEvent(el, 'load', callback);
      expect(el.attachEvent).toHaveBeenCalledWith('onload', callback);
      expect(ret).toBe(true);
    });

    it('falls back to assigning el["on" + type] and returns 0', function () {
      const callback = function () {};
      const el = {};
      const ret = utils.addEvent(el, 'scroll', callback);
      expect(el.onscroll).toBe(callback);
      expect(ret).toBe(0);
    });

    it('ignores non-function addEventListener / attachEvent properties', function () {
      const callback = function () {};
      const el = { addEventListener: 'nope', attachEvent: null };
      const ret = utils.addEvent(el, 'resize', callback);
      expect(el.onresize).toBe(callback);
      expect(ret).toBe(0);
    });
  });

  describe('addNonceAttribute', function () {
    let originalNonce;
    beforeEach(function () {
      originalNonce = utils.nonce;
    });
    afterEach(function () {
      utils.nonce = originalNonce;
    });

    it('does not set a nonce when utils.nonce is empty', function () {
      utils.nonce = '';
      const el = document.createElement('script');
      utils.addNonceAttribute(el);
      expect(el.hasAttribute('nonce')).toBe(false);
    });

    it('sets the nonce attribute from utils.nonce', function () {
      utils.nonce = 'abc123';
      const el = document.createElement('script');
      utils.addNonceAttribute(el);
      expect(el.getAttribute('nonce')).toBe('abc123');
    });

    it('sets "undefined" when utils.nonce is undefined (only "" is skipped)', function () {
      utils.nonce = undefined;
      const el = document.createElement('script');
      utils.addNonceAttribute(el);
      expect(el.getAttribute('nonce')).toBe('undefined');
    });
  });

  describe('timeSinceNavigationStart', function () {
    it('returns Date.now() - navigationStart as a string', function () {
      stubProperty(window, 'performance', {
        timing: { navigationStart: 1000 },
      });
      vi.spyOn(Date, 'now').mockReturnValue(3500);
      expect(utils.timeSinceNavigationStart()).toBe('2500');
    });

    it('throws when performance.timing is unavailable', function () {
      stubProperty(window, 'performance', {});
      expect(function () {
        utils.timeSinceNavigationStart();
      }).toThrow(TypeError);
    });
  });

  describe('calculateBrtt', function () {
    it('returns Date.now() - startTime as a string', function () {
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      expect(utils.calculateBrtt(9750)).toBe('250');
    });

    it('can return a negative duration for a future start time', function () {
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      expect(utils.calculateBrtt(10500)).toBe('-500');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['0', 0],
      ['a numeric string', '9750'],
      ['an object', {}],
    ])('returns null for %s', function (_name, value) {
      expect(utils.calculateBrtt(value)).toBeNull();
    });
  });
});
