goog.provide('banner_utils');
goog.require('utils');
goog.require('Storage'); // jshint unused:false

/** @typedef {{icon:string, title:string, description:string, openAppButtonText:string, downloadAppButtonText:string, iframe:boolean, showiOS:boolean, showAndroid:boolean, showDesktop:boolean, forgetHide:boolean}} */
banner_utils.options; // jshint ignore:line

// UI Animation transition speed in ms.
banner_utils.animationSpeed = 250;
// UIAnimation delay between juxtaposed elements.
banner_utils.animationDelay = 20;
// Height of banner.
banner_utils.height = '76px';

/**
 * @param {DOMElement} element
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
 * @param {boolean} hidden
 * @param {BranchStorage} storage
 * @return {?utils.sessionData}
 */
banner_utils.shouldAppend = function(storage, options) {
	return !document.getElementById('branch-banner') &&
		!document.getElementById('branch-banner-iframe') &&
		(!utils.readKeyValue('hideBanner', storage) || options.forgetHide) &&
		(
			(options.showDesktop && !banner_utils.mobileUserAgent()) ||
			(options.showAndroid && banner_utils.mobileUserAgent() == 'android')
			(options.showiOS && banner_utils.mobileUserAgent() == 'ios')
		);
};
