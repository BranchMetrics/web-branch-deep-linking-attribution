// The <time> token at position index in cssValue, in ms, or null if there aren't that many.
export function timeValueMsAt(
  cssValue: string | null | undefined,
  index: number,
): number | null {
  const matches = (cssValue || '').match(/(-?[\d.]+)(ms|s)\b/g) || [];
  const token = matches[index];
  if (!token) {
    return null;
  }
  const match = /(-?[\d.]+)(ms|s)/.exec(token) as RegExpExecArray;
  const amount = parseFloat(match[1]);
  return match[2] === 'ms' ? amount : amount * 1000;
}

// Total CSS animation time on element (delay + duration) in ms; 0 if none.
// Falls back to the `animation` shorthand for environments (incl. jsdom) that don't
// resolve it into longhands: duration is its 1st <time>, delay its 2nd.
export function animationDurationMs(element: Element): number {
  const computedStyle = (
    element.ownerDocument.defaultView as Window
  ).getComputedStyle(element);
  const duration =
    timeValueMsAt(computedStyle.animationDuration, 0) ||
    timeValueMsAt(computedStyle.animation, 0) ||
    0;
  const delay =
    timeValueMsAt(computedStyle.animationDelay, 0) ||
    timeValueMsAt(computedStyle.animation, 1) ||
    0;
  return duration + delay;
}
