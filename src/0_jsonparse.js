/**
 * The default goog.json.parse uses eval. We don't want that.
 */
'use strict';

goog.provide('safejson');

/*jshint unused:false*/
goog.require('goog.json');

safejson.parse = function(sJSON) {
	sJSON = String(sJSON);
	try {
		return JSON.parse(sJSON);
	}
	catch (e) {

	}

	throw Error("Invalid JSON string: " + sJSON);
};

safejson.stringify = function(objJSON) {
	try {
		return (typeof JSON === 'object' && typeof JSON.stringify === 'function') ? JSON.stringify(objJSON) : goog.json.serialize(objJSON);
	}
	catch (e) {

	}

	throw Error("Could not stringify object");
};

