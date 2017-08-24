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
	journeys_utils.branch._publishEvent('willShowJourney', journeys_utils.journeyLinkData);

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
 * @param {boolean} hasApp
 * @param {boolean} testFlag
 * @param {Object} branch
 */
branch_view.handleBranchViewData = function(server, branchViewData, requestData, storage, hasApp, testFlag, branch) {
	if (checkPreviousBanner()) {
		return;
	}
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
		// we need to pass the callback_index to v1/branchview and increment it so that we prevent auto-deeplinking
		// from occurring more than once
		var callbackString = 'branch_view_callback__' + (branch_view.callback_index++);
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

// builds data for a Journey in test mode
function buildJourneyTestData(branchViewId, branch_key, data){
	return {
		id: branchViewId,
		number_of_use: -1,
		url: (config.api_endpoint + '/v1/branchview/' + branch_key + '/' + branchViewId + '?_a=audience_rule_id&_t=' + data.browser_fingerprint_id)
	}
}

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

// builds an object that contains data from setBranchViewData() call, hosted deep link data and language data
function compileRequestData(branch, makeNewLink, openApp) {
	var requestData = branch._branchViewData || {};

	if (!requestData['data']) {
		requestData['data'] = {};
	}

	var linkClickId = !makeNewLink ? utils.clickIdFromLink(branch._referringLink()) : null;

	requestData['data'] = utils.merge(utils.getHostedDeepLinkData(), requestData['data']);
	requestData['data'] = utils.merge(utils.whiteListJourneysLanguageData(session.get(branch._storage) || {}), requestData['data']);
	requestData['data'] = linkClickId ? utils.merge({'link_click_id': linkClickId}, requestData['data']) : requestData['data'];
	requestData = utils.merge({ 'open_app': openApp }, requestData);
	return requestData;
}

branch_view.initJourney = function(branch_key, data, eventData, options, branch) {

	branch._branchViewEnabled = !!eventData['branch_view_enabled'];
	branch._storage.set('branch_view_enabled', branch._branchViewEnabled);

	var branchViewId = null;
	var no_journeys = null;
	var hideJourney = null;
	var branchViewData = null;
	var requestData = null;
	var testFlag = false;
	var makeNewLink = false;
	var openApp = false;

	if (options) {
		branchViewId = options['branch_view_id'] || null;
		no_journeys = options['no_journeys'] || null;
		branch.user_language = options['user_language'] || utils.getBrowserLanguageCode();
		journeys_utils.entryAnimationDisabled = options['disable_entry_animation'] || false;
		journeys_utils.exitAnimationDisabled = options['disable_exit_animation'] || false;
		makeNewLink = options['make_new_link'] || false;
		// openApp defaults to false unless user specifies otherwise
		openApp = options['open_app'] || false;
	}

	branchViewId = branchViewId || utils.getParameterByName('_branch_view_id') || null;

	if (branchViewId && utils.mobileUserAgent()) {
		testFlag = true;
		branchViewData = buildJourneyTestData(branchViewId, branch_key, data);
	}

	if (!branchViewData) {
		if (eventData.hasOwnProperty('branch_view_data')) {
			branchViewData = eventData['branch_view_data'];
			hideJourney = isJourneyDismissed(branchViewData, branch);
		}
	}

	if (branchViewData && !hideJourney && !no_journeys) {
		journeys_utils.branchViewId = branchViewData.id;
		branch['renderQueue'](function() {
			requestData = compileRequestData(branch, makeNewLink, openApp);
			branch_view.handleBranchViewData(branch._server, branchViewData, requestData, branch._storage, data['has_app'], testFlag, branch);
		});
	}
	else {
		branch._publishEvent('willNotShowJourney');
	}
}
