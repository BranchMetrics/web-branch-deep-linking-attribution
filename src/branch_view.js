'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');

branch_view.handleBranchViewData = function(branchViewData) {
	var iframe = document.createElement('iframe');
	iframe.src = 'about:blank'; // solves CORS issues, test in IE
	iframe.style.overflow = 'hidden';
	iframe.scrolling = 'no';
	iframe.id = 'branch-banner-iframe';
	iframe.className = 'branch-animation';
	document.body.appendChild(iframe);

	var bodyClass;
	var userAgent = utils.mobileUserAgent();
	if (userAgent === 'ios' || userAgent === 'ipad') {
		bodyClass = 'branch-banner-ios';
	}
	else if (userAgent === 'android') {
		bodyClass = 'branch-banner-android';
	}
	else {
		bodyClass = 'branch-banner-desktop';
	}


	var iframeHTML = branchViewData['html'];

	iframe.contentWindow.document.open();
	iframe.contentWindow.document.write(iframeHTML);
	iframe.contentWindow.document.close();

	banner_utils.addClass(document.body, 'branch-banner-is-active');
	document.body.style.marginTop = '76px';

	banner_css.css({
		"icon": "http://icons.iconarchive.com/icons/wineass/ios7-redesign/512/Appstore-icon.png",
		"title": "Demo App",
		"description": "Branch Demo app!",
		"reviewCount": 1000,
		"rating": 5,
		"openAppButtonText": "Open",
		"downloadAppButtonText": "Download",
		"sendLinkText": "Send Link",
		"phonePreviewText": "(999) 999-9999",
		"iframe": true,
		"showiOS": true,
		"showiPad": true,
		"showAndroid": true,
		"showBlackberry": true,
		"showWindowsPhone": true,
		"showKindle": true,
		"showDesktop": true,
		"disableHide": false,
		"forgetHide": false,
		"position": "top",
		"customCSS": "",
		"mobileSticky": false,
		"desktopSticky": true,
		"theme": "light",
		"buttonBorderColor": "",
		"buttonBackgroundColor": "",
		"buttonFontColor": "",
		"buttonBorderColorHover": "",
		"buttonBackgroundColorHover": "",
		"buttonFontColorHover": "",
		"make_new_link": false,
		"open_app": false
	}, iframe);

	setTimeout(function() {
			iframe.style.top = '0';
	}, 100);

	return iframe;
};