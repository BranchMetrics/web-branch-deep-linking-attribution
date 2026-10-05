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
import { url } from './utils/url.js';
import { platform } from './utils/platform.js';
import { page_data } from './utils/page_data.js';

/**
 * Shapes the state fields moved to src/core/state.ts. Declared here (not
 * valued here) so that state.ts -> utils.ts stays a type-only import: the
 * real values with their comments live in state.ts.
 */
declare const stateFields: {
  navigationTimingAPIEnabled: boolean;
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
  typeof url &
  typeof platform &
  typeof page_data;

Object.assign(utils, lib, url, platform, page_data);

export { utils };
