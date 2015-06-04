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
	this._store = { };
	for (var i = 0; i < storageMethods.length; i++) {
		var storageMethod = this[storageMethods[i]];
		if (storageMethod.isEnabled()) {
			return storageMethod;
		}
	}
};

/** @type storage */
BranchStorage.prototype['local'] = {
	get: function(key) { localStorage.getItem(key); },
	set: function(key, value) { localStorage.getItem(key, value); },
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
	get: function(key) { sessionStorage.getItem(key); },
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

BranchStorage.prototype['pojo'] = {
	get: function(key) { return typeof this._store[key] != 'undefined' ? this._store[key] : null; },
	set: function(key, value) { this._store[key] = value; },
	remove: function(key) { delete this._store[key]; },
	clear: function() { this._store = { }; },
	isEnabled: function() { return true; }
};

BranchStorage.prototype['titanium'] = {
	get: function() { },
	set: function() { },
	remove: function() { },
	clear: function() { },
	isEnabled: function() { }
};

// call it like this
/*
branch.init
	this.permStorage = getFirstEnabled([ local, cookie(true), pojo ])

	this.permStorage.get()

	this.tempStorage = getFirstEnabled([ session, cookie(false), pojo])
*/
