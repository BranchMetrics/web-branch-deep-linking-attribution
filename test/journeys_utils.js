'use strict';

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

describe('setJourneyLinkData', function() {
  const assert = testUtils.unplanned();

  it('should not throw and should null journey fields when linkData is an empty object', function() {
    assert.doesNotThrow(function() {
      journeys_utils.setJourneyLinkData({});
    }, 'empty journey_link_data must not throw');
    assert.strictEqual(journeys_utils.journeyType, null, 'journeyType null when empty');
    assert.strictEqual(journeys_utils.isDesktopJourney, false, 'isDesktopJourney false when empty');
    assert.strictEqual(journeys_utils.journeyVariant, null, 'journeyVariant null when empty');
  });

  it('should not throw when linkData is undefined', function() {
    assert.doesNotThrow(function() {
      journeys_utils.setJourneyLinkData(undefined);
    }, 'undefined journey_link_data must not throw');
    assert.strictEqual(journeys_utils.journeyType, null, 'journeyType null when undefined');
  });

  it('should read type and variant when linkData is populated', function() {
    journeys_utils.setJourneyLinkData({ 'type': 'desktop', 'variant': 'a' });
    assert.strictEqual(journeys_utils.journeyType, 'desktop', 'journeyType from populated data');
    assert.strictEqual(journeys_utils.isDesktopJourney, true, 'isDesktopJourney true for desktop type');
    assert.strictEqual(journeys_utils.journeyVariant, 'a', 'journeyVariant from populated data');
  });
});