/**
 * A custom storage abstraction class that implements:
 * sessionStorage, localStorage, cookies, titanium storage, and a plain old javascript object as a fallback
 */

goog.provide('storage');

var COOKIE_DAYS = 365;

/** @typedef {{get:function({string}), set:function({string}, {string}), remove:function({string}), clear:function(), isEnabled:function()}} */
var storage;

/**
 * @class BranchStorage
 * @constructor
 */
 var BranchStorage = function(storageMethods) {
	for (var i = 0; i < storageMethods.length; i++) {
		var storageMethod = this[storageMethods[i]];
		if (storageMethod.isEnabled()) {
			storageMethod._store = { };
			return storageMethod;
		}
	}
};

/** @type storage */
BranchStorage.prototype['local'] = {
	get: function(key) { return localStorage.getItem(key); },
	set: function(key, value) { localStorage.setItem(key, value); },
	remove: function(key) { localStorage.removeItem(key); },
	clear: function() { localStorage.clear(); },
	isEnabled: function () {
		try {
			localStorage.setItem("test", "");
			localStorage.removeItem("test");
			return true;
		}
		catch(err) {
			return false;
		}
	}
};

/** @type storage */
BranchStorage.prototype['session'] = {
	get: function(key) { return sessionStorage.getItem(key); },
	set: function(key, value) { sessionStorage.setItem(key, value); },
	remove: function(key) { sessionStorage.removeItem(key); },
	clear: function() { sessionStorage.clear(); },
	isEnabled: function() {
		try {
			sessionStorage.setItem("test", "");
			sessionStorage.removeItem("test");
			return true;
		}
		catch(err) {
			return false;
		}
	}
};

// cookie object goes in function to specify perm or temp
BranchStorage.prototype['cookie'] = function(perm) {
	return {
		get: function(key) {
			var keyEQ = "BRANCH_WEBSDK_COOKIE" + key + "=";
		    var cookieArray = document.cookie.split(';');
		    for (var i = 0; i < cookieArray.length; i++) {
		        var cookie = cookieArray[i];
		        while (cookie.charAt(0) == ' ') { cookie = cookie.substring(1, cookie.length); }
		        if (cookie.indexOf(keyEQ) == 0) { return cookie.substring(keyEQ.length, cookie.length); }
		    }
		    return null;
		},
		set: function(key, value) {
			var expires = "";
		    if (perm) {
		        var date = new Date();
		        date.setTime(date.getTime() + (COOKIE_DAYS * 24 * 60 * 60 * 1000));
		        // we have to save the expiration date in the cookie string itself, otherwise there is no way to retrieve it
		        expires = "branch_expiration_date=" + date.toGMTString() + "; expires=" + date.toGMTString();
		    }
		    document.cookie = "BRANCH_WEBSDK_COOKIE" + key + "=" + value + expires + "; path=/";
		},
		remove: function(key) { this.cookie.set("BRANCH_WEBSDK_COOKIE" + key, "", -1); },
		clear: function() {
			var deleteCookie = function(cookie) {
				document.cookie = cookie.substring(0, cookie.indexOf('=')) + "=;expires=-1;path=/";
			};
			var cookieArray = document.cookie.split(';');
			for (var i = 0; i < cookieArray.length; i++) {
				var cookie = cookieArray[i];
				while (cookie.charAt(0) == ' ') { cookie = cookie.substring(1, cookie.length); }
				if (cookie.indexOf("BRANCH_WEBSDK_COOKIE") == 0) {
					if (!perm && cookie.indexOf("branch_expiration_date=") == -1) { deleteCookie(cookie); }
					else if (perm && cookie.indexOf("branch_expiration_date=") > 0) { deleteCookie(cookie); }
				}
			}
		},
		isEnabled: function() { return navigator.cookieEnabled; }
	}
};

/** @type storage */
BranchStorage.prototype['pojo'] = {
	get: function(key) { return typeof this._store[key] != 'undefined' ? this._store[key] : null; },
	set: function(key, value) { this._store[key] = value; },
	remove: function(key) { delete this._store[key]; },
	clear: function() { this._store = { }; },
	isEnabled: function() { return true; }
};

/** @type storage */
BranchStorage.prototype['titanium'] = {
	get: function(key) { Ti.App.Properties.getString("BRANCH_TITANIUM_PROPERTY" + key); },
	set: function(key, value) { Ti.App.Properties.setString("BRANCH_TITANIUM_PROPERTY" + key, value); },
	remove: function(key) { Ti.App.Properties.setString("BRANCH_TITANIUM_PROPERTY" + key, ""); },
	clear: function() {
		/** @type {{Ti.App.Properties.listProperties:function()}} */
		var props = Ti.App.Properties.listProperties();
		for (var i = 0; i < props.length; i++) {
			if (props[i].indexOf("BRANCH_TITANIUM_PROPERTY") == 0) {
			    Ti.App.Properties.setString(props[i], "");
			}
		}
	},
	isEnabled: function() {
		try {
			Ti.App.Properties.setString("test", "");
			Ti.App.Properties.getString("test");
			return true;
		}
		catch(err) {
			return false;
		}
	}
};
