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
	this._tempStore = this._sessionStoreAvailable ? sessionStorage : this._store;
	this._permStore = this._localStoreAvailable ? localStorage : this._store;
};

/**
 * @param {string} key
 * @param {*} value
 */
BranchStorage.prototype['setPermItem'] = function(key, value) {
	this._permStore[key] = value;
};

/**
 * @param {string} key
 * @param {*} value
 */
BranchStorage.prototype['setTempItem'] = function(key, value) {
	this._tempStore[key] = value;
};


// FIX THIS
/**
 * @param {string} key
 */
BranchStorage.prototype['getItem'] = function(key) {
	var tempValue = this._tempStore.getItem(key);
	var permValue = this._permStore.getItem(key);
	var storeValue = typeof this._store[key] != 'undefined' ? this._store[key] : null;
	return tempValue || permValue || storeValue;
};


// FIX THIS
/**
 * @param {string} key
 */
BranchStorage.prototype['removeItem'] = function(key) {
	this._tempStore.removeItem(key);
	this._permStore.removeItem(key);
	delete this._store[key];
};

BranchStorage.prototype['clear'] = function() {
	this._store = { };
	this._tempStore.clear();
	this._permStore.clear();
};

BranchStorage.prototype['clearTemp'] = function() {
	this._tempStore.clear();
};

BranchStorage.prototype['clearPerm'] = function() {
	this._permStore.clear();
};

/**
 * @function storage
 * @return {BranchStorage}
 */
var storage = function() {
	return new BranchStorage();
};
