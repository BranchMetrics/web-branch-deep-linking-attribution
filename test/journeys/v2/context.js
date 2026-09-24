'use strict';

var sinon = require('sinon');

goog.require('journeys_v2.context');
goog.require('utils');

var METADATA = {
  bannerHeight: '76px',
  position: 'top',
  sticky: 'absolute',
  injectorSelector: '.branch-journeys-top',
  ctaText: { has_app: 'Open', no_app: 'Get' },
};

function html(metadata) {
  return (
    '<html><head><style type="text/css" id="branch-css">#branch-banner{}</style>' +
    '<style type="text/css" id="branch-iframe-css">body{margin-top:76px}</style></head>' +
    '<body><div id="branch-banner"></div>' +
    '<script type="application/json">' +
    JSON.stringify(metadata || METADATA) +
    '</script>' +
    '<script type="text/javascript">cta();</script></body></html>'
  );
}

describe('journeys_v2.context.buildLinkData', function () {
  const assert = testUtils.unplanned();

  it('carries banner_id and only banner_id when there is no link data', function () {
    assert.deepEqual(journeys_v2.context.buildLinkData('t1', null), {
      banner_id: 't1',
    });
    assert.deepEqual(journeys_v2.context.buildLinkData('t1', {}), {
      banner_id: 't1',
    });
  });

  it('copies link data minus the filtered keys, without mutating the input', function () {
    var raw = {
      journey_id: 'j',
      type: 'mobile_web',
      browser_fingerprint_id: 'x',
      app_id: 'a',
      source: 's',
      open_app: true,
      link_click_id: 'c',
    };
    var out = journeys_v2.context.buildLinkData('t1', raw);
    assert.deepEqual(out, {
      banner_id: 't1',
      journey_link_data: { journey_id: 'j', type: 'mobile_web' },
    });
    assert.strictEqual(Object.keys(raw).length, 7, 'input untouched');
  });
});

describe('journeys_v2.context.layoutFrom', function () {
  const assert = testUtils.unplanned();

  it('reads position/height/sticky/injectorSelector straight off metadata', function () {
    assert.deepEqual(journeys_v2.context.layoutFrom(METADATA), {
      position: 'top',
      bannerHeight: '76px',
      sticky: 'absolute',
      isRelative: false,
      isFullPage: false,
      isDesktopOverlay: false,
      injectorSelector: '.branch-journeys-top',
    });
  });

  it('resolves relative heights (vh / %) to viewport px like legacy setPositionAndHeight', function () {
    // A `%` margin-top on the injector parent would resolve against its width, and customers parse
    // the willShowJourney bannerHeight as pixels - so the parent-page value is always px.
    var h = window.innerHeight;
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '100vh' }).bannerHeight,
      h + 'px',
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '50%' }).bannerHeight,
      h / 2 + 'px',
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '60vh' }).isRelative,
      true,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '600px' }).bannerHeight,
      '600px',
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '600px' }).isRelative,
      false,
    );
  });

  it('flags a desktop overlay from the link data type/variant', function () {
    assert.strictEqual(
      journeys_v2.context.layoutFrom(
        {},
        { type: 'desktop', variant: 'overlay' },
      ).isDesktopOverlay,
      true,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({}, { type: 'desktop', variant: 'banner' })
        .isDesktopOverlay,
      false,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({}, { type: 'mobile_web' })
        .isDesktopOverlay,
      false,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({}, null).isDesktopOverlay,
      false,
    );
  });

  it('flags full page for 100vh / 100% and not for partial or pixel heights', function () {
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '100vh' }).isFullPage,
      true,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '100%' }).isFullPage,
      true,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '60vh' }).isFullPage,
      false,
    );
    assert.strictEqual(
      journeys_v2.context.layoutFrom({ bannerHeight: '600px' }).isFullPage,
      false,
    );
    assert.strictEqual(journeys_v2.context.layoutFrom({}).isFullPage, false);
  });
});

describe('journeys_v2.context.build', function () {
  const assert = testUtils.unplanned();
  var platformStub;

  beforeEach(function () {
    platformStub = sinon.stub(utils, 'getPlatformByUserAgent').returns('ios');
  });
  afterEach(function () {
    platformStub.restore();
  });

  function build(overrides) {
    var params = {
      branch: { _storage: { tag: 'storage' } },
      html: html(),
      requestData: {
        callback_string: 'branch_view_callback__7',
        has_app_websdk: true,
      },
      templateId: 't1',
      branchViewData: { audience_rule_id: 'r1', is_new_animation: true },
      linkData: { journey_id: 'j', app_id: 'drop-me' },
      testMode: false,
      options: { entryAnimationDisabled: true, animationConfig: {} },
    };
    return journeys_v2.context.build(Object.assign(params, overrides || {}));
  }

  it('assembles everything modules need from the render response and request', function () {
    var ctx = build();
    assert.strictEqual(ctx.storage.tag, 'storage');
    assert.strictEqual(ctx.templateId, 't1');
    assert.strictEqual(ctx.audienceRuleId, 'r1');
    assert.strictEqual(ctx.callbackString, 'branch_view_callback__7');
    assert.strictEqual(ctx.hasApp, true);
    assert.strictEqual(ctx.testMode, false);
    assert.strictEqual(ctx.platform, 'ios');
    assert.deepEqual(ctx.linkData, {
      banner_id: 't1',
      journey_link_data: { journey_id: 'j' },
    });
    assert.deepEqual(ctx.metadata, METADATA);
    assert.strictEqual(ctx.template.iframeCss, 'body{margin-top:76px}');
    assert.strictEqual(ctx.template.js, 'cta();');
    assert.strictEqual(ctx.layout.position, 'top');
    assert.deepEqual(ctx.options, {
      animationConfig: {},
      entryAnimationDisabled: true,
      exitAnimationDisabled: false,
    });
  });

  it('feeds the raw link data into layout so a desktop overlay is recognised', function () {
    var ctx = build({ linkData: { type: 'desktop', variant: 'overlay' } });
    assert.strictEqual(ctx.layout.isDesktopOverlay, true);
  });

  it('defaults options and coerces flags to booleans', function () {
    var ctx = build({
      options: undefined,
      testMode: 1,
      requestData: { callback_string: 'x' },
    });
    assert.deepEqual(ctx.options, {
      animationConfig: undefined,
      entryAnimationDisabled: false,
      exitAnimationDisabled: false,
    });
    assert.strictEqual(ctx.testMode, true);
    assert.strictEqual(ctx.hasApp, false);
  });
});

describe('journeys_v2.context.showEventData', function () {
  const assert = testUtils.unplanned();

  it('adds the legacy layout fields on top of the link data', function () {
    var ctx = {
      linkData: { banner_id: 't1', journey_link_data: { journey_id: 'j' } },
      layout: {
        position: 'bottom',
        bannerHeight: '812px',
        sticky: 'fixed',
        isFullPage: true,
      },
    };
    assert.deepEqual(journeys_v2.context.showEventData(ctx), {
      banner_id: 't1',
      journey_link_data: { journey_id: 'j' },
      bannerHeight: '812px',
      isFullPageBanner: true,
      bannerPagePlacement: 'bottom',
      isBannerInline: false,
      isBannerSticky: true,
    });
    assert.strictEqual(
      ctx.linkData.bannerHeight,
      undefined,
      'does not mutate ctx.linkData',
    );
  });
});
