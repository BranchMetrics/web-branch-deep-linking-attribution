'use strict';
goog.provide('banner_css');

goog.require('banner_utils');
goog.require('utils');

banner_css.banner = function(options) {
	return '.branch-banner-is-active { -webkit-transition: all ' +
		(banner_utils.animationSpeed * 1.5 / 1000) +
		's ease; transition: all 0' +
		(banner_utils.animationSpeed * 1.5 / 1000) +
		's ease; }\n' +
	'#branch-banner { width:100%; z-index: 99999; font-family: Helvetica Neue, Sans-serif;' +
		' -webkit-font-smoothing: antialiased; -webkit-user-select: none;' +
		' -moz-user-select: none; user-select: none; -webkit-transition: all ' +
		(banner_utils.animationSpeed / 1000) +
		's ease; transition: all 0' +
		(banner_utils.animationSpeed / 1000) +
		's ease; }\n' +
	'#branch-banner .button{' +
		' border: 1px solid ' + (options['buttonBorderColor'] || (options['theme'] === 'dark' ? 'transparent' : '#ccc')) + ';' +
		' background: ' + (options['buttonBackgroundColor'] || '#fff') + ';' +
		' color: ' + (options['buttonFontColor'] || '#000') + ';' +
		' cursor: pointer; margin-top: 0px; font-size: 14px;' +
		' display: inline-block; margin-left: 5px; font-weight: 400; text-decoration: none; ' +
		' border-radius: 4px; padding: 6px 12px; transition: all .2s ease;' +
	'}\n' +
	'#branch-banner .button:hover { ' +
		' border: 1px solid ' + (options['buttonBorderColorHover'] || (options['theme'] === 'dark' ? 'transparent' : '#BABABA')) + ';' +
		' background: ' + (options['buttonBackgroundColorHover'] || '#E0E0E0') + ';' +
		' color: ' + (options['buttonFontColorHover'] || '#000') + ';' +
	'}\n' +
	'#branch-banner .button:focus { outline: none; }\n' +
	'#branch-banner * { margin-right: 4px; position: relative; line-height: 1.2em; }\n' +
	'#branch-banner-close { font-weight: 400; cursor: pointer; float: left; z-index: 2;' +
		'padding: 0 5px 0 5px; margin-right: 0; }\n' +
	'#branch-banner .content { width:100%; overflow: hidden; height: ' +
		banner_utils.bannerHeight +
		'; background: rgba(255, 255, 255, 0.95); color: #333; ' +
		(options.position === 'top' ? 'border-bottom' : 'border-top') +
		': 1px solid #ddd; }\n' +
	'#branch-banner-close { color: #000; font-size: 24px; top: 14px; opacity: .5;' +
		' transition: opacity .3s ease; }\n' +
	'#branch-banner-close:hover { opacity: 1; }\n' +
	'#branch-banner .title { font-size: 18px; font-weight:bold; color: #555; }\n' +
	'#branch-banner .description { font-size: 12px; font-weight: normal; color: #777; max-height: 30px; overflow: hidden; }\n' +
	'#branch-banner .icon { float: left; padding-bottom: 40px; margin-right: 10px; margin-left: 5px; }\n' +
	'#branch-banner .icon img { width: 63px; height: 63px; margin-right: 0; }\n' +
	'#branch-banner .reviews { font-size:13px; margin: 1px 0 3px 0; color: #777; }\n' +
	'#branch-banner .reviews .star { display:inline-block; position: relative; margin-right:0; }\n' +
	'#branch-banner .reviews .star span { display: inline-block; margin-right: 0; color: #555;' +
		' position: absolute; top: 0; left: 0; }\n' +
	'#branch-banner .reviews .review-count { font-size:10px; }\n' +
	'#branch-banner .reviews .star .half { width: 50%; overflow: hidden; display: block; }\n' +
	'#branch-banner .content .left { padding: 6px 5px 6px 5px; }\n' +
	'#branch-banner .vertically-align-middle { top: 50%; transform: translateY(-50%);' +
		' -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); }\n' +
	'#branch-banner .details > * { display: block; }\n' +
	'#branch-banner .content .left { height: 63px; }\n' +
	'#branch-banner .content .right { float: right; height: 63px; margin-bottom: 50px;' +
		' padding-top: 22px; z-index: 1; }\n' +
	'#branch-banner .right > div { float: left; }\n' +
	'#branch-banner-action { top: 17px; }\n' +
	'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0;' +
		' top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n' +
	'#branch-banner .theme-dark.content { background: rgba(51, 51, 51, 0.95); }\n' +
	'#branch-banner .theme-dark #branch-banner-close{ color: #fff; text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n' +
	'#branch-banner .theme-dark .details { text-shadow: 0 1px 1px rgba(0, 0, 0, .15); }\n' +
	'#branch-banner .theme-dark .title { color: #fff; }\n' +
	'#branch-banner .theme-dark .description { color: #fff; }\n' +
	'#branch-banner .theme-dark .reviews { color: #888; }\n' +
	'#branch-banner .theme-dark .reviews .star span{ color: #fff; }\n' +
	'#branch-banner .theme-dark .reviews .review-count{ color: #fff; }\n' +
	'';
};

banner_css.desktop =
	'#branch-banner { position: fixed; min-width: 600px; }\n' +
	'#branch-sms-block * { vertical-align: bottom; font-size: 15px; }\n' +
	'#branch-sms-block { display: inline-block; }\n' +
	'#branch-banner input{' +
		' border: 1px solid #ccc; ' +
		' font-weight: 400;  border-radius: 4px; height: 30px;' +
		' padding: 5px 7px 4px; width: 145px; font-size: 14px;' +
	'}\n' +
	'#branch-banner input:focus { outline: none; }\n' +
	'#branch-banner input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n' +
	'#branch-banner .branch-icon-wrapper { width:25px; height: 25px; vertical-align: middle;' +
		' display: inline-block; margin-top: -18px; }\n' +
	'@keyframes branch-spinner { 0% { transform: rotate(0deg);' +
		' -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); }' +
		' 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg);' +
		' -ms-transform: rotate(360deg); } }\n' +
	'@-webkit-keyframes branch-spinner { 0% { transform: rotate(0deg);' +
		' -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); }' +
		' 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg);' +
		' -ms-transform: rotate(360deg); } }\n' +
	'#branch-spinner { -webkit-animation: branch-spinner 1s ease-in-out infinite;' +
		' animation: branch-spinner 1s ease-in-out infinite; transition: all 0.7s ease-in-out;' +
		' border:2px solid #ddd; border-bottom-color:#428bca; width:80%; height:80%;' +
		' border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n' +
	'#branch-banner .theme-dark input { border-color: transparent; }\n' +
	'';

banner_css.nonie =
	'#branch-banner .checkmark { stroke: #428bca; stroke-dashoffset: 745.74853515625;' +
		' stroke-dasharray: 745.74853515625; -webkit-animation: dash 2s ease-out forwards;' +
		' animation: dash 2s ease-out forwards; }\n' +
	'@-webkit-keyframes dash { 0% { stroke-dashoffset: 745.748535 15625; }' +
		' 100% { stroke-dashoffset: 0; } }\n' +
	'@keyframes dash { 0% { stroke-dashoffset: 745.74853515625; }' +
		' 100% { stroke-dashoffset: 0; } }\n';

banner_css.ie = '#branch-banner .checkmark { color: #428bca; font-size: 22px; }\n';

banner_css.mobile =
	'#branch-banner { position: absolute; }\n' +
	'#branch-banner .content .left .details .title { font-size: 12px; }\n' +
	'#branch-mobile-action { white-space: nowrap; }\n' +
	'#branch-banner .content .left .details .description { font-size: 11px;' +
		' font-weight: normal; }\n' +
	'@media only screen and (min-device-width: 320px) and (max-device-width: 350px) {' +
		' #branch-banner .content .right { max-width: 120px; } }\n' +
	'@media only screen and (min-device-width: 351px) and (max-device-width: 400px)' +
		' and (orientation: landscape) { #branch-banner .content .right { max-width: 150px; } }\n' +
	'@media only screen and (min-device-width: 401px) and (max-device-width: 480px)' +
		' and (orientation: landscape) { #branch-banner .content .right { max-width: 180px; } }\n';

banner_css.ios = '';

// Styles thanks to https://github.com/asianmack/play-store-smartbanner/blob/master/smartbanner.html
banner_css.android =
	'#branch-banner #branch-banner-close,' +
	'#branch-banner .theme-dark #branch-banner-close { height:17px; width: 17px; text-align: center; font-size: 15px; top: 24px; ' +
		' border-radius:14px; border:0; line-height:14px; color:#b1b1b3; background:#efefef; padding: 0; opacity: 1; }\n' +
	'#branch-banner .button { top: 0; text-decoration:none; border-bottom: 3px solid #A4C639;' +
		' padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff; margin-top: 2px; ' +
		' font-weight: bold; background-color: #A4C639; border-radius: 5px; }\n' +
	'#branch-banner .button:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n';

banner_css.blackberry = '';

banner_css.windows_phone = '';

banner_css.kindle = '';

banner_css.iframe =
	'body { -webkit-transition: all ' +
		(banner_utils.animationSpeed * 1.5 / 1000) +
		's ease; transition: all 0' +
		(banner_utils.animationSpeed * 1.5 / 1000) +
		's ease; }\n' +
	'#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%;' +
		' left: 0; right: 0; border: 0; height: ' +
		banner_utils.bannerHeight +
		'; z-index: 99999; -webkit-transition: all ' +
		(banner_utils.animationSpeed / 1000) +
		's ease; transition: all 0' +
		(banner_utils.animationSpeed / 1000) +
		's ease; }\n';

banner_css.inneriframe = 'body { margin: 0; }\n';

banner_css.iframe_position = function(sticky, position) {
	return '#branch-banner-iframe { position: ' +
		((position === 'top' && !sticky) ? 'absolute' : 'fixed') +
		'; }\n';
};

/**
 * @param {banner_utils.options} options
 * @param {Object} element
 */
banner_css.css = function(options, element) {
	// Construct Banner CSS
	var style = banner_css.banner(options);

	// User agent specific styles
	var userAgent = utils.mobileUserAgent();
	if ((userAgent === 'ios' || userAgent === 'ipad') && options.showiOS) {
		style += banner_css.mobile + banner_css.ios;
	}
	else if (userAgent === 'android' && options.showAndroid) {
		style += banner_css.mobile + banner_css.android;
	}
	else if (userAgent === 'blackberry' && options.showBlackberry) {
		style += banner_css.mobile + banner_css.blackberry;
	}
	else if (userAgent === 'windows_phone' && options.showWindowsPhone) {
		style += banner_css.mobile + banner_css.windows_phone;
	}
	else if (userAgent === 'kindle' && options.showKindle) {
		style += banner_css.mobile + banner_css.kindle;
	}
	else {
		style += banner_css.desktop;
		if (window.ActiveXObject) {
			style += banner_css.ie;
		}
		else {
			style += banner_css.nonie;
		}
	}
	style += options.customCSS;

	if (options.iframe) {
		style += banner_css.inneriframe;

		var iFrameCSS = document.createElement('style');
		iFrameCSS.type = 'text/css';
		iFrameCSS.id = 'branch-iframe-css';
		iFrameCSS.innerHTML = banner_css.iframe +
			(utils.mobileUserAgent() ?
				banner_css.iframe_position(options.mobileSticky, options.position) :
				banner_css.iframe_position(options.desktopSticky, options.position));
		document.head.appendChild(iFrameCSS);
	}

	var css = document.createElement('style');
	css.type = 'text/css';
	css.id = 'branch-css';
	css.innerHTML = style;

	var doc = (options.iframe ? element.contentWindow.document : document);
	doc.head.appendChild(css);
	if (options.position === 'top') {
		element.style.top = '-' + banner_utils.bannerHeight;
	}
	else if (options.position === 'bottom') {
		element.style.bottom = '-' + banner_utils.bannerHeight;
	}
};
