/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */

goog.provide('BranchAPI');
goog.require('utils');
goog.require('goog.json');
goog.require('storage'); // jshint unused:false

/**
 * @class Api
 * @constructor
 */
var BranchAPI = function() {
	this._branchAPI = { };
};

BranchAPI.prototype._jsonp_callback_index = 0;

/**
 * @param {Object} obj
 * @param {string} prefix
 */
BranchAPI.prototype.serializeObject = function(obj, prefix) {
	var pairs = [];
	if (obj instanceof Array) {
		for (var i = 0; i < obj.length; i++) {
			pairs.push(encodeURIComponent(prefix) + '[]=' + encodeURIComponent(obj[i]));
		}
	}
	else {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (obj[prop] instanceof Array || typeof obj[prop] == 'object') {
					pairs.push(this.serializeObject(obj[prop], prefix ? prefix + '.' + prop : prop));
				}
				else {
					pairs.push(encodeURIComponent(prefix ? prefix + '.' + prop : prop) + '=' + encodeURIComponent(obj[prop]));
				}
			}
		}
	}
	return pairs.join('&');
};

/**
 * @param {utils.resource} resource
 * @param {Object.<string, *>} data
 */
BranchAPI.prototype.getUrl = function(resource, data) {
	var k, v, err;
	var url = resource.destination + resource.endpoint;
	if (resource.queryPart) {
		for (k in resource.queryPart) {
			if (resource.queryPart.hasOwnProperty(k)) {
				err = resource.queryPart[k](resource.endpoint, k, data[k]);
				if (err) { return { error: err }; }

				url += '/' + data[k];
			}
		}
	}
	var d = { };
	for (k in resource.params) {
		if (resource.params.hasOwnProperty(k)) {
			err = resource.params[k](resource.endpoint, k, data[k]);
			if (err) { return { error: err }; }

			v = data[k];
			if (!(typeof v == 'undefined' || v === '' || v === null)) {
				d[k] = v;
			}
		}
	}
	return { data: this.serializeObject(d, ''), url: url };
};

/**
 * This function is standalone for easy mocking.
 * @param {string} src
 */
BranchAPI.prototype.createScript = function(src) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.src = script;

	document.getElementsByTagName('head')[0].appendChild(script);
};

/**
 * @param {string} requestURL
 * @param {Object} requestData
 * @param {utils._httpMethod} requestMethod
 * @param {function(?Error,*=)=} callback
 */
BranchAPI.prototype.jsonpRequest = function(requestURL, requestData, requestMethod, callback) {
	var callbackString = 'branch_callback__' + (this._jsonp_callback_index++);

	var postPrefix = (requestURL.indexOf('api.branch.io') >= 0) ? '&data=' : '&post_data=',
		postData = (requestMethod == 'POST') ? encodeURIComponent(utils.base64encode(goog.json.serialize(requestData))) : "";

	var timeout_trigger = window.setTimeout(function() {
		window[callback] = function() { };
		callback(new Error(utils.messages.timeout));
	}, 10000);

	window[callbackString] = function(data) {
		window.clearTimeout(timeout_trigger);
		callback(null, data);
	};

	this.createScript(requestURL + (requestURL.indexOf('?') < 0 ? '?' : '') + (postData ? postPrefix + postData : '') + (requestURL.indexOf('/c/') >= 0 ? '&click=1' : '') + '&callback=' + callbackString);
};

/**
 * @param {string} url
 * @param {Object} data
 * @param {utils._httpMethod} method
 * @param {BranchStorage} storage
 * @param {function(?Error,*=)=} callback
 */
BranchAPI.prototype.XHRRequest = function(url, data, method, storage, callback) {
	var req = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	req.onreadystatechange = function() {
		if (req.readyState === 4 && req.status === 200) {
			try {
				callback(null, goog.json.parse(req.responseText));
			}
			catch (e) {
				callback(null, { });
			}
		}
		else if (req.readyState === 4 && req.status === 402) {
			callback(new Error('Not enough credits to redeem.'));
		}
		else if (req.readyState === 4 && (req.status.toString().substring(0, 1) == "4" || req.status.toString().substring(0, 1) == "5")) {
			callback(new Error('Error in API: ' + req.status));
		}
	};

	try {
		req.open(method, url, true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.send(data);
	}
	catch (e) {
		storage['setItem']('use_jsonp', true);
		this.jsonpRequest(url, data, method, callback);
	}
};

/**
 * @param {utils.resource} resource
 * @param {Object.<string, *>} data
 * @param {BranchStorage} storage
 * @param {function(?Error,*=)=} callback
 */
BranchAPI.prototype.request = function(resource, data, storage, callback) {
	var u = this.getUrl(resource, data);
	if (u.error) { return callback(new Error(u.error)); }

	var url, postData = '';
	if (resource.method == 'GET') {
		url = u.url + '?' + u.data;
	}
	else {
		url = u.url;
		postData = u.data;
	}
	if (storage['getItem']('use_jsonp') || resource.jsonp) {
		this.jsonpRequest(url, data, resource.method, callback);
	}
	else {
		this.XHRRequest(url, postData, resource.method, storage, callback);
	}
};
