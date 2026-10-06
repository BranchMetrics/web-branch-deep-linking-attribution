import { utils } from '../state.js';
import { config } from '../config.js';

export const preferences = {
  userPreferences: {
    trackingDisabled: false,
    enableExtendedJourneysAssist: false,
    whiteListedEndpointsWithData: {
      '/v1/open': { 'link_identifier': '\\d+' },
      '/v1/pageview': { 'event': 'pageview' },
      '/v1/dismiss': { 'event': 'dismiss' },
      '/v1/url': {},
    },
    allowErrorsInCallback: false,
    shouldBlockRequest: function (url, requestData) {
      // Used by network/api.js to determine whether a request should be blocked
      const urlParser = document.createElement('a');
      urlParser.href = url;

      // INTENG-11512
      // To allow SMS when tracking disabled, we must allow GET <actual link>.
      // This precludes a filter on the path. Only apply the whitelist to
      // service endpoints.
      const whiteListDomains = [
        config.api_endpoint,
        config.app_service_endpoint,
        config.link_service_endpoint,
      ];
      let urlOrigin = urlParser.origin; // Property origin is defined on Anchor https://www.w3schools.com/jsref/prop_anchor_origin.asp
      // Excess of caution: Make sure no trailing slash in urlOrigin.
      if (urlOrigin.endsWith('/')) {
        urlOrigin = urlOrigin.substring(0, urlOrigin.length - 1);
      }
      if (!whiteListDomains.includes(urlOrigin)) {
        return false;
      }

      let urlPath = urlParser.pathname;

      // On Internet Explorer .pathname is returned without a leading '/' whereas on other browsers,
      // a leading slash is available eg. v1/open on IE vs. /v1/open in Chrome
      if (urlPath[0] !== '/') {
        urlPath = '/' + urlPath;
      }

      const whiteListedEndpointWithData =
        utils.userPreferences.whiteListedEndpointsWithData[urlPath];

      if (!whiteListedEndpointWithData) {
        return true;
      } else if (Object.keys(whiteListedEndpointWithData).length > 0) {
        if (!requestData) {
          return true;
        }
        // Ensures that required request parameters are available in request data
        for (const key in whiteListedEndpointWithData) {
          const requiredParameterRegex = new RegExp(
            whiteListedEndpointWithData[key],
          );
          if (
            !Object.prototype.hasOwnProperty.call(requestData, key) ||
            !requiredParameterRegex.test(requestData[key])
          ) {
            return true;
          }
        }
      }
      return false;
    },
  },
};
