import { remToPx } from './css-units.js';
import { setNonce } from './nonce.js';
import { cleanCreativeHtml } from './sanitize.js';
import type { Platform, RenderPayload } from './types.js';

export const HOST_ID = 'branch-journey-host';
// Stand-ins for v1's iframe <html> and <body>, for the reset below. The creative's own
// html, :root and body rules match nothing here; in every creative so far they are
// margin resets for the iframe, which these boxless wrappers don't need.
export const HTML_CLASS = 'branch-journey-html';
export const BODY_CLASS = 'branch-journey-root';

export interface Mounted {
  host: HTMLElement;
  root: ShadowRoot;
  banner: HTMLElement;
}

interface MountOptions {
  document: Document;
  nonce?: string;
  platform: Platform;
  hasApp: boolean;
}

export function supportsShadowDom(): boolean {
  const view = document.defaultView;
  return !!view && 'attachShadow' in view.Element.prototype;
}

// Without cascade layers every @layer block is dropped.
export function supportsCssLayers(): boolean {
  const view = document.defaultView;
  return !!view && 'CSSLayerBlockRule' in view;
}

// Layers: branch-renderer < reset < creative < branch-box < unlayered animation. The
// first layer's !important rules beat everything, even creative !important. The box is
// normal declarations in the last layer: it beats the creative's normal CSS, and the
// page's ::part(banner) rules, from the outer tree, beat it. The html wrapper resets
// inherited page styles. `all` skips direction, and WebKit's `initial` keeps the
// inherited font-family.
const RESET_CSS = [
  '@layer branch-renderer, reset, creative, branch-box;',
  `@layer branch-renderer {\n:host, .${HTML_CLASS}, .${BODY_CLASS} { display: contents !important; }\n}`,
  `@layer reset {\n.${HTML_CLASS} { all: initial; direction: ltr; font-family: system-ui, serif; }\n*, *::before, *::after { box-sizing: border-box; }\n}`,
].join('\n');

const BANNER_Z_INDEX = 99999;

export function shadowCss(payload: RenderPayload, rootPx = 16): string {
  const creativeCss = remToPx(payload.creative.css, rootPx);
  const box = Object.entries(payload.box.style)
    .map(([property, value]) => ` ${property}: ${value};`)
    .join('');
  return [
    RESET_CSS,
    // In the first layer so an intrinsic creative's own placement rule wins.
    `@layer branch-renderer {\n#branch-banner { position: relative; }\n}`,
    `@layer creative {\n${creativeCss}\n}`,
    `@layer branch-box {\n#branch-banner { z-index: ${BANNER_Z_INDEX};${box} }\n.branch-banner-dismiss-background { z-index: ${BANNER_Z_INDEX - 1}; }\n}`,
    payload.animation.css,
  ]
    .filter(Boolean)
    .join('\n');
}

// Read with only the reset applied, giving the user's default font size.
function rootFontPx(doc: Document, rootEl: HTMLElement): number {
  try {
    const size = parseFloat(
      (doc.defaultView as Window).getComputedStyle(rootEl).fontSize,
    );
    return size > 0 ? size : 16;
  } catch (_e) {
    return 16;
  }
}

function ctaText(payload: RenderPayload, hasApp: boolean): string {
  const { hasApp: openText, noApp: getText } = payload.ctaText;
  return hasApp && openText ? openText : getText;
}

const BANNER_LABEL = 'Branch Banner';
const NAMING_ROLES = '[role="dialog"], [role="alertdialog"], [role="region"]';

// Replaces the name v1's iframe had, unless the creative names itself.
function nameBanner(banner: HTMLElement): void {
  if (
    banner.hasAttribute('aria-label') ||
    banner.hasAttribute('aria-labelledby') ||
    banner.matches(NAMING_ROLES) ||
    banner.querySelector(NAMING_ROLES)
  ) {
    return;
  }
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', BANNER_LABEL);
}

// v1 parity: no shadow around a transparent creative (e.g. a floating button). Inline,
// so it beats the box layer while a page ::part(banner) rule still beats it.
function dropShadowWhenTransparent(
  doc: Document,
  banner: HTMLElement,
  payload: RenderPayload,
): void {
  if (!('box-shadow' in payload.box.style)) {
    return;
  }
  const content = banner.querySelector('.branch-banner-content');
  if (!content) {
    return;
  }
  try {
    const bg = (doc.defaultView as Window).getComputedStyle(
      content,
    ).backgroundColor;
    if (isTransparent(bg)) {
      banner.style.setProperty('box-shadow', 'none');
    }
  } catch (_e) {}
}

export function isTransparent(color: string | undefined): boolean {
  if (!color) {
    return false;
  }
  if (color === 'transparent') {
    return true;
  }
  const channels = /^rgba?\(([^)]*)\)$/.exec(color.trim());
  if (!channels) {
    return false;
  }
  const alpha = channels[1].split(/[\s,/]+/).filter(Boolean)[3];
  return alpha !== undefined && parseFloat(alpha) === 0;
}

// Styles go through the CSSOM: CSP style-src blocks style attributes, not CSSOM writes.
export function mount(payload: RenderPayload, opts: MountOptions): Mounted {
  const doc = opts.document;
  const host = doc.createElement('div');
  host.id = HOST_ID;
  // No box for page CSS to lay out, position or clip.
  host.style.setProperty('display', 'contents', 'important');
  const root = host.attachShadow({ mode: 'open' });
  // Mobile goes first for screen readers (CHANGELOG 2.86.0). Inserted before filling
  // so rootFontPx can read a computed style.
  if (payload.creative.deviceType === 'desktop') {
    doc.body.appendChild(host);
  } else {
    doc.body.prepend(host);
  }

  try {
    const style = doc.createElement('style');
    setNonce(style, opts.nonce);
    style.textContent = RESET_CSS;
    root.appendChild(style);

    // Stand-ins for v1's iframe <html> and <body>.
    const html = doc.createElement('div');
    html.className = HTML_CLASS;
    const wrapper = doc.createElement('div');
    wrapper.className = `${BODY_CLASS} branch-banner-${opts.platform}`;
    html.appendChild(wrapper);
    root.appendChild(html);
    // The read forces a style recalc, so only creatives using rem pay for it.
    const usesRem = /\drem\b/i.test(payload.creative.css);
    style.textContent = shadowCss(
      payload,
      usesRem ? rootFontPx(doc, wrapper) : undefined,
    );
    wrapper.appendChild(cleanCreativeHtml(doc, payload.creative.html));

    const text = ctaText(payload, opts.hasApp);
    const button = root.getElementById('branch-mobile-action');
    if (button && text) {
      button.textContent = text;
      button.setAttribute('aria-label', text);
    }

    const banner = root.getElementById('branch-banner') as HTMLElement;
    // The documented customer hook for styling the banner: ::part(banner).
    banner.setAttribute('part', 'banner');
    nameBanner(banner);
    dropShadowWhenTransparent(doc, banner, payload);
    return { host, root, banner };
  } catch (e) {
    host.remove();
    throw e;
  }
}

// The host is a direct child of body, so watching body's and <html>'s children (a body
// swap, as Turbo does) covers its removal without observing the whole subtree.
export function watchRemoval(
  doc: Document,
  host: HTMLElement,
  onRemoved: () => void,
): () => void {
  const observer = new MutationObserver(() => {
    if (!doc.body?.contains(host)) {
      observer.disconnect();
      onRemoved();
    }
  });
  observer.observe(doc.documentElement, { childList: true });
  observer.observe(doc.body, { childList: true });
  return () => observer.disconnect();
}
