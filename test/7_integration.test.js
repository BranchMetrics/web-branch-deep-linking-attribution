import { config } from '../src/0_config.js';
import { branch_instance as branch } from '../src/7_initialization.js';
import { installFakeXHR } from './fake-xhr.js';

/*globals identity_id, browser_fingerprint_id, device_fingerprint_id */

describe('Integration tests', function () {
  const requests = [];
  let fakeXHR;
  let jsonpCallback = 0;

  const clearBranchStorage = function () {
    sessionStorage.clear();
    localStorage.clear();
    branch._storage.clear();
  };

  beforeAll(function () {
    fakeXHR = installFakeXHR(function (request) {
      requests.push(request);
    });
    vi.useFakeTimers();
    testUtils.captureJsonp(branch._server, requests);
  });

  beforeEach(function () {
    clearBranchStorage();
    testUtils.go('');
    branch.branch_key = 'branch_sample_key';
    branch.identity = 'foo';
    branch.identity_id = identity_id.toString();
    branch.device_fingerprint_id = identity_id.toString();
  });

  afterEach(function () {
    jsonpCallback++;
    requests.length = 0;
  });

  afterAll(function () {
    vi.restoreAllMocks();
    fakeXHR.restore();
    vi.useRealTimers();
  });

  const sampleParams = {
    tags: ['tag1', 'tag2'],
    channel: 'sample app',
    feature: 'create link',
    stage: 'created link',
    type: 1,
    data: {
      mydata: 'bar',
      '$desktop_url': 'https://cdn.branch.io/example.html',
      '$og_title': 'Branch Metrics',
      '$og_description': 'Branch Metrics',
      '$og_image_url': 'http://branch.io/img/logo_icon_white.png',
    },
  };

  const indexOfLastInitRequest = function (requestsAfterInit) {
    return requestsAfterInit + 1;
  };

  const branchInit = function (checkRequests, callback) {
    branch.init.apply(branch, [device_fingerprint_id, callback]);
    if (checkRequests) {
      expect(requests.length, 'Exactly one request was made').toBe(1);
      expect(requests[0].src, 'The first request has the right .src').toBe(
        config.app_service_endpoint +
          '/_r?sdk=web' +
          config.version +
          '&branch_key=' +
          branch.branch_key +
          '&callback=branch_callback__' +
          jsonpCallback.toString(),
      );
    }

    // _r
    requests[0].callback(browser_fingerprint_id);
    // v1/open
    requests[1].respond(
      200,
      { 'Content-Type': 'application/json' },
      // identity_id is quoted, as the API returns it: as a bare number it
      // exceeds Number.MAX_SAFE_INTEGER and loses precision when parsed.
      '{ "identity_id":"' +
        identity_id +
        '", "session_id":"123088518049178533", "device_fingerprint_id":null, ' +
        '"browser_fingerprint_id":"79336952217731267", ' +
        '"link":"https://bnc.lt/i/4LYQTXE0_k", "identity":"Branch","has_app":true }',
    );
    // v1/pageview
    requests[2].respond(
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        branch_view_enabled: false,
      }),
    );

    if (checkRequests) {
      expect(requests.length, 'Exactly three requests were made').toBe(3);

      const params = requests[1].requestBody.split('&');
      const requestObj = params.reduce(function (a, b) {
        const pair = b.split('=');
        a[pair[0]] = pair[1];
        return a;
      }, {});

      // identity_id is omitted: init reloads it from storage, which is empty on
      // a fresh install.
      const expectedObj = {
        app_id: browser_fingerprint_id,
        browser_fingerprint_id: browser_fingerprint_id,
        identity: 'foo',
        options: '%7B%7D',
        sdk: 'web' + config.version,
        current_url: encodeURIComponent(window.location.href),
        screen_height: String(screen.height || 0),
        screen_width: String(screen.width || 0),
      };

      if (requestObj.initial_referrer) {
        expectedObj.initial_referrer = requestObj.initial_referrer;
      }

      expect(
        requestObj,
        'The second request has the right .requestBody',
      ).toEqual(expectedObj);
    }
  };

  describe('init', function () {
    it('should call api with params and version', function () {
      const callback = vi.fn();
      branchInit(true, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][1], 'Expected response returned').toEqual({
        data: '',
        data_parsed: {},
        has_app: true,
        identity: 'Branch',
        developer_identity: 'Branch',
        referring_identity: null,
        referring_link: null,
      });
    });

    it('should support being called without a callback', function () {
      branchInit(true);
    });

    it('should return error to callback', function () {
      const callback = vi.fn();
      branch.init(browser_fingerprint_id, callback);
      requests[0].callback(browser_fingerprint_id);
      requests[1].respond(400);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        callback.mock.calls[0][0].message,
        'Expect 400 error message',
      ).toBe(
        'Error in API: URL - ' +
          config.api_endpoint +
          '/v1/open, Status - 400, Response - No response text available',
      );
    });

    it('should attempt 5xx error three times total', function () {
      const callback = vi.fn();
      branch.init(browser_fingerprint_id, callback);
      let requestCount = 0;
      requests[requestCount].callback(browser_fingerprint_id);
      requestCount++;
      requests[requestCount].respond(500);
      vi.advanceTimersByTime(250);
      requestCount++;
      requests[requestCount].respond(500);
      vi.advanceTimersByTime(250);
      requestCount++;
      requests[requestCount].respond(500);
      expect(requests.length, '/_r plus three /v1/open attempts').toBe(4);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        callback.mock.calls[0][0].message,
        'Expect 500 error message',
      ).toBe(
        'Error in API: URL - ' +
          config.api_endpoint +
          '/v1/open, Status - 500, Response - No response text available',
      );
    });

    it('should store in session and call open with link_identifier from hash', function () {
      expect(testUtils.go('#r:12345')).toBe(true);
      branchInit();
      expect(
        requests[indexOfLastInitRequest(0)].requestBody,
        'Expect link_identifier=12345',
      ).toContain('link_identifier=12345');
    });
  });

  describe('setIdentity', function () {
    it('set identity after init without a request, and return expected data', function () {
      branchInit();
      const callback = vi.fn();
      branch.setIdentity('identity', callback);
      expect(requests.length, 'Expect requests length').toBe(
        indexOfLastInitRequest(2),
      );
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][1], 'Expected response returned').toEqual({
        identity_id: identity_id,
        session_id: '123088518049178533',
        link: 'https://bnc.lt/i/4LYQTXE0_k',
        developer_identity: 'identity',
      });
    });
  });

  describe('data', function () {
    it('should make two requests and return session data', function () {
      branchInit(true);
      const callback = vi.fn();
      branch.data(callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        callback.mock.calls[0][1],
        'Expect data in branch.data callback',
      ).toEqual({
        data: '',
        data_parsed: {},
        has_app: true,
        identity: 'Branch',
        developer_identity: 'Branch',
        referring_identity: null,
        referring_link: null,
      });
      expect(requests.length).toBe(indexOfLastInitRequest(2));
    });
  });

  describe('getBrowserFingerprintId', function () {
    it('it should return browser-fingerprint-id with value 79336952217731267', function () {
      branchInit(true);
      const callback = vi.fn();
      branch.getBrowserFingerprintId(callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        callback.mock.calls[0][1],
        'expected browser-fingerprint-id returned correctly (79336952217731267)',
      ).toBe('79336952217731267');
    });

    it('with tracking disabled, it should return browser-fingerprint-id with value null', function () {
      branchInit(true);
      branch.disableTracking();
      const callback = vi.fn();
      branch.getBrowserFingerprintId(callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        callback.mock.calls[0][1],
        'expected browser-fingerprint-id returned correctly (null)',
      ).toBeNull();
    });
  });

  describe('link', function () {
    it('should make three requests and return short link', function () {
      branchInit(true);
      const callback = vi.fn();
      branch.link(sampleParams, callback);
      expect(requests.length, 'Expect requests length').toBe(
        indexOfLastInitRequest(3),
      );
      requests[indexOfLastInitRequest(2)].respond(
        200,
        { 'Content-Type': 'application/json' },
        '{ "url":"https://bnc.lt/l/4manXlk0AJ" }',
      );
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        callback.mock.calls[0][1],
        'Expect data in branch.link callback',
      ).toBe(config.link_service_endpoint + '/l/4manXlk0AJ');
    });
  });
});
