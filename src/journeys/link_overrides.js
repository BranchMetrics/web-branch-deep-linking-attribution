'use strict';
goog.provide('journeys_link_overrides');

// The `$journeys_cta` override: a customer calls
// `branch.setBranchViewData({ data: { '$journeys_cta': url } })` and the CTA must navigate to that
// url instead of the Branch-built link. Implemented by rewriting the CTA script node-api injects.
journeys_link_overrides.CTA_KEY = '$journeys_cta';

// Greedy on purpose (legacy behavior): the CTA line is `window.top.location.replace(validate("url"));`
// and the whole `validate(...)…);` tail collapses to one call to the override.
var CTA_CALL_RE = /validate[(].+[)];/g;

/**
 * Returns `branch._branchViewData.data[key]` when truthy, else undefined.
 * @param {Object} branch
 * @param {string} key
 * @return {string|undefined}
 */
journeys_link_overrides.getBranchViewDataItem = function (branch, key) {
  var viewData = branch && branch['_branchViewData'];
  var data = viewData && viewData['data'];
  return (data && data[key]) || undefined;
};

/**
 * Returns the override url, only when it is a non-empty string.
 * @param {Object} branch
 * @return {string|undefined}
 */
journeys_link_overrides.getCtaLink = function (branch) {
  var link = journeys_link_overrides.getBranchViewDataItem(
    branch,
    journeys_link_overrides.CTA_KEY,
  );
  return typeof link === 'string' && link.length > 0 ? link : undefined;
};

/**
 * Points the CTA at the override url; returns html unchanged when there is no override or on
 * any error.
 * @param {Object} branch
 * @param {string} html
 * @return {string}
 */
journeys_link_overrides.applyCtaOverride = function (branch, html) {
  try {
    const link = journeys_link_overrides.getCtaLink(branch);
    if (link) {
      // Replacer function, not a replacement string: a literal `$` in the override url would
      // otherwise be read as a String.replace special pattern ($&, $1, ...).
      return html
        .replace(CTA_CALL_RE, function () {
          return 'validate("' + link + '")';
        })
        .replace('window.top.location.replace(', 'window.top.location = ');
    }
  } catch (_e) {}
  return html;
};
