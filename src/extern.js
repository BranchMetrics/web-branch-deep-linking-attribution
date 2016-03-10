/**
 * This file is just for the closure compiler, to tell it the types of various
 * external functions. @type{?} means it's "optional".
 */
'use strict';

/** @type {?} */
var define;
/** @type {?} */
define.amd;

/** @type {?} */
var exports;

var module = {
	exports: {}
};

// var console = { log: function() {}, error: function() {} };

var sessionStorage = {
	clear: function() {},
	getItem: function() {},
	setItem: function() {}
};

// Used in Cordova
var require = function(module) {};

var localStorage = {
	clear: function() {},
	getItem: function() {},
	removeItem: function() {},
	setItem: function() {}
};

