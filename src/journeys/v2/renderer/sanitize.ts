// Defense in depth for creative.html, which the server has already rendered: anything
// that could run script or retarget the page is dropped before it reaches the DOM.

const REMOVED_TAGS =
  'script, iframe, object, embed, base, form, meta, link, style, animate, set';

// srcset isn't checked: it is only ever fetched as an image.
const URL_ATTRIBUTES = new Set([
  'href',
  'src',
  'action',
  'formaction',
  'xlink:href',
  'poster',
]);

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'sms']);

// Browsers ignore control characters and whitespace in a scheme ("java\tscript:").
function isSafeUrl(value: string, isImageSrc: boolean): boolean {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: the point is to strip them
  const url = value.replace(/[\x00-\x20\x7f]/g, '');
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(url);
  if (!scheme) {
    return true;
  }
  const name = scheme[1].toLowerCase();
  // node-api inlines the desktop QR code as an image.
  return SAFE_SCHEMES.has(name) || (isImageSrc && /^data:image\//i.test(url));
}

// Parsed in an inert <template>, so nothing loads or runs until it is inserted.
export function cleanCreativeHtml(
  doc: Document,
  html: string,
): DocumentFragment {
  const template = doc.createElement('template');
  template.innerHTML = html;
  const { content } = template;
  for (const el of Array.from(content.querySelectorAll(REMOVED_TAGS))) {
    el.remove();
  }
  for (const el of Array.from(content.querySelectorAll('*'))) {
    for (const { name, value } of Array.from(el.attributes)) {
      const lower = name.toLowerCase();
      if (
        lower.startsWith('on') ||
        (URL_ATTRIBUTES.has(lower) &&
          !isSafeUrl(value, lower === 'src' && el.localName === 'img'))
      ) {
        el.removeAttribute(name);
      }
    }
  }
  return content;
}
