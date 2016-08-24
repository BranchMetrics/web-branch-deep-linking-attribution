'use strict';
goog.provide('journeys_utils');

goog.require('banner_utils');
goog.require('safejson');

journeys_utils.position = 'top';
journeys_utils.bannerHeight = '76px';

journeys_utils.getPositionAndHeight = function(html) {
	
}


journeys_utils.getMetadata = function(html) {
	var	re = /<script type="application\/json">((.|\s)*?)<\/script>/;
	var match = html.match(re);
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
	var re = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
	var match = html.match(re);
	if (match) {
		return match[1];
	}
}

journeys_utils.getJsAndAddToParent = function(html) {
	var re = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
	var match = html.match(re);
	if(match) {
		var src = match[1];
		var script = document.createElement('script');
		script.innerHTML = src;
		document.body.appendChild(script);
	}
}

journeys_utils.removeScriptAndCss = function(html) {
	var	jsonRe = /<script type="application\/json">((.|\s)*?)<\/script>/;
	var jsRe = /<script type="text\/javascript">((.|\s)*?)<\/script>/;
	var cssRe = /<style type="text\/css" id="branch-css">((.|\s)*?)<\/style>/;
	var matchJson = html.match(jsonRe);
	var matchJs = html.match(jsRe);
	var matchCss = html.match(cssRe);
	if(matchJson) {
		html = html.replace(jsonRe,'');
	}
	if(matchJs) {
		html = html.replace(jsRe,'');
	}
	if(matchCss) {
		html = html.replace(cssRe,'');
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
journeys_utils.addIframeOuterCSS = function(position, bannerHeight) {
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
			bannerHeight +
			'; z-index: 99999; -webkit-transition: all ' +
			(banner_utils.animationSpeed / 1000) +
			's ease; transition: all 0' +
			(banner_utils.animationSpeed / 1000) +
			's ease; }\n' + 
		'#branch-banner-iframe { position: ' +
			((position === 'top') ? 'absolute' : 'fixed') +
			'; }\n';
	document.head.appendChild(iFrameCSS);
}

journeys_utils.addIframeInnerCSS = function(iframe, innerCSS, position, height) {
	var css = document.createElement('style');
	css.type = 'text/css';
	css.id = 'branch-css';
	css.innerHTML = innerCSS;

	var doc = iframe.contentWindow.document;
	doc.head.appendChild(css);

	if (position === 'top') {
		iframe.style.top = '-' + banner_utils.bannerHeight;
	}
	else if (position === 'bottom') {
		iframe.style.bottom = '-' + banner_utils.bannerHeight;
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
		document.body.style.marginTop =
			banner_utils.addCSSLengths(banner_utils.bannerHeight, bodyMarginTopComputed);
	}
	else if (journeys_utils.position === 'bottom') {
		document.body.style.marginBottom =
			banner_utils.addCSSLengths(banner_utils.bannerHeight, bodyMarginBottomComputed);
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
	var re = /<script type="application\/json">((.|\s)*?)<\/script>/;
	var match = html.match(re);

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
	banner.style.top = '-' + journeys_utils.bannerHeight;
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