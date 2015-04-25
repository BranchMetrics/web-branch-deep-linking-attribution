goog.provide('banner_utils');
goog.require('utils');
goog.require('storage'); // jshint unused:false

/** @typedef {{icon:string, title:string, description:string, openAppButtonText:string, downloadAppButtonText:string, iframe:boolean, showiOS:boolean, showAndroid:boolean, showDesktop:boolean, forgetHide:boolean, disableHide:boolean, make_new_link:boolean}} */
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

/**
 * @param {BranchStorage} storage
 * @param {banner_utils.options} options
 * @return {boolean}
 */
banner_utils.shouldAppend = function(storage, options) {
	return !document.getElementById('branch-banner') &&
		!document.getElementById('branch-banner-iframe') &&
		(!utils.readKeyValue('hideBanner', storage) || options.forgetHide) &&
		(
			(options.showDesktop && !banner_utils.mobileUserAgent()) ||
			(options.showAndroid && banner_utils.mobileUserAgent() == 'android') ||
			(options.showiOS && banner_utils.mobileUserAgent() == 'ios')
		);
};
