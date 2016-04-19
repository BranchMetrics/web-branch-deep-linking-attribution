'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');

function renderHtmlBlob(parent, html) {
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



branch_view.handleBranchViewData = function(server, branchViewData) {
	if (branchViewData['html']) {
		return renderHtmlBlob(document.body, branchViewData['html']);
	} else if (branchViewData['url']) {
		server.XHRRequest(branchViewData['url'], {}, 'GET', {}, function(error, html){
			if (!error && html) {
				renderHtmlBlob(document.body, html);
			}
		}, true);
	}
};