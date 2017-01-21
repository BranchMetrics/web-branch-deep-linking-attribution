'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');
goog.require('safejson');
goog.require('journeys_utils');

/**
 * @param {Object} parent
 * @param {string} html
 * @param {Boolean} hasApp
 */
function renderHtmlBlob(parent, html, hasApp) {
	journeys_utils.branch._publishEvent('willShowJourney');

	var ctaText = hasApp ? 'OPEN' : 'GET';

	journeys_utils.setPositionAndHeight(html);

	// Get metadata, css and js from html blob then remove them
	var metadata = journeys_utils.getMetadata(html);
	if (metadata) {
		ctaText = journeys_utils.getCtaText(metadata, hasApp);
		journeys_utils.findInsertionDiv(parent, metadata);
	}
	var cssInsideIframe = journeys_utils.getCss(html);
	journeys_utils.getJsAndAddToParent(html);
	html = journeys_utils.removeScriptAndCss(html);

	// create iframe element, add html, add css, add ctaText
	var iframe = journeys_utils.createAndAppendIframe();
	var iframeHTML = journeys_utils.createIframeInnerHTML(html, utils.mobileUserAgent());
	journeys_utils.addHtmlToIframe(iframe, iframeHTML);
	journeys_utils.addIframeOuterCSS();
	journeys_utils.addIframeInnerCSS(iframe, cssInsideIframe);
	journeys_utils.addDynamicCtaText(iframe, ctaText);

	journeys_utils.animateBannerEntrance(iframe);

	return iframe;
};

/**
 * @param {Object} server
 * @param {Object} branchViewData
 * @param {Object} requestData
 * @param {Object} storage
 * @param {Boolean} hasApp
 */
branch_view.handleBranchViewData = function(server, branchViewData, requestData, storage, hasApp, testFlag, branch) {
    journeys_utils.branch = branch;

	var banner = null;
	var cta = null;

	requestData = requestData || {};
	requestData['feature'] = 'journeys';

	var cleanedData = utils.cleanLinkData(requestData);

	if (document.getElementById('branch-banner') ||
		document.getElementById('branch-banner-iframe') ||
		document.getElementById('branch-banner-container')) {
		return;
	}

	var placeholder = document.createElement('div');
	placeholder.id = 'branch-banner';
	document.body.insertBefore(placeholder, null);
	banner_utils.addClass(placeholder, 'branch-banner-is-active');

	if (branchViewData['html']) {
		return renderHtmlBlob(document.body, branchViewData['html'], hasApp);
	} else if (branchViewData['url']) {
		var callbackString = 'branch_view_callback__' + (jsonp_callback_index++);
		var postData = encodeURIComponent(utils.base64encode(goog.json.serialize(cleanedData)));
		var url = branchViewData['url'] + '&callback=' + callbackString;
		url += '&_lan=' + (branch.user_language || utils.getBrowserLanguageCode());
		url += '&data=' + postData;
		server.XHRRequest(url, {}, 'GET', {}, function(error, html){
			var failed = false;
			if (!error && html) {

				var hideBanner = !testFlag
					? journeys_utils.findDismissPeriod(html)
					: 0;

				var timeoutTrigger = window.setTimeout(
					function() {
						window[callbackString] = function() { };
					},
					TIMEOUT
				);

				window[callbackString] = function(data) {
					window.clearTimeout(timeoutTrigger);
					if (failed) {
						return;
					}
					cta = data;

					journeys_utils.finalHookups(branchViewData, storage, cta, banner, hideBanner);
				};

				banner = renderHtmlBlob(document.body, html, hasApp);
				if (banner === null) {
					failed = true;
					return;
				}

				journeys_utils.banner = banner;

				journeys_utils.finalHookups(branchViewData, storage, cta, banner, hideBanner);
			}
			document.body.removeChild(placeholder);
		}, true);
	}
};
