goog.provide('banner_utils');
goog.require('utils');
goog.require('storage'); // jshint unused:false

/** @typedef {{icon:string, title:string, description:string, openAppButtonText:string, downloadAppButtonText:string, sendLinkText:string, iframe:boolean, showiOS:boolean, showAndroid:boolean, showDesktop:boolean, forgetHide:boolean, disableHide:boolean, make_new_link:boolean}} */
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

banner_utils.getBodyStyle = function(style) {
	var body = document.getElementsByTagName('body')[0],
		bodyStyle = (body.currentStyle && body.currentStyle[utils.snakeToCamel(style)]) || window.getComputedStyle(body);
	return bodyStyle.getPropertyValue(style);
};

banner_utils.addCSSLengths = function(length1, length2) {
	return (banner_utils.convertToUnitlessPixels(length1) + banner_utils.convertToUnitlessPixels(length2)).toString() + 'px';
};

banner_utils.convertToUnitlessPixels = function(input) {
	if (!input) { return 0; }
	var unit = input.replace(/[0-9,\.]/g, '');
	var inputArray = input.match(/\d+/g);
	var value = parseInt(inputArray.length > 0 ? inputArray[0] : '0', 10);

	var vw = function() {
		var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		return viewportWidth / 100;
	};

	var vh = function() {
		var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		return viewportHeight / 100;
	};

	return {
		"px": function(value) {
			return value;
		},
		"em": function(value) {
			return value * parseFloat(window.getComputedStyle(document.body).fontSize);
		},
		"rem": function(value) {
			return value * parseFloat(window.getComputedStyle(document.documentElement).fontSize);
		},
		"vw": function(value) {
			return value * vw();
		},
		"vh": function(value) {
			return value * vh();
		},
		"vmin": function(value) {
			return value * Math.min(vh(), vw());
		},
		"vmax": function(value) {
			return value * Math.max(vh(), vw());
		},
		"%": function() {
			return (document.body.clientWidth / 100) * value;
		}
	}[unit](value);
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

	var forgetHide = options.forgetHide;
	if (typeof forgetHide == 'number') { forgetHide = false; }

	return !document.getElementById('branch-banner') &&
		!document.getElementById('branch-banner-iframe') &&
		(hideBanner || forgetHide) &&
		(
			(options.showDesktop && !banner_utils.mobileUserAgent()) ||
			(options.showAndroid && banner_utils.mobileUserAgent() == 'android') ||
			(options.showiOS && banner_utils.mobileUserAgent() == 'ios')
		);
};
