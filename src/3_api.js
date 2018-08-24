/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */
'use strict';

goog.provide('Server');
goog.require('utils');
goog.require('goog.json');
goog.require('storage'); // jshint unused:false
goog.require('safejson');

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
	if (typeof obj === 'undefined') {
		return '';
	}

	var pairs = [ ];
	if (obj instanceof Array) {
		for (var i = 0; i < obj.length; i++) {
			pairs.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(obj[i]));
		}
		return pairs.join('&');
	}

	for (var prop in obj) {
		if (!obj.hasOwnProperty(prop)) {
			continue;
		}
		if (obj[prop] instanceof Array || typeof obj[prop] === 'object') {
			pairs.push(
				this.serializeObject(obj[prop], prefix ? prefix + '.' + prop : prop)
			);
		}
		else {
			pairs.push(encodeURIComponent(prefix ? prefix + '.' + prop : prop) +
				'=' +
				encodeURIComponent(obj[prop])
			);
		}
	}
	return pairs.join('&');
};

/**
 * @param {utils.resource} resource
 * @param {Object.<string, *>} data
 */
Server.prototype.getUrl = function(resource, data) {
	var k;
	var v;
	var err;
	var url = resource.destination + resource.endpoint;
	var branch_id = /^[0-9]{15,20}$/;
	var branch_key = /key_(live|test)_[A-Za-z0-9]{32}/;

	var appendKeyOrId = function(data, destinationObject) {
		if (typeof destinationObject === 'undefined') {
			destinationObject = { };
		}
		if (data['branch_key'] && branch_key.test(data['branch_key'])) {
			destinationObject['branch_key'] = data['branch_key'];
			return destinationObject;
		}
		else if (data['app_id'] && branch_id.test(data['app_id'])) {
			destinationObject['app_id'] = data['app_id'];
			return destinationObject;
		}
		else if (data['instrumentation']) {
			destinationObject['instrumentation'] = data['instrumentation'];
		}
		else {
			throw Error(utils.message(
				utils.messages.missingParam,
				[
					resource.endpoint,
					'branch_key or app_id'
				]
			));
		}
	};

	if (resource.endpoint === '/v1/has-app') {
		try {
			resource.queryPart = appendKeyOrId(data, resource.queryPart);
		}
		catch (e) {
			return {
				error: e.message
			};
		}
	}

	if (typeof resource.queryPart !== 'undefined') {
		for (k in resource.queryPart) {
			if (!resource.queryPart.hasOwnProperty(k)) {
				continue;
			}
			err = (typeof resource.queryPart[k] === 'function') ?
				resource.queryPart[k](resource.endpoint, k, data[k]) :
				err;
			if (err) {
				return { error: err };
			}
			url += '/' + data[k];
		}
	}

	var d = { };
	// TODO: Add validation for v1/pageview and v1/dismiss, move setBranchViewData into a separate location so that it is isolated
	if (typeof resource.params !== 'undefined' && resource.endpoint !== '/v1/pageview' && resource.endpoint !== '/v1/dismiss') {
		for (k in resource.params) {
			if (resource.params.hasOwnProperty(k)) {
				err = resource.params[k](resource.endpoint, k, data[k]);
				if (err) {
					return {
						error: err
					};
				}

				v = data[k];
				if (!(typeof v === 'undefined' || v === '' || v === null)) {
					d[k] = v;
				}
			}
		}
	}
	else if (resource.endpoint === '/v1/pageview' || resource.endpoint === '/v1/dismiss') {
		// /v1/pageview and v1/dismiss require custom keys to be available in the post body due
		// to .setBranchViewData() call so the logic above won't work
		utils.merge(d, data);
	}

	if (resource.method === 'POST' || resource.endpoint === '/v1/credithistory') {
		try {
			data = appendKeyOrId(data, d);
		}
		catch (e) {
			return {
				error: e.message
			};
		}
	}

	if (resource.endpoint === '/v1/event') {
		d['metadata'] = safejson.stringify(d['metadata'] || {});
		if (d.hasOwnProperty('commerce_data')) {
			d['commerce_data'] = safejson.stringify(d['commerce_data'] || {});
		}
	}

	if (resource.endpoint === '/v1/pageview' || resource.endpoint === '/v1/dismiss') {
		if (d['metadata']) {
			d['metadata'] = safejson.stringify(d['metadata'] || {});
		}
	}

	if (resource.endpoint === '/v1/open') {
		d['options'] = safejson.stringify(d['options'] || {});
	}

	return {
		data: this.serializeObject(d, ''),
		url: url.replace(/^\//, '')
	};
};

/**
 * This function is standalone for easy mocking.
 * @param {string} src
 */
Server.prototype.createScript = function(src, onError, onLoad) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.src = src;

	utils.addNonceAttribute(script);

	var heads = document.getElementsByTagName('head');
	if (!heads || heads.length < 1) {
		if (typeof onError === 'function') {
			onError();
		}
		return;
	}
	heads[0].appendChild(script);

	if (typeof onError === 'function') {
		utils.addEvent(script, 'error', onError);
	}
	if (typeof onLoad === 'function') {
		utils.addEvent(script, 'load', onLoad);
	}
};

/**
 * @param {string} requestURL
 * @param {Object} requestData
 * @param {utils._httpMethod} requestMethod
 * @param {function(?Error,*=,?=)=} callback
 */
Server.prototype.jsonpRequest = function(requestURL, requestData, requestMethod, callback) {
	var brtt = Date.now();
	var brttTag = utils.currentRequestBrttTag;
	/* On iOS 11-Safari when a partner calls .deepview() and uses $uri_redirect_mode: 2,
	   they will not get transported into the app (if installed) on pageload because
	   callbackString will evaluate to branch_callback_0. The backend expects branch_callback_1
	   for auto-open to work. This is why we have the fix below.
	*/
	if (this._jsonp_callback_index === 0 && utils.isSafari11OrGreater()) {
		this._jsonp_callback_index++;
	}
	var callbackString = 'branch_callback__' + (this._jsonp_callback_index++);

	var postPrefix = (requestURL.indexOf('branch.io') >= 0) ? '&data=' : '&post_data=';
	var postData = (requestMethod === 'POST') ?
		encodeURIComponent(utils.base64encode(goog.json.serialize(requestData))) :
		'';

	var timeoutTrigger = window.setTimeout(
		function() {
			window[callbackString] = function() { };
			utils.addPropertyIfNotNull(utils.instrumentation, brttTag, utils.calculateBrtt(brtt));
			callback(new Error(utils.messages.timeout), null, 504);
		},
		utils.timeout
	);

	window[callbackString] = function(data) {
		window.clearTimeout(timeoutTrigger);
		callback(null, data);
	};

	this.createScript(
		requestURL + (requestURL.indexOf('?') < 0 ? '?' : '') +
			(postData ? postPrefix + postData : '') +
			(requestURL.indexOf('/c/') >= 0 ? '&click=1' : '') +
			'&callback=' + callbackString,
		function onError() {
			callback(new Error(utils.messages.blockedByClient), null);
		},
		function onLoad() {
			utils.addPropertyIfNotNull(utils.instrumentation, brttTag, utils.calculateBrtt(brtt));
			try {
				if (typeof this.remove === 'function') {
					this.remove();
				}
				else {
					// some browsers do not have a 'remove' method
					// for Element, so fall back
					this.parentNode.removeChild(this);
				}
			}
			catch (e) {
				// we're trying to remove the script tag during a
				// jsonp request, but if that fails, we shouldn't
				// break anything else...just continue
			}
			delete window[callbackString];
		});
};

/**
 * @param {string} url
 * @param {Object} data
 * @param {utils._httpMethod} method
 * @param {storage} storage
 * @param {function(?Error,*=,?=)=} callback
 * @param {?boolean=} noparse
 */
Server.prototype.XHRRequest = function(url, data, method, storage, callback, noparse) {
	var brtt = Date.now();
	var brttTag = utils.currentRequestBrttTag;
	var req = (window.XMLHttpRequest ?
			new XMLHttpRequest() :
			new ActiveXObject('Microsoft.XMLHTTP'));
	req.ontimeout = function() {
		utils.addPropertyIfNotNull(utils.instrumentation, brttTag, utils.calculateBrtt(brtt));
		callback(new Error(utils.messages.timeout), null, 504);
	};
	req.onerror = function(e) {
		callback(new Error(e.error || ('Error in API: ' + req.status)), null, req.status);
	};
	req.onreadystatechange = function() {
		var data;
		if (req.readyState === 4) {
			utils.addPropertyIfNotNull(utils.instrumentation, brttTag, utils.calculateBrtt(brtt));
			if (req.status === 200) {
				if (noparse) {
					data = req.responseText;
				}
				else {
					try {
						data = safejson.parse(req.responseText);
					}
					catch (e) {
						data = {};
					}
				}
				callback(null, data, req.status);
			}
			else if (req.status === 402) {
				callback(new Error('Not enough credits to redeem.'), null, req.status);
			}
			else if (req.status.toString().substring(0, 1) === '4' ||
					req.status.toString().substring(0, 1) === '5') {
				// Server returns helpful information when a partner sends up incorrect fields in logEvent().
				// This information appears in req.responseText.
				if (req['responseURL'] && req['responseURL'].includes("v2/event")) {
					callback(req['responseText'], null, req['status']);
				}
				else {
					callback(new Error('Error in API: ' + req.status), null, req.status);
				}
			}
		}
	};

	try {
		req.open(method, url, true);
		req.timeout = utils.timeout;
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.send(data);
	}
	catch (e) {
		storage.set('use_jsonp', true);
		this.jsonpRequest(url, data, method, callback);
	}
};

/**
 * @param {utils.resource} resource
 * @param {Object.<string, *>} data
 * @param {storage} storage
 * @param {function(?Error,*=)=} callback
 */
Server.prototype.request = function(resource, data, storage, callback) {
	var self = this;

	if (resource.endpoint === "/v1/pageview" && data && data['journey_displayed']) {
		// special case for pageview endpoint
		utils.currentRequestBrttTag = resource.endpoint + '-1-brtt';
	}
	else {
		utils.currentRequestBrttTag = resource.endpoint + '-brtt';
	}

	if ((resource.endpoint === "/v1/url" || resource.endpoint === "/v1/has-app") && Object.keys(utils.instrumentation).length > 1) {
		delete utils.instrumentation['-brtt'];
		data['instrumentation'] = safejson.stringify(utils.merge({}, utils.instrumentation));
		utils.instrumentation = {};
	}

	// Removes PII from request data in case fields flow in from cascading requests
	if (utils.userPreferences.trackingDisabled) {
		var PII = [ 'browser_fingerprint_id', 'alternative_browser_fingerprint_id', 'identity_id', 'session_id' ];
		for (var index = 0; index < PII.length; index++) {
			if (data.hasOwnProperty(PII[index])) {
				delete data[PII[index]];
			}
		}
	}

	var u = this.getUrl(resource, data);
	if (u.error) {
		var errorObj = {
			message: u.error,
			endpoint: resource.endpoint,
			data: data
		};
		return callback(new Error(safejson.stringify(errorObj)));
	}

	var url;
	var postData = '';
	if (resource.method === 'GET') {
		url = u.url + '?' + u.data;
	}
	else {
		url = u.url;
		postData = u.data;
	}

	// How many times to retry the request if the initial attempt fails
	var retries = utils.retries;
	// If request fails, retry after X miliseconds
	/***
	 * @type {function(?Error,*=): ?undefined}
	 */
	var done = function(err, data, status) {
		if (err && retries > 0 && (status || "").toString().substring(0, 1) === '5') {
			retries--;
			window.setTimeout(function() {
				makeRequest();
			}, utils.retry_delay);
		}
		else {
			callback(err, data);
		}
	};

	if (utils.userPreferences.trackingDisabled && utils.userPreferences.shouldBlockRequest(url, data)) {
		// If partners call functions that reach-out to blocked endpoints after init() finishes, then we should return an error with a message
		return utils.userPreferences.allowErrorsInCallback ? done(new Error(utils.messages.trackingDisabled), null, 300) : done(null, {}, 200);
	}

	var makeRequest = function() {
		if (storage.get('use_jsonp') || resource.jsonp) {
			self.jsonpRequest(url, data, resource.method, done);
		}
		else {
			self.XHRRequest(url, postData, resource.method, storage, done);
		}
	};
	makeRequest();
};
