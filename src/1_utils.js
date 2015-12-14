/**
 * Just provides a couple of utilities.
 */
'use strict';

goog.provide('utils');
/*jshint unused:false*/
goog.require('goog.json');
goog.require('config');

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

/** @typedef {{destination: string, endpoint: string, method: utils._httpMethod,
 * params: ?Object.<string, _validator>, queryPart: ?Object.<string, _validator>,
 * jsonp: ?boolean }} */
utils.resource;

/** @typedef {{listener: function(string):null, event: string}} */
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
 * @return {string}
 */
utils.message = function(message, params) {
	var msg = message.replace(/\$(\d)/g, function(_, place) {
		return params[parseInt(place, 10) - 1];
	});
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
		'data': data['data'] || null,
		'data_parsed': data['data_parsed'] || null,
		'has_app': data['has_app'] || null,
		'identity': data['identity'] || null,
		'referring_identity': data['referring_identity'] || null,
		'referring_link': data['referring_link'] || null
	};
};

utils.cleanLinkData = function(linkData) {
	/* jshint undef:false */
	if (WEB_BUILD) {
		/* jshint undef:true */
		linkData['source'] = 'web-sdk';
		if (linkData['data'] && linkData['data']['$desktop_url'] !== undefined) {
			linkData['data']['$desktop_url'] =
				linkData['data']['$desktop_url']
					.replace(/#r:[a-z0-9-_]+$/i, '')
					.replace(/([\?\&]_branch_match_id=\d+)/, '');
		}
	}
	try {
		JSON.parse(linkData['data']);
	}
	catch (e) {
		linkData['data'] = goog.json.serialize(linkData['data'] || {});
	}
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
	if (typeof from === 'undefined') {
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
		return utils.getLocationHash().match(new RegExp(key + ':([^&]*)'))[1];
	}
	catch (e) {
		return undefined;
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

/**
 * @param {string} key
 */
utils.getParamValue = function(key) {
	try {
		return utils.getLocationSearch().substring(1).match(new RegExp(key + '=([^&]*)'))[1];
	}
	catch (e) {
		return undefined;
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
