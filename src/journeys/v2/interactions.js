'use strict';
goog.provide('journeys_v2.interactions');

goog.require('utils');

// Wires the creative's buttons to the SDK: the CTA handshake (node-api's injected script calls
// `window[callback_string](ctaFn)`) and DOM binding for the CTA/dismiss elements. Just reports
// intent (`onCta`, `onDismiss(eventName)`) - the assembler decides what happens.
journeys_v2.interactions.CTA_SELECTOR = '#branch-mobile-action';

// Left on window[callback_string] once settled so a late call from node-api's script is harmless.
// Module-level so it doesn't keep that render's `active` graph alive via a closure.
journeys_v2.interactions.NOOP = function () {};

journeys_v2.interactions.DISMISS_BINDINGS = [
  {
    selector: '.branch-banner-continue',
    eventName: 'didClickJourneyContinue',
    type: 'click',
  },
  {
    selector: '.branch-banner-close',
    eventName: 'didClickJourneyClose',
    type: 'click',
  },
  {
    selector: '.branch-banner-dismiss-background',
    eventName: 'didClickJourneyBackgroundDismiss',
    type: 'click',
  },
  {
    selector: '.branch-banner-dismiss-background',
    eventName: 'didScrollJourneyBackgroundDismiss',
    type: 'touchmove',
  },
];

// If the script never calls back within utils.timeout the global is replaced with a no-op, same
// as the legacy path. Returns {cancel} to call when the render fails, so a late script call is
// ignored.
journeys_v2.interactions.awaitCta = function (callbackString, onCta) {
  var settle = function () {
    clearTimeout(timer);
    window[callbackString] = journeys_v2.interactions.NOOP;
  };
  var timer = setTimeout(settle, utils.timeout);
  window[callbackString] = function (cta) {
    settle();
    onCta(cta);
  };
  return { cancel: settle };
};

function forEachMatch(doc, selector, fn) {
  var els = doc.querySelectorAll(selector);
  for (let i = 0; i < els.length; i++) {
    fn(els[i]);
  }
}

journeys_v2.interactions.bind = function (iframe, handlers) {
  var doc = iframe.contentWindow.document;
  forEachMatch(doc, journeys_v2.interactions.CTA_SELECTOR, function (el) {
    el.addEventListener('click', function () {
      handlers.onCta();
    });
  });
  journeys_v2.interactions.DISMISS_BINDINGS.forEach(function (binding) {
    forEachMatch(doc, binding.selector, function (el) {
      el.addEventListener(binding.type, function () {
        handlers.onDismiss(binding.eventName);
      });
    });
  });
};
