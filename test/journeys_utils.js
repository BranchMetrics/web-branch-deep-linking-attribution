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