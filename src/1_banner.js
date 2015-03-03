/**
 * This provides the markup, styles, and helper functions for all Banner UI Elements
 */

goog.provide('banner');
goog.require('utils');

// UI Animation transition speed in ms
var animationSpeed = 250;
// UIAnimation delay between juxtoposed elements
var animationDelay = 20;

var bannerHeight = '76px';

// All HTML, CSS, and funct resources for the banner
// ===========================================================================================
/*
 * Format:
 * {
 *		css: {
 *			banner: (string),
 *			desktop: (string),
 *          nonie: (string),
 *          ie: (string),
 *          mobile: (string),
 *			ios: (string),
 *			android: (string),
 *			iframe: (string),
 *          inneriframe: (string),
 *          iframe_desktop: (string),
 *          iframe_mobile: (string)
 *		},
 *		html: {
 *			banner: (function(options)),
 *			mobileAction: (function(options)),
 *			desktopAction: (string),
 *          appendiFrame: (function(banner)),
 *          checkmark: (string)
 *		},
 *		actions: {
 *			sendSMS: (function(options)),
 * 			close: (function()),
 *		},
 *      utils: {
 *          removeElement: (element),
 *          mobileUserAgent: function(element)),
 *          shouldAppend: (function(options)),
 *          branchBanner: (function()),
 *          branchDocument: (function()),
 *          branchiFrame: (function())
 *      }
 * }
 *
 */
var bannerResources = {
	css: {
		banner:
		'.branch-animation { -webkit-transition: all ' + (animationSpeed * 1.5 / 1000) + 's ease; transition: all 0' + (animationSpeed * 1.5 / 1000) + 's ease; }\n' +
		'#branch-banner { width: 100%;` z-index: 99999; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all ' + (animationSpeed / 1000) + 's ease; transition: all 0' + (animationSpeed / 1000) + 's ease; }\n' +
		'#branch-banner * { margin-right: 4px; position: relative; display: inline-block; line-height: 1.2em; vertical-align: top; }\n' +
		'#branch-banner-close { font-weight: 400; cursor: pointer; }\n' +
		'#branch-banner .content { width: 100%; overflow: hidden; height: ' + bannerHeight + '; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; padding: 6px; }\n' +
		'#branch-banner .icon img { width: 63px; height: 63px; }\n' +
		'#branch-banner .details { top: 16px; }\n' +
		'#branch-banner .details > * { display: block; }\n' +
		'#branch-banner .right > div { float: right; }\n' +
		'#branch-banner-action { top: 17px; }\n' +
		'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n',

		desktop:
		'#branch-banner { position: fixed; min-width: 600px; }\n' +
		'#branch-banner-close { color: #aaa; font-size: 20px; top: 18px; }\n' +
		'#branch-banner-close:hover { color: #000; }\n' +
		'#branch-banner .left, .right { width: 47%;  top: 0; }\n' +
		'#branch-banner .title { font-size: 14px; }\n' +
		'#branch-banner .description { font-size: 12px; font-weight: normal; }\n' +
		'#branch-sms-block * { vertical-align: bottom; font-size: 15px; }\n' +
		'#branch-sms-phone { font-weight: 400; border-radius: 4px; height: 30px; border: 1px solid #ccc; padding: 5px 7px 4px; width: 125px; font-size: 14px; }\n' +
		'#branch-sms-send { cursor: pointer; margin-top: 0px; font-size: 14px; display: inline-block; height: 30px; margin-left: 5px; font-weight: 400; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000; padding: 0px 12px; }\n' +
		'#branch-sms-send:hover { border: 1px solid #BABABA; background: #E0E0E0; }\n' +
		'#branch-sms-phone:focus, button:focus { outline: none; }\n' +
		'#branch-sms-phone.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n' +
		'#branch-banner .branch-icon-wrapper { width:25px; height: 25px; vertical-align: middle; position: absolute; margin-top: 3px; }\n' +
		'@keyframes branch-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n' +
		'@-webkit-keyframes branch-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n' +
		'#branch-spinner { -webkit-animation: branch-spinner 1s ease-in-out infinite; animation: branch-spinner 1s ease-in-out infinite; transition: all 0.7s ease-in-out; border:2px solid #ddd; border-bottom-color:#428bca; width:80%; height:80%; border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n',

		nonie:
		'#branch-banner .checkmark { stroke: #428bca; stroke-dashoffset: 745.74853515625; stroke-dasharray: 745.74853515625; -webkit-animation: dash 2s ease-out forwards; animation: dash 2s ease-out forwards; }\n' +
		'@-webkit-keyframes dash { 0% { stroke-dashoffset: 745.748535 15625; } 100% { stroke-dashoffset: 0; } }\n' +
		'@keyframes dash { 0% { stroke-dashoffset: 745.74853515625; } 100% { stroke-dashoffset: 0; } }\n',

		ie:
		'#branch-banner .checkmark { color: #428bca; font-size: 22px; }\n',

		mobile:
		'#branch-banner { position: absolute; }\n' +
		'#branch-banner .content .left { width: 60%; }\n' +
		'#branch-banner .content .right { width: 35%; height: 24px; }\n' +
		'#branch-banner .content .left .details .title { font-size: 12px; }\n' +
		'#branch-banner a { text-decoration: none; }\n' +
		'#branch-mobile-action { top: 6px; }\n' +
		'#branch-banner .content .left .details .description { font-size: 11px; font-weight: normal; }\n',

		ios:
		'#branch-banner a { color: #428bca; }\n',

		// Styles thanks to https://github.com/asianmack/play-store-smartbanner/blob/master/smartbanner.html
		android:
		'#branch-banner-close { text-align: center; font-size: 15px; border-radius:14px; border:0; width:17px; height:17px; line-height:14px; color:#b1b1b3; background:#efefef; }\n' +
		'#branch-mobile-action { text-decoration:none; border-bottom: 3px solid #b3c833; padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; font-weight: bold; background-color: #b3c833; border-radius: 5px; }\n' +
		'#branch-mobile-action:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n',

		iframe:
		'body { -webkit-transition: all ' + (animationSpeed * 1.5 / 1000) + 's ease; transition: all 0' + (animationSpeed * 1.5 / 1000) + 's ease; }\n' +
		'#branch-banner-iframe { box-shadow: 0 0 1px rgba(0,0,0,0.2); width: 100%; left: 0; right: 0; border: 0; height: ' + bannerHeight + '; z-index: 99999; -webkit-transition: all ' + (animationSpeed / 1000) + 's ease; transition: all 0' + (animationSpeed / 1000) + 's ease; }\n',

		inneriframe:
		'body { margin: 0; }\n',

		iframe_desktop:
		'#branch-banner-iframe { position: fixed; }\n',

		iframe_mobile:
		'#branch-banner-iframe { position: absolute; }\n'
	},

	html: {
		banner: function(options) {
			return '<div class="content">' +
				'<div class="left">' +
					'<div id="branch-banner-close" class="branch-animation">&times;</div>' +
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
		mobileAction: function(options) {
			var openButtonText = options['openAppButtonText'] || 'View in app';
			var downloadButtonText = options['downloadAppButtonText'] || 'Download App';
			return '<a id="branch-mobile-action" href="#" target="_parent">' + (utils.hasApp() ? openButtonText : downloadButtonText) + '</a>';
		},
		desktopAction:
			'<div id="branch-sms-block">' +
				'<form id="sms-form">' +
					'<input type="phone" class="branch-animation" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999">' +
					'<button type="submit" id="branch-sms-send" class="branch-animation" >Send Link</button>' +
				'</form>' +
			'</div>' +
			'<div class="branch-icon-wrapper" id="branch-loader-wrapper" style="opacity: 0;">' +
				'<div id="branch-spinner"></div>' +
			'</div>',
		appendiFrame: function(banner) {
			var iframe = document.createElement('iframe');
			var iframeHTML = '<html><head></head><body>' + banner.outerHTML + '</body></html>';
			iframe.src = 'about:blank'; // solves CORS issues, test in IE
			iframe.style.overflow = "hidden";
			iframe.scrolling = 'no';
			iframe.id = 'branch-banner-iframe';
			iframe.className = 'branch-animation';
			document.body.appendChild(iframe);
			bannerResources.utils.branchiFrame().contentWindow.document.open();
			bannerResources.utils.branchiFrame().contentWindow.document.write(iframeHTML);
			bannerResources.utils.branchiFrame().contentWindow.document.close();
		},
		checkmark: function() {
			if (window.ActiveXObject) {
				return '<span class="checkmark">&#x2713;</span>';
			}
			else {
				return '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve">' +
						'<path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4' +
						'C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/>' +
					'</svg>';
			}
		}
	},

	utils: {
		removeElement: function(element) {
			if (element) {
				element.parentNode.removeChild(element);
			}
		},
		mobileUserAgent: function() {
			return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i) ? (navigator.userAgent.match(/android/i) ? 'android' : 'ios') : false;
		},
		shouldAppend: function(options) {
			return (options.showDesktop && !bannerResources.utils.mobileUserAgent()) || (options.showMobile && bannerResources.utils.mobileUserAgent());
		},
		branchBanner: function() {
			return document.getElementById('branch-banner') || bannerResources.utils.branchiFrame().contentWindow.document.getElementById('branch-banner');
		},
		branchDocument: function() {
			return document.getElementById('branch-banner') ? document : bannerResources.utils.branchiFrame().contentWindow.document;
		},
		branchiFrame: function() {
			return document.getElementById("branch-banner-iframe");
		}
	},

	actions: {
		sendSMS: function(branch, options, linkData) {
			var phone = bannerResources.utils.branchDocument().getElementById('branch-sms-phone');
			var sendButton  = bannerResources.utils.branchDocument().getElementById('branch-sms-send');
			var branchLoader = bannerResources.utils.branchDocument().getElementById('branch-loader-wrapper');
			var smsFormContainer = bannerResources.utils.branchDocument().getElementById('branch-sms-form-container');
			var checkmark;

			var disableForm = function() {
				sendButton.setAttribute('disabled', '');
				phone.setAttribute('disabled', '');
				sendButton.style.opacity = '.4';
				phone.style.opacity = '.4';
				branchLoader.style.opacity = '1';
				phone.className = '';
			};

			var enableForm = function() {
				sendButton.removeAttribute('disabled');
				phone.removeAttribute('disabled');
				sendButton.style.opacity = '1';
				phone.style.opacity = '1';
				branchLoader.style.opacity = '0';
			};

			var hideFormShowSuccess = function() {
				checkmark = bannerResources.utils.branchDocument().createElement('div');
				checkmark.className = 'branch-icon-wrapper';
				checkmark.id = 'branch-checkmark';
				checkmark.style = 'opacity: 0;';
				checkmark.innerHTML = bannerResources.html.checkmark();
				sendButton.style.opacity = '0';
				phone.style.opacity = '0';
				branchLoader.style.opacity = '0';
				smsFormContainer.appendChild(checkmark);
				setTimeout(function() {
					checkmark.style.opacity = '1';
				}, animationDelay);
				phone.value = '';
			};

			var errorForm = function() {
				enableForm();
				sendButton.style.background = "#FFD4D4";
				phone.className = 'error';
				setTimeout(function() {
					sendButton.style.background = "#FFFFFF";
					phone.className = '';
				}, 2000);
			};

			if (phone) {
				var phone_val = phone.value;
				if ((/^\d{7,}$/).test(phone_val.replace(/[\s()+\-\.]|ext/gi, ''))) {
					disableForm();
					branch.sendSMS(phone_val, linkData, options, function(err) {
						if (err) {
							errorForm();
						}
						else {
							hideFormShowSuccess();
							setTimeout(function() {
								smsFormContainer.removeChild(checkmark);
								enableForm();
							}, 3000);
						}
					 });
				}
				else {
					errorForm();
				}
			}
		},
		close: function() {
			setTimeout(function() {
				bannerResources.utils.removeElement(bannerResources.utils.branchBanner());
				bannerResources.utils.removeElement(bannerResources.utils.branchiFrame());
				bannerResources.utils.removeElement(document.getElementById('branch-css'));
			}, animationSpeed + animationDelay);

			setTimeout(function() {
				document.body.style.marginTop = '0px';
			}, animationDelay);

			 /*jshint -W030 */
			bannerResources.utils.branchiFrame() ? bannerResources.utils.branchiFrame().style.top = '-' + bannerHeight : bannerResources.utils.branchBanner().style.top = '-' + bannerHeight;

			utils.storeKeyValue('hideBanner', true);
		}
	}
};

// Element constructors
// ===========================================================================================
/**
 * @param {Object} options
 */
banner.bannerMarkup = function(options) {
	if (bannerResources.utils.shouldAppend(options)) {
		// Consturct Banner Markup
		var banner = document.createElement('div');
		banner.id = 'branch-banner';
		banner.className = 'branch-animation';
		banner.innerHTML = bannerResources.html.banner(options);
		document.body.className = 'branch-animation';
		if (options.iframe) {
			bannerResources.html.appendiFrame(banner);
		}
		else {
			document.body.appendChild(banner);
		}
	}
};

/**
 * @param {Object} options
 */
banner.bannerStyles = function(options) {
	if (bannerResources.utils.shouldAppend(options)) {
		// Construct Banner CSS
		var css = document.createElement('style');
		css.type = 'text/css';
		css.id = 'branch-css';
		css.innerHTML = bannerResources.css.banner;

		// User agent specific styles
		var userAgent = bannerResources.utils.mobileUserAgent();
		if (userAgent == 'ios' && options.showMobile) {
			css.innerHTML += bannerResources.css.mobile + bannerResources.css.ios;
		}
		else if (userAgent == 'android' && options.showMobile) {
			css.innerHTML += bannerResources.css.mobile + bannerResources.css.android;
		}
		else if (options.showDesktop) {
			css.innerHTML += bannerResources.css.desktop;
			if (window.ActiveXObject) {
				css.innerHTML += bannerResources.css.ie;
			}
			else {
				css.innerHTML += bannerResources.css.nonie;
			}
		}

		if (options.iframe) {
			var iFrameCSS = document.createElement('style');
			css.type = 'text/css';
			css.id = 'branch-iframe-css';
			css.innerHTML += bannerResources.css.inneriframe;
			iFrameCSS.innerHTML = bannerResources.css.iframe + (bannerResources.utils.mobileUserAgent() ? bannerResources.css.iframe_mobile : bannerResources.css.iframe_desktop);
			document.head.appendChild(iFrameCSS);
			bannerResources.utils.branchiFrame().contentWindow.document.head.appendChild(css);
			bannerResources.utils.branchiFrame().style.top = '-' + bannerHeight;
		}
		else {
			document.head.appendChild(css);
			bannerResources.utils.branchBanner().style.top = '-' + bannerHeight;
		}
	}
};

// Element Activities
// ===========================================================================================
/**
 * @param {Object} branch
 * @param {Object} options
 * @param {Object} linkData
 */
banner.bannerActions = function(branch, options, linkData) {
	if (bannerResources.utils.shouldAppend(options)) {
		var action = document.createElement('div');
		action.id = 'branch-sms-form-container';

		// User agent specific markup
		if (bannerResources.utils.mobileUserAgent()) {
			linkData['channel'] = 'app banner';
			branch.link(linkData, function(err, url) {
				bannerResources.utils.branchDocument().getElementById('branch-mobile-action').href = url;
			});
			action.innerHTML = bannerResources.html.mobileAction(options);
		}
		else {
			action.innerHTML = bannerResources.html.desktopAction;
		}

		bannerResources.utils.branchDocument().getElementById('branch-banner-action').appendChild(action);
		var submitSMS = function(event) {
			event.preventDefault();
		    bannerResources.actions.sendSMS(branch, options, linkData);
		};
		bannerResources.utils.branchDocument().getElementById('sms-form').addEventListener('submit', submitSMS);
		bannerResources.utils.branchDocument().getElementById('branch-banner-close').onclick = bannerResources.actions.close;
	}
};

/**
 * @param {Object} options
 */
banner.triggerBannerAnimation = function(options) {
	if (bannerResources.utils.shouldAppend(options)) {
		document.body.style.marginTop = bannerHeight;
		setTimeout(function() {
			 /*jshint -W030 */
			bannerResources.utils.branchiFrame() ? bannerResources.utils.branchiFrame().style.top = '0' : bannerResources.utils.branchBanner().style.top = '0';
		}, animationDelay);
	}
};
