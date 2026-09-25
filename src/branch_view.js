'use strict';
goog.provide('branch_view');
goog.require('utils');
goog.require('banner_css');
goog.require('safejson');
goog.require('journeys_utils');
goog.require('journeys_v2');

function checkPreviousBanner() {
  // if banner already exists, don't add another
  if (
    document.getElementById('branch-banner') ||
    document.getElementById('branch-banner-iframe') ||
    document.getElementById('branch-banner-container')
  ) {
    return true;
  }
  return false;
}

/**
 * @param {Object} parent
 * @param {string} html
 * @param {boolean} hasApp
 */
function renderHtmlBlob(parent, html, hasApp, iframeLoadedCallback) {
  var ctaText = hasApp ? 'OPEN' : 'GET';

  journeys_utils.setPositionAndHeight(html);
  // Get metadata, css and js from html blob then remove them
  var metadata = journeys_utils.getMetadata(html);
  if (metadata) {
    ctaText = journeys_utils.getCtaText(metadata, hasApp);
    journeys_utils.findInsertionDiv(parent, metadata);
  }
  var cssInsideIframe = journeys_utils.getCss(html);
  journeys_utils.getJsAndAddToParent(html);
  var cssIframeContainer = journeys_utils.getIframeCss(html);
  html = journeys_utils.removeScriptAndCss(html);

  // create iframe element, add html, add css, add ctaText
  var iframeContainer = document.createElement('div');
  iframeContainer.id = 'branch-banner-iframe-embed';
  var iframe = journeys_utils.createIframe();
  iframe.onload = function () {
    journeys_utils.addHtmlToIframe(
      iframe,
      html,
      utils.getPlatformByUserAgent(),
    );
    journeys_utils.addIframeOuterCSS(cssIframeContainer, metadata);
    journeys_utils.addIframeInnerCSS(iframe, cssInsideIframe);
    journeys_utils.addDynamicCtaText(iframe, ctaText);
    const eventData = Object.assign({}, journeys_utils.journeyLinkData);
    eventData['bannerHeight'] = journeys_utils.bannerHeight;
    eventData['isFullPageBanner'] = journeys_utils.isFullPage;
    eventData['bannerPagePlacement'] = journeys_utils.position;
    eventData['isBannerInline'] = journeys_utils.sticky === 'absolute';
    eventData['isBannerSticky'] = journeys_utils.sticky === 'fixed';
    journeys_events.publish(
      journeys_utils.branch,
      'willShowJourney',
      eventData,
    );

    journeys_utils.animateBannerEntrance(iframe, cssIframeContainer);
    iframeLoadedCallback(iframe);
  };
  if (journeys_utils.isDesktopJourney) {
    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);
  } else {
    document.body.prepend(iframe);
  }
  return iframe;
}

branch_view.shouldDisplayJourney = function (
  eventResponse,
  options,
  journeyInTestMode,
) {
  if (
    checkPreviousBanner() ||
    utils.getPlatformByUserAgent() == 'other' ||
    !eventResponse['event_data'] ||
    !eventResponse['template']
  ) {
    return false;
  }

  if (journeyInTestMode) {
    return true;
  }

  if (
    !eventResponse['event_data']['branch_view_data']['id'] ||
    (options && options['no_journeys']) ||
    journeys_dismissals.isDismissedGlobally(journeys_utils.branch._storage)
  ) {
    // resets the callback index so that auto-open works the next time a Journey is rendered
    branch_view.callback_index = 1;
    return false;
  }
  return true;
};

// Legacy render pipeline, extracted into a named function so displayJourney can dispatch to it.
function renderLegacyJourneyBody(
  html,
  requestData,
  templateId,
  audienceRuleId,
  testModeEnabled,
  placeholder,
) {
  var failed = false;
  var callbackString = requestData['callback_string'];
  var banner = null;
  var cta = null;
  var storage = journeys_utils.branch._storage;

  var metadata;
  // Malformed JSON metadata throws - treat like no html rather than leaving the placeholder stuck.
  try {
    metadata = html && (journeys_utils.getMetadata(html) || {});
  } catch (e) {
    html = null;
  }

  if (html) {
    html = journeys_utils.tryReplaceJourneyCtaLink(html);

    var timeoutTrigger = window.setTimeout(function () {
      window[callbackString] = function () {};
    }, utils.timeout);

    window[callbackString] = function (data) {
      window.clearTimeout(timeoutTrigger);
      if (failed) {
        return;
      }
      cta = data;

      journeys_utils.finalHookups(
        templateId,
        audienceRuleId,
        storage,
        cta,
        banner,
        metadata,
        testModeEnabled,
        branch_view,
      );
    };

    var finalHookupsOnIframeLoaded = function (banner) {
      journeys_utils.banner = banner;

      if (banner === null) {
        failed = true;
        return;
      }

      journeys_utils.finalHookups(
        templateId,
        audienceRuleId,
        storage,
        cta,
        banner,
        metadata,
        testModeEnabled,
        branch_view,
      );

      if (utils.navigationTimingAPIEnabled) {
        utils.instrumentation['journey-load-time'] =
          utils.timeSinceNavigationStart();
      }

      document.body.removeChild(placeholder);
    };
    renderHtmlBlob(
      document.body,
      html,
      requestData['has_app_websdk'],
      finalHookupsOnIframeLoaded,
    );
  } else {
    document.body.removeChild(placeholder);
  }
}

// branch/animationOptions are explicit params, not read off journeys_utils, so journeys_v2 stays
// fully decoupled from legacy's module state - only the legacy branch below touches those globals.
branch_view.displayJourney = function (
  html,
  requestData,
  templateId,
  branchViewData,
  testModeEnabled,
  journeyLinkData,
  branch,
  options,
) {
  var use_v2_renderer = options['use_v2_renderer'];

  // exitAnimationIsRunning is a legacy-only cooldown; journeys_v2 has its own overlap protection.
  if (!use_v2_renderer && journeys_utils.exitAnimationIsRunning) {
    return;
  }
  if (!use_v2_renderer) {
    journeys_utils.branchViewId = templateId;
    journeys_utils.setJourneyLinkData(journeyLinkData);
  }

  // this code removes any leftover css from previous banner
  var branchCSS = document.getElementById('branch-iframe-css');
  if (branchCSS && branchCSS.parentElement) {
    branchCSS.parentElement.removeChild(branchCSS);
  }

  var placeholder = document.createElement('div');
  placeholder.id = 'branch-banner';
  document.body.insertBefore(placeholder, null);
  banner_utils.addClass(placeholder, 'branch-banner-is-active');

  // Server-laid-out creatives render through journeys_v2 instead of the legacy pipeline below.
  if (use_v2_renderer) {
    // A flag the caller set (even to false) wins; otherwise fall back to the init-time default.
    const initOptions = (branch && branch.init_options) || {};
    const callOptions = options || {};
    const resolve = function (callValue, initKey) {
      return callValue !== undefined ? !!callValue : !!initOptions[initKey];
    };

    journeys_v2.displayJourney({
      'branch': branch,
      'branchView': branch_view,
      'html': html,
      'requestData': requestData,
      'templateId': templateId,
      'branchViewData': branchViewData,
      'testMode': testModeEnabled,
      'linkData': journeyLinkData,
      'placeholder': placeholder,
      'options': {
        'animationConfig': options['animationConfig'],
        'entryAnimationDisabled': resolve(
          callOptions['entryAnimationDisabled'],
          'disable_entry_animation',
        ),
        'exitAnimationDisabled': resolve(
          callOptions['exitAnimationDisabled'],
          'disable_exit_animation',
        ),
      },
    });
    return;
  }

  var audienceRuleId = branchViewData['audience_rule_id'];
  renderLegacyJourneyBody(
    html,
    requestData,
    templateId,
    audienceRuleId,
    testModeEnabled,
    placeholder,
  );
};

// Closes whichever journey is on screen, v2 or legacy. Returns false when there is nothing to
// close so `branch.closeJourney()` can report it.
branch_view.closeActiveJourney = function (callerBranch) {
  if (journeys_v2.closeActiveJourney(callerBranch)) {
    return true;
  }
  if (journeys_utils.banner && journeys_utils.isJourneyDisplayed) {
    journeys_events.publish(
      callerBranch,
      'didCallJourneyClose',
      journeys_utils.journeyLinkData,
    );
    journeys_utils.animateBannerExit(journeys_utils.banner, true);
    return true;
  }
  return false;
};

branch_view._getPageviewRequestData = function (
  metadata,
  options,
  branch,
  isDismissEvent,
) {
  journeys_utils.branch = branch;

  if (!options) {
    options = {};
  }

  if (!metadata) {
    metadata = {};
  }

  // Skip the reset for a dismiss-request build (isDismissEvent) - it has no customer options of
  // its own, and a journey chained off that dismiss should keep the actual pageview's preference.
  if (!isDismissEvent) {
    journeys_utils.entryAnimationDisabled =
      options['disable_entry_animation'] || false;
    journeys_utils.exitAnimationDisabled =
      options['disable_exit_animation'] || false;
  }

  // starts object off with data from setBranchViewData() call
  var obj = utils.merge({}, branch._branchViewData);
  var sessionStorage = session.get(branch._storage) || {};
  var has_app = sessionStorage.hasOwnProperty('has_app')
    ? sessionStorage['has_app']
    : false;
  var identity = sessionStorage.hasOwnProperty('identity')
    ? sessionStorage['identity']
    : null;
  var journeyDismissals = branch._storage.get(
    journeys_dismissals.VIEWS_KEY,
    true,
  );
  var userLanguage =
    (
      options['user_language'] ||
      utils.getBrowserLanguageCode() ||
      'en'
    ).toLowerCase() || null;
  var initialReferrer = utils.getInitialReferrer(branch._referringLink());
  var branchViewId =
    options['branch_view_id'] ||
    utils.getParameterByName('_branch_view_id') ||
    null;
  var linkClickId = !options['make_new_link']
    ? utils.getClickIdAndSearchStringFromLink(branch._referringLink(true))
    : null;
  var SessionlinkClickId = sessionStorage.hasOwnProperty(
    'session_link_click_id',
  )
    ? sessionStorage['session_link_click_id']
    : null;

  // adds root level keys for v1/event
  obj['event'] = !isDismissEvent ? 'pageview' : 'dismiss';
  obj['metadata'] = metadata;
  obj = utils.addPropertyIfNotNull(obj, 'initial_referrer', initialReferrer);

  // adds root level keys for v1/branchview
  obj = utils.addPropertyIfNotNull(obj, 'branch_view_id', branchViewId);
  obj = utils.addPropertyIfNotNull(obj, 'no_journeys', options['no_journeys']);
  obj = utils.addPropertyIfNotNull(obj, 'is_iframe', utils.isIframe());
  obj = utils.addPropertyIfNotNull(
    obj,
    'journey_dismissals',
    journeyDismissals,
  );
  obj = utils.addPropertyIfNotNull(obj, 'identity', identity);
  obj = utils.addPropertyIfNotNull(
    obj,
    'session_link_click_id',
    SessionlinkClickId,
  );
  obj['user_language'] = userLanguage;
  obj['open_app'] = options['open_app'] || false;
  obj['has_app_websdk'] = has_app;
  obj['feature'] = 'journeys';
  obj['callback_string'] =
    'branch_view_callback__' + journeys_utils._callback_index++;

  if (!obj.data) {
    obj.data = {};
  }

  // builds data object for v1/branchview
  obj.data = utils.merge(utils.getHostedDeepLinkData(), obj.data);
  obj.data = utils.merge(
    utils.whiteListJourneysLanguageData(sessionStorage || {}),
    obj.data,
  );
  if (linkClickId) {
    obj.data['link_click_id'] = linkClickId;
  }
  var linkData = sessionStorage['data']
    ? safejson.parse(sessionStorage['data'])
    : null;
  if (linkData && linkData['+referrer']) {
    obj.data['+referrer'] = linkData['+referrer'];
  }
  obj['session_referring_link_data'] = sessionStorage['data'] || null;
  obj = utils.cleanLinkData(obj);
  return obj;
};
