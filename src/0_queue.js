/**
 * A simple blocking queue for the API requests
 */
goog.provide('Queue');

Queue = function() {
    var queue = [],
    next = function() {
        if (queue.length) {
            queue[0](function() { queue.shift(); next(); });
        }
    };
    return function(task) {
        queue.push(task);
        if (queue.length == 1) { next(); }
    };
};