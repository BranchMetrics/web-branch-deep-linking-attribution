import { Branch } from '../../src/branch.js';
import { config } from '../../src/core/config.js';
import { safejson } from '../../src/core/safejson.js';
import { session } from '../../src/core/session.js';
import { utils } from '../../src/core/utils.js';
import { journeys_utils } from '../../src/journeys/journeys_utils.js';

// Characterization tests for the identity/session-data methods: data, first,
// setIdentity, logout, getBrowserFingerprintId, crossPlatformIds,
// lastAttributedTouchData and referringLink. The network layer is stubbed at
// Server#request.

const FAKE_KEY = 'key_live_xxx';
const BFP_ID = '79336952217731267';
const SESSION_ID = '98807509250212101';
const IDENTITY_ID = '98807509250212102';

describe('Branch identity', function () {
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
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
    journeys_utils.branch = savedJourneysBranch;
  });

  // Returns a Branch whose server requests are captured into `requests`.
  // mode: 'none' (init never called), 'failed' or 'ok'. `openResponse` is
  // merged into the /v1/open response.
  function makeBranch(mode, openResponse) {
    requests.length = 0;
    localStorage.clear();
    sessionStorage.clear();
    const branch = new Branch();
    testUtils.captureRequests(branch._server, requests);
    if (mode === 'none') {
      return branch;
    }
    branch.init(FAKE_KEY);
    requests[0].callback(null, BFP_ID);
    if (mode === 'failed') {
      requests[1].callback(new Error('open failed'));
      requests.length = 0;
      return branch;
    }
    requests[1].callback(
      null,
      utils.merge(
        {
          browser_fingerprint_id: BFP_ID,
          identity_id: IDENTITY_ID,
          session_id: SESSION_ID,
        },
        openResponse || {},
      ),
    );
    requests[2].callback(null, {});
    requests.length = 0;
    return branch;
  }

  function baseUserData(extra) {
    return utils.merge(
      {
        http_origin: document.URL,
        user_agent: navigator.userAgent,
        language: utils.getBrowserLanguageCode(),
        screen_width: utils.getScreenWidth(),
        screen_height: utils.getScreenHeight(),
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
      data: [],
      first: [],
      setIdentity: ['id'],
      logout: [],
      getBrowserFingerprintId: [],
      crossPlatformIds: [],
      lastAttributedTouchData: [7],
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

    it('passes null data alongside the init error for CALLBACK_ERR_DATA methods', function () {
      const branch = makeBranch('none');
      const cb = vi.fn();
      branch.data(cb);
      expect(cb.mock.calls[0][1]).toBeNull();
    });
  });

  describe('data', function () {
    it('returns whitelisted session data with parsed link data', function () {
      const linkData = { '~channel': 'email', '+clicked_branch_link': true };
      const branch = makeBranch('ok', {
        data: safejson.stringify(linkData),
        has_app: true,
        identity: 'user_1',
        referring_identity: 'ref_user',
        referring_link: 'https://example.app.link/abc',
        // Not whitelisted:
        secret_field: 'nope',
      });
      const cb = vi.fn();
      branch.data(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(null, {
        data: safejson.stringify(linkData),
        data_parsed: linkData,
        has_app: true,
        identity: 'user_1',
        developer_identity: 'user_1',
        referring_identity: 'ref_user',
        referring_link: 'https://example.app.link/abc',
      });
      expect(requests).toHaveLength(0);
    });

    it('returns defaults for a session without link data', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.data(cb);
      expect(cb).toHaveBeenCalledWith(null, {
        data: '',
        data_parsed: {},
        has_app: null,
        identity: null,
        developer_identity: null,
        referring_identity: null,
        referring_link: null,
      });
    });

    it('uses the click_id based referring link when session has none', function () {
      const branch = makeBranch('ok');
      // _referringLink reads a standalone `click_id` storage key.
      branch._storage.set('click_id', 'click123');
      const cb = vi.fn();
      branch.data(cb);
      expect(cb.mock.calls[0][1].referring_link).toBe(
        `${config.link_service_endpoint}/c/click123`,
      );
    });

    it('does not throw without a callback', function () {
      const branch = makeBranch('ok');
      expect(function () {
        branch.data();
      }).not.toThrow();
    });
  });

  describe('first', function () {
    it('returns whitelisted data from the first (local storage) session', function () {
      const branch = makeBranch('ok', {
        data: safejson.stringify({ first: true }),
        has_app: false,
        referring_link: 'https://example.app.link/first',
      });
      const cb = vi.fn();
      branch.first(cb);
      expect(cb).toHaveBeenCalledWith(null, {
        data: safejson.stringify({ first: true }),
        // NOTE: possible bug: unlike data(), first() never parses `data`, so
        // data_parsed is always {} unless a data_parsed field was stored.
        data_parsed: {},
        has_app: false,
        identity: null,
        developer_identity: null,
        referring_identity: null,
        referring_link: 'https://example.app.link/first',
      });
    });

    it('throws when there is no first-session data', function () {
      const branch = makeBranch('ok');
      localStorage.clear();
      const cb = vi.fn();
      // NOTE: possible bug: session.get(storage, true) returns null here and
      // whiteListSessionData(null) throws a TypeError out of first(); the
      // callback is never called.
      expect(function () {
        branch.first(cb);
      }).toThrow(TypeError);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('setIdentity', function () {
    it('returns current session values and stores the identity', function () {
      const branch = makeBranch('ok', { link: 'https://example.app.link/me' });
      const cb = vi.fn();
      branch.setIdentity('user@example.com', cb);
      expect(cb).toHaveBeenCalledWith(null, {
        identity_id: IDENTITY_ID,
        session_id: SESSION_ID,
        link: 'https://example.app.link/me',
        developer_identity: 'user@example.com',
      });
      expect(branch.identity).toBe('user@example.com');
      expect(session.get(branch._storage).identity).toBe('user@example.com');
      expect(session.get(branch._storage, true).identity).toBe(
        'user@example.com',
      );
      expect(requests).toHaveLength(0);
    });

    it('is reflected by data() afterwards', function () {
      const branch = makeBranch('ok');
      branch.setIdentity('user_2');
      const cb = vi.fn();
      branch.data(cb);
      expect(cb.mock.calls[0][1].identity).toBe('user_2');
      expect(cb.mock.calls[0][1].developer_identity).toBe('user_2');
    });

    it.each([null, undefined, ''])(
      'errors for a falsy identity (%s)',
      function (identity) {
        const branch = makeBranch('ok');
        const cb = vi.fn();
        branch.setIdentity(identity, cb);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0].message).toBe(
          'setIdentity - required argument identity should have a non-null value',
        );
        expect(cb.mock.calls[0][1]).toBeUndefined();
        expect(branch.identity).toBeUndefined();
      },
    );

    it('stores a non-string identity as is', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.setIdentity(12345, cb);
      expect(cb.mock.calls[0][1].developer_identity).toBe(12345);
      expect(branch.identity).toBe(12345);
    });
  });

  describe('logout', function () {
    it('clears the identity everywhere and keeps the session', function () {
      const branch = makeBranch('ok');
      branch.setIdentity('user_3');
      const cb = vi.fn();
      branch.logout(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(null);
      expect(branch.identity).toBeNull();
      expect(branch.session_id).toBe(SESSION_ID);
      expect(branch.identity_id).toBe(IDENTITY_ID);
      expect(session.get(branch._storage)).not.toHaveProperty('identity');
      expect(session.get(branch._storage, true)).not.toHaveProperty('identity');
      expect(session.get(branch._storage).session_id).toBe(SESSION_ID);
      expect(requests).toHaveLength(0);
    });

    it('succeeds when no identity was set', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.logout(cb);
      expect(cb).toHaveBeenCalledWith(null);
      expect(branch.identity).toBeNull();
    });
  });

  describe('getBrowserFingerprintId', function () {
    it('returns the fingerprint stored in the first session', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.getBrowserFingerprintId(cb);
      expect(cb).toHaveBeenCalledWith(null, BFP_ID);
    });

    it('returns null when the first session has no fingerprint', function () {
      const branch = makeBranch('ok');
      localStorage.clear();
      const cb = vi.fn();
      branch.getBrowserFingerprintId(cb);
      expect(cb).toHaveBeenCalledWith(null, null);
    });
  });

  describe('crossPlatformIds', function () {
    it('posts user_data to /v1/cpid and returns response.user_data', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.crossPlatformIds(cb);
      expect(requests).toHaveLength(1);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v1/cpid');
      expect(req.obj.branch_key).toBe(FAKE_KEY);
      expect(safejson.parse(req.obj.user_data)).toEqual(baseUserData());
      // /v1/cpid is not a DMA endpoint.
      expect(req.obj).not.toHaveProperty('branch_dma_data');
      const cpids = { developer_identity: 'x', cross_platform_id: 'cp1' };
      req.callback(null, { user_data: cpids, other: 1 });
      expect(cb).toHaveBeenCalledWith(null, cpids);
    });

    it('returns null data when the response has no user_data', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.crossPlatformIds(cb);
      requests[0].callback(null, undefined);
      expect(cb).toHaveBeenCalledWith(null, null);
    });

    it('forwards API errors', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      const err = new Error('cpid failed');
      branch.crossPlatformIds(cb);
      requests[0].callback(err, { user_data: { a: 1 } });
      expect(cb).toHaveBeenCalledWith(err, { a: 1 });
    });

    it('includes identity and tracking_disabled when set', function () {
      const branch = makeBranch('ok');
      branch.setIdentity('user_4');
      branch._ctx.userPreferences.trackingDisabled = true;
      branch.crossPlatformIds();
      const req = requests[0];
      expect(safejson.parse(req.obj.user_data)).toEqual(
        baseUserData({ developer_identity: 'user_4', identity: 'user_4' }),
      );
      expect(req.obj.tracking_disabled).toBe(true);
    });
  });

  describe('lastAttributedTouchData', function () {
    it('posts user_data with attribution_window to /v1/cpid/latd', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.lastAttributedTouchData(30, cb);
      expect(requests).toHaveLength(1);
      const req = requests[0];
      expect(req.resource.endpoint).toBe('/v1/cpid/latd');
      expect(req.obj.branch_key).toBe(FAKE_KEY);
      expect(safejson.parse(req.obj.user_data)).toEqual(
        baseUserData({ attribution_window: 30 }),
      );
      const latd = { last_attributed_touch_data: { '~channel': 'x' } };
      req.callback(null, latd);
      expect(cb).toHaveBeenCalledWith(null, latd);
    });

    it('omits a non-numeric attribution_window', function () {
      const branch = makeBranch('ok');
      branch.lastAttributedTouchData('30');
      expect(safejson.parse(requests[0].obj.user_data)).toEqual(baseUserData());
    });

    it('works with only a callback', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      branch.lastAttributedTouchData(cb);
      expect(safejson.parse(requests[0].obj.user_data)).toEqual(baseUserData());
      requests[0].callback(null, undefined);
      expect(cb).toHaveBeenCalledWith(null, null);
    });

    it('forwards API errors', function () {
      const branch = makeBranch('ok');
      const cb = vi.fn();
      const err = new Error('latd failed');
      branch.lastAttributedTouchData(1, cb);
      requests[0].callback(err);
      expect(cb).toHaveBeenCalledWith(err, null);
    });
  });

  describe('referringLink', function () {
    it('returns null when there is no referring link or click id', function () {
      const branch = makeBranch('ok');
      expect(branch.referringLink()).toBeNull();
    });

    it('returns the session referring link', function () {
      const branch = makeBranch('ok', {
        referring_link: 'https://example.app.link/abc',
      });
      expect(branch.referringLink()).toBe('https://example.app.link/abc');
      expect(branch.referringLink(true)).toBe('https://example.app.link/abc');
    });

    it('falls back to a link built from the stored click_id', function () {
      const branch = makeBranch('ok');
      branch._storage.set('click_id', 'click456');
      expect(branch.referringLink()).toBe(
        `${config.link_service_endpoint}/c/click456`,
      );
    });

    it('is callable before init and does not go through the queue', function () {
      const branch = makeBranch('none');
      expect(branch.referringLink()).toBeNull();
    });

    describe('with extended journeys assist', function () {
      function seed(branch, expiry) {
        // Only the first (local) session has the link.
        session.patch(
          branch._storage,
          {
            referring_link: 'https://example.app.link/local',
            referringLinkExpiry: expiry,
          },
          true,
        );
        session.patch(branch._storage, { referring_link: null }, false, true);
      }

      it('returns the unexpired local referring link when asked for journeys', function () {
        const branch = makeBranch('ok');
        branch._ctx.userPreferences.enableExtendedJourneysAssist = true;
        seed(branch, Date.now() + 60000);
        expect(branch.referringLink(true)).toBe(
          'https://example.app.link/local',
        );
        expect(branch.referringLink(false)).toBeNull();
      });

      it('ignores the local link when the preference is off', function () {
        const branch = makeBranch('ok');
        branch._ctx.userPreferences.enableExtendedJourneysAssist = false;
        seed(branch, Date.now() + 60000);
        expect(branch.referringLink(true)).toBeNull();
      });

      it('clears the expiry and returns null when the local link expired', function () {
        const branch = makeBranch('ok');
        branch._ctx.userPreferences.enableExtendedJourneysAssist = true;
        seed(branch, Date.now() - 1000);
        expect(branch.referringLink(true)).toBeNull();
        const local = session.get(branch._storage, true);
        expect(local).not.toHaveProperty('referringLinkExpiry');
        // The expired link itself is left in local storage.
        expect(local.referring_link).toBe('https://example.app.link/local');
      });

      it('ignores a local link without an expiry', function () {
        const branch = makeBranch('ok');
        branch._ctx.userPreferences.enableExtendedJourneysAssist = true;
        seed(branch, null);
        expect(branch.referringLink(true)).toBeNull();
      });
    });
  });
});
