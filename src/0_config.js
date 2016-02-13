/**
 * Just a couple of variables that shouldn't change very often...
 */
goog.provide('config');

config.link_service_endpoint = 'https://bnc.lt';
config.api_endpoint = 'https://api.branch.io';
config.version = '2.0.0';

/** @define {boolean} */
var WEB_BUILD = false; // jshint unused:false

/** @define {boolean} */
var CORDOVA_BUILD = false; // jshint unused:false

/** @define {boolean} */
var TITANIUM_BUILD = false; // jshint unused:false

var IS_CORDOVA_APP = !!window.cordova;

if (IS_CORDOVA_APP && WEB_BUILD) {
	window.alert("Please use Branch Cordova SDK instead. Visit " +
		"https://github.com/BranchMetrics/Cordova-Ionic-PhoneGap-Deferred-Deep-Linking-SDK" +
		" for more details.");
}

// Only use the closure compiler's JSON.parse as a fallback...otherwise 'eval' is used
// instead by default, which can cause Content Security Policy issues.
window.JSON = window.JSON || {};
window.JSON.parse = window.JSON.parse || goog.json.parse;
