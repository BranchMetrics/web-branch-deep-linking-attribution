/**
 * This provides the markup, styles, and helper functions for all Banner UI Elements
 */

goog.provide('banner');
goog.require('banner_utils');
goog.require('banner_css');
goog.require('banner_html');

goog.require('config');
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

var closeBanner = function(element, storage) {
	setTimeout(function() {
		banner_utils.removeElement(element);
		banner_utils.removeElement(document.getElementById('branch-css'));
	}, banner_utils.animationSpeed + banner_utils.animationDelay);

	setTimeout(function() {
		document.body.style.marginTop = '0px';
	}, banner_utils.animationDelay);
	element.style.top = '-' + banner_utils.bannerHeight;

	utils.storeKeyValue('hideBanner', true, storage);
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
			if (utils.readKeyValue('click_id', storage) && !options['makeNewLink']) {
				doc.getElementById('branch-mobile-action').href = config.link_service_endpoint + '/c/' + utils.readKeyValue('click_id', storage);
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
		var closeButton = doc.getElementById('branch-banner-close');
		if (closeButton) {
			closeButton.onclick = function(ev) {
				ev.preventDefault();
				closeBanner(element, storage);
			};
		}

		// Trigger animation
		document.body.className = 'branch-animation';
		document.body.style.marginTop = banner_utils.bannerHeight;
		setTimeout(function() {
			element.style.top = '0';
		}, banner_utils.animationDelay);
	}
};
