import { config } from '../../src/core/config.js';
import { safejson } from '../../src/core/safejson.js';
import { storage as branchStorage } from '../../src/core/storage.js';
import { utils } from '../../src/core/utils.js';
import { Server } from '../../src/network/api.js';
import { resources } from '../../src/network/resources.js';
import { installFakeXHR } from '../fake-xhr.js';

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id */

describe('Server helpers', function () {
  const server = new Server();
  const assert = testUtils.unplanned();

  it('serializeObject should work', function () {
    // Test simple objects
    assert.strictEqual(
      server.serializeObject({
        a: 'b',
      }),
      'a=b',
    );
    assert.strictEqual(
      server.serializeObject({
        a: 'b',
        c: 'def',
      }),
      'a=b&c=def',
    );
    assert.strictEqual(
      server.serializeObject({
        a: 'b',
        e: 123,
      }),
      'a=b&e=123',
    );
    assert.strictEqual(
      server.serializeObject({
        a: 'fo &)!@# bar',
      }),
      'a=fo%20%26)!%40%23%20bar',
    );

    // Test nested objects
    assert.strictEqual(
      server.serializeObject({
        a: {
          b: 'c',
          d: 'e',
        },
      }),
      'a.b=c&a.d=e',
    );
    assert.strictEqual(
      server.serializeObject({
        a: {
          b: 'c',
          d: {
            e: 'f',
            g: 'h',
          },
        },
      }),
      'a.b=c&a.d.e=f&a.d.g=h',
    );

    // Test arrays
    assert.strictEqual(
      server.serializeObject({
        a: ['b', 'c'],
      }),
      'a=b&a=c',
    );

    // Test arrays in objects
    assert.strictEqual(
      server.serializeObject({
        a: {
          b: ['c', 'd'],
        },
      }),
      'a.b=c&a.b=d',
    );
  });
});

describe('Server', function () {
  const server = new Server();
  const storage = new branchStorage.BranchStorage(['session', 'pojo']);
  let fakeXHR;
  const requests = [];

  // Parses the JSON-encoded validation error that Server#request hands back.
  const errorMessage = function (callback) {
    expect(callback).toHaveBeenCalledTimes(1);
    return safejson.parse(callback.mock.calls[0][0].message).message;
  };

  const respondOk = function (request) {
    request.respond(
      200,
      { 'Content-Type': 'application/json' },
      '{ "session_id": 123 }',
    );
  };

  beforeEach(function () {
    storage.clear();
    // Round-trip timings recorded by earlier requests get attached to /v1/url
    // calls as `instrumentation`; start every test with none.
    utils.instrumentation = {};
    requests.length = 0;
    fakeXHR = installFakeXHR(function (request) {
      requests.push(request);
    });
    vi.useFakeTimers();
    testUtils.captureJsonp(server, requests);
  });

  afterEach(function () {
    fakeXHR.restore();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Resources', function () {
    describe('/v1/open', function () {
      it('should pass in branch_key and browser_fingerprint_id', function () {
        storage.set('use_jsonp', false);
        const callback = vi.fn();
        server.request(resources.open, testUtils.params({}), storage, callback);
        expect(requests.length, 'Request made').toBe(1);
        expect(requests[0].url, 'Endpoint correct').toBe(
          config.api_endpoint + '/v1/open',
        );
        expect(requests[0].method, 'Method correct').toBe('POST');
        expect(requests[0].requestBody, 'Data correct').toBe(
          'browser_fingerprint_id=' +
            browser_fingerprint_id +
            '&identity_id=' +
            identity_id +
            '&sdk=web' +
            config.version +
            '&branch_key=' +
            branch_sample_key +
            '&options=%7B%7D',
        );
        respondOk(requests[0]);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should pass as a jsonp request', function () {
        storage.set('use_jsonp', true);
        const callback = vi.fn();
        const completeParams = testUtils.params({});
        server.request(resources.open, completeParams, storage, callback);
        expect(requests.length, 'Request made').toBe(1);

        const encodedData = encodeURIComponent(
          utils.base64encode(JSON.stringify(completeParams)),
        );
        expect(requests[0].src, 'Endpoint correct').toBe(
          config.api_endpoint +
            '/v1/open?&data=' +
            encodedData +
            '&callback=branch_callback__' +
            (server._jsonp_callback_index - 1),
        );

        requests[0].callback();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should fail without branch_key', function () {
        const callback = vi.fn();
        server.request(
          resources.open,
          testUtils.params({}, ['branch_key']),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /v1/open missing parameter branch_key or app_id',
        );
        expect(requests.length, 'No request made').toBe(0);
      });

      it('should pass without branch_key but with app_id', function () {
        storage.set('use_jsonp', false);
        server.request(
          resources.open,
          testUtils.params({ 'app_id': '5680621892404085' }, ['branch_key']),
          storage,
          vi.fn(),
        );
        expect(requests.length, 'Request made').toBe(1);
        expect(requests[0].requestBody, 'Data correct').toBe(
          'browser_fingerprint_id=' +
            browser_fingerprint_id +
            '&identity_id=' +
            identity_id +
            '&sdk=web' +
            config.version +
            '&app_id=' +
            '5680621892404085' +
            '&options=%7B%7D',
        );
      });

      // param format and type tests
      it('should fail with incorrect branch_key format', function () {
        const callback = vi.fn();
        server.request(
          resources.open,
          testUtils.params({ 'branch_key': 'ahd&7393j' }),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /v1/open missing parameter branch_key or app_id',
        );
        expect(requests.length, 'No request made').toBe(0);
      });

      it('should fail with link_identifier as number, not string', function () {
        const callback = vi.fn();
        server.request(
          resources.open,
          testUtils.params({ 'link_identifier': 45433 }),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /v1/open, parameter link_identifier is not a string',
        );
        expect(requests.length, 'No request made').toBe(0);
      });

      it('should include developer identity', function () {
        storage.set('use_jsonp', false);
        const callback = vi.fn();
        server.request(
          resources.open,
          testUtils.params({ identity: '12345678' }),
          storage,
          callback,
        );
        expect(requests[0].requestBody, 'Includes identity').toContain(
          '&identity=12345678&',
        );
        respondOk(requests[0]);
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    describe('/_r', function () {
      it('should pass in sdk', function () {
        const callback = vi.fn();
        server.request(resources._r, testUtils.params(), storage, callback);
        expect(requests.length, 'Request made').toBe(1);
        expect(requests[0].src, 'Endpoint correct').toBe(
          config.app_service_endpoint +
            '/_r?sdk=web' +
            config.version +
            '&_t=79336952217731267' +
            '&branch_key=' +
            branch_sample_key +
            '&callback=branch_callback__' +
            (server._jsonp_callback_index - 1),
        );
        requests[0].callback();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should fail without sdk', function () {
        const callback = vi.fn();
        server.request(
          resources._r,
          testUtils.params({}, ['sdk']),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /_r missing parameter sdk',
        );
        expect(requests.length, 'No request made').toBe(0);
      });
    });

    describe('/v1/link', function () {
      it('should pass in branch_key and identity_id', function () {
        storage.set('use_jsonp', false);
        const callback = vi.fn();
        server.request(resources.link, testUtils.params(), storage, callback);

        expect(requests.length, 'Request made').toBe(1);
        expect(requests[0].url, 'Endpoint correct').toBe(
          config.api_endpoint + '/v1/url',
        );
        expect(requests[0].method, 'Method correct').toBe('POST');
        expect(requests[0].requestBody).toBe(
          'identity_id=' +
            identity_id +
            '&browser_fingerprint_id=' +
            browser_fingerprint_id +
            '&sdk=web' +
            config.version +
            '&session_id=' +
            session_id +
            '&branch_key=' +
            branch_sample_key,
        );

        respondOk(requests[0]);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should pass as a jsonp request', function () {
        storage.set('use_jsonp', true);
        const callback = vi.fn();
        server.request(resources.link, testUtils.params(), storage, callback);
        expect(requests.length, 'Request made').toBe(1);
        const encodedData = encodeURIComponent(
          utils.base64encode(JSON.stringify(testUtils.params())),
        );
        expect(requests[0].src, 'Endpoint correct').toBe(
          config.api_endpoint +
            '/v1/url?&data=' +
            encodedData +
            '&callback=branch_callback__' +
            (server._jsonp_callback_index - 1),
        );
        requests[0].callback();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should fail without branch_key', function () {
        const callback = vi.fn();
        server.request(
          resources.link,
          testUtils.params({}, ['branch_key']),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /v1/url missing parameter branch_key or app_id',
        );
        expect(requests.length, 'No request made').toBe(0);
      });

      it('should fail without identity_id', function () {
        const callback = vi.fn();
        server.request(
          resources.link,
          testUtils.params({}, ['identity_id']),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /v1/url missing parameter identity_id',
        );
        expect(requests.length, 'No request made').toBe(0);
      });

      // param format and type tests
      it('should fail with tags as string, not array', function () {
        const callback = vi.fn();
        server.request(
          resources.link,
          testUtils.params({ 'tags': "Hello, I'm not an array." }),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request /v1/url, parameter tags is not an array',
        );
        expect(requests.length, 'No request made').toBe(0);
      });
    });

    describe('/l', function () {
      it('should pass in link_url and click', function () {
        storage.set('use_jsonp', false);
        const callback = vi.fn();
        server.request(
          resources.linkClick,
          testUtils.params({ 'link_url': '3hpH54U-58', 'click': 'click' }),
          storage,
          callback,
        );

        expect(requests.length, 'Request made').toBe(1);
        expect(requests[0].url, 'Endpoint correct').toBe(
          '3hpH54U-58?click=click',
        );
        expect(requests[0].method, 'Method correct').toBe('GET');

        respondOk(requests[0]);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should pass as a jsonp request', function () {
        storage.set('use_jsonp', true);
        const callback = vi.fn();
        server.request(
          resources.linkClick,
          testUtils.params({ 'link_url': '3hpH54U-58', 'click': 'click' }),
          storage,
          callback,
        );
        expect(requests.length, 'Request made').toBe(1);
        expect(requests[0].src, 'Endpoint correct').toBe(
          '3hpH54U-58?click=click&callback=branch_callback__' +
            (server._jsonp_callback_index - 1),
        );
        requests[0].callback();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeNull();
      });

      it('should fail without link_url', function () {
        const callback = vi.fn();
        server.request(
          resources.linkClick,
          testUtils.params({ 'click': 'click' }),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request  missing parameter link_url',
        );
        expect(requests.length, 'No request made').toBe(0);
      });

      it('should fail without click', function () {
        const callback = vi.fn();
        server.request(
          resources.linkClick,
          testUtils.params({ 'link_url': '3hpH54U-58' }),
          storage,
          callback,
        );
        expect(errorMessage(callback)).toBe(
          'API request  missing parameter click',
        );
        expect(requests.length, 'No request made').toBe(0);
      });
    });

    describe('API tests for trackingDisabled mode', function () {
      let trackingDisabled;
      let allowErrorsInCallback;

      beforeEach(function () {
        trackingDisabled = utils.userPreferences.trackingDisabled;
        allowErrorsInCallback = utils.userPreferences.allowErrorsInCallback;
      });

      afterEach(function () {
        utils.userPreferences.trackingDisabled = trackingDisabled;
        utils.userPreferences.allowErrorsInCallback = allowErrorsInCallback;
        localStorage.removeItem('branch_session');
      });

      it('Tests a v1/open request, includes correct data, tracking disabled and error callback enabled :: request should go through', function () {
        // This simulates a call to v1/open as part of the Branch initialization process
        utils.userPreferences.trackingDisabled = true;
        utils.userPreferences.allowErrorsInCallback = false;
        localStorage.setItem('branch_session', {});
        server.request(
          resources.open,
          testUtils.params({
            'link_identifier': '1111111111',
          }),
          storage,
          vi.fn(),
        );
        expect(requests.length, 'Request made').toBe(1);
      });
    });
  });

  describe('XHR failures', function () {
    beforeEach(function () {
      storage.set('use_jsonp', false);
      vi.spyOn(console, 'log').mockImplementation(function () {});
    });

    it('retries a timeout utils.retries times, then returns a timeout error', function () {
      const callback = vi.fn();
      let attempt;
      server.request(resources.open, testUtils.params({}), storage, callback);

      for (attempt = 0; attempt < utils.retries; attempt++) {
        requests[attempt].triggerTimeout();
        expect(callback).not.toHaveBeenCalled();
        vi.advanceTimersByTime(utils.retry_delay);
      }
      expect(requests.length).toBe(utils.retries + 1);

      requests[utils.retries].triggerTimeout();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].message).toBe(utils.messages.timeout);
    });

    it('returns a network error without retrying', function () {
      const callback = vi.fn();
      server.request(resources.open, testUtils.params({}), storage, callback);

      requests[0].error();
      vi.advanceTimersByTime(utils.retry_delay * 10);

      expect(requests.length).toBe(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].message).toBe(
        'Error in API: URL - Unknown, Status - No status available, Response - No response text available',
      );
    });
  });

  describe('/v1/qr-code', function () {
    beforeEach(function () {
      storage.set('use_jsonp', false);
    });

    it('requests an arraybuffer and returns it unparsed', function () {
      const callback = vi.fn();
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      server.request(resources.qrCode, testUtils.params({}), storage, callback);

      expect(requests[0].url).toBe(config.api_endpoint + '/v1/qr-code');
      expect(requests[0].responseType).toBe('arraybuffer');
      requests[0].respond(200, {}, png);

      expect(callback).toHaveBeenCalledWith(null, png);
    });

    it('returns an error for a 4xx response without reading responseText', function () {
      vi.spyOn(console, 'log').mockImplementation(function () {});
      const callback = vi.fn();
      server.request(resources.qrCode, testUtils.params({}), storage, callback);

      requests[0].respond(400, {}, new ArrayBuffer(0));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].message).toBe(
        'Error in API: URL - ' +
          config.api_endpoint +
          '/v1/qr-code, Status - 400, Response - No response text available',
      );
    });

    it('retries a 5xx response, then returns an error', function () {
      let i;
      vi.spyOn(console, 'log').mockImplementation(function () {});
      const callback = vi.fn();
      server.request(resources.qrCode, testUtils.params({}), storage, callback);

      for (i = 0; i <= utils.retries; i++) {
        requests[i].respond(503, {}, new ArrayBuffer(0));
        vi.advanceTimersByTime(utils.retry_delay);
      }

      expect(requests.length).toBe(utils.retries + 1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].message).toContain('Status - 503');
    });
  });

  describe('onAPIResponse', function () {
    afterEach(function () {
      delete server.onAPIResponse;
    });

    it('receives all relevant fields from an XHR request if present', function () {
      storage.set('use_jsonp', false);

      const params = testUtils.params({
        'link_identifier': '1111111111',
      });
      server.onAPIResponse = vi.fn();

      server.request(resources.open, params, storage, function () {});

      respondOk(requests[0]);

      expect(server.onAPIResponse).toHaveBeenCalledTimes(1);
      const args = server.onAPIResponse.mock.calls[0];
      const url = args[0];
      const method = args[1];
      const requestBody = args[2];
      expect(url).toBe(resources.open.destination + resources.open.endpoint);
      expect(method).toBe(resources.open.method);
      // Use regexp to avoid details of different browsers.
      expect(requestBody).toMatch(/link_identifier=1111111111/);
      expect(args[3], 'error').toBeNull();
      expect(args[4], 'status').toBe(200);
      expect(args[5], 'correct response').toEqual({ 'session_id': 123 });
    });
  });
});
