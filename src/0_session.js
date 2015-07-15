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
session.get = function(storage, first) {
	var sessionString = first ? 'branch_session_first' : 'branch_session';
	try {
		return goog.json.parse(storage.get(sessionString)) || null;
	}
	catch (e) {
		return null;
	}
};

 /**
 * @param {BranchStorage} storage
 * @param {Object} data
 */
session.set = function(storage, data, first) {
	storage.set('branch_session', goog.json.serialize(data));
	if (first) { storage.set('branch_session_first', goog.json.serialize(data)); }
}
