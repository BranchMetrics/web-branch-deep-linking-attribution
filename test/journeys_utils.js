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

describe('addIframeInnerCSS entrance and a #branch-banner that animates itself', function() {
  const assert = testUtils.unplanned();
  var iframe;

  beforeEach(function() {
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.isHalfPage = false;
    journeys_utils.isFullPage = false;
    journeys_utils.isDesktopJourney = false;
    journeys_utils.journeyVariant = null;

    iframe = journeys_utils.createIframe();
    document.body.appendChild(iframe);
  });

  afterEach(function() {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  it('does not move the iframe when #branch-banner declares it handles its own entrance', function() {
    var doc = iframe.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner { --branch-entrance: 1; animation: branch-slide-in-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML =
      '<div id="branch-banner"><div class="branch-banner-content">hi</div></div>';

    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '');
  });

  it('does not move the iframe when #branch-banner declares ownership but has no animation to play', function() {
    var doc = iframe.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner { --branch-entrance: 1; position: fixed; }';
    doc.head.appendChild(style);
    doc.body.innerHTML =
      '<div id="branch-banner"><div class="branch-banner-content">hi</div></div>';

    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '');
  });

  it('still moves the iframe when #branch-banner animates but never declared it handles its own entrance', function() {
    var doc = iframe.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner { animation: creative-authored-pulse 2s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML =
      '<div id="branch-banner"><div class="branch-banner-content">hi</div></div>';

    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '-76px');
  });

  it('still moves the iframe when #branch-banner exists but has no animation (legacy, or types with none)', function() {
    iframe.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"><div class="branch-banner-content">hi</div></div>';

    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '-76px');
  });
});

describe('animateBannerExit branch-banner exit class', function() {
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
  });

  afterEach(function() {
    clock.restore();
    sinon.restore();
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
    document.body.removeAttribute('style');
    document.body.className = '';
  });

  it('adds branch-banner-exit to #branch-banner so any authored exit keyframes can play', function() {
    banner.contentWindow.document.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    var bannerRoot = banner.contentWindow.document.getElementById('branch-banner');
    assert.strictEqual(bannerRoot.className.indexOf('branch-banner-exit') !== -1, true);
  });

  it('does nothing when the creative has no #branch-banner', function() {
    assert.doesNotThrow(function() {
      journeys_utils.animateBannerExit(banner);
    });
  });

  it('waits for a longer content exit animation instead of cutting it off at the default timeout', function() {
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner.branch-banner-exit { --branch-exit: 1; animation: branch-slide-out-top 0.5s ease both; }';
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

  it('does not move the iframe itself when #branch-banner is handling its own exit animation', function() {
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner.branch-banner-exit { --branch-exit: 1; animation: branch-slide-out-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // #branch-banner-iframe has no transition of its own once the content handles this, so
    // moving it here would snap it off-screen instantly instead of letting the content's
    // animation actually play out.
    assert.strictEqual(banner.style.top, '');
  });

  it('does not move the iframe and removes at the default timeout when #branch-banner owns an exit with no animation', function() {
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    style.textContent = '#branch-banner.branch-banner-exit { --branch-exit: 1; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '');
    clock.tick(journeys_utils.animationSpeed + journeys_utils.animationDelay);
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('still moves the iframe itself when #branch-banner animates but never declared it handles its own exit', function() {
    var doc = banner.contentWindow.document;
    var style = doc.createElement('style');
    // an entrance animation is still applied to #branch-banner at dismiss time, and a creative
    // could author an unrelated one -- neither means the content is animating its own exit.
    style.textContent = '#branch-banner { animation: branch-slide-in-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '-76px');
  });

  it('still moves the iframe itself when there is no content exit animation to hide behind it', function() {
    banner.contentWindow.document.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '-76px');
  });

});