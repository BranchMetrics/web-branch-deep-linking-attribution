'use strict';
goog.provide('journeys_v2.frame');

goog.require('banner_utils');
goog.require('journeys_frame');
goog.require('utils');

// DOM construction for a server-laid-out journey. The server ships final CSS for both the iframe
// and the creative, so this module only places things - it never computes geometry or transitions.
journeys_v2.frame.OUTER_CSS_ID = 'branch-iframe-css';
journeys_v2.frame.INNER_CSS_ID = 'branch-css';
journeys_v2.frame.CTA_SCRIPT_ID = 'branch-journey-cta';
journeys_v2.frame.CTA_BUTTON_ID = 'branch-mobile-action';

// Iframe shell construction delegates to journeys_frame (shared with legacy journeys_utils)
journeys_v2.frame.styleElement = journeys_frame.styleElement;
journeys_v2.frame.createIframe = journeys_frame.createIframe;
journeys_v2.frame.mount = journeys_frame.mount;

journeys_v2.frame.injectOuterCss = function (css) {
  banner_utils.removeElement(
    document.getElementById(journeys_v2.frame.OUTER_CSS_ID),
  );
  if (css === undefined) {
    return;
  }
  document.head.appendChild(
    journeys_v2.frame.styleElement(
      document,
      journeys_v2.frame.OUTER_CSS_ID,
      css,
    ),
  );
};

journeys_v2.frame.injectInnerCss = function (iframe, css) {
  if (css === undefined) {
    return;
  }
  var doc = iframe.contentWindow.document;
  doc.head.appendChild(
    journeys_v2.frame.styleElement(doc, journeys_v2.frame.INNER_CSS_ID, css),
  );
};

// A relatively-sized (vh/%) creative without the dismiss-background scrim has nothing stretching
// `.branch-banner-content` to the iframe's height, leaving a blank band below - stays SDK-side,
// as it was in legacy's addIframeInnerCSS.
journeys_v2.frame.fitContentHeight = function (iframe, layout) {
  if (!layout.isRelative || layout.isDesktopOverlay) {
    return;
  }
  var doc = iframe.contentWindow.document;
  if (doc.getElementsByClassName('branch-banner-dismiss-background')[0]) {
    return;
  }
  var content = doc.getElementsByClassName('branch-banner-content')[0];
  if (content) {
    content.style.height = layout.bannerHeight;
  }
};

// Removes the iframe's box-shadow when .branch-banner-content is fully transparent, so a floating
// CTA button creative doesn't show a stray shadow with nothing visible behind it. Mirrors legacy's
// addIframeInnerCSS check.
journeys_v2.frame.hideShadowForTransparentContent = function (iframe) {
  try {
    const doc = iframe.contentWindow.document;
    const content = doc.getElementsByClassName('branch-banner-content')[0];
    const bg = window
      .getComputedStyle(content)
      .getPropertyValue('background-color');
    const alpha = bg.split(', ')[3];
    if (alpha && parseFloat(alpha) === 0) {
      iframe.style.boxShadow = 'none';
    }
  } catch (_e) {}
};

// Runs in the parent page so the CTA callback script can reach `window[callback_string]`.
journeys_v2.frame.installCtaScript = function (js) {
  if (js === undefined) {
    return;
  }
  var script = document.createElement('script');
  script.id = journeys_v2.frame.CTA_SCRIPT_ID;
  utils.addNonceAttribute(script);
  script.innerHTML = js;
  document.body.appendChild(script);
};

journeys_v2.frame.setCtaText = function (iframe, text) {
  if (!text) {
    return;
  }
  var button = iframe.contentWindow.document.getElementById(
    journeys_v2.frame.CTA_BUTTON_ID,
  );
  if (button) {
    button.innerHTML = text;
    button.setAttribute('aria-label', text);
  }
};

// Shifts the customer's own elements (typically a fixed nav) down by the banner height. A fixed
// nav under a full-page creative is left alone - the creative covers it. Returns the parents that
// were pushed, for resetInjectorParents.
journeys_v2.frame.pushInjectorParents = function (layout) {
  if (!layout.injectorSelector) {
    return [];
  }
  var injectors = document.querySelectorAll(layout.injectorSelector);
  var parents = [];
  for (let i = 0; i < injectors.length; i++) {
    const parent = injectors[i].parentElement;
    if (!parent) {
      continue;
    }
    const computedParentStyle = window.getComputedStyle(parent);
    const isFixedUnderFullPage =
      layout.isFullPage &&
      computedParentStyle &&
      computedParentStyle.getPropertyValue('position') === 'fixed';
    if (!isFixedUnderFullPage) {
      parent.style.marginTop = layout.bannerHeight;
      parents.push(parent);
    }
  }
  return parents;
};

journeys_v2.frame.resetInjectorParents = function (parents) {
  for (let i = 0; i < parents.length; i++) {
    parents[i].style.marginTop = '';
  }
};

// Removes everything the frame put in the parent document. Removing `branch-iframe-css` also
// removes the body push rule, so the page reflows on its own.
journeys_v2.frame.teardown = function (iframe) {
  banner_utils.removeElement(iframe);
  banner_utils.removeElement(
    document.getElementById(journeys_v2.frame.OUTER_CSS_ID),
  );
  banner_utils.removeElement(
    document.getElementById(journeys_v2.frame.CTA_SCRIPT_ID),
  );
};
