import { Branch, wrap, callback_params } from './core.js';
import { safejson } from '../core/safejson.js';
import { getPlatformByUserAgent } from '../core/platform.js';
import { cleanBannerText, merge } from '../lib/objects.js';
import { getEnv } from '../env/env.js';
import { banner } from '../banner/banner.js';
import { journeys_utils } from '../journeys/journeys_utils.js';

/** =WEB
 * @function Branch.setBranchViewData
 * @param data - _required_ - object of all link data, same as Branch.link()
 *
 * This function lets you set the deep link data dynamically for a given mobile web Journey. For
 * example, if you design a full page interstitial, and want the deep link data to be custom for each
 * page, you'd need to use this function to dynamically set the deep link params on page load. Then,
 * any Journey loaded on that page will inherit these deep link params.
 *
 * #### Usage
 *
 * ```js
 * branch.setBranchViewData(
 *   data // Data for link, same as Branch.link()
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * branch.setBranchViewData({
 *   tags: ['tag1', 'tag2'],
 *   data: {
 *     mydata: 'something',
 *     foo: 'bar',
 *     '$deeplink_path': 'open/item/1234'
 *   }
 * });
 * ```
 */
function _setBranchViewData(context, done, data: Record<string, any>) {
  data = data || {};
  try {
    context._branchViewData = safejson.parse(safejson.stringify(data));
  } finally {
    context._branchViewData = context._branchViewData || {};
  }
  done();
}

Branch.prototype.setBranchViewData = wrap(
  callback_params.CALLBACK_ERR,
  function (done, data) {
    _setBranchViewData.call(null, this, done, data);
  },
  /* allowed before init */ true,
);

/**
 * @function Branch.closeJourney
 * @param callback - _optional_
 *
 * Journeys include a close button the user can click, but you may want to close the
 * Journey with a timeout, or via some other user interaction with your web app. In this case,
 * closing the Journey is very simple by calling `Branch.closeJourney()`.
 *
 * ##### Usage
 * ```js
 * branch.closeJourney(function(err) { console.log(err); });
 * ```
 * ___
 *
 */
Branch.prototype.closeJourney = wrap(
  callback_params.CALLBACK_ERR,
  function (done) {
    const self = this;
    self.renderQueue(function () {
      if (journeys_utils.banner && journeys_utils.isJourneyDisplayed) {
        self._publishEvent(
          'didCallJourneyClose',
          journeys_utils.journeyLinkData,
        );
        journeys_utils.animateBannerExit(journeys_utils.banner, true);
      } else {
        return done('Journey already dismissed.');
      }
    });
    done();
  },
);

Branch.prototype.banner = wrap(
  callback_params.CALLBACK_ERR,
  function (done, options, data) {
    const banner_deprecation_msg =
      'The "banner" method is deprecated and will be removed in future versions. Please use Branch Journeys instead. For more information and migration steps, visit: https://help.branch.io/using-branch/docs/journeys-overview';
    console.warn(banner_deprecation_msg);
    const platform = getPlatformByUserAgent();
    if (['other', 'desktop'].includes(platform)) {
      console.info('banner functionality is not supported on this platform');
    } else {
      data = data || {};
      _setBranchViewData.call(null, this, function () {}, data);

      if (
        typeof options.showAgain === 'undefined' &&
        typeof options.forgetHide !== 'undefined'
      ) {
        options.showAgain = options.forgetHide;
      }
      const bannerOptions = {
        icon: cleanBannerText(options.icon) || '',
        title: cleanBannerText(options.title) || '',
        description: cleanBannerText(options.description) || '',
        reviewCount:
          typeof options.reviewCount === 'number' && options.reviewCount > 0 // force greater than 0
            ? Math.floor(options.reviewCount)
            : // force no decimal
              null,
        rating:
          typeof options.rating === 'number' &&
          options.rating <= 5 &&
          options.rating > 0
            ? Math.round(options.rating * 2) / 2
            : // force increments of .5
              null,
        openAppButtonText:
          cleanBannerText(options.openAppButtonText) || 'View in app',
        downloadAppButtonText:
          cleanBannerText(options.downloadAppButtonText) || 'Download App',
        iframe: typeof options.iframe === 'undefined' ? true : options.iframe,
        showiOS:
          typeof options.showiOS === 'undefined' ? true : options.showiOS,
        showiPad:
          typeof options.showiPad === 'undefined' ? true : options.showiPad,
        showAndroid:
          typeof options.showAndroid === 'undefined'
            ? true
            : options.showAndroid,
        showBlackberry:
          typeof options.showBlackberry === 'undefined'
            ? true
            : options.showBlackberry,
        showWindowsPhone:
          typeof options.showWindowsPhone === 'undefined'
            ? true
            : options.showWindowsPhone,
        showKindle:
          typeof options.showKindle === 'undefined' ? true : options.showKindle,
        disableHide: !!options.disableHide,
        forgetHide:
          typeof options.forgetHide === 'number'
            ? options.forgetHide
            : !!options.forgetHide,
        respectDNT:
          typeof options.respectDNT === 'undefined'
            ? false
            : options.respectDNT,
        position: options.position || 'top',
        customCSS: options.customCSS || '',
        mobileSticky:
          typeof options.mobileSticky === 'undefined'
            ? false
            : options.mobileSticky,
        buttonBorderColor: options.buttonBorderColor || '',
        buttonBackgroundColor: options.buttonBackgroundColor || '',
        buttonFontColor: options.buttonFontColor || '',
        buttonBorderColorHover: options.buttonBorderColorHover || '',
        buttonBackgroundColorHover: options.buttonBackgroundColorHover || '',
        buttonFontColorHover: options.buttonFontColorHover || '',
        make_new_link: !!options.make_new_link,
        open_app: !!options.open_app,
        immediate: !!options.immediate,
        append_deeplink_path: !!options.append_deeplink_path,
      };

      if (typeof options.showMobile !== 'undefined') {
        bannerOptions.showiOS = options.showMobile;
        bannerOptions.showAndroid = options.showMobile;
        bannerOptions.showBlackberry = options.showMobile;
        bannerOptions.showWindowsPhone = options.showMobile;
        bannerOptions.showKindle = options.showMobile;
      }

      data.data = merge(getEnv().hostedDeepLinkData(), data.data);

      const self = this;
      self.renderQueue(function () {
        self.closeBannerPointer = banner(
          self,
          bannerOptions,
          data,
          self._storage,
        );
      });
    }
    done();
  },
);

Branch.prototype.closeBanner = wrap(0, function (done) {
  const self = this;
  self.renderQueue(function () {
    if (self.closeBannerPointer) {
      self._publishEvent('willCloseBanner');
      self.closeBannerPointer(function () {
        self._publishEvent('didCloseBanner');
      });
    }
  });
  done();
});
