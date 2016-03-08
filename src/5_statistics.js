'use strict';
goog.provide('statistics');

goog.require('utils');

/**
 * @param {function(?Object, ?Object)=} callback
 */
statistics.set = function(storage, key, value, callback) {
	var statsString = storage.get('stats', true) || '';
	var statsGlobal = null;
	var err = null;
	var path = 'p_' + window.location.pathname;

	if (statsString) {
		try {
			statsGlobal = JSON.parse(statsString);
		}
		catch (e) {
			err = new Error(utils.messages.statsParseFail, null);
		}
	}

	if (!statsGlobal) {
		statsGlobal = {};
	}

	if (!statsGlobal.hasOwnProperty(path)) {
		statsGlobal[path] = {};
	}

	statsGlobal[path][key] = value;
	try {
		statsString = JSON.stringify(statsGlobal);
	}
	catch (e) {
		err = new Error(utils.messages.statsParseFail, null);
		statsString = '';
		// console.error('Could not stringify statistics data');
	}
	storage.set('stats', statsString, true);

	if (typeof callback === 'function') {
		callback(err, value);
	}

	return value;
};

/**
 * @param {function(?Object, ?Object)=} callback
 */
 statistics.get = function(storage, key, callback) {
	var statsString = storage.get('stats', true) || '';
	var statsGlobal = null;
	var err = null;
	var value;
	var path = 'p_' + window.location.pathname;

	if (statsString) {
		try {
			statsGlobal = JSON.parse(statsString);
		}
		catch (e) {
			err = new Error(utils.messages.statsParseFail, null);
		}
	}

	if (!statsGlobal) {
		statsGlobal = {};
	}

	if (!statsGlobal.hasOwnProperty(path)) {
		statsGlobal[path] = {};
	}

	value = statsGlobal[path][key];

	if (typeof callback === 'function') {
		callback(err, value);
	}

	return value;
};

/**
 * @param {function(?Object, ?Object)=} callback
 */
statistics.getAll = function(storage, callback) {
	var statsString = storage.get('stats', true) || '';
	var statsGlobal = null;
	var stats = null;
	var err = null;
	var path = 'p_' + window.location.pathname;

	if (statsString) {
		try {
			statsGlobal = JSON.parse(statsString);
		}
		catch (e) {
			err = new Error(utils.messages.statsParseFail, null);
		}
	}

	if (!statsGlobal.hasOwnProperty(path)) {
		stats = null;
	}
	else {
		stats = statsGlobal[path];
	}

	if (typeof callback === 'function') {
		callback(err, stats);
	}

	return stats;
};

/**
 * @param {function(?Object, ?Object)=} callback
 */
statistics.adjust = function(storage, key, value, callback) {
	// utility function...assumes all statistics are numbers
	var prevValue = Number(statistics.get(storage, key));
	if (isNaN(prevValue)) {
		prevValue = 0;
	}
	return statistics.set(storage, key, prevValue + Number(value), callback);
};
