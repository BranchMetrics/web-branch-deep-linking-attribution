import { Branch, wrap, callback_params } from './core.js';
import { safejson } from '../core/safejson.js';
import { utils } from '../core/utils.js';
import { resources } from '../network/resources.js';

/**
 * @function Branch.link
 * @param data - _required_ - link data and metadata.
 * @param callback - _required_ - returns a string of the Branch deep
 * linking URL.
 *
 * **Formerly `createLink()`**
 *
 * Creates and returns a deep linking URL.  The `data` parameter can include an
 * object with optional data you would like to store, including Facebook
 * [Open Graph data](https://developers.facebook.com/docs/opengraph).
 *
 * **data** The dictionary to embed with the link. Accessed as session or install parameters from
 * the SDK.
 *
 * **Note**
 * You can customize the Facebook OG tags of each URL if you want to dynamically share content by
 * using the following optional keys in the data dictionary. Please use this
 * [Facebook tool](https://developers.facebook.com/tools/debug/og/object) to debug your OG tags!
 *
 * | Key | Value
 * | --- | ---
 * | "$og_title" | The title you'd like to appear for the link in social media
 * | "$og_description" | The description you'd like to appear for the link in social media
 * | "$og_image_url" | The URL for the image you'd like to appear for the link in social media
 * | "$og_video" | The URL for the video
 * | "$og_url" | The URL you'd like to appear
 * | "$og_redirect" | If you want to bypass our OG tags and use your own, use this key with the URL that contains your site's metadata.
 *
 * Also, you can set custom redirection by inserting the following optional keys in the dictionary:
 *
 * | Key | Value
 * | --- | ---
 * | "$desktop_url" | Where to send the user on a desktop or laptop. By default it is the Branch-hosted text-me service
 * | "$android_url" | The replacement URL for the Play Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_
 * | "$ios_url" | The replacement URL for the App Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_
 * | "$ipad_url" | Same as above but for iPad Store
 * | "$fire_url" | Same as above but for Amazon Fire Store
 * | "$blackberry_url" | Same as above but for Blackberry Store
 * | "$windows_phone_url" | Same as above but for Windows Store
 * | "$after_click_url" | When a user returns to the browser after going to the app, take them to this URL. _iOS only; Android coming soon_
 *
 * You have the ability to control the direct deep linking of each link as well:
 *
 * | Key | Value
 * | --- | ---
 * | "$deeplink_path" | The value of the deep link path that you'd like us to append to your URI. For example, you could specify "$deeplink_path": "radio/station/456" and we'll open the app with the URI "yourapp://radio/station/456?link_click_id=branch-identifier". This is primarily for supporting legacy deep linking infrastructure.
 * | "$always_deeplink" | true or false. (default is not to deep link first) This key can be specified to have our linking service force try to open the app, even if we're not sure the user has the app installed. If the app is not installed, we fall back to the respective app store or $platform_url key. By default, we only open the app if we've seen a user initiate a session in your app from a Branch link (has been cookied and deep linked by Branch).
 *
 * #### Usage
 * ```js
 * branch.link(
 *     data,
 *     callback (err, link)
 * );
 * ```
 *
 * #### Example
 * ```js
 * branch.link({
 *     tags: [ 'tag1', 'tag2' ],
 *     channel: 'facebook',
 *     feature: 'dashboard',
 *     stage: 'new user',
 *     data: {
 *         mydata: 'something',
 *         foo: 'bar',
 *         '$desktop_url': 'http://myappwebsite.com',
 *         '$ios_url': 'http://myappwebsite.com/ios',
 *         '$ipad_url': 'http://myappwebsite.com/ipad',
 *         '$android_url': 'http://myappwebsite.com/android',
 *         '$og_app_id': '12345',
 *         '$og_title': 'My App',
 *         '$og_description': 'My app\'s description.',
 *         '$og_image_url': 'http://myappwebsite.com/image.png'
 *     }
 * }, function(err, link) {
 *     console.log(err, link);
 * });
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     'https://bnc.lt/l/3HZMytU-BW' // Branch deep linking URL
 * );
 * ```
 *
 */
Branch.prototype.link = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done, data: Record<string, any>) {
    const linkData = utils.cleanLinkData(data);
    const keyCopy = this.branch_key;
    this._api(resources.link, linkData, function (err, data) {
      if (err) {
        // if an error occurs or if tracking is disabled then return a dynamic link
        return done(err, utils.generateDynamicBNCLink(keyCopy, linkData));
      }
      // biome-ignore lint/complexity/useOptionalChain: callers get null (not undefined) when data is null
      done(null, data && data.url);
    });
  },
);

/**
 * @function Branch.qrCode
 * @param linkData - _required_ - object of all link data, same as branch.link().
 * @param qrCodeSettings - _optional_ - options
 *     image_format: Image format, "png" or "jpeg"
 *     code_color: String Hex color value of the QR Code
 *     background_color: String Hex color value of the background of the QR code
 *     margin: Integer (Pixels) The number of pixels you want for the margin. Max 20.
 *     width: Integer (Pixels) Output size of QR Code image.
 * @param callback - _optional_ - returns an error if the API call is unsuccessful
 *
 * Returns a qrCode with the specified linkData.
 *
 * #### Usage
 * ```js
 * branch.qrCode(
 *     linkData,
 *     qrCodeSettings,
 *     callback (err, link)
 * );
 * ```
 *
 * #### Example
 * ```js
 *  var qrCodeSettings = {
 *      "code_color":"#000000",
 *      "background_color": "#FFFFFF",
 *      "margin": 5,
 *      "width": 1000,
 *      "image_format": "png"
 *  };
 *  var qrCodeLinkData = {
 *      tags: [ 'tag1', 'tag2' ],
 *      channel: 'sample app',
 *      feature: 'create link',
 *      stage: 'created link',
 *      type: 1,
 *      data: {
 *          mydata: 'bar',
 *          '$desktop_url': 'https://cdn.branch.io/example.html',
 *          '$og_title': 'Branch Metrics',
 *          '$og_description': 'Branch Metrics',
 *          '$og_image_url': 'http://branch.io/img/logo_icon_white.png'
 *      }
 *  };
 * branch.qrCode(qrCodeLinkData, qrCodeSettings, function(err, qrCode) {
 *    response.html('<img src="data:image/png;charset=utf-8;base64,' + qrCode.base64() + '" width="500" height="500">');
 * });
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message",
 *     QrCode // Branch QrCode object
 * );
 * ```
 */
Branch.prototype.qrCode = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (
    done,
    linkData: Record<string, any>,
    qrCodeSettings?: Record<string, any>,
    _options?: Record<string, any>,
  ) {
    const data = utils.cleanLinkData(linkData);
    data.qr_code_settings = safejson.stringify(
      utils.convertObjectValuesToString(qrCodeSettings || {}),
    );
    this._api(
      resources.qrCode,
      utils.cleanLinkData(linkData),
      function (error, rawBuffer) {
        function QrCode() {}
        if (!error) {
          QrCode.rawBuffer = rawBuffer;
          QrCode.base64 = function () {
            // First Encode array buffer as UTF-8 String, then Base64 Encode
            if (this.rawBuffer) {
              const binaryString = Array.from(new Uint8Array(rawBuffer))
                .map((byte) => String.fromCharCode(byte))
                .join('');
              return btoa(binaryString);
            }
            throw Error('QrCode.rawBuffer is empty.');
          };
        }
        return done(error || null, QrCode || null);
      },
    );
  },
);

/**
 * @function Branch.deepview
 * @param data - _required_ - object of all link data, same as branch.link().
 * @param options - _optional_ - { *make_new_link*: _whether to create a new link even if
 * one already exists_. *open_app*, _whether to try to open the app passively (as opposed to
 * opening it upon user clicking); defaults to true_
 * }.
 * @param callback - _optional_ - returns an error if the API call is unsuccessful
 *
 * Turns the current page into a "deepview" – a preview of app content. This gives the page two
 * special behaviors: (1) when the page is viewed on a mobile browser, if the user has the app
 * installed on their phone, we will try to open the app automaticaly and deeplink them to this
 * content (this can be toggled off by turning open_app to false, but this is not recommended),
 * and (2) provides a callback to open the app directly, accessible as `branch.deepviewCta()`;
 * you'll want to have a button on your web page that says something like "View in app", which
 * calls this function.
 *
 * See [this tutorial](https://blog.branch.io/how-to-deep-link-from-your-mobile-website) for a full
 * guide on how to use the deepview functionality of the Web SDK.
 *
 * #### Usage
 * ```js
 * branch.deepview(
 *     data,
 *     options,
 *     callback (err)
 * );
 * ```
 *
 * #### Example
 * ```js
 * branch.deepview(
 *     {
 *         channel: 'facebook',
 *         data: {
 *             mydata: 'content of my data',
 *             foo: 'bar',
 *             '$deeplink_path': 'item_id=12345'
 *         },
 *         feature: 'dashboard',
 *         stage: 'new user',
 *         tags: [ 'tag1', 'tag2' ],
 *     },
 *     {
 *         make_new_link: true,
 *         open_app: true
 *     },
 *     function(err) {
 *         console.log(err || 'no error');
 *     }
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *     "Error message"
 * );
 * ```
 *
 */
Branch.prototype.deepview = wrap(
  callback_params.CALLBACK_ERR,
  function (done, data: Record<string, any>, options?: Record<string, any>) {
    const self = this;

    if (!options) {
      options = {};
    }

    if (typeof options.deepview_type === 'undefined') {
      options.deepview_type = 'deepview';
    } else {
      // we are currently limited to just 'deepview' or 'banner', but if that changes,
      // then this line should be removed
      options.deepview_type = 'banner';
    }

    data.data = utils.merge(utils.getHostedDeepLinkData(), data.data);
    data = utils.isIframe() ? utils.merge({ 'is_iframe': true }, data) : data;

    const cleanedData = utils.cleanLinkData(data);
    const fallbackUrl = utils.generateDynamicBNCLink(
      this.branch_key,
      cleanedData,
    );

    if (
      options.open_app ||
      options.open_app === null ||
      typeof options.open_app === 'undefined'
    ) {
      cleanedData.open_app = true;
    }
    cleanedData.append_deeplink_path = !!options.append_deeplink_path;
    cleanedData.deepview_type = options.deepview_type;

    const referringLink = self._referringLink();
    if (referringLink && !options.make_new_link) {
      cleanedData.link_click_id =
        utils.getClickIdAndSearchStringFromLink(referringLink);
    }

    // Not sent to the server: _api only sends keys listed in resources.deepview.params, and
    // banner_options isn't one of them.
    cleanedData.banner_options = options;

    if (options.auto_branchify) {
      cleanedData.auto_branchify = true;
    }

    self._deepviewRequestForReplay = this._api.bind(
      self,
      resources.deepview,
      cleanedData,
      function (err, data) {
        if (err) {
          // ensures that a partner cannot call branch._deepviewCta() if a user decides to disable tracking
          if (!utils.userPreferences.trackingDisabled) {
            self._deepviewCta = function () {
              self._windowRedirect(fallbackUrl);
            };
          }
          return done(err);
        }

        if (typeof data === 'function') {
          self._deepviewCta = data;
        }

        done(null);
      },
    );

    self._deepviewRequestForReplay();
  },
);

Branch.prototype._windowRedirect = function (url) {
  window.top.location = url;
};

/**
 * @function Branch.deepviewCta
 *
 * @description
 *
 * Perform the branch deepview CTA (call to action) on mobile after `branch.deepview()` call is
 * finished. If the `branch.deepview()` call is finished with no error, when `branch.deepviewCta()` is called,
 * an attempt is made to open the app and deeplink the end user into it; if the end user does not
 * have the app installed, they will be redirected to the platform-appropriate app stores. If on the
 * other hand, `branch.deepview()` returns with an error, `branch.deepviewCta()` will fall back to
 * redirect the user using
 * [Branch dynamic links](https://github.com/BranchMetrics/Deferred-Deep-Linking-Public-API#structuring-a-dynamic-deeplink).
 *
 * If `branch.deepview()` has not been called, an error will arise with a reminder to call
 * `branch.deepview()` first.
 *
 * ##### Usage
 * ```js
 * $('a.deepview-cta').click(branch.deepviewCta); // If you are using jQuery
 *
 * document.getElementById('my-elem').onClick = branch.deepviewCta; // Or generally
 *
 * <a href='...' onclick='branch.deepviewCta()'> // In HTML
 *
 * // We recommend to assign deepviewCta in deepview callback:
 * branch.deepview(data, option, function(err) {
 *     if (err) {
 *         throw err;
 *     }
 *     $('a.deepview-cta').click(branch.deepviewCta);
 * });
 *
 * // You can call this function any time after branch.deepview() is finished by simply:
 * branch.deepviewCta();
 *
 * When debugging, please call branch.deepviewCta() with an error callback like so:
 *
 * branch.deepviewCta(function(err) {
 * 	if (err) {
 * 		console.log(err);
 * 	}
 * });
 * ```
 *
 *
 */
Branch.prototype.deepviewCta = wrap(
  callback_params.CALLBACK_ERR,
  function (done) {
    if (typeof this._deepviewCta === 'undefined') {
      return utils.userPreferences.trackingDisabled
        ? done(new Error(utils.messages.trackingDisabled), null)
        : done(new Error(utils.messages.deepviewNotCalled), null);
    }
    if (window.event) {
      if (window.event.preventDefault) {
        window.event.preventDefault();
      } else {
        window.event.returnValue = false;
      }
    }
    this._publishEvent('didDeepviewCTA');
    this._deepviewCta();
    done();
  },
);
