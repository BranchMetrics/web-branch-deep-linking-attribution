/**
 * This provides the markup, styles, and helper functions for all UI elements
 */

goog.provide('elements');

// Element constructors
// ===========================================================================================
/**
 * @param {?Object} obj
 */
elements.smartBannerMarkup = function(obj) {
	// Consturct Banner Markup
	var banner = document.createElement('div');
	banner.id = 'branch-banner';
	banner.innerHTML = bannerHTML(obj);
	return banner;
};

elements.smartBannerStyles = function() {
	// Construct Banner CSS
	var css = document.createElement("style");
	css.type = "text/css";
	css.id = 'branch-css';
	css.innerHTML = bannerCSS;

	// User agent specific styles
	if (mobileUserAgent) {
		css.innerHTML += bannerMobileCSS;
	} else {
		css.innerHTML += bannerDesktopCSS;
	}

	return css;
};

// Element Activities
// ===========================================================================================
/**
 * @param {?Object} obj
 */
elements.appendSmartBannerActions = function(obj) {
	var action = document.createElement('div');

	// User agent specific markup
	if (mobileUserAgent()) {
		branch.link({
			channel: 'appBanner',
			data: obj.data || {}
		}, function(err, url) {
			document.getElementById('branch-mobile-action').href = url;
		});
		action.innerHTML = bannerMobileActionHTML;
	} else {
		action.innerHTML = bannerDesktopActionHTML;
		var onclickEvent = addEventListener("click", function(){
		    sendBannerSMS(obj);
		});
	};

	document.getElementById('branch-banner-action').appendChild(action);
	document.getElementById('branch-sms-send').onclick = onclickEvent;
	document.getElementById('branch-banner-close').onclick = closeBranchBanner;
};

// Helper functions
// ===========================================================================================
/**
 * @param {?String} id
 */
var removeElement = function(id) {
	var foundElement = document.getElementById('branch-banner');
	if (foundElement) {
		foundElement.parentNode.removeChild(foundElement);
	}
};

var sendBannerSMS = function(obj){
	var phone = document.getElementById('branch-sms-phone');
	if (phone) {
		var phone_val = phone.value;
		if (validatePhoneNumber(phone_val)) {
			branch.SMSLink({
				phone: phone_val,
				 data: obj.data || {}
			 }, function() {
				 document.getElementById('branch-sms-block').innerHTML = bannerLinkSentHTML(phone_val);
			 });
		} else {
			phone.className = 'error';
		}
	}
};

var closeBranchBanner = function() {
	removeElement('branch-banner');
	removeElement('branch-css');
	document.body.style.marginTop = '0px';
};

var mobileUserAgent = function() {
	return navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i);
};

var validatePhoneNumber = function(phone) {
	return (/^\d{7,}$/).test(phone.replace(/[\s()+\-\.]|ext/gi, ''));
}

// All HTML & CSS
// ===========================================================================================
/**
 * @param {?Object} obj
 */
var bannerHTML = function(obj)  {
	return '<div class="content">' +
			'<div class="left">' +
				'<div class="close-x" id="branch-banner-close">&times;</div>' +
				'<div class="icon" style="float: left;">' +
					'<img src="' + obj.icon + '">' +
				'</div>' +
				'<div class="details">' +
					'<span class="title">' + obj.title + '</span>' +
					'<span class="description">' + obj.description + '</span>' +
				'</div>' +
			'</div>' +
			'<div class="right" id="branch-banner-action">' +
			'</div>' +
		'</div>';
};

var bannerDesktopActionHTML =
	'<div id="branch-sms-block">' +
		'<input type="phone" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999">' +
		'<button id="branch-sms-send">TXT Me The App!</button>' +
	'</div>';

var bannerLinkSentHTML = function(phone) {
	return '<span class="sms-sent">App link sent to ' + phone + '!</span>';
}

var bannerMobileActionHTML =
	'<a id="branch-mobile-action" href="#">View in App</a>';

 var bannerCSS =
	'#branch-banner { position: absolute; top: 0px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all 0.3s ease; transition: all 0.3s ease; }' +
	'#branch-banner .close-x { float: left; font-weight: 400; color: #aaa; font-size: 20px; margin-top: 13px; margin-right: 6px; margin-left: 0; cursor: pointer; }' +
	'#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }' +
	'#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }' +
	'#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }' +
	'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }' +
	'#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; overflow:hidden; }' +
	'#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }' +
	'#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: inline-block; }' +
	'#branch-banner .content .right { width: 30%; display:inline-block; margin-top: 25px; }';

var bannerMobileCSS =
	'#branch-banner .content .right a { font-size: 16px; font-weight: 500; color: #007aff; }' +
	'#branch-banner-action div { float: right; margin-right: 8px; }';

var bannerDesktopCSS =
	'#branch-banner .content .right input { font-weight: 100; border-radius: 2px; border: 1px solid #bbb; padding: 5px 7px 4px; width: 125px; text-align: center; font-size: 12px; }' +
	'#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 28px; float: right; margin-left: 5px; font-family: Helvetica, Arial, sans-serif; font-weight: 400; border-radius: 2px; border: 1px solid #6EBADF; background: #6EBADF; color: white; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; padding: 0px 12px; }' +
	'#branch-banner .content .right button:hover { color: #6EBADF; background: white; }' +
	'#branch-banner .content .right input:focus, button:focus { outline: none; }' +
	//'#branch-banner .content .right input.error { color: red; border-color: red; }' +
	'#branch-banner .content .right span { display: inline-block; font-weight: 100; margin: 7px 9px; font-size: 12px; }';
