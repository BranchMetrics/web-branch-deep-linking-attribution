'use strict';
goog.provide('safejson');

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
		return JSON.stringify(objJSON);
	}
	catch (e) {

	}

	throw Error("Could not stringify object");
};

