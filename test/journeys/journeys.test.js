import { Branch } from '../../src/branch.js';
import { setEnv } from '../../src/env/env.js';
import { makeFakeEnv, UA_FOR_PLATFORM } from '../helpers/fake-env.js';

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id */

describe('Branch', function () {
  const requests = [];

  beforeEach(function () {
    testUtils.go('');
    localStorage.clear();
    sessionStorage.clear();
    requests.length = 0;
  });

  function initBranch() {
    [
      document.getElementById('branch-banner-iframe'),
      document.getElementById('branch-banner'),
    ].forEach(function (el) {
      el?.parentNode?.removeChild(el);
    });

    setEnv(makeFakeEnv({ userAgent: () => UA_FOR_PLATFORM.ios }));

    const branch = new Branch();

    testUtils.captureRequests(branch._server, requests);

    return branch;
  }

  afterEach(function () {
    vi.restoreAllMocks();
    setEnv(null);
  });

  describe('journeys', function () {
    let bannerDeeplinkData;
    let bannerOptions;

    beforeEach(function () {
      bannerDeeplinkData = {
        tags: ['custom'],
        data: {
          mydata: 'From Banner',
          foo: 'bar',
          '$deeplink_path': 'open/item/5678',
        },
      };
      bannerOptions = {
        immediate: true,
        disableHide: true,
        forgetHide: true,
        iframe: false, // renders synchronously; the iframe path is covered in banner/banner_html.test.js
      };
      vi.spyOn(console, 'warn').mockImplementation(function () {}); // banner() deprecation warning
    });

    function respondToInit() {
      // _r
      requests[0].callback(null, browser_fingerprint_id);

      // v1/open
      requests[1].callback(null, {
        browser_fingerprint_id: browser_fingerprint_id,
        identity_id: identity_id,
        session_id: session_id,
      });
    }

    // The init pageview waits on renderQueue until queued calls like banner()
    // have run, so /v1/deepview precedes /v1/pageview.
    it(
      'should attempt to pass deeplink data in a banner call',
      testUtils.withDone(function (done) {
        const branch = initBranch();
        const assert = testUtils.plan(3, done);

        branch.init(branch_sample_key);
        branch.banner(bannerOptions, bannerDeeplinkData);

        respondToInit();

        // v1/deepview
        requests[2].callback(null, {
          branch_view_enabled: false,
        });

        // v1/pageview
        requests[3].callback(null, {
          branch_view_enabled: false,
        });

        assert.strictEqual(
          requests[2].resource.endpoint,
          '/v1/deepview',
          'calling deepview',
        );
        assert.strictEqual(
          JSON.parse(requests[2].obj.data).mydata,
          'From Banner',
          'deep link data was passed by banner',
        );

        assert.strictEqual(requests.length, 4, '4 requests made');
      }),
    );

    // Data passed to banner()/setBranchViewData() reaches Journeys via the
    // /v1/pageview request.
    it(
      'should attempt to pass deeplink data to a journey in a page view event',
      testUtils.withDone(function (done) {
        const branch = initBranch();
        const assert = testUtils.plan(3, done);

        branch.init(branch_sample_key);
        branch.banner(bannerOptions, bannerDeeplinkData);

        respondToInit();

        // v1/deepview
        requests[2].callback(null, {});

        assert.strictEqual(requests.length, 4, '4 requests made');
        assert.strictEqual(
          requests[3].resource.endpoint,
          '/v1/pageview',
          'calling pageview',
        );
        assert.strictEqual(
          JSON.parse(requests[3].obj.data).mydata,
          'From Banner',
          'deep link data was passed by banner',
        );
      }),
    );

    it(
      'should attempt to pass deeplink data in a banner call from init callback',
      testUtils.withDone(function (done) {
        // An existing user with a branch.banner() call during the callback passed into branch.init(),
        // where a Journey view would be shown. In this case, the data most recently passed to
        // branch.banner() is sent through to the /v1/pageview call. It would be combined on the
        // server with data set in the Dashboard.
        const branch = initBranch();
        const assert = testUtils.plan(3, done);

        branch.init(
          branch_sample_key,
          {},
          function onInit(_errorMessage, _branchData) {
            branch.banner(bannerOptions, bannerDeeplinkData);
          },
        );

        respondToInit();

        // v1/deepview
        requests[2].callback(null, {});

        assert.strictEqual(requests.length, 4, '4 requests made');
        assert.strictEqual(
          requests[3].resource.endpoint,
          '/v1/pageview',
          'calling pageview',
        );
        assert.strictEqual(
          JSON.parse(requests[3].obj.data).mydata,
          'From Banner',
          'deep link data was passed by banner',
        );
      }),
    );
  });
});
