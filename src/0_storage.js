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
	this._store = { };
};

/**
 * @param {string} key
 * @param {*} value
 */
BranchStorage.prototype['setItem'] = function(key, value) {
	this._store[key] = value;
};

/**
 * @param {string} key
 */
BranchStorage.prototype['getItem'] = function(key) {
	if (typeof this._store[key] != 'undefined') {
		return this._store[key];
	}
	else {
		return null;
	}
};

/**
 * @param {string} key
 */
BranchStorage.prototype['removeItem'] = function(key) {
	delete this._store[key];
};

BranchStorage.prototype['clear'] = function() {
	this._store = { };
};

/**
 * @function storage
 * @param {boolean} permanent - If true, create an object based on localStorage instead of sessionStorage.
 * @return {BranchStorage}
 */
storage = function(permanent) {
	try {
		if (permanent) {
			localStorage.setItem("test", "");
			localStorage.removeItem("test");
			return localStorage;
		}
		else {
			sessionStorage.setItem("test", "");
			sessionStorage.removeItem("test");
			return sessionStorage;
		}
	}
	catch (e) {
		return new BranchStorage();
	}
};
