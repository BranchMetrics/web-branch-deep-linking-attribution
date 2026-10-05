import { Branch, wrap, callback_params } from './core.js';
import { safejson } from '../core/safejson.js';
import { utils } from '../core/utils.js';
import { resources } from '../network/resources.js';
import { branch_view } from '../journeys/branch_view.js';
import { journeys_utils } from '../journeys/journeys_utils.js';

/**
 * @function Branch.track
 * @param event - _required_ - name of the event to be tracked.
 * @param metadata - _optional_ - object of event metadata.
 * @param callback - _optional_
 *
 * This function allows you to track any event with supporting metadata.
 * The `metadata` parameter is a formatted JSON object that can contain
 * any data and has limitless hierarchy
 *
 * ##### Usage
 * ```js
 * branch.track(
 *     event,
 *     metadata,
 *     callback (err)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback("Error message");
 * ```
 * ___
 */
Branch.prototype.track = wrap(
  callback_params.CALLBACK_ERR,
  function (
    done,
    event: string,
    metadata?: Record<string, any>,
    options?: Record<string, any>,
  ) {
    const self = this;

    metadata = metadata || {};

    options = options || {};

    self._ctx.nonce = options.nonce ? options.nonce : self._ctx.nonce;

    if (event === 'pageview') {
      const hostedDeeplinkDataWithMergedMetadata =
        utils.mergeHostedDeeplinkData(utils.getHostedDeepLinkData(), metadata);
      if (
        hostedDeeplinkDataWithMergedMetadata &&
        Object.keys(hostedDeeplinkDataWithMergedMetadata).length > 0
      ) {
        metadata.hosted_deeplink_data = hostedDeeplinkDataWithMergedMetadata;
      }

      const requestData = branch_view._getPageviewRequestData(
        journeys_utils._getPageviewMetadata(options, metadata, self._ctx),
        options,
        self,
        false,
      );
      self._api(resources.pageview, requestData, function (...responseArgs) {
        const [err, pageviewResponse] = responseArgs;
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
            journeys_utils.branch._publishEvent('willNotShowJourney');
          }
        }
        if (typeof done === 'function') {
          done.apply(this, responseArgs);
        }
      });
    } else {
      console.warn('track method currently supports only pageview event.');
    }
  },
);

/**
 * @function Branch.logEvent
 * @param event - _required_
 * @param event_data_and_custom_data - _optional_
 * @param content_items - _optional_
 * @param customer_event_alias - _optional_
 * @param callback - _optional_
 *
 * Register commerce events, content events, user lifecycle events and custom events via logEvent()
 *
 * ##### NOTE: If this is the first time you are integrating our new event tracking feature via logEvent(), please use the latest Branch WebSDK snippet from the [Installation section](https://github.com/BranchMetrics/web-branch-deep-linking#quick-install). This has been updated in v2.30.0 of our SDK.
 *
 * The guides below provide information about what keys can be sent when triggering these event types:
 *
 * - [Logging Commerce Events](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-commerce-events)
 * - [Logging Content Events](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-content-events)
 * - [Logging User Lifecycle](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-user-lifecycle-events)
 * - [Logging Custom Events](https://github.com/BranchMetrics/branch-deep-linking-public-api/blob/dfe601286f7b01a6951d6952fc833220e97d80c0/README.md#logging-custom-events)
 *
 * ##### Usage for Commerce, Content & User Lifecycle "Standard Events"
 * ```js
 * branch.logEvent(
 *     event,
 *     event_data_and_custom_data,
 *     content_items,
 *     customer_event_alias,
 *     callback (err)
 * );
 * ```
 * ##### Usage for "Custom Events"
 * ```js
 * branch.logEvent(
 *     event,
 *     custom_data,
 *     callback (err)
 * );
 * ```
 * ##### Notes:
 * - logEvent() sends user_data automatically
 * - When firing Standard Events, send custom and event data as part of the same object
 * - Custom Events do not contain content items and event data
 *
 * ##### Example -- How to log a Commerce Event
 * ```js
 *var event_and_custom_data = {
 *    "transaction_id": "tras_Id_1232343434",
 *    "currency": "USD",
 *    "revenue": 180.2,
 *    "shipping": 10.5,
 *    "tax": 13.5,
 *    "coupon": "promo-1234",
 *    "affiliation": "high_fi",
 *    "description": "Preferred purchase",
 *    "purchase_loc": "Palo Alto",
 *    "store_pickup": "unavailable"
 *};
 *
 *var content_items = [
 *{
 *    "$content_schema": "COMMERCE_PRODUCT",
 *    "$og_title": "Nike Shoe",
 *    "$og_description": "Start loving your steps",
 *    "$og_image_url": "http://example.com/img1.jpg",
 *    "$canonical_identifier": "nike/1234",
 *    "$publicly_indexable": false,
 *    "$price": 101.2,
 *    "$locally_indexable": true,
 *    "$quantity": 1,
 *    "$sku": "1101123445",
 *    "$product_name": "Runner",
 *    "$product_brand": "Nike",
 *    "$product_category": "Sporting Goods",
 *    "$product_variant": "XL",
 *    "$rating_average": 4.2,
 *    "$rating_count": 5,
 *    "$rating_max": 2.2,
 *    "$creation_timestamp": 1499892854966,
 *    "$exp_date": 1499892854966,
 *    "$keywords": [ "sneakers", "shoes" ],
 *    "$address_street": "230 South LaSalle Street",
 *    "$address_city": "Chicago",
 *    "$address_region": "IL",
 *    "$address_country": "US",
 *    "$address_postal_code": "60604",
 *    "$latitude": 12.07,
 *    "$longitude": -97.5,
 *    "$image_captions": [ "my_img_caption1", "my_img_caption_2" ],
 *    "$condition": "NEW",
 *    "$custom_fields": {"foo1":"bar1","foo2":"bar2"}
 *},
 *{
 *    "$og_title": "Nike Woolen Sox",
 *    "$canonical_identifier": "nike/5324",
 *    "$og_description": "Fine combed woolen sox for those who love your foot",
 *    "$publicly_indexable": false,
 *    "$price": 80.2,
 *    "$locally_indexable": true,
 *    "$quantity": 5,
 *    "$sku": "110112467",
 *    "$product_name": "Woolen Sox",
 *    "$product_brand": "Nike",
 *    "$product_category": "Apparel & Accessories",
 *    "$product_variant": "Xl",
 *    "$rating_average": 3.3,
 *    "$rating_count": 5,
 *    "$rating_max": 2.8,
 *    "$creation_timestamp": 1499892854966
 *}];
 *
 * var customer_event_alias = "event alias";
 *
 *branch.logEvent(
 *    "PURCHASE",
 *    event_and_custom_data,
 *    content_items,
 *    customer_event_alias,
 *    function(err) { console.log(err); }
 *);
 * ```
 * ___
 */
Branch.prototype.logEvent = wrap(
  callback_params.CALLBACK_ERR,
  function (done, name, eventData, contentItems, customer_event_alias: string) {
    name = utils.validateParameterType(name, 'string') ? name : null;
    eventData = utils.validateParameterType(eventData, 'object')
      ? eventData
      : null;
    customer_event_alias = utils.validateParameterType(
      customer_event_alias,
      'string',
    )
      ? customer_event_alias
      : null;
    const extractedEventAndCustomData =
      utils.separateEventAndCustomData(eventData);

    if (utils.isStandardEvent(name)) {
      contentItems = utils.validateParameterType(contentItems, 'array')
        ? contentItems
        : null;
      this._api(
        resources.logStandardEvent,
        {
          'name': name,
          'user_data': safejson.stringify(utils.getUserData(this)),
          'custom_data': safejson.stringify(
            extractedEventAndCustomData?.custom_data || {},
          ),
          'event_data': safejson.stringify(
            extractedEventAndCustomData?.event_data || {},
          ),
          'content_items': safejson.stringify(contentItems || []),
          'customer_event_alias': customer_event_alias,
        },
        function (err, _data) {
          return done(err || null);
        },
      );
    } else {
      this._api(
        resources.logCustomEvent,
        {
          'name': name,
          'user_data': safejson.stringify(utils.getUserData(this)),
          'custom_data': safejson.stringify(
            extractedEventAndCustomData?.custom_data || {},
          ),
          'event_data': safejson.stringify(
            extractedEventAndCustomData?.event_data || {},
          ),
          'content_items': safejson.stringify(contentItems || []),
          'customer_event_alias': customer_event_alias,
        },
        function (err, _data) {
          return done(err || null);
        },
      );
    }
  },
);

/**
 * @function Branch.trackCommerceEvent
 * @param event - _required_ - Name of the commerce event to be tracked. We currently support 'purchase' events
 * @param commerce_data - _required_ - Data that describes the commerce event
 * @param metadata - _optional_ - metadata you may want add to the event
 * @param callback - _optional_ - Returns an error if unsuccessful
 *
 * Sends a user commerce event to the server
 *
 * Use commerce events to track when a user purchases an item in your online store,
 * makes an in-app purchase, or buys a subscription. The commerce events are tracked in
 * the Branch dashboard along with your other events so you can judge the effectiveness of
 * campaigns and other analytics.
 *
 * ##### Usage
 *
 * ```js
 * branch.trackCommerceEvent(
 *     event,
 *     commerce_data,
 *     metadata,
 *     callback (err)
 * );
 * ```
 *
 * ##### Example
 *
 * ```js
 * var commerce_data = {
 *     "revenue": 50.0,
 *     "currency": "USD",
 *     "transaction_id": "foo-transaction-id",
 *     "shipping": 0.0,
 *     "tax": 5.0,
 *     "affiliation": "foo-affiliation",
 *     "products": [
 *          { "sku": "foo-sku-1", "name": "foo-item-1", "price": 45.00, "quantity": 1, "brand": "foo-brand",
 *            "category": "Electronics", "variant": "foo-variant-1"},
 *          { "sku": "foo-sku-2", "price": 2.50, "quantity": 2}
 *      ],
 * };
 *
 * var metadata =  { "foo": "bar" };
 *
 * branch.trackCommerceEvent('purchase', commerce_data, metadata, function(err) {
 *     if(err) {
 *          throw err;
 *     }
 * });
 * ```
 * ___
 */
Branch.prototype.trackCommerceEvent = wrap(
  callback_params.CALLBACK_ERR,
  function (
    done,
    event: string,
    commerce_data: Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    const self = this;
    self.renderQueue(function () {
      const validationError = utils.validateCommerceEventParams(
        event,
        commerce_data,
      );
      if (validationError) {
        return done(new Error(validationError));
      }

      self._api(
        resources.commerceEvent,
        {
          'event': event,
          'metadata': utils.merge(
            {
              'url': document.URL,
              'user_agent': navigator.userAgent,
              'language': navigator.language,
            },
            metadata || {},
          ),
          'initial_referrer': utils.getInitialReferrer(self._referringLink()),
          'commerce_data': commerce_data,
        },
        function (err, _data) {
          done(err || null);
        },
      );
    });
    done();
  },
);
