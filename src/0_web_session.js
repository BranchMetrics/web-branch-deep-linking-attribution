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
		var branch_session = storage['get']('branch_session');
		if (typeof branch_session == "object") {
			return goog.json.parse(branch_session) || null;
		}
		else { return null; }
	}
	catch (e) { return null; }
};
