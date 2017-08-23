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
	existingInit: 'Branch SDK already initilized',
	missingAppId: 'Missing Branch app ID',
	callBranchInitFirst: 'Branch.init must be called first',
	timeout: 'Request timed out',
	blockedByClient: 'Request blocked by client, probably adblock',
	missingUrl: 'Required argument: URL, is missing'
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
	return window.location.search;
};

utils.getLocationHash = function() {
	return window.location.hash;
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
				data = goog.json.parse(data);
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
	return String(window.location);
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
				data = goog.json.parse(data);
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
utils.clickIdFromLink = function(link) {
	return link ? link.substring(link.lastIndexOf('/') + 1, link.length) : null;
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
 * Search for hosted deep link data on the page, as outlined here https://dev.branch.io/getting-started/hosted-deep-link-data/guide/#adding-metatags-to-your-site
 * Also searches for applink tags, i.e. <meta property="al:ios:url" content="applinks://docs" />
 */
utils.getHostedDeepLinkData = function() {
	var params = {};
	var metas = document.getElementsByTagName('meta');

	for (var i = 0; i < metas.length; i++) {
		if (!metas[i].getAttribute('name') && !metas[i].getAttribute('property') || !metas[i].getAttribute('content')) {
			continue;
		}

		var name = metas[i].getAttribute('name');
		var property = metas[i].getAttribute('property');
		// name takes precendence over propery
		var nameOrProperty = name || property;

		if (nameOrProperty === 'al:ios:url') {
			params['$ios_deeplink_path'] = utils.extractMobileDeeplinkPath(metas[i].getAttribute('content'));
		}
		else if (nameOrProperty === 'al:android:url') {
			params['$android_deeplink_path'] = utils.extractMobileDeeplinkPath(metas[i].getAttribute('content'));
		}
		else {
			var split = nameOrProperty.split(':');

			if ((split.length === 3) && (split[0] === 'branch') && (split[1] === 'deeplink')) {
				params[split[2]] = metas[i].getAttribute('content');
			}
		}
	}

	return params;
};


/**
 * @return {string} code
 */
utils.getBrowserLanguageCode = function() {
	var code;
	try {
		code = (navigator.language || navigator.browserLanguage || 'en').split(/[^a-z^A-Z0-9-]/).shift().toLowerCase();
	}
	catch (e) {
		code = 'en';
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
	return metadata && Object.keys(metadata).length > 0 ? metadata : null;
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
