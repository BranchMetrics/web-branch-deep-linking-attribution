import { task_queue } from '../src/0_queue.js';

describe('task_queue', function () {
  let queue;
  let orderCalled;
  const assert = testUtils.unplanned();
  beforeEach(function () {
    queue = task_queue();
    vi.useFakeTimers();
    orderCalled = [];
    queue(function (next) {
      setTimeout(function () {
        orderCalled.push(0);
        next();
      }, 10);
    });
    assert.strictEqual(
      orderCalled[0],
      undefined,
      'Has not yet called function',
    );
  });
  afterEach(function () {
    vi.useRealTimers();
  });

  it('should queue a function and call it', function () {
    vi.advanceTimersByTime(11);
    assert.strictEqual(orderCalled[0], 0, 'Function called');
  });

  it('should enqueue two functions, and call them in order', function () {
    queue(function (next) {
      setTimeout(function () {
        orderCalled.push(1);
        next();
      }, 10);
    });
    vi.advanceTimersByTime(11);
    assert.strictEqual(orderCalled[0], 0, 'Called first function');
    assert.strictEqual(
      orderCalled[1],
      undefined,
      'Has not yet called second function',
    );
    vi.advanceTimersByTime(11);
    assert.strictEqual(orderCalled[1], 1, 'Called second function');
  });
});
