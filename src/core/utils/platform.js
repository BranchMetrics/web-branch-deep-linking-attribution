import { utils } from '../utils.js';
import { config } from '../config.js';

function isSafariBrowser(ua) {
  return !!/^((?!chrome|android|crios|firefox|fxios|edg|yabrowser).)*safari/i.test(
    ua,
  );
}

function isChromeBrowser(ua) {
  return !!/(chrome|crios)/i.test(ua);
}

function isFirefoxBrowser(ua) {
  return !!/(fxios|firefox)/i.test(ua);
}

function isEdgeBrowser(ua) {
  return !!/edg/i.test(ua);
}

function isOperaBrowser(ua) {
  return !!/(opt|opr)/i.test(ua);
}

function isYandexBrowser(ua) {
  return !!/yabrowser/i.test(ua);
}

function isMacintoshDesktop(ua) {
  return ua && ua.indexOf('Macintosh') > -1;
}

function isGTEVersion(ua, v) {
  v = v || 11;

  const match = /version\/([^ ]*)/i.exec(ua);
  if (match?.[1]) {
    try {
      const version = parseFloat(match[1]);
      if (version >= v) {
        return true;
      }
    } catch (_e) {
      return false;
    }
  }
  return false;
}

function isSafari13OrGreateriPad(ua) {
  return (
    ua &&
    isSafariBrowser(ua) &&
    isMacintoshDesktop(ua) &&
    isGTEVersion(ua, 13) &&
    screen.height > screen.width
  );
}

function isIOS(ua) {
  return ua && /(iPad|iPod|iPhone)/.test(ua);
}

export const platform = /** @satisfies {Record<string, unknown>} */ ({
  timeSinceNavigationStart: function () {
    // in milliseconds
    return (Date.now() - window.performance.timing.navigationStart).toString();
  },

  calculateBrtt: function (startTime) {
    if (!startTime || typeof startTime !== 'number') {
      return null;
    }
    return (Date.now() - startTime).toString();
  },

  getPlatformByUserAgent: function () {
    const ua = navigator.userAgent;
    if (ua.match(/android/i)) {
      return 'android';
    }
    if (ua.match(/ipad/i) || isSafari13OrGreateriPad(ua)) {
      return 'ipad';
    }
    if (ua.match(/i(os|p(hone|od))/i)) {
      return 'ios';
    }
    if (ua.match(/\(BB[1-9][0-9]*\;/i)) {
      return 'blackberry';
    }
    if (ua.match(/Windows Phone/i)) {
      return 'windows_phone';
    }
    if (
      ua.match(/Kindle/i) ||
      ua.match(/Silk/i) ||
      ua.match(/KFTT/i) ||
      ua.match(/KFOT/i) ||
      ua.match(/KFJWA/i) ||
      ua.match(/KFJWI/i) ||
      ua.match(/KFSOWI/i) ||
      ua.match(/KFTHWA/i) ||
      ua.match(/KFTHWI/i) ||
      ua.match(/KFAPWA/i) ||
      ua.match(/KFAPWI/i)
    ) {
      return 'kindle';
    }
    if (ua.match(/(Windows|Macintosh|Linux)/i)) {
      return 'desktop';
    }
    return 'other';
  },

  /**
   * Returns true if browser is safari version 11 or greater
   * @return {boolean}
   */
  isSafari11OrGreater: function () {
    const ua = navigator.userAgent;
    const isSafari = isSafariBrowser(ua);

    if (isSafari) {
      return isGTEVersion(ua, 11);
    }

    return false;
  },

  /**
   * Returns true if browser uses WebKit.
   * @return {boolean}
   */
  isWebKitBrowser: function () {
    return !!window.webkitURL;
  },

  isIOSWKWebView: function () {
    const ua = navigator.userAgent;
    return (
      utils.isWebKitBrowser() &&
      ua &&
      isIOS(ua) &&
      !isChromeBrowser(ua) &&
      !isFirefoxBrowser(ua) &&
      !isEdgeBrowser(ua) &&
      !isOperaBrowser(ua) &&
      !isYandexBrowser(ua)
    );
  },

  /**
   * Add event listeners to elements, taking older browsers into account
   * @param {*} el
   * @param {string} eventType
   * @param {Function} callback
   * @param {boolean=} useCapture
   */
  addEvent: function (el, eventType, callback, useCapture) {
    /** @type {*} */
    let ret = 0;

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
    let code;
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
    let user_data = {};
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

  /**
   * @param {String} versionNumber
   * A utility function to remove trailing dot zeroes
   */
  removeTrailingDotZeros: function (versionNumber) {
    if (!!versionNumber) {
      const dotZeroRegex = /^([1-9]\d*)\.(0\d*)(\.[0]\d*){1,}$/;

      if (versionNumber.indexOf('.') !== -1) {
        const dotString = versionNumber.substring(
          0,
          versionNumber.indexOf('.'),
        );
        versionNumber = versionNumber.replace(dotZeroRegex, dotString);
      }
    }
    return versionNumber;
  },
});
