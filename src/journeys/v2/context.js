'use strict';
goog.provide('journeys_v2.context');

goog.require('journeys_analytics');
goog.require('journeys_template');
goog.require('utils');

// Builds the per-render `ctx` every journeys_v2 module takes. No DOM writes, no module state -
// everything a module needs is read off ctx, never off globals.

var RELATIVE_HEIGHT_RE = /^(\d+(?:\.\d+)?)(vh|%)$/;

// Returns `{ banner_id, journey_link_data? }`, the shape every journey event carries.
journeys_v2.context.buildLinkData = function (templateId, rawLinkData) {
  var data = { 'banner_id': templateId };
  if (
    !rawLinkData ||
    typeof rawLinkData !== 'object' ||
    Object.keys(rawLinkData).length === 0
  ) {
    return data;
  }
  var filtered = {};
  for (var key in rawLinkData) {
    if (
      Object.hasOwn(rawLinkData, key) &&
      journeys_analytics.FILTERED_LINK_KEYS.indexOf(key) === -1
    ) {
      filtered[key] = rawLinkData[key];
    }
  }
  data['journey_link_data'] = filtered;
  return data;
};

// Relative bannerHeight (vh/%) is resolved to px against the viewport, as legacy did - a `%`
// margin-top would otherwise resolve against the parent's width.
//
// Intentionally not ported from legacy (the server bakes branch-iframe-css for every creative):
// - safe-area repositioning on resize/scroll: legacy only did it when no branch-iframe-css shipped,
//   so it's already dead for served creatives; the fix is `bottom: env(safe-area-inset-bottom)`
//   in the served CSS.
// - the #branch-banner-iframe-embed wrapper for desktop journeys: the served CSS positions
//   #branch-banner-iframe directly via placement anchors, so the wrapper is inert.
// - deferring the injector-parent margin reset on a programmatic close with exit animation
//   disabled: v2 resets at teardown. A legacy journey closed that way before a v2 render can
//   still leave its own margin behind.
// - clearing legacy's leftover inline body transition: the served body rule ships its own.
journeys_v2.context.layoutFrom = function (metadata, rawLinkData) {
  var bannerHeight = metadata['bannerHeight'] || '';
  var relative = RELATIVE_HEIGHT_RE.exec(bannerHeight);
  if (relative) {
    bannerHeight = `${(parseFloat(relative[1]) / 100) * window.innerHeight}px`;
  }
  var link = rawLinkData || {};
  return {
    position: metadata['position'],
    bannerHeight: bannerHeight,
    sticky: metadata['sticky'],
    isRelative: !!relative,
    isFullPage: !!relative && parseFloat(relative[1]) >= 100,
    isDesktopOverlay:
      link['type'] === 'desktop' && link['variant'] === 'overlay',
    injectorSelector: metadata['injectorSelector'] || '',
  };
};

/**
 * Builds the runtime context object for a journey instance.
 * @param {Object} params
 * @return {Object}
 */
journeys_v2.context.build = function (params) {
  var html = params['html'];
  var branch = params['branch'];
  var requestData = params['requestData'] || {};
  var branchViewData = params['branchViewData'] || {};
  var linkData = params['linkData'];
  var templateId = params['templateId'];
  var options = params['options'] || {};

  var template = journeys_template.parse(html);

  return {
    'branch': branch,
    'storage': branch ? branch._storage : null,
    'templateId': templateId,
    'audienceRuleId': branchViewData['audience_rule_id'],
    'testMode': !!params['testMode'],
    'requestData': requestData,
    'callbackString': requestData['callback_string'],
    'hasApp': !!requestData['has_app_websdk'],
    'linkData': journeys_v2.context.buildLinkData(templateId, linkData),
    'template': template,
    'metadata': template.metadata,
    'layout': journeys_v2.context.layoutFrom(template.metadata, linkData),
    'options': {
      'animationConfig': options['animationConfig'],
      'entryAnimationDisabled': !!options['entryAnimationDisabled'],
      'exitAnimationDisabled': !!options['exitAnimationDisabled'],
    },
    'platform': utils.getPlatformByUserAgent(),
  };
};

// Payload for `willShowJourney`: link data plus the layout fields analytics consumers read
// (same keys as the legacy path).
journeys_v2.context.showEventData = function (ctx) {
  var data = utils.merge({}, ctx.linkData);
  data['bannerHeight'] = ctx.layout.bannerHeight;
  data['isFullPageBanner'] = ctx.layout.isFullPage;
  data['bannerPagePlacement'] = ctx.layout.position;
  data['isBannerInline'] = ctx.layout.sticky === 'absolute';
  data['isBannerSticky'] = ctx.layout.sticky === 'fixed';
  return data;
};
