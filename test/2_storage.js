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
describe('cookie storage', function() {
	var storage = new BranchStorage([ 'cookie' ]); // jshint ignore:line
	var ITEM_KEY = 'branch_session';
	var ITEM_VALUE = 'test_val';
	var assert = testUtils.unplanned();

	it('should get stored item with key', function() {
		storage.set(ITEM_KEY, ITEM_VALUE);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, ITEM_VALUE, 'correct value for key');
	});

	it('should return null for an un-stored item', function() {
		var item = storage.get('not_an_item');
		assert.strictEqual(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.remove(ITEM_KEY);
		var item = storage.get(ITEM_KEY);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should remove a non branch_session or branch_session_first cookie', function() {
		var cookieName = "test_1";
		var cookieValue = "123";
		storage.set(cookieName, cookieValue);
		storage.remove(cookieName);
		var item = storage.get(cookieName);
		assert.strictEqual(item, null, 'returned null');
	});

	it('should clear all cookies', function() {
		var initialCookies = {
			"key_1": "val_1",
			"branch_session": "val_2",
			"branch_session_first": "val_3"
		};
		for (var key in initialCookies) {
			if (initialCookies.hasOwnProperty(key)) {
				storage.set(key, initialCookies[key]);
			}
		}
		storage.clear();
		var item = null;
		for (key in initialCookies) {
			if (initialCookies.hasOwnProperty(key)) {
				item = storage.get(initialCookies[key]);
				assert.strictEqual(item, null, ' returned null');
			}
		}
	});

	it('should return all cookies', function() {
		var expected = {
			"key_1": "val_1",
			"branch_session": "val_2",
			"branch_session_first": "val_3"
		};
		for (var key in expected) {
			if (expected.hasOwnProperty(key)) {
				storage.set(key, expected[key]);
			}
		}
		var actual = storage.getAll();
		for (key in expected) {
			if (expected.hasOwnProperty(key)) {
				assert.strictEqual(expected[key], actual[key], ' correct value for key');
			}
		}
		storage.clear();
	});
});

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
