'use strict';

goog.require('task_queue');

describe('task_queue', function() {
	var clock = sinon.useFakeTimers();
	var assert = testUtils.unplanned();

	it('should queue a function and call it', function(done) {
		var queue = task_queue();
		var orderCalled = [];

		queue(function(next) {
			setTimeout(function() {
				orderCalled.push(0);
				next();
			}, 10);
		});
		assert.equal(undefined, orderCalled[0], 'Has not yet called function');
		clock.tick(10);
		assert.equal(0, orderCalled[0], 'Function called');
		done();
	});

	it('should enqueue two functions, and call them in order', function(done) {
		var queue = task_queue();
		var orderCalled = [];

		queue(function(next) {
			setTimeout(function() {
				orderCalled.push(0);
				next();
			}, 10);
		});
		assert.equal(undefined, orderCalled[0], 'Has not yet called function');
		queue(function(next) {
			setTimeout(function() {
				orderCalled.push(1);
				next();
			}, 10);
		});
		clock.tick(10);
		assert.equal(0, orderCalled[0], 'Called first function');
		assert.equal(undefined, orderCalled[1], 'Has not yet called second function');
		clock.tick(10);
		assert.equal(1, orderCalled[1], 'Called second function');
		done();
	});
});
