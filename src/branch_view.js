'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');

// var TIMEOUT = 5000;
// var jsonp_callback_index = 0;

function renderHtmlBlob(parent, html) {
	var re = /<script type="text\/javascript">((.|\s)*)<\/script>/;
	var match = html.match(re);
	if(match) {
		var src = match[1];
		// src = src.replace(/\n/g,' ');
		html.replace(re,'');
		var script = document.createElement('script');
		script.innerHTML = src;
		document.body.appendChild(script);
	}


	parent = parent || document.body;
	var banner = document.createElement('div');
	banner.id = 'branch-banner-container';
	banner.className = 'branch-animation';
	banner.innerHTML = html;
	parent.insertBefore(banner, parent.firstChild);

	// var bodyClass;
	// var userAgent = utils.mobileUserAgent();
	// if (userAgent === 'ios' || userAgent === 'ipad') {
	// 	bodyClass = 'branch-banner-ios';
	// }
	// else if (userAgent === 'android') {
	// 	bodyClass = 'branch-banner-android';
	// }
	// else {
	// 	bodyClass = 'branch-banner-desktop';
	// }


	// var iframeHTML = 

	// iframe.contentWindow.document.open();
	// iframe.contentWindow.document.write(iframeHTML);
	// iframe.contentWindow.document.close();

	banner_utils.addClass(banner, 'branch-banner-is-active');
	banner.marginTop = '76px';

	// banner_css.css({
	// 	"icon": "http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png",
	// 	"title": "Demo App",
	// 	"description": "Branch Demo app!",
	// 	"reviewCount": 1000,
	// 	"rating": 5,
	// 	"openAppButtonText": "Open",
	// 	"downloadAppButtonText": "Download",
	// 	"sendLinkText": "Send Link",
	// 	"phonePreviewText": "(999) 999-9999",
	// 	"iframe": false,
	// 	"showiOS": true,
	// 	"showiPad": true,
	// 	"showAndroid": true,
	// 	"showBlackberry": true,
	// 	"showWindowsPhone": true,
	// 	"showKindle": true,
	// 	"showDesktop": true,
	// 	"disableHide": false,
	// 	"forgetHide": false,
	// 	"position": "top",
	// 	"customCSS": "",
	// 	"mobileSticky": false,
	// 	"desktopSticky": true,
	// 	"theme": "light",
	// 	"buttonBorderColor": "",
	// 	"buttonBackgroundColor": "",
	// 	"buttonFontColor": "",
	// 	"buttonBorderColorHover": "",
	// 	"buttonBackgroundColorHover": "",
	// 	"buttonFontColorHover": "",
	// 	"make_new_link": false,
	// 	"open_app": false
	// }, banner);

	setTimeout(function() {
			banner.style.top = '0';
	}, 100);

	return banner;
};


/**
 * @param {string} requestURL
 * @param {Object} requestData
 * @param {utils._httpMethod} requestMethod
 * @param {function(?Error,*=,?=)=} callback
 */
branch_view.handleBranchViewData = function(server, branchViewData, requestData) {
	requestData = requestData || {};
	requestData['channel'] = requestData['channel'] || 'branch view';

	var cleanedData = utils.cleanLinkData(requestData);
	cleanedData['open_app'] = true;

	if (document.getElementById('branch-banner-container')) {
		return;
	}
	if (branchViewData['html']) {
		return renderHtmlBlob(document.body, branchViewData['html']);
	} else if (branchViewData['url']) {
		var banner = null;
		var cta = null;

		function destroyBanner() {
			banner.parentElement.removeChild(banner);
		}

		function finalHookups(cta, banner) {
			if(!cta || !banner) {
				return;
			}
			var actionEls = banner.querySelectorAll('#branch-mobile-action');
			Array.prototype.forEach.call(actionEls, function(el) {
				el.addEventListener('click', function(e) {
					cta();
					destroyBanner();
				})
			})
			var cancelEls = banner.querySelectorAll('.branch-banner-continue');
			Array.prototype.forEach.call(cancelEls, function(el) {
				el.addEventListener('click', function(e) {
					destroyBanner();
				})
			})
			var cancelEls = banner.querySelectorAll('.branch-banner-close');
			Array.prototype.forEach.call(cancelEls, function(el) {
				el.addEventListener('click', function(e) {
					destroyBanner();
				})
			})
		}

		var callbackString = 'branch_view_callback__' + (jsonp_callback_index++);
		var postData = encodeURIComponent(utils.base64encode(goog.json.serialize(cleanedData)));
		var url = branchViewData['url'] + '&callback=' + callbackString;
		url += '&post_data=' + postData;
		server.XHRRequest(url, {}, 'GET', {}, function(error, html){
			if (!error && html) {

				var timeoutTrigger = window.setTimeout(
					function() {
						window[callbackString] = function() { };
					},
					TIMEOUT
				);

				window[callbackString] = function(data) {
					window.clearTimeout(timeoutTrigger);
					cta = data;
					finalHookups(cta,banner);
				};


				banner = renderHtmlBlob(document.body, html);
				finalHookups(cta,banner);
			}
		}, true);
	}
};