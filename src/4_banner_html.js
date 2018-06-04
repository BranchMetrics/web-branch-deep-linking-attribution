'use strict';
goog.provide('banner_html');

goog.require('banner_utils');
goog.require('utils');
goog.require('session');
goog.require('storage'); // jshint unused:false

/**
 * @param {banner_utils.options} options
 * @param {string} action
 */
banner_html.banner = function(options, action) {
	return '<div class="content' + (options['theme'] ? ' theme-' + options['theme'] : '') + '">' +
		'<div class="right">' +
			action +
		'</div>' +
		'<div class="left">' +
			(!options.disableHide ?
				'<div id="branch-banner-close" class="branch-animation" aria-label="Close">&times;</div>' :
				'') +
			'<div class="icon">' +
				'<img src="' + options.icon + '" alt="Application icon">' +
			'</div>' +
			'<div class="details vertically-align-middle">' +
				'<div class="title">' + options.title + '</div>' +
				((options.rating || options.reviewCount) ?
					('<div class="reviews">' +
						(options.rating ?
							('<span class="stars">' +
								(function() {
									var stars = "";
									for (var i = 0; i < 5; i++) {
										stars += '<span class="star">' +
												'<svg class="star" fill="#555555" height="12" viewBox="3 2 20 19" width="12">' +
												'<path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>' +
												'<path d="M0 0h24v24H0z" fill="none"/>' +
												'<foreignObject display="none">' +
												'<span class="star">☆</span>' +
												'</foreignObject>' +
												'</svg>';
										if (options.rating > i) {
											stars += (i + 1 > options.rating && options.rating % 1) ?
												'<span class="half">' +
													'<svg fill="#555555" height="12" viewBox="3 2 20 19" width="12">' +
													'<defs>' +
													'<path d="M0 0h24v24H0V0z" id="a"/>' +
													'</defs>' +
													'<clipPath id="b">' +
													'<use overflow="visible" xlink:href="#a"/>' +
													'</clipPath>' +
													'<path clip-path="url(#b)" d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>' +
													'</svg>' +
													'<foreignObject display="none">' +
													'<span class="half">★</span>' +
													'</foreignObject>' +
													'</span>' :
												'<span class="full">' +
													'<svg fill="#555555" height="12" viewBox="3 2 20 19" width="12">' +
													'<path d="M0 0h24v24H0z" fill="none"/>' +
													'<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>' +
													'<path d="M0 0h24v24H0z" fill="none"/>' +
													'<foreignObject display="none">' +
													'<span class="full">★</span>' +
													'</foreignObject>' +
													'</svg>' +
													' </span>';
										}
										stars += '</span>';
									}
									return stars;
								})() +
							'</span>') :
							'') +
						(options.reviewCount ?
							('<span class="review-count">' + options.reviewCount + '</span>') :
							'') +
					'</div>') :
					'') +
				'<div class="description">' + options.description + '</div>' +
			'</div>' +
		'</div>' +
	'</div>';
};


/**
 * @param {banner_utils.options} options
 * @param {storage} storage
 */
banner_html.mobileAction = function(options, storage) {
	return '<a id="branch-mobile-action" class="button" href="#" target="_parent">' +
		((session.get(storage) || {})['has_app'] ?
			options.openAppButtonText :
			options.downloadAppButtonText) +
		'</a>';
};

banner_html.desktopAction = function(options) {
	return '<div class="branch-icon-wrapper" id="branch-loader-wrapper" style="opacity: 0;">' +
		'<div id="branch-spinner"></div>' +
	'</div>' +
	'<div id="branch-sms-block">' +
		'<form id="sms-form">' +
			'<input type="phone" aria-label="Enter phone number" class="branch-animation" name="branch-sms-phone"' +
			' id="branch-sms-phone" placeholder="' +
			options.phonePreviewText +
			'">' +
			'<button type="submit" id="branch-sms-send" class="branch-animation button">' +
			options.sendLinkText + '</button>' +
		'</form>' +
	'</div>';
};

banner_html.checkmark = function() {
	if (window.ActiveXObject) {
		return '<span class="checkmark">&#x2713;</span>';
	}
	else {
		return '<svg version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 98.5 98.5"' +
			' enable-background="new 0 0 98.5 98.5" xml:space="preserve">' +
			'<path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10"' +
			' d="M81.7,17.8C73.5,9.3,62,4,49.2,4' +
			'C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,' +
			'45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/>' +
		'</svg>';
	}
};

/**
 * @param {banner_utils.options} options
 */
banner_html.iframe = function(options, action) {
	var iframe = document.createElement('iframe');
	iframe.src = 'about:blank'; // solves CORS issues, test in IE
	iframe.style.overflow = 'hidden';
	iframe.scrolling = 'no';
	iframe.id = 'branch-banner-iframe';
	iframe.className = 'branch-animation';
	utils.addNonceAttribute(iframe);

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

	var iframeHTML = '<html><head></head><body class="' +
		bodyClass +
		'"><div id="branch-banner" class="branch-animation">' +
		banner_html.banner(options, action) +
		'</body></html>';
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
	document.body.appendChild(banner);

	return banner;
};

/**
 * @param {banner_utils.options} options
 * @param {storage} storage
 */
banner_html.markup = function(options, storage) {
	var action = '<div id="branch-sms-form-container">' +
		(utils.mobileUserAgent() ?
			banner_html.mobileAction(options, storage) :
			banner_html.desktopAction(options)) +
		'</div>';

	if (options.iframe) {
		return banner_html.iframe(options, action);
	}
	else {
		return banner_html.div(options, action);
	}
};
