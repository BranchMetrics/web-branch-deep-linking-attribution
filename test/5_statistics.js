'use strict';

goog.require('statistics');

describe('Statistics', function() {
	var ITEM_KEY = 'key';
	var ITEM_VALUE = 5;

	var assert = testUtils.unplanned();
	var storage;

	beforeEach(function() {
		storage = {
			get: sinon
				.stub()
				.returns('{"p_' +
					window.location.pathname +
					'":{"' +
					ITEM_KEY +
					'":"' +
					ITEM_VALUE + '"}}'),
			set: sinon
				.spy()
		};
	});

	afterEach(function() {
	});

	it('should be readable', function() {
		// setup
		var callback = sinon.spy();

		// run the test
		statistics.get(storage, ITEM_KEY, callback);

		// check the results
		assert.ok(callback.calledOnce, 'callback should be called exactly once');
		assert.equal(callback.getCall(0).args[0], null, 'callback should not receive an error');
	});

	it('should be settable', function() {
		// setup
		var callback = sinon.spy();

		// run the test
		statistics.set(storage, ITEM_KEY, ITEM_VALUE, callback);
		statistics.get(storage, ITEM_KEY, callback);

		// check the results
		assert.ok(callback.calledTwice, 'callback should be called exactly twice');

		assert.equal(callback.getCall(1).args[1], ITEM_VALUE,
			'second callback should receive the value');
	});

	it('should be updatable', function() {
		// setup
		var callback = sinon.spy();

		// run the test
		statistics.adjust(storage, ITEM_KEY, 3, callback);

		// check the results
		assert.ok(callback.calledOnce, 'callback should be called exactly once');
		assert.equal(callback.args[0][0], null, 'callback should receive no errors');
		assert.equal(callback.args[0][1], ITEM_VALUE + 3, 'callback should receive value');
	});

});

