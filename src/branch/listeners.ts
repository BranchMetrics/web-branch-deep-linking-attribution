import { Branch } from './core.js';

/** =WEB
 * @function Branch.addListener
 * @param event - _optional_ - Specify which events you would like to listen for. If
 * not defined, the observer will recieve all events.
 * @param listener - _required_ - Listening function that will recieves an
 * event as a string and optional data as an object.
 *
 * The Branch Web SDK includes a simple event listener, that currently only publishes events for
 * Journeys events.
 * Future development will include the ability to subscribe to events related to all other Web
 * SDK functionality.
 *
 * ##### Example
 *
 * ```js
 * var listener = function(event, data) { console.log(event, data); }
 *
 * // Specify an event to listen for
 * branch.addListener('willShowJourney', listener);
 *
 * // Listen for all events
 * branch.addListener(listener);
 * ```
 *
 * #### Available `Journey` Events:
 * - *willShowJourney*: Journey is about to be shown.
 * - *didShowJourney*: Journey's entrance animation has completed and it is being shown to the user.
 * - *willNotShowJourney*: Journey will not be shown and no other events will be emitted.
 * - *didClickJourneyCTA*: User clicked on Journey's CTA button.
 * - *didClickJourneyClose*: User clicked on Journey's close button.
 * - *willCloseJourney*: Journey close animation has started.
 * - *didCloseJourney*: Journey's close animation has completed and it is no longer visible to the user.
 * - *didCallJourneyClose*: Emitted when developer calls `branch.closeJourney()` to dismiss Journey.
 */
Branch.prototype.addListener = function (
  event: string | ((event: string, data: Object) => void),
  listener?: (event: string, data: Object) => void,
) {
  if (typeof event === 'function' && listener === undefined) {
    listener = event;
    event = null;
  }
  if (listener) {
    this._listeners.push({
      listener: listener,
      event: (event as string) || null,
    });
  }
};

/** =WEB
 * @function Branch.removeListener
 * @param listener - _required_ - Reference to the listening function you
 * would like to remove. *note*: this must be the same reference that was passed to
 * `branch.addListener()`, not an identical clone of the function.
 *
 * Remove the listener from observations, if it is present. Not that this function must be
 * passed a referrence to the _same_ function that was passed to `branch.addListener()`, not
 * just an identical clone of the function.
 *
 */
Branch.prototype.removeListener = function (listener: (event: string) => void) {
  if (listener) {
    this._listeners = this._listeners.filter(function (subscription) {
      return subscription.listener !== listener;
    });
  }
};
