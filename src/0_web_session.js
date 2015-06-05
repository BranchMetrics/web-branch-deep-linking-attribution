/*
 * Branch Web Session
 * NOTE: This is only included for backwards compatibility with prior Branch sessions
 */

/*jshint unused:false*/
goog.require('goog.json');
goog.provide('web_session');

 /**
 * @param {BranchStorage} storage
 * @return {Object}
 */
web_session.deprecated_read = function(storage) {
	try {
		return goog.json.parse(storage['get']('branch_session')) || null;
	}
	catch (e) {
		return null;
	}
};

/**
 * @param {Object} data
 * @param {BranchStorage} storage
 */
web_session.store = function(data, storage) {
	storage['setObject'](data);
};

/**
 * @param {BranchStorage} storage
 */
web_session.clear = function(storage) {
	storage['clear']();
};

/**
 * @param {string} key
 * @param {*} value
 * @param {BranchStorage} storage
 */
web_session.storeKeyValue = function(key, value, storage) {
	storage['set'](key, value);
	/*
	var currentSession = web_session.read(storage);
	currentSession[key] = value;
	web_session.store(currentSession, storage);
	*/
};

/**
 * @param {string} key
 * @param {BranchStorage} storage
 */
web_session.readKeyValue = function(key, storage) {
	storage['get'](key);
	/*
	var currentSession = web_session.read(storage);
	return (currentSession && currentSession[key]) ? currentSession[key] : null;
	*/
};
