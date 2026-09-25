'use strict';
goog.provide('journeys_frame');

goog.require('utils');

// Iframe shell construction shared by the legacy and journeys_v2 render pipelines.
journeys_frame.IFRAME_ID = 'branch-banner-iframe';

// Returns a detached iframe; the caller appends it so `onload` can be wired first.
journeys_frame.createIframe = function () {
  var iframe = /** @type {HTMLIFrameElement} */ (
    document.createElement('iframe')
  );
  iframe.src = 'about:blank'; // solves CORS issues, test in IE
  iframe.style.overflow = 'hidden';
  iframe.scrolling = 'no';
  iframe.id = journeys_frame.IFRAME_ID;
  iframe.className = 'branch-animation';
  iframe.title = 'Branch Banner Frame';
  iframe.setAttribute('aria-label', 'Branch Banner Frame');
  utils.addNonceAttribute(iframe);
  return iframe;
};

journeys_frame.bodyClassFor = function (platform) {
  if (platform === 'ios' || platform === 'ipad') {
    return 'branch-banner-ios';
  }
  if (platform === 'android') {
    return 'branch-banner-android';
  }
  return 'branch-banner-other';
};

journeys_frame.mount = function (iframe, html, platform) {
  var doc = iframe.contentDocument || iframe.contentWindow.document;
  // Ensure <head> and <body> exist for style injection and innerHTML.
  if (!doc.head) {
    (doc.documentElement || doc).appendChild(doc.createElement('head'));
  }
  if (!doc.body) {
    (doc.documentElement || doc).appendChild(doc.createElement('body'));
  }
  doc.body.innerHTML = html;
  doc.body.className = journeys_frame.bodyClassFor(platform);
  return doc;
};

journeys_frame.styleElement = function (doc, id, css) {
  var style = doc.createElement('style');
  style.type = 'text/css';
  if (id !== undefined) {
    style.id = id;
  }
  style.innerHTML = css;
  utils.addNonceAttribute(style);
  return style;
};
