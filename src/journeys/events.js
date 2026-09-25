'use strict';
goog.provide('journeys_events');

// Single seam for every journeys analytics event, shared by legacy and journeys_v2, so how they're
// dispatched can change in one place.
journeys_events.publish = function (branch, eventName, data) {
  branch._publishEvent(eventName, data);
};
