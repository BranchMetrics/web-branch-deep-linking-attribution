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
 * @param {Boolean} testFlag
 */
branch_view.handleBranchViewData = function(server, branchViewData, requestData, storage, hasApp, testFlag, branch) {
	journeys_utils.branch = branch;

	var banner = null;
	var cta = null;

	requestData = requestData || {};
	requestData['feature'] = 'journeys';

	var cleanedData = utils.cleanLinkData(requestData);

	// this code removes any leftover css from previous banner
	var branchCSS = document.getElementById('branch-iframe-css')
	if (branchCSS) {
		branchCSS.parentElement.removeChild(branchCSS)
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
		url += '&_lan=' + (journeys_utils.branch.user_language || utils.getBrowserLanguageCode());
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

				journeys_utils.finalHookups(branchViewData, storage, cta, banner, hideBanner);
			}
			document.body.removeChild(placeholder);
		}, true);
	}
};

function determineBannerExists() {
	// if banner already exists, don't add another
	if (document.getElementById('branch-banner') ||
		document.getElementById('branch-banner-iframe') ||
		document.getElementById('branch-banner-container')) {
		return true;
	}
	return false;
}

function initJourneyInTestMode(journeyProperties) {
	journeyProperties['branchViewData'] = {};
	journeyProperties['branchViewData']['id'] = journeyProperties['branchViewId'];
	journeyProperties['branchViewData']['number_of_use'] = -1;
	journeyProperties['branchViewData']['url'] = (config.api_endpoint + '/v1/branchview/' + journeyProperties['branch_key'] + '/' + journeyProperties['branchViewId'] + '?_a=audience_rule_id&_t=' + journeyProperties['data']['browser_fingerprint_id']);
	journeyProperties['branchViewData']['testFlag'] = true;
}

function processJourneyDismissal(journeyProperties) {

	journeyProperties['branchViewData'] = journeyProperties['eventData']['branch_view_data'];

	// check storage to see dismiss timestamp
	journeyProperties['dismissTimeStamp'] = journeyProperties['branch']['_storage'].get('hideBanner' + journeyProperties['branchViewData']['id'], true);

	if (journeyProperties['dismissTimeStamp'] < Date.now()) {
		journeyProperties['branch']['_storage'].remove('hideBanner' + journeyProperties['branchViewData']['id'], true);
	}
	else if (journeyProperties['dismissTimeStamp'] === true || journeyProperties['dismissTimeStamp']  > Date.now()) {
		journeyProperties['hideBanner']  = true;
		journeyProperties['branch']._publishEvent('willNotShowJourney');
	}
}

function displayJourney(journeyProperties) {
	journeyProperties['branch']['renderQueue'](function() {
		var requestData = journeyProperties['branch']['_branchViewData'] || {};
		if (!requestData['data']) {
			requestData['data'] = {};
		}
		requestData['data'] = utils.merge(utils.scrapeHostedDeepLinkData(), requestData['data']);
		requestData['data'] = utils.merge(utils.whiteListJourneysLanguageData(session.get(journeyProperties['branch']['_storage']) || {}), requestData['data']);

		branch_view.handleBranchViewData(journeyProperties['branch']['_server'], journeyProperties['branchViewData'], requestData, journeyProperties['branch']['_storage'], journeyProperties['data']['has_app'], journeyProperties['testFlag'], journeyProperties['branch']);
	});

}

branch_view.initJourney = function(branch_key, data, eventData, options, branch) {

	branch._branchViewEnabled = !!eventData['branch_view_enabled'];
	branch._storage.set('branch_view_enabled', branch._branchViewEnabled);

	if (determineBannerExists()) {
		return;
	}

	var branchViewId = null;
	var no_journeys = null;

	if (options) {
		branchViewId = options.branch_view_id || null;
		no_journeys = options.no_journeys || null;
		branch.user_language = options.user_language || utils.getBrowserLanguageCode();
	}

	var journeyProperties = {};
	journeyProperties['branch_key'] = branch_key;
	journeyProperties['branchViewId'] = branchViewId;
	journeyProperties['data'] = data;
	journeyProperties['eventData'] = eventData;
	journeyProperties['no_journeys'] = no_journeys;
	journeyProperties['branch'] = branch;
	journeyProperties['testFlag'] = false;
	journeyProperties['dismissTimeStamp'] = null;
	journeyProperties['hideBanner'] = false;

	journeyProperties['branchViewId'] = journeyProperties['branchViewId'] || utils.getParameterByName('_branch_view_id') || null;

	if (journeyProperties['branchViewId'] && utils.mobileUserAgent()) {
		initJourneyInTestMode(journeyProperties);
	}

	if (!journeyProperties['testFlag']) {
		if (journeyProperties['eventData'].hasOwnProperty('branch_view_data')) {
			processJourneyDismissal(journeyProperties);
		}
	}

	if (journeyProperties['branchViewData'] && !journeyProperties['hideBanner'] && !journeyProperties['no_journeys']) {
		displayJourney(journeyProperties);
	}
	else {
		journeyProperties['branch']._publishEvent('willNotShowJourney');
	}
}