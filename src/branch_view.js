'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');
goog.require('safejson');
goog.require('journeys_utils');

branch_view.callback_index = 1;

function checkPreviousBanner() {
	// if banner already exists, don't add another
	if (document.getElementById('branch-banner') ||
		document.getElementById('branch-banner-iframe') ||
		document.getElementById('branch-banner-container')) {
		return true;
	}
	return false;
}

/**
 * @param {Object} parent
 * @param {string} html
 * @param {boolean} hasApp
 */
function renderHtmlBlob(parent, html, hasApp) {
	journeys_utils.setJourneyLinkData(html);

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

	journeys_utils.branch._publishEvent('willShowJourney', journeys_utils.journeyLinkData);

	journeys_utils.animateBannerEntrance(iframe);

	return iframe;
};

// checks to see if user dismissed Journey previously and whether it should remain dismissed
function isJourneyDismissed(branchViewData, branch) {
	// check storage to see dismiss timestamp
	var dismissTimeStamp = branch._storage.get('hideBanner' + branchViewData["id"], true);

	if (dismissTimeStamp === true || dismissTimeStamp > Date.now()) {
		return true;
	}

	branch._storage.remove('hideBanner' + branchViewData["id"], true);
	return false;
}

/**
 * Checks if a journey should show based on dismiss time
 * @param       {Object} branch
 * @return      {boolean}
 */
function _areJourneysDismissedGlobally(branch) {
	var globalDismissEndTimestamp = branch._storage.get('globalJourneysDismiss', true);

	if (globalDismissEndTimestamp === true || globalDismissEndTimestamp > Date.now()) {
		return true;
	}

	return false;
}

branch_view.shouldDisplayJourney = function(eventResponse, options, journeyInTestMode) {
	if (
		checkPreviousBanner() ||
		!utils.mobileUserAgent()
	) {
		return false;
	}

	if (journeyInTestMode) {
		return true;
	}

	if (
		!eventResponse['branch_view_data']['id'] ||
		isJourneyDismissed(eventResponse['branch_view_data'], journeys_utils.branch) ||
		options['no_journeys'] ||
		_areJourneysDismissedGlobally(journeys_utils.branch)
	) {
		// resets the callback index so that auto-open works the next time a Journey is rendered
		branch_view.callback_index = 1;
		return false;
	}

	return true;
};

branch_view.incrementAnalytics = function(branchViewData) {
	journeys_utils.branch._api(
		resources.pageview,
		{
			"event": "pageview",
			"journey_displayed": true,
			"audience_rule_id": branchViewData['audience_rule_id'],
			"branch_view_id": branchViewData['branch_view_id']
		},
		function (err, data) {
			// do nothing with response
		}
	);
};

branch_view.displayJourney = function(html, requestData, templateId, eventData, testModeEnabled) {
	journeys_utils.branchViewId = templateId;

	// this code removes any leftover css from previous banner
	var branchCSS = document.getElementById('branch-iframe-css')
	if (branchCSS) {
		branchCSS.parentElement.removeChild(branchCSS)
	}

	var placeholder = document.createElement('div');
	placeholder.id = 'branch-banner';
	document.body.insertBefore(placeholder, null);
	banner_utils.addClass(placeholder, 'branch-banner-is-active');

	var failed = false;
	var callbackString = requestData['callback_string'];
	var banner = null;
	var cta = null;
	var storage = journeys_utils.branch._storage;


	if (html) {

		var metadata = journeys_utils.getMetadata(html) || {};

		var timeoutTrigger = window.setTimeout(
			function() {
				window[callbackString] = function() { };
			},
			utils.timeout
		);

		window[callbackString] = function(data) {
			window.clearTimeout(timeoutTrigger);
			if (failed) {
				return;
			}
			cta = data;

			journeys_utils.finalHookups(templateId, storage, cta, banner, metadata, testModeEnabled);
		};

		banner = renderHtmlBlob(document.body, html, requestData['has_app_websdk']);
		journeys_utils.banner = banner;


		if (banner === null) {
			failed = true;
			return;
		}

		journeys_utils.finalHookups(templateId, storage, cta, banner, metadata, testModeEnabled);

		if (utils.navigationTimingAPIEnabled) {
			utils.instrumentation['journey-load-time'] = utils.timeSinceNavigationStart();
		}

	}

	document.body.removeChild(placeholder);

	if (!utils.userPreferences.trackingDisabled && !testModeEnabled) {
		branch_view.incrementAnalytics(eventData['branch_view_data']);
	}
};

branch_view.buildJourneyRequestData = function(metadata, options, branch) {

	journeys_utils.branch = branch;

	if (!options) {
		options = {};
	}

	if (!metadata) {
		metadata = {};
	}

	// starts object off with data from setBranchViewData() call
	var obj = branch._branchViewData || {};
	var sessionStorage = session.get(branch._storage) || {};
	var has_app = sessionStorage.hasOwnProperty('has_app') ? sessionStorage['has_app'] : false;
	var userLanguage = (options['user_language'] || utils.getBrowserLanguageCode() || 'en').toLowerCase() || null;
	var initialReferrer = utils.getInitialReferrer(branch._referringLink());
	var branchViewId = options['branch_view_id'] || utils.getParameterByName('_branch_view_id') || null;
	var linkClickId = !options['make_new_link'] ? utils.getClickIdAndSearchStringFromLink(branch._referringLink()) : null;

	// adds root level keys for v1/event
	obj['event'] = 'pageview';
	obj['metadata'] = metadata;
	obj = utils.addPropertyIfNotNull(obj, 'initial_referrer', initialReferrer);

	// adds root level keys for v1/branchview
	obj = utils.addPropertyIfNotNull(obj, 'branch_view_id', branchViewId);
	obj = utils.addPropertyIfNotNull(obj, 'no_journeys', options['no_journeys']);
	obj = utils.addPropertyIfNotNull(obj, 'is_iframe', utils.isIframe());
	obj['user_language'] = userLanguage;
	obj['open_app'] = options['open_app'] || false;
	obj['has_app_websdk'] = has_app;
	obj['feature'] = 'journeys';
	obj['callback_string'] = 'branch_view_callback__' + (branch_view.callback_index++);

	if (!obj.data) {
		obj.data = {};
	}

	// builds data object for v1/branchview
	obj.data = utils.merge(utils.getHostedDeepLinkData(), obj.data);
	obj.data = utils.merge(utils.whiteListJourneysLanguageData(sessionStorage || {}), obj.data);
	if (linkClickId) {
		obj.data['link_click_id'] = linkClickId;
	}
	obj = utils.cleanLinkData(obj);
	return obj;
};

branch_view.getMetadataForPageviewEvent = function(options, additionalMetadata) {
	return utils.merge({
		"url": options && options.url || utils.getWindowLocation(),
		"user_agent": navigator.userAgent,
		"language": navigator.language,
		"screen_width": screen.width || -1,
		"screen_height": screen.height || -1
	}, additionalMetadata || {});
};
