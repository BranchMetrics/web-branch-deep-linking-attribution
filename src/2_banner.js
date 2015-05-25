/**
 * This provides the markup, styles, and helper functions for all Banner UI Elements
 */

goog.provide('banner');
goog.require('banner_utils');
goog.require('banner_css');
goog.require('banner_html');

goog.require('utils');

var sendSMS = function(doc, branch, options, linkData) {
	var phone = doc.getElementById('branch-sms-phone');
	var sendButton  = doc.getElementById('branch-sms-send');
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
		sendButton.style.background = "#FFD4D4";

		phone.className = 'error';

		setTimeout(function() {
			sendButton.style.background = "#FFFFFF";
			phone.className = '';
		}, banner_utils.error_timeout);
	};

	if (phone) {
		var phone_val = phone.value;
		if ((/^\d{7,}$/).test(phone_val.replace(/[\s()+\-\.]|ext/gi, ''))) {
			disableForm();
			branch["sendSMS"](phone_val, linkData, options, function(err) {
				if (err) {
					errorForm();
				}
				else {
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
 * @param {BranchStorage} storage
 */
banner = function(branch, options, linkData, storage) {
	if (banner_utils.shouldAppend(storage, options)) {
		// Create markup
		var element = banner_html.markup(options, storage);

		// Add CSS
		banner_css.css(options, element);

		// Attach actions
		linkData['channel'] = linkData['channel'] || 'app banner';

		var doc = options.iframe ? element.contentWindow.document : document;
		if (banner_utils.mobileUserAgent()) {
			var referring_link = branch._referringLink();
			if (referring_link && !options['make_new_link']) {
				doc.getElementById('branch-mobile-action').href = referring_link;
			}
			else {
				branch["link"](linkData, function(err, url) {
					if (err) {
						// Todo: figure out something good to do here. Maybe a
						// long link? Or why not always a long link?
					}
					else {
						doc.getElementById('branch-mobile-action').href = url;
					}
				});
			}
		}
		else {
			doc.getElementById('sms-form').addEventListener('submit', function(ev) {
				ev.preventDefault();
				sendSMS(doc, branch, options, linkData);
			});
		}

		var bodyMarginTopComputed = banner_utils.getBodyStyle('margin-top'),
			bodyMarginTopInline = document.body.style.marginTop,
			bodyPaddingBottomComputed = banner_utils.getBodyStyle('padding-bottom'),
			bodyPaddingBottomInline = document.body.style.paddingBottom,

			closeButton = doc.getElementById('branch-banner-close'),
			closeBanner = function() {
			setTimeout(function() {
				banner_utils.removeElement(element);
				banner_utils.removeElement(document.getElementById('branch-css'));
			}, banner_utils.animationSpeed + banner_utils.animationDelay);

			setTimeout(function() {
				if (options.position == 'top') { document.body.style.marginTop = bodyMarginTopInline; }
				else if (options.position == 'bottom') { document.body.style.paddingBottom = bodyPaddingBottomInline; }

				banner_utils.removeClass(document.body, 'branch-banner-is-active');
			}, banner_utils.animationDelay);
			if (options.position == 'top') { element.style.top = '-' + banner_utils.bannerHeight; }
			else if (options.position == 'bottom') { element.style.bottom = '-' + banner_utils.bannerHeight; }

			if (typeof options.forgetHide == 'number') { utils.storeKeyValue('hideBanner', banner_utils.getDate(options.forgetHide), storage); }
			else { utils.storeKeyValue('hideBanner', true, storage); }
		};

		if (closeButton) {
			closeButton.onclick = function(ev) {
				ev.preventDefault();
				closeBanner();
			};
		}

		// Trigger animation
		banner_utils.addClass(document.body, 'branch-banner-is-active');
		if (options.position == 'top') { document.body.style.marginTop = banner_utils.addCSSLengths(banner_utils.bannerHeight, bodyMarginTopComputed); }
		else if (options.position == 'bottom') { document.body.style.paddingBottom = banner_utils.addCSSLengths(banner_utils.bannerHeight, bodyPaddingBottomComputed); }

		setTimeout(function() {
			if (options.position == 'top') { element.style.top = '0'; }
			else if (options.position == 'bottom') { element.style.bottom = '0'; }
		}, banner_utils.animationDelay);

		return closeBanner;
	}
};
