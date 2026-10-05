import { browserEnv, setEnv } from '../../src/env/env.js';

/** User agents that map to each platform getPlatformByUserAgent reports. */
export const UA = {
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  // iOS Chrome: platform 'ios' without tripping the Safari 11+ / WKWebView paths.
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36',
  other: 'SomeBot/1.0',
};

/** UA giving each platform, for tests that used to stub getPlatformByUserAgent. */
export const UA_FOR_PLATFORM = {
  desktop: UA.desktopChrome,
  ios: UA.iphoneChrome,
  android: UA.androidChrome,
  other: UA.other,
};

/**
 * A complete Env with deterministic defaults (a top-level desktop Chrome page
 * at https://shop.example.com/p with no meta tags), merged with `overrides`.
 */
export function makeFakeEnv(overrides = {}) {
  return {
    windowLocation: () => 'https://shop.example.com/p',
    locationSearch: () => '',
    locationHash: () => '',
    currentUrl: () => 'https://shop.example.com/p',
    initialReferrer: () => '',
    isIframe: () => false,
    isSameOriginFrame: () => true,
    isWebKit: () => false,
    userAgent: () => UA.desktopChrome,
    userAgentData: () => null,
    browserLanguageCode: () => 'EN',
    screenHeight: () => 900,
    screenWidth: () => 1440,
    timeSinceNavigationStart: () => '0',
    navigationTimingAPIEnabled: () => false,
    openGraphContent: (_property, content) => content || null,
    title: () => null,
    description: () => null,
    canonicalURL: () => null,
    hostedDeepLinkData: () => ({}),
    // Parses its argument rather than reading the page, so the real one is deterministic.
    clickIdAndSearchStringFromLink: browserEnv.clickIdAndSearchStringFromLink,
    ...overrides,
  };
}

/** Installs a fake env before each test and restores the browser env after. */
export function useFakeEnv(overrides = {}) {
  beforeEach(function () {
    setEnv(makeFakeEnv(overrides));
  });
  afterEach(function () {
    setEnv(null);
  });
}
