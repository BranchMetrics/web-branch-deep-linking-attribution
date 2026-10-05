import { safejson } from '../core/safejson.js';
import { utils } from '../core/utils.js';
import { session } from '../core/session.js';
import { banner_utils } from '../banner/banner_utils.js';
import { journeys_utils } from './journeys_utils.js';

export const branch_view = {};

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
  let ctaText = hasApp ? 'OPEN' : 'GET';

  journeys_utils.setPositionAndHeight(html);
  // Get metadata, css and js from html blob then remove them
  const metadata = journeys_utils.getMetadata(html);
  if (metadata) {
    ctaText = journeys_utils.getCtaText(metadata, hasApp);
    journeys_utils.findInsertionDiv(parent, metadata);
  }
  const cssInsideIframe = journeys_utils.getCss(html);
  journeys_utils.getJsAndAddToParent(html);
  const cssIframeContainer = journeys_utils.getIframeCss(html);
  html = journeys_utils.removeScriptAndCss(html);

  // create iframe element, add html, add css, add ctaText
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'branch-banner-iframe-embed';
  const iframe = journeys_utils.createIframe();
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
    eventData.bannerHeight = journeys_utils.bannerHeight;
    eventData.isFullPageBanner = journeys_utils.isFullPage;
    eventData.bannerPagePlacement = journeys_utils.position;
    eventData.isBannerInline = journeys_utils.sticky === 'absolute';
    eventData.isBannerSticky = journeys_utils.sticky === 'fixed';
    journeys_utils.branch._publishEvent('willShowJourney', eventData);

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

/**
 * Checks if a journey should show based on dismiss time
 * @param       {Object} branch
 * @return      {boolean}
 */
function _areJourneysDismissedGlobally(branch) {
  const globalDismissEndTimestamp = branch._storage.get(
    'globalJourneysDismiss',
    true,
  );

  if (
    globalDismissEndTimestamp === true ||
    globalDismissEndTimestamp > Date.now()
  ) {
    return true;
  }

  branch._storage.remove('globalJourneysDismiss', true);
  return false;
}

branch_view.shouldDisplayJourney = function (
  eventResponse,
  options,
  journeyInTestMode,
) {
  if (
    checkPreviousBanner() ||
    utils.getPlatformByUserAgent() === 'other' ||
    !eventResponse.event_data ||
    !eventResponse.template
  ) {
    return false;
  }

  if (journeyInTestMode) {
    return true;
  }

  if (
    !eventResponse.event_data.branch_view_data.id ||
    options?.no_journeys ||
    _areJourneysDismissedGlobally(journeys_utils.branch)
  ) {
    // resets the callback index so that auto-open works the next time a Journey is rendered
    branch_view.callback_index = 1;
    return false;
  }
  return true;
};

branch_view.displayJourney = function (
  html,
  requestData,
  templateId,
  branchViewData,
  testModeEnabled,
  journeyLinkData,
  newRenderOptions,
) {
  if (journeys_utils.exitAnimationIsRunning) {
    return;
  }

  journeys_utils.branchViewId = templateId;
  journeys_utils.setJourneyLinkData(journeyLinkData);

  const audienceRuleId = branchViewData.audience_rule_id;
  journeys_utils.use_v2_renderer = !!newRenderOptions?.use_v2_renderer;
  journeys_utils.animationConfig = newRenderOptions?.animationConfig;

  // this code removes any leftover css from previous banner
  const branchCSS = document.getElementById('branch-iframe-css');
  if (branchCSS?.parentElement) {
    branchCSS.parentElement.removeChild(branchCSS);
  }

  const placeholder = document.createElement('div');
  placeholder.id = 'branch-banner';
  document.body.insertBefore(placeholder, null);
  banner_utils.addClass(placeholder, 'branch-banner-is-active');

  let failed = false;
  const callbackString = requestData.callback_string;
  const banner = null;
  let cta = null;
  const storage = journeys_utils.branch._storage;

  if (html) {
    const metadata = journeys_utils.getMetadata(html) || {};

    html = journeys_utils.tryReplaceJourneyCtaLink(html);

    const timeoutTrigger = window.setTimeout(function () {
      // @ts-expect-error -- JSONP callback on a dynamically named window property
      window[callbackString] = function () {};
    }, utils.timeout);

    // @ts-expect-error -- JSONP callback on a dynamically named window property
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

    const finalHookupsOnIframeLoaded = function (banner) {
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
      requestData.has_app_websdk,
      finalHookupsOnIframeLoaded,
    );
  } else {
    document.body.removeChild(placeholder);
  }
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

  journeys_utils.entryAnimationDisabled =
    options.disable_entry_animation || false;
  journeys_utils.exitAnimationDisabled =
    options.disable_exit_animation || false;

  // starts object off with data from setBranchViewData() call
  let obj = utils.merge({}, branch._branchViewData);
  const sessionStorage = session.get(branch._storage) || {};
  const has_app = Object.prototype.hasOwnProperty.call(
    sessionStorage,
    'has_app',
  )
    ? sessionStorage.has_app
    : false;
  const identity = Object.prototype.hasOwnProperty.call(
    sessionStorage,
    'identity',
  )
    ? sessionStorage.identity
    : null;
  const journeyDismissals = branch._storage.get('journeyDismissals', true);
  const userLanguage =
    (
      options.user_language ||
      utils.getBrowserLanguageCode() ||
      'en'
    ).toLowerCase() || null;
  const initialReferrer = utils.getInitialReferrer(branch._referringLink());
  const branchViewId =
    options.branch_view_id ||
    utils.getParameterByName('_branch_view_id') ||
    null;
  const linkClickId = !options.make_new_link
    ? utils.getClickIdAndSearchStringFromLink(branch._referringLink(true))
    : null;
  const SessionlinkClickId = Object.prototype.hasOwnProperty.call(
    sessionStorage,
    'session_link_click_id',
  )
    ? sessionStorage.session_link_click_id
    : null;

  // adds root level keys for v1/event
  obj.event = !isDismissEvent ? 'pageview' : 'dismiss';
  obj.metadata = metadata;
  obj = utils.addPropertyIfNotNull(obj, 'initial_referrer', initialReferrer);

  // adds root level keys for v1/branchview
  obj = utils.addPropertyIfNotNull(obj, 'branch_view_id', branchViewId);
  obj = utils.addPropertyIfNotNull(obj, 'no_journeys', options.no_journeys);
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
  obj.user_language = userLanguage;
  obj.open_app = options.open_app || false;
  obj.has_app_websdk = has_app;
  obj.feature = 'journeys';
  obj.callback_string =
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
    obj.data.link_click_id = linkClickId;
  }
  const linkData = sessionStorage.data
    ? safejson.parse(sessionStorage.data)
    : null;
  if (linkData?.['+referrer']) {
    obj.data['+referrer'] = linkData['+referrer'];
  }
  obj.session_referring_link_data = sessionStorage.data || null;
  obj = utils.cleanLinkData(obj);
  return obj;
};
