/**
 * A simple session storae alternative if sessionStorage is not available. i.e. mobile Safari Private mode.
 * Note: this session does not persist after the user navigates away.
 */

goog.provide('Storage');

/**
 * @class BranchStorage
 * @constructor
 */
var BranchStorage = function() {
	this._store = {};
};

BranchStorage.prototype['setItem'] = function(key, value) {
	this._store[key] = value;
};

BranchStorage.prototype['getItem'] = function(key) {
	if (typeof this._store[key] != 'undefined') {
		return this._store[key];
	}
	else {
		return null;
	}
};

BranchStorage.prototype['removeItem'] = function(key) {
	delete this._store[key];
};

BranchStorage.prototype['clear'] = function() {
	this._store = {};
};

/**
 * @return BranchStorage
 */
Storage = function() {
	try {
		sessionStorage.setItem("test", "");
		sessionStorage.removeItem("test");
		return sessionStorage;
	}
	catch (e) {
		return new BranchStorage();
	}
};
