import { utils } from '../../../src/core/utils.js';

// Characterization tests: these pin what the event helpers do today,
// quirks included. Do not "fix" expectations here without a behavior change.

const MSG = {
  missingPurchaseEvent:
    "event name is either missing, of the wrong type or not valid. Please specify 'purchase' as the event name.",
  missingCommerceData:
    'commerce_data is either missing, of the wrong type or empty. Please ensure that commerce_data is constructed correctly.',
  invalidKeysForRoot:
    'Please remove the following keys from the root of commerce_data: ',
  invalidKeysForProducts:
    'Please remove the following keys from commerce_data.products: ',
  invalidProductListType: 'commerce_data.products must be an array of objects',
  invalidProductType: 'Each product in the products list must be an object',
};

const STANDARD_EVENTS = [
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

function fullCommerceData() {
  return {
    common: { a: 1 },
    type: 'purchase',
    transaction_id: 'tx-1',
    currency: 'USD',
    revenue: 10,
    revenue_in_usd: 10,
    exchange_rate: 1,
    shipping: 1,
    tax: 1,
    coupon: 'SAVE',
    affiliation: 'store',
    persona: 'p',
    products: [
      {
        sku: 's1',
        name: 'n',
        price: 1,
        quantity: 1,
        brand: 'b',
        category: 'c',
        variant: 'v',
      },
    ],
  };
}

afterEach(function () {
  vi.restoreAllMocks();
});

describe('events utils (characterization)', function () {
  describe('calculateDiffBetweenArrays', function () {
    it.each([
      ['no difference', ['a', 'b'], ['b', 'a'], []],
      ['empty toCheck', ['a'], [], []],
      ['empty original', [], ['a', 'b'], ['a', 'b']],
      ['keeps toCheck order', ['b'], ['c', 'b', 'a'], ['c', 'a']],
      ['keeps duplicates', ['a'], ['x', 'x', 'a'], ['x', 'x']],
      ['uses strict equality', [1], ['1', 1], ['1']],
      ['ignores extra elements in original', ['a', 'b', 'c'], ['a'], []],
    ])('%s', function (_name, original, toCheck, expected) {
      expect(utils.calculateDiffBetweenArrays(original, toCheck)).toEqual(
        expected,
      );
    });

    it('does not mutate its inputs', function () {
      const original = ['a'];
      const toCheck = ['a', 'b'];
      utils.calculateDiffBetweenArrays(original, toCheck);
      expect(original).toEqual(['a']);
      expect(toCheck).toEqual(['a', 'b']);
    });

    it('throws when toCheck is not an array', function () {
      expect(function () {
        utils.calculateDiffBetweenArrays(['a'], undefined);
      }).toThrow(TypeError);
    });
  });

  describe('validateCommerceEventParams', function () {
    describe('event name', function () {
      it.each([
        ['undefined', undefined],
        ['null', null],
        ['empty string', ''],
        ['a number', 1],
        ['an object', { name: 'purchase' }],
        ['a non-purchase name', 'add_to_cart'],
        ['purchase with whitespace', ' purchase'],
      ])('rejects %s', function (_name, event) {
        expect(
          utils.validateCommerceEventParams(event, fullCommerceData()),
        ).toBe(MSG.missingPurchaseEvent);
      });

      it.each(['purchase', 'PURCHASE', 'Purchase'])(
        'accepts %j case-insensitively',
        function (event) {
          expect(
            utils.validateCommerceEventParams(event, fullCommerceData()),
          ).toBeNull();
        },
      );

      it('checks the event before commerce_data', function () {
        expect(utils.validateCommerceEventParams('nope', undefined)).toBe(
          MSG.missingPurchaseEvent,
        );
      });
    });

    describe('commerce_data', function () {
      it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty object', {}],
        ['an empty array', []],
        ['a string', 'revenue'],
        ['a number', 10],
        ['true', true],
      ])('rejects %s', function (_name, data) {
        expect(utils.validateCommerceEventParams('purchase', data)).toBe(
          MSG.missingCommerceData,
        );
      });

      it('accepts every allowed root and product key', function () {
        expect(
          utils.validateCommerceEventParams('purchase', fullCommerceData()),
        ).toBeNull();
      });

      it('accepts a minimal object without products', function () {
        expect(
          utils.validateCommerceEventParams('purchase', { revenue: 1 }),
        ).toBeNull();
      });

      it('reports invalid root keys in key order, comma separated', function () {
        expect(
          utils.validateCommerceEventParams('purchase', {
            revenue: 1,
            foo: 1,
            bar: 2,
          }),
        ).toBe(`${MSG.invalidKeysForRoot}foo, bar`);
      });

      it('treats a non-empty array as an object with index keys', function () {
        expect(utils.validateCommerceEventParams('purchase', ['a', 'b'])).toBe(
          `${MSG.invalidKeysForRoot}0, 1`,
        );
      });

      it('reports invalid root keys before any products problem', function () {
        expect(
          utils.validateCommerceEventParams('purchase', {
            foo: 1,
            products: 'not-an-array',
          }),
        ).toBe(`${MSG.invalidKeysForRoot}foo`);
      });
    });

    describe('commerce_data.products', function () {
      it.each([
        ['an object', { sku: 'a' }],
        ['a string', 'sku'],
        ['null', null],
        ['undefined (own property present)', undefined],
      ])('rejects products that is %s', function (_name, products) {
        expect(
          utils.validateCommerceEventParams('purchase', { products }),
        ).toBe(MSG.invalidProductListType);
      });

      it('accepts an empty products array', function () {
        expect(
          utils.validateCommerceEventParams('purchase', { products: [] }),
        ).toBeNull();
      });

      it.each([
        ['a string', 'sku'],
        ['a number', 5],
        ['a boolean', true],
      ])('rejects a product that is %s', function (_name, product) {
        expect(
          utils.validateCommerceEventParams('purchase', {
            products: [{ sku: 'a' }, product],
          }),
        ).toBe(MSG.invalidProductType);
      });

      it('reports the product type error ahead of invalid product keys', function () {
        expect(
          utils.validateCommerceEventParams('purchase', {
            products: [{ foo: 1 }, 'bad'],
          }),
        ).toBe(MSG.invalidProductType);
      });

      it('accepts an array as a product (typeof is "object")', function () {
        expect(
          utils.validateCommerceEventParams('purchase', { products: [[]] }),
        ).toBeNull();
      });

      it('reports index keys of a non-empty array product as invalid keys', function () {
        expect(
          utils.validateCommerceEventParams('purchase', {
            products: [['x']],
          }),
        ).toBe(`${MSG.invalidKeysForProducts}0`);
      });

      it('throws a TypeError for a null product', function () {
        // NOTE: possible bug: typeof null === 'object' passes the product
        // type check, then Object.keys(null) throws instead of returning
        // the invalidProductType message.
        expect(function () {
          utils.validateCommerceEventParams('purchase', { products: [null] });
        }).toThrow(TypeError);
      });

      it('throws a TypeError for an undefined product', function () {
        // NOTE: possible bug: the type check records invalidProductType but
        // execution continues to Object.keys(undefined), which throws before
        // the message can be returned.
        expect(function () {
          utils.validateCommerceEventParams('purchase', {
            products: [{ sku: 'a' }, undefined],
          });
        }).toThrow(TypeError);
      });

      it('collects invalid keys across all products, keeping duplicates', function () {
        expect(
          utils.validateCommerceEventParams('purchase', {
            products: [
              { sku: 'a', foo: 1 },
              { bar: 2, foo: 3 },
            ],
          }),
        ).toBe(`${MSG.invalidKeysForProducts}foo, bar, foo`);
      });

      it('does not allow root-only keys inside a product', function () {
        expect(
          utils.validateCommerceEventParams('purchase', {
            products: [{ sku: 'a', revenue: 1 }],
          }),
        ).toBe(`${MSG.invalidKeysForProducts}revenue`);
      });
    });
  });

  describe('isStandardEvent', function () {
    it.each(STANDARD_EVENTS)('%s is standard', function (name) {
      expect(utils.isStandardEvent(name)).toBe(true);
    });

    it.each([
      'purchase',
      'Purchase',
      'CUSTOM_EVENT',
      'PURCHASE ',
      'VIEW_CONTENT',
    ])('%j is not standard (case-sensitive exact match)', function (name) {
      expect(utils.isStandardEvent(name)).toBe(false);
    });

    it.each([
      ['empty string', ''],
      ['null', null],
      ['undefined', undefined],
      ['0', 0],
    ])('returns the falsy input itself for %s', function (_name, value) {
      expect(utils.isStandardEvent(value)).toBe(value);
    });
  });

  describe('separateEventAndCustomData', function () {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty object', {}],
    ])('returns null for %s', function (_name, value) {
      expect(utils.separateEventAndCustomData(value)).toBeNull();
    });

    it('splits standard event data from custom data and stringifies custom values', function () {
      const input = {
        transaction_id: 'tx-1',
        revenue: 12.5,
        currency: 'USD',
        shipping: 1,
        tax: 2,
        coupon: 'SAVE',
        affiliation: 'store',
        search_query: 'shoes',
        description: 'desc',
        color: 'red',
        count: 3,
        flag: true,
        nested: { a: 1 },
        list: [1, 'b'],
        nothing: null,
      };

      expect(utils.separateEventAndCustomData(input)).toEqual({
        custom_data: {
          color: 'red',
          count: '3',
          flag: 'true',
          nested: '{"a":1}',
          list: '[1,"b"]',
          nothing: 'null',
        },
        event_data: {
          transaction_id: 'tx-1',
          revenue: 12.5,
          currency: 'USD',
          shipping: 1,
          tax: 2,
          coupon: 'SAVE',
          affiliation: 'store',
          search_query: 'shoes',
          description: 'desc',
        },
      });
    });

    it('mutates the input: custom keys are deleted and event_data is the same object', function () {
      const input = { revenue: 1, color: 'red' };
      const result = utils.separateEventAndCustomData(input);
      expect(result.event_data).toBe(input);
      expect(input).toEqual({ revenue: 1 });
    });

    it('does not stringify standard event data values', function () {
      const result = utils.separateEventAndCustomData({ revenue: 1, tax: 2 });
      expect(result).toEqual({
        custom_data: {},
        event_data: { revenue: 1, tax: 2 },
      });
    });

    it('returns an empty event_data object when everything is custom', function () {
      const result = utils.separateEventAndCustomData({ a: 1, b: 'x' });
      expect(result).toEqual({
        custom_data: { a: '1', b: 'x' },
        event_data: {},
      });
    });

    it('treats standard-looking keys case-sensitively', function () {
      const result = utils.separateEventAndCustomData({ Revenue: 5 });
      expect(result).toEqual({
        custom_data: { Revenue: '5' },
        event_data: {},
      });
    });

    it('throws for an undefined custom value', function () {
      // convertValueToString calls value.toString() on undefined.
      expect(function () {
        utils.separateEventAndCustomData({ revenue: 1, missing: undefined });
      }).toThrow(TypeError);
    });
  });
});
