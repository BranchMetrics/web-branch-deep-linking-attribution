goog.provide('banner_utils');
goog.require('utils');
goog.require('storage'); // jshint unused:false

/** @typedef {{icon:string, title:string, description:string, openAppButtonText:string, downloadAppButtonText:string, sendLinkText:string, iframe:boolean, showiOS:boolean, showAndroid:boolean, showDesktop:boolean, showAgain:boolean, disableHide:boolean, make_new_link:boolean}} */
banner_utils.options; // jshint ignore:line

// UI Animation transition speed in ms.
/** @type {number} */
banner_utils.animationSpeed = 250;

// UIAnimation delay between juxtaposed elements.
/** @type {number} */
banner_utils.animationDelay = 20;

// Height of banner.
/** @type {string} */
banner_utils.bannerHeight = '76px';

// How long to show red error state
/** @type {number} */
banner_utils.error_timeout = 2000;

// How long to show success state before reloading SMS form
/** @type {number} */
banner_utils.success_timeout = 3000;

/**
 * @param {Object} element
 */
banner_utils.removeElement = function(element) {
	if (element) {
		element.parentNode.removeChild(element);
	}
};

banner_utils.mobileUserAgent = function() {
	return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i) ? (navigator.userAgent.match(/android/i) ? 'android' : 'ios') : false;
};

banner_utils.getDate = function(days) {
	var currentDate = new Date();
	return currentDate.setDate(currentDate.getDate() + days);
};

/**
 * @param {BranchStorage} storage
 * @param {banner_utils.options} options
 * @return {boolean}
 */
banner_utils.shouldAppend = function(storage, options) {
	var hideBanner = utils.readKeyValue('hideBanner', storage);
	if (typeof hideBanner == 'number') {
		hideBanner = new Date() >= new Date(hideBanner);
	}
	else { hideBanner = !hideBanner; }

	var showAgain = options.showAgain;
	if (typeof showAgain == 'number') { showAgain = false; }

	return !document.getElementById('branch-banner') &&
		!document.getElementById('branch-banner-iframe') &&
		(hideBanner || showAgain) &&
		(
			(options.showDesktop && !banner_utils.mobileUserAgent()) ||
			(options.showAndroid && banner_utils.mobileUserAgent() == 'android') ||
			(options.showiOS && banner_utils.mobileUserAgent() == 'ios')
		);
};
