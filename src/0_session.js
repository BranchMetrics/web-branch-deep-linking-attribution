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
session.get = function(storage) {
	try {
		return goog.json.parse(storage.get('branch_session')) || null;
	}
	catch (e) {
		return null;
	}
};

 /**
 * @param {BranchStorage} storage
 * @param {Object} data
 */
session.set = function(storage, data) {
	storage.set('branch_session', goog.json.serialize(data));
}
