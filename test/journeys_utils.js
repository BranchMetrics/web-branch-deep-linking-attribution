'use strict';

var sinon = require('sinon');

goog.require('journeys_utils');

describe('getRelativeHeightValueOrFalseFromBannerHeight', function() {
  const assert = testUtils.unplanned();
  it('should return false when bannerHeight is in pixel values', function() {
    const bannerHeight = '350px';
    const expected = false;
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, 'false when bannerHeight is pixels');
  });

  it('should return the height value when bannerHeight is provided with viewHeight units - 100vh', function() {
    const bannerHeight = '100vh';
    const expected = '100';
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '100 from bannerHeight of 100vh');
  });

  it('should return the height value when bannerHeight is provided with viewHeight units - 99vh', function() {
    const bannerHeight = '99vh';
    const expected = '99';
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '99 from bannerHeight of 99vh');
  });

  it('should return the height value when bannerHeight is provided with viewHeight units - 5vh', function() {
    const bannerHeight = '5vh';
    const expected = '5';
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '5 from bannerHeight of 5vh');
  });

  it('should return the height value when bannerHeight is provided with percentage units - 100%', function() {
    const bannerHeight = '100%';
    const expected = '100';
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '100 from bannerHeight of 100%');
  });

  it('should return the height value when bannerHeight is provided with percentage units - 99%', function() {
    const bannerHeight = '99%';
    const expected = '99';
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '99 from bannerHeight of 99%');
  });

  it('should return the height value when bannerHeight is provided with percentage units - 5%', function() {
    const bannerHeight = '5%';
    const expected = '5';
    assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '5 from bannerHeight of 5%');
  });
});

describe('addIframeOuterCSS generated CSS (no BE-supplied cssIframeContainer)', function() {
  const assert = testUtils.unplanned();

  afterEach(function() {
    var existing = document.getElementById('branch-iframe-css');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    document.body.removeAttribute('style');
  });

  it('should give body the same transition duration as the iframe', function() {
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.isDesktopJourney = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 200;
    journeys_utils.divToInjectParents = [];

    journeys_utils.addIframeOuterCSS(undefined, {});

    var expectedDurationSeconds = journeys_utils.animationSpeed / 1000;
    assert.strictEqual(document.body.style.transition, 'all 0' + expectedDurationSeconds + 's ease');

    var css = document.getElementById('branch-iframe-css').innerHTML;
    assert.ok(
      css.indexOf('body { -webkit-transition: all ' + expectedDurationSeconds + 's ease; }') !== -1,
      'body -webkit-transition duration should match the iframe duration'
    );
    assert.ok(
      css.indexOf('-webkit-transition: all ' + expectedDurationSeconds + 's ease; transition: all 0' + expectedDurationSeconds + 's ease;') !== -1,
      'iframe rule should use the same duration as body'
    );
  });
});

describe('animateBannerExit margin/position restore timing', function() {
  const assert = testUtils.unplanned();
  var clock;
  var banner;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    banner = document.createElement('div');
    document.body.appendChild(banner);

    journeys_utils.branch = { _publishEvent: sinon.stub() };
    journeys_utils.journeyLinkData = {};
    journeys_utils.divToInjectParents = [];
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.bodyMarginTop = '10px';
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 250;
    journeys_utils.animationDelay = 20;
    journeys_utils.isSafeAreaEnabled = false;
    document.body.style.marginTop = '86px';
  });

  afterEach(function() {
    clock.restore();
    sinon.restore();
    journeys_utils.exitAnimationIsRunning = false;
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
    document.body.removeAttribute('style');
    document.body.className = '';
  });

  it('restores body margin and banner position synchronously, before the delayed teardown', function() {
    journeys_utils.animateBannerExit(banner);

    // synchronous: happens immediately, not inside the delayed setTimeout
    assert.strictEqual(banner.style.top, '-' + journeys_utils.bannerHeight);
    assert.strictEqual(document.body.style.marginTop, journeys_utils.bodyMarginTop);

    // teardown (removal) is still deferred at this point
    assert.strictEqual(document.body.contains(banner), true);

    clock.tick(journeys_utils.animationSpeed + journeys_utils.animationDelay);

    assert.strictEqual(document.body.contains(banner), false);
  });
});

describe('addIframeInnerCSS entrance and use_v2_renderer', function() {
  const assert = testUtils.unplanned();
  var iframe;

  beforeEach(function() {
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.isHalfPage = false;
    journeys_utils.isFullPage = false;
    journeys_utils.isDesktopJourney = false;
    journeys_utils.journeyVariant = null;
    journeys_utils.use_v2_renderer = false;

    iframe = journeys_utils.createIframe();
    document.body.appendChild(iframe);
    iframe.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"><div class="branch-banner-content">hi</div></div>';
  });

  afterEach(function() {
    journeys_utils.use_v2_renderer = false;
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  it('does not move the iframe when use_v2_renderer is true', function() {
    journeys_utils.use_v2_renderer = true;

    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '');
  });

  it('still moves the iframe when use_v2_renderer is false (legacy)', function() {
    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '-76px');
  });
});

describe('animateBannerExit branch-banner exit class and use_v2_renderer', function() {
  const assert = testUtils.unplanned();
  var clock;
  var banner;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    banner = document.createElement('iframe');
    document.body.appendChild(banner);

    journeys_utils.branch = { _publishEvent: sinon.stub() };
    journeys_utils.journeyLinkData = {};
    journeys_utils.divToInjectParents = [];
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.bodyMarginTop = '10px';
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 250;
    journeys_utils.animationDelay = 20;
    journeys_utils.isSafeAreaEnabled = false;
    journeys_utils.use_v2_renderer = false;
  });

  afterEach(function() {
    clock.restore();
    sinon.restore();
    journeys_utils.use_v2_renderer = false;
    journeys_utils.exitAnimationIsRunning = false;
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
    document.body.removeAttribute('style');
    document.body.className = '';
  });

  it('adds branch-banner-exit to #branch-banner so any authored exit keyframes can play', function() {
    journeys_utils.use_v2_renderer = true;
    banner.contentWindow.document.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    var bannerRoot = banner.contentWindow.document.getElementById('branch-banner');
    assert.strictEqual(bannerRoot.className.indexOf('branch-banner-exit') !== -1, true);
  });

  it('still moves the iframe itself when use_v2_renderer is true but the creative has no #branch-banner', function() {
    journeys_utils.use_v2_renderer = true;

    assert.doesNotThrow(function() {
      journeys_utils.animateBannerExit(banner);
    });
    assert.strictEqual(banner.style.top, '-76px');
  });

  it('waits for a longer content exit animation instead of cutting it off at the default timeout', function() {
    journeys_utils.use_v2_renderer = true;
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner.branch-banner-exit { animation: branch-slide-out-top 0.5s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // the default timeout (animationSpeed + animationDelay = 270ms) would remove it too early
    clock.tick(journeys_utils.animationSpeed + journeys_utils.animationDelay);
    assert.strictEqual(document.body.contains(banner), true);

    // the content's real 500ms exit animation gets to finish before removal happens
    clock.tick(500 - (journeys_utils.animationSpeed + journeys_utils.animationDelay));
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('waits out a delayed exit animation instead of removing mid-animation', function() {
    journeys_utils.use_v2_renderer = true;
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    // doesn't start playing until 0.3s in, then plays for 0.4s -- finishes at 0.7s total
    style.textContent = '#branch-banner.branch-banner-exit { animation: branch-slide-out-top 0.4s ease 0.3s both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // duration alone (400ms) would remove it before the delayed animation even finishes playing
    clock.tick(400);
    assert.strictEqual(document.body.contains(banner), true);

    // delay + duration (700ms) gets to elapse before removal happens
    clock.tick(300);
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('does not move the iframe itself when use_v2_renderer is true', function() {
    journeys_utils.use_v2_renderer = true;
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner.branch-banner-exit { animation: branch-slide-out-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // #branch-banner-iframe has no transition of its own once the content handles this, so
    // moving it here would snap it off-screen instantly instead of letting the content's
    // animation actually play out.
    assert.strictEqual(banner.style.top, '');
  });

  it('does not move the iframe and removes at the default timeout when use_v2_renderer is true but there is no exit animation', function() {
    journeys_utils.use_v2_renderer = true;
    banner.contentWindow.document.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '');
    clock.tick(journeys_utils.animationSpeed + journeys_utils.animationDelay);
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('still moves the iframe itself when use_v2_renderer is false (legacy), even if #branch-banner has CSS animation', function() {
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner { animation: branch-slide-in-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '-76px');
  });

});

describe('animationConfig support', function() {
  const assert = testUtils.unplanned();
  var banner;

  var mockAnimationConfig = {
    classes: {
      enter: 'branch-banner-enter',
      exit: 'branch-banner-exit'
    },
    generatedCss: '.branch-banner-enter { animation: branch-slide-in-bottom 0.25s ease both; }\n.branch-banner-exit { animation: branch-slide-out-bottom 0.25s ease both; }',
    surface: 'CONTENT',
    type: 'SLIDE'
  };

  beforeEach(function() {
    banner = document.createElement('iframe');
    document.body.appendChild(banner);

    journeys_utils.branch = { _publishEvent: sinon.stub() };
    journeys_utils.journeyLinkData = {};
    journeys_utils.use_v2_renderer = true;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.animationConfig = JSON.parse(JSON.stringify(mockAnimationConfig));
  });

  afterEach(function() {
    journeys_utils.animationConfig = null;
    journeys_utils.use_v2_renderer = false;
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  });

  it('injects generatedCss into iframe inner head when surface is CONTENT', function() {
    var iframe = journeys_utils.createIframe();
    document.body.appendChild(iframe);

    journeys_utils.addIframeInnerCSS(iframe, '/* inner css */');

    var doc = iframe.contentWindow.document;
    var styleEl = doc.getElementById('branch-css');
    assert.ok(styleEl, 'branch-css element should exist');
    assert.ok(
      styleEl.innerHTML.indexOf('.branch-banner-enter') !== -1,
      'generatedCss should be injected into inner style'
    );

    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  it('applies enter animation class from animationConfig during entrance animation', function() {
    banner.contentWindow.document.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerEntrance(banner);

    var bannerRoot = journeys_utils.getAnimationRoot(banner);
    assert.ok(
      bannerRoot.className.indexOf('branch-banner-enter') !== -1,
      'enter animation class from config should be attached'
    );
  });

  it('detaches enter class and attaches exit class from animationConfig during exit animation', function() {
    banner.contentWindow.document.body.innerHTML = '<div id="branch-banner" class="branch-banner-enter"></div>';

    journeys_utils.animateBannerExit(banner);

    var bannerRoot = journeys_utils.getAnimationRoot(banner);
    assert.strictEqual(
      bannerRoot.className.indexOf('branch-banner-enter'),
      -1,
      'enter animation class should be detached'
    );
    assert.ok(
      bannerRoot.className.indexOf('branch-banner-exit') !== -1,
      'exit animation class from config should be attached'
    );
  });

  it('applies outer CSS to host page when surface is IFRAME', function() {
    journeys_utils.animationConfig.surface = 'IFRAME';
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';

    journeys_utils.addIframeOuterCSS(undefined, {});

    var outerStyleEl = document.getElementById('branch-iframe-css');
    assert.ok(outerStyleEl, 'branch-iframe-css element should exist');
    assert.ok(
      outerStyleEl.innerHTML.indexOf('.branch-banner-enter') !== -1,
      'generatedCss should be injected into outer style'
    );

    if (outerStyleEl && outerStyleEl.parentNode) {
      outerStyleEl.parentNode.removeChild(outerStyleEl);
    }
  });
});