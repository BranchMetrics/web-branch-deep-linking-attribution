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

// Delay + duration in ms. Reads the `animation` shorthand where longhands aren't
// resolved (e.g. jsdom).
export function animationDurationMs(element: Element): number {
  const computedStyle = (
    element.ownerDocument.defaultView as Window
  ).getComputedStyle(element);
  return (
    longhandOrShorthand(computedStyle, computedStyle.animationDuration, 0) +
    longhandOrShorthand(computedStyle, computedStyle.animationDelay, 1)
  );
}

function longhandOrShorthand(
  computedStyle: CSSStyleDeclaration,
  longhand: string,
  shorthandIndex: number,
): number {
  const value = timeValueMsAt(longhand, 0);
  if (value !== null) {
    return value;
  }
  return timeValueMsAt(computedStyle.animation, shorthandIndex) ?? 0;
}
