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
  isValidURL,
  processReferringLink,
  removeTrailingDotZeros,
} from '../lib/url.js';
import {
  getPlatformByUserAgent,
  isIOSWKWebView,
  isSafari11OrGreater,
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

import { utils } from './state.js';
import { messages } from './utils/messages.js';
import { preferences } from './utils/preferences.js';
import { url } from './utils/url.js';
import { platform } from './utils/platform.js';
import { page_data } from './utils/page_data.js';
import { session_data } from './utils/session_data.js';

/**
 * Shapes the state fields moved to src/core/state.ts. Declared here (not
 * valued here) so that state.ts -> utils.ts stays a type-only import: the
 * real values with their comments live in state.ts.
 */
declare const stateFields: {
  debug: boolean;
  retries: number;
  retry_delay: number;
  timeout: number;
  nonce: string;
  extendedJourneysAssistExpiryTime: number;
  instrumentation: Record<string, unknown>;
  userAgentData: { model: string; platformVersion: string } | null;
  navigationTimingAPIEnabled: boolean;
  currentRequestBrttTag: string;
  dismissEventToSourceMapping: {
    'didClickJourneyClose': string;
    'didClickJourneyContinue': string;
    'didClickJourneyBackgroundDismiss': string;
    'didScrollJourneyBackgroundDismiss': string;
  };
  httpMethod: {
    POST: string;
    GET: string;
  };
  bannerThemes: string[];
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
  extractDeeplinkPath,
  extractMobileDeeplinkPath,
  isValidURL,
  processReferringLink,
  generateDynamicBNCLink,
  removeTrailingDotZeros,
  getPlatformByUserAgent,
  isSafari11OrGreater,
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
export type Utils = typeof stateFields &
  typeof lib &
  typeof messages &
  typeof preferences &
  typeof url &
  typeof platform &
  typeof page_data &
  typeof session_data;

Object.assign(
  utils,
  lib,
  messages,
  preferences,
  url,
  platform,
  page_data,
  session_data,
);

export { utils };
