'use strict';
goog.provide('session');

/*jshint unused:false*/
goog.require('goog.json');
goog.require('utils');
goog.require('safejson');
goog.require('storage');

/**
 * @param {storage} storage
 * @param {boolean=} first
 * @return {Object}
 */
session.get = function(storage, first) {
	var sessionString = first ? 'branch_session_first' : 'branch_session';
	try {
		let data = safejson.parse(storage.get(sessionString, first)) || null;
		return decodeBFPs(data);
	}
	catch (e) {
		return null;
	}
};

/**
 * @param {storage} storage
 * @param {Object} data
 * @param {boolean=} first
 */
session.set = function(storage, data, first) {
	data = encodeBFPs(data);
	storage.set('branch_session', goog.json.serialize(data));
	if (first) {
		storage.set('branch_session_first', goog.json.serialize(data), true);
	}
};

/**
 * @param {storage} storage
 * @param {Object} newData
 */
session.update = function(storage, newData) {
	if (!newData) {
		return;
	}
	newData = encodeBFPs(newData);
	var currentData = encodeBFPs(session.get(storage)) || {};
	var data = goog.json.serialize(utils.merge(currentData, newData));
	storage.set('branch_session', data);
};

/**
 * Encodes BFP in data object with Base64 encoding.
 * BFP is supposed to be Base64 encoded when stored in local storage/cookie.
 * @param {Object} data 
 */
function encodeBFPs(data) {
	if (data && data["browser_fingerprint_id"] 
		&& !utils.isBase64Encoded(data["browser_fingerprint_id"])) {
		data["browser_fingerprint_id"] = btoa(data["browser_fingerprint_id"]);
	}
	if (data && data["alternative_browser_fingerprint_id"]
		&& !utils.isBase64Encoded(data["alternative_browser_fingerprint_id"])) {
		data["alternative_browser_fingerprint_id"] = btoa(data["alternative_browser_fingerprint_id"]);
	}
	return data;
}

/**
 * Decodes BFPs in data object from Base64 encoding.
 * BFP is supposed to be Base64 encoded when stored in local storage/cookie. 
 * @param {Object} data
 */
function decodeBFPs(data) {
	if (data && utils.isBase64Encoded(data["browser_fingerprint_id"])) {
		data["browser_fingerprint_id"] = atob(data["browser_fingerprint_id"]);
	}
	if (data && utils.isBase64Encoded(data["alternative_browser_fingerprint_id"])) {
		data["alternative_browser_fingerprint_id"] = atob(data["alternative_browser_fingerprint_id"]);
	}
	return data;
}