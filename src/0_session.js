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
	storage.set('branch_session', goog.json.serialize(data)); // on iOS 8.2, goog.json.serialize is undefined
	// Failed to load resource: http://10.0.1.35:9090/Web-SDK/compiler/library/closure-library-master/closure/goog/json/json.js
}
