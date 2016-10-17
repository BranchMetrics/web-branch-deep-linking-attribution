/**
 * This provides the markup, styles, and helper functions for all Banner UI Elements
 */
'use strict';
goog.provide('banner');

goog.require('utils');
goog.require('banner_utils');
goog.require('banner_css');
goog.require('banner_html');

var sendSMS = function(doc, branch, options, linkData) {
	var phone = doc.getElementById('branch-sms-phone');
	var sendButton = doc.getElementById('branch-sms-send');
	var branchLoader = doc.getElementById('branch-loader-wrapper');
	var smsFormContainer = doc.getElementById('branch-sms-form-container');
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
		checkmark = doc.createElement('div');
		checkmark.className = 'branch-icon-wrapper';
		checkmark.id = 'branch-checkmark';
		checkmark.style = 'opacity: 0;';
		checkmark.innerHTML = banner_html.checkmark();
		smsFormContainer.appendChild(checkmark);

		sendButton.style.opacity = '0';

		phone.style.opacity = '0';

		branchLoader.style.opacity = '0';

		setTimeout(function() {
			checkmark.style.opacity = '1';
		}, banner_utils.animationDelay);

		phone.value = '';
	};

	var errorForm = function() {
		enableForm();
		sendButton.style.background = '#FFD4D4';

		phone.className = 'error';

		setTimeout(function() {
			sendButton.style.background = '#FFFFFF';
			phone.className = '';
		}, banner_utils.error_timeout);
	};

	if (phone) {
		var phoneValue = phone.value;
		if ((/^\d{7,}$/).test(phoneValue.replace(/[\s()+\-\.]|ext/gi, ''))) {
			branch._publishEvent('willSendBannerSMS');
			disableForm();
			branch['sendSMS'](phoneValue, linkData, options, function(err) {
				if (err) {
					branch._publishEvent('sendBannerSMSError');
					errorForm();
				}
				else {
					branch._publishEvent('didSendBannerSMS');
					hideFormShowSuccess();
					setTimeout(function() {
						smsFormContainer.removeChild(checkmark);
						enableForm();
					}, banner_utils.success_timeout);
				}
			});
		}
		else {
			errorForm();
		}
	}
};

/**
 * @param {Object} branch
 * @param {banner_utils.options} options
 * @param {Object} linkData
 * @param {storage} storage
 */
banner = function(branch, options, linkData, storage) {
	if (!banner_utils.shouldAppend(storage, options)) {
		branch._publishEvent('willNotShowBanner');
		return null;
	}

	branch._publishEvent('willShowBanner');

	// Create markup
	var element = banner_html.markup(options, storage);

	// Add CSS
	banner_css.css(options, element);

	// Attach actions
	linkData['channel'] = linkData['channel'] || 'app banner';

	var doc = options.iframe ? element.contentWindow.document : document;
	if (utils.mobileUserAgent()) {
		options['open_app'] = options.open_app;
		options['append_deeplink_path'] = options.append_deeplink_path;
		options['make_new_link'] = options.make_new_link;
		options['deepview_type'] = 'banner';
		branch['deepview'](linkData, options);
		var cta = doc.getElementById('branch-mobile-action');
		if (cta) {
			cta.onclick = function(ev) {
				ev.preventDefault();
				branch['deepviewCta']();
			};
		}
	}
	else if (doc.getElementById('sms-form')) {
		doc.getElementById('sms-form').addEventListener('submit', function(ev) {
			ev.preventDefault();
			sendSMS(doc, branch, options, linkData);
		});
	}
	else {
		element.onload = function() {
			doc = element.contentWindow.document;
			if (doc.getElementById('sms-form')) {
				doc.getElementById('sms-form').addEventListener('submit', function(ev) {
					ev.preventDefault();
					sendSMS(doc, branch, options, linkData);
				});
			}
		};
	}

	var bodyMarginTopComputed = banner_utils.getBodyStyle('margin-top');
	var bodyMarginTopInline = document.body.style.marginTop;
	var bodyMarginBottomComputed = banner_utils.getBodyStyle('margin-bottom');
	var bodyMarginBottomInline = document.body.style.marginBottom;

	var closeButton = doc.getElementById('branch-banner-close');

	var closeBanner = function(closeOptions, callback) {
		if (typeof closeOptions === 'function') {
			callback = closeOptions;
			closeOptions = {};
		}
		closeOptions = closeOptions || {};

		if (options.position === 'top') {
			element.style.top = '-' + banner_utils.bannerHeight;
		}
		else if (options.position === 'bottom') {
			element.style.bottom = '-' + banner_utils.bannerHeight;
		}

		if (typeof options.forgetHide === 'number') {
			storage.set('hideBanner', banner_utils.getDate(options.forgetHide), true);
		}
		else {
			storage.set('hideBanner', true, true);
		}

		if (closeOptions.immediate) {
			if (options.position === 'top') {
				document.body.style.marginTop = bodyMarginTopInline;
			}
			else if (options.position === 'bottom') {
				document.body.style.marginBottom = bodyMarginBottomInline;
			}
			banner_utils.removeClass(document.body, 'branch-banner-is-active');
			banner_utils.removeElement(element);
			banner_utils.removeElement(document.getElementById('branch-css'));
			callback();
		}
		else {
			setTimeout(function() {
				banner_utils.removeElement(element);
				banner_utils.removeElement(document.getElementById('branch-css'));
				callback();
			}, banner_utils.animationSpeed + banner_utils.animationDelay);

			setTimeout(function() {
				if (options.position === 'top') {
					document.body.style.marginTop = bodyMarginTopInline;
				}
				else if (options.position === 'bottom') {
					document.body.style.marginBottom = bodyMarginBottomInline;
				}
				banner_utils.removeClass(document.body, 'branch-banner-is-active');
			}, banner_utils.animationDelay);
		}
	};

	if (closeButton) {
		closeButton.onclick = function(ev) {
			ev.preventDefault();
			branch._publishEvent('willCloseBanner');
			closeBanner({}, function() {
				branch._publishEvent('didCloseBanner');
			});
		};
	}

	// Trigger animation
	banner_utils.addClass(document.body, 'branch-banner-is-active');
	if (options.position === 'top') {
		document.body.style.marginTop =
			banner_utils.addCSSLengths(banner_utils.bannerHeight, bodyMarginTopComputed);
	}
	else if (options.position === 'bottom') {
		document.body.style.marginBottom =
			banner_utils.addCSSLengths(banner_utils.bannerHeight, bodyMarginBottomComputed);
	}

	function onAnimationEnd() {
		if (options.position === 'top') {
			element.style.top = '0';
		}
		else if (options.position === 'bottom') {
			element.style.bottom = '0';
		}
		branch._publishEvent('didShowBanner');
	}

	if (options.immediate) {
		onAnimationEnd();
	}
	else {
		setTimeout(onAnimationEnd, banner_utils.animationDelay);
	}

	return closeBanner;
};
