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
