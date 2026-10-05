import { utils } from '../state.js';
import { config } from '../config.js';
import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
} from '../../lib/ua.js';
import { getEnv } from '../../env/env.js';
import type { Context } from '../context.js';

export const platform = {
  // Environment reads live in src/env/env.ts; these delegate to it.
  timeSinceNavigationStart: () => getEnv().timeSinceNavigationStart(),

  getPlatformByUserAgent: () =>
    getPlatformByUserAgent(
      getEnv().userAgent(),
      getEnv().screenHeight() > getEnv().screenWidth(),
    ),

  /**
   * Returns true if browser is safari version 11 or greater
   */
  isSafari11OrGreater: () => isSafari11OrGreater(getEnv().userAgent()),

  isIOSWKWebView: () =>
    isIOSWKWebView(getEnv().userAgent(), getEnv().isWebKit()),

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

  getBrowserLanguageCode: () => getEnv().browserLanguageCode(),
  getScreenHeight: () => getEnv().screenHeight(),
  getScreenWidth: () => getEnv().screenWidth(),

  // Used by logEvent() to send fields related to user's visit and device to v2/event standard and custom
  // Requires a reference to the branch object to access information such as browser_fingerprint_id
  getUserData: function (branch) {
    const userAgentData = branch._ctx.userAgentData;
    let user_data: Record<string, any> = {};
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'http_origin',
      document.URL,
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'user_agent',
      getEnv().userAgent(),
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'language',
      getEnv().browserLanguageCode(),
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'screen_width',
      getEnv().screenWidth(),
    );
    user_data = utils.addPropertyIfNotNull(
      user_data,
      'screen_height',
      getEnv().screenHeight(),
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
      userAgentData ? userAgentData.model : '',
    );
    user_data = utils.addPropertyIfNotNullorEmpty(
      user_data,
      'os_version',
      userAgentData ? userAgentData.platformVersion : '',
    );
    return user_data;
  },

  isIframe: () => getEnv().isIframe(),

  // Checks if page is in an iFrame and on the same domain as its top most window
  isIframeAndFromSameOrigin: () =>
    getEnv().isIframe() && getEnv().isSameOriginFrame(),

  /**
   * gets client hints for supported browsers.
   * This will be used for browsers that have reduced user agent
   */
  getClientHints: function (ctx: Context) {
    const userAgentData =
      getEnv().userAgentData() as Navigator['userAgentData'];
    if (userAgentData) {
      const hints = ['model', 'platformVersion'];
      userAgentData.getHighEntropyValues(hints).then(function (data) {
        ctx.userAgentData = {
          'model': data.model,
          'platformVersion': utils.removeTrailingDotZeros(data.platformVersion),
        };
      });
    } else {
      ctx.userAgentData = null;
    }
  },
};
