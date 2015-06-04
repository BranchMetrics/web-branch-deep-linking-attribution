/*
 * Branch Web Session
 */

/*jshint unused:false*/
goog.require('goog.json');
goog.provide('web_session');

 /**
 * @param {BranchStorage} storage
 * @return {Object}
 */
web_session.read = function(storage) {
	try {
		return goog.json.parse(storage['get']('branch_session') || { });
	}
	catch (e) {
		return { };
	}
};

/**
 * @param {Object} data
 * @param {BranchStorage} storage
 */
web_session.store = function(data, storage) {
	storage['set']('branch_session', goog.json.serialize(data));
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
	var currentSession = web_session.read(storage);
	currentSession[key] = value;
	web_session.store(currentSession, storage);
};

/**
 * @param {string} key
 * @param {BranchStorage} storage
 */
web_session.readKeyValue = function(key, storage) {
	var currentSession = web_session.read(storage);
	return (currentSession && currentSession[key]) ? currentSession[key] : null;
};
