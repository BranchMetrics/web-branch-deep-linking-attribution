'use strict';
goog.provide('journeys_utils');

goog.require('banner_utils');
goog.require('safejson');

// defaults. These will change based on banner info
journeys_utils.position = 'top';
journeys_utils.sticky = 'absolute';
journeys_utils.bannerHeight = '76px';
journeys_utils.isFullPage = false;
journeys_utils.divToInjectParent = document.body;

// used to set height of full page interstitials
journeys_utils.windowHeight = window.innerHeight;
journeys_utils.windowWidth = window.innerWidth;

// Regex to find these pieces of the html blob
journeys_utils.jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
journeys_utils.jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
journeys_utils.cssRe = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
journeys_utils.spacerRe = /#branch-banner-spacer {((.|\s)*?)}/;
journeys_utils.findMarginRe = /margin-bottom: (.*?);/;

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
		journeys_utils.isFUllPage = true;
	} 
}


journeys_utils.getMetadata = function(html) {
	var match = html.match(journeys_utils.jsonRe);
	if(match) {
		var src = match[1];
		return safejson.parse(src);
	}
}

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

// need to find div and parent to properly add margin
journeys_utils.findInsertionDiv = function(parent, metadata) {
	if (metadata && metadata.injectorSelector) {
		var parentTrap = document.querySelector(metadata.injectorSelector);
		if (parentTrap) {
			parent = parentTrap;
			parent.innerHTML = '';
			journeys_utils.divToInjectParent = parent.parentElement;
			journeys_utils.position = 'top';
			return parent;
		}
		else {
			return null;
		}
	}
}

journeys_utils.getCss = function(html) {
	var match = html.match(journeys_utils.cssRe);
	if (match) {
		return match[1];
	}
}

journeys_utils.getJsAndAddToParent = function(html) {
	var match = html.match(journeys_utils.jsRe);
	if(match) {
		var src = match[1];
		var script = document.createElement('script');
		script.innerHTML = src;
		document.body.appendChild(script);
	}
}

// remove everything from html blob except html
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

// for now always append to body. Later we will support inserting
journeys_utils.createAndAppendIframe = function(divToInject) {
	var iframe = document.createElement('iframe');
	iframe.src = 'about:blank'; // solves CORS issues, test in IE
	iframe.style.overflow = 'hidden';
	iframe.scrolling = 'no';
	iframe.id = 'branch-banner-iframe';
	iframe.className = 'branch-animation';

	document.body.appendChild(iframe);

	return iframe;
}

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

journeys_utils.addHtmlToIframe = function(iframe, iframeHTML) {
	iframe.contentWindow.document.open();
	iframe.contentWindow.document.write(iframeHTML);
	iframe.contentWindow.document.close();
}

// this is the css that positions iframe on the page
journeys_utils.addIframeOuterCSS = function() {
	var iFrameCSS = document.createElement('style');
	iFrameCSS.type = 'text/css';
	iFrameCSS.id = 'branch-iframe-css';

	var bodyMargin = '';
	var bodyMarginTopComputed = banner_utils.getBodyStyle('margin-top');
	if (bodyMarginTopComputed) { bodyMarginTopComputed = +bodyMarginTopComputed.slice(0, -2); }
	var bodyMarginBottomComputed = banner_utils.getBodyStyle('margin-bottom');
	if (bodyMarginBottomComputed) { bodyMarginBottomComputed = +bodyMarginBottomComputed.slice(0, -2); }
	var bannerMarginNumber = +journeys_utils.bannerHeight.slice(0, -2);

	if (journeys_utils.position === 'top') {
		var calculatedBodyMargin = +bannerMarginNumber + bodyMarginTopComputed;
		bodyMargin = 'margin-top: ' + calculatedBodyMargin + 'px';
	}
	else if (journeys_utils.position === 'bottom') {
		var calculatedBodyMargin = +bannerMarginNumber + bodyMarginBottomComputed;
		bodyMargin = 'margin-bottom: ' + calculatedBodyMargin + 'px';
	}

	// adds margin to the parent of div being inserted into
	if (journeys_utils.divToInjectParent !== document.body) {
		journeys_utils.divToInjectParent.style.marginTop = journeys_utils.bannerHeight
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
				(journeys_utils.isFUllPage ? journeys_utils.windowWidth + 'px' : journeys_utils.bannerHeight) +
				'; }\n' + 
			'#branch-banner-iframe { height: ' +
				(journeys_utils.isFUllPage ? journeys_utils.windowWidth + 'px' : journeys_utils.bannerHeight) +
				'; }';
	document.head.appendChild(iFrameCSS);
}

// this adds the css that was previously stripped from html blob
journeys_utils.addIframeInnerCSS = function(iframe, innerCSS) {
	var css = document.createElement('style');
	css.type = 'text/css';
	css.id = 'branch-css';
	css.innerHTML = innerCSS;

	var doc = iframe.contentWindow.document;
	doc.head.appendChild(css);

	if (journeys_utils.position === 'top') {
		iframe.style.top = '-' + journeys_utils.bannerHeight;
	}
	else if (journeys_utils.position === 'bottom') {
		iframe.style.bottom = '-' + journeys_utils.bannerHeight;
	}
}

journeys_utils.addDynamicCtaText = function(iframe, ctaText) {
	var doc = iframe.contentWindow.document;
	doc.getElementById('branch-mobile-action').innerHTML = ctaText;
}

journeys_utils.animateBannerEntrance = function(banner) {
	var bodyMarginTopComputed = banner_utils.getBodyStyle('margin-top');
	var bodyMarginTopInline = document.body.style.marginTop;
	var bodyMarginBottomComputed = banner_utils.getBodyStyle('margin-bottom');
	var bodyMarginBottomInline = document.body.style.marginBottom;

	banner_utils.addClass(document.body, 'branch-banner-is-active');
	// if (journeys_utils.position === 'top') {
	// 	document.body.style.marginTop = journeys_utils.bannerHeight;
	// }
	// else if (journeys_utils.position === 'bottom') {
	// 	document.body.style.marginBottom = journeys_utils.bannerHeight;
	// }

	function onAnimationEnd() {
		if (journeys_utils.position === 'top') {
			banner.style.top = '0';
		}
		else if (journeys_utils.position === 'bottom') {
			banner.style.bottom = '0';
		}
	}

	setTimeout(onAnimationEnd, banner_utils.animationDelay);
}

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

journeys_utils.finalHookups = function(branchViewData, storage, cta, banner, hideBanner) {
	if(!cta || !banner) {
		return;
	}

	var doc = banner.contentWindow.document;

	var actionEls = doc.querySelectorAll('#branch-mobile-action');
	Array.prototype.forEach.call(actionEls, function(el) {
		el.addEventListener('click', function(e) {
			cta();
			journeys_utils.animateBannerExit(banner);
		})
	})
	var cancelEls = doc.querySelectorAll('.branch-banner-continue');
	Array.prototype.forEach.call(cancelEls, function(el) {
		el.addEventListener('click', function(e) {
			journeys_utils.animateBannerExit(banner);
			storage.set('hideBanner' + branchViewData["id"], hideBanner, true);
		})
	})
	cancelEls = doc.querySelectorAll('.branch-banner-close');
	Array.prototype.forEach.call(cancelEls, function(el) {
		el.addEventListener('click', function(e) {
			journeys_utils.animateBannerExit(banner);
			storage.set('hideBanner' + branchViewData["id"], hideBanner, true);
		})
	})
}

journeys_utils.animateBannerExit = function(banner) {
	if (journeys_utils.position === 'top') {
		banner.style.top = '-' + journeys_utils.bannerHeight;
	}
	else if (journeys_utils.position === 'bottom') {
		banner.style.bottom = '-' + journeys_utils.bannerHeight;
	}
	setTimeout(function() {
		banner_utils.removeElement(banner);
		banner_utils.removeElement(document.getElementById('branch-css'));
	}, banner_utils.animationSpeed + banner_utils.animationDelay);

	setTimeout(function() {
		if (journeys_utils.position === 'top') {
			document.body.style.marginTop = 0;
		}
		else if (journeys_utils.position === 'bottom') {
			document.body.style.marginBottom = 0;
		}
		banner_utils.removeClass(document.body, 'branch-banner-is-active');
	}, banner_utils.animationDelay);
}