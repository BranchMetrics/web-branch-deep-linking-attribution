/**
 * This provides a UMD-style module wrapper for the branch instance, meaning
 * that the SDK can be used in any CommonJS, RequireJS, and vanilla JS environment.
 */
goog.provide('umd');
goog.require('branch_instance');

// AMD
if (typeof define === 'function' && define.amd) {
	define('branch', function() { return branch_instance; });
}
// CommonJS-like environments that support module.exports
else if (typeof exports === 'object') {
	module.exports = branch_instance;
}
// Always make a global.
if (window) { window['branch'] = branch_instance; }
