'use strict';

var sinon = require('sinon');

goog.require('branch_view');
goog.require('journeys_dismissals');
goog.require('journeys_utils');
goog.require('resources');
goog.require('utils');

// Characterization tests for journey dismissal: the global suppression window, the per-view
// dismiss record, and the read-side gate in branch_view.shouldDisplayJourney. Pinned against the
// legacy implementation before any of it moves into journeys_dismissals.

function fakeStorage(initial) {
  var store = initial || {};
  return {
    get: sinon.spy(function (key) {
      return store.hasOwnProperty(key) ? store[key] : null;
    }),
    set: sinon.spy(function (key, value) {
      store[key] = value;
    }),
    remove: sinon.spy(function (key) {
      delete store[key];
    }),
    _store: store,
  };
}

describe('journeys_dismissals (extracted module)', function () {
  const assert = testUtils.unplanned();
  var clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1000000);
  });
  afterEach(function () {
    clock.restore();
  });

  it('legacy names delegate to the module', function () {
    assert.strictEqual(
      journeys_utils._findGlobalDismissPeriod,
      journeys_dismissals.globalDismissDeadline,
    );
    assert.strictEqual(
      journeys_utils._setJourneyDismiss,
      journeys_dismissals.recordViewDismiss,
    );
  });

  it('globalDismissDeadline tolerates missing metadata', function () {
    assert.strictEqual(
      journeys_dismissals.globalDismissDeadline(undefined),
      undefined,
    );
  });

  it('recordGlobalDismiss is a no-op without a deadline', function () {
    var storage = fakeStorage();
    journeys_dismissals.recordGlobalDismiss(storage, undefined);
    assert.strictEqual(storage.set.called, false);
  });

  it('recordGlobalDismiss writes the deadline as a branch key', function () {
    var storage = fakeStorage();
    journeys_dismissals.recordGlobalDismiss(storage, 1234);
    assert.strictEqual(
      storage.set.calledOnceWith('globalJourneysDismiss', 1234, true),
      true,
    );
  });

  it('isDismissedGlobally reads and clears the same key shouldDisplayJourney gates on', function () {
    var storage = fakeStorage({ globalJourneysDismiss: 1000000 - 1 });
    assert.strictEqual(journeys_dismissals.isDismissedGlobally(storage), false);
    assert.strictEqual(
      storage.remove.calledOnceWith('globalJourneysDismiss', true),
      true,
    );
    assert.strictEqual(
      journeys_dismissals.isDismissedGlobally(
        fakeStorage({ globalJourneysDismiss: true }),
      ),
      true,
    );
  });
});

describe('journeys dismissals: _findGlobalDismissPeriod', function () {
  const assert = testUtils.unplanned();
  var clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1000000);
  });
  afterEach(function () {
    clock.restore();
  });

  it('returns true for -1 (dismissed forever)', function () {
    assert.strictEqual(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: -1 }),
      true,
    );
  });

  it('returns a timestamp N seconds from now for a positive period', function () {
    assert.strictEqual(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: 60 }),
      1000000 + 60 * 1000,
    );
  });

  it('returns undefined when the period is missing or not a number', function () {
    assert.strictEqual(journeys_utils._findGlobalDismissPeriod({}), undefined);
    assert.strictEqual(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: '60' }),
      undefined,
    );
  });
});

describe('journeys dismissals: _setJourneyDismiss', function () {
  const assert = testUtils.unplanned();
  var clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1000000);
  });
  afterEach(function () {
    clock.restore();
  });

  it('records view_id and dismiss_time under the audience rule id', function () {
    var storage = fakeStorage();
    var result = journeys_utils._setJourneyDismiss(storage, 'view-1', 'rule-1');
    assert.deepEqual(result, {
      'rule-1': { view_id: 'view-1', dismiss_time: 1000000 },
    });
    assert.strictEqual(
      storage._store['journeyDismissals'],
      JSON.stringify(result),
    );
    assert.strictEqual(storage.set.getCall(0).args[2], true);
  });

  it('merges with existing dismissals and overwrites the same rule', function () {
    var storage = fakeStorage({
      journeyDismissals: JSON.stringify({
        'rule-0': { view_id: 'old', dismiss_time: 1 },
        'rule-1': { view_id: 'stale', dismiss_time: 2 },
      }),
    });
    var result = journeys_utils._setJourneyDismiss(storage, 'view-1', 'rule-1');
    assert.deepEqual(result, {
      'rule-0': { view_id: 'old', dismiss_time: 1 },
      'rule-1': { view_id: 'view-1', dismiss_time: 1000000 },
    });
  });
});

describe('journeys dismissals: global gate in branch_view.shouldDisplayJourney', function () {
  const assert = testUtils.unplanned();
  var clock;
  var platformStub;
  var response = {
    event_data: { branch_view_data: { id: 'bv-1' } },
    template: '<html></html>',
  };

  beforeEach(function () {
    clock = sinon.useFakeTimers(1000000);
    platformStub = sinon.stub(utils, 'getPlatformByUserAgent').returns('ios');
  });

  afterEach(function () {
    clock.restore();
    platformStub.restore();
  });

  function withStorage(store) {
    var storage = fakeStorage(store);
    journeys_utils.branch = { _storage: storage };
    return storage;
  }

  it('shows when nothing is stored', function () {
    withStorage();
    assert.strictEqual(
      branch_view.shouldDisplayJourney(response, {}, false),
      true,
    );
  });

  it('suppresses when dismissed forever (true)', function () {
    withStorage({ globalJourneysDismiss: true });
    assert.strictEqual(
      branch_view.shouldDisplayJourney(response, {}, false),
      false,
    );
  });

  it('suppresses while the deadline is in the future', function () {
    withStorage({ globalJourneysDismiss: 1000000 + 1 });
    assert.strictEqual(
      branch_view.shouldDisplayJourney(response, {}, false),
      false,
    );
  });

  it('shows and clears the key once the deadline has passed', function () {
    var storage = withStorage({ globalJourneysDismiss: 1000000 - 1 });
    assert.strictEqual(
      branch_view.shouldDisplayJourney(response, {}, false),
      true,
    );
    assert.strictEqual(
      storage.remove.calledOnceWith('globalJourneysDismiss', true),
      true,
    );
  });

  it('ignores the gate entirely in test mode', function () {
    withStorage({ globalJourneysDismiss: true });
    assert.strictEqual(
      branch_view.shouldDisplayJourney(response, {}, true),
      true,
    );
  });
});

describe('journeys dismissals: _handleJourneyDismiss', function () {
  const assert = testUtils.unplanned();
  var clock;
  var exitStub;
  var requestDataStub;
  var branch;
  var storage;
  var banner = {};
  var branchView;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1000000);
    exitStub = sinon.stub(journeys_utils, 'animateBannerExit');
    requestDataStub = sinon
      .stub(journeys_utils, '_getDismissRequestData')
      .returns({ branch_view_id: 'bv-1' });
    storage = fakeStorage();
    branch = {
      _storage: storage,
      _publishEvent: sinon.spy(),
      addListener: sinon.spy(),
      removeListener: sinon.spy(),
      _api: sinon.spy(),
    };
    journeys_utils.branch = branch;
    journeys_utils.journeyLinkData = { banner_id: 'bv-1' };
    journeys_utils.journeyDismissed = false;
    branchView = {
      shouldDisplayJourney: sinon.stub().returns(true),
      displayJourney: sinon.spy(),
    };
  });

  afterEach(function () {
    clock.restore();
    exitStub.restore();
    requestDataStub.restore();
  });

  function dismiss(metadata, testMode) {
    journeys_utils._handleJourneyDismiss(
      'didClickJourneyClose',
      storage,
      banner,
      'view-1',
      'rule-1',
      metadata || {},
      !!testMode,
      branchView,
    );
  }

  it('publishes the event, marks dismissed, and animates the exit', function () {
    dismiss();
    assert.strictEqual(
      branch._publishEvent.calledOnceWith(
        'didClickJourneyClose',
        journeys_utils.journeyLinkData,
      ),
      true,
    );
    assert.strictEqual(journeys_utils.journeyDismissed, true);
    assert.strictEqual(exitStub.calledOnceWith(banner), true);
  });

  it('records the per-view dismiss and waits for the banner to close before calling the API', function () {
    dismiss();
    assert.ok(storage._store['journeyDismissals']);
    assert.strictEqual(
      storage._store.hasOwnProperty('globalJourneysDismiss'),
      false,
      'no global period in metadata',
    );
    assert.strictEqual(branch.addListener.calledOnce, true);
    assert.strictEqual(
      branch.addListener.getCall(0).args[0],
      'branch_internal_event_didCloseJourney',
    );
    assert.strictEqual(branch._api.called, false);
  });

  it('records the global suppression window when metadata carries one', function () {
    dismiss({ globalDismissPeriod: -1 });
    assert.strictEqual(storage._store['globalJourneysDismiss'], true);
  });

  it('on close: unsubscribes, sends v1/dismiss with the mapped dismissal source', function () {
    dismiss();
    var listener = branch.addListener.getCall(0).args[1];
    listener();
    assert.strictEqual(branch.removeListener.calledOnceWith(listener), true);
    assert.strictEqual(
      requestDataStub.calledOnceWith(branchView, 'Button(X)'),
      true,
    );
    assert.strictEqual(branch._api.getCall(0).args[0], resources.dismiss);
    assert.deepEqual(branch._api.getCall(0).args[1], {
      branch_view_id: 'bv-1',
    });
  });

  it('chains the next journey when the dismiss response carries a template', function () {
    journeys_utils.entryAnimationDisabled = true;
    journeys_utils.exitAnimationDisabled = false;
    dismiss();
    branch.addListener.getCall(0).args[1]();
    var apiCallback = branch._api.getCall(0).args[2];
    var next = {
      template: '<html>next</html>',
      event_data: { branch_view_data: { id: 'bv-2' } },
      journey_link_data: { x: 1 },
    };
    apiCallback(null, next);
    assert.strictEqual(
      branchView.shouldDisplayJourney.calledOnceWith(next, null, false),
      true,
    );
    var call = branchView.displayJourney.getCall(0);
    assert.strictEqual(call.args[0], next.template);
    assert.strictEqual(
      call.args[2],
      'bv-1',
      'prefers the request branch_view_id over the response id',
    );
    assert.strictEqual(call.args[3], next.event_data.branch_view_data);
    assert.strictEqual(call.args[5], next.journey_link_data);
    assert.strictEqual(
      call.args[6],
      branch,
      'passes journeys_utils.branch explicitly, not read by displayJourney itself',
    );
    assert.deepEqual(call.args[7], {
      entryAnimationDisabled: true,
      exitAnimationDisabled: false,
      use_v2_renderer: undefined,
      animationConfig: undefined,
    });
  });

  it('does not chain when the API errors or returns no template', function () {
    dismiss();
    branch.addListener.getCall(0).args[1]();
    var apiCallback = branch._api.getCall(0).args[2];
    apiCallback(new Error('boom'), null);
    apiCallback(null, {});
    assert.strictEqual(branchView.displayJourney.called, false);
  });

  it('in test mode: still publishes and exits, but touches neither storage nor the API', function () {
    dismiss({ globalDismissPeriod: -1 }, true);
    assert.strictEqual(branch._publishEvent.calledOnce, true);
    assert.strictEqual(exitStub.calledOnce, true);
    assert.strictEqual(storage.set.called, false);
    assert.strictEqual(branch.addListener.called, false);
  });
});
