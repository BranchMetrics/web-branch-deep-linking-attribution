/**
 * Environment queries go through here: every read of location, frames,
 * document URL/referrer/cookies, navigator, screen, performance timing and
 * page meta tags made by the SDK calls getEnv(), so tests can swap in a fake
 * with setEnv(). Code that renders or mutates the DOM (creating banner and
 * journey elements, styling and measuring them, iframes, event listeners,
 * navigation) and the storage writes still use the DOM directly.
 */
import { processHostedDeepLinkData } from '../lib/hosted-data.js';

export interface Env {
  /** String(window.location), or document.referrer inside an iframe (legacy getWindowLocation). */
  windowLocation(): string;
  locationSearch(): string;
  locationHash(): string;
  currentUrl(): string;
  initialReferrer(): string | null;
  isIframe(): boolean;
  isSameOriginFrame(): boolean;
  /** !!window.webkitURL */
  isWebKit(): boolean;
  userAgent(): string;
  userAgentData(): unknown; // navigator.userAgentData or null
  /** navigator.language, raw. */
  language(): string;
  browserLanguageCode(): string | null;
  screenHeight(): number;
  screenWidth(): number;
  /** window.devicePixelRatio, raw (callers apply their own fallback). */
  devicePixelRatio(): number;
  /** document.URL */
  documentURL(): string;
  /** document.referrer, raw (unlike initialReferrer, no iframe handling). */
  documentReferrer(): string;
  /** document.cookie */
  documentCookie(): string;
  /** navigator.cookieEnabled */
  cookieEnabled(): boolean;
  /** navigator.doNotTrack, or the falsy navigator if there is none. */
  doNotTrack(): string | null;
  /** Milliseconds since navigationStart, as a string (what the API sends). */
  timeSinceNavigationStart(): string;
  navigationTimingAPIEnabled(): boolean;
  openGraphContent(property: string, content?: string | null): string | null;
  title(): string | null;
  description(): string | null;
  canonicalURL(): string | null;
  hostedDeepLinkData(): Record<string, any>;
  clickIdAndSearchStringFromLink(link: string): string;
}

// Checks if page is in an iFrame
const isIframe = () => window.self !== window.top;

// Checks if page is on the same domain as its top most window
// Will throw a cross-origin frame access error if it is not
const isSameOriginFrame = () => {
  let sameOriginTest = 'true'; // without this minification of function doesn't work correctly
  try {
    if (window.top.location.search) {
      sameOriginTest = 'true'; // without this minification of function doesn't work correctly
    }
  } catch (_err) {
    return false;
  }
  return sameOriginTest === 'true'; // without this minification of function doesn't work correctly
};

// Checks if page is in an iFrame and on the same domain as its top most window
const isIframeAndFromSameOrigin = () => isIframe() && isSameOriginFrame();

export const browserEnv: Env = {
  windowLocation: () =>
    isIframe() ? document.referrer : String(window.location),

  locationSearch: () =>
    isIframeAndFromSameOrigin()
      ? window.top.location.search
      : window.location.search,

  locationHash: () =>
    isIframeAndFromSameOrigin()
      ? window.top.location.hash
      : window.location.hash,

  currentUrl: () =>
    isIframeAndFromSameOrigin()
      ? window.top.location.href
      : window.location.href,

  initialReferrer: () => {
    if (isIframe()) {
      return isSameOriginFrame() ? window.top.document.referrer : '';
    }
    return document.referrer;
  },

  isIframe,
  isSameOriginFrame,
  isWebKit: () => !!window.webkitURL,
  userAgent: () => navigator.userAgent,
  userAgentData: () => navigator.userAgentData || null,
  language: () => navigator.language,

  /**
   * Returns the user's preferred language
   */
  browserLanguageCode: () => {
    let code: string | undefined;
    try {
      if (navigator.languages && navigator.languages.length > 0) {
        code = navigator.languages[0];
      } else if (navigator.language) {
        code = navigator.language;
      }
      code = code.substring(0, 2).toUpperCase();
    } catch (_e) {
      code = null;
    }
    return code;
  },

  screenHeight: () => screen.height || 0,
  screenWidth: () => screen.width || 0,
  devicePixelRatio: () => window.devicePixelRatio,
  documentURL: () => document.URL,
  documentReferrer: () => document.referrer,
  documentCookie: () => document.cookie,
  cookieEnabled: () => navigator.cookieEnabled,
  doNotTrack: () => navigator && navigator.doNotTrack,

  // in milliseconds
  timeSinceNavigationStart: () =>
    (Date.now() - window.performance.timing.navigationStart).toString(),

  navigationTimingAPIEnabled: () =>
    typeof window !== 'undefined' &&
    !!window.performance?.timing?.navigationStart,

  /**
   * Search for a particular og tag by name, and return the content, if it exists. The optional
   * parameter 'content' will be the default value used if the og tag is not found or cannot
   * be parsed.
   */
  openGraphContent: (property, content) => {
    property = String(property);
    content = content || null;

    const el = document.querySelector(
      'meta[property="og:' + property + '"]',
    ) as HTMLMetaElement | null;
    if (el?.content) {
      content = el.content;
    }

    return content;
  },

  title: () => {
    const tags = document.getElementsByTagName('title');
    return tags.length > 0 ? tags[0].innerText : null;
  },

  description: () => {
    const el = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    return el?.content ? el.content : null;
  },

  canonicalURL: () => {
    const el = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    return el?.href ? el.href : null;
  },

  /**
   * Search for hosted deep link data on the page, as outlined here https://dev.branch.io/getting-started/hosted-deep-link-data/guide/#adding-metatags-to-your-site.
   * Also searches for twitter and applinks tags, i.e. <meta property="al:ios:url" content="applinks://docs" />, <meta name="twitter:app:url:googleplay" content="twitter://docs">.
   */
  hostedDeepLinkData: () =>
    processHostedDeepLinkData(document.getElementsByTagName('meta')),

  clickIdAndSearchStringFromLink: (link) => {
    if (!link || typeof link !== 'string') {
      return '';
    }
    const elem = document.createElement('a');
    elem.href = link;
    function notEmpty(data) {
      return data !== '';
    }
    const pathname = elem.pathname?.split('/').filter(notEmpty);
    return Array.isArray(pathname) && pathname.length
      ? pathname[pathname.length - 1] + elem.search
      : elem.search;
  },
};

/**
 * Whether the navigation timing API was available when the SDK loaded.
 * Evaluated once at load from the real browser (not getEnv()), so a page
 * script that later replaces window.performance doesn't change it.
 */
export const navigationTimingAPIEnabled =
  browserEnv.navigationTimingAPIEnabled();

let current = browserEnv;

export const getEnv = (): Env => current;

/** Swaps the environment (tests); null restores browserEnv. */
export const setEnv = (env: Env | null): void => {
  current = env || browserEnv;
};
