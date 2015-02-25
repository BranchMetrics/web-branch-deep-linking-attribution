/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */

goog.provide('api');
goog.require('utils');

var _jsonp_callback_index = 0;

function serializeObject(obj, prefix) {
	var pairs = [];
	prefix = prefix || "";
	if (obj instanceof Array) {
		for (var i = 0; i < obj.length; i++) {
			pairs.push(encodeURIComponent(prefix) + '[]=' + encodeURIComponent(obj[i]));
		}
	}
	else {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (obj[prop] instanceof Array || typeof obj[prop] == 'object') {
					pairs.push(serializeObject(obj[prop], prefix ? prefix + '.' + prop : prop));
				}
				else {
					pairs.push(encodeURIComponent(prefix ? prefix + '.' + prop : prop) + '=' + encodeURIComponent(obj[prop]));
				}
			}
		}
	}
	return pairs.join('&');
}

/**
 * @param {resources.resource} resource
 * @param Object.<string, *>
 */
function getUrl(resource, data) {
	var k;
	var url = resource.destination + resource.endpoint;
	if (resource.queryPart) {
		for (k in resource.queryPart) {
			if (resource.queryPart.hasOwnProperty(k)) {
				resource.queryPart[k](resource.endpoint, k, data[k]); // validate -- will throw
				url += '/' + data[k];
			}
		}
	}
	var d = {};
	for (k in resource.params) {
		if (resource.params.hasOwnProperty(k)) {
			var v = resource.params[k](resource.endpoint, k, data[k]);
			if (!(typeof v == 'undefined' || v === '' || v === null)) {
				d[k] = v;
			}
		}
	}
	return { data: serializeObject(d), url: url };
}

/**
 * @param {String} url
 * @param {Object} options
 * @param {Function|null} callback
 */
var jsonpRequest = function(url, options, callback) {
	callback = callback || 'branch_callback__' + (_jsonp_callback_index++);
	options.onSuccess = options.onSuccess || function() {};
	options.onTimeout = options.onTimeout || function() {};
	options.data = (options.method == "POST") ? encodeURIComponent(utils.base64encode(JSON.stringify(options.data))) : "";

	var postDataString = (url.indexOf('bnc.lt') >= 0) ? '&post_data=' : '&data=';
	var timeout = options.timeout || 10; // sec

	var timeout_trigger = window.setTimeout(function() {
		window[callback] = function() {};
		options.onTimeout();
	}, timeout * 1000);

	window[callback] = function(data) {
		window.clearTimeout(timeout_trigger);
		options.onSuccess(data);
	};

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.src = url + (url.indexOf('?') < 0 ? '?' : '') + (options.data ? postDataString + options.data : '') + '&callback=' + callback + (url.indexOf('/c/') >= 0 ? '&click=1' : '');

	document.getElementsByTagName('head')[0].appendChild(script);
};

/**
 * @param {String} requestURL
 * @param {Object} requestData
 * @param {String} requestMethod
 * @param {Function|null} callback
 */
var jsonpMakeRequest = function(requestURL, requestData, requestMethod, callback) {
	jsonpRequest(requestURL, {
		onSuccess: function(json) {
			callback(null, json);
		},
		onTimeout: function() {
			callback(utils.error(utils.messages.timeout));
		},
		timeout: 10,
		data: requestData,
		method: requestMethod
	});
};

/**
 * @param {String} url
 * @param {Object} data
 * @param {String} method
 * @param {Function|null} callback
 */
var XHRRequest = function(url, data, method, callback) {
	var req = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	req.onreadystatechange = function() {
		if (req.readyState === 4 && req.status === 200) {
			try {
				callback(null, JSON.parse(req.responseText));
			}
			catch (e) {
				callback(null, {});
			}
		}
		else if (req.readyState === 4 && req.status === 402) {
			callback(new Error('Not enough credits to redeem.'));
		}
		else if (req.readyState === 4 && req.status.substring(0, 1) != "4") {
			callback(new Error('Error in API: ' + req.status));
		}
	};

	try {
		req.open(method, url, true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.send(data);
	}
	catch (e) {
		sessionStorage.setItem('use_jsonp', true);
		jsonpMakeRequest(url, data, method, callback);
	}
};

/**
 * @param {resources.resource} resource
 * @param {Object.<string, *>} data
 * @param {function(?new:Error,*)|null} callback
 */
api = function(resource, data, callback) {
	// callback = utils.injectDequeue( callback || function() {} );

	var u = getUrl(resource, data);
	var url, postData = "";
	if (resource.method == 'GET') {
		url = u.url + '?' + u.data;
	}
	else {
		url = u.url;
		postData = u.data; 
	}
	if (sessionStorage.getItem('use_jsonp') || resource.jsonp) {
		jsonpMakeRequest(url, data, resource.method, callback);
	}
	else {
		XHRRequest(url, postData, resource.method, callback);
	}
};
