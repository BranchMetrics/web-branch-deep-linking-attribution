'use strict';

goog.provide('banner_utils');

goog.require('storage'); // jshint unused:false
goog.require('utils');
goog.require('safejson');

/** @typedef {{icon:string,
 * title:string,
 * buttonBackgroundColor:string,
 * buttonBackgroundColorHover:string,
 * buttonBorderColor:string,
 * buttonBorderColorHover:string,
 * buttonFontColor:string,
 * buttonFontColorHover:string,
 * description:string,
 * openAppButtonText:string,
 * downloadAppButtonText:string,
 * sendLinkText:string,
 * iframe:boolean,
 * showiOS:boolean,
 * showiPad:boolean,
 * showAndroid:boolean,
 * showBlackberry:boolean,
 * showWindowsPhone:boolean,
 * showKindle:boolean,
 * showDesktop:boolean,
 * forgetHide:boolean,
 * disableHide:boolean,
 * make_new_link:boolean,
 * customCSS:string,
 * mobileSticky:boolean,
 * desktopSticky:boolean,
 * position:string,
 * rating:number,
 * reviewCount:number,
 * open_app:boolean,
 * append_deeplink_path:boolean}} */
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


banner_utils.hasClass = function(element, className) {
	return !!element.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
};

banner_utils.addClass = function(element, className) {
	if (!element) {
		return;
	}
	if (!banner_utils.hasClass(element, className)) {
		element.className += ' ' + className;
	}
};

banner_utils.removeClass = function(element, className) {
	if (!element) {
		return;
	}
	if (banner_utils.hasClass(element, className)) {
		var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
		element.className = element.className.replace(reg, ' ');
	}
};

banner_utils.getDate = function(days) {
	var currentDate = new Date();
	return currentDate.setDate(currentDate.getDate() + days);
};

banner_utils.getBodyStyle = function(style) {
	if (document.body.currentStyle) {
		return document.body.currentStyle[utils.snakeToCamel(style)];
	}
	else {
		return window.getComputedStyle(document.body).getPropertyValue(style);
	}
};

banner_utils.addCSSLengths = function(length1, length2) {
	var convertToUnitlessPixels = function(input) {
		if (!input) {
			return 0;
		}
		var unit = input.replace(/[0-9,\.]/g, '');
		var inputArray = input.match(/\d+/g);
		var value = parseInt(inputArray.length > 0 ? inputArray[0] : '0', 10);
		var vw = function() {
			return Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / 100;
		};
		var vh = function() {
			return Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / 100;
		};
		return parseInt(
			{
				"px": function(value) {
					return value;
				},
				"em": function(value) {
					if (document.body.currentStyle) {
						return value * convertToUnitlessPixels(document.body.currentStyle.fontSize);
					}
					else {
						return value * parseFloat(window.getComputedStyle(document.body).fontSize);
					}
				},
				"rem": function(value) {
					if (document.documentElement.currentStyle) {
						return value *
							convertToUnitlessPixels(document.documentElement.currentStyle.fontSize);
					}
					else {
						return value *
							parseFloat(window.getComputedStyle(document.documentElement).fontSize);
					}
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
			}[unit](value),
			10
		);
	};
	return (convertToUnitlessPixels(length1) + convertToUnitlessPixels(length2)).toString() + 'px';
};

/**
 * @param {storage} storage
 * @param {banner_utils.options} options
 * @return {boolean}
 */
banner_utils.shouldAppend = function(storage, options) {
	var hideBanner = storage.get('hideBanner', true);

	if (options.respectDNT && navigator && !!Number(navigator['doNotTrack'])) {
		return false;
	}
	try {
		if (typeof hideBanner === 'string') {
			hideBanner = safejson.parse(hideBanner);
		}
	}
	catch (e) {
		hideBanner = false;
	}
	if (typeof hideBanner === 'number') {
		hideBanner = new Date() >= new Date(hideBanner);
	}
	else {
		hideBanner = !hideBanner;
	}

	var forgetHide = options.forgetHide;
	if (typeof forgetHide === 'number') {
		forgetHide = false;
	}

	return !document.getElementById('branch-banner') &&
		!document.getElementById('branch-banner-iframe') &&
		(hideBanner || forgetHide) &&
		(
			(options.showDesktop && !utils.mobileUserAgent()) ||
			(options.showAndroid && utils.mobileUserAgent() === 'android') ||
			(options.showiPad && utils.mobileUserAgent() === 'ipad') ||
			(options.showiOS && utils.mobileUserAgent() === 'ios') ||
			(options.showBlackberry && utils.mobileUserAgent() === 'blackberry') ||
			(options.showWindowsPhone && utils.mobileUserAgent() === 'windows_phone') ||
			(options.showKindle && utils.mobileUserAgent() === 'kindle')
		);
};
