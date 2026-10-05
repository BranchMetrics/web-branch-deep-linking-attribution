import { utils } from '../utils.js';

const validCommerceEvents = ['purchase'];

const commerceEventMessages = {
  'missingPurchaseEvent':
    "event name is either missing, of the wrong type or not valid. Please specify 'purchase' as the event name.",
  'missingCommerceData':
    'commerce_data is either missing, of the wrong type or empty. Please ensure that commerce_data is constructed correctly.',
  'invalidKeysForRoot':
    'Please remove the following keys from the root of commerce_data: ',
  'invalidKeysForProducts':
    'Please remove the following keys from commerce_data.products: ',
  'invalidProductListType':
    'commerce_data.products must be an array of objects',
  'invalidProductType': 'Each product in the products list must be an object',
};

/**
 * Validates the commerce-data object passed into branch.trackCommerceEvent().
 * If there are invalid keys present then it will report back what those keys are.
 * Note: The keys below are optional.
 */
const validateCommerceDataKeys = function (commerceData) {
  const allowedInRoot = [
    'common',
    'type',
    'transaction_id',
    'currency',
    'revenue',
    'revenue_in_usd',
    'exchange_rate',
    'shipping',
    'tax',
    'coupon',
    'affiliation',
    'persona',
    'products',
  ];
  const allowedInProducts = [
    'sku',
    'name',
    'price',
    'quantity',
    'brand',
    'category',
    'variant',
  ];

  const invalidKeysInRoot = utils.calculateDiffBetweenArrays(
    allowedInRoot,
    Object.keys(commerceData),
  );
  if (invalidKeysInRoot.length) {
    return (
      commerceEventMessages.invalidKeysForRoot + invalidKeysInRoot.join(', ')
    );
  }

  let invalidKeysForProducts = [];
  let invalidProductType: string | undefined;
  if (Object.prototype.hasOwnProperty.call(commerceData, 'products')) {
    // make sure products is an array
    if (!Array.isArray(commerceData.products)) {
      return commerceEventMessages.invalidProductListType;
    }
    commerceData.products.forEach(function (product) {
      // all product entries must be objects
      if (typeof product !== 'object') {
        invalidProductType = commerceEventMessages.invalidProductType;
      }
      invalidKeysForProducts = invalidKeysForProducts.concat(
        utils.calculateDiffBetweenArrays(
          allowedInProducts,
          Object.keys(product),
        ),
      );
    });

    if (invalidProductType) {
      return invalidProductType;
    }

    if (invalidKeysForProducts.length) {
      return (
        commerceEventMessages.invalidKeysForProducts +
        invalidKeysForProducts.join(', ')
      );
    }
  }

  return null;
};

// v2/event utility functions

const BRANCH_STANDARD_EVENTS = [
  'ADD_TO_CART',
  'ADD_TO_WISHLIST',
  'VIEW_CART',
  'INITIATE_PURCHASE',
  'ADD_PAYMENT_INFO',
  'PURCHASE',
  'SPEND_CREDITS',
  'SEARCH',
  'VIEW_ITEM',
  'VIEW_ITEMS',
  'RATE',
  'SHARE',
  'COMPLETE_REGISTRATION',
  'COMPLETE_TUTORIAL',
  'ACHIEVE_LEVEL',
  'UNLOCK_ACHIEVEMENT',
  'LOGIN',
  'SUBSCRIBE',
  'START_TRIAL',
  'INVITE',
  'RESERVE',
  'VIEW_AD',
  'CLICK_AD',
  'INITIATE_STREAM',
  'COMPLETE_STREAM',
];

const BRANCH_STANDARD_EVENT_DATA = [
  'transaction_id',
  'revenue',
  'currency',
  'shipping',
  'tax',
  'coupon',
  'affiliation',
  'search_query',
  'description',
];

export const events = {
  /**
   * Returns an array which contains the difference in elements between the 'original' and 'toCheck' arrays.
   * If there is no difference, an empty array will be returned.
   */
  calculateDiffBetweenArrays: function (original, toCheck) {
    const diff = [];
    toCheck.forEach(function (element) {
      if (original.indexOf(element) === -1) {
        diff.push(element);
      }
    });
    return diff;
  },

  /**
   * Returns an error message if the partner passes in an invalid event or commerce_data to branch.trackCommerceEvent()
   */
  validateCommerceEventParams: function (event, commerce_data) {
    if (
      !event ||
      typeof event !== 'string' ||
      validCommerceEvents.indexOf(event.toLowerCase()) === -1
    ) {
      return commerceEventMessages.missingPurchaseEvent;
    }

    if (
      !commerce_data ||
      typeof commerce_data !== 'object' ||
      Object.keys(commerce_data || {}).length === 0
    ) {
      return commerceEventMessages.missingCommerceData;
    }

    const invalidKeysMessage = validateCommerceDataKeys(commerce_data);
    if (invalidKeysMessage) {
      return invalidKeysMessage;
    }

    return null;
  },

  isStandardEvent: function (eventName) {
    return eventName && BRANCH_STANDARD_EVENTS.indexOf(eventName) > -1;
  },

  separateEventAndCustomData: function (eventAndCustomData) {
    if (!eventAndCustomData || Object.keys(eventAndCustomData).length === 0) {
      return null;
    }
    const customDataKeys = utils.calculateDiffBetweenArrays(
      BRANCH_STANDARD_EVENT_DATA,
      Object.keys(eventAndCustomData),
    );
    const customData: Record<string, any> = {};

    for (let i = 0; i < customDataKeys.length; i++) {
      const key = customDataKeys[i];
      customData[key] = eventAndCustomData[key];
      delete eventAndCustomData[key];
    }
    return {
      'custom_data': utils.convertObjectValuesToString(customData),
      'event_data': eventAndCustomData,
    };
  },
};
