/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */

goog.provide('api');
goog.require('config');
goog.require('utils');

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


var _jsonp_callbackId = 0;
/**
 * @param {string} url
 * @param {function(?new:Error,*)} callback
 */
function jsonp(url, callback) {
	var func = 'branch$$callback$$' + (_jsonp_callbackId++);
	window[func] = function(data) {
		callback(null, data);
	};

	var a = document.createElement("script");
	a.type = "text/javascript";
	a.async = true;
	a.src = url + (url.indexOf('?') ? '&' : '?') + 'callback=' + encodeURIComponent(func);
	document.getElementsByTagName("head")[0].appendChild(a);
}


/**
 * @param {resources.resource} resource
 * @param {Object.<string, *>} data
 * @param {function(?new:Error,*)|null} callback
 */
api = function(resource, data, callback) {
	callback = callback || function() {};

	var u = getUrl(resource, data);
	var url, postData = "";
	if (resource.method == 'GET') {
		url = u.url + '?' + u.data;
	}
	else {
		url = u.url;
		postData = u.data;
	}

	if (resource.jsonp) {
		return jsonp(url, callback);
	}

	var req = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	req.onreadystatechange = function() {
		if (req.readyState === 4 && req.status === 200) {
			try {
				// We try to catch errors here because sendSMSLink does not return JSON
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

	req.open(resource.method, url, true);
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.send(postData);
};
