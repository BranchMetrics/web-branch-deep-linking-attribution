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
		return session.decodeBFPs(data);
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
	data = session.encodeBFPs(data);
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
	var currentData = session.get(storage) || {};
	var data = goog.json.serialize(utils.merge(currentData, newData));
	data = session.encodeBFPs(data);
	storage.set('branch_session', data);
};

/**
 * Patches a field in localStorage or sessionStorage or both. 
 * @param {storage} storage
 * @param {Object} data
 * @param {boolean=} druable
 */
session.patch = function(storage, data, updateLocalStorage){

	const merge = (source, patch) =>{
		return utils.merge(source, patch);
	}

	const session = storage.get('branch_session', false) || {}
	storage.set('branch_session', goog.json.serialize(merge(session, data)));		

	if (updateLocalStorage){
		const sessionFirst = storage.get('branch_session_first', true) || {}
		storage.set('branch_session_first', goog.json.serialize(merge(sessionFirst, data)), true);	
	}	
}

/**
 * Encodes BFP in data object with Base64 encoding.
 * BFP is supposed to be Base64 encoded when stored in local storage/cookie.
 * @param {Object} data 
 */
session.encodeBFPs = function (data) {
	if (data && !utils.isBase64Encoded(data["browser_fingerprint_id"])) {
		data["browser_fingerprint_id"] = btoa(data["browser_fingerprint_id"]);
	}
	if (data && !utils.isBase64Encoded(data["alternative_browser_fingerprint_id"])) {
		data["alternative_browser_fingerprint_id"] = btoa(data["alternative_browser_fingerprint_id"]);
	}
	return data;
}

/**
 * Decodes BFPs in data object from Base64 encoding.
 * BFP is supposed to be Base64 encoded when stored in local storage/cookie. 
 * @param {Object} data
 */
session.decodeBFPs = function (data) {
	if (data && utils.isBase64Encoded(data["browser_fingerprint_id"])) {
		data["browser_fingerprint_id"] = atob(data["browser_fingerprint_id"]);
	}
	if (data && utils.isBase64Encoded(data["browser_fingerprint_id"])) {
		data["browser_fingerprint_id"] = atob(data["browser_fingerprint_id"]);
	}
	return data;
}