/* eslint-disable no-unused-vars */
/**
 * This file is just for the closure compiler, to tell it the types of various
 * external functions. @type{?} means it's "optional".
 */
'use strict';

/** @type {?} */
let define;
/** @type {?} */
define.amd;

/** @type {?} */
let exports;

const module = {
	exports: {}
};

// var console = { log: function() {}, error: function() {} };

const sessionStorage = {
	clear: function() {},
	getItem: function() {},
	setItem: function() {}
};

// Used in Cordova
const require = function(module) {};

const localStorage = {
	clear: function() {},
	getItem: function() {},
	removeItem: function() {},
	setItem: function() {}
};

