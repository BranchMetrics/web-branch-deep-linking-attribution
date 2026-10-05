import { utils } from '../utils.js';
import { config } from '../config.js';
import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
} from '../../lib/ua.js';

export const platform = {
  timeSinceNavigationStart: function () {
    // in milliseconds
    return (Date.now() - window.performance.timing.navigationStart).toString();
  },

  getPlatformByUserAgent: () =>
    getPlatformByUserAgent(
      navigator.userAgent,
      () => screen.height > screen.width,
    ),

  /**
   * Returns true if browser is safari version 11 or greater
   */
  isSafari11OrGreater: () => isSafari11OrGreater(navigator.userAgent),

  /**
   * Returns true if browser uses WebKit.
   */
  isWebKitBrowser: function () {
    return !!window.webkitURL;
  },

  isIOSWKWebView: () =>
    isIOSWKWebView(navigator.userAgent, utils.isWebKitBrowser()),

  /**
   * Add event listeners to elements, taking older browsers into account
   * @param el
   * @param eventType
   * @param callback
   * @param useCapture
   */
  addEvent: function (
    el: any,
    eventType: string,
    callback: Function,
    useCapture?: boolean,
  ) {
    let ret: any = 0;

    if (typeof el.addEventListener === 'function') {
      ret = el.addEventListener(eventType, callback, useCapture);
    } else if (typeof el.attachEvent === 'function') {
      ret = el.attachEvent('on' + eventType, callback);
    } else {
      el['on' + eventType] = callback;
    }

    return ret;
  },

  /**
   * Returns the user's preferred language
   */
  getBrowserLanguageCode: function () {
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

  getScreenHeight: function () {
    return screen.height || 0;
  },

  getScreenWidth: function () {
    return screen.width || 0;
  },

  // Used by logEvent() to send fields related to user's visit and device to v2/event standard and custom
  // Requires a reference to the branch object to access information such as browser_fingerprint_id
  getUserData: function (branch) {
    let user_data: Record<string, any> = {};
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'http_origin',
      document.URL,
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'user_agent',
      navigator.userAgent,
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'language',
      utils.getBrowserLanguageCode(),
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'screen_width',
      utils.getScreenWidth(),
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'screen_height',
      utils.getScreenHeight(),
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'http_referrer',
      document.referrer,
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'browser_fingerprint_id',
      branch.browser_fingerprint_id,
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'developer_identity',
      branch.identity,
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'identity',
      branch.identity,
    );
    user_data = utils.addPropertyIfNotNull(user_data, 'sdk', 'web');
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'sdk_version',
      config.version,
    );
    user_data = utils.addPropertyIfNotNullorEmpty(
      user_data,
      'model',
      utils.userAgentData ? utils.userAgentData.model : '',
    );
    user_data = utils.addPropertyIfNotNullorEmpty(
      user_data,
      'os_version',
      utils.userAgentData ? utils.userAgentData.platformVersion : '',
    );
    return user_data;
  },

  // Checks if page is in an iFrame
  isIframe: function () {
    return window.self !== window.top;
  },

  // Checks if page is on the same domain as its top most window
  // Will throw a cross-origin frame access error if it is not
  isSameOriginFrame: function () {
    let sameOriginTest = 'true'; // without this minification of function doesn't work correctly
    try {
      if (window.top.location.search) {
        sameOriginTest = 'true'; // without this minification of function doesn't work correctly
      }
    } catch (_err) {
      return false;
    }
    return sameOriginTest === 'true'; // without this minification of function doesn't work correctly
  },

  // Checks if page is in an iFrame and on the same domain as its top most window
  isIframeAndFromSameOrigin: function () {
    return utils.isIframe() && utils.isSameOriginFrame();
  },

  // Creates a nonce attribute with the value stored in utils.nonce
  addNonceAttribute: function (element) {
    if (utils.nonce !== '') {
      element.setAttribute('nonce', utils.nonce);
    }
  },

  /**
   * gets client hints for supported browsers.
   * This will be used for browsers that have reduced user agent
   */
  getClientHints: function () {
    if (navigator.userAgentData) {
      const hints = ['model', 'platformVersion'];
      navigator.userAgentData.getHighEntropyValues(hints).then(function (data) {
        utils.userAgentData = {
          'model': data.model,
          'platformVersion': utils.removeTrailingDotZeros(data.platformVersion),
        };
      });
    } else {
      utils.userAgentData = null;
    }
  },
};
