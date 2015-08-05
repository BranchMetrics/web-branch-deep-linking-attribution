goog.require('Queue');

describe('Queue', function() {
    var queue = Queue();
    var clock = sinon.useFakeTimers();
    var orderCalled = [];

    var assert = testUtils.unplanned();

    it('should queue a function and call it', function(done) {
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
        queue(function(next) {
            setTimeout(function() {
                orderCalled.push(1);
                next();
            }, 10);
        });
        assert.equal(undefined, orderCalled[1], 'Has not yet called function');
        queue(function(next) {
            setTimeout(function() {
                orderCalled.push(2);
                next();
            }, 10);
        });
        clock.tick(10);
        assert.equal(1, orderCalled[1], 'Called first function');
        assert.equal(undefined, orderCalled[2], 'Has not yet called second function');
        clock.tick(10);
        assert.equal(2, orderCalled[2], 'Called second function');
        done();
    });
});
