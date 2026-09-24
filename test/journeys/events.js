'use strict';

var sinon = require('sinon');

goog.require('journeys_events');

describe('journeys_events.publish', function () {
  const assert = testUtils.unplanned();

  it('passes the event name and data through to branch._publishEvent', function () {
    var branch = { _publishEvent: sinon.spy() };
    var data = { foo: 'bar' };
    journeys_events.publish(branch, 'didShowJourney', data);
    assert.strictEqual(
      branch._publishEvent.calledOnceWith('didShowJourney', data),
      true,
    );
  });

  it('works without a data payload', function () {
    var branch = { _publishEvent: sinon.spy() };
    journeys_events.publish(branch, 'willNotShowJourney');
    assert.strictEqual(
      branch._publishEvent.calledOnceWith('willNotShowJourney', undefined),
      true,
    );
  });
});
