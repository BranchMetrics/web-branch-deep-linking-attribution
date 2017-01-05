'use strict';
goog.provide('journeys_utils');

goog.require('banner_utils');
goog.require('safejson');

// defaults. These will change based on banner info
journeys_utils.position = 'top';
journeys_utils.sticky = 'absolute';
journeys_utils.bannerHeight = '76px';
journeys_utils.isFullPage = false;
journeys_utils.isHalfPage = false;
journeys_utils.divToInjectParent = document.body;

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

journeys_utils.branch = null;

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
 * @param {Boolean} hasApp
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
	if (metadata && metadata['injectorSelector']) {
		var parentTrap = document.querySelector(metadata['injectorSelector']);
		if (parentTrap) {
			parent = parentTrap;
			parent.innerHTML = '';
			journeys_utils.divToInjectParent = parent.parentElement;
			return parent;
		}
		else {
			return null;
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
	if(matchJson) {
		html = html.replace(journeys_utils.jsonRe,'');
	}
	if(matchJs) {
		html = html.replace(journeys_utils.jsRe,'');
	}
	if(matchCss) {
		html = html.replace(journeys_utils.cssRe,'');
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
		bodyMargin = 'margin-top: ' + calculatedBodyMargin + 'px';
	}
	else if (journeys_utils.position === 'bottom') {
		var calculatedBodyMargin = +bannerMarginNumber + bodyMarginBottomNumber;
		bodyMargin = 'margin-bottom: ' + calculatedBodyMargin + 'px';
	}

	// adds margin to the parent of div being inserted into
	if (journeys_utils.divToInjectParent !== document.body) {
		// dont want to add margin for full page fixed
		var isFixedNavFullPage;
		var computedParentStyle = window.getComputedStyle(journeys_utils.divToInjectParent);
		if (computedParentStyle) {
			isFixedNavFullPage = journeys_utils.isFullPage && computedParentStyle.getPropertyValue('position') === 'fixed';
		}
		if (!isFixedNavFullPage) {
			journeys_utils.divToInjectParent.style.marginTop = journeys_utils.bannerHeight
		}
	}

	iFrameCSS.innerHTML = 	
		'body { -webkit-transition: all ' +
			(banner_utils.animationSpeed * 1.5 / 1000) +
			's ease; transition: all 0' +
			(banner_utils.animationSpeed * 1.5 / 1000) +
			's ease; ' +
			(bodyMargin) +
			'; }\n' +
		'#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%;' +
			' left: 0; right: 0; border: 0; height: ' +
			journeys_utils.bannerHeight +
			'; z-index: 99999; -webkit-transition: all ' +
			(banner_utils.animationSpeed / 1000) +
			's ease; transition: all 0' +
			(banner_utils.animationSpeed / 1000) +
			's ease; }\n' + 
		'#branch-banner-iframe { position: ' +
			(journeys_utils.sticky) +
			'; }\n' + 
		'@media only screen and (orientation: landscape) { ' +
			'body { ' + (journeys_utils.position === 'top' ? 'margin-top: ' : 'margin-bottom: ' ) + 
				(journeys_utils.isFullPage ? journeys_utils.windowWidth + 'px' : journeys_utils.bannerHeight) +
				'; }\n' + 
			'#branch-banner-iframe { height: ' +
				(journeys_utils.isFullPage ? journeys_utils.windowWidth + 'px' : journeys_utils.bannerHeight) +
				'; }';
	document.head.appendChild(iFrameCSS);
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

	function onAnimationEnd() {
		if (journeys_utils.position === 'top') {
			banner.style.top = '0';
		}
		else if (journeys_utils.position === 'bottom') {
			banner.style.bottom = '0';
		}
        journeys_utils.branch._publishEvent('didShowJourney');
	}
	setTimeout(onAnimationEnd, banner_utils.animationDelay);
}

/***
 * @function journeys_utils.findDismissPeriod
 * @param {string} html
 *
 * Checks template metadata to dermine how long to not show banner when dismissed
 */
journeys_utils.findDismissPeriod = function(html) {
	var dismissPeriod;
	var match = html.match(journeys_utils.jsonRe);
	if (match) {
		var src = match[1];
		var metadata = safejson.parse(src);
		if (metadata && metadata['dismissPeriod']) {
			dismissPeriod = metadata['dismissPeriod'];
		}
	}

	dismissPeriod = typeof dismissPeriod === 'number' ? dismissPeriod : 7;
	var hideBanner = dismissPeriod === -1
		? true
		: banner_utils.getDate(dismissPeriod)

	return hideBanner
}

/***
 * @function journeys_utils.finalHookups
 * @param {Object} branchViewData
 * @param {Object} storage
 * @param {function()} cta
 * @param {Object} banner
 * @param {number} hideBanner - how long to hide the banner for when dismissed
 * 
 * hooks up the call to action and dismiss buttons
 */
journeys_utils.finalHookups = function(branchViewData, storage, cta, banner, hideBanner) {
	if(!cta || !banner) {
		return;
	}

	var doc = banner.contentWindow.document;

	var actionEls = doc.querySelectorAll('#branch-mobile-action');
	Array.prototype.forEach.call(actionEls, function(el) {
		el.addEventListener('click', function(e) {
            journeys_utils.branch._publishEvent('didClickJourneyCTA');
            cta();
			journeys_utils.animateBannerExit(banner);
		})
	})
	var cancelEls = doc.querySelectorAll('.branch-banner-continue');
	Array.prototype.forEach.call(cancelEls, function(el) {
		el.addEventListener('click', function(e) {
            journeys_utils.branch._publishEvent('didClickJourneyContinue');
            journeys_utils.animateBannerExit(banner);
			storage.set('hideBanner' + branchViewData["id"], hideBanner, true);
		})
	})
	cancelEls = doc.querySelectorAll('.branch-banner-close');
	Array.prototype.forEach.call(cancelEls, function(el) {
		el.addEventListener('click', function(e) {
            journeys_utils.branch._publishEvent('didClickJourneyClose');
            journeys_utils.animateBannerExit(banner);
			storage.set('hideBanner' + branchViewData["id"], hideBanner, true);
		})
	})
}

/***
 * @function journeys_utils.animateBannerExit
 * @param {Object} banner
 */
journeys_utils.animateBannerExit = function(banner) {
	if (journeys_utils.position === 'top') {
		banner.style.top = '-' + journeys_utils.bannerHeight;
	}
	else if (journeys_utils.position === 'bottom') {
		banner.style.bottom = '-' + journeys_utils.bannerHeight;
	}
    journeys_utils.branch._publishEvent('willCloseJourney');
	setTimeout(function() {
		banner_utils.removeElement(banner);
		banner_utils.removeElement(document.getElementById('branch-css'));
        journeys_utils.branch._publishEvent('didCloseJourney');
	}, banner_utils.animationSpeed + banner_utils.animationDelay);

	setTimeout(function() {
		if (journeys_utils.position === 'top') {
			document.body.style.marginTop = journeys_utils.bodyMarginTop;
		}
		else if (journeys_utils.position === 'bottom') {
			document.body.style.marginBottom = journeys_utils.bodyMarginBottom;
		}
		banner_utils.removeClass(document.body, 'branch-banner-is-active');
	}, banner_utils.animationDelay);

	if (journeys_utils.divToInjectParent !== document.body) {
		journeys_utils.divToInjectParent.style.marginTop = 0;
	}	
}