/**
 * This provides the principal function to make a call to the API. Basically
 * a fancy wrapper around XHR/JSONP/etc.
 */

goog.provide('api');

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


var _jsonp_callback_index = 0;

// define jsonp request
var jsonpRequest = (function() {
	var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

	var request = {};

	request.send = function(url, options) {
		var callback_name = options.callbackName || 'branch_callback__' + (_jsonp_callback_index++);
		var on_success = options.onSuccess || function() {};
		var on_timeout = options.onTimeout || function() {};
		var data;

		if (options.method == "POST") {
			data = encodeURIComponent(Base64.encode(JSON.stringify(options.data))) || "";
		}

		var postDataString = '&data=';
		if (url.indexOf('bnc.lt') >= 0) {
			postDataString = '&post_data=';
		}

		var timeout = options.timeout || 10; // sec

		var timeout_trigger = window.setTimeout(function() {
			window[callback_name] = function() {};
			on_timeout();
		}, timeout * 1000);

		window[callback_name] = function(data) {
			window.clearTimeout(timeout_trigger);
			on_success(data);
		}

		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.src = url + (url.indexOf('?') < 0 ? '?' : '') + (data ? postDataString + data : '') + '&callback=' + callback_name + (url.indexOf('/c/') >= 0 ? '&click=1' : '');

		document.getElementsByTagName('head')[0].appendChild(script);
	}
	return request;
})();

function jsonpMakeRequest(requestURL, requestData, requestMethod, callback) {
	jsonpRequest.send(requestURL, {
		onSuccess: function(json) {
			callback(null, json);
		},
		onTimeout: function() {
			callback({
				error: 'Request timed out.'
			});
		},
		timeout: 3,
		data: requestData,
		method: requestMethod
	});
};

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

	if (sessionStorage.getItem('use_jsonp') || resource.jsonp) {
		jsonpMakeRequest(url, data, resource.method, callback);
	} else {
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
			req.open(resource.method, url, true);
			req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			req.send(postData);
		} catch(e) {
			sessionStorage.setItem('use_jsonp', true);
			jsonpMakeRequest(url, data, resource.method, callback);
		}
	}
};
