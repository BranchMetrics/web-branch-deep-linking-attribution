'use strict';
goog.provide('journeys_utils');

goog.require('banner_utils');
goog.require('safejson');

// defaults. These will change based on banner info
journeys_utils.position = 'top';
journeys_utils.bannerHeight = '76px';

// Regex to find these pieces of the html blob
journeys_utils.jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
journeys_utils.jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
journeys_utils.cssRe = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
journeys_utils.spacerRe = /#branch-banner-spacer {((.|\s)*?)}/;
journeys_utils.findMarginRe = /margin-bottom: (.*?);/;

journeys_utils.setPositionAndHeight = function(html) {
	var metadata = journeys_utils.getMetadata(html);

	if (metadata && metadata['bannerHeight'] && metadata['position']) {
		journeys_utils.bannerHeight = metadata['bannerHeight'];
		journeys_utils.position = metadata['position'] || journeys_utils.position;
	}
	else {
		var spacerMatch = html.match(journeys_utils.spacerRe)
		if (spacerMatch) {
			journeys_utils.position = 'top';
			var heightMatch = spacerMatch[1].match(journeys_utils.findMarginRe);
			if (heightMatch) {
				journeys_utils.bannerHeight = heightMatch[1];
			}
		}
		else {
			journeys_utils.position = 'bottom';
		}
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

journeys_utils.findInsertionDiv = function(parent, metadata) {
	if (metadata && metadata.injectorSelector) {
		var parentTrap = document.querySelector(metadata.injectorSelector);
		if (parentTrap) {
			parent = parentTrap;
			parent.innerHTML = '';
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


// need to recreate the banner_css helpers
journeys_utils.addIframeOuterCSS = function() {
	var iFrameCSS = document.createElement('style');
	iFrameCSS.type = 'text/css';
	iFrameCSS.id = 'branch-iframe-css';
	iFrameCSS.innerHTML = 	
		'body { -webkit-transition: all ' +
			(banner_utils.animationSpeed * 1.5 / 1000) +
			's ease; transition: all 0' +
			(banner_utils.animationSpeed * 1.5 / 1000) +
			's ease; }\n' +
		'#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); width: 1px; min-width:100%;' +
			' left: 0; right: 0; border: 0; height: ' +
			journeys_utils.bannerHeight +
			'; z-index: 99999; -webkit-transition: all ' +
			(banner_utils.animationSpeed / 1000) +
			's ease; transition: all 0' +
			(banner_utils.animationSpeed / 1000) +
			's ease; }\n' + 
		'#branch-banner-iframe { position: ' +
			((journeys_utils.position === 'top') ? 'absolute' : 'fixed') +
			'; }\n';
	document.head.appendChild(iFrameCSS);
}

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
	if (journeys_utils.position === 'top') {
		document.body.style.marginTop = journeys_utils.bannerHeight;
	}
	else if (journeys_utils.position === 'bottom') {
		document.body.style.marginBottom = journeys_utils.bannerHeight;
	}

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