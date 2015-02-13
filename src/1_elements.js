/**
 * This provides the markup, styles, and helper functions for all UI elements
 */

goog.provide('elements');

// UI Animation transition speed in ms
var animationSpeed = 250;
// UIAnimation delay between juxtoposed elements
var animationDelay = 20;

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
	if (mobileUserAgent) {
		branch.link({
			channel: 'appBanner',
			data: obj.data || {}
		}, function(err, url) {
			document.getElementById('branch-mobile-action').href = url;
		});
		action.innerHTML = bannerMobileActionHTML;
	} else {
		action.innerHTML = bannerDesktopActionHTML;
	};

	document.getElementById('branch-banner-action').appendChild(action);
	(document.getElementById('branch-sms-send') || {onclick:''}).addEventListener("click", function(){
		    sendBannerSMS(obj);
		});
	document.getElementById('branch-banner-close').onclick = closeBranchBanner;
};

elements.triggerBannerAnimation = function() {
	document.body.style.marginTop = '71px';
	setTimeout(function(){ 
		document.getElementById('branch-banner').style.top = '0';
	}, animationDelay);
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
	setTimeout(function(){ 
		removeElement('branch-banner');
		removeElement('branch-css');
	}, animationSpeed + animationDelay);

	setTimeout(function(){ 
		document.body.style.marginTop = '0px';
	}, animationDelay);
	
	document.getElementById('branch-banner').style.top = '-76px';
};

var mobileUserAgent = navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i);

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
		'<button id="branch-sms-send">Send Link</button>' +
	'</div>';

var bannerLinkSentHTML = function(phone) {
	return '<span class="sms-sent">App link sent to ' + phone + '!</span>';
}

var bannerMobileActionHTML =
	'<a id="branch-mobile-action" href="#">View in App</a>';

 var bannerCSS =
 	'body { -webkit-transition: all ' + (animationSpeed * 1.5)/1000 + 's ease; transition: all 0' + (animationSpeed * 1.5)/1000 + 's ease; }' +
	'#branch-banner { top: -76px; width: 100%; font-family: Helvetica Neue, Sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; -webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-transition: all ' + animationSpeed/1000 + 's ease; transition: all 0' + animationSpeed/1000 + 's ease; }' +
	'#branch-banner .close-x { float: left; font-weight: 400; color: #aaa; font-size: 20px; margin-top: 13px; margin-right: 6px; margin-left: 0; cursor: pointer; }' +
	'#branch-banner .content { position: absolute; width: 100%; height: 76px; z-index: 99999; background: rgba(255, 255, 255, 0.95); color: #333; border-bottom: 1px solid #ddd; }' +
	'#branch-banner .content .left { width: 70%; float: left; padding: 8px 8px 8px 8px; }' +
	'#branch-banner .content .left .icon img { width: 60px; height: 60px; margin-right: 6px; }' +
	'#branch-banner .content .right a { font-size: 16px; font-weight: 500; color: #007aff; }' +
	'#branch-banner-action div { float: right; margin-right: 8px; }' +
	'#branch-banner .content:after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 1px; background: rgba(0, 0, 0, 0.2); }' +
	'#branch-banner .content .left .details { margin-top: 3px; padding-left: 4px; }' +
	'#branch-banner .content .left .details .title { font: 14px/1.5em HelveticaNeue-Medium, Helvetica Neue Medium, Helvetica Neue, Sans-serif; color: rgba(0, 0, 0, 0.9); display: inline-block; }' +
	'#branch-banner .content .left .details .description { font-size: 12px; font-weight: normal; line-height: 1.5em; color: rgba(0, 0, 0, 0.5); display: block; }' +
	'#branch-banner .content .right { display:inline-block; position: relative; top: 50%; transform: translateY(-50%); }';

var bannerMobileCSS =
	'#branch-banner .content .left { width: 70% }' +
	'#branch-banner .content .right { width: 30% }' +
	'#branch-banner { position: absolute; }';
	

var bannerDesktopCSS =
	'#branch-banner .content .left { width: 50% }' +
	'#branch-banner .content .right { width: 50% }' +
	'#branch-banner { position: fixed; }' +
	'#branch-banner .content .right input { font-weight: 400; border-radius: 4px; height: 30px; border: 1px solid #ccc; padding: 5px 7px 4px; width: 125px; font-size: 14px; }' +
	'#branch-banner .content .right button { margin-top: 0px; display: inline-block; height: 30px;; float: right; margin-left: 5px; font-weight: 400; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #000; padding: 0px 12px; }' +
	'#branch-banner .content .right button:hover { border: 1px solid #BABABA; background: #E0E0E0; }' +
	'#branch-banner .content .right input:focus, button:focus { outline: none; }' +
	'#branch-banner .content .right input.error { color: rgb(194, 0, 0); border-color: rgb(194, 0, 0); }' +
	'#branch-banner .content .right span { display: inline-block; font-weight: 400; margin: 7px 9px; font-size: 14px; }';
