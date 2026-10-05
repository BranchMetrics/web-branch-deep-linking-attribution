/**
 * Just provides a couple of utilities.
 */

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
 * One shared object: other modules call and stub `utils.*`, and the parts
 * call each other through it.
 */
export const utils: typeof state &
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
