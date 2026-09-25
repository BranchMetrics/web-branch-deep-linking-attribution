'use strict';
goog.provide('journeys_dismissals');

goog.require('safejson');

/**
 * Client-side journey dismissal state. Two mechanisms, both keyed in Branch storage:
 * - global: one suppression window for all journeys, set from the creative's
 *   `metadata.globalDismissPeriod` (seconds; -1 = forever). Checked before rendering anything.
 * - per view: `{ [audienceRuleId]: { view_id, dismiss_time } }`, sent up on every pageview so the
 *   server can filter campaigns the user already dismissed.
 */
journeys_dismissals.GLOBAL_KEY = 'globalJourneysDismiss';
journeys_dismissals.VIEWS_KEY = 'journeyDismissals';

/***
 * @function journeys_dismissals.globalDismissDeadline
 * @param {Object} metadata
 * @return {(boolean|number|undefined)} true (forever), an epoch-ms deadline, or undefined when the
 *   creative sets no global window.
 */
journeys_dismissals.globalDismissDeadline = function (metadata) {
  var period = metadata && metadata['globalDismissPeriod'];
  if (typeof period !== 'number') {
    return undefined;
  }
  return period === -1 ? true : Date.now() + period * 1000;
};

/***
 * @function journeys_dismissals.isDismissedGlobally
 * @param {Object} storage
 * @return {boolean} whether journeys are currently suppressed. Clears an expired window as a side
 *   effect so the key doesn't linger.
 */
journeys_dismissals.isDismissedGlobally = function (storage) {
  var deadline = storage.get(journeys_dismissals.GLOBAL_KEY, true);
  if (deadline === true || deadline > Date.now()) {
    return true;
  }
  storage.remove(journeys_dismissals.GLOBAL_KEY, true);
  return false;
};

/***
 * @function journeys_dismissals.recordGlobalDismiss
 * @param {Object} storage
 * @param {(boolean|number|undefined)} deadline - from globalDismissDeadline; no-op when undefined
 */
journeys_dismissals.recordGlobalDismiss = function (storage, deadline) {
  if (deadline !== undefined) {
    storage.set(journeys_dismissals.GLOBAL_KEY, deadline, true);
  }
};

/***
 * @function journeys_dismissals.recordViewDismiss
 * @param {Object} storage
 * @param {string} templateId
 * @param {string} audienceRuleId
 * @return {Object} the full dismissals map after the write
 */
journeys_dismissals.recordViewDismiss = function (
  storage,
  templateId,
  audienceRuleId,
) {
  var raw = storage.get(journeys_dismissals.VIEWS_KEY, true);
  var dismissals = raw ? safejson.parse(raw) : {};
  dismissals[audienceRuleId] = {
    'view_id': templateId,
    'dismiss_time': Date.now(),
  };
  storage.set(
    journeys_dismissals.VIEWS_KEY,
    safejson.stringify(dismissals),
    true,
  );
  return dismissals;
};
