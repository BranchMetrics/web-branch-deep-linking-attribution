import { applyCtaOverride } from '../cta-override.js';
import { buildJourneyLinkData } from '../link-data.js';
import { getCss, getIframeCss, getJs, getMetadata } from '../template.js';
import type { JourneyPayload } from './payload.js';
import {
  type Dimension,
  isRelative,
  type PlacementUnit,
  type RenderPayload,
} from './renderer/index.js';

// Builds a JourneyPayload from today's pageview response, or returns a fallback reason
// (render with v1) when the template isn't a new-builder creative.

export type FallbackReason =
  | 'no-shadow-dom'
  | 'no-css-layers'
  | 'no-metadata'
  | 'bad-banner-height'
  | 'bad-placement'
  | 'no-cta-script'
  | 'no-cta-callback'
  | 'unknown-iframe-css'
  | 'no-branch-banner'
  | 'unsupported-stylesheet'
  | 'font-face'
  | 'adapter-error'
  | 'render-error';

type AdapterResult = { payload: JourneyPayload } | { fallback: FallbackReason };

export interface AdapterInput {
  html: string;
  requestData: { callback_string?: string; has_app_websdk?: boolean };
  templateId: string;
  branchViewData: { audience_rule_id?: string };
  journeyLinkData?: Record<string, any> | null;
  animationConfig?: {
    classes?: { enter?: string; exit?: string };
    generatedCss?: string;
  } | null;
}

const DIMENSION_RE = /^(-?\d+(?:\.\d+)?)(px|%|vh|svh|dvh|vw|svw|em|rem)?$/;
const GOOGLE_FONTS_HOST = 'fonts.googleapis.com';
const IFRAME_SELECTOR = '#branch-banner-iframe';
const DEFAULT_Z_INDEX = 99999;
const STYLE_ELEMENT_RE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;

export function parseDimension(value: unknown): Dimension | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const match = DIMENSION_RE.exec(String(value).trim());
  if (!match) {
    return null;
  }
  const amount = parseFloat(match[1]);
  if (!match[2] && amount !== 0) {
    return null;
  }
  return { value: amount, unit: (match[2] || 'px') as PlacementUnit };
}

function cssRules(css: string): Array<{ selector: string; body: string }> {
  return Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g), (match) => ({
    selector: match[1].trim(),
    body: match[2],
  }));
}

function declarations(body: string): string[] {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);
}

// Expects audience-rule-service's output: one #branch-banner-iframe rule and, for
// page-pushing types, one body rule.
function parseGeometry(
  iframeCss: string,
  isIntrinsic: boolean,
): RenderPayload['geometry'] | null {
  let box: string[] | null = null;
  let push: RenderPayload['geometry']['push'];
  for (const rule of cssRules(iframeCss)) {
    if (rule.selector === IFRAME_SELECTOR) {
      if (box) {
        return null;
      }
      box = pinnedHeight(declarations(rule.body).filter(keepsDeclaration));
    } else if (rule.selector === 'body') {
      // Only the side is read; the renderer measures the size. Temporary until the
      // backend sends the push itself.
      for (const d of declarations(rule.body)) {
        const margin = /^margin-(top|bottom)\s*:/i.exec(d);
        if (margin) {
          push = { side: margin[1].toLowerCase() as 'top' | 'bottom' };
        }
      }
    } else {
      return null;
    }
  }
  if (!box) {
    return null;
  }
  // Kept for intrinsic creatives too, or they paint under positioned page content. It
  // travels as zIndex, so it's left out of css.
  const zDecl = box.map((d) => /^z-index\s*:\s*(-?\d+)/i.exec(d)).find(Boolean);
  const zIndex = zDecl ? parseInt(zDecl[1], 10) : DEFAULT_Z_INDEX;
  const rest = box.filter((d) => !/^z-index\s*:/i.test(d));
  const css = isIntrinsic || rest.length === 0 ? '' : `${rest.join('; ')};`;
  return { css, zIndex, push };
}

// Drops the iframe's fixed height (the content sizes #branch-banner now), except a
// viewport-filling one, which is layout (e.g. a full-height sidebar).
function keepsDeclaration(declaration: string): boolean {
  if (/^border\s*:/i.test(declaration)) {
    return false;
  }
  const height = /^height\s*:\s*(.+)$/i.exec(declaration);
  if (!height) {
    return true;
  }
  const size = parseDimension(height[1]);
  return !!size && isRelative(size) && size.value >= 100;
}

// The iframe needed a height to stretch between top and bottom; a div doesn't, and
// iOS Safari's 100vh is the large viewport, which hides the bottom under the toolbar.
// `auto` rather than dropping it, so creative CSS can't set one. Fixed only: an
// absolute box would stretch to a positioned ancestor, which may be the whole page.
function pinnedHeight(box: string[]): string[] {
  const css = `;${box.join(';')}`;
  return /;position\s*:\s*fixed/i.test(css) &&
    /;top\s*:/i.test(css) &&
    /;bottom\s*:/i.test(css)
    ? box.map((d) => (/^height\s*:/i.test(d) ? 'height: auto' : d))
    : box;
}

// The base only resolves protocol-relative URLs; a relative path lands on it and fails.
function isGoogleFontsUrl(href: string): boolean {
  try {
    return (
      new URL(href, 'https://invalid.invalid/').hostname === GOOGLE_FONTS_HOST
    );
  } catch (_e) {
    return false;
  }
}

// Comments and strings are matched so an @import inside them is skipped.
const IMPORT_RE =
  /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)|"([^"]*)"|'([^']*)')([^;{}]*);/gi;

// Branch's documented custom-font method is an @import in the creative CSS. Inside the
// shadow root it would be dropped (and Chrome ignores @font-face there), so Google
// Fonts imports are hoisted like font links. Null: an import v2 can't reproduce.
function extractFontImports(
  css: string,
): { css: string; urls: string[] } | null {
  const urls: string[] = [];
  let unsupported = false;
  const rest = css.replace(IMPORT_RE, (match, ...groups: string[]) => {
    if (match.charAt(0) !== '@') {
      return match;
    }
    const url = groups.slice(0, 5).find((g) => g !== undefined) as string;
    if (groups[5].trim() || !isGoogleFontsUrl(url)) {
      unsupported = true;
      return match;
    }
    urls.push(url);
    return '';
  });
  return unsupported ? null : { css: rest, urls };
}

// Comments and strings are matched so an @font-face inside them is skipped.
const FONT_FACE_RE =
  /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|(@font-face)(?![\w-])/gi;

// Chrome ignores @font-face in a shadow root, so such creatives stay on v1.
function hasFontFace(css: string): boolean {
  return Array.from(css.matchAll(FONT_FACE_RE)).some((match) => !!match[1]);
}

function build(
  input: AdapterInput,
  branch: any,
): JourneyPayload | FallbackReason {
  const html = applyCtaOverride(branch, input.html);
  const metadata = getMetadata(html);
  if (!metadata || typeof metadata !== 'object') {
    return 'no-metadata';
  }
  const bannerHeight = parseDimension(metadata.bannerHeight);
  if (!bannerHeight) {
    return 'bad-banner-height';
  }
  const { sticky, position } = metadata;
  if (
    (sticky !== 'absolute' && sticky !== 'fixed') ||
    (position !== 'top' && position !== 'bottom')
  ) {
    return 'bad-placement';
  }
  const script = getJs(html);
  if (script === undefined) {
    return 'no-cta-script';
  }
  const callbackString = input.requestData?.callback_string;
  if (!callbackString) {
    return 'no-cta-callback';
  }
  const isIntrinsic = metadata.isIntrinsic === true;
  const geometry = parseGeometry(getIframeCss(html) || '', isIntrinsic);
  if (!geometry) {
    return 'unknown-iframe-css';
  }

  // Chromium reports a CSP violation for every <style> DOMParser sees.
  const doc = new DOMParser().parseFromString(
    html.replace(STYLE_ELEMENT_RE, ''),
    'text/html',
  );
  if (!doc.getElementById('branch-banner')) {
    return 'no-branch-banner';
  }
  // v1's iframe loaded any stylesheet; v2 can only hoist Google Fonts.
  const links = Array.from(
    doc.querySelectorAll('link[rel="stylesheet"][href]'),
  ).map((link) => link.getAttribute('href') as string);
  const imported = extractFontImports(getCss(html) || '');
  if (!imported || !links.every(isGoogleFontsUrl)) {
    return 'unsupported-stylesheet';
  }
  if (hasFontFace(imported.css)) {
    return 'font-face';
  }
  const fonts = Array.from(new Set(links.concat(imported.urls)));
  const wcag =
    doc.querySelector('meta[name="accessibility"]')?.getAttribute('content') ===
    'wcag';
  for (const el of Array.from(
    doc.body.querySelectorAll('script, style, meta, link'),
  )) {
    el.remove();
  }

  const link = input.journeyLinkData || {};
  const classes = input.animationConfig?.classes || {};
  return {
    render: {
      creative: {
        deviceType: link.type === 'desktop' ? 'desktop' : 'mobile',
        variant: link.variant || undefined,
        html: doc.body.innerHTML.trim(),
        css: imported.css,
        wcag,
      },
      placement: {
        sticky,
        anchorY: position,
        bannerHeight,
        offsetY: parseDimension(metadata.offsetY) || undefined,
        isIntrinsic,
        injectorSelector: metadata.injectorSelector || undefined,
      },
      geometry,
      animation: {
        enterClass: classes.enter || 'branch-banner-enter',
        exitClass: classes.exit || 'branch-banner-exit',
        css: input.animationConfig?.generatedCss || '',
      },
      fonts,
      ctaText: {
        hasApp: metadata.ctaText?.has_app,
        noApp: metadata.ctaText?.no_app,
      },
    },
    view: {
      id: input.templateId,
      audienceRuleId: input.branchViewData?.audience_rule_id,
    },
    cta: { script, callbackString },
    dismissal: {
      globalPeriodSeconds:
        typeof metadata.globalDismissPeriod === 'number'
          ? metadata.globalDismissPeriod
          : undefined,
      redirectUrl: metadata.dismissRedirect || undefined,
    },
    linkData: buildJourneyLinkData(input.templateId, input.journeyLinkData),
  };
}

export function toPayload(input: AdapterInput, branch: any): AdapterResult {
  try {
    const result = build(input, branch);
    return typeof result === 'string'
      ? { fallback: result }
      : { payload: result };
  } catch (_e) {
    return { fallback: 'adapter-error' };
  }
}
