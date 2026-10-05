import { Branch } from '../../src/branch/branch.js';
import { config } from '../../src/core/config.js';
import { safejson } from '../../src/core/safejson.js';
import { getEnv } from '../../src/env/env.js';
import { branch_view } from '../../src/journeys/branch-view.js';
import { journeys_utils } from '../../src/journeys/journeys-utils.js';
import { merge } from '../../src/lib/objects.js';

// Characterization tests for branch.track, branch.logEvent and
// branch.trackCommerceEvent. The network layer is stubbed at
// Server#request, so these assert exactly what reaches the API layer.

const FAKE_KEY = 'key_live_xxx';
const BFP_ID = '79336952217731267';
const SESSION_ID = '98807509250212101';
const IDENTITY_ID = '98807509250212102';

describe('Branch events', function () {
  const requests = [];
  let savedJourneysBranch;

  beforeEach(function () {
    localStorage.clear();
    sessionStorage.clear();
    requests.length = 0;
    savedJourneysBranch = journeys_utils.branch;
  });

  afterEach(function () {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    journeys_utils.branch = savedJourneysBranch;
  });

  // Returns a Branch whose server requests are captured into `requests`.
  // mode: 'none' (init never called), 'pending', 'failed' or 'ok'.
  function makeBranch(mode) {
    requests.length = 0;
    localStorage.clear();
    sessionStorage.clear();
    const branch = new Branch();
    testUtils.captureRequests(branch._server, requests);
    if (mode === 'none') {
      return branch;
    }
    branch.init(FAKE_KEY);
    if (mode === 'pending') {
      return branch;
    }
    requests[0].callback(null, BFP_ID);
    if (mode === 'failed') {
      requests[1].callback(new Error('open failed'));
      requests.length = 0;
      return branch;
    }
    requests[1].callback(null, {
      browser_fingerprint_id: BFP_ID,
      identity_id: IDENTITY_ID,
      session_id: SESSION_ID,
    });
    requests[2].callback(null, {});
    requests.length = 0;
    return branch;
  }

  function expectedUserData(extra) {
    return merge(
      {
        http_origin: document.URL,
        user_agent: navigator.userAgent,
        language: getEnv().browserLanguageCode(),
        screen_width: getEnv().screenWidth(),
        screen_height: getEnv().screenHeight(),
        http_referrer: document.referrer,
        browser_fingerprint_id: BFP_ID,
        sdk: 'web',
        sdk_version: config.version,
      },
      extra || {},
    );
  }

  describe('init state guard (wrap)', function () {
    const calls = {
      track: ['pageview'],
      logEvent: ['PURCHASE'],
      trackCommerceEvent: ['purchase', { revenue: 1 }],
    };
    Object.keys(calls).forEach(function (method) {
      it(`${method} errors with nonInit when init was never called`, function () {
        const branch = makeBranch('none');
        const cb = vi.fn();
        branch[method](...calls[method], cb);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0].message).toBe('Branch SDK not initialized');
        expect(requests).toHaveLength(0);
      });

      it(`${method} errors with initFailed after init failed`, function () {
        const branch = makeBranch('failed');
        const cb = vi.fn();
        branch[method](...calls[method], cb);
        expect(cb).toHaveBeenCalledTimes(1);
        // NOTE: possible bug: wrap() passes init_state_fail_code as the
        // `params` argument of formatMessage and the fail details as the
        // failCode, so the code is lost and details are labelled "Failure Code".
        expect(cb.mock.calls[0][0].message).toBe(
          'Branch SDK initialization failed, so further methods cannot be called' +
            '\n Failure Code:open failed',
        );
        expect(requests).toHaveLength(0);
      });
    });

    it('queues behind a pending init and runs once init succeeds', function () {
      const branch = makeBranch('pending');
      const cb = vi.fn();
      branch.logEvent('PURCHASE', cb);
      expect(cb).not.toHaveBeenCalled();
      requests[0].callback(null, BFP_ID);
      requests[1].callback(null, {
        browser_fingerprint_id: BFP_ID,
        identity_id: IDENTITY_ID,
        session_id: SESSION_ID,
      });
      const eventRequest = requests.find(function (r) {
        return r.resource.endpoint === '/v2/event/standard';
      });
      expect(eventRequest).toBeDefined();
      eventRequest.callback(null, {});
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('does not throw without a callback when init was never called', function () {
      const branch = makeBranch('none');
      expect(function () {
        branch.logEvent('PURCHASE');
      }).not.toThrow();
    });
  });

  describe('track', function () {
    it('warns and makes no request for non-pageview events', function () {
      const warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.track('signup', { a: 1 }, cb);
      expect(warn).toHaveBeenCalledWith(
        'track method currently supports only pageview event.',
      );
      expect(requests).toHaveLength(0);
      // NOTE: possible bug: for non-pageview events `done` is never called, so
      // the callback never fires and the branch task queue stalls.
      expect(cb).not.toHaveBeenCalled();
      const next = vi.fn();
      branch.logEvent('PURCHASE', next);
      expect(requests).toHaveLength(0);
      expect(next).not.toHaveBeenCalled();
    });

    it('sends a /v1/pageview request with merged metadata', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.track('pageview', { foo: 'bar' }, cb);
      expect(requests).toHaveLength(1);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v1/pageview');
      expect(req.obj.event).toBe('pageview');
      expect(req.obj.branch_key).toBe(FAKE_KEY);
      expect(req.obj.session_id).toBe(SESSION_ID);
      expect(req.obj.identity_id).toBe(IDENTITY_ID);
      expect(req.obj.browser_fingerprint_id).toBe(BFP_ID);
      expect(req.obj.sdk).toBe(`web${config.version}`);
      expect(req.obj.feature).toBe('journeys');
      expect(req.obj.metadata.foo).toBe('bar');
      expect(req.obj.metadata.hosted_deeplink_data).toEqual({ foo: 'bar' });
      expect(req.obj.metadata.url).toBe(document.URL);
      expect(req.obj).not.toHaveProperty('tracking_disabled');
      expect(req.obj.branch_dma_data).toBeNull();
      expect(cb).not.toHaveBeenCalled();
      req.callback(null, {});
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('sends no hosted_deeplink_data when metadata is empty and the page has none', function () {
      const branch = makeBranch('ok');
      branch.track('pageview');
      expect(requests).toHaveLength(1);
      expect(requests[0].obj.metadata).not.toHaveProperty(
        'hosted_deeplink_data',
      );
    });

    it('forwards the error from the API to the callback', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      const err = new Error('boom');
      branch.track('pageview', {}, cb);
      requests[0].callback(err);
      expect(cb).toHaveBeenCalledWith(err);
    });

    it('passes the full API response arguments through to the callback', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.track('pageview', {}, cb);
      requests[0].callback(null, 'not-an-object');
      // CALLBACK_ERR wrap only forwards the error.
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('sets ctx.nonce from options.nonce and keeps it otherwise', function () {
      const branch = makeBranch('ok');
      branch._ctx.nonce = 'before';
      branch.track('pageview', {}, { nonce: 'abc123' });
      expect(branch._ctx.nonce).toBe('abc123');
      branch.track('pageview', {}, {});
      expect(branch._ctx.nonce).toBe('abc123');
    });

    it('includes options.branch_view_id and no_journeys in the request', function () {
      const branch = makeBranch('ok');
      branch.track(
        'pageview',
        {},
        { branch_view_id: 'bv1', no_journeys: true },
      );
      expect(requests[0].obj.branch_view_id).toBe('bv1');
      expect(requests[0].obj.no_journeys).toBe(true);
    });

    it('adds tracking_disabled when tracking is disabled', function () {
      const branch = makeBranch('ok');
      branch._ctx.userPreferences.trackingDisabled = true;
      branch.track('pageview');
      expect(requests[0].obj.tracking_disabled).toBe(true);
    });

    it('adds stored DMA data to the pageview request', function () {
      const branch = makeBranch('ok');
      branch.setDMAParamsForEEA(true, false, true);
      branch.track('pageview');
      expect(requests[0].obj.branch_dma_data).toEqual({
        eeaRegion: true,
        adPersonalizationConsent: false,
        adUserDataUsageConsent: true,
      });
    });

    it('publishes willNotShowJourney when the response has no journey', function () {
      const branch = makeBranch('ok');
      const listener = vi.fn();
      branch.addListener(listener);
      const display = vi
        .spyOn(branch_view, 'displayJourney')
        .mockImplementation(function () {});
      const cb = vi.fn();
      branch.track('pageview', {}, cb);
      requests[0].callback(null, {});
      expect(display).not.toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith('willNotShowJourney', undefined);
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('does not publish willNotShowJourney when the request errors', function () {
      const branch = makeBranch('ok');
      const listener = vi.fn();
      branch.addListener(listener);
      branch.track('pageview');
      requests[0].callback(new Error('x'));
      expect(listener).not.toHaveBeenCalledWith(
        'willNotShowJourney',
        undefined,
      );
    });

    it('displays the journey using the id from the response', function () {
      const branch = makeBranch('ok');
      vi.spyOn(branch_view, 'shouldDisplayJourney').mockReturnValue(true);
      const display = vi
        .spyOn(branch_view, 'displayJourney')
        .mockImplementation(function () {});
      const response = {
        template: '<div>journey</div>',
        event_data: { branch_view_data: { id: 'resp_id' } },
        journey_link_data: { journey_id: 'j1' },
        use_v2_renderer: true,
        animationConfig: { a: 1 },
      };
      const cb = vi.fn();
      branch.track('pageview', {}, cb);
      const requestData = requests[0].obj;
      requests[0].callback(null, response);
      expect(branch_view.shouldDisplayJourney).toHaveBeenCalledWith(
        response,
        {},
        false,
      );
      expect(display).toHaveBeenCalledWith(
        '<div>journey</div>',
        requestData,
        'resp_id',
        { id: 'resp_id' },
        false,
        { journey_id: 'j1' },
        { use_v2_renderer: true, animationConfig: { a: 1 } },
      );
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('displays the journey in test mode when branch_view_id is given', function () {
      const branch = makeBranch('ok');
      vi.spyOn(branch_view, 'shouldDisplayJourney').mockReturnValue(true);
      const display = vi
        .spyOn(branch_view, 'displayJourney')
        .mockImplementation(function () {});
      const options = { branch_view_id: 'test_bv' };
      branch.track('pageview', {}, options);
      requests[0].callback(null, {
        template: 't',
        event_data: { branch_view_data: { id: 'resp_id' } },
      });
      expect(branch_view.shouldDisplayJourney).toHaveBeenCalledWith(
        expect.any(Object),
        options,
        true,
      );
      expect(display.mock.calls[0][2]).toBe('test_bv');
      expect(display.mock.calls[0][4]).toBe(true);
    });
  });

  describe('logEvent', function () {
    it('sends standard events to /v2/event/standard with split data', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      const eventData = {
        transaction_id: 'tx1',
        revenue: 10.5,
        currency: 'USD',
        custom_key: 42,
        other: { nested: true },
      };
      const items = [{ $sku: 'sku1' }];
      branch.logEvent('PURCHASE', eventData, items, 'alias', cb);
      expect(requests).toHaveLength(1);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v2/event/standard');
      expect(req.obj.name).toBe('PURCHASE');
      expect(req.obj.branch_key).toBe(FAKE_KEY);
      expect(req.obj.customer_event_alias).toBe('alias');
      expect(safejson.parse(req.obj.user_data)).toEqual(expectedUserData());
      expect(safejson.parse(req.obj.event_data)).toEqual({
        transaction_id: 'tx1',
        revenue: 10.5,
        currency: 'USD',
      });
      // Custom data values are stringified.
      expect(safejson.parse(req.obj.custom_data)).toEqual({
        custom_key: '42',
        other: '{"nested":true}',
      });
      expect(safejson.parse(req.obj.content_items)).toEqual(items);
      // NOTE: possible bug: logEvent mutates the caller's eventData object,
      // deleting the custom-data keys from it.
      expect(eventData).toEqual({
        transaction_id: 'tx1',
        revenue: 10.5,
        currency: 'USD',
      });
      // v2 endpoints get none of the v1 session params.
      expect(req.obj).not.toHaveProperty('session_id');
      expect(req.obj).not.toHaveProperty('identity_id');
      expect(req.obj).not.toHaveProperty('sdk');
      expect(cb).not.toHaveBeenCalled();
      req.callback(null, { ok: true });
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('sends custom events to /v2/event/custom', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.logEvent('my_custom_event', { color: 'red' }, cb);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v2/event/custom');
      expect(req.obj.name).toBe('my_custom_event');
      expect(safejson.parse(req.obj.custom_data)).toEqual({ color: 'red' });
      expect(safejson.parse(req.obj.event_data)).toEqual({});
      expect(safejson.parse(req.obj.content_items)).toEqual([]);
      expect(req.obj.customer_event_alias).toBeNull();
      req.callback(null, {});
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('treats standard event names case-sensitively', function () {
      const branch = makeBranch('ok');
      branch.logEvent('purchase');
      expect(requests[0].resource.endpoint).toBe('/v2/event/custom');
    });

    it('passes content items through unvalidated for custom events', function () {
      const branch = makeBranch('ok');
      branch.logEvent('custom', {}, { not: 'an array' });
      expect(safejson.parse(requests[0].obj.content_items)).toEqual({
        not: 'an array',
      });
    });

    it('drops non-array content items for standard events', function () {
      const branch = makeBranch('ok');
      branch.logEvent('PURCHASE', {}, { not: 'an array' });
      expect(safejson.parse(requests[0].obj.content_items)).toEqual([]);
    });

    it('nulls invalid name, event data and alias', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.logEvent(123, 'not-an-object', 'not-an-array', 99, cb);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v2/event/custom');
      expect(req.obj.name).toBeNull();
      expect(req.obj.customer_event_alias).toBeNull();
      expect(safejson.parse(req.obj.custom_data)).toEqual({});
      expect(safejson.parse(req.obj.event_data)).toEqual({});
      req.callback(null, {});
      expect(cb).toHaveBeenCalledWith(null);
    });

    it('logs a standard event with only a name and callback', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.logEvent('VIEW_ITEM', cb);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v2/event/standard');
      expect(safejson.parse(req.obj.custom_data)).toEqual({});
      expect(safejson.parse(req.obj.event_data)).toEqual({});
      expect(safejson.parse(req.obj.content_items)).toEqual([]);
      expect(req.obj.customer_event_alias).toBeNull();
    });

    it('forwards API errors to the callback for standard and custom events', function () {
      const branch = makeBranch('ok');
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const err1 = new Error('standard failed');
      const err2 = new Error('custom failed');
      branch.logEvent('PURCHASE', {}, cb1);
      requests[0].callback(err1);
      branch.logEvent('custom', {}, cb2);
      requests[1].callback(err2);
      expect(cb1).toHaveBeenCalledWith(err1);
      expect(cb2).toHaveBeenCalledWith(err2);
    });

    it('includes the developer identity in user_data after setIdentity', function () {
      const branch = makeBranch('ok');
      branch.setIdentity('user@example.com');
      branch.logEvent('PURCHASE');
      expect(safejson.parse(requests[0].obj.user_data)).toEqual(
        expectedUserData({
          developer_identity: 'user@example.com',
          identity: 'user@example.com',
        }),
      );
    });

    it('adds tracking_disabled when tracking is disabled', function () {
      const branch = makeBranch('ok');
      branch._ctx.userPreferences.trackingDisabled = true;
      branch.logEvent('PURCHASE');
      // The queue only advances once the pending request completes.
      requests[0].callback(null, {});
      branch.logEvent('custom');
      expect(requests[0].obj.tracking_disabled).toBe(true);
      expect(requests[1].obj.tracking_disabled).toBe(true);
    });

    it('adds branch_dma_data (null when unset) to v2 event requests', function () {
      const branch = makeBranch('ok');
      branch.logEvent('PURCHASE');
      expect(requests[0].obj).toHaveProperty('branch_dma_data', null);
      requests[0].callback(null, {});
      branch.setDMAParamsForEEA(false, true, false);
      branch.logEvent('PURCHASE');
      requests[1].callback(null, {});
      branch.logEvent('custom');
      const dma = {
        eeaRegion: false,
        adPersonalizationConsent: true,
        adUserDataUsageConsent: false,
      };
      expect(requests[1].obj.branch_dma_data).toEqual(dma);
      expect(requests[2].obj.branch_dma_data).toEqual(dma);
    });

    it('adds request metadata set via setRequestMetaData', function () {
      const branch = makeBranch('ok');
      branch.setRequestMetaData('$marketing_cloud_visitor_id', 'mcid');
      branch.logEvent('PURCHASE');
      expect(requests[0].obj.branch_requestMetadata).toEqual({
        $marketing_cloud_visitor_id: 'mcid',
      });
    });
  });

  describe('trackCommerceEvent', function () {
    const commerceData = {
      revenue: 50,
      currency: 'USD',
      products: [{ sku: 'sku1', price: 50, quantity: 1 }],
    };

    function expectValidationError(event, data, message) {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.trackCommerceEvent(event, data, {}, cb);
      // NOTE: possible bug: trackCommerceEvent calls done() synchronously
      // after queueing the render task, so the callback fires first with
      // `undefined` and then again with the validation error.
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb.mock.calls[0][0]).toBeUndefined();
      expect(cb.mock.calls[1][0]).toBeInstanceOf(Error);
      expect(cb.mock.calls[1][0].message).toBe(message);
      expect(requests).toHaveLength(0);
    }

    it('rejects a missing or non-purchase event name', function () {
      const msg =
        "event name is either missing, of the wrong type or not valid. Please specify 'purchase' as the event name.";
      expectValidationError(undefined, commerceData, msg);
      expectValidationError('refund', commerceData, msg);
      expectValidationError(5, commerceData, msg);
    });

    it('rejects missing or empty commerce data', function () {
      const msg =
        'commerce_data is either missing, of the wrong type or empty. Please ensure that commerce_data is constructed correctly.';
      expectValidationError('purchase', undefined, msg);
      expectValidationError('purchase', {}, msg);
      expectValidationError('purchase', 'str', msg);
    });

    it('rejects unknown keys in commerce data', function () {
      expectValidationError(
        'purchase',
        { revenue: 1, bogus: 1 },
        'Please remove the following keys from the root of commerce_data: bogus',
      );
    });

    it('throws for valid input because resources.commerceEvent does not exist', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      // NOTE: possible bug: resources.commerceEvent is undefined, so a valid
      // commerce event crashes inside _api (reading `params` of undefined)
      // and no request is ever sent.
      expect(function () {
        branch.trackCommerceEvent('PURCHASE', commerceData, { m: 1 }, cb);
      }).toThrow(TypeError);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toBeUndefined();
      expect(requests).toHaveLength(0);
    });

    it('defers validation until rendering is finalized', function () {
      const branch = makeBranch('pending');
      requests[0].callback(null, BFP_ID);
      const cb = vi.fn();
      // Queued behind init; rendering not finalized yet when it runs below.
      branch.trackCommerceEvent('refund', commerceData, cb);
      expect(cb).not.toHaveBeenCalled();
      requests[1].callback(null, {
        browser_fingerprint_id: BFP_ID,
        identity_id: IDENTITY_ID,
        session_id: SESSION_ID,
      });
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb.mock.calls[0][0]).toBeUndefined();
      expect(cb.mock.calls[1][0]).toBeInstanceOf(Error);
    });
  });
});
