/**
 * A simple blocking queue for the API requests
 */

/**
 * @returns {function(function(function()))}
 */
export const task_queue = function () {
  const queue = [];
  const next = function () {
    if (queue.length) {
      queue[0](function () {
        queue.shift();
        next();
      });
    }
  };

  return function (task) {
    queue.push(task);
    if (queue.length === 1) {
      next();
    }
  };
};
