/**
 * Per-instance SDK runtime state. Each Branch creates one in its constructor
 * and hands it to its Server and storage; nothing here is module-global.
 */
import { config } from './config.js';

export interface UserPreferences {
  trackingDisabled: boolean;
  enableExtendedJourneysAssist: boolean;
  whiteListedEndpointsWithData: Record<string, Record<string, RegExp | string>>;
  allowErrorsInCallback: boolean;
  shouldBlockRequest(url: string, requestData?: Record<string, any>): boolean;
}

export interface Context {
  debug: boolean;
  retries: number;
  retry_delay: number;
  timeout: number;
  nonce: string;
  extendedJourneysAssistExpiryTime: number;
  instrumentation: Record<string, string>;
  currentRequestBrttTag: string;
  userAgentData: { model: string; platformVersion: string } | null;
  userPreferences: UserPreferences;
}

export function createContext(): Context {
  const ctx: Context = {
    debug: false,
    retries: 2, // Value specifying the number of times that a Branch API call can be re-attempted.
    retry_delay: 200, // Amount of time in milliseconds to wait before re-attempting a timed-out request to the Branch API.
    timeout: 5000, // Duration in milliseconds that the system should wait for a response before considering any Branch API call to have timed out.
    nonce: '', // Nonce value to allow for CSP whitelisting
    extendedJourneysAssistExpiryTime: 604800000, // TTL value in milliseconds for the Referring Link. Defaults to 7 days
    // Properties and function related to calculating Branch request roundtrip time
    instrumentation: {},
    userAgentData: null,
    currentRequestBrttTag: '',
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
          ctx.userPreferences.whiteListedEndpointsWithData[urlPath];

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
  return ctx;
}

export function log(ctx: Pick<Context, 'debug'>, msg: string): void {
  if (ctx.debug && console) {
    console.log(msg);
  }
}

// Creates a nonce attribute with the value stored in ctx.nonce
export function applyNonce(ctx: Pick<Context, 'nonce'>, element: Element) {
  if (ctx.nonce !== '') {
    element.setAttribute('nonce', ctx.nonce);
  }
}
