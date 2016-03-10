/**
 * This file initialzes the main branch instance, and re-runs any tasks that
 * were any tasks that were executed on the dummy branch object before real
 * branch was loaded.
 */
'use strict';
goog.provide('branch_instance');

goog.require('Branch');
goog.require('config'); // jshint unused:false

branch_instance = new Branch();

if (window['branch'] && window['branch']['_q']) {
	var queue = window['branch']['_q'];
	for (var i = 0; i < queue.length; i++) {
		var task = queue[i];
		branch_instance[task[0]].apply(branch_instance, task[1]);
	}
}

// Provides a UMD-style module wrapper for the branch instance, meaning
// that the SDK can be used in any CommonJS, RequireJS, and vanilla JS environment.

// AMD
if (typeof define === 'function' && define.amd) {
	define(
		'branch',
		function() {
			return branch_instance;
		}
	);
}
// CommonJS-like environments that support module.exports
else if (typeof exports === 'object') {
	module.exports = branch_instance;
}

// Always make a global.
if (window) {
	window['branch'] = branch_instance;
}

