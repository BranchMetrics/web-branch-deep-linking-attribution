goog.require('storage'); // jshint ignore:line

describe('storage', function() {
	// force custom implemented sessions storage
	var storage = new BranchStorage(); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set an item', function() {
		storage.setItem(itemKey, itemValue);
		assert.equal(storage._store[itemKey], itemValue, 'key / vaue stored');
	});

	it('shold get stored item with key', function() {
		var item = storage.getItem(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.getItem('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove an item', function() {
		storage.removeItem(itemKey);
		var item = storage.getItem(itemKey);
		assert.equal(item, null, 'returned null');
	});

	it('should clear all items', function() {
		storage.setItem('key1', 'value1');
		storage.setItem('key2', 'value2');
		storage.clear();
		assert.deepEqual(storage._store, { }, 'Storage cleared');
	});
});
