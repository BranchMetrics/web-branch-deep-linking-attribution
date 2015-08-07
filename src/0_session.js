/*
 * Branch Session
 */

/*jshint unused:false*/
goog.require('goog.json');
goog.require('utils');
goog.provide('session');

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
    if (first) { storage.set('branch_session_first', goog.json.serialize(data), true); }
};

/**
 * @param {BranchStorage} storage
 * @param {Object} data
 */
session.update = function(storage, new_data) {
    var current_data = session.get(storage);
    var data = utils.merge(current_data, new_data);
    storage.set('branch_session', goog.json.serialize(data));
};
