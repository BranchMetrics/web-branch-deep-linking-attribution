import { safejson } from '../core/safejson.js';
import { getPlatformByUserAgent } from '../core/platform.js';
import { getEnv, navigationTimingAPIEnabled } from '../env/env.js';
import { addPropertyIfNotNull, merge } from '../lib/objects.js';
import {
  cleanLinkData,
  getInitialReferrer,
  getParameterByName,
} from '../core/url.js';
import { whiteListJourneysLanguageData } from '../lib/session-data.js';
import { session } from '../core/session.js';
import { banner_utils } from '../banner/banner-utils.js';
import { journeys_utils } from './journeys-utils.js';
import { dismissedSince, isDismissedGlobally } from './dismissals.js';
import { showJourneyEventData } from './link-data.js';
import { prepareV2, showV2, v2JourneyState, whenV2Closed } from './v2/index.js';

export const branch_view = {};

// A v1 journey's or branch.banner()'s iframe, or branch.banner({iframe: false})'s div.
function sdkBannerShown() {
  return !!(
    document.getElementById('branch-banner-iframe') ||
    document.querySelector('#branch-banner.branch-animation')
  );
}

// v1 also treats any page #branch-banner or #branch-banner-container as a banner.
function checkPreviousBanner() {
  return !!(
    sdkBannerShown() ||
    document.getElementById('branch-banner') ||
    document.getElementById('branch-banner-container')
  );
}

function animationFlag(options, key) {
  const value = options?.[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return !!journeys_utils.branch?.init_options?.[key];
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
    journeys_utils.addHtmlToIframe(iframe, html, getPlatformByUserAgent());
    journeys_utils.addIframeOuterCSS(cssIframeContainer, metadata);
    journeys_utils.addIframeInnerCSS(iframe, cssInsideIframe);
    journeys_utils.addDynamicCtaText(iframe, ctaText);
    journeys_utils.branch._publishEvent(
      'willShowJourney',
      showJourneyEventData(journeys_utils.journeyLinkData, {
        bannerHeight: journeys_utils.bannerHeight,
        isFullPage: journeys_utils.isFullPage,
        position: journeys_utils.position,
        sticky: journeys_utils.sticky,
      }),
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

/**
 * Checks if a journey should show based on dismiss time
 * @param       {Object} branch
 * @return      {boolean}
 */
function _areJourneysDismissedGlobally(branch) {
  return isDismissedGlobally(branch._storage);
}

branch_view.shouldDisplayJourney = function (
  eventResponse,
  options,
  journeyInTestMode,
) {
  if (
    getPlatformByUserAgent() === 'other' ||
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
    return false;
  }
  return true;
};

/**
 * Shows the journey in a pageview response, or calls onNotShown:
 * 1. A journey the user dismissed after the request was built is dropped: the server
 *    couldn't apply that dismissal.
 * 2. A shown v2 journey blocks it; a closing one defers it until closed.
 * 3. Eligibility: shouldDisplayJourney.
 * 4. v2 when requested, not blocked by a v1 journey's iframe, and the adapter accepts it.
 * 5. Otherwise v1, unless any existing banner element blocks it.
 * @param {Object} response
 * @param {Object} requestData
 * @param {Object} options - the init or track options
 * @param {Function} onNotShown
 */
branch_view.showJourneyFromResponse = function (
  response,
  requestData,
  options,
  onNotShown,
) {
  const testMode = !!requestData.branch_view_id;
  const branchViewData = response.event_data?.branch_view_data;
  if (
    !testMode &&
    branchViewData &&
    dismissedSince(
      journeys_utils.branch._storage,
      requestData.journey_dismissals,
      branchViewData.id,
      branchViewData.audience_rule_id,
    )
  ) {
    onNotShown();
    return;
  }
  const v2State = v2JourneyState();
  if (v2State === 'closing') {
    whenV2Closed(function () {
      branch_view.showJourneyFromResponse(
        response,
        requestData,
        options,
        onNotShown,
      );
    });
    return;
  }
  if (
    v2State === 'shown' ||
    !branch_view.shouldDisplayJourney(response, options, testMode)
  ) {
    onNotShown();
    return;
  }

  const templateId = requestData.branch_view_id || branchViewData.id;
  if (response.use_v2_renderer) {
    // Checked before parsing. Only the SDK's own banners block v2.
    if (sdkBannerShown()) {
      onNotShown();
      return;
    }
    const payload = prepareV2(
      {
        html: response.template,
        requestData,
        templateId,
        branchViewData,
        journeyLinkData: response.journey_link_data,
        animationConfig: response.animationConfig,
      },
      journeys_utils.branch,
    );
    if (
      payload &&
      showV2(payload, {
        branch: journeys_utils.branch,
        branchView: branch_view,
        hasApp: !!requestData.has_app_websdk,
        testMode,
        entryAnimationDisabled: animationFlag(
          options,
          'disable_entry_animation',
        ),
        exitAnimationDisabled: animationFlag(options, 'disable_exit_animation'),
      })
    ) {
      return;
    }
  }
  if (checkPreviousBanner()) {
    onNotShown();
    return;
  }
  branch_view.displayJourney(
    response.template,
    requestData,
    templateId,
    branchViewData,
    testMode,
    response.journey_link_data,
    {
      use_v2_renderer: response.use_v2_renderer,
      animationConfig: response.animationConfig,
    },
  );
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
    }, journeys_utils.branch._ctx.timeout);

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

      if (navigationTimingAPIEnabled) {
        journeys_utils.branch._ctx.instrumentation['journey-load-time'] =
          getEnv().timeSinceNavigationStart();
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
  let obj = merge({}, branch._branchViewData);
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
      getEnv().browserLanguageCode() ||
      'en'
    ).toLowerCase() || null;
  const initialReferrer = getInitialReferrer(branch._referringLink());
  const branchViewId =
    options.branch_view_id || getParameterByName('_branch_view_id') || null;
  const linkClickId = !options.make_new_link
    ? getEnv().clickIdAndSearchStringFromLink(branch._referringLink(true))
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
  obj = addPropertyIfNotNull(obj, 'initial_referrer', initialReferrer);

  // adds root level keys for v1/branchview
  obj = addPropertyIfNotNull(obj, 'branch_view_id', branchViewId);
  obj = addPropertyIfNotNull(obj, 'no_journeys', options.no_journeys);
  obj = addPropertyIfNotNull(obj, 'is_iframe', getEnv().isIframe());
  obj = addPropertyIfNotNull(obj, 'journey_dismissals', journeyDismissals);
  obj = addPropertyIfNotNull(obj, 'identity', identity);
  obj = addPropertyIfNotNull(obj, 'session_link_click_id', SessionlinkClickId);
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
  obj.data = merge(getEnv().hostedDeepLinkData(), obj.data);
  obj.data = merge(
    whiteListJourneysLanguageData(sessionStorage || {}),
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
  obj = cleanLinkData(obj);
  return obj;
};
