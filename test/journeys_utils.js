'use strict';

goog.require('journeys_utils');

describe('getRelativeHeightValueOrFalseFromBannerHeight', function () {
	const assert = testUtils.unplanned();
	it('should return false when bannerHeight is in pixel values', function () {
		const bannerHeight = '350px';
		const expected = false;
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, 'false when bannerHeight is pixels');
	});

	it('should return the height value when bannerHeight is provided with viewHeight units - 100vh', function () {
		const bannerHeight = '100vh';
		const expected = '100';
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '100 from bannerHeight of 100vh');
	});

	it('should return the height value when bannerHeight is provided with viewHeight units - 99vh', function () {
		const bannerHeight = '99vh';
		const expected = '99';
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '99 from bannerHeight of 99vh');
	});

	it('should return the height value when bannerHeight is provided with viewHeight units - 5vh', function () {
		const bannerHeight = '5vh';
		const expected = '5';
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '5 from bannerHeight of 5vh');
	});

	it('should return the height value when bannerHeight is provided with percentage units - 100%', function () {
		const bannerHeight = '100%';
		const expected = '100';
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '100 from bannerHeight of 100%');
	});

	it('should return the height value when bannerHeight is provided with percentage units - 99%', function () {
		const bannerHeight = '99%';
		const expected = '99';
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '99 from bannerHeight of 99%');
	});

	it('should return the height value when bannerHeight is provided with percentage units - 5%', function () {
		const bannerHeight = '5%';
		const expected = '5';
		assert.strictEqual(journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(bannerHeight), expected, '5 from bannerHeight of 5%');
	});
});
