'use strict';
goog.provide('journeys_utils');

goog.require('banner_utils');
goog.require('safejson');
goog.require('utils');

journeys_utils._callback_index = 1;

// defaults. These will change based on banner info
journeys_utils.position = 'top';
journeys_utils.sticky = 'absolute';
journeys_utils.bannerHeight = '76px';
journeys_utils.isFullPage = false;
journeys_utils.isHalfPage = false;
journeys_utils.divToInjectParents = [];

// used to set height of full page interstitials
journeys_utils.windowHeight = window.innerHeight;
journeys_utils.windowWidth = window.innerWidth;
// if the device is landscape
if (window.innerHeight < window.innerWidth) {
	journeys_utils.windowHeight = window.innerWidth;
	journeys_utils.windowWidth = window.innerHeight;
}

// calculated later to determine how far to push down body content
journeys_utils.bodyMarginTop = 0;
journeys_utils.bodyMarginBottom = 0;

// Regex to find pieces of the html blob
journeys_utils.jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
journeys_utils.jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
journeys_utils.cssRe = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
journeys_utils.spacerRe = /#branch-banner-spacer {((.|\s)*?)}/;
journeys_utils.findMarginRe = /margin-bottom: (.*?);/;
journeys_utils.journeyLinkDataRe =  /<script id="journeyLinkData" type="application\/json">((.|\s)*?)<\/script>/;

journeys_utils.branch = null;
journeys_utils.banner = null;
journeys_utils.isJourneyDisplayed = false;

journeys_utils.animationSpeed = 250;
journeys_utils.animationDelay = 20;

// options to control a Journey's animations
journeys_utils.exitAnimationDisabled = false;
journeys_utils.entryAnimationDisabled = false;

// set to true when user taps on Journey's close icon, continue button or CTA
journeys_utils.journeyDismissed = false;

// properties used to determine the removal of additional whitespace above Journey if position changes from 'top' to 'bottom'
journeys_utils.exitAnimationDisabledPreviously = false;
journeys_utils.previousPosition = '';
journeys_utils.previousDivToInjectParents = [];

// holds data from Journey that is currently being viewed & data from setBranchViewData()
journeys_utils.journeyLinkData = null;

/***
 * @function journeys_utils.setPositionAndHeight
 * @param {string} html
 *
 * Uses template metadata to set bannerHeight, position, and sticky properties
 * To support old banners, searches the html blob to determine these properties
 * For full page banners, gets view width/height to set fixed pixel values
 */
journeys_utils.setPositionAndHeight = function(html) {
	var metadata = journeys_utils.getMetadata(html);

	if (metadata && metadata['bannerHeight'] && metadata['position'] && metadata['sticky']) {
		journeys_utils.bannerHeight = metadata['bannerHeight'];
		journeys_utils.position = metadata['position'];
		journeys_utils.sticky = metadata['sticky'];
	}
	else { // to support older banners without proper metadata. Spacer div === top
		var spacerMatch = html.match(journeys_utils.spacerRe)
		if (spacerMatch) {
			journeys_utils.position = 'top';
			var heightMatch = spacerMatch[1].match(journeys_utils.findMarginRe);
			if (heightMatch) {
				journeys_utils.bannerHeight = heightMatch[1];
			}
			journeys_utils.sticky = 'absolute';
		}
		else {
			journeys_utils.position = 'bottom';
			journeys_utils.sticky = 'fixed';
		}
	}

	// convert full page to fixed pixel height
	if (journeys_utils.bannerHeight.indexOf('vh') !== -1 || journeys_utils.bannerHeight.indexOf('%') !== -1) {
		var heightNumber = journeys_utils.bannerHeight.indexOf('vh')
			? journeys_utils.bannerHeight.slice(0, -2)
			: journeys_utils.bannerHeight.slice(0, -1);
		journeys_utils.bannerHeight = (heightNumber/100) * journeys_utils.windowHeight + 'px';
		if (heightNumber < 100) {
			journeys_utils.isHalfPage = true;
		}
		else {
			journeys_utils.isFullPage = true;
		}
	}
}

/***
 * @function journeys_utils.getMetadata
 * @param {string} html
 */
journeys_utils.getMetadata = function(html) {
	var match = html.match(journeys_utils.jsonRe);
	if(match) {
		var src = match[1];
		return safejson.parse(src);
	}
}

/***
 * @function journeys_utils.getCtaText
 * @param {Object} metadata
 * @param {boolean} hasApp
 */
journeys_utils.getCtaText = function(metadata, hasApp) {
	var ctaText;

	if(hasApp && metadata && metadata['ctaText'] && metadata['ctaText']['has_app']) {
		ctaText = metadata['ctaText']['has_app'];
	}
	else if(metadata && metadata['ctaText'] && metadata['ctaText']['no_app']) {
		ctaText = metadata['ctaText']['no_app'];
	}

	return ctaText;
}

/***
 * @function journeys_utils.findInsertionDiv
 * @param {Object} parent - A dom element or document.body
 * @param {Object} metadata
 */
journeys_utils.findInsertionDiv = function(parent, metadata) {
	journeys_utils.divToInjectParents = [];

	if (metadata && metadata['injectorSelector']) {
		var injectors = document.querySelectorAll(metadata['injectorSelector']);
		if (injectors) {
			for(var i = 0; i < injectors.length; i++) {
				journeys_utils.divToInjectParents.push(injectors[i].parentElement);
			}
		}
	}
}

/***
 * @function journeys_utils.getCss
 * @param {string} html
 */
journeys_utils.getCss = function(html) {
	var match = html.match(journeys_utils.cssRe);
	if (match) {
		return match[1];
	}
}

/***
 * @function journeys_utils.getJsAndAddToParent
 * @param {string} html
 *
 * take the js from template and add to document.body
 */
journeys_utils.getJsAndAddToParent = function(html) {
	var match = html.match(journeys_utils.jsRe);
	if(match) {
		var src = match[1];
		var script = document.createElement('script');
		script.id = 'branch-journey-cta';
		utils.addNonceAttribute(script);
		script.innerHTML = src;
		document.body.appendChild(script);
	}
}

/***
 * @function journeys_utils.removeScriptAndCss
 * @param {string} html
 *
 * After extracting js and css from html blob, we should remove it.
 * We will use the remaining html to add to iframe
 */
journeys_utils.removeScriptAndCss = function(html) {
	var matchJson = html.match(journeys_utils.jsonRe);
	var matchJs = html.match(journeys_utils.jsRe);
	var matchCss = html.match(journeys_utils.cssRe);
	var matchJourneyLinkData = html.match(journeys_utils.journeyLinkDataRe);

	if(matchJson) {
		html = html.replace(journeys_utils.jsonRe,'');
	}
	if(matchJs) {
		html = html.replace(journeys_utils.jsRe,'');
	}
	if(matchCss) {
		html = html.replace(journeys_utils.cssRe,'');
	}
	if (matchJourneyLinkData) {
		html = html.replace(journeys_utils.journeyLinkDataRe, '');
	}

	return html;
}

/***
 * @function journeys_utils.createAndAppendIframe
 */
journeys_utils.createAndAppendIframe = function() {
	var iframe = document.createElement('iframe');
	iframe.src = 'about:blank'; // solves CORS issues, test in IE
	iframe.style.overflow = 'hidden';
	iframe.scrolling = 'no';
	iframe.id = 'branch-banner-iframe';
	iframe.className = 'branch-animation';
	iframe.title = 'Branch Banner'
	iframe.setAttribute('aria-label', 'Branch Banner');
	utils.addNonceAttribute(iframe);

	document.body.appendChild(iframe);

	return iframe;
}

/***
 * @function journeys_utils.createIframeInnerHTML
 * @param {string} html
 * @param {string} userAgent
 */
journeys_utils.createIframeInnerHTML = function(html, userAgent) {
	var bodyClass;
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
		'">' +
		html +
		'</body></html>';

	return iframeHTML;
}

/***
 * @function journeys_utils.addHtmlToIframe
 * @param {Object} iframe - iframe node created in previous step
 * @param {string} iframeHTML
 */
journeys_utils.addHtmlToIframe = function(iframe, iframeHTML) {
	iframe.contentWindow.document.open();
	iframe.contentWindow.document.write(iframeHTML);
	iframe.contentWindow.document.close();
}

/***
 * @function journeys_utils.addIframeOuterCSS
 *
 * Creates a style element on document.body and adds CSS that will determine
 * banner position, height and sticky.
 */
journeys_utils.addIframeOuterCSS = function() {
	var iFrameCSS = document.createElement('style');
	iFrameCSS.type = 'text/css';
	iFrameCSS.id = 'branch-iframe-css';

	var bodyMargin = '';
	journeys_utils.bodyMarginTop = banner_utils.getBodyStyle('margin-top');
	var bodyMarginTopNumber = +journeys_utils.bodyMarginTop.slice(0, -2);
	journeys_utils.bodyMarginBottom = banner_utils.getBodyStyle('margin-bottom');
	var bodyMarginBottomNumber = +journeys_utils.bodyMarginBottom.slice(0, -2);
	var bannerMarginNumber = +journeys_utils.bannerHeight.slice(0, -2);

	if (journeys_utils.position === 'top') {
		var calculatedBodyMargin = +bannerMarginNumber + bodyMarginTopNumber;
		document.body.style.marginTop = calculatedBodyMargin.toString() + 'px';
	}
	else if (journeys_utils.position === 'bottom') {
		var calculatedBodyMargin = +bannerMarginNumber + bodyMarginBottomNumber;
		document.body.style.marginBottom = calculatedBodyMargin.toString() + 'px';
	}

	// adds margin to the parent of div being inserted into
	if (journeys_utils.divToInjectParents.length > 0) {
		// dont want to add margin for full page fixed
		journeys_utils.divToInjectParents.forEach(function(parent) {
			var isFixedNavFullPage;
			var computedParentStyle = window.getComputedStyle(parent);
			if (computedParentStyle) {
				isFixedNavFullPage = journeys_utils.isFullPage && computedParentStyle.getPropertyValue('position') === 'fixed';
			}
			if (!isFixedNavFullPage) {
				parent.style.marginTop = journeys_utils.bannerHeight;
			}
		})
	}

	// determines the removal of additional whitespace above Journey if position changes from 'top' to 'bottom'
	if (journeys_utils.previousPosition === "top" &&
		journeys_utils.previousPosition !== journeys_utils.position &&
		journeys_utils.exitAnimationDisabledPreviously &&
		journeys_utils.previousDivToInjectParents &&
		journeys_utils.previousDivToInjectParents.length > 0) {

		journeys_utils.previousDivToInjectParents.forEach(function (parent) {
			parent.style.marginTop = 0;
		});
	}

	// resets properties to related to the case above
	// note: these properties are set in journeys_utils.animateBannerExit()
	journeys_utils.exitAnimationDisabledPreviously = false;
	journeys_utils.previousPosition = '';
	journeys_utils.previousDivToInjectParents = [];

	journeys_utils.journeyDismissed = false;

	iFrameCSS.innerHTML = generateIframeOuterCSS();

	utils.addNonceAttribute(iFrameCSS);

	document.head.appendChild(iFrameCSS);
}

function generateIframeOuterCSS() {
	var bodyWebkitTransitionStyle = '';
	var iFrameAnimationStyle = '';

	// Resets previous transition styles
	document.body.style.transition = '';
	if (document.getElementById('branch-banner-iframe')) {
		document.getElementById('branch-banner-iframe').style.transition = '';
	}

	// If entry animation is not disabled, then animate Journey entry
	if (!journeys_utils.entryAnimationDisabled) {
		bodyWebkitTransitionStyle = 'body { -webkit-transition: all ' + (journeys_utils.animationSpeed * 1.5 / 1000) + 's ease; }\n';
		document.body.style.transition = 'all 0' + (journeys_utils.animationSpeed * 1.5 / 1000) + 's ease';
		iFrameAnimationStyle = '-webkit-transition: all ' + (journeys_utils.animationSpeed / 1000) + 's ease; ' +
						'transition: all 0' + (journeys_utils.animationSpeed / 1000) + 's ease;';
	}

	var css = bodyWebkitTransitionStyle ? bodyWebkitTransitionStyle : ''; // add if we need to
	css += '#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%;' +
	' left: 0; right: 0; border: 0; height: ' +
	journeys_utils.bannerHeight + '; z-index: 99999; ' +
	iFrameAnimationStyle  + ' }\n' +
	'#branch-banner-iframe { position: ' +
	(journeys_utils.sticky) + '; }\n' +
	'@media only screen and (orientation: landscape) { ' +
	'body { ' + (journeys_utils.position === 'top' ? 'margin-top: ' : 'margin-bottom: ' ) +
	(journeys_utils.isFullPage ? journeys_utils.windowWidth + 'px' : journeys_utils.bannerHeight) + '; }\n' +
	'#branch-banner-iframe { height: ' +
	(journeys_utils.isFullPage ? journeys_utils.windowWidth + 'px' : journeys_utils.bannerHeight) + '; }';
	return css;
}

/***
 * @function journeys_utils.addIframeInnerCSS
 * @param {Object} iframe - iframe node
 * @param {string} innerCSS
 *
 * Adds css that was stripped from html blob to the iframe element
 */
journeys_utils.addIframeInnerCSS = function(iframe, innerCSS) {
	var css = document.createElement('style');
	css.type = 'text/css';
	css.id = 'branch-css';
	css.innerHTML = innerCSS;

	utils.addNonceAttribute(css);

	var doc = iframe.contentWindow.document;
	doc.head.appendChild(css);

	// if banner is partial height with relative units, we need to make sure
	// it fills the entire height of the iframe
	if (journeys_utils.isHalfPage || journeys_utils.isFullPage) {
		var content = doc.getElementsByClassName('branch-banner-content')[0];
		if (content) {
			content.style.height = journeys_utils.bannerHeight;
		}
	}

	if (journeys_utils.position === 'top') {
		iframe.style.top = '-' + journeys_utils.bannerHeight;
	}
	else if (journeys_utils.position === 'bottom') {
		iframe.style.bottom = '-' + journeys_utils.bannerHeight;
	}

	// remove box shadow if no content background color
	// this is to allow floating button to work
	try {
		// get computed background-color of .branch-banner-content
		var content = doc.getElementsByClassName('branch-banner-content')[0]
		var contentComputedStyle = window.getComputedStyle(content)
		var bg = contentComputedStyle.getPropertyValue('background-color')
		var arr = bg.split(', ')
		// if the alpha === 0, remove the box shadow
		if (arr[3] && parseFloat(arr[3]) === 0) {
			iframe.style.boxShadow = "none";
		}
	} catch(err) {};
}

/***
 * @function journeys_utils.addDynamicCtaText
 * @param {Object} iframe
 * @param {string} ctaText
 */
journeys_utils.addDynamicCtaText = function(iframe, ctaText) {
	var doc = iframe.contentWindow.document;
	doc.getElementById('branch-mobile-action').innerHTML = ctaText;
}

/***
 * @function journeys_utils.animateBannerEntrance
 * @param {Object} banner
 */
journeys_utils.animateBannerEntrance = function(banner) {
	banner_utils.addClass(document.body, 'branch-banner-is-active');
	if (journeys_utils.isFullPage && journeys_utils.sticky === 'fixed') {
		banner_utils.addClass(document.body, 'branch-banner-no-scroll');
	}

	function onAnimationEnd() {
		if (journeys_utils.position === 'top') {
			banner.style.top = '0';
		}
		else if (journeys_utils.position === 'bottom') {
			banner.style.bottom = '0';
		}
        journeys_utils.branch._publishEvent('didShowJourney', journeys_utils.journeyLinkData);
		journeys_utils.isJourneyDisplayed = true;
	}
	setTimeout(onAnimationEnd, journeys_utils.animationDelay);
}

journeys_utils._addSecondsToDate = function(seconds) {
	var currentDate = new Date();
	return currentDate.setSeconds(currentDate.getSeconds() + seconds);
}

journeys_utils._findGlobalDismissPeriod = function(metadata) {
	var globalDismissPeriod = metadata['globalDismissPeriod'];
	if (typeof globalDismissPeriod === 'number') {
		return globalDismissPeriod === -1
			? true
			: journeys_utils._addSecondsToDate(globalDismissPeriod);
	}
}

/***
 * @function journeys_utils.finalHookups
 * @param {string} templateId
 * @param {string} audienceRuleId
 * @param {Object} storage
 * @param {function()} cta
 * @param {Object} banner
 *
 * hooks up the call to action and dismiss buttons
 */
journeys_utils.finalHookups = function(templateId, audienceRuleId, storage, cta, banner, metadata, testModeEnabled, branch_view) {

	if(!cta || !banner) {
		return;
	}

	var doc = banner.contentWindow.document;

	var actionEls = doc.querySelectorAll('#branch-mobile-action');
	Array.prototype.forEach.call(actionEls, function(el) {
		el.addEventListener('click', function(e) {
            	journeys_utils.branch._publishEvent('didClickJourneyCTA', journeys_utils.journeyLinkData);
            	journeys_utils.journeyDismissed = true;
            	cta();
            	journeys_utils.animateBannerExit(banner);
		})
	})
	journeys_utils._setupDismissBehavior('.branch-banner-continue', 'didClickJourneyContinue', storage, banner, templateId, audienceRuleId, metadata, testModeEnabled, branch_view);
	journeys_utils._setupDismissBehavior('.branch-banner-close', 'didClickJourneyClose', storage, banner, templateId, audienceRuleId, metadata, testModeEnabled, branch_view);
}

/**
 * @function journeys_utils._setupDismissBehavior
 * @param  {string} cssSelector
 * @param  {string} eventName
 * @param  {Object} storage
 * @param  {Object} banner
 * @param  {string} templateId
 * @param  {Object} metadata
 * @param  {boolean} testModeEnabled
 *
 * Attach callbacks for dismiss elements on journey
 */
journeys_utils._setupDismissBehavior = function(cssSelector, eventName, storage, banner, templateId, audienceRuleId, metadata, testModeEnabled, branch_view) {
	var doc = banner.contentWindow.document;
	var cancelEls = doc.querySelectorAll(cssSelector);
	Array.prototype.forEach.call(cancelEls, function(el) {
		el.addEventListener('click', function(e) {
			journeys_utils._handleJourneyDismiss(eventName, storage, banner, templateId, audienceRuleId, metadata, testModeEnabled, branch_view);
		});
	});
}

journeys_utils._setJourneyDismiss = function(storage, templateId, audienceRuleId) {
	var journeyDismissals = storage.get('journeyDismissals', true);
	journeyDismissals = journeyDismissals ? safejson.parse(journeyDismissals) : {};
	journeyDismissals[audienceRuleId] = {
		"view_id": templateId,
		"dismiss_time": Date.now()
	};
	storage.set('journeyDismissals', safejson.stringify(journeyDismissals), true);
	return journeyDismissals;
}

journeys_utils._getDismissRequestData = function(branch_view) {
	var metadata = {};
	var hostedDeeplinkData = utils.getHostedDeepLinkData();
	if (hostedDeeplinkData && Object.keys(hostedDeeplinkData).length > 0) {
		metadata['hosted_deeplink_data'] = hostedDeeplinkData;
	}

	return branch_view._getPageviewRequestData(
		journeys_utils._getPageviewMetadata(null, metadata),
		null,
		journeys_utils.branch,
		true
	);
}

journeys_utils._handleJourneyDismiss = function(eventName, storage, banner, templateId, audienceRuleId, metadata, testModeEnabled, branch_view) {
	var globalDismissPeriod = !testModeEnabled
		? journeys_utils._findGlobalDismissPeriod(metadata)
		: 0;
	journeys_utils.branch._publishEvent(eventName, journeys_utils.journeyLinkData);
	journeys_utils.journeyDismissed = true;
	journeys_utils.animateBannerExit(banner);

	if (!testModeEnabled) {
		if (globalDismissPeriod !== undefined) {
			storage.set('globalJourneysDismiss', globalDismissPeriod, true);
		}
		journeys_utils._setJourneyDismiss(storage, templateId, audienceRuleId);
		if (metadata['dismissRedirect']) {
			window.location = metadata['dismissRedirect'];
		} else {
			var listener = function () {
				journeys_utils.branch.removeListener(listener);
				var requestData = journeys_utils._getDismissRequestData(branch_view);
				journeys_utils.branch._api(
					resources.dismiss,
					requestData,
					function (err, data) {
						if (!err && typeof data === "object" && data['template']) {
							if (branch_view.shouldDisplayJourney
								(
									data,
									null,
									false
								)
							) {
								branch_view.displayJourney(
									data['template'],
									requestData,
									requestData['branch_view_id'] || data['event_data']['branch_view_data']['id'],
									data['event_data']['branch_view_data'],
									false
								);
							}
						}
					}
				);
			};
			journeys_utils.branch.addListener('branch_internal_event_didCloseJourney', listener);
		}
	}
}

journeys_utils._getPageviewMetadata = function(options, additionalMetadata) {
	return utils.merge({
		"url": options && options.url || utils.getWindowLocation(),
		"user_agent": navigator.userAgent,
		"language": navigator.language,
		"screen_width": screen.width || -1,
		"screen_height": screen.height || -1
	}, additionalMetadata || {});
};

/***
 * @function journeys_utils.animateBannerExit
 * @param {Object} banner
 * @param {boolean=} dismissedJourneyProgrammatically
 */
journeys_utils.animateBannerExit = function(banner, dismissedJourneyProgrammatically) {
	// adds transitions for Journey exit if they don't exist
	if (journeys_utils.entryAnimationDisabled && !journeys_utils.exitAnimationDisabled) {
		document.body.style.transition = "all 0" + (journeys_utils.animationSpeed * 1.5 / 1000) + "s ease";
		document.getElementById('branch-banner-iframe').style.transition = "all 0" + (journeys_utils.animationSpeed / 1000) + "s ease";

		// ensure that -webkit-transition styles get applied as well
		var iFrameOutterCSSBackup = document.getElementById('branch-iframe-css').innerHTML + '\n';
		iFrameOutterCSSBackup += 'body { -webkit-transition: all ' + (journeys_utils.animationSpeed * 1.5 / 1000) + 's ease; }\n';
		iFrameOutterCSSBackup += '#branch-banner-iframe { -webkit-transition: all ' + (journeys_utils.animationSpeed / 1000) + 's ease; }\n';
		// in order for updated styles to get applied, we have to remove all branch-iframe-css styles
		document.getElementById('branch-iframe-css').innerHTML = "";
		//re-add them here for changes to take effect
		document.getElementById('branch-iframe-css').innerHTML = iFrameOutterCSSBackup;
	}

	if (journeys_utils.position === 'top') {
		banner.style.top = '-' + journeys_utils.bannerHeight;
	}
	else if (journeys_utils.position === 'bottom') {
		banner.style.bottom = '-' + journeys_utils.bannerHeight;
	}

    journeys_utils.branch._publishEvent('willCloseJourney', journeys_utils.journeyLinkData);
	// removes timeout if animation is disabled or uses default timeout
	var speedAndDelay =  journeys_utils.exitAnimationDisabled ? 0 : journeys_utils.animationSpeed + journeys_utils.animationDelay;
	setTimeout(function() {
		// remove banner, branch-css, and branch-iframe-css
		banner_utils.removeElement(banner);
		banner_utils.removeElement(document.getElementById('branch-css'));
		banner_utils.removeElement(document.getElementById('branch-iframe-css'));
		banner_utils.removeElement(document.getElementById('branch-journey-cta'));

		// remove margin from all elements with branch injection div
		if ((!journeys_utils.exitAnimationDisabled || journeys_utils.journeyDismissed) &&
			journeys_utils.divToInjectParents &&
			journeys_utils.divToInjectParents.length > 0) {
			journeys_utils.divToInjectParents.forEach(function(parent) {
				parent.style.marginTop = 0;
			})
		} else {
			journeys_utils.exitAnimationDisabledPreviously = journeys_utils.exitAnimationDisabled;
			journeys_utils.previousPosition = journeys_utils.position;
			journeys_utils.previousDivToInjectParents = journeys_utils.divToInjectParents;
		}

		if (journeys_utils.position === 'top') {
			document.body.style.marginTop = journeys_utils.bodyMarginTop;
		}
		else if (journeys_utils.position === 'bottom') {
			document.body.style.marginBottom = journeys_utils.bodyMarginBottom;
		}

		banner_utils.removeClass(document.body, 'branch-banner-is-active');
		banner_utils.removeClass(document.body, 'branch-banner-no-scroll');

        	journeys_utils.branch._publishEvent('didCloseJourney', journeys_utils.journeyLinkData);
        	if (!dismissedJourneyProgrammatically) {
			journeys_utils.branch._publishEvent('branch_internal_event_didCloseJourney', journeys_utils.journeyLinkData);
		}
        	journeys_utils.isJourneyDisplayed = false;
	}, speedAndDelay);
}

journeys_utils.setJourneyLinkData = function(html) {
	var data = { 'banner_id': journeys_utils.branchViewId };
	var match = html.match(journeys_utils.journeyLinkDataRe);
	if (match) {
		var src = match[1];
		var linkData = '';
		try {
			linkData = safejson.parse(src);
		}
		catch (e) {
		}
		if (linkData) {
			var journeyLinkDataPropertiesToFilterOut = ['browser_fingerprint_id', 'app_id', 'source', 'open_app', 'link_click_id'];
			utils.removePropertiesFromObject(linkData['journey_link_data'], journeyLinkDataPropertiesToFilterOut)
			data = utils.merge(data, linkData);
		}
	}
	journeys_utils.journeyLinkData = data;
}
