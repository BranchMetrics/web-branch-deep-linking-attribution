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
