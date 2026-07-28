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

describe('addIframeOuterCSS with a BE-supplied cssIframeContainer', function() {
  const assert = testUtils.unplanned();

  afterEach(function() {
    sinon.restore();
    document.body.removeAttribute('style');
    var iframeCss = document.getElementById('branch-iframe-css');
    if (iframeCss) {
      iframeCss.parentNode.removeChild(iframeCss);
    }
  });

  it('should copy non-margin declarations from the BE body rule inline', function() {
    const cssIframeContainer = 'body { transition: all 0.375s ease; background: black; } #branch-banner-iframe { height: 76px; }';
    journeys_utils.addIframeOuterCSS(cssIframeContainer, {});
    assert.strictEqual(document.body.style.background, 'black', 'background copied from BE body rule');
    assert.ok(document.body.style.transition.indexOf('0.375s') !== -1, 'transition copied from BE body rule');
  });

  // jsdom's CSSOM implementation doesn't accept calc() as a valid margin value (real
  // browsers do), so these spy on the setter to verify the value we attempt to set
  // rather than reading the (jsdom-rejected) value back off document.body.style
  it('should try to combine the BE margin-top with any pre-existing body margin-top using calc()', function() {
    document.body.style.marginTop = '20px';
    const marginTopSpy = sinon.spy(Object.getPrototypeOf(document.body.style), 'marginTop', ['set']);
    const cssIframeContainer = 'body { margin-top: 75px; }';
    journeys_utils.addIframeOuterCSS(cssIframeContainer, {});
    assert.ok(marginTopSpy.set.calledWith('calc(75px + 20px)'), 'margin-top set to calc(BE value + pre-existing margin)');
  });

  it('should try to combine the BE margin-bottom with any pre-existing body margin-bottom using calc()', function() {
    document.body.style.marginBottom = '10px';
    const marginBottomSpy = sinon.spy(Object.getPrototypeOf(document.body.style), 'marginBottom', ['set']);
    const cssIframeContainer = 'body { margin-bottom: 50px; }';
    journeys_utils.addIframeOuterCSS(cssIframeContainer, {});
    assert.ok(marginBottomSpy.set.calledWith('calc(50px + 10px)'), 'margin-bottom set to calc(BE value + pre-existing margin)');
  });

  it('should not set body margin when the BE CSS has no body rule', function() {
    const cssIframeContainer = '#branch-banner-iframe { height: 76px; }';
    journeys_utils.addIframeOuterCSS(cssIframeContainer, {});
    assert.strictEqual(document.body.style.marginTop, '', 'no margin-top set when BE CSS has no body rule');
    assert.strictEqual(document.body.style.marginBottom, '', 'no margin-bottom set when BE CSS has no body rule');
  });

  it('should not leave the temporary stylesheet used to parse the BE CSS in the document', function() {
    const cssIframeContainer = 'body { margin-top: 75px; }';
    journeys_utils.addIframeOuterCSS(cssIframeContainer, {});
    assert.strictEqual(document.head.querySelectorAll('style').length, 1, 'only the persistent #branch-iframe-css style element remains');
  });
});