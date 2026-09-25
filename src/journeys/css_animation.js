'use strict';
goog.provide('journeys_css_animation');

// Parses CSS animation timing off computed style, so journeys_v2.animation knows how long a
// self-animating creative's entrance/exit takes.

function timeValueMsAt(cssValue, index) {
  var matches = (cssValue || '').match(/(-?[\d.]+)(ms|s)\b/g) || [];
  var token = matches[index];
  if (!token) {
    return null;
  }
  var match = /(-?[\d.]+)(ms|s)/.exec(token);
  var amount = parseFloat(match[1]);
  return match[2] === 'ms' ? amount : amount * 1000;
}

// 0 is a legitimate duration, so `a || b` would wrongly skip a real 0 - only null means "not found".
function firstFound(preferred, fallback) {
  return preferred !== null ? preferred : fallback;
}

// animation-duration + animation-delay in ms; 0 when nothing is animating. Falls back to the
// `animation` shorthand (1st <time> = duration, 2nd = delay) for environments that don't resolve
// the longhands.
journeys_css_animation.durationMs = function (element) {
  var style = element.ownerDocument.defaultView.getComputedStyle(element);
  var duration =
    firstFound(
      timeValueMsAt(style.animationDuration, 0),
      timeValueMsAt(style.animation, 0),
    ) || 0;
  var delay =
    firstFound(
      timeValueMsAt(style.animationDelay, 0),
      timeValueMsAt(style.animation, 1),
    ) || 0;
  return duration + delay;
};
