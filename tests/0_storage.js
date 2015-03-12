goog.require('storage');

describe('storage', function() {
	var storage = new BranchStorage(); // force custom implemented sessions storage
	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set an item', function(done) {
		storage.setItem(itemKey, itemValue);
		assert.equal(storage._store[itemKey], itemValue, 'key / vaue stored');
		done();
	})

	it('shold get stored item with key', function(done) {
		var item = storage.getItem(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
		done();
	});

	it('should return null for an unstored item', function(done) {
		var item = storage.getItem('not_an_item');
		assert.equal(item, null, 'returned null');
		done();
	});

	it('should remove an item', function(done) {
		storage.removeItem(itemKey);
		var item = storage.getItem(itemKey);
		assert.equal(item, null, 'returned null');
		done();
	});

	it('should clear all items', function(done) {
		storage.setItem('key1', 'value1');
		storage.setItem('key2', 'value2');
		storage.clear();
		assert.deepEqual(storage._store, { }, 'Storage cleared');
		done();
	});
});
