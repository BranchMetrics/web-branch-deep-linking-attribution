/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */

goog.provide('Server');
goog.require('utils');
goog.require('goog.json');
goog.require('storage'); // jshint unused:false

var RETRIES = 2,
	RETRY_DELAY = 200,
	TIMEOUT = 5000;

/**
 * @class Server
 * @constructor
 */
var Server = function() { };

Server.prototype._jsonp_callback_index = 0;

/**
 * @param {Object} obj
 * @param {string} prefix
 */
Server.prototype.serializeObject = function(obj, prefix) {
	var pairs = [ ];
	if (obj instanceof Array) {
		for (var i = 0; i < obj.length; i++) {
			pairs.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(obj[i]));
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
Server.prototype.getUrl = function(resource, data) {
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
	// check for branch_key then app_id here
	var branch_id = /^[0-9]{15,20}$/;
	var branch_key = /key_(live|test)_[A-Za-z0-9]{32}/;

	if (resource.method === "POST" || resource.endpoint === "/v1/credithistory") {
		if (data['branch_key'] && branch_key.test(data['branch_key'])) {
			d['branch_key'] = data['branch_key'];
		}
		else if (data['app_id'] && branch_id.test(data['app_id'])) {
			d['app_id'] = data['app_id'];
		}
		else {
			return { error: utils.message(utils.messages.missingParam, [ resource.endpoint, 'branch_key or app_id' ]) };
		}
	}

	return { data: this.serializeObject(d, ''), url: url };
};

/**
 * This function is standalone for easy mocking.
 * @param {string} src
 */
Server.prototype.createScript = function(src) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.src = src;

	document.getElementsByTagName('head')[0].appendChild(script);
};

var jsonp_callback_index = 0;

/**
 * @param {string} requestURL
 * @param {Object} requestData
 * @param {utils._httpMethod} requestMethod
 * @param {function(?Error,*=,?=)=} callback
 */
Server.prototype.jsonpRequest = function(requestURL, requestData, requestMethod, callback) {
	var callbackString = 'branch_callback__' + (this._jsonp_callback_index++);

	var postPrefix = (requestURL.indexOf('api.branch.io') >= 0) ? '&data=' : '&post_data=',
		postData = (requestMethod == 'POST') ? encodeURIComponent(utils.base64encode(goog.json.serialize(requestData))) : "";

	var timeout_trigger = window.setTimeout(function() {
		window[callbackString] = function() { };
		callback(new Error(utils.messages.timeout), null, 504);
	}, TIMEOUT);

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
 * @param {function(?Error,*=,?=)=} callback
 */
Server.prototype.XHRRequest = function(url, data, method, storage, callback) {
	var req = TITANIUM_BUILD ? Ti.Network.createHTTPClient() : (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
	req.timeout = 5000;
	req.ontimeout = function() {
		callback(new Error(utils.messages.timeout), null, 504);
	};
	if (TITANIUM_BUILD) {
		req.onerror = function(e) {
			if (req.status === 402) {
				callback(new Error('Not enough credits to redeem.'));
			} else if (e.error) {
				callback(new Error(e.error));
			} else {
				callback(new Error("Error in API: " + req.status));
			}
		};
		req.onload = function() {
			if (req.status === 200) {
				try {
					callback(null, goog.json.parse(req.responseText), req.status);
				}
				catch (e) {
					callback(null, { }, req.status);
				}
			}
			else if (req.status === 402) {
				callback(new Error('Not enough credits to redeem.'), null, req.status);
			}
			else if (req.status.toString().substring(0, 1) === "4" || req.status.toString().substring(0, 1) === "5") {
				callback(new Error('Error in API: ' + req.status), null, req.status);
			}
		};
	} else {
		req.onreadystatechange = function() {
			if (req.readyState === 4) {
				if (req.status === 200) {
					try {
						callback(null, goog.json.parse(req.responseText));
					}
					catch (e) {
						callback(null, { });
					}
				}
				else if (req.status === 402) {
					callback(new Error('Not enough credits to redeem.'));
				}
				else if (req.status.toString().substring(0, 1) === "4" || req.status.toString().substring(0, 1) === "5") {
					callback(new Error('Error in API: ' + req.status));
				}
			}
		};
	}

	try {
		req.open(method, url, true);
		req.timeout = TIMEOUT;
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
Server.prototype.request = function(resource, data, storage, callback) {
	var self = this;

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

	// How many times to retry the request if the initial attempt fails
	var retries = RETRIES;
	// If request fails, retry after X miliseconds
	/***
	 * @type {function(?Error,*=): ?undefined}
	 */
	var done = function(err, data, status) {
		if (err && retries > 0 && status.toString().substring(0, 1) === "5") {
			retries--;
			window.setTimeout(function() {
				makeRequest();
			}, RETRY_DELAY);
		}
		else {
			callback(err, data);
		}
	};
	var makeRequest = function() {
		if (storage['getItem']('use_jsonp') || resource.jsonp) {
			self.jsonpRequest(url, data, resource.method, done);
		}
		else {
			self.XHRRequest(url, postData, resource.method, storage, done);
		}
	};
	makeRequest();
};
