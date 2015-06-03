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
		return goog.json.parse(storage['getItem']('branch_session') || { });
	}
	catch (e) {
		return { };
	}
};

/**
 * @param {Object} data
 * @param {BranchStorage} storage
 * @param {boolean=} perm
 */
web_session.store = function(data, storage, perm) {
	storage['setItem']('branch_session', goog.json.serialize(data), perm ? "local" : "session");
};

/**
 * @param {BranchStorage} storage
 * @param {string=} perm
 */
web_session.clear = function(storage, perm) {
	storage['clear'](perm ? "local" : "session");
};

/**
 * @param {string} key
 * @param {*} value
 * @param {BranchStorage} storage
 * @param {boolean=} perm
 */
web_session.storeKeyValue = function(key, value, storage, perm) {
	var currentSession = web_session.read(storage);
	currentSession[key] = value;
	web_session.store(currentSession, storage, perm);
};

/**
 * @param {string} key
 * @param {BranchStorage} storage
 */
web_session.readKeyValue = function(key, storage) {
	var currentSession = web_session.read(storage);
	return (currentSession && currentSession[key]) ? currentSession[key] : null;
};
