goog.require('storage'); // jshint ignore:line

describe('storage', function() {
	// force custom implemented sessions storage
	var storage = new BranchStorage(); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set a temporary item in sessionStorage', function() {
		storage.setTempItem(itemKey, itemValue);
		assert.equal(sessionStorage.getItem(itemKey), itemValue, 'key / vaue stored');
	});

	it('should set a permanent item in localStorage', function() {
		storage.setPermItem(itemKey + 'perm', itemValue);
		assert.equal(localStorage.getItem(itemKey + 'perm'), itemValue, 'key / vaue stored');
	});

	it('shold get temporarily stored item with key', function() {
		var item = storage.getItem(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('shold get permanently stored item with key', function() {
		var item = storage.getItem(itemKey + 'perm');
		assert.equal(item, itemValue, 'correct value with key');
	});

	it('should return null for an unstored item', function() {
		var item = storage.getItem('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove a temporary item', function() {
		storage.setTempItem(itemKey + 'testRemove', itemValue);
		storage.removeItem(itemKey + 'testRemove');
		var item = storage.getItem(itemKey + 'testRemove');
		assert.equal(item, null, 'returned null');
	});

	it('should remove a permanent item', function() {
		storage.setTempItem(itemKey + 'testPermanent', itemValue);
		storage.removeItem(itemKey + 'testPermanent');
		var item = storage.getItem(itemKey + 'testPermanent');
		assert.equal(item, null, 'returned null');
	});

	it('should clear temporary items individually', function() {
		storage.setPermItem(itemKey + 'testPermanentIndivually1', itemValue);
		storage.setTempItem(itemKey + 'testTemporaryIndivually1', itemValue);
		storage.clearTemp();
		var itemTemp = storage.getItem(itemKey + 'testTemporaryIndivually1');
		var itemPermanent = storage.getItem(itemKey + 'testPermanentIndivually1');
		assert.equal(itemTemp, null, 'returned null');
		assert.equal(itemPermanent, 'value', 'returned value for permanent');
	})

	it('should clear permanent items individually', function() {
		storage.setPermItem(itemKey + 'testPermanentIndivually2', itemValue);
		storage.setTempItem(itemKey + 'testTemporaryIndivually2', itemValue);
		storage.clearPerm();
		var itemTemp = storage.getItem(itemKey + 'testTemporaryIndivually2');
		var itemPermanent = storage.getItem(itemKey + 'testPermanentIndivually2');
		assert.equal(itemPermanent, null, 'returned null');
		assert.equal(itemTemp, 'value', 'returned value for permanent');
	})

	it('should clear all items', function() {
		storage.setTempItem('keyTemp', 'value1');
		storage.setPermItem('keyPerm', 'value2');
		storage.clear();
		assert.deepEqual(localStorage.getItem('keyTemp'), null, 'Storage cleared');
		assert.deepEqual(localStorage.getItem('keyPerm'), null, 'Storage cleared');
	});
});
