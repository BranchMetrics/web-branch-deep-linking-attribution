import type { Utils } from './utils.js';
import { browserEnv } from '../env/env.js';

/**
 * The one shared utils object. Submodules import it from here (a leaf), and
 * core/utils.ts merges every part into it, so `utils.*` stays late-bound and
 * stubbable without an import cycle. Temporary: removed when utils is retired.
 */
export const utils = {
  debug: false,
  retries: 2, // Value specifying the number of times that a Branch API call can be re-attempted.
  retry_delay: 200, // Amount of time in milliseconds to wait before re-attempting a timed-out request to the Branch API.
  timeout: 5000, // Duration in milliseconds that the system should wait for a response before considering any Branch API call to have timed out.
  nonce: '', // Nonce value to allow for CSP whitelisting
  extendedJourneysAssistExpiryTime: 604800000, // TTL value in milliseconds for the Referring Link. Defaults to 7 days
  // Properties and function related to calculating Branch request roundtrip time
  instrumentation: {},
  userAgentData: null,
  navigationTimingAPIEnabled: browserEnv.navigationTimingAPIEnabled(),
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
} as Utils;
