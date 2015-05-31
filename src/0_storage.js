/**
 * A simple session storae alternative if sessionStorage is not available. i.e. mobile Safari Private mode.
 * Note: this session does not persist after the user navigates away.
 */

goog.provide('storage');

var COOKIE_DAYS = 365;

// Not going to use IndexedDB atm
// var INDEXED_DB_VERSION = 1; // unsigned long long
// var INDEXED_DB_NAME = "BRANCH_DB";

/**
 * @class BranchStorage
 * @constructor
 *
 * This function checks for all available storage methods available
 */
var BranchStorage = function() {
	// Local and session storage
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

	// AH! I don't think we should use IndexedDB: The first time we write to it, the browser will ask the user for permission!
	// That's way to much and will spook people.
	// Commenting out for the time being
	// IndexedDB
	/*
	this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	if (this.indexedDB) { this._indexedDBAvailable = true; }
	else { this._indexedDBAvailable = true; }
	*/

	// As a last resort, we store the data in a JS object that is lost when the user closes the window
	this._store = { };
};

/*
indexedDBObjectStore = function() {
	var request = this.indexedDB.open(INDEXED_DB_NAME);

	request.onerror = function(event) {
		alert("Uh oh");
		// don't need to do anything here. Just leaving this alert here for now to debug
	};
	request.onsuccess = function(event) {
		this._db = event.target.result;
		var objectStore = db.createObjectStore("branch", keyPath: "id", autoIncrement: true);
		objectStore.createIndex("key", "key", { unique: true });
		// success
	};
};
*/

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

// Convenience functions for better readability
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
 */
BranchStorage.prototype['setPermItem'] = function(key, value) {
	if (this._localStoreAvailable) { localStorage.setItem(key, value); }
	if (navigator.cookieEnabled) { setCookie(key, value, COOKIE_DAYS); }
	this._store[key] = value;
};

/**
 * @param {string} key
 * @param {*} value
 */
BranchStorage.prototype['setTempItem'] = function(key, value) {
	if (this._sessionStoreAvailable) { sessionStorage.setItem(key, value); }
	if (navigator.cookieEnabled) { setCookie(key, value); }
	this._store[key] = value;
};

/**
 * @param {string} key
 */
BranchStorage.prototype['getItem'] = function(key) {
	var tempValue = this._localStoreAvailable ? localStorage.getItem(key) : null;
	var permValue = this._sessionStoreAvailable ? sessionStorage.getItem(key) : null;
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

// Clears all storage methods, temporary and permanent
BranchStorage.prototype['clear'] = function() {
	this._store = { };
	if (this._sessionStoreAvailable) { sessionStorage.clear(); }
	if (this._localStoreAvailable) { localStorage.clear(); }
	if (navigator.cookieEnabled) { clearAllCookies(); }
};

// Clears only temporary storage methods
BranchStorage.prototype['clearTemp'] = function() {
	sessionStorage.clear();
	if (navigator.cookieEnabled) { clearTempCookies(); }
	this._store = { };
};

// Clears only permanent storage methods
BranchStorage.prototype['clearPerm'] = function() {
	localStorage.clear();
	if (navigator.cookieEnabled) { clearPermCookies(); }
};
