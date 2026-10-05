import { Branch, wrap, callback_params } from './core.js';
import { config } from '../core/config.js';
import { safejson } from '../core/safejson.js';
import { utils } from '../core/utils.js';
import { session } from '../core/session.js';

/**
 * @function Branch.disableTracking
 * @param disableTracking - _optional_ - true disables tracking and false re-enables tracking.
 *
 * ##### Notes:
 * - disableTracking() without a parameter is a shorthand for disableTracking(true).
 * - If a call to disableTracking(false) is made, the WebSDK will re-initialize. Additionally, if tracking_disabled: true is passed
 *   as an option to init(), it will be removed during the reinitialization process.
 *
 * Allows User to Remain Private
 *
 * This will prevent any Branch requests from being sent across the network, except for the case of deep linking.
 * If someone clicks a Branch link, but has expressed not to be tracked, we will return deep linking data back to the
 * client but without tracking information.
 *
 * In do-not-track mode, you will still be able to create links and display Journeys however, they will not have identifiable
 * information associated to them. You can change this behavior at any time, by calling the aforementioned function.
 * The do-not-track mode state is persistent: it is saved for the user across browser sessions for the web site.
 * ___
 */
Branch.prototype.disableTracking = wrap(
  callback_params.CALLBACK_ERR,
  function (done, disableTracking?: boolean | string) {
    if (disableTracking === false || disableTracking === 'false') {
      this._ctx.userPreferences.trackingDisabled = false;
      this._ctx.userPreferences.allowErrorsInCallback = false;
      if (this.branch_key && this.init_options) {
        if (this.init_options.tracking_disabled === true) {
          delete this.init_options.tracking_disabled;
        }
        this.init(this.branch_key, this.init_options);
      }
    } else if (
      disableTracking === undefined ||
      disableTracking === true ||
      disableTracking === 'true'
    ) {
      session.cleanApplicationAndSessionStorage(this);
      this._ctx.userPreferences.trackingDisabled = true;
      this._ctx.userPreferences.allowErrorsInCallback = true;
      this.closeBanner();
      this.closeJourney();
      // Branch will not re-initialize
    }
    done();
  },
  /* allowed before init */ true,
);

Branch.prototype.setAPIResponseCallback = wrap(
  callback_params.NO_CALLBACK,
  function (done, callback) {
    this._server.onAPIResponse = callback;
    done();
  },
  /* allowed before init */ true,
);

/***
 * @function Branch.setDMAParamsForEEA
 * @param eeaRegion - If European regulations, including the DMA, apply to this user and conversion.
 * @param adPersonalizationConsent - If End user has granted/denied ads personalization consent.
 * @param adUserDataUsageConsent - If User has granted/denied consent for 3P transmission of user level data for ads.
 * Sets the value of parameters required by Google Conversion APIs for DMA Compliance in EEA region.
 */
Branch.prototype.setDMAParamsForEEA = wrap(
  callback_params.CALLBACK_ERR,
  function (
    done,
    eeaRegion: boolean,
    adPersonalizationConsent: boolean,
    adUserDataUsageConsent: boolean,
  ) {
    try {
      const validateParam = (param, paramName) => {
        if (!utils.isBoolean(param)) {
          console.warn(
            `setDMAParamsForEEA: ${paramName} must be boolean, but got ${param}`,
          );
          return false;
        }
        return true;
      };
      const isValid =
        validateParam(eeaRegion, 'eeaRegion') &&
        validateParam(adPersonalizationConsent, 'adPersonalizationConsent') &&
        validateParam(adUserDataUsageConsent, 'adUserDataUsageConsent');
      if (!isValid) {
        return;
      }

      const dmaObj: Record<string, any> = {};
      dmaObj.eeaRegion = eeaRegion;
      dmaObj.adPersonalizationConsent = adPersonalizationConsent;
      dmaObj.adUserDataUsageConsent = adUserDataUsageConsent;

      this._storage.set('branch_dma_data', safejson.stringify(dmaObj), true);
    } catch (e) {
      console.error(
        'setDMAParamsForEEA::An error occurred while setting DMA parameters for EEA',
        e,
      );
    }
    done();
  },
  true,
);

/***
 * @function Branch.setRequestMetaData
 * @param key - Request metadata key
 * @param value - Request metadata value
 * Sets request metadata that gets passed along with all the API calls, including
 * v1/pageview and v1/dismiss (merged directly into that request's metadata field,
 * same as every other endpoint).
 */
Branch.prototype.setRequestMetaData = function (key: string, value: string) {
  try {
    if (
      typeof key === 'undefined' ||
      key === null ||
      key.length === 0 ||
      typeof value === 'undefined'
    ) {
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(this.requestMetadata, key) &&
      value === null
    ) {
      delete this.requestMetadata[key];
    }

    this.requestMetadata = utils.addPropertyIfNotNull(
      this.requestMetadata,
      key,
      value,
    );
  } catch (e) {
    console.error('An error occured while setting request metadata', e);
  }
};

/***
 * @function Branch.setAPIUrl
 * @param url - url
 * Sets a custom base URL for all calls to the Branch API
 */
Branch.prototype.setAPIUrl = function (url: string) {
  if (!utils.isValidURL(url)) {
    console.error('setAPIUrl: Invalid URL format. Default URL will be set.');
    return;
  }

  config.api_endpoint = url;
};

/***
 * @function Branch.getAPIUrl
 * returns the base URL for all calls to the Branch API
 */
Branch.prototype.getAPIUrl = function () {
  return config.api_endpoint;
};
