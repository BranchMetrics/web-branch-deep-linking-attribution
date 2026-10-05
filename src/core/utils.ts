/**
 * Just provides a couple of utilities.
 */

import {
  addPropertyIfNotNull,
  addPropertyIfNotNullorEmpty,
  cleanBannerText,
  convertObjectValuesToString,
  convertValueToString,
  delay,
  getBooleanOrNull,
  isBoolean,
  isKey,
  merge,
  removePropertiesFromObject,
  snakeToCamel,
  validateParameterType,
} from '../lib/objects.js';
import {
  base64Decode,
  base64encode,
  decodeBFPs,
  encodeBFPs,
  isBase64Encoded,
} from '../lib/encoding.js';
import {
  extractDeeplinkPath,
  extractMobileDeeplinkPath,
  generateDynamicBNCLink,
  getParamValue,
  isValidURL,
  processReferringLink,
  removeTrailingDotZeros,
} from '../lib/url.js';
import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
  isWebKitBrowser,
} from '../lib/ua.js';
import {
  calculateDiffBetweenArrays,
  isStandardEvent,
  separateEventAndCustomData,
  validateCommerceEventParams,
} from '../lib/validation.js';
import {
  allowDMAParamURLMap,
  setDMAParams,
  shouldAddDMAParams,
} from '../lib/dma.js';
import {
  whiteListJourneysLanguageData,
  whiteListSessionData,
} from '../lib/session_data.js';
import {
  mergeHostedDeeplinkData,
  prioritizeDeeplinkPaths,
  processHostedDeepLinkData,
} from '../lib/hosted_data.js';
import { formatMessage, messages as libMessages } from '../lib/messages.js';
import { calculateBrtt } from '../lib/brtt.js';

import { messages } from './utils/messages.js';
import { preferences } from './utils/preferences.js';
import { url } from './utils/url.js';
import { platform } from './utils/platform.js';
import { page_data } from './utils/page_data.js';
import { events } from './utils/events.js';
import { session_data } from './utils/session_data.js';
import { dma } from './utils/dma.js';
import { data } from './utils/data.js';

const state = {
  debug: false,
  retries: 2, // Value specifying the number of times that a Branch API call can be re-attempted.
  retry_delay: 200, // Amount of time in milliseconds to wait before re-attempting a timed-out request to the Branch API.
  timeout: 5000, // Duration in milliseconds that the system should wait for a response before considering any Branch API call to have timed out.
  nonce: '', // Nonce value to allow for CSP whitelisting
  extendedJourneysAssistExpiryTime: 604800000, // TTL value in milliseconds for the Referring Link. Defaults to 7 days
  // Properties and function related to calculating Branch request roundtrip time
  instrumentation: {},
  userAgentData: null,
  navigationTimingAPIEnabled:
    typeof window !== 'undefined' &&
    !!window.performance?.timing?.navigationStart,
  currentRequestBrttTag: '',
  dismissEventToSourceMapping: {
    'didClickJourneyClose': 'Button(X)',
    'didClickJourneyContinue': 'Dismiss Journey text',
    'didClickJourneyBackgroundDismiss': 'Background Dismiss',
    'didScrollJourneyBackgroundDismiss': 'Background Dismiss',
  },
  httpMethod: {
    POST: 'POST',
    GET: 'GET',
  },
  /**
   * List of valid banner themes
   * The first theme in the list becomes the default theme if one is not specified
   */
  bannerThemes: ['light', 'dark'],
};

/**
 * Pure helpers moved out to src/lib/*; re-exported here (by value, not by
 * namespace import) so the bundler can still mangle and tree-shake them.
 */
const lib = {
  merge,
  isKey,
  snakeToCamel,
  addPropertyIfNotNull,
  addPropertyIfNotNullorEmpty,
  removePropertiesFromObject,
  validateParameterType,
  convertValueToString,
  convertObjectValuesToString,
  getBooleanOrNull,
  isBoolean,
  cleanBannerText,
  delay,
  base64encode,
  base64Decode,
  isBase64Encoded,
  encodeBFPs,
  decodeBFPs,
  getParamValue,
  extractDeeplinkPath,
  extractMobileDeeplinkPath,
  isValidURL,
  processReferringLink,
  generateDynamicBNCLink,
  removeTrailingDotZeros,
  getPlatformByUserAgent,
  isSafari11OrGreater,
  isWebKitBrowser,
  isIOSWKWebView,
  calculateDiffBetweenArrays,
  validateCommerceEventParams,
  isStandardEvent,
  separateEventAndCustomData,
  allowDMAParamURLMap,
  shouldAddDMAParams,
  setDMAParams,
  whiteListSessionData,
  whiteListJourneysLanguageData,
  prioritizeDeeplinkPaths,
  processHostedDeepLinkData,
  mergeHostedDeeplinkData,
  messages: libMessages,
  formatMessage,
  calculateBrtt,
};

/**
 * One shared object: other modules call and stub `utils.*`, and the parts
 * call each other through it.
 */
export const utils: typeof state &
  typeof lib &
  typeof messages &
  typeof preferences &
  typeof url &
  typeof platform &
  typeof page_data &
  typeof events &
  typeof session_data &
  typeof dma &
  typeof data = Object.assign(
  state,
  lib,
  messages,
  preferences,
  url,
  platform,
  page_data,
  events,
  session_data,
  dma,
  data,
);
