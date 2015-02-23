/**
 * Just provides a couple of utilities.
 */

goog.provide('utils');

/** @define {boolean} */
var DEBUG = true;

/* jshint ignore:start */
/** @typedef {string} */
message; // Does not work with tests

/** @typedef {{session_id:string, identity_id:string, link:string, data:string, referring_identity:string, link_click:string}} */
utils.sessionData;
/* jshint ignore:end */

/** @type {Object<string,message>} */
utils.messages = {
	missingParam: 'API request $1 missing parameter $2',
	invalidType: 'API request $1, parameter $2 is not $3',
	nonInit: 'Branch SDK not initialized',
	existingInit: 'Branch SDK already initilized',
	missingAppId: 'Missing Branch app ID',
	callBranchInitFirst: 'Branch.init must be called first',
	timeout: 'Request timed out'
};

/**
 * @param {message}
 * @param {?Array.<*>}
 * @throws {Error}
 */
utils.error = function(message, params) {
	throw new Error(utils.message(message, params));
};

/**
 * @param {message}
 * @param {?Array.<*>}
 */
utils.message = function(message, param) {
	var msg = message.replace(/\$(\d)/g, function(_, place) {
		return param[parseInt(place) - 1];
	});
	if (DEBUG && console) { console.log(msg); }
	return msg;
};

/**
 * @returns {?utils.sessionData}
 */
utils.readStore = function() {
	return JSON.parse(sessionStorage.getItem('branch_session')) || {};
};

utils.whiteListSessionData = function(data) {
	var whiteList = ['data', 'referring_identity', 'identity', 'has_app'];
	var returnData = {};
	for (var key in data) {
		if(whiteList.indexOf(key) > -1) {
			returnData[key] = data[key];
		}
	}
	return returnData;
};

/**
 * @param {utils.sessionData}
 */
utils.store = function(data) {
	sessionStorage.setItem('branch_session', JSON.stringify(data));
};

/**
 * @param {?string} key
 * @param {?string} value
 */
utils.storeKeyValue = function(key, value) {
	var currentSession = utils.readStore();
	currentSession[key] = value;
	utils.store(currentSession);
};

/**
 * @param {?string} key
 */
utils.readKeyValue = function(key) {
	var currentSession = utils.readStore();
	return currentSession[key];
};

utils.hasApp = function() {
	return utils.readKeyValue("has_app");
};

utils.merge = function(to, from) {
	for (var attr in from) {
		if (from.hasOwnProperty(attr)) { to[attr] = from[attr]; }
	}
	return to;
};

/**
 * Base64 encoding because ie9 does not have bota()
 * @param {string} input
 */
utils.base64encode = function(input) {
	var utf8_encode = function(string, utftext) {
		string = string.replace(/\r\n/g, "\n");
		utftext = "";
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

	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	var output = "";
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
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
	}
	return output;
};

// ======= Begin queue functions

/**
 * Enqueue an async request, and if it's first in the queue, inititate the queue array call the request
 *
 * @param {Function} request
 */
utils.enqueue = function(request, resource) {
	utils.queue || (utils.queue = [], utils.injectionQueue = []);
	resource = resource || "";
	utils.queue.push({
		"request": request,
		"resource": resource
	});
	if (utils.queue.length === 1) { utils.runFront(); }
};

/**
 * Runs the next request in the queue
 */
utils.runFront = function() {
	utils.queue && (utils.queue.length > 0) && utils.queue[0].request();
};

/**
 * Dequeue the next request in the queue
 */
utils.dequeue = function() {
	utils.queue && (utils.queue.length > 0) && utils.queue.shift();
};

/**
 * The injection queue is a queue of objects, each with a function matched to a specific resource type (i.e. open, link, etc.)
 * Every time the front request in the queue is ran, the injection queue is checked. Every injection object that matches the resource type being ran will be called.
 * Example use case: `Branch.readSession()` is called prior to `Branch.init()` is finished. `Branch.readSession` is placed in the injection queue for the next available
 * call to an `open` resource, then `Branch.readSession` can still return with the session information.
 *
 */
 utils.checkInjectionQueue = function() {
 	for (var i = 0; i < utils.injectionQueue.length; i++) {
 		if(utils.injectionQueue[i].resource == utils.queue[0].resource) {
 			var injectionQueueRequest = utils.injectionQueue.splice(i, 1)[0];
 			return injectionQueueRequest.injection;
 		}
 	}
 };

/**
 * Package the request to keep the context of "this", and call it with all of it's arguments
 *
 * @param {Function} request
 * @param {Object} context
 * @param {Array} params
 */
utils.packageRequest = function(request, context, params) {
	return function() {
		request.apply(context, params);
	};
};

/**
 * Generic function into callback. Currently used by the queue itself to inject dequeueing and running the next request,
 * and by Branch.readSession() to inject a callback to the Branch.init function at the front of the queue.
 *
 * @param {Function} injection
 * @param {Function} callback
 */
utils.injectFunction = function(injection, reciever) {
	return function(err, data) {
		injection(err, data);
		reciever(err, data);
	};
};

/**
 * Inject dequeue in the request callback, to automatically call the next request in the queue
 *
 * @param {Function} callback
 */
utils.injectDequeue = function(callback) {
	return utils.injectFunction(function(err, data) {
		var queuedInjection = utils.checkInjectionQueue();
		queuedInjection && queuedInjection(err, data);
		utils.dequeue();
		utils.runFront();
	}, callback);
};