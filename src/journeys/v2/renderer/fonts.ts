import { setNonce } from './nonce.js';

// Chrome ignores @font-face in a shadow root, so font links go in the document head
// for the journey's lifetime. Bare families the page already declares are skipped.
const FONT_LINK_ATTR = 'data-branch-journey-font';

// variants: the URL names weights or styles, which the page's same-named family may lack.
export function fontFamilies(
  url: string,
): Array<{ name: string; variants: boolean }> {
  try {
    // The css (v1) API puts several families in one parameter, separated by |.
    return new URL(url).searchParams
      .getAll('family')
      .flatMap((param) => param.split('|'))
      .map((family) => {
        const [name, variants] = family.split(':');
        return { name: name.trim(), variants: variants !== undefined };
      })
      .filter((family) => family.name);
  } catch (_e) {
    return [];
  }
}

function normalize(family: string): string {
  return family.replace(/["']/g, '').trim().toLowerCase();
}

function pageDeclaresFamily(doc: Document, family: string): boolean {
  const fonts = (doc as any).fonts;
  if (!fonts || typeof fonts[Symbol.iterator] !== 'function') {
    return false;
  }
  for (const face of fonts) {
    if (normalize(face.family) === normalize(family)) {
      return true;
    }
  }
  return false;
}

export function ensureFonts(
  urls: string[],
  opts: { document: Document; nonce?: string },
): HTMLLinkElement[] {
  const doc = opts.document;
  const added: HTMLLinkElement[] = [];
  for (const url of urls) {
    const families = fontFamilies(url);
    if (
      families.length > 0 &&
      families.every(
        (family) => !family.variants && pageDeclaresFamily(doc, family.name),
      )
    ) {
      continue;
    }
    const alreadyLinked = Array.from(
      doc.head.querySelectorAll('link[rel="stylesheet"]'),
    ).some((link) => link.getAttribute('href') === url);
    if (alreadyLinked) {
      continue;
    }
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute(FONT_LINK_ATTR, '');
    setNonce(link, opts.nonce);
    doc.head.appendChild(link);
    added.push(link);
  }
  return added;
}

export function removeFonts(links: HTMLLinkElement[]): void {
  for (const link of links) {
    link.remove();
  }
}
