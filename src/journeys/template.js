'use strict';
goog.provide('journeys_template');

goog.require('safejson');

// The html-blob extraction contract between the Web SDK and the journeys render service. These
// regexes must stay in sync with audience-rule-service's WebSdkContract.kt.
journeys_template.jsonRe =
  /<script type="application\/json">([\s\S]*?)<\/script>/;
journeys_template.jsRe = /<script type="text\/javascript">([\s\S]*?)<\/script>/;
journeys_template.cssRe =
  /<style type="text\/css" id="branch-css">([\s\S]*?)<\/style>/;
journeys_template.iframeCssRe =
  /<style type="text\/css" id="branch-iframe-css">([\s\S]*?)<\/style>/;

function firstCapture(html, re) {
  var match = html.match(re);
  if (match) {
    return match[1];
  }
}

// Throws on malformed JSON (safejson.parse).
journeys_template.getMetadata = function (html) {
  var src = firstCapture(html, journeys_template.jsonRe);
  if (src !== undefined) {
    return safejson.parse(src);
  }
};

journeys_template.getCss = function (html) {
  return firstCapture(html, journeys_template.cssRe);
};

journeys_template.getIframeCss = function (html) {
  return firstCapture(html, journeys_template.iframeCssRe);
};

journeys_template.getJs = function (html) {
  return firstCapture(html, journeys_template.jsRe);
};

// The creative markup with all four blocks removed - what goes into the iframe body.
journeys_template.removeScriptAndCss = function (html) {
  return html
    .replace(journeys_template.jsonRe, '')
    .replace(journeys_template.jsRe, '')
    .replace(journeys_template.cssRe, '')
    .replace(journeys_template.iframeCssRe, '');
};

journeys_template.getCtaText = function (metadata, hasApp) {
  var ctaText = metadata && metadata['ctaText'];
  if (!ctaText) {
    return undefined;
  }
  if (hasApp && ctaText['has_app']) {
    return ctaText['has_app'];
  }
  return ctaText['no_app'] || undefined;
};

// One-shot split of the served template into its parts, for callers that want the whole contract
// at once (journeys_v2). metadata defaults to {} so callers can read keys without null checks.
journeys_template.parse = function (html) {
  var jsonMatch = html.match(journeys_template.jsonRe);
  var jsMatch = html.match(journeys_template.jsRe);
  var cssMatch = html.match(journeys_template.cssRe);
  var iframeCssMatch = html.match(journeys_template.iframeCssRe);

  var bodyHtml = html;
  [jsonMatch, jsMatch, cssMatch, iframeCssMatch].forEach(function (match) {
    if (match) {
      bodyHtml = bodyHtml.replace(match[0], '');
    }
  });

  return {
    metadata: (jsonMatch ? safejson.parse(jsonMatch[1]) : undefined) || {},
    innerCss: cssMatch ? cssMatch[1] : undefined,
    iframeCss: iframeCssMatch ? iframeCssMatch[1] : undefined,
    js: jsMatch ? jsMatch[1] : undefined,
    bodyHtml: bodyHtml,
  };
};
