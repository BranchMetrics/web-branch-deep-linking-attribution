/**
 * Just a couple of variables that shouldn't change very often...
 */
goog.provide('config');

config.link_service_endpoint = 'https://bnc.lt';
config.api_endpoint = 'https://api.branch.io';
config.api_endpoint = 'http://localhost:5001';
config.version = '1.7.1';

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
