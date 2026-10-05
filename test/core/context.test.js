import { applyNonce, createContext, log } from '../../src/core/context.js';
import { browserEnv, setEnv } from '../../src/env/env.js';
import { makeFakeEnv } from '../helpers/fake-env.js';

describe('core/context', function () {
  afterEach(function () {
    vi.restoreAllMocks();
    setEnv(null);
  });

  describe('createContext', function () {
    it('has the legacy utils defaults', function () {
      const ctx = createContext();
      expect(ctx.debug).toBe(false);
      expect(ctx.retries).toBe(2);
      expect(ctx.retry_delay).toBe(200);
      expect(ctx.timeout).toBe(5000);
      expect(ctx.nonce).toBe('');
      expect(ctx.extendedJourneysAssistExpiryTime).toBe(604800000);
      expect(ctx.instrumentation).toEqual({});
      expect(ctx.currentRequestBrttTag).toBe('');
      expect(ctx.userAgentData).toBeNull();
    });

    it('has the legacy userPreferences defaults', function () {
      const prefs = createContext().userPreferences;
      expect(prefs.trackingDisabled).toBe(false);
      expect(prefs.enableExtendedJourneysAssist).toBe(false);
      expect(prefs.allowErrorsInCallback).toBe(false);
      expect(prefs.whiteListedEndpointsWithData).toEqual({
        '/v1/open': { 'link_identifier': '\\d+' },
        '/v1/pageview': { 'event': 'pageview' },
        '/v1/dismiss': { 'event': 'dismiss' },
        '/v1/url': {},
      });
      expect(typeof prefs.shouldBlockRequest).toBe('function');
    });

    it('gives each context its own state', function () {
      const a = createContext();
      const b = createContext();
      expect(a.userPreferences).not.toBe(b.userPreferences);
      expect(a.instrumentation).not.toBe(b.instrumentation);
      a.userPreferences.trackingDisabled = true;
      a.timeout = 100;
      expect(b.userPreferences.trackingDisabled).toBe(false);
      expect(b.timeout).toBe(5000);
    });

    it('env() returns the current global env', function () {
      const ctx = createContext();
      expect(ctx.env()).toBe(browserEnv);
      const fake = makeFakeEnv();
      setEnv(fake);
      expect(ctx.env()).toBe(fake);
    });
  });

  describe('userPreferences.shouldBlockRequest', function () {
    let prefs;
    beforeEach(function () {
      prefs = createContext().userPreferences;
      prefs.trackingDisabled = true;
    });

    it('blocks an unlisted service endpoint', function () {
      expect(prefs.shouldBlockRequest('https://api2.branch.io/v1/bogus')).toBe(
        true,
      );
    });

    it('blocks a whitelisted endpoint without its required data', function () {
      expect(prefs.shouldBlockRequest('https://api2.branch.io/v1/open')).toBe(
        true,
      );
      expect(
        prefs.shouldBlockRequest('https://api2.branch.io/v1/open', {
          link_identifier: 'abc',
        }),
      ).toBe(true);
    });

    it('allows a whitelisted endpoint with matching data', function () {
      expect(
        prefs.shouldBlockRequest('https://api2.branch.io/v1/open', {
          link_identifier: '111111111111',
        }),
      ).toBe(false);
      expect(prefs.shouldBlockRequest('https://api2.branch.io/v1/url')).toBe(
        false,
      );
    });

    it('allows raw links (non-service origins)', function () {
      expect(
        prefs.shouldBlockRequest('https://bnctestbed.app.link/abcdefg'),
      ).toBe(false);
    });

    it("reads this context's whitelist", function () {
      const ctx = createContext();
      ctx.userPreferences.whiteListedEndpointsWithData['/v1/bogus'] = {};
      expect(
        ctx.userPreferences.shouldBlockRequest(
          'https://api2.branch.io/v1/bogus',
        ),
      ).toBe(false);
      expect(prefs.shouldBlockRequest('https://api2.branch.io/v1/bogus')).toBe(
        true,
      );
    });
  });

  describe('log', function () {
    it('logs only when ctx.debug is set', function () {
      const spy = vi.spyOn(console, 'log').mockImplementation(function () {});
      log({ debug: false }, 'quiet');
      expect(spy).not.toHaveBeenCalled();
      log({ debug: true }, 'loud');
      expect(spy).toHaveBeenCalledWith('loud');
    });
  });

  describe('applyNonce', function () {
    it('does not set a nonce when ctx.nonce is empty', function () {
      const el = document.createElement('script');
      applyNonce(createContext(), el);
      expect(el.hasAttribute('nonce')).toBe(false);
    });

    it('sets the nonce attribute from ctx.nonce', function () {
      const ctx = createContext();
      ctx.nonce = 'abc123';
      const el = document.createElement('script');
      applyNonce(ctx, el);
      expect(el.getAttribute('nonce')).toBe('abc123');
    });

    it('sets "undefined" when ctx.nonce is undefined (only "" is skipped)', function () {
      const ctx = createContext();
      ctx.nonce = undefined;
      const el = document.createElement('script');
      applyNonce(ctx, el);
      expect(el.getAttribute('nonce')).toBe('undefined');
    });
  });
});
