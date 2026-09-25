'use strict';

var sinon = require('sinon');

goog.require('journeys_analytics');

describe('journeys_analytics.decodeSymbols', function () {
  const assert = testUtils.unplanned();

  it('returns null for null/undefined input', function () {
    assert.strictEqual(journeys_analytics.decodeSymbols(null), null);
    assert.strictEqual(journeys_analytics.decodeSymbols(undefined), null);
  });

  it('decodes common HTML entities', function () {
    assert.strictEqual(
      journeys_analytics.decodeSymbols('Tom &amp; Jerry'),
      'Tom & Jerry',
    );
    assert.strictEqual(
      journeys_analytics.decodeSymbols('&lt;div&gt;'),
      '<div>',
    );
    assert.strictEqual(journeys_analytics.decodeSymbols('caf&eacute;'), 'café');
  });

  it('leaves strings with no entities untouched', function () {
    assert.strictEqual(
      journeys_analytics.decodeSymbols('plain text'),
      'plain text',
    );
  });
});

describe('journeys_analytics.getPageviewMetadata', function () {
  const assert = testUtils.unplanned();

  it('merges additionalMetadata into the browser metadata block', function () {
    var metadata = journeys_analytics.getPageviewMetadata(null, {
      hosted_deeplink_data: { foo: 'bar' },
    });
    assert.strictEqual(metadata['hosted_deeplink_data']['foo'], 'bar');
    assert.strictEqual(typeof metadata['user_agent'], 'string');
    assert.strictEqual(typeof metadata['url'], 'string');
  });

  it('uses options.url when provided instead of the current window location', function () {
    var metadata = journeys_analytics.getPageviewMetadata(
      { url: 'https://example.com/custom' },
      {},
    );
    assert.strictEqual(metadata['url'], 'https://example.com/custom');
  });
});

describe('journeys_analytics.getDismissRequestData', function () {
  const assert = testUtils.unplanned();

  function fakeBranchView() {
    return {
      _getPageviewRequestData: sinon.stub().returns({}),
    };
  }

  it('passes pageview metadata, branch, and isDismissEvent through to _getPageviewRequestData', function () {
    var branchView = fakeBranchView();
    var branch = {};
    journeys_analytics.getDismissRequestData(branchView, 'close', null, branch);

    var call = branchView._getPageviewRequestData.getCall(0);
    assert.strictEqual(call.args[1], null);
    assert.strictEqual(call.args[2], branch);
    assert.strictEqual(call.args[3], true);
  });

  it('adds dismissal_source to the request data', function () {
    var branchView = fakeBranchView();
    var result = journeys_analytics.getDismissRequestData(
      branchView,
      'close',
      null,
      {},
    );
    assert.strictEqual(result['dismissal_source'], 'close');
  });

  it('decodes and adds journey_link_data fields when present', function () {
    var branchView = fakeBranchView();
    var journeyLinkData = {
      'journey_link_data': {
        'journey_id': 'j1',
        'journey_name': 'Tom &amp; Jerry',
        'view_id': 'v1',
        'view_name': 'View &lt;1&gt;',
        'channel': 'email',
        'campaign': 'spring',
        'tags': ['a', 'b'],
      },
    };
    var result = journeys_analytics.getDismissRequestData(
      branchView,
      'close',
      journeyLinkData,
      {},
    );
    assert.strictEqual(result['journey_id'], 'j1');
    assert.strictEqual(result['journey_name'], 'Tom & Jerry');
    assert.strictEqual(result['view_id'], 'v1');
    assert.strictEqual(result['view_name'], 'View <1>');
    assert.strictEqual(result['channel'], 'email');
    assert.strictEqual(result['campaign'], 'spring');
    assert.strictEqual(result['tags'], JSON.stringify(['a', 'b']));
  });

  it('does not add journey_link_data fields when absent', function () {
    var branchView = fakeBranchView();
    var result = journeys_analytics.getDismissRequestData(
      branchView,
      'close',
      null,
      {},
    );
    assert.strictEqual('journey_id' in result, false);
  });
});
