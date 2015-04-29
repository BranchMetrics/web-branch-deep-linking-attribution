/**
 * This file is just for the closure compiler, to tell it the types of various
 * external functions. @type{?} means it's "optional".
 */

/** @type {?} */
var define;
/** @type {?} */
define.amd;

/** @type {?} */
var exports;

var module = { exports: {} };

// var console = { log: function() {}, error: function() {} };

var sessionStorage = { getItem: function() {}, setItem: function() {}, clear: function() {} };

// Used in Cordova
var require = function(module) {};

// We need localStorage in the cordova version of the code
var localStorage = { getItem: function() {}, setItem: function() {}, removeItem: function() {}, clear: function() {} };

// Handle the cordova calls, in particular the cordova.plugin.getInstallData and cordova.plugin.getOpenData used in init.
var cordova = { plugins: { branch_device: { getInstallData: function() {}, getOpenData: function() {} } } };
