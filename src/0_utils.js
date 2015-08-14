/**
 * Just provides a couple of utilities.
 */

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
utils.httpMethod = { POST: 'POST', GET: 'GET' };

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
	missingUrl: 'Required argument: URL, is missing'
};

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
	if (DEBUG && console) { console.log(msg); }
	return msg;
};

/**
 * @param {Object} data
 * @return {utils.sessionData}
 */
utils.whiteListSessionData = function(data) {
	return {
		'data': data.data || null,
		'data_parsed': data.data_parsed || null,
		'has_app': data.has_app || null,
		'identity': data.identity || null,
		'referring_identity': data.referring_identity || null,
		'referring_link': data.referring_link || null
	};
};

utils.cleanLinkData = function(linkData, config) {
	/* jshint undef:false */
	if (WEB_BUILD) { // WTF, I don't know why I can't just do undef:false for the line.
		/* jshint undef:true */
		linkData.source = 'web-sdk';
		if (linkData.data && linkData.data.$desktop_url !== undefined) {
			linkData.data.$desktop_url =
				linkData.data.$desktop_url
					.replace(/#r:[a-z0-9-_]+$/i, '')
					.replace(/([\?\&]_branch_match_id=\d+)/, '');
		}
	}
	try {
		JSON.parse(linkData.data);
	}
	catch (e) {
		linkData.data = goog.json.serialize(linkData.data || {});
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
	return link ? link.substring(0, 4) != 'http' ? 'https://bnc.lt' + link : link : null;
};

/**
 * @param {Object} to
 * @param {Object} from
 */
utils.merge = function(to, from) {
	for (var attr in from) {
		if (from.hasOwnProperty(attr)) { to[attr] = from[attr]; }
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
	if (navigator.userAgent.match(/android|i(os|p(hone|od|ad))/i)) {
		if (navigator.userAgent.match(/android/i)) { return 'android'; }
		else if (navigator.userAgent.match(/ipad/i)) { return 'ipad'; }
		else { return 'ios'; }
	}
	else { return false; }
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
	return key_or_id.indexOf("key_") > -1;
};

/**
 * @param {string} string
 */
utils.snakeToCamel = function(string) {
	var find = /(\-\w)/g,
		convert = function(matches) {
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
		string = string.replace(/\r\n/g, "\n");
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
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
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
			enc3 = enc4 = 64;
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
