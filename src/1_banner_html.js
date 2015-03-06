goog.provide('banner_html');
goog.require('banner_utils');
goog.require('utils');
goog.require('storage'); // jshint unused:false


/**
 * @param {banner_utils.options} options
 * @param {string} action
 */
banner_html.banner = function(options, action) {
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
			action +
		'</div>' +
	'</div>';
};


/**
 * @param {banner_utils.options} options
 * @param {BranchStorage} storage
 */
banner_html.mobileAction = function(options, storage) {
	return '<a id="branch-mobile-action" href="#" target="_parent">' + (utils.hasApp(storage) ? options.openAppButtonText : options.downloadAppButtonText) + '</a>';
};

banner_html.desktopAction =
	'<div id="branch-sms-block">' +
		'<form id="sms-form">' +
			'<input type="phone" class="branch-animation" name="branch-sms-phone" id="branch-sms-phone" placeholder="(999) 999-9999">' +
			'<button type="submit" id="branch-sms-send" class="branch-animation" >Send Link</button>' +
		'</form>' +
	'</div>' +
	'<div class="branch-icon-wrapper" id="branch-loader-wrapper" style="opacity: 0;">' +
		'<div id="branch-spinner"></div>' +
	'</div>';

banner_html.checkmark = function() {
	if (window.ActiveXObject) {
		return '<span class="checkmark">&#x2713;</span>';
	}
	else {
		return '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve">' +
			'<path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4' +
			'C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/>' +
		'</svg>';
	}
};

/**
 * @param {banner_utils.options} options
 */
banner_html.iframe = function(options, action) {
	var iframe = document.createElement('iframe');
	iframe.src = 'about:blank'; // solves CORS issues, test in IE
	iframe.style.overflow = "hidden";
	iframe.scrolling = 'no';
	iframe.id = 'branch-banner-iframe';
	iframe.className = 'branch-animation';
	document.body.appendChild(iframe);

	var iframeHTML = '<html><head></head><body><div id="branch-banner" class="branch-animation">' + banner_html.banner(options, action) + '</body></html>';
	iframe.contentWindow.document.open();
	iframe.contentWindow.document.write(iframeHTML);
	iframe.contentWindow.document.close();

	return iframe;
};

/**
 * @param {banner_utils.options} options
 */
banner_html.div = function(options, action) {
	var banner = document.createElement('div');
	banner.id = 'branch-banner';
	banner.className = 'branch-animation';
	banner.innerHTML = banner_html.banner(options, action);

	return banner;
};

/**
 * @param {banner_utils.options} options
 * @param {BranchStorage} storage
 */
banner_html.markup = function(options, storage) {
	var action = '<div id="branch-sms-form-container">' +
		(banner_utils.mobileUserAgent() ? banner_html.mobileAction(options, storage) : banner_html.desktopAction) +
	'</div>';

	if (options.iframe) {
		return banner_html.iframe(options, action);
	}
	else {
		return banner_html.div(options, action);
	}
};

