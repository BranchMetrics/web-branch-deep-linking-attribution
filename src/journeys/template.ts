import { safejson } from '../core/safejson.js';

// Regexes for the served template. audience-rule-service mirrors jsonRe, cssRe and
// iframeCssRe in core/WebSdkContract.kt to validate templates; change both together.
export const jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
export const jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
export const cssRe =
  /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
export const iframeCssRe =
  /<style type="text\/css" id="branch-iframe-css">((.|\s)*?)<\/style>/;

function firstGroup(html: string, re: RegExp): string | undefined {
  const match = html.match(re);
  return match ? match[1] : undefined;
}

export function getMetadata(html: string): any {
  const src = firstGroup(html, jsonRe);
  if (src !== undefined) {
    return safejson.parse(src);
  }
}

export function getCss(html: string): string | undefined {
  return firstGroup(html, cssRe);
}

export function getIframeCss(html: string): string | undefined {
  return firstGroup(html, iframeCssRe);
}

export function getJs(html: string): string | undefined {
  return firstGroup(html, jsRe);
}

export function removeScriptAndCss(html: string): string {
  for (const re of [jsonRe, jsRe, cssRe, iframeCssRe]) {
    if (html.match(re)) {
      html = html.replace(re, '');
    }
  }
  return html;
}

export function getCtaText(metadata: any, hasApp: boolean): string | undefined {
  if (hasApp && metadata?.ctaText?.has_app) {
    return metadata.ctaText.has_app;
  }
  if (metadata?.ctaText?.no_app) {
    return metadata.ctaText.no_app;
  }
  return undefined;
}
