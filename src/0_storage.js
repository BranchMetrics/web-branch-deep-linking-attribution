/**
 * A simple session storae alternative if sessionStorage is not available. i.e. mobile Safari Private mode.
 * Note: this session does not persist after the user navigates away.
 */

goog.provide('storage');

/**
 * @class BranchStorage
 * @constructor
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
 * @param {number} days
 *
 * Don't set `days` to make a transient session cookie
 *
 */
var setCookie = function(key, value, days) {
	var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    document.cookie = key + "=" + value + expires + "; path=/";
}

/**
 * @param {string} key
 */
function readCookie(key) {
    var keyEQ = key + "=";
    var cookieArray = document.cookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i];
        while (cookie.charAt(0) == ' ') { cookie = cookie.substring(1, cookie.length); }
        if (cookie.indexOf(keyEQ) == 0) { return cookie.substring(keyEQ.length, cookie.length); }
    }
    return null;
}

/**
 * @param {string} key
 */
function clearCookie(key) {
    setCookie(key, "", -1);
}

/**
 * @param {string} key
 * @param {*} value
 */
BranchStorage.prototype['setPermItem'] = function(key, value) {
	if (this._localStoreAvailable) { localStorage.setItem(key, value); }
	else { this._store[key] = value; }
};

/**
 * @param {string} key
 * @param {*} value
 */
BranchStorage.prototype['setTempItem'] = function(key, value) {
	if (this._sessionStoreAvailable) { sessionStorage.setItem(key, value); }
	else { this._store[key] = value; }
};

/**
 * @param {string} key
 */
BranchStorage.prototype['getItem'] = function(key) {
	var tempValue = this._localStoreAvailable ? localStorage.getItem(key) : null;
	var permValue = this._sessionStoreAvailable ? sessionStorage.getItem(key) : null;
	var storeValue = typeof this._store[key] != 'undefined' ? this._store[key] : null;
	return tempValue || permValue || storeValue;
};

/**
 * @param {string} key
 */
BranchStorage.prototype['removeItem'] = function(key) {
	if (this._localStoreAvailable) { localStorage.removeItem(key); }
	if (this._sessionStoreAvailable) { sessionStorage.removeItem(key); }
	delete this._store[key];
};

BranchStorage.prototype['clear'] = function() {
	this._store = { };
	if (this._sessionStoreAvailable) { sessionStorage.clear(); }
	if (this._localStoreAvailable) { localStorage.clear(); }
};

BranchStorage.prototype['clearTemp'] = function() {
	sessionStorage.clear();
	this._store = { };
};

BranchStorage.prototype['clearPerm'] = function() {
	localStorage.clear();
};
