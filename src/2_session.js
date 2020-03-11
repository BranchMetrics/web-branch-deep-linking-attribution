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
		return utils.decodeBFPs(data);
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
	data = utils.encodeBFPs(data);
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
	var data = goog.json.serialize(utils.encodeBFPs(utils.merge(currentData, newData)));
	storage.set('branch_session', data);
};

/**
 * Patches a field in localStorage or sessionStorage or both.
 * @param {storage} storage
 * @param {Object} data
 * @param {boolean=} druable
 */
session.patch = function(storage, data, updateLocalStorage){

	var merge = (source, patch) => {
		return utils.encodeBFPs(utils.merge(goog.json.parse(source), patch));
	};

	var session = storage.get('branch_session', false) || {};
	storage.set('branch_session', goog.json.serialize(merge(session, data)));

	if (updateLocalStorage){
		const sessionFirst = storage.get('branch_session_first', true) || {};
		storage.set('branch_session_first', goog.json.serialize(merge(sessionFirst, data)), true);
	}
};