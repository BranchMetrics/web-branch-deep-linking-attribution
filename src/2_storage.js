/**
 * A custom storage abstraction class that implements:
 * sessionStorage, localStorage, cookies, titanium storage,
 * and a plain old javascript object as a fallback
 */
'use strict';

goog.provide('storage');
/*jshint unused:false*/
goog.require('goog.json');
goog.require('utils');

/*globals Ti, TITANIUM_BUILD */

var COOKIE_MS = 365 * 24 * 60 * 60 * 1000;
var BRANCH_KEY_PREFIX = 'BRANCH_WEBSDK_KEY';

/** @typedef {undefined|{get:function(string), set:function(string, (string|boolean)),
 * remove:function(string), clear:function(), isEnabled:function()}} */
var storage;

if (TITANIUM_BUILD) {
	/** @typedef {{listProperties: function(), setString: function({string}, {string}),
	 * getString: function({string})}}*/
	Ti.App.Properties; // jshint ignore:line
}

/**
 * @class BranchStorage
 * @constructor
 */
var BranchStorage = function(storageMethods) {
	for (var i = 0; i < storageMethods.length; i++) {
		var storageMethod = this[storageMethods[i]];
		storageMethod = (typeof storageMethod === 'function') ? storageMethod() : storageMethod;
		if (storageMethod.isEnabled()) {
			storageMethod._store = { };
			return storageMethod;
		}
	}
};

var prefix = function(key) {
	return (key === 'branch_session' || key === 'branch_session_first') ?
		key :
		BRANCH_KEY_PREFIX + key;
};

var trimPrefix = function(key) {
	return key.replace(BRANCH_KEY_PREFIX, '');
};

var retrieveValue = function(value) {
	if (value === 'true') {
		return true;
	}
	if (value === 'false') {
		return false;
	}
	return value;
};

var webStorage = function(perm) {
	var storageMethod;
	try {
		storageMethod = perm ? localStorage : sessionStorage;
	}
	catch (err) {
		return {
			isEnabled: function() {
				return false;
			}
		};
	}
	return {
		getAll: function() {
			if (typeof storageMethod === 'undefined') {
				return null;
			}

			var allKeyValues = null;
			for (var key in storageMethod) {
				if (key.indexOf(BRANCH_KEY_PREFIX) === 0) {
					if (allKeyValues === null) {
						allKeyValues = { };
					}
					allKeyValues[trimPrefix(key)] = retrieveValue(storageMethod.getItem(key));
				}
			}
			return allKeyValues;
		},
		get: function(key, perm_override) {
			return retrieveValue(
				perm_override ?
					localStorage.getItem(prefix(key)) :
					storageMethod.getItem(prefix(key))
			);
		},
		set: function(key, value, perm_override) {
			if (perm_override) {
				localStorage.setItem(prefix(key), value);
			}
			else {
				storageMethod.setItem(prefix(key), value);
			}
		},
		remove: function(key) {
			storageMethod.removeItem(prefix(key));
		},
		clear: function() {
			Object.keys(storageMethod).forEach(function(item) {
				if (item.indexOf(BRANCH_KEY_PREFIX) === 0) {
					storageMethod.removeItem(item);
				}
			});
		},
		isEnabled: function() {
			try {
				storageMethod.setItem('test', '');
				storageMethod.removeItem('test');
				return true;
			}
			catch (err) {
				return false;
			}
		}
	};
};

/** @type storage */
BranchStorage.prototype['local'] = function() {
	return webStorage(true);
};

/** @type storage */
BranchStorage.prototype['session'] = function() {
	return webStorage(false);
};

var cookies = function(perm) {
	var setCookie = function(key, value) {
		var expires = '';
		if (perm) {
			var date = new Date();
			date.setTime(date.getTime() + COOKIE_MS);
			expires = '; branch_expiration_date=' + date.toGMTString() +
				'; expires=' + date.toGMTString();
		}
		document.cookie = key + '=' + value + expires + '; path=/';
	};
	return {
		getAll: function() {
			var cookieArray = document.cookie.split(';');
			var returnCookieObject = { };
			for (var i = 0; i < cookieArray.length; i++) {
				var cookie = cookieArray[i].replace(' ', '');
				cookie = cookie.substring(0, cookie.length);
				if (cookie.indexOf(BRANCH_KEY_PREFIX) !== -1) {
					var splitCookie = cookie.split('=');
					returnCookieObject[trimPrefix(splitCookie[0])] = retrieveValue(splitCookie[1]);
				}
			}
			return returnCookieObject;
		},
		get: function(key) {
			var keyEQ = prefix(key) + '=';
			var cookieArray = document.cookie.split(';');
			for (var i = 0; i < cookieArray.length; i++) {
				var cookie = cookieArray[i];
				cookie = cookie.substring(1, cookie.length);
				if (cookie.indexOf(keyEQ) === 0) {
					return retrieveValue(cookie.substring(keyEQ.length, cookie.length));
				}
			}
			return null;
		},
		set: function(key, value) {
			setCookie(prefix(key), value);
		},
		remove: function(key) {
			var expires = '';
			document.cookie = prefix(key) + '=; expires=' + expires + '; path=/';
		},
		clear: function() {
			var deleteCookie = function(cookie) {
				document.cookie = cookie.substring(0, cookie.indexOf('=')) + '=;expires=-1;path=/';
			};
			var cookieArray = document.cookie.split(';');
			for (var i = 0; i < cookieArray.length; i++) {
				var cookie = cookieArray[i];
				cookie = cookie.substring(1, cookie.length);
				if (cookie.indexOf(BRANCH_KEY_PREFIX) !== -1) {
					if (!perm && cookie.indexOf('branch_expiration_date=') === -1) {
						deleteCookie(cookie);
					}
					else if (perm && cookie.indexOf('branch_expiration_date=') > 0) {
						deleteCookie(cookie);
					}
				}
			}
		},
		isEnabled: function() {
			return navigator.cookieEnabled;
		}
	};
};

BranchStorage.prototype['cookie'] = function() {
	return cookies(false);
};

BranchStorage.prototype['permcookie'] = function() {
	return cookies(true);
};

/** @type storage */
BranchStorage.prototype['pojo'] = {
	getAll: function() {
		return this._store;
	},
	get: function(key) {
		return this._store[key] || null;
	},
	set: function(key, value) {
		this._store[key] = value;
	},
	remove: function(key) {
		delete this._store[key];
	},
	clear: function() {
		this._store = { };
	},
	isEnabled: function() {
		return true;
	}
};

/** @type storage */
BranchStorage.prototype['titanium'] = {
	getAll: function() {
		var returnObject = { };
		var props = Ti.App.Properties.listProperties();
		for (var i = 0; i < props.length; i++) {
			if (props[i].indexOf(BRANCH_KEY_PREFIX) !== -1) {
				returnObject[props[i]] = retrieveValue(Ti.App.Properties.getString(props[i]));
			}
		}
		return returnObject;
	},
	get: function(key) {
		retrieveValue(Ti.App.Properties.getString(prefix(key)));
	},
	set: function(key, value) {
		Ti.App.Properties.setString(prefix(key), value);
	},
	remove: function(key) {
		Ti.App.Properties.setString(prefix(key), '');
	},
	clear: function() {
		/** @lends {Array} */
		var props = Ti.App.Properties.listProperties();
		for (var i = 0; i < props.length; i++) {
			if (props[i].indexOf(BRANCH_KEY_PREFIX) !== -1) {
				Ti.App.Properties.setString(props[i], '');
			}
		}
	},
	isEnabled: function() {
		try {
			Ti.App.Properties.setString('test', '');
			Ti.App.Properties.getString('test');
			return true;
		}
		catch (err) {
			return false;
		}
	}
};
