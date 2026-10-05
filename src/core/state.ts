import type { Utils } from './utils.js';
import { browserEnv } from '../env/env.js';

/**
 * The one shared utils object. Submodules import it from here (a leaf), and
 * core/utils.ts merges every part into it, so `utils.*` stays late-bound and
 * stubbable without an import cycle. Temporary: removed when utils is retired.
 */
export const utils = {
  navigationTimingAPIEnabled: browserEnv.navigationTimingAPIEnabled(),
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
