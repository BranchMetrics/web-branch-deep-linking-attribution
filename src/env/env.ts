/**
 * Every read of the browser environment (location, frames, navigator, screen,
 * performance timing, page meta tags) goes through here, so tests can swap in
 * a fake with setEnv(). Rendering code still touches the DOM directly.
 */
import { processHostedDeepLinkData } from '../lib/hosted_data.js';

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
  browserLanguageCode(): string | null;
  screenHeight(): number;
  screenWidth(): number;
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

let current = browserEnv;

export const getEnv = (): Env => current;

/** Swaps the environment (tests); null restores browserEnv. */
export const setEnv = (env: Env | null): void => {
  current = env || browserEnv;
};
