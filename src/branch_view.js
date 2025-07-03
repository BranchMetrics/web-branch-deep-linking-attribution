'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');
goog.require('safejson');
goog.require('journeys_utils');

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
function renderHtmlBlob(parent, html, hasApp, iframeLoadedCallback) {

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
	var cssIframeContainer = journeys_utils.getIframeCss(html);
	html = journeys_utils.removeScriptAndCss(html);

	// create iframe element, add html, add css, add ctaText
	var iframeContainer = document.createElement("div");
	iframeContainer.id = "branch-banner-iframe-embed";
	var iframe = journeys_utils.createIframe();
	iframe.onload = function() {
		journeys_utils.addHtmlToIframe(iframe, html, utils.getPlatformByUserAgent());
		journeys_utils.addIframeOuterCSS(cssIframeContainer, metadata);
		journeys_utils.addIframeInnerCSS(iframe, cssInsideIframe);
		journeys_utils.addDynamicCtaText(iframe, ctaText);
		const eventData = Object.assign({}, journeys_utils.journeyLinkData);
		eventData['bannerHeight'] = journeys_utils.bannerHeight;
		eventData['isFullPageBanner'] = journeys_utils.isFullPage;
		eventData['bannerPagePlacement'] = journeys_utils.position;
		eventData['isBannerInline'] = journeys_utils.sticky === 'absolute';
		eventData['isBannerSticky'] = journeys_utils.sticky === 'fixed';
		journeys_utils.branch._publishEvent('willShowJourney', eventData);
	
		journeys_utils.animateBannerEntrance(iframe, cssIframeContainer);
		iframeLoadedCallback(iframe);
	}
	if(journeys_utils.isDesktopJourney)
	{
		iframeContainer.appendChild(iframe);
		document.body.appendChild(iframeContainer);
	}
	else
	{
		document.body.prepend(iframe);
	}
	return iframe;
};

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

	branch._storage.remove('globalJourneysDismiss', true);
	return false;
}

branch_view.shouldDisplayJourney = function(eventResponse, options, journeyInTestMode) {
	if (	checkPreviousBanner() ||
		utils.getPlatformByUserAgent() == "other" ||
		!eventResponse['event_data'] ||
		!eventResponse['template']
	) {
		return false;
	}

	if (journeyInTestMode) {
		return true;
	}

	if (
		!eventResponse['event_data']['branch_view_data']['id'] ||
		(options && options['no_journeys']) ||
		_areJourneysDismissedGlobally(journeys_utils.branch)
	) {
		// resets the callback index so that auto-open works the next time a Journey is rendered
		branch_view.callback_index = 1;
		return false;
	}
	return true;
};

branch_view.incrementPageviewAnalytics = function(branchViewData) {
	var requestData = 		{
		"event": "pageview",
		"journey_displayed": true,
		"audience_rule_id": branchViewData['audience_rule_id'],
		"branch_view_id": branchViewData['branch_view_id']
	};

	var sessionStorage = session.get(journeys_utils.branch._storage) || {};
	var identity = sessionStorage.hasOwnProperty('identity') ? sessionStorage['identity'] : null;
	requestData = utils.addPropertyIfNotNull(requestData, 'identity', identity);

	journeys_utils.branch._api(
		resources.pageview,
		requestData,
		function (err, data) {
			// do nothing with response
		}
	);
};

branch_view.displayJourney = function(html, requestData, templateId, branchViewData, testModeEnabled, journeyLinkData) {
    if(journeys_utils.exitAnimationIsRunning){
    	return;
	}

	journeys_utils.branchViewId = templateId;
	journeys_utils.setJourneyLinkData(journeyLinkData);

	var audienceRuleId = branchViewData['audience_rule_id'];

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

		html = journeys_utils.tryReplaceJourneyCtaLink(html);

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

			journeys_utils.finalHookups(templateId, audienceRuleId, storage, cta, banner, metadata, testModeEnabled, branch_view);
		};

		var finalHookupsOnIframeLoaded = function (banner) {
			journeys_utils.banner = banner;
	
			if (banner === null) {
				failed = true;
				return;
			}
	
			journeys_utils.finalHookups(templateId, audienceRuleId, storage, cta, banner, metadata, testModeEnabled, branch_view);
	
			if (utils.navigationTimingAPIEnabled) {
				utils.instrumentation['journey-load-time'] = utils.timeSinceNavigationStart();
			}
			
			document.body.removeChild(placeholder);
	
			if (!utils.userPreferences.trackingDisabled && !testModeEnabled) {
				branch_view.incrementPageviewAnalytics(branchViewData);
			}
		}
		renderHtmlBlob(document.body, html, requestData['has_app_websdk'], finalHookupsOnIframeLoaded);
	} else {
		document.body.removeChild(placeholder);
	
		if (!utils.userPreferences.trackingDisabled && !testModeEnabled) {
			branch_view.incrementPageviewAnalytics(branchViewData);
		}
	}
};

branch_view._getPageviewRequestData = function(metadata, options, branch, isDismissEvent) {

	journeys_utils.branch = branch;

	if (!options) {
		options = {};
	}

	if (!metadata) {
		metadata = {};
	}

	journeys_utils.entryAnimationDisabled = options['disable_entry_animation'] || false;
	journeys_utils.exitAnimationDisabled = options['disable_exit_animation'] || false;

	// starts object off with data from setBranchViewData() call
	var obj = utils.merge({}, branch._branchViewData);
	var sessionStorage = session.get(branch._storage) || {};
	var has_app = sessionStorage.hasOwnProperty('has_app') ? sessionStorage['has_app'] : false;
	var identity = sessionStorage.hasOwnProperty('identity') ? sessionStorage['identity'] : null;
	var journeyDismissals = branch._storage.get('journeyDismissals', true);
	var userLanguage = (options['user_language'] || utils.getBrowserLanguageCode() || 'en').toLowerCase() || null;
	var initialReferrer = utils.getInitialReferrer(branch._referringLink());
	var branchViewId = options['branch_view_id'] || utils.getParameterByName('_branch_view_id') || null;
	var linkClickId = !options['make_new_link'] ? utils.getClickIdAndSearchStringFromLink(branch._referringLink(true)) : null;
	var SessionlinkClickId = sessionStorage.hasOwnProperty('session_link_click_id') ? sessionStorage['session_link_click_id'] : null;

	// adds root level keys for v1/event
	obj['event'] = !isDismissEvent ? 'pageview' : 'dismiss';
	obj['metadata'] = metadata;
	obj = utils.addPropertyIfNotNull(obj, 'initial_referrer', initialReferrer);

	// adds root level keys for v1/branchview
	obj = utils.addPropertyIfNotNull(obj, 'branch_view_id', branchViewId);
	obj = utils.addPropertyIfNotNull(obj, 'no_journeys', options['no_journeys']);
	obj = utils.addPropertyIfNotNull(obj, 'is_iframe', utils.isIframe());
	obj = utils.addPropertyIfNotNull(obj, 'journey_dismissals', journeyDismissals);
	obj = utils.addPropertyIfNotNull(obj, 'identity', identity);
	obj = utils.addPropertyIfNotNull(obj, 'session_link_click_id', SessionlinkClickId);
	obj['user_language'] = userLanguage;
	obj['open_app'] = options['open_app'] || false;
	obj['has_app_websdk'] = has_app;
	obj['feature'] = 'journeys';
	obj['callback_string'] = 'branch_view_callback__' + (journeys_utils._callback_index++);

	if (!obj.data) {
		obj.data = {};
	}

	// builds data object for v1/branchview
	obj.data = utils.merge(utils.getHostedDeepLinkData(), obj.data);
	obj.data = utils.merge(utils.whiteListJourneysLanguageData(sessionStorage || {}), obj.data);
	if (linkClickId) {
		obj.data['link_click_id'] = linkClickId;
	}
	var linkData = sessionStorage['data'] ? safejson.parse(sessionStorage['data']) : null;
	if (linkData && linkData['+referrer']) {
		obj.data['+referrer'] = linkData['+referrer'];
	}
	obj['session_referring_link_data'] = sessionStorage['data'] || null;
	obj = utils.cleanLinkData(obj);
	return obj;
};
