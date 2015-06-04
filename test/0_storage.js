goog.require('storage'); // jshint ignore:line

describe('session storage', function() {
	var storage = new BranchStorage(['session']); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set an item', function() {
		storage.set(itemKey, itemValue);
		assert.equal(sessionStorage.getItem(itemKey), itemValue, 'key / vaue stored');
	});

	it('shold get stored item with key', function() {
		var item = storage.get(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(itemKey + 'testRemove', itemValue, "session");
		storage.remove(itemKey + 'testRemove');
		var item = storage.get(itemKey + 'testRemove');
		assert.equal(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set('key', 'value');
		storage.clear();
		assert.deepEqual(sessionStorage.getItem('key'), null, 'Storage cleared');
	});
});

describe('local storage', function() {
	var storage = new BranchStorage(['local']); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set an item in localStorage', function() {
		storage.set(itemKey, itemValue);
		assert.equal(localStorage.getItem(itemKey), itemValue, 'key / vaue stored');
	});

	it('shold get stored item with key', function() {
		var item = storage.get(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(itemKey + 'testRemove', itemValue, "session");
		storage.remove(itemKey + 'testRemove');
		var item = storage.get(itemKey + 'testRemove');
		assert.equal(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set('key', 'value');
		storage.clear();
		assert.deepEqual(localStorage.getItem('key'), null, 'Storage cleared');
	});
});

// Revist this because Date() is all screwed up because of Sinon, which erases all cookies
/*
describe('cookie storage', function() {
	var storage = new BranchStorage(['permcookie']); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('shold get stored item with key', function() {
		storage.set(itemKey, itemValue);
		var item = storage.get(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(itemKey + 'testRemove', itemValue, "session");
		storage.remove(itemKey + 'testRemove');
		var item = storage.get(itemKey + 'testRemove');
		assert.equal(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set('key', 'value');
		storage.clear();
		assert.deepEqual(storage.get('key'), null, 'Storage cleared');
	});
});
*/
describe('pojo storage', function() {
	var storage = new BranchStorage(['pojo']); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set a temporary item', function() {
		storage.set(itemKey, itemValue);
		assert.equal(storage._store[itemKey], itemValue, 'key / vaue stored');
	});

	it('shold get stored item with key', function() {
		var item = storage.get(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.get('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.set(itemKey + 'testRemove', itemValue, "session");
		storage.remove(itemKey + 'testRemove');
		var item = storage.get(itemKey + 'testRemove');
		assert.equal(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.set('key', 'value');
		storage.clear();
		assert.deepEqual(storage._store['key'], null, 'Storage cleared');
	});

});
