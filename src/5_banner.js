/**
 * This provides the markup, styles, and helper functions for all Banner UI Elements
 */
'use strict';
goog.provide('banner');

goog.require('utils');
goog.require('banner_utils');
goog.require('banner_css');
goog.require('banner_html');


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


	var element;
	var bodyMarginTopInline = document.body.style.marginTop;
	var bodyMarginBottomInline = document.body.style.marginBottom;

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

	var finalHookupsCallback = function(markup) {
		element = markup;
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

		var bodyMarginTopComputed = banner_utils.getBodyStyle('margin-top');
		var bodyMarginBottomComputed = banner_utils.getBodyStyle('margin-bottom');

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

		var closeButton = doc.getElementById('branch-banner-close');

		if (closeButton) {
			closeButton.onclick = function(ev) {
				ev.preventDefault();
				branch._publishEvent('willCloseBanner');
				closeBanner({}, function() {
					branch._publishEvent('didCloseBanner');
				});
			};
		}

		var modalBackground = doc.getElementById('branch-banner-modal-background');


		if (modalBackground) {
			modalBackground.onclick = function(ev) {
				ev.preventDefault();
				branch._publishEvent('willCloseBanner');
				closeBanner({}, function() {
					branch._publishEvent('didCloseBanner');
				});
			};
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

	};

	// Create markup
	banner_html.markup(options, storage, finalHookupsCallback);

	return closeBanner;
};
