/**
 * This provides the markup, styles, and helper functions for all Banner UI Elements
 */

goog.provide('banner');
goog.require('utils');

// UI Animation transition speed in ms
var animationSpeed = 250;
// UIAnimation delay between juxtoposed elements
var animationDelay = 20;

// All HTML, CSS, and funct resources for the banner
// ===========================================================================================
/*
 * Format:
 * {
 *		css: {
 *			banner: (string),
 *			iOS: (string),
 *			desktop: (string),
 *			android: (string)
 *		},
 *		html: {
 *			banner: {function(options)},
 *			desktopAction: {function(options)},
 *			mobileAction: {function(options)},
 *			linkSent: {function(phone)}
 *		},
 *		actions: {
 *			removeElement: {function(id)},
 *			sendSMS: {function(options)},
 * 			close: {function()},
 *			mobileUserAgent: {function()}
 *		}
 * }
 *
 */
var bannerResources = {
	css: {
		banner:
		'body { -webkit-transition: all ' + (animationSpeed * 1.5 / 1000) + 's ease; transition: all 0' + (animationSpeed * 1.5 / 1000) + 's ease; }' +
		'#branch-banner { top: -76px; width: 100%; z-index: 99999; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all ' + (animationSpeed / 1000) + 's ease; transition: all 0' + (animationSpeed / 1000) + 's ease; }' +
		'#branch-banner * { margin-right: 4px; display: inline-table; }' +
		'#branch-banner-close { font-weight: 400; cursor: pointer; }' +
		'#branch-banner .content { width: 100%; overflow: hidden; height: 76px; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; padding: 6px; }' +
		'#branch-banner .icon img { width: 60px; height: 60px; }' +
		'#branch-banner .details, .left, .right { vertical-align: middle; }' + 
		'#branch-banner .left, .right { width: 4%; }' +
		'#branch-banner .right > div { float: right; }' +
		'#branch-banner .content .left .details * { display: block;font-family: HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); }' +
		'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }',

		mboile: '#branch-banner { position: absolute; }' +
		'#branch-banner .content .left { width: 62%; float: left; }' +
		'#branch-banner .content .right { width: 35%; }' +
		'#branch-banner-action { margin-top: 20px; }' +
		'#branch-banner .content .left .details .title { font-size: 12px; }' +
		'#branch-banner .content .left .details .description { font-size: 11px; font-weight: normal; }',

		desktop: '#branch-banner { position: fixed; min-width: 550px; }' +
		'#branch-banner-close { color: #aaa; font-size: 20px; }' +
		'#branch-banner .content .left .details .title { font-size: 14px; }' +
		'#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; }' +
		'#branch-banner .content .right input { font-weight: 400; border-radius: 4px; height: 30px; border: 1px solid #ccc; padding: 5px 7px 4px; width: 125px; font-size: 14px; }' +
		'#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 30px;; float: right; margin-left: 5px; font-weight: 400; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000; padding: 0px 12px; }' +
		'#branch-banner .content .right button:hover { border: 1px solid #BABABA; background: #E0E0E0; }' +
		'#branch-banner .content .right input:focus, button:focus { outline: none; }' +
		'#branch-banner .content .right input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }' +
		'#branch-banner .content .right span { display: inline-block; font-weight: 600; margin: 7px 9px; font-size: 16px; }',

		// Styles thanks to https://github.com/asianmack/play-store-smartbanner/blob/master/smartbanner.html
		android:
		'#branch-banner-close { top: -20px; position: relative; text-align: center; font-size: 15px; border-radius:14px; border:0; width:17px; height:17px; line-height:14px; color:#b1b1b3; background:#efefef; }' +
		'#branch-mobile-action { text-decoration:none; border-bottom: 3px solid #b3c833; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; font-weight: bold; background-color: #b3c833; border-radius: 5px; }' +
		'#branch-mobile-action:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }'
	},

	html: {
		banner: function(options) {
			return '<div class="content">' +
				'<div class="left">' +
					'<div id="branch-banner-close">&times;</div>' +
					'<div class="icon">' +
						'<img src="' + options.icon + '">' +
					'</div>' +
					'<div class="details">' +
						'<span class="title">' + options.title + '</span>' +
						'<span class="description">' + options.description + '</span>' +
					'</div>' +
				'</div>' +
				'<div class="right" id="branch-banner-action">' +
				'</div>' +
			'</div>';
		},
		desktopAction: function() {
			return '<div id="branch-sms-block">' +
				'<input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999">' +
				'<button id="branch-sms-send">Send Link</button>' +
			'</div>';
		},
		mobileAction: function(options) {
			var openButtonText = options['openAppButtonText'] || 'View in app';
			var downloadButtonText = options['downloadAppButtonText'] || 'Download App';
			return '<a id="branch-mobile-action" href="#">' + (utils.hasApp() ? openButtonText : downloadButtonText) + '</a>';
		},
		linkSent: function(phone) {
			return '<span class="sms-sent">Link sent to ' + phone + '</span>';
		}
	},

	actions: {
		removeElement: function() {
			var foundElement = document.getElementById('branch-banner');
			if (foundElement) {
				foundElement.parentNode.removeChild(foundElement);
			}
		},
		sendSMS: function(branch, options, linkData) {
			var phone = document.getElementById('branch-sms-phone');
			if (phone) {
				var phone_val = phone.value;
				if ((/^\d{7,}$/).test(phone_val.replace(/[\s()+\-\.]|ext/gi, ''))) {
					branch.sendSMS(phone_val, linkData, options, function() {
						 document.getElementById('branch-sms-block').innerHTML = bannerResources.html.linkSent(phone_val);
					 });
				}
				else {
					phone.className = 'error';
				}
			}
		},
		close: function() {
			setTimeout(function() {
				bannerResources.actions.removeElement('branch-banner');
				bannerResources.actions.removeElement('branch-css');
			}, animationSpeed + animationDelay);

			setTimeout(function() {
				document.body.style.marginTop = '0px';
			}, animationDelay);

			document.getElementById('branch-banner').style.top = '-76px';

			utils.storeKeyValue('hideBanner', true);
		},
		mobileUserAgent: function() {
			return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i) ? (navigator.userAgent.match(/android/i) ? 'android' : 'ios') : false;
		},
		shouldAppend: function(options) {
			return (options.showDesktop && !bannerResources.actions.mobileUserAgent()) || (options.showMobile && bannerResources.actions.mobileUserAgent());
		}
	}
};

// Element constructors
// ===========================================================================================
/**
 * @param {Object} options
 */
banner.smartBannerMarkup = function(options) {
	if (bannerResources.actions.shouldAppend(options)) {
		// Consturct Banner Markup
		var banner = document.createElement('div');
		banner.id = 'branch-banner';
		banner.innerHTML = bannerResources.html.banner(options);
		document.body.appendChild(banner);
	}
};

banner.smartBannerStyles = function(options) {
	if (bannerResources.actions.shouldAppend(options)) {
		// Construct Banner CSS
		var css = document.createElement('style');
		css.type = 'text/css';
		css.id = 'branch-css';
		css.innerHTML = bannerResources.css.banner;

		// User agent specific styles
		var userAgent = bannerResources.actions.mobileUserAgent();
		if (userAgent == 'ios' && options.showMobile) {
			css.innerHTML += bannerResources.css.mboile;
		}
		else if (userAgent == 'android' && options.showMobile) {
			css.innerHTML += bannerResources.css.mboile + bannerResources.css.android;
		}
		else if (options.showDesktop) {
			css.innerHTML += bannerResources.css.desktop;
		}
		document.head.appendChild(css);
		document.getElementById('branch-banner').style.top = '-76px';
	}
};

// Element Activities
// ===========================================================================================
/**
 * @param {Object} branch
 * @param {Object} options
 * @param {Object|String} linkData
 * @param {Boolean} mobile
 * @param {Boolean} desktop
 */
banner.appendSmartBannerActions = function(branch, options, linkData) {
	if (bannerResources.actions.shouldAppend(options)) {
		var action = document.createElement('div');

		// User agent specific markup
		if (bannerResources.actions.mobileUserAgent()) {
			linkData['channel'] = 'app banner';
			branch.link(linkData, function(err, url) {
				document.getElementById('branch-mobile-action').href = url;
			});
			action.innerHTML = bannerResources.html.mobileAction(options);
		}
		else {
			action.innerHTML = bannerResources.html.desktopAction(options);
		}

		document.getElementById('branch-banner-action').appendChild(action);
		try {
			document.getElementById('branch-sms-send').addEventListener('click', function() {
			    bannerResources.actions.sendSMS(branch, options, linkData);
			});
		}
		catch (e) {}
		document.getElementById('branch-banner-close').onclick = bannerResources.actions.close;
	}
};

banner.triggerBannerAnimation = function(options) {
	if (bannerResources.actions.shouldAppend(options)) {
		document.body.style.marginTop = '71px';
		setTimeout(function() {
			document.getElementById('branch-banner').style.top = '0';
		}, animationDelay);
	}
};