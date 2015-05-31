/*
 * Branch Session
 */

/*jshint unused:false*/
goog.require('goog.json');
goog.provide('session');

 /**
 * @param {BranchStorage} storage
 * @return {Object}
 */
session.read = function(storage) {
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
session.store = function(data, storage, perm) {
	if (perm) { storage['setPermItem']('branch_session', goog.json.serialize(data)); }
	else { storage['setTempItem']('branch_session', goog.json.serialize(data)); }
};

/**
 * @param {BranchStorage} storage
 */
session.clear = function(storage) {
	storage['clear']();
};

/**
 * @param {string} key
 * @param {*} value
 * @param {BranchStorage} storage
 */
session.storeKeyValue = function(key, value, storage) {
	var currentSession = session.read(storage);
	currentSession[key] = value;
	session.store(currentSession, storage);
};

/**
 * @param {string} key
 * @param {BranchStorage} storage
 */
session.readKeyValue = function(key, storage) {
	var currentSession = session.read(storage);
	return (currentSession && currentSession[key]) ? currentSession[key] : null;
};
