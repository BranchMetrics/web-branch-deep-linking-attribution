import { setNonce } from './nonce.js';
import type { RenderPayload } from './types.js';

// Chrome ignores @font-face in a shadow root, so font links go in the document head
// for the journey's lifetime. A family the page already has is the page's own and
// wins, unless the URL names weights or styles, which the page's family may lack.
const FONT_LINK_ATTR = 'data-branch-journey-font';

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

function namesVariants(url: string): boolean {
  try {
    return new URL(url).searchParams
      .getAll('family')
      .some((family) => family.includes(':'));
  } catch (_e) {
    return true;
  }
}

export function ensureFonts(
  fonts: RenderPayload['fonts'],
  opts: { document: Document; nonce?: string },
): HTMLLinkElement[] {
  const doc = opts.document;
  const added: HTMLLinkElement[] = [];
  for (const { family, url } of fonts) {
    if (!namesVariants(url) && pageDeclaresFamily(doc, family)) {
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
