'use strict';

goog.require('storage'); // jshint ignore:line

var BRANCH_KEY_PREFIX = 'BRANCH_WEBSDK_KEY';
var ITEM_KEY = 'key';
var ITEM_KEY_UNSTORED = 'key unstored';
var ITEM_VALUE = 'value';

describe('session storage', function() {
	var storage = new BranchStorage([ 'session' ]); // jshint ignore:line
	var assert = testUtils.unplanned();
	beforeEach(function() {
		storage.clear();
	});

	it('should set an item', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		assert.strictEqual(
			sessionStorage.getItem(BRANCH_KEY_PREFIX + ITEM_KEY),
			ITEM_VALUE,
			'key / vaue stored'
		);
	});

	it('should get stored item with key', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get(ITEM_KEY_UNSTORED);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(ITEM_KEY, ITEM_VALUE, 'session');
		storage.remove(ITEM_KEY);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		storage.clear();
		assert.deepEqual(sessionStorage.getItem(ITEM_KEY), null, 'Storage cleared');
	});
});

describe('local storage', function() {
	var storage = new BranchStorage([ 'local' ]); // jshint ignore:line
	var assert = testUtils.unplanned();
	beforeEach(function() {
		storage.clear();
	});

	it('should set an item in localStorage', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		assert.strictEqual(
			localStorage.getItem(BRANCH_KEY_PREFIX + ITEM_KEY),
			ITEM_VALUE,
			'key / vaue stored'
		);
	});

	it('should get stored item with key', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get(ITEM_KEY_UNSTORED);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(ITEM_KEY, ITEM_VALUE, 'session');
		storage.remove(ITEM_KEY);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		storage.clear();
		assert.deepEqual(localStorage.getItem(ITEM_KEY), null, 'Storage cleared');
	});
});

// Revist this because Date() is all screwed up because of Sinon, which erases all cookies
/*
describe('cookie storage', function() {
	var storage = new BranchStorage(['permcookie']); // jshint ignore:line

	var ITEM_KEY = 'key';
	var ITEM_VALUE = 'value';
	var assert = testUtils.unplanned();

	it('should get stored item with key', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get('not_an_item');
		assert.strictEqual(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(ITEM_KEY + 'testRemove', ITEM_VALUE, 'session');
		storage.remove(ITEM_KEY + 'testRemove');
		var item = storage.get(ITEM_KEY + 'testRemove');
		assert.strictEqual(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set('key', 'value');
		storage.clear();
		assert.deepEqual(storage.get('key'), null, 'Storage cleared');
	});
});
*/

describe('pojo storage', function() {
	var storage = new BranchStorage([ 'pojo' ]); // jshint ignore:line
	var assert = testUtils.unplanned();
	beforeEach(function() {
		storage.clear();
	});

	it('should set a temporary item', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		assert.strictEqual(storage._store[ITEM_KEY], ITEM_VALUE, 'key / vaue stored');
	});

	it('should get stored item with key', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		var item = storage.get(ITEM_KEY_UNSTORED);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(ITEM_KEY, ITEM_VALUE, 'session');
		storage.remove(ITEM_KEY);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		storage.clear();
		assert.deepEqual(storage._store[ITEM_KEY], null, 'Storage cleared');
	});
});
