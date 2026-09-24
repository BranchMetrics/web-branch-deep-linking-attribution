'use strict';

goog.require('journeys_link_overrides');
goog.require('journeys_utils');

// Characterization tests for the `$journeys_cta` override: a customer calls
// branch.setBranchViewData({ data: { '$journeys_cta': url } }) and the SDK rewrites the CTA script
// node-api injected so the button navigates to that url instead of the Branch-built link.
// Pinned against the legacy journeys_utils implementation before extraction.

function withBranchViewData(data) {
  journeys_utils.branch = { _branchViewData: data };
}

describe('journeys_link_overrides (extracted module)', function () {
  const assert = testUtils.unplanned();

  it('getCtaLink takes the branch explicitly and tolerates null', function () {
    assert.strictEqual(journeys_link_overrides.getCtaLink(null), undefined);
    assert.strictEqual(
      journeys_link_overrides.getCtaLink({
        _branchViewData: { data: { '$journeys_cta': 'https://e.com' } },
      }),
      'https://e.com',
    );
  });

  it('getBranchViewDataItem returns undefined for falsy values', function () {
    var branch = { _branchViewData: { data: { a: 0, b: '', c: 'x' } } };
    assert.strictEqual(
      journeys_link_overrides.getBranchViewDataItem(branch, 'a'),
      undefined,
    );
    assert.strictEqual(
      journeys_link_overrides.getBranchViewDataItem(branch, 'b'),
      undefined,
    );
    assert.strictEqual(
      journeys_link_overrides.getBranchViewDataItem(branch, 'c'),
      'x',
    );
  });

  it('applyCtaOverride is a pure function of (branch, html)', function () {
    var branch = {
      _branchViewData: { data: { '$journeys_cta': 'https://e.com' } },
    };
    var html = 'window.top.location.replace(validate("a"));';
    assert.strictEqual(
      journeys_link_overrides.applyCtaOverride(branch, html),
      'window.top.location = validate("https://e.com")',
    );
    assert.strictEqual(
      journeys_link_overrides.applyCtaOverride(null, html),
      html,
    );
  });
});

describe('journeys link overrides: reading $journeys_cta', function () {
  const assert = testUtils.unplanned();

  afterEach(function () {
    journeys_utils.branch = null;
  });

  it('is absent when there is no branch, no view data, or no data object', function () {
    journeys_utils.branch = null;
    assert.strictEqual(journeys_utils.hasJourneyCtaLink(), false);
    journeys_utils.branch = {};
    assert.strictEqual(journeys_utils.hasJourneyCtaLink(), false);
    withBranchViewData({});
    assert.strictEqual(journeys_utils.hasJourneyCtaLink(), false);
    assert.strictEqual(journeys_utils.getJourneyCtaLink(), undefined);
  });

  it('is absent when $journeys_cta is missing or empty', function () {
    withBranchViewData({ data: { foo: 'bar' } });
    assert.strictEqual(journeys_utils.hasJourneyCtaLink(), false);
    withBranchViewData({ data: { '$journeys_cta': '' } });
    assert.strictEqual(journeys_utils.hasJourneyCtaLink(), false);
    assert.strictEqual(journeys_utils.getJourneyCtaLink(), undefined);
  });

  it('is present for a non-empty string', function () {
    withBranchViewData({ data: { '$journeys_cta': 'https://example.com/x' } });
    assert.strictEqual(journeys_utils.hasJourneyCtaLink(), true);
    assert.strictEqual(
      journeys_utils.getJourneyCtaLink(),
      'https://example.com/x',
    );
  });
});

describe('journeys link overrides: tryReplaceJourneyCtaLink', function () {
  const assert = testUtils.unplanned();

  afterEach(function () {
    journeys_utils.branch = null;
  });

  it('returns the html untouched when there is no override', function () {
    withBranchViewData({ data: {} });
    var html = 'window.top.location.replace(validate("https://bnc.lt/abc"));';
    assert.strictEqual(journeys_utils.tryReplaceJourneyCtaLink(html), html);
  });

  it('rewrites the CTA to navigate to the override url', function () {
    withBranchViewData({ data: { '$journeys_cta': 'https://example.com/x' } });
    var out = journeys_utils.tryReplaceJourneyCtaLink(
      'window.top.location.replace(validate("https://bnc.lt/abc?_t=1"));',
    );
    assert.strictEqual(
      out,
      'window.top.location = validate("https://example.com/x")',
    );
  });

  it('is greedy within a line: everything from the first validate( to the last ); collapses', function () {
    withBranchViewData({ data: { '$journeys_cta': 'https://example.com/x' } });
    var out = journeys_utils.tryReplaceJourneyCtaLink(
      'validate("a"); x; validate("b");',
    );
    assert.strictEqual(out, 'validate("https://example.com/x")');
  });

  it('rewrites every line with a validate(...) but only the first location.replace(', function () {
    withBranchViewData({ data: { '$journeys_cta': 'https://example.com/x' } });
    var out = journeys_utils.tryReplaceJourneyCtaLink(
      'validate("a");\nwindow.top.location.replace(u1);\nwindow.top.location.replace(u2);\nvalidate("b");',
    );
    assert.strictEqual(
      out,
      'validate("https://example.com/x")\nwindow.top.location = u1);\nwindow.top.location.replace(u2);\nvalidate("https://example.com/x")',
    );
  });

  it('does not cross line boundaries when matching validate(...)', function () {
    withBranchViewData({ data: { '$journeys_cta': 'https://example.com/x' } });
    var out = journeys_utils.tryReplaceJourneyCtaLink('validate(\n"a");');
    assert.strictEqual(out, 'validate(\n"a");');
  });

  it('falls back to the input on error', function () {
    withBranchViewData({ data: { '$journeys_cta': 'https://example.com/x' } });
    assert.strictEqual(journeys_utils.tryReplaceJourneyCtaLink(null), null);
  });
});
