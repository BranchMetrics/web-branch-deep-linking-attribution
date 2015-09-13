'use strict';

goog.require('task_queue');

describe('task_queue', function() {
	var queue;
	var orderCalled;
	var clock;
	var assert = testUtils.unplanned();
	beforeEach(function() {
		queue = task_queue();
		clock = sinon.useFakeTimers();
		orderCalled = [];
		queue(function(next) {
			setTimeout(function() {
				orderCalled.push(0);
				next();
			}, 10);
		});
		assert.strictEqual(orderCalled[0], undefined, 'Has not yet called function');
	});

	it('should queue a function and call it', function(done) {
		clock.tick(11);
		assert.strictEqual(orderCalled[0], 0, 'Function called');
		done();
	});

	it('should enqueue two functions, and call them in order', function(done) {
		queue(function(next) {
			setTimeout(function() {
				orderCalled.push(1);
				next();
			}, 10);
		});
		clock.tick(11);
		assert.strictEqual(orderCalled[0], 0, 'Called first function');
		assert.strictEqual(orderCalled[1], undefined, 'Has not yet called second function');
		clock.tick(11);
		assert.strictEqual(orderCalled[1], 1, 'Called second function');
		done();
	});
});
