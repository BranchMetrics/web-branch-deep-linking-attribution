/**
 * A simple session storae alternative if sessionStorage is not available. i.e. mobile Safari Private mode.
 * Note: this session does not persist after the user navigates away.
 */

goog.provide('storage');

var COOKIE_DAYS = 365;

/**
 * @class BranchStorage
 * @constructor
 *
 * This function checks for all storage methods available
 */
var BranchStorage = function() {
	try {
		localStorage.setItem("test", "");
		localStorage.removeItem("test");
		this._localStoreAvailable = true;
	}
	catch(e) {
		this._localStoreAvailable = false;
	}
	try {
		sessionStorage.setItem("test", "");
		sessionStorage.removeItem("test");
		this._sessionStoreAvailable = true;
	}
	catch(e) {
		this._sessionStoreAvailable = false;
	}
	this._store = { };
};

/**
 * @param {string} key
 * @param {*} value
 * @param {number=} days
 *
 * Note: Don't set `days` to make a transient session cookie that expires when the user closes the window
 *
 */
var setCookie = function(key, value, days) {
	var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        // we have to save the expiration date in the cookie string itself, otherwise there is no way to retrieve it
        expires = "branch_expiration_date=" + date.toGMTString() + "; expires=" + date.toGMTString();
    }
    document.cookie = "BRANCH_WEBSDK_COOKIE" + key + "=" + value + expires + "; path=/";
};

/**
 * @param {string} key
 */
var readCookie = function(key) {
    var keyEQ = "BRANCH_WEBSDK_COOKIE" + key + "=";
    var cookieArray = document.cookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i];
        while (cookie.charAt(0) == ' ') { cookie = cookie.substring(1, cookie.length); }
        if (cookie.indexOf(keyEQ) == 0) { return cookie.substring(keyEQ.length, cookie.length); }
    }
    return null;
};

/**
 * @param {string} key
 *
 * This will clear any cookie, whether it is a session cookie, or one with an expiration date
 */
var clearCookie = function(key) {
    setCookie("BRANCH_WEBSDK_COOKIE" + key, "", -1);
};

// Convenience cookie functions
var clearAllCookies = function() { clearCookies(true, true); };

var clearTempCookies = function() { clearCookies(true); };

var clearPermCookies = function() { clearCookies(false, true); };

/**
 * @param {boolean=} temp
 * @param {boolean=} perm
 */
var clearCookies = function(temp, perm) {
	var deleteCookie = function(cookie) {
		document.cookie = cookie.substring(0, cookie.indexOf('=')) + "=;expires=-1;path=/";
	};
	var cookieArray = document.cookie.split(';');
	for (var i = 0; i < cookieArray.length; i++) {
		var cookie = cookieArray[i];
		while (cookie.charAt(0) == ' ') { cookie = cookie.substring(1, cookie.length); }
		if (cookie.indexOf("BRANCH_WEBSDK_COOKIE") == 0) {
			if (temp && cookie.indexOf("branch_expiration_date=") == -1) { deleteCookie(cookie); }
			else if (perm && cookie.indexOf("branch_expiration_date=") > 0) { deleteCookie(cookie); }
		}
	}
};

/**
 * @param {string} key
 * @param {*} value
 * @param {string} storage - Possible values: 'local', 'session', 'cookie', 'pojo'
 */
BranchStorage.prototype['setItem'] = function(key, value, storage) {
	if (this._localStoreAvailable && storage == "local") { localStorage.setItem(key, value); }
	else if (this._sessionStoreAvailable && storage == "session") { sessionStorage.setItem(key, value); }
	else if (navigator.cookieEnabled && storage == "cookie") { setCookie(key, value, (storage = "local") ? COOKIE_DAYS : undefined); }
	else { this._store[key] = value; }
};

/**
 * @param {string} key
 */
BranchStorage.prototype['getItem'] = function(key) {
	var tempValue = this._sessionStoreAvailable ? sessionStorage.getItem(key) : null;
	var permValue = this._localStoreAvailable ? localStorage.getItem(key) : null;
	var cookieValue = readCookie(key);
	var storeValue = typeof this._store[key] != 'undefined' ? this._store[key] : null;
	return tempValue || permValue || cookieValue || storeValue;
};

/**
 * @param {string} key
 */
BranchStorage.prototype['removeItem'] = function(key) {
	if (this._localStoreAvailable) { localStorage.removeItem(key); }
	if (this._sessionStoreAvailable) { sessionStorage.removeItem(key); }
	if (navigator.cookieEnabled) { clearCookie(key); }
	delete this._store[key];
};

/**
 * @param {string=} storage - *optional* possible values: 'local', 'session', 'cookie', 'pojo'
 */
BranchStorage.prototype['clear'] = function(storage) {
	if (this._localStoreAvailable && (!storage || storage == "local")) { localStorage.clear(); }
	if (this._sessionStoreAvailable && (!storage || storage == "session")) { sessionStorage.clear(); }
	if (navigator.cookieEnabled && (!storage || storage == "cookie")) { clearTempCookies(); }
	if (!storage || storage == "pojo") { this._store = { }; }
};
