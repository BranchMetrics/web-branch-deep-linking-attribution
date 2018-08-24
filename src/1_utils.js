/**
 * Just provides a couple of utilities.
 */
'use strict';

goog.provide('utils');
/*jshint unused:false*/
goog.require('goog.json');
goog.require('config');
goog.require('safejson');

/** @define {boolean} */
var DEBUG = true;

/* jshint ignore:start */
/** @typedef {string} */
var message;

utils.retries = 2; // Value specifying the number of times that a Branch API call can be re-attempted.
utils.retry_delay = 200; // Amount of time in milliseconds to wait before re-attempting a timed-out request to the Branch API.
utils.timeout = 5000; // Duration in milliseconds that the system should wait for a response before considering any Branch API call to have timed out.
utils.nonce = ''; // Nonce value to allow for CSP whitelisting

// Properties and function related to calculating Branch request roundtrip time
utils.instrumentation = {};
utils.navigationTimingAPIEnabled = function() {
	return !!(window.performance && window.performance.timing && window.performance.timing.navigationStart);
};
utils.timeSinceNavigationStart = function() {
	// in milliseconds
	return (Date.now() - window.performance.timing.navigationStart).toString();
};
utils.currentRequestBrttTag = "";
utils.calculateBrtt = function(startTime) {
	if (!startTime || typeof startTime !== "number") {
		return null;
	}
	return (Date.now() - startTime).toString();
};

utils.userPreferences = {
	trackingDisabled: false,
	whiteListedEndpointsWithData: {
		'/v1/open': { 'link_identifier':'\\d+' },
		'/v1/pageview': { 'event': 'pageview' },
		'/v1/dismiss': { 'event': 'dismiss' }
	},
	allowErrorsInCallback: false,
	shouldBlockRequest: function(url, requestData) {
		// Used by 3_api.js to determine whether a request should be blocked
		var urlParser = document.createElement('a');
		urlParser.href = url;
		var urlPath = urlParser.pathname;

		// On Internet Explorer .pathname is returned without a leading '/' whereas on other browsers,
		// a leading slash is available eg. v1/open on IE vs. /v1/open in Chrome
		if (urlPath[0] != '/') {
			urlPath = '/' + urlPath;
		}

		var whiteListedEndpointWithData = utils.userPreferences.whiteListedEndpointsWithData[urlPath];

		if (!whiteListedEndpointWithData) {
			return true;
		}
		else if (Object.keys(whiteListedEndpointWithData).length > 0) {
			if (!requestData) {
				return true;
			}
			// Ensures that required request parameters are available in request data
			for (var key in whiteListedEndpointWithData) {
				var requiredParameterRegex = new RegExp(whiteListedEndpointWithData[key]);
				if (!requestData.hasOwnProperty(key) || !requiredParameterRegex.test(requestData[key])) {
					return true;
				}
			}
		}
		return false;
	}
};

utils.generateDynamicBNCLink = function(branchKey, data) {
	if (!branchKey && !data) {
		return;
	}
	var addKeyAndValueToUrl = function(fallbackUrl, tagName, tagData) {
		var first = fallbackUrl[fallbackUrl.length - 1] === "?";
		var modifiedFallbackURL = first ? fallbackUrl + tagName : fallbackUrl + "&" + tagName;
		modifiedFallbackURL += "=";
		return modifiedFallbackURL + encodeURIComponent(tagData);
	};

	var fallbackUrl = config.link_service_endpoint + '/a/' + branchKey + '?';
	var topLevelKeys = [ "tags", "alias", "channel", "feature", "stage", "campaign", "type", "duration", "sdk", "source", "data" ];
	for (var i = 0; i < topLevelKeys.length; i++) {
		var key = topLevelKeys[i];
		var value = data[key];
		if (value) {
			if (key === "tags" && Array.isArray(value)) {
				for (var index = 0; index < value.length; index++) {
					fallbackUrl = addKeyAndValueToUrl(fallbackUrl, key, value[index]);
				}
			}
			else if (typeof value === "string" && value.length > 0 || typeof value === "number") {
				if (key === "data" && typeof value === "string") {
					value = utils.base64encode(value);
				}
				fallbackUrl = addKeyAndValueToUrl(fallbackUrl, key, value);
			}
		}
	}
	return fallbackUrl;
};

// Removes PII when a user disables tracking
utils.cleanApplicationAndSessionStorage = function(branch) {
	if (branch) {
		// clears PII from global Branch object
		branch.device_fingerprint_id = null;
		branch.sessionLink = null;
		branch.session_id = null;
		branch.identity_id = null;
		branch.identity = null;
		branch.browser_fingerprint_id = null;

		if (branch._deepviewCta) {
			delete branch._deepviewCta;
		}
		if (branch._deepviewRequestForReplay) {
			delete branch._deepviewRequestForReplay;
		}
		branch._storage.remove('branch_view_enabled');
		var data = {};
		// Sets an empty object for branch_session and branch_session_first in local/sessionStorage
		session.set(branch._storage, data, true);
	}
	// a user will need to explicitly opt out from _s cookie
};

/** @typedef {{data:?string, referring_identity:?string, identity:?string, has_app:?boolean}} */
utils.sessionData;

/** @typedef {string} */
utils._httpMethod;

/** @enum {utils._httpMethod} */
utils.httpMethod = {
	POST: 'POST',
	GET: 'GET'
};

/** @typedef {{
 * destination: string,
 * endpoint: string,
 * method: utils._httpMethod,
 * params: ?Object.<string, _validator>,
 * queryPart: ?Object.<string, _validator>,
 * jsonp: ?boolean
 * }} */
utils.resource;

/** @typedef {{listener: function(string, Object):null, event: string}} */
utils.listener;

/* jshint ignore:end */

/** @type {Object<string,message>} */
utils.messages = {
	missingParam: 'API request $1 missing parameter $2',
	invalidType: 'API request $1, parameter $2 is not $3',
	nonInit: 'Branch SDK not initialized',
	initPending: 'Branch SDK initialization pending' +
		' and a Branch method was called outside of the queue order',
	initFailed: 'Branch SDK initialization failed, so further methods cannot be called',
	existingInit: 'Branch SDK already initialized',
	missingAppId: 'Missing Branch app ID',
	callBranchInitFirst: 'Branch.init must be called first',
	timeout: 'Request timed out',
	blockedByClient: 'Request blocked by client, probably adblock',
	missingUrl: 'Required argument: URL, is missing',
	trackingDisabled: 'Requested operation cannot be completed since tracking is disabled',
	deepviewNotCalled: 'Cannot call Deepview CTA, please call branch.deepview() first'
};

/**
 * List of valid banner themes
 * The first theme in the list becomes the default theme if one is not specified
 */
/** @type {Array<string>} */
utils.bannerThemes = [
	"light",
	"dark"
];

/*
 * Getters for location.search and location.hash, so that we can stub this for testing
 */
utils.getLocationSearch = function() {
	return utils.isIframeAndFromSameOrigin() ? window.top.location.search : window.location.search;
};

utils.getLocationHash = function() {
	return utils.isIframeAndFromSameOrigin() ? window.top.location.hash : window.location.hash;
};

/**
 * @param {message} message
 * @param {Array.<*>=} params
 * @param {number=} failCode
 * @param {string=} failDetails
 * @return {string}
 */
utils.message = function(message, params, failCode, failDetails) {
	var msg = message.replace(/\$(\d)/g, function(_, place) {
		return params[parseInt(place, 10) - 1];
	});
	if (failCode) {
		msg += '\n Failure Code:' + failCode;
	}
	if (failDetails) {
		msg += '\n Failure Details:' + failDetails;
	}
	if (DEBUG && console) {
		console.log(msg);
	}
	return msg;
};

/**
 * @param {Object} data
 * @return {utils.sessionData}
 */
utils.whiteListSessionData = function(data) {
	return {
		'data': data['data'] || "",
		'data_parsed': data['data_parsed'] || {},
		'has_app': data['has_app'] || null,
		'identity': data['identity'] || null,
		'referring_identity': data['referring_identity'] || null,
		'referring_link': data['referring_link'] || null
	};
};

/**
 * @param {Object} sessionData
 * @return {Object} retData
 */
utils.whiteListJourneysLanguageData = function(sessionData) {
	var re = /^\$journeys_\S+$/;
	var data = sessionData['data'];
	var retData = {};

	if (!data) {
		return {};
	}

	switch (typeof data) {
		case 'string':
			try {
				data = safejson.parse(data);
			}
			catch (e) {
				data = {};
			}
			break;
		case 'object':
			// do nothing:
			break;
		default:
			data = {};
			break;
	}

	Object.keys(data).forEach(function(key) {
		var found = re.test(key);
		if (found) {
			retData[key] = data[key];
		}
	});

	return retData;
};

/**
 * Abstract away the window.location for better testing
 */
utils.getWindowLocation = function() {
	return utils.isIframe() ? document.referrer : String(window.location);
};

/**
 * Find debugging parameters
 */
utils.getParameterByName = function(name) {
	var url;
	var re;
	var match;
	name = name.replace(/[\[\]]/g, '\\$&');
	url = utils.getWindowLocation();
	re = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
	match = re.exec(url);
	if (!match || !match[2]) {
		return '';
	}
	return decodeURIComponent(match[2].replace(/\+/g, ' '));
};

utils.cleanLinkData = function(linkData) {
	linkData['source'] = 'web-sdk';
	var data = linkData['data'];

	switch (typeof data) {
		case 'string':
			try {
				data = safejson.parse(data);
			}
			catch (e) {
				data = { '_bncNoEval': true };
			}
			break;
		case 'object':
			// do nothing:
			break;
		default:
			data = {};
			break;
	}

	if (!data['$canonical_url']) {
		data['$canonical_url'] = utils.getWindowLocation();
	}
	if (!data['$og_title']) {
		data['$og_title'] = utils.getOpenGraphContent('title');
	}
	if (!data['$og_description']) {
		data['$og_description'] = utils.getOpenGraphContent('description');
	}
	if (!data['$og_image_url']) {
		data['$og_image_url'] = utils.getOpenGraphContent('image');
	}
	if (!data['$og_video']) {
		data['$og_video'] = utils.getOpenGraphContent('video');
	}


	if (typeof data['$desktop_url'] === 'string') {
		data['$desktop_url'] =
			data['$desktop_url']
				.replace(/#r:[a-z0-9-_]+$/i, '')
				.replace(/([\?\&]_branch_match_id=\d+)/, '');
	}

	try {
		safejson.parse(data);
	}
	catch (e) {
		data = goog.json.serialize(data);
	}

	linkData['data'] = data;

	return linkData;
};

/**
 * @param {String} link
 */
utils.getClickIdAndSearchStringFromLink = function(link) {
	if (!link || typeof link !== "string") {
		return "";
	}
	var elem = document.createElement("a");
	elem.href = link;
	function notEmpty(data) {
		return data !== "";
	}
	var pathname = elem.pathname && elem.pathname.split('/').filter(notEmpty);
	return Array.isArray(pathname) && pathname.length ? pathname[ pathname.length - 1 ] + elem.search : elem.search;
};

/**
 * @param {String} link
 */
utils.processReferringLink = function(link) {
	return link ? (link.substring(0, 4) !== 'http' ? config.link_service_endpoint + link : link) : null;
};

/**
 * @param {Object} to
 * @param {Object} from
 */
utils.merge = function(to, from) {
	if (!to || typeof to !== 'object') {
		to = {};
	}
	if (!from || typeof from !== 'object') {
		return to;
	}

	for (var attr in from) {
		if (from.hasOwnProperty(attr)) {
			to[attr] = from[attr];
		}
	}
	return to;
};

/**
 * @param {string} key
 */
utils.hashValue = function(key) {
	try {
		var match = utils.getLocationHash().match(new RegExp(key + ':([^&]*)'));
		if (match && match.length >= 1) {
			return match[1];
		}
	}
	catch (e) {
	}
};

utils.mobileUserAgent = function() {
	var ua = navigator.userAgent;
	if (ua.match(/android/i)) {
		return 'android';
	}
	if (ua.match(/ipad/i)) {
		return 'ipad';
	}
	if (ua.match(/i(os|p(hone|od))/i)) {
		return 'ios';
	}
	if (ua.match(/\(BB[1-9][0-9]*\;/i)) {
		return 'blackberry';
	}
	if (ua.match(/Windows Phone/i)) {
		return 'windows_phone';
	}
	if (
		ua.match(/Kindle/i) ||
		ua.match(/Silk/i) ||
		ua.match(/KFTT/i) ||
		ua.match(/KFOT/i) ||
		ua.match(/KFJWA/i) ||
		ua.match(/KFJWI/i) ||
		ua.match(/KFSOWI/i) ||
		ua.match(/KFTHWA/i) ||
		ua.match(/KFTHWI/i) ||
		ua.match(/KFAPWA/i) ||
		ua.match(/KFAPWI/i)
	) {
		return "kindle";
	}
	return false;
};

function isSafariBrowser(ua) {
	return !!/^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
}

function isGreaterThanVersion(ua, v) {
	v = v || 11;

	var match = /version\/([^ ]*)/i.exec(ua);
	if (match && match[1]) {
		try {
			var version = parseFloat(match[1]);
			if (version >= v) {
				return true;
			}
		} catch (e) {
			return false;
		}
	}
	return false;
}

/**
 * Returns true if browser is safari version 11 or greater
 * @return {boolean}
 */
utils.isSafari11OrGreater = function() {
	var ua = navigator.userAgent;
	var isSafari = isSafariBrowser(ua);

	if (isSafari) {
		return isGreaterThanVersion(ua, 11);
	}

	return false;
};

/**
 * @param {string} key
 */
utils.getParamValue = function(key) {
	try {
		var match = utils.getLocationSearch().substring(1).match(new RegExp(key + '=([^&]*)'));
		if (match && match.length >= 1) {
			return match[1];
		}
	}
	catch (e) {
	}
};

/**
 * @param {string} key_or_id
 */
utils.isKey = function(key_or_id) {
	return key_or_id.indexOf('key_') > -1;
};

/**
 * @param {string} string
 */
utils.snakeToCamel = function(string) {
	var find = /(\-\w)/g;
	var convert = function(matches) {
		return matches[1].toUpperCase();
	};
	return string.replace(find, convert);
};

/**
 * Base64 encoding because ie9 does not have bota()
 *
 * @param {string} input
 */
utils.base64encode = function(input) {
	var utf8_encode = function(string) {
		string = string.replace(/\r\n/g, '\n');
		var utftext = '';
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	};

	var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

	var output = '';
	var chr1;
	var chr2;
	var chr3;
	var enc1;
	var enc2;
	var enc3;
	var enc4;
	var i = 0;
	input = utf8_encode(input);

	while (i < input.length) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) {
			enc3 = 64;
			enc4 = 64;
		}
		else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output +
			keyStr.charAt(enc1) +
			keyStr.charAt(enc2) +
			keyStr.charAt(enc3) +
			keyStr.charAt(enc4);
	}
	return output;
};


/**
 * Add event listeners to elements, taking older browsers into account
 * @param {Element} el
 * @param {string} eventType
 * @param {Function} callback
 * @param {boolean=} useCapture
 */
utils.addEvent = function(el, eventType, callback, useCapture) {
	var ret = 0;

	if (typeof el['addEventListener'] === 'function') {
		ret = el['addEventListener'](eventType, callback, useCapture);
	}
	else if (typeof el['attachEvent'] === 'function') {
		ret = el['attachEvent']('on' + eventType, callback);
	}
	else {
		el['on' + eventType] = callback;
	}

	return ret;
};


/**
 * Extract the path (the part of the url excluding protocol and domain name) from urls in the forms
 * of:
 * - "protocol://domain.name/some/path
 * - "domain.name/some/path"
 *
 * and returns (for the above sample input cases):
 * - "some/path"
 *
 * @param {string} url
 */
utils.extractDeeplinkPath = function(url) {
	if (!url) {
		return null;
	}
	if (url.indexOf('://') > -1) {
		url = url.split('://')[1];
	}
	return url.substring(url.indexOf('/') + 1);
};

/**
 * Extract the path (the part of the url excluding protocol and domain name) from urls in the forms
 * of:
 * - "AppName://some/path
 * - some/path
 * - /some/path
 *
 * and returns (for the above sample input cases):
 * - "some/path"
 *
 * @param {string} url
 */
utils.extractMobileDeeplinkPath = function(url) {
	if (!url) {
		return null;
	}
	if (url.indexOf('://') > -1) {
		url = url.split('://')[1];
	}
	else if (url.charAt(0) === '/') {
		url = url.slice(1);
	}
	return url;
};

/**
 * Search for a particular og tag by name, and return the content, if it exists. The optional
 * parameter 'content' will be the default value used if the og tag is not found or cannot
 * be parsed.
 * @param {string} property
 * @param {null|string=} content
 */
utils.getOpenGraphContent = function(property, content) {
	property = String(property);
	content = content || null;

	var el = document.querySelector('meta[property="og:' + property + '"]');
	if (el && el.content) {
		content = el.content;
	}

	return content;
};

/**
 * Used by utils.processHostedDeepLinkData() to prioritize deeplink paths found from various sources.
 * Returned params may include $ios_deeplink_path, $android_deeplink_path and $deeplink_path.
 */
utils.prioritizeDeeplinkPaths = function(params, deeplinkPaths) {
	if (!deeplinkPaths || typeof deeplinkPaths !== "object" || Object.keys(deeplinkPaths).length === 0) {
		return params;
	}

	if (deeplinkPaths['hostedIOS']) {
		params['$ios_deeplink_path'] = deeplinkPaths['hostedIOS'];
	}
	else if (deeplinkPaths['applinksIOS']) {
		params['$ios_deeplink_path'] = deeplinkPaths['applinksIOS'];
	}
	else if (deeplinkPaths['twitterIOS']) {
		params['$ios_deeplink_path'] = deeplinkPaths['twitterIOS'];
	}

	if (deeplinkPaths['hostedAndroid']) {
		params['$android_deeplink_path'] = deeplinkPaths['hostedAndroid'];
	}
	else if (deeplinkPaths['applinksAndroid']) {
		params['$android_deeplink_path'] = deeplinkPaths['applinksAndroid'];
	}
	else if (deeplinkPaths['twitterAndroid']) {
		params['$android_deeplink_path'] = deeplinkPaths['twitterAndroid'];
	}

	// If $ios_deeplink_path and $android_deeplink_path are the same, set a $deeplink_path as well
	if (params.hasOwnProperty('$ios_deeplink_path') &&
		params.hasOwnProperty('$android_deeplink_path') &&
		params['$ios_deeplink_path'] === params['$android_deeplink_path']) {
		params['$deeplink_path'] = params['$ios_deeplink_path'];
	}
	return params;
};
/**
 * Used by utils.getHostedDeepLinkData() to process page metadata.
 */
utils.processHostedDeepLinkData = function(metadata) {
	var params = {};
	if (!metadata || metadata.length === 0) {
		return params;
	}
	var deeplinkPaths = { // keeps track of deeplink paths encountered when parsing page's meta tags
		'hostedIOS': null,
		'hostedAndroid': null,
		'applinksIOS': null,
		'applinksAndroid': null,
		'twitterIOS': null,
		'twitterAndroid': null
	};

	for (var i = 0; i < metadata.length; i++) {
		if (!metadata[i].getAttribute('name') && !metadata[i].getAttribute('property') || !metadata[i].getAttribute('content')) {
			continue;
		}

		var name = metadata[i].getAttribute('name');
		var property = metadata[i].getAttribute('property');
		// name takes precedence over property
		var nameOrProperty = name || property;

		var split = nameOrProperty.split(':');

		if ((split.length === 3) && (split[0] === 'branch') && (split[1] === 'deeplink')) {
			if (split[2] === '$ios_deeplink_path') { // Deeplink path detected from hosted deep link data
				deeplinkPaths['hostedIOS'] = utils.extractMobileDeeplinkPath(metadata[i].getAttribute('content'));
			}
			else if (split[2] === '$android_deeplink_path') {
				deeplinkPaths['hostedAndroid'] = utils.extractMobileDeeplinkPath(metadata[i].getAttribute('content'));
			}
			else { // Add all other hosted deeplink data key/values to params without needing special treatment
				params[split[2]] = metadata[i].getAttribute('content');
			}
		}
		if (nameOrProperty === 'al:ios:url') { // Deeplink path detected from App Links meta tag
			deeplinkPaths['applinksIOS'] = utils.extractMobileDeeplinkPath(metadata[i].getAttribute('content'));
		}
		if (nameOrProperty === 'twitter:app:url:iphone') { // Deeplink path detected from Twitter meta tag
			deeplinkPaths['twitterIOS'] = utils.extractMobileDeeplinkPath(metadata[i].getAttribute('content'));
		}
		if (nameOrProperty === 'al:android:url') {
			deeplinkPaths['applinksAndroid'] = utils.extractMobileDeeplinkPath(metadata[i].getAttribute('content'));
		}
		if (nameOrProperty === 'twitter:app:url:googleplay') {
			deeplinkPaths['twitterAndroid'] = utils.extractMobileDeeplinkPath(metadata[i].getAttribute('content'));
		}
	}
	return utils.prioritizeDeeplinkPaths(params, deeplinkPaths);
};

/**
 * Search for hosted deep link data on the page, as outlined here https://dev.branch.io/getting-started/hosted-deep-link-data/guide/#adding-metatags-to-your-site.
 * Also searches for twitter and applinks tags, i.e. <meta property="al:ios:url" content="applinks://docs" />, <meta name="twitter:app:url:googleplay" content="twitter://docs">.
 */
utils.getHostedDeepLinkData = function() {
	var metadata = document.getElementsByTagName('meta');
	return utils.processHostedDeepLinkData(metadata);
};


/**
 * Returns the user's preferred language
 */
utils.getBrowserLanguageCode = function() {
	var code;
	try {
		if (navigator.languages && navigator.languages.length>0) {
			code = navigator.languages[0];
		}
		else if (navigator.language) {
			code = navigator.language;
		}
		code = code.substring(0, 2).toUpperCase();
	}
	catch (e) {
		code = null;
	}
	return code;
};

/**
 * Returns an array which contains the difference in elements between the 'original' and 'toCheck' arrays.
 * If there is no difference, an empty array will be returned.
 */
utils.calculateDiffBetweenArrays = function(original, toCheck) {
	var diff = [];
	toCheck.forEach(function(element) {
		if (original.indexOf(element) === -1) {
			diff.push(element);
		}
	});
	return diff;
};

var validCommerceEvents = [ 'purchase' ];

var commerceEventMessages = {
	'missingPurchaseEvent': 'event name is either missing, of the wrong type or not valid. Please specify \'purchase\' as the event name.',
	'missingCommerceData': 'commerce_data is either missing, of the wrong type or empty. Please ensure that commerce_data is constructed correctly.',
	'invalidKeysForRoot': 'Please remove the following keys from the root of commerce_data: ',
	'invalidKeysForProducts': 'Please remove the following keys from commerce_data.products: ',
	'invalidProductListType': 'commerce_data.products must be an array of objects',
	'invalidProductType': 'Each product in the products list must be an object'
};

/**
 * Validates the commerce-data object passed into branch.trackCommerceEvent().
 * If there are invalid keys present then it will report back what those keys are.
 * Note: The keys below are optional.
 */
var validateCommerceDataKeys = function(commerceData) {
	var allowedInRoot = [ 'common', 'type', 'transaction_id', 'currency', 'revenue', 'revenue_in_usd', 'exchange_rate', 'shipping', 'tax', 'coupon', 'affiliation', 'persona', 'products' ];
	var allowedInProducts = [ 'sku', 'name', 'price', 'quantity', 'brand', 'category', 'variant' ];

	var invalidKeysInRoot = utils.calculateDiffBetweenArrays(allowedInRoot, Object.keys(commerceData));
	if (invalidKeysInRoot.length) {
		return commerceEventMessages['invalidKeysForRoot'] + invalidKeysInRoot.join(', ');
	}

	var invalidKeysForProducts = [];
	var invalidProductType;
	if (commerceData.hasOwnProperty('products')) {
		// make sure products is an array
		if (!Array.isArray(commerceData['products'])) {
			return commerceEventMessages['invalidProductListType'];
		}
		commerceData['products'].forEach(function(product) {
			// all product entries must be objects
			if (typeof product !== 'object') {
				invalidProductType = commerceEventMessages['invalidProductType'];
			}
			invalidKeysForProducts = invalidKeysForProducts.concat(utils.calculateDiffBetweenArrays(allowedInProducts, Object.keys(product)));
		});

		if (invalidProductType) {
			return invalidProductType;
		}

		if (invalidKeysForProducts.length) {
			return commerceEventMessages['invalidKeysForProducts'] + invalidKeysForProducts.join(', ');
		}
	}

	return null;
};

/**
 * Returns an error message if the partner passes in an invalid event or commerce_data to branch.trackCommerceEvent()
 */
utils.validateCommerceEventParams = function(event, commerce_data) {
	if (!event || typeof event !== 'string' || validCommerceEvents.indexOf(event.toLowerCase()) === -1) {
		return commerceEventMessages['missingPurchaseEvent'];
	}

	if (!commerce_data || typeof commerce_data !== 'object' || Object.keys(commerce_data).length === 0) {
		return commerceEventMessages['missingCommerceData'];
	}

	var invalidKeysMessage = validateCommerceDataKeys(commerce_data);
	if (invalidKeysMessage) {
		return invalidKeysMessage;
	}

	return null;
};

utils.cleanBannerText = function(string) {
	if (typeof string !== 'string') {
		return null;
	}

	return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

utils.getTitle = function() {
	var tags = document.getElementsByTagName('title');
	return tags.length > 0 ? tags[0].innerText : null;
};

utils.getDescription = function() {
	var el = document.querySelector('meta[name="description"]');
	return el && el.content ? el.content : null;
};

utils.getCanonicalURL = function() {
	var el = document.querySelector('link[rel="canonical"]');
	return el && el.href ? el.href : null;
};

utils.addPropertyIfNotNull = function(obj, key, value) {
	if (value) {
		if (typeof value === "object" && Object.keys(value).length === 0) {
			return obj;
		}
		obj[key] = value;
	}
	return obj;
};

utils.openGraphDataAsObject = function() {
	var ogData = {};
	ogData = utils.addPropertyIfNotNull(ogData, '$og_title', utils.getOpenGraphContent('title'));
	ogData = utils.addPropertyIfNotNull(ogData, '$og_description', utils.getOpenGraphContent('description'));
	ogData = utils.addPropertyIfNotNull(ogData, '$og_image_url', utils.getOpenGraphContent('image'));
	ogData = utils.addPropertyIfNotNull(ogData, '$og_video', utils.getOpenGraphContent('video'));
	return ogData && Object.keys(ogData).length > 0 ? ogData : null;
};


utils.getAdditionalMetadata = function() {
	var metadata = {};
	metadata = utils.addPropertyIfNotNull(metadata, "og_data", utils.openGraphDataAsObject());
	metadata = utils.addPropertyIfNotNull(metadata, "hosted_deeplink_data", utils.getHostedDeepLinkData());
	metadata = utils.addPropertyIfNotNull(metadata, "title", utils.getTitle());
	metadata = utils.addPropertyIfNotNull(metadata, "description", utils.getDescription());
	metadata = utils.addPropertyIfNotNull(metadata, "canonical_url", utils.getCanonicalURL());
	return metadata && Object.keys(metadata).length > 0 ? metadata : {};
};

utils.removePropertiesFromObject = function(objectToModify, keysToRemove) {
	if (objectToModify && typeof objectToModify === "object" && !Array.isArray(objectToModify) &&
		Object.keys(objectToModify).length > 0 && keysToRemove && Array.isArray(keysToRemove) &&
		keysToRemove.length > 0) {
		for (var key in objectToModify) {
			if (objectToModify.hasOwnProperty(key) && keysToRemove.indexOf(key) > -1) {
				delete objectToModify[key];
			}
		}
	}
};

// v2/event utility functions

var BRANCH_STANDARD_EVENTS = [ 'ADD_TO_CART', 'ADD_TO_WISHLIST', 'VIEW_CART', 'INITIATE_PURCHASE', 'ADD_PAYMENT_INFO', 'PURCHASE', 'SPEND_CREDITS', 'SEARCH', 'VIEW_ITEM', 'VIEW_ITEMS', 'RATE', 'SHARE', 'COMPLETE_REGISTRATION', 'COMPLETE_TUTORIAL', 'ACHIEVE_LEVEL', 'UNLOCK_ACHIEVEMENT' ];
var BRANCH_STANDARD_EVENT_DATA = [ 'transaction_id', 'revenue', 'currency', 'shipping', 'tax', 'coupon', 'affiliation', 'search_query', 'description' ];

utils.isStandardEvent = function(eventName) {
	return BRANCH_STANDARD_EVENTS.indexOf(eventName) > -1;
};

utils.separateEventAndCustomData = function(eventAndCustomData) {

	if (!eventAndCustomData || Object.keys(eventAndCustomData).length === 0) {
		return null;
	}
	var customDataKeys = utils.calculateDiffBetweenArrays(BRANCH_STANDARD_EVENT_DATA, Object.keys(eventAndCustomData));
	var customData = {};

	for (var i = 0; i < customDataKeys.length; i++) {
		var key = customDataKeys[i];
		customData[key] = eventAndCustomData[key];
		delete eventAndCustomData[key];
	}
	return {
		"custom_data": utils.convertObjectValuesToString(customData),
		"event_data": eventAndCustomData
	};
};

utils.validateParameterType = function(parameter, type) {
	if (!parameter || !type) {
		return false;
	}
	if (type === "array") {
		return Array.isArray(parameter);
	}
	return typeof parameter === type && !Array.isArray(parameter);
};

// Used by logEvent() to send fields related to user's visit and device to v2/event standard and custom
// Requires a reference to the branch object to access information such as browser_fingerprint_id
utils.getUserData = function(branch) {
	var user_data = {};
	user_data = utils.addPropertyIfNotNull(user_data, "http_origin", document.URL);
	user_data = utils.addPropertyIfNotNull(user_data, "user_agent", navigator.userAgent);
	user_data = utils.addPropertyIfNotNull(user_data, "language", utils.getBrowserLanguageCode());
	user_data = utils.addPropertyIfNotNull(user_data, "screen_width", screen.width);
	user_data = utils.addPropertyIfNotNull(user_data, "screen_height", screen.height);
	user_data = utils.addPropertyIfNotNull(user_data, "http_referrer", document.referrer);
	user_data = utils.addPropertyIfNotNull(user_data, "browser_fingerprint_id", branch.browser_fingerprint_id);
	user_data = utils.addPropertyIfNotNull(user_data, "developer_identity", branch.identity);
	user_data = utils.addPropertyIfNotNull(user_data, "sdk", "web");
	user_data = utils.addPropertyIfNotNull(user_data, "sdk_version", config.version);
	return user_data;
};

// Checks if page is in an iFrame
utils.isIframe = function() {
	return window.self !== window.top;
};

// Checks if page is on the same domain as its top most window
// Will throw a cross-origin frame access error if it is not
utils.isSameOriginFrame = function() {
	var sameOriginTest = "true"; // without this minification of function doesn't work correctly
	try {
		if (window.top.location.search) {
			sameOriginTest = "true"; // without this minification of function doesn't work correctly
		}
	}
	catch (err) {
		return false;
	}
	return (sameOriginTest === "true"); // without this minification of function doesn't work correctly
};

// Checks if page is in an iFrame and on the same domain as its top most window
utils.isIframeAndFromSameOrigin = function() {
	return utils.isIframe() && utils.isSameOriginFrame();
};

utils.getInitialReferrer = function(referringLink) {
	if (referringLink) {
		return referringLink;
	}
	if (utils.isIframe()) {
		return utils.isSameOriginFrame() ? window.top.document.referrer : "";
	}
	return document.referrer;
};

// Required for logEvent()'s custom_data object - values must be converted to string
utils.convertObjectValuesToString = function(objectToConvert) {
	if (!utils.validateParameterType(objectToConvert, 'object') || Object.keys(objectToConvert).length === 0) {
		return;
	}
	for (var key in objectToConvert) {
		if (objectToConvert.hasOwnProperty(key)) {
			objectToConvert[key] = utils.validateParameterType(objectToConvert[key], 'object') || utils.validateParameterType(objectToConvert[key], 'array') ? safejson.stringify(objectToConvert[key]) : objectToConvert[key].toString();
		}
	}
	return objectToConvert;
};

// Merges user supplied metadata to hosted deep link data for additional Journeys user targeting
utils.mergeHostedDeeplinkData = function(hostedDeepLinkData, metadata) {
	var hostedDeepLinkDataClone = hostedDeepLinkData ? utils.merge({}, hostedDeepLinkData) : {};
	if (metadata && Object.keys(metadata).length > 0) {
		return Object.keys(hostedDeepLinkDataClone).length > 0 ? utils.merge(hostedDeepLinkDataClone, metadata) : utils.merge({}, metadata);
	}
	return hostedDeepLinkDataClone;
};

// Creates a nonce attribute with the value stored in utils.nonce
utils.addNonceAttribute = function(element) {
	if (utils.nonce !== '') {
		element.setAttribute('nonce', utils.nonce);
	}
};

