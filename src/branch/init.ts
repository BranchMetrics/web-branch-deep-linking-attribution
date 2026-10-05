import type { Branch } from './branch.js';
import { init_states, init_state_fail_codes } from './wrap.js';
import { config } from '../core/config.js';
import { safejson } from '../core/safejson.js';
import { getEnv, navigationTimingAPIEnabled } from '../env/env.js';
import { delay, isKey, validateParameterType } from '../lib/objects.js';
import {
  getClientHints,
  isIOSWKWebView,
  isSafari11OrGreater,
} from '../core/platform.js';
import { processReferringLink } from '../lib/url.js';
import { getInitialReferrer, getParamValue, hashValue } from '../core/url.js';
import { whiteListSessionData } from '../lib/session-data.js';
import { getAdditionalMetadata } from '../core/page-data.js';
import { mergeHostedDeeplinkData } from '../lib/hosted-data.js';
import { resources } from '../network/resources.js';
import { session } from '../core/session.js';
import { branch_view } from '../journeys/branch-view.js';
import { journeys_utils } from '../journeys/journeys-utils.js';

/**
 * @function Branch.init
 * @param branch_key - _required_ - Your Branch [live key](http://dashboard.branch.io/settings), or (deprecated) your app id.
 * @param options - _optional_ - { }.
 * @param callback - _optional_ - callback to read the
 * session data.
 *
 * Adding the Branch script to your page automatically creates a window.branch
 * object with all the external methods described below. All calls made to
 * Branch methods are stored in a queue, so even if the SDK is not fully
 * instantiated, calls made to it will be queued in the order they were
 * originally called.
 * If the session was opened from a referring link, `data()` will also return the referring link
 * click as `referring_link`, which gives you the ability to continue the click flow.
 *
 * The init function on the Branch object initiates the Branch session and
 * creates a new user session, if it doesn't already exist, in
 * `sessionStorage`.
 *
 * **Useful Tip**: The init function returns a data object where you can read
 * the link the user was referred by.
 *
 * Properties available in the options object:
 *
 * | Key | Value
 * | --- | ---
 * | branch_match_id | *optional* - `string`. The current user's browser-fingerprint-id. The value of this parameter should be the same as the value of ?_branch_match_id (automatically appended by Branch after a link click). _Only necessary if ?_branch_match_id is lost due to multiple redirects in your flow_.
 * | branch_view_id | *optional* - `string`. If you would like to test how Journeys render on your page before activating them, you can set the value of this parameter to the id of the view you are testing. _Only necessary when testing a view related to a Journey_.
 * | no_journeys | *optional* - `boolean`. When true, prevents Journeys from appearing on current page.
 * | disable_entry_animation | *optional* - `boolean`. When true, prevents a Journeys entry animation.
 * | disable_exit_animation | *optional* - `boolean`. When true, prevents a Journeys exit animation.
 * | retries | *optional* - `integer`. Value specifying the number of times that a Branch API call can be re-attempted. Default 2.
 * | retry_delay | *optional* - `integer `. Amount of time in milliseconds to wait before re-attempting a timed-out request to the Branch API. Default 200 ms.
 * | timeout | *optional* - `integer`. Duration in milliseconds that the system should wait for a response before considering any Branch API call to have timed out. Default 5000 ms.
 * | metadata | *optional* - `object`. Key-value pairs used to target Journeys users via the "is viewing a page with metadata key" filter.
 * | nonce | *optional* - `string`. A nonce value that will be added to branch-journey-cta injected script. Used to allow that script from a Content Security Policy.
 * | tracking_disabled | *optional* - `boolean`. true disables tracking
 *
 * ##### Usage
 * ```js
 * branch.init(
 *     branch_key,
 *     options,
 *     callback (err, data),
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message",
 *      {
 *           data_parsed:        { },                          // If the user was referred from a link, and the link has associated data, the data is passed in here.
 *           referring_identity: '12345',                      // If the user was referred from a link, and the link was created by a user with an identity, that identity is here.
 *           has_app:            true,                         // Does the user have the app installed already?
 *           identity:           'BranchUser',                 // Unique string that identifies the user
 *           ~referring_link:     'https://bnc.lt/c/jgg75-Gjd3' // The referring link click, if available.
 *      }
 * );
 * ```
 *
 * **Note:** `Branch.init` must be called prior to calling any other Branch functions.
 * ___
 */
export function init(
  this: Branch,
  done,
  branch_key: string,
  options?: Record<string, any>,
) {
  const self = this;
  const ctx = self._ctx;

  if (navigationTimingAPIEnabled) {
    ctx.instrumentation['init-began-at'] = getEnv().timeSinceNavigationStart();
  }

  self.init_state = init_states.INIT_PENDING;

  if (isKey(branch_key)) {
    self.branch_key = branch_key;
  } else {
    self.app_id = branch_key;
  }

  options = options && validateParameterType(options, 'object') ? options : {};
  self.init_options = options;

  ctx.retries =
    options?.retries && Number.isInteger(options.retries)
      ? options.retries
      : ctx.retries;
  ctx.retry_delay =
    options?.retry_delay && Number.isInteger(options.retry_delay)
      ? options.retry_delay
      : ctx.retry_delay;
  ctx.timeout =
    options?.timeout && Number.isInteger(options.timeout)
      ? options.timeout
      : ctx.timeout;
  ctx.nonce = options?.nonce ? options.nonce : ctx.nonce;
  ctx.debug = options?.enableLogging ? options.enableLogging : ctx.debug;

  ctx.userPreferences.trackingDisabled =
    options?.tracking_disabled && options.tracking_disabled === true
      ? true
      : false;
  ctx.userPreferences.enableExtendedJourneysAssist =
    options?.enableExtendedJourneysAssist
      ? options.enableExtendedJourneysAssist
      : ctx.userPreferences.enableExtendedJourneysAssist;
  ctx.extendedJourneysAssistExpiryTime =
    options?.extendedJourneysAssistExpiryTime &&
    Number.isInteger(options.extendedJourneysAssistExpiryTime)
      ? options.extendedJourneysAssistExpiryTime
      : ctx.extendedJourneysAssistExpiryTime;
  ctx.userPreferences.allowErrorsInCallback = false;
  getClientHints(ctx);

  if (ctx.userPreferences.trackingDisabled) {
    session.cleanApplicationAndSessionStorage(self);
  }

  // initialize identity_id from storage
  // note the previous line scrubs this if tracking disabled.
  const localData = session.get(self._storage, true);
  // biome-ignore lint/complexity/useOptionalChain: keeps identity_id null (not undefined) when storage is empty
  self.identity_id = localData && localData.identity_id;

  const setBranchValues = function (data) {
    if (data.link_click_id) {
      self.link_click_id = data.link_click_id.toString();
    }
    if (data.session_link_click_id) {
      self.session_link_click_id = data.session_link_click_id.toString();
    }
    if (data.session_id) {
      self.session_id = data.session_id.toString();
    }
    if (data.identity_id) {
      self.identity_id = data.identity_id.toString();
    }
    if (data.identity) {
      self.identity = data.identity.toString();
    }
    if (data.link) {
      self.sessionLink = data.link;
    }
    if (data.referring_link) {
      data.referring_link = processReferringLink(data.referring_link);
    }
    if (!data.click_id && data.referring_link) {
      data.click_id = getEnv().clickIdAndSearchStringFromLink(
        data.referring_link,
      );
    }

    self.browser_fingerprint_id = data.browser_fingerprint_id;

    return data;
  };

  const sessionData = session.get(self._storage);

  const branchMatchIdFromOptions =
    options &&
    typeof options.branch_match_id !== 'undefined' &&
    options.branch_match_id !== null
      ? options.branch_match_id
      : null;
  const link_identifier =
    branchMatchIdFromOptions ||
    getParamValue('_branch_match_id') ||
    hashValue('r');
  const freshInstall = !self.identity_id; // initialized from local storage above
  self._branchViewEnabled = !!self._storage.get('branch_view_enabled');
  const fetchLatestBrowserFingerPrintID = function (cb) {
    const params_r: Record<string, any> = {
      'sdk': config.version,
      'branch_key': self.branch_key,
    };
    const currentSessionData = session.get(self._storage) || {};
    const permData = session.get(self._storage, true) || {};
    if (permData.browser_fingerprint_id) {
      params_r._t = permData.browser_fingerprint_id;
    }

    if (!isSafari11OrGreater() && !isIOSWKWebView()) {
      self._api(resources._r, params_r, function (err, browser_fingerprint_id) {
        if (err) {
          self.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND;
          self.init_state_fail_details = err.message;
        }
        if (browser_fingerprint_id) {
          currentSessionData.browser_fingerprint_id = browser_fingerprint_id;
        }
      });
    }
    if (cb) {
      cb(null, currentSessionData);
    }
  };

  const restoreIdentityOnInstall = function (data) {
    if (freshInstall) {
      data.identity = self.identity;
    }
    return data;
  };

  const finishInit = function (err, data) {
    if (data) {
      data = setBranchValues(data);

      if (!ctx.userPreferences.trackingDisabled) {
        data = restoreIdentityOnInstall(data);
        session.set(self._storage, data, freshInstall);
      }

      self.init_state = init_states.INIT_SUCCEEDED;
      data.data_parsed =
        data.data && data.data.length !== 0 ? safejson.parse(data.data) : {};
    }
    if (err) {
      self.init_state = init_states.INIT_FAILED;
      if (!self.init_state_fail_code) {
        self.init_state_fail_code = init_state_fail_codes.UNKNOWN_CAUSE;
        self.init_state_fail_details = err.message;
      }

      return done(err, data && whiteListSessionData(data));
    }

    try {
      done(err, data && whiteListSessionData(data));
    } catch (_e) {
      // pass
    } finally {
      self.renderFinalize();
    }

    const additionalMetadata = getAdditionalMetadata();
    const metadata = validateParameterType(options.metadata, 'object')
      ? options.metadata
      : null;
    if (metadata) {
      const hostedDeeplinkDataWithMergedMetadata = mergeHostedDeeplinkData(
        additionalMetadata.hosted_deeplink_data,
        metadata,
      );
      if (
        hostedDeeplinkDataWithMergedMetadata &&
        Object.keys(hostedDeeplinkDataWithMergedMetadata).length > 0
      ) {
        additionalMetadata.hosted_deeplink_data =
          hostedDeeplinkDataWithMergedMetadata;
      }
    }
    const requestData = branch_view._getPageviewRequestData(
      journeys_utils._getPageviewMetadata(options, additionalMetadata, ctx),
      options,
      self,
      false,
    );
    self.renderQueue(function () {
      self._api(
        resources.pageview,
        requestData,
        function (err, pageviewResponse) {
          if (!err && typeof pageviewResponse === 'object') {
            const journeyInTestMode = requestData.branch_view_id ? true : false;
            if (
              branch_view.shouldDisplayJourney(
                pageviewResponse,
                options,
                journeyInTestMode,
              )
            ) {
              branch_view.displayJourney(
                pageviewResponse.template,
                requestData,
                requestData.branch_view_id ||
                  pageviewResponse.event_data.branch_view_data.id,
                pageviewResponse.event_data.branch_view_data,
                journeyInTestMode,
                pageviewResponse.journey_link_data,
                {
                  use_v2_renderer: pageviewResponse.use_v2_renderer,
                  animationConfig: pageviewResponse.animationConfig,
                },
              );
            } else {
              if (
                pageviewResponse.auto_branchify ||
                (!branchMatchIdFromOptions &&
                  getParamValue('branchify_url') &&
                  self._referringLink())
              ) {
                const linkOptions = {
                  'make_new_link': false,
                  'open_app': true,
                  'auto_branchify': true,
                };
                this.branch.deepview({}, linkOptions);
              }
              journeys_utils.branch._publishEvent('willNotShowJourney');
            }
          }
          if (ctx.userPreferences.trackingDisabled) {
            ctx.userPreferences.allowErrorsInCallback = true;
          }
        },
      );
    });
  };
  const attachVisibilityEvent = function () {
    let hidden: string | undefined;
    let changeEvent: string | undefined;
    if (typeof document.hidden !== 'undefined') {
      hidden = 'hidden';
      changeEvent = 'visibilitychange';
    } else if (typeof document.mozHidden !== 'undefined') {
      hidden = 'mozHidden';
      changeEvent = 'mozvisibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden';
      changeEvent = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden';
      changeEvent = 'webkitvisibilitychange';
    }
    if (changeEvent) {
      // Ensures that we add a change-event-listener exactly once in-case re-initialization occurs through branch.trackingDisabled(false)
      if (!self.changeEventListenerAdded) {
        self.changeEventListenerAdded = true;
        document.addEventListener(
          changeEvent,
          function () {
            if (!document[hidden]) {
              fetchLatestBrowserFingerPrintID(null);
              if (typeof self._deepviewRequestForReplay === 'function') {
                self._deepviewRequestForReplay();
              }
            }
          },
          false,
        );
      }
    }
  };
  if (
    sessionData?.session_id &&
    !link_identifier &&
    !getParamValue('branchify_url')
  ) {
    // resets data in session storage to prevent previous link click data from being returned to Branch.init()
    session.update(self._storage, { 'data': '' });
    session.update(self._storage, { 'referring_link': '' });
    attachVisibilityEvent();
    fetchLatestBrowserFingerPrintID(finishInit);
    return;
  }

  const params_r: Record<string, any> = {
    'sdk': config.version,
    'branch_key': self.branch_key,
  };
  const permData = session.get(self._storage, true) || {};

  if (permData.browser_fingerprint_id) {
    params_r._t = permData.browser_fingerprint_id;
  }

  if (permData.identity) {
    self.identity = permData.identity;
  }

  // Execute the /v1/open right away or after _open_delay_ms.
  const open_delay = parseInt(getParamValue('[?&]_open_delay_ms'), 10);

  if (!isSafari11OrGreater() && !isIOSWKWebView()) {
    self._api(resources._r, params_r, function (err, browser_fingerprint_id) {
      if (err) {
        self.init_state_fail_code = init_state_fail_codes.BFP_NOT_FOUND;
        self.init_state_fail_details = err.message;
        return finishInit(err, null);
      }
      delay(function () {
        self._api(
          resources.open,
          {
            'link_identifier': link_identifier,
            'browser_fingerprint_id': link_identifier || browser_fingerprint_id,
            'identity': permData.identity ? permData.identity : null,
            'alternative_browser_fingerprint_id':
              permData.browser_fingerprint_id,
            'options': options,
            'initial_referrer': getInitialReferrer(self._referringLink()),
            'current_url': getEnv().currentUrl(),
            'screen_height': getEnv().screenHeight(),
            'screen_width': getEnv().screenWidth(),
            'model': ctx.userAgentData ? ctx.userAgentData.model : null,
            'os_version': ctx.userAgentData
              ? ctx.userAgentData.platformVersion
              : null,
          },
          function (err, data) {
            if (err) {
              self.init_state_fail_code = init_state_fail_codes.OPEN_FAILED;
              self.init_state_fail_details = err.message;
            }
            if (!err && typeof data === 'object') {
              if (data.branch_view_enabled) {
                self._branchViewEnabled = !!data.branch_view_enabled;
                self._storage.set(
                  'branch_view_enabled',
                  self._branchViewEnabled,
                );
              }
              if (link_identifier) {
                data.click_id = link_identifier;
              }
            }
            attachVisibilityEvent();
            finishInit(err, data);
          },
        );
      }, open_delay);
    });
  } else {
    delay(function () {
      self._api(
        resources.open,
        {
          'link_identifier': link_identifier,
          'browser_fingerprint_id':
            link_identifier || permData.browser_fingerprint_id,
          'identity': permData.identity ? permData.identity : null,
          'alternative_browser_fingerprint_id': permData.browser_fingerprint_id,
          'options': options,
          'initial_referrer': getInitialReferrer(self._referringLink()),
          'current_url': getEnv().currentUrl(),
          'screen_height': getEnv().screenHeight(),
          'screen_width': getEnv().screenWidth(),
          'model': ctx.userAgentData ? ctx.userAgentData.model : null,
          'os_version': ctx.userAgentData
            ? ctx.userAgentData.platformVersion
            : null,
        },
        function (err, data) {
          if (err) {
            self.init_state_fail_code = init_state_fail_codes.OPEN_FAILED;
            self.init_state_fail_details = err.message;
          }
          if (!err && typeof data === 'object') {
            if (data.branch_view_enabled) {
              self._branchViewEnabled = !!data.branch_view_enabled;
              self._storage.set('branch_view_enabled', self._branchViewEnabled);
            }
            if (link_identifier) {
              data.click_id = link_identifier;
            }
          }
          attachVisibilityEvent();
          finishInit(err, data);
        },
      );
    }, open_delay);
  }
}

/**
 * currently private method, which may be opened to the public in the future
 */
export function renderQueue(this: Branch, done, render) {
  const self = this;
  if (self._renderFinalized) {
    render();
  } else {
    self._renderQueue = self._renderQueue || [];
    self._renderQueue.push(render);
  }
  done(null, null);
}

/**
 * currently private method, which may be opened to the public in the future
 */
export function renderFinalize(this: Branch, done) {
  const self = this;
  if (self._renderQueue && self._renderQueue.length > 0) {
    self._renderQueue.forEach(function (callback) {
      callback.call(this);
    });
    delete self._renderQueue;
  }
  self._renderFinalized = true;
  done(null, null);
}
