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
	'#branch-banner * { margin-right: 4px; position: relative; line-height: 1.2em; }\n' +
	'#branch-banner-close { font-weight: 400; cursor: pointer; float: left; z-index: 2; }\n' +
	'#branch-banner .content { width:100%; overflow: hidden; height: ' +
		banner_utils.bannerHeight +
		'; background: rgba(255, 255, 255, 0.95); color: #333; ' +
		(options.position == 'top' ? 'border-bottom' : 'border-top') +
		': 1px solid #ddd; }\n' +
	'#branch-banner .icon { float: left; padding-bottom: 40px; }\n' +
	'#branch-banner .content .left { padding: 6px; }\n' +
	'#branch-banner .icon img { width: 63px; height: 63px; }\n' +
	'#branch-banner .vertically-align-middle { top: 50%; transform: translateY(-50%);' +
		' -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); }\n' +
	'#branch-banner .details > * { display: block; }\n' +
	'#branch-banner .content .left { height: 63px; }\n' +
	'#branch-banner .content .right { float: right; height: 63px; margin-bottom: 50px;' +
		' padding-top: 6px; z-index: 1; }\n' +
	'#branch-banner .right > div { float: left; padding-top: 3px; }\n' +
	'#branch-banner-action { top: 17px; }\n' +
	'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0;' +
		' top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }\n';
};

banner_css.desktop =
	'#branch-banner { position: fixed; min-width: 600px; }\n' +
	'#branch-banner-close { color: #aaa; font-size: 24px; top: 14px; }\n' +
	'#branch-banner-close:hover { color: #000; }\n' +
	'#branch-banner .title { font-size: 14px; }\n' +
	'#branch-banner .description { font-size: 12px; font-weight: normal; }\n' +
	'#branch-sms-block * { vertical-align: bottom; font-size: 15px; }\n' +
	'#branch-sms-block { display: inline-block; }\n' +
	'#branch-sms-phone { font-weight: 400; border-radius: 4px; height: 30px;' +
		' border: 1px solid #ccc; padding: 5px 7px 4px; width: 145px; font-size: 14px; }\n' +
	'#branch-sms-send { cursor: pointer; margin-top: 0px; font-size: 14px;' +
		' display: inline-block; height: 30px; margin-left: 5px; font-weight: 400;' +
		' border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000;' +
		' padding: 0px 12px; }\n' +
	'#branch-sms-send:hover { border: 1px solid #BABABA; background: #E0E0E0; }\n' +
	'#branch-sms-phone:focus, button:focus { outline: none; }\n' +
	'#branch-sms-phone.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }\n' +
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
		' border-radius:50%; -webkit-font-smoothing: antialiased !important; }\n';

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
	'#branch-banner-close { margin-top: 22px; }\n' +
	'#branch-banner .content .left .details .title { font-size: 12px; }\n' +
	'#branch-banner a { text-decoration: none; }\n' +
	'#branch-mobile-action { white-space: nowrap; }\n' +
	'#branch-banner .content .left .details .description { font-size: 11px;' +
		' font-weight: normal; }\n' +
	'@media only screen and (min-device-width: 320px) and (max-device-width: 350px) {' +
		' #branch-banner .content .right { max-width: 120px; } }\n' +
	'@media only screen and (min-device-width: 351px) and (max-device-width: 400px)' +
		' and (orientation: landscape) { #branch-banner .content .right { max-width: 150px; } }\n' +
	'@media only screen and (min-device-width: 401px) and (max-device-width: 480px)' +
		' and (orientation: landscape) { #branch-banner .content .right { max-width: 180px; } }\n';

banner_css.ios =
	'#branch-banner-close { margin-left: 4px; }\n' +
	'#branch-banner a { color: #428bca; }\n';

// Styles thanks to https://github.com/asianmack/play-store-smartbanner/blob/master/smartbanner.html
banner_css.android =
	'#branch-banner-close { height:17px; width: 17px; text-align: center; font-size: 15px;' +
		' border-radius:14px; border:0; line-height:14px; color:#b1b1b3; background:#efefef; }\n' +
	'#branch-mobile-action { top: 0; text-decoration:none; border-bottom: 3px solid #A4C639;' +
		' padding: 0 10px; height: 24px; line-height: 24px; text-align: center; color: #fff;' +
		' font-weight: bold; background-color: #A4C639; border-radius: 5px; }\n' +
	'#branch-mobile-action:hover { border-bottom:3px solid #8c9c29; background-color: #c1d739; }\n';

banner_css.iframe =
	'body { -webkit-transition: all ' +
		(banner_utils.animationSpeed * 1.5 / 1000) +
		's ease; transition: all 0' +
		(banner_utils.animationSpeed * 1.5 / 1000) +
		's ease; }\n' +
	'#branch-banner-iframe { box-shadow: 0 0 1px rgba(0,0,0,0.2); width: 1px; min-width:100%;' +
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
		(position == 'top' ? (sticky ? 'fixed' : 'absolute') : 'fixed') +
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
	if ((userAgent == 'ios' || userAgent == 'ipad') && options.showiOS) {
		style += banner_css.mobile + banner_css.ios;
	}
	else if (userAgent == 'android' && options.showAndroid) {
		style += banner_css.mobile + banner_css.android;
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
	if (options.position == 'top') {
		element.style.top = '-' + banner_utils.bannerHeight;
	}
	else if (options.position == 'bottom') {
		element.style.bottom = '-' + banner_utils.bannerHeight;
	}
};
