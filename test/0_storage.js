goog.require('storage'); // jshint ignore:line

describe('storage', function() {
	// force custom implemented sessions storage
	var storage = new BranchStorage(['session', 'pojo']); // jshint ignore:line

	var itemKey = 'key';
	var itemValue = 'value';
	var assert = testUtils.unplanned();

	it('should set a temporary item in sessionStorage', function() {
		storage.set(itemKey, itemValue);
		assert.equal(sessionStorage.getItem(itemKey), itemValue, 'key / vaue stored');
	});

	/*
	it('should set a permanent item in localStorage', function() {
		storage.set(itemKey + 'perm', itemValue);
		assert.equal(localStorage.get(itemKey + 'perm'), itemValue, 'key / vaue stored');
	});
	*/

	it('shold get temporarily stored item with key', function() {
		var item = storage.get(itemKey);
		assert.equal(item, itemValue, 'correct value with key');
	});
/*
	it('shold get permanently stored item with key', function() {
		var item = storage.get(itemKey + 'perm');
		assert.equal(item, itemValue, 'correct value with key');
	});
*/
	it('should return null for an unstored item', function() {
		var item = storage.get('not_an_item');
		assert.equal(item, null, 'returned null');
	});

	it('should remove a temporary item', function() {
		storage.set(itemKey + 'testRemove', itemValue, "session");
		storage.remove(itemKey + 'testRemove');
		var item = storage.get(itemKey + 'testRemove');
		assert.equal(item, null, 'returned null');
	});
/*
	it('should remove a permanent item', function() {
		storage.set(itemKey + 'testPermanent', itemValue, "session");
		storage.remove(itemKey + 'testPermanent');
		var item = storage.get(itemKey + 'testPermanent');
		assert.equal(item, null, 'returned null');
	});
*/
	it('should clear all items', function() {
		storage.set('key', 'value');
		storage.clear();
		assert.deepEqual(sessionStorage.getItem('key'), null, 'Storage cleared');
	});
});
