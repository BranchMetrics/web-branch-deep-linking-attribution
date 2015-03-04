/**
 * A simple session storae alternative if sessionStorage is not available. i.e. mobile Safari Private mode.
 * Note: this session does not persist after the user navigates away.
 */

 goog.provide('Storage');

/***
 * @class Storage
 * @constructor
 */
 Storage = function() {
	var sessionStorageStructure = { };

	this.setItem = function(key, value) {
		sessionStorageStructure[key] = value;
	};

	this.getItem = function(key) {
		if (typeof sessionStorageStructure[key] != 'undefined') {
			return sessionStorageStructure[key];
		}
		else {
			return null;
		}
	};

	this.removeItem = function(key) {
		delete sessionStorageStructure[key];
	};

	this.clear = function() {
		sessionStorageStructure = { };
	};
	return function() {
		try {
			sessionStorage.setItem("test", "");
			sessionStorage.removeItem("test");
			return sessionStorage;
		}
		catch (e) {
			return this;
		}
	};
};
