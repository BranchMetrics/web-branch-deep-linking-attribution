// Rewrites html, :root and body selectors to the wrapper classes mount() uses in their
// place, since a shadow root has neither element.
export const HTML_CLASS = 'branch-journey-html';
export const BODY_CLASS = 'branch-journey-root';

const STRUCTURE = /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[{};]/g;
const COMMENTS = /\/\*[\s\S]*?\*\//g;
// Selector parts where html/body isn't a type selector.
const OPAQUE =
  /(\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\[[^\]]*\])/;
// No lookbehind: the bundle targets ES2015.
const DOCUMENT_SELECTOR = /(^|[\s,>+~(])(html|body)(?![\w-])|:root(?![\w-])/gi;

function scopeSelector(selector: string): string {
  return selector
    .split(OPAQUE)
    .map((part, i) =>
      // Odd indexes are the OPAQUE captures.
      i % 2
        ? part
        : part.replace(DOCUMENT_SELECTOR, (_m, prefix, tag) => {
            if (!tag) {
              return `.${HTML_CLASS}`;
            }
            const cls = tag.toLowerCase() === 'html' ? HTML_CLASS : BODY_CLASS;
            return `${prefix}.${cls}`;
          }),
    )
    .join('');
}

export function scopeDocumentSelectors(css: string): string {
  let out = '';
  let start = 0;
  for (const match of css.matchAll(STRUCTURE)) {
    const token = match[0];
    if (token.length !== 1) {
      continue;
    }
    const end = match.index as number;
    let prelude = css.slice(start, end);
    if (
      token === '{' &&
      prelude.replace(COMMENTS, '').trim().charAt(0) !== '@'
    ) {
      prelude = scopeSelector(prelude);
    }
    out += prelude + token;
    start = end + 1;
  }
  return out + css.slice(start);
}
