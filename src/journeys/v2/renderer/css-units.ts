// In a shadow root rem follows the page's <html> font size, so rem is rewritten to px
// against the user's default, as in v1's iframe. url(), strings and comments are
// skipped. No lookbehind: the bundle targets ES2015.
const TOKENS =
  /url\([^)]*\)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\*[\s\S]*?\*\/|(^|[^\w-])(-?(?:\d+\.?\d*|\.\d+))rem\b/g;

export function remToPx(css: string, rootPx: number): string {
  return css.replace(TOKENS, (match, prefix, amount) => {
    if (amount === undefined) {
      return match;
    }
    const px = Math.round(parseFloat(amount) * rootPx * 1000) / 1000;
    return `${prefix}${px}px`;
  });
}
