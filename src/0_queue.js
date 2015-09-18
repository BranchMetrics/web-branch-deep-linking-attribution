/**
 * A simple blocking queue for the API requests
 */
'use strict';
goog.provide('task_queue');

/**
 * @returns {function(function(function()))}
 */
var task_queue = function() {
	var queue = [];
	var next = function() {
		if (queue.length) {
			queue[0](function() {
				queue.shift();
				next();
			});
		}
	};
	return function(task) {
		queue.push(task);
		if (queue.length === 1) {
			next();
		}
	};
};
