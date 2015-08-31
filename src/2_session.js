'use strict';
goog.provide('session');

/*jshint unused:false*/
goog.require('goog.json');
goog.require('utils');

/**
 * @param {BranchStorage} storage
 * @param {boolean=} first
 * @return {Object}
 */
session.get = function(storage, first) {
	var sessionString = first ? 'branch_session_first' : 'branch_session';
	try {
		return goog.json.parse(storage.get(sessionString, first)) || null;
	}
	catch (e) {
		return null;
	}
};

/**
 * @param {BranchStorage} storage
 * @param {Object} data
 * @param {boolean=} first
 */
session.set = function(storage, data, first) {
	storage.set('branch_session', goog.json.serialize(data));
	if (first) {
		storage.set('branch_session_first', goog.json.serialize(data), true);
	}
};

/**
 * @param {BranchStorage} storage
 * @param {Object} newData
 */
session.update = function(storage, newData) {
	var currentData = session.get(storage);
	var data = utils.merge(currentData, newData);
	storage.set('branch_session', goog.json.serialize(data));
};
