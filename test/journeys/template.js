'use strict';

goog.require('journeys_template');
goog.require('journeys_utils');

// Characterization tests for the html-blob extraction contract (mirrors WebSdkContract.kt in
// audience-rule-service). Written against the legacy journeys_utils implementation first, then
// flipped to journeys_template once extracted - same assertions, so behavior is pinned across the move.
var subject = journeys_template;

var METADATA = {
  bannerHeight: '76px',
  position: 'top',
  sticky: 'absolute',
  ctaText: { has_app: 'Open', no_app: 'Get' },
};
var INNER_CSS =
  '#branch-banner { color: red; }\n@keyframes branch-slide-in-top { from { transform: translateY(-100%); } to { transform: translateY(0); } }';
var IFRAME_CSS =
  'body {\n    margin-top: 76px;\n}\n#branch-banner-iframe { position: absolute; }';
var JS =
  'window.top.branch_view_callback__1(function() { window.top.location = "https://example.com"; });';
var BODY =
  '<div id="branch-banner"><div class="branch-banner-content"><button id="branch-mobile-action">Get</button></div></div>';

function blob(parts) {
  parts = parts || {};
  var html = '<html><head>';
  if (parts.innerCss !== null) {
    html +=
      '<style type="text/css" id="branch-css">' +
      (parts.innerCss || INNER_CSS) +
      '</style>';
  }
  if (parts.iframeCss !== null) {
    html +=
      '<style type="text/css" id="branch-iframe-css">' +
      (parts.iframeCss || IFRAME_CSS) +
      '</style>';
  }
  html += '</head><body>' + BODY;
  if (parts.metadata !== null) {
    html +=
      '<script type="application/json">' +
      (parts.metadata || JSON.stringify(METADATA)) +
      '</script>';
  }
  if (parts.js !== null) {
    html += '<script type="text/javascript">' + (parts.js || JS) + '</script>';
  }
  return html + '</body></html>';
}

describe('journeys template: getMetadata', function () {
  const assert = testUtils.unplanned();

  it('parses the application/json block', function () {
    assert.deepEqual(subject.getMetadata(blob()), METADATA);
  });

  it('returns undefined when the block is missing', function () {
    assert.strictEqual(
      subject.getMetadata(blob({ metadata: null })),
      undefined,
    );
  });

  it('throws when the block is not valid JSON', function () {
    assert.throws(function () {
      subject.getMetadata(blob({ metadata: '{not json' }));
    });
  });

  it('takes only the first block when several are present', function () {
    var html =
      blob() + '<script type="application/json">{"position":"bottom"}</script>';
    assert.strictEqual(subject.getMetadata(html).position, 'top');
  });
});

describe('journeys template: getCss / getIframeCss', function () {
  const assert = testUtils.unplanned();

  it('returns the branch-css block contents verbatim, including newlines', function () {
    assert.strictEqual(subject.getCss(blob()), INNER_CSS);
  });

  it('returns the branch-iframe-css block contents verbatim, including newlines', function () {
    assert.strictEqual(subject.getIframeCss(blob()), IFRAME_CSS);
  });

  it('does not confuse the two style blocks', function () {
    assert.strictEqual(subject.getCss(blob({ iframeCss: null })), INNER_CSS);
    assert.strictEqual(
      subject.getIframeCss(blob({ innerCss: null })),
      IFRAME_CSS,
    );
  });

  it('returns undefined when a block is missing', function () {
    assert.strictEqual(subject.getCss(blob({ innerCss: null })), undefined);
    assert.strictEqual(
      subject.getIframeCss(blob({ iframeCss: null })),
      undefined,
    );
  });
});

describe('journeys template: getJs', function () {
  const assert = testUtils.unplanned();

  it('returns the text/javascript block contents', function () {
    assert.strictEqual(subject.getJs(blob()), JS);
  });

  it('returns undefined when there is no text/javascript block', function () {
    assert.strictEqual(subject.getJs(blob({ js: null })), undefined);
  });
});

describe('journeys template: parse', function () {
  const assert = testUtils.unplanned();

  it('splits the blob into all of its parts at once', function () {
    var parts = subject.parse(blob());
    assert.deepEqual(parts.metadata, METADATA);
    assert.strictEqual(parts.innerCss, INNER_CSS);
    assert.strictEqual(parts.iframeCss, IFRAME_CSS);
    assert.strictEqual(parts.js, JS);
    assert.strictEqual(parts.bodyHtml.indexOf('<style'), -1);
    assert.notStrictEqual(parts.bodyHtml.indexOf(BODY), -1);
  });

  it('defaults metadata to an empty object when the block is missing', function () {
    assert.deepEqual(subject.parse(blob({ metadata: null })).metadata, {});
    // Same sentinel as the getters - v2's injectors skip on `=== undefined`, so null would leak
    // empty <style>/<script> elements into the page.
    var missing = subject.parse(
      blob({ innerCss: null, iframeCss: null, js: null }),
    );
    assert.strictEqual(missing.innerCss, undefined);
    assert.strictEqual(missing.iframeCss, undefined);
    assert.strictEqual(missing.js, undefined);
  });
});

// Legacy keeps the DOM side effect; it only delegates the extraction to journeys_template.
describe('journeys_utils.getJsAndAddToParent (legacy)', function () {
  const assert = testUtils.unplanned();

  afterEach(function () {
    var script = document.getElementById('branch-journey-cta');
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });

  it('appends the text/javascript block to document.body as #branch-journey-cta', function () {
    journeys_utils.getJsAndAddToParent(blob());
    var script = document.getElementById('branch-journey-cta');
    assert.ok(script);
    assert.strictEqual(script.parentNode, document.body);
    assert.strictEqual(script.innerHTML, JS);
  });

  it('does nothing when there is no text/javascript block', function () {
    journeys_utils.getJsAndAddToParent(blob({ js: null }));
    assert.strictEqual(document.getElementById('branch-journey-cta'), null);
  });
});

describe('journeys template: removeScriptAndCss', function () {
  const assert = testUtils.unplanned();

  it('strips all four blocks and keeps the creative markup', function () {
    var stripped = subject.removeScriptAndCss(blob());
    assert.strictEqual(stripped.indexOf('<style'), -1);
    assert.strictEqual(stripped.indexOf('<script'), -1);
    assert.notStrictEqual(stripped.indexOf(BODY), -1);
  });

  it('leaves html without any blocks untouched', function () {
    var html = '<html><head></head><body>' + BODY + '</body></html>';
    assert.strictEqual(subject.removeScriptAndCss(html), html);
  });

  it('strips only the blocks that are present', function () {
    var stripped = subject.removeScriptAndCss(
      blob({ js: null, metadata: null }),
    );
    assert.strictEqual(stripped.indexOf('<style'), -1);
    assert.notStrictEqual(stripped.indexOf(BODY), -1);
  });
});

describe('journeys template: getCtaText', function () {
  const assert = testUtils.unplanned();

  it('prefers has_app text when the user has the app', function () {
    assert.strictEqual(subject.getCtaText(METADATA, true), 'Open');
  });

  it('uses no_app text when the user does not have the app', function () {
    assert.strictEqual(subject.getCtaText(METADATA, false), 'Get');
  });

  it('falls back to no_app text when has_app text is missing', function () {
    assert.strictEqual(
      subject.getCtaText({ ctaText: { no_app: 'Get' } }, true),
      'Get',
    );
  });

  it('returns undefined without ctaText metadata', function () {
    assert.strictEqual(subject.getCtaText({}, true), undefined);
    assert.strictEqual(subject.getCtaText(undefined, false), undefined);
  });
});
