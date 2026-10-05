import { banner } from '../../src/banner/banner.js';
import { banner_utils } from '../../src/banner/banner-utils.js';
import { Branch } from '../../src/branch.js';
import { createContext } from '../../src/core/context.js';
import { storage as storageModule } from '../../src/core/storage.js';
import { setEnv } from '../../src/env/env.js';
import { makeFakeEnv, UA_FOR_PLATFORM } from '../helpers/fake-env.js';

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id */

// Characterization tests for the legacy smart banner (src/banner/banner.js).
// They pin the current behavior, quirks included.

const BANNER_IDS = [
  'branch-banner',
  'branch-banner-iframe',
  'branch-css',
  'branch-iframe-css',
  'branch-banner-modal-background',
];

function removeBannerElements() {
  BANNER_IDS.forEach(function (id) {
    let el = document.getElementById(id);
    while (el) {
      el.parentNode.removeChild(el);
      el = document.getElementById(id);
    }
  });
}

// The option set that branch.banner() builds from user options, with the
// defaults it applies (see Branch.prototype.banner).
function makeOptions(overrides) {
  return Object.assign(
    {
      icon: 'icon.png',
      title: 'My App',
      description: 'Best app ever',
      reviewCount: null,
      rating: null,
      openAppButtonText: 'View in app',
      downloadAppButtonText: 'Download App',
      iframe: false,
      showiOS: true,
      showiPad: true,
      showAndroid: true,
      showBlackberry: true,
      showWindowsPhone: true,
      showKindle: true,
      disableHide: false,
      forgetHide: false,
      respectDNT: false,
      position: 'top',
      customCSS: '',
      mobileSticky: false,
      buttonBorderColor: '',
      buttonBackgroundColor: '',
      buttonFontColor: '',
      buttonBorderColorHover: '',
      buttonBackgroundColorHover: '',
      buttonFontColorHover: '',
      make_new_link: false,
      open_app: false,
      immediate: false,
      append_deeplink_path: false,
    },
    overrides || {},
  );
}

function makeBranchStub() {
  return {
    _ctx: createContext(),
    _publishEvent: vi.fn(),
    deepview: vi.fn(),
    deepviewCta: vi.fn(),
  };
}

function publishedEvents(branch) {
  return branch._publishEvent.mock.calls.map(function (call) {
    return call[0];
  });
}

function mockPlatform(platform) {
  setEnv(makeFakeEnv({ userAgent: () => UA_FOR_PLATFORM[platform] }));
}

// Renders an iframe banner and resolves once the iframe has loaded and the
// final hookups (which publish didShowBanner when immediate) have run.
function renderIframeBanner(branch, options, linkData, store) {
  return new Promise(function (resolve) {
    branch._publishEvent.mockImplementation(function (event) {
      if (event === 'didShowBanner') {
        resolve();
      }
    });
    branch.closeBanner = banner(branch, options, linkData, store);
  });
}

describe('banner', function () {
  let store;
  let branch;
  const originalAnimationSpeed = banner_utils.animationSpeed;
  const originalAnimationDelay = banner_utils.animationDelay;
  const originalBannerHeight = banner_utils.bannerHeight;

  beforeEach(function () {
    localStorage.clear();
    sessionStorage.clear();
    removeBannerElements();
    document.body.className = '';
    document.body.removeAttribute('style');
    store = new storageModule.BranchStorage(['local']);
    branch = makeBranchStub();
  });

  afterEach(function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setEnv(null);
    removeBannerElements();
    document.body.className = '';
    document.body.removeAttribute('style');
    localStorage.clear();
    sessionStorage.clear();
    banner_utils.animationSpeed = originalAnimationSpeed;
    banner_utils.animationDelay = originalAnimationDelay;
    banner_utils.bannerHeight = originalBannerHeight;
  });

  describe('when the banner should not be shown', function () {
    it('publishes willNotShowBanner and returns null on desktop', function () {
      mockPlatform('desktop');
      const result = banner(branch, makeOptions(), {}, store);
      expect(result).toBeNull();
      expect(publishedEvents(branch)).toEqual(['willNotShowBanner']);
      expect(document.getElementById('branch-banner')).toBeNull();
      expect(document.getElementById('branch-css')).toBeNull();
    });

    it('does not render on platform "other"', function () {
      mockPlatform('other');
      expect(banner(branch, makeOptions(), {}, store)).toBeNull();
      expect(publishedEvents(branch)).toEqual(['willNotShowBanner']);
    });

    it('does not render on iOS when showiOS is false', function () {
      mockPlatform('ios');
      expect(
        banner(branch, makeOptions({ showiOS: false }), {}, store),
      ).toBeNull();
      expect(document.getElementById('branch-banner')).toBeNull();
    });

    it('does not render on Android when showAndroid is false', function () {
      mockPlatform('android');
      expect(
        banner(branch, makeOptions({ showAndroid: false }), {}, store),
      ).toBeNull();
    });

    it('ignores a showDesktop option: desktop never renders', function () {
      mockPlatform('desktop');
      expect(
        banner(branch, makeOptions({ showDesktop: true }), {}, store),
      ).toBeNull();
    });

    it('does not render a second banner while one is in the document', function () {
      mockPlatform('ios');
      const existing = document.createElement('div');
      existing.id = 'branch-banner';
      document.body.appendChild(existing);
      expect(banner(branch, makeOptions(), {}, store)).toBeNull();
      expect(document.querySelectorAll('#branch-banner').length).toBe(1);
    });

    it('does not render while hideBanner=true is stored', function () {
      mockPlatform('ios');
      store.set('hideBanner', true, true);
      expect(banner(branch, makeOptions(), {}, store)).toBeNull();
      expect(publishedEvents(branch)).toEqual(['willNotShowBanner']);
    });

    it('renders despite hideBanner=true when forgetHide is true', function () {
      mockPlatform('ios');
      store.set('hideBanner', true, true);
      const close = banner(
        branch,
        makeOptions({ forgetHide: true }),
        {},
        store,
      );
      expect(typeof close).toBe('function');
      expect(document.getElementById('branch-banner')).not.toBeNull();
    });

    it('respects Do Not Track when respectDNT is set', function () {
      setEnv(
        makeFakeEnv({
          userAgent: () => UA_FOR_PLATFORM.ios,
          doNotTrack: () => '1',
        }),
      );
      expect(
        banner(branch, makeOptions({ respectDNT: true }), {}, store),
      ).toBeNull();
      // Without respectDNT the same browser gets a banner.
      expect(typeof banner(branch, makeOptions(), {}, store)).toBe('function');
    });
  });

  describe('rendering (non-iframe)', function () {
    it('renders the banner markup into the document on iOS', function () {
      mockPlatform('ios');
      const close = banner(branch, makeOptions(), {}, store);

      expect(typeof close).toBe('function');
      expect(publishedEvents(branch)).toEqual(['willShowBanner']);

      const el = document.getElementById('branch-banner');
      expect(el.parentNode).toBe(document.body);
      expect(el.className).toBe('branch-animation');
      expect(el.querySelector('.content').className).toBe('content');
      expect(el.querySelector('.title').textContent).toBe('My App');
      expect(el.querySelector('.description').textContent).toBe(
        'Best app ever',
      );
      expect(el.querySelector('.icon img').getAttribute('src')).toBe(
        'icon.png',
      );
      expect(document.getElementById('branch-banner-close')).not.toBeNull();
      // No session stored, so the download text is used.
      expect(document.getElementById('branch-mobile-action').textContent).toBe(
        'Download App',
      );
    });

    it('uses openAppButtonText when the session has has_app', function () {
      mockPlatform('ios');
      store.set('branch_session', JSON.stringify({ has_app: true }));
      banner(branch, makeOptions(), {}, store);
      expect(document.getElementById('branch-mobile-action').textContent).toBe(
        'View in app',
      );
    });

    it('adds the ios CSS on iOS and the android CSS on Android', function () {
      mockPlatform('ios');
      banner(branch, makeOptions(), {}, store);
      const iosCss = document.getElementById('branch-css').innerHTML;
      expect(iosCss).toContain('#branch-banner { position: absolute; }');
      removeBannerElements();

      mockPlatform('android');
      banner(branch, makeOptions(), {}, store);
      const androidCss = document.getElementById('branch-css').innerHTML;
      expect(androidCss).toContain('background-color: #A4C639;');
      expect(iosCss).not.toContain('#A4C639');
      expect(androidCss).not.toBe(iosCss);
    });

    it('appends the branch-css style to document.head', function () {
      mockPlatform('android');
      banner(branch, makeOptions(), {}, store);
      const css = document.getElementById('branch-css');
      expect(css.parentNode).toBe(document.head);
      expect(css.type).toBe('text/css');
      expect(document.getElementById('branch-iframe-css')).toBeNull();
    });

    it('appends customCSS to the stylesheet', function () {
      mockPlatform('ios');
      banner(
        branch,
        makeOptions({ customCSS: '.my-custom { color: red; }' }),
        {},
        store,
      );
      expect(document.getElementById('branch-css').innerHTML).toMatch(
        /\.my-custom \{ color: red; \}$/,
      );
    });

    it('renders a theme class and dark-theme button borders', function () {
      mockPlatform('ios');
      banner(branch, makeOptions({ theme: 'dark' }), {}, store);
      expect(document.querySelector('#branch-banner .content').className).toBe(
        'content theme-dark',
      );
      const css = document.getElementById('branch-css').innerHTML;
      expect(css).toContain(
        '#branch-banner .button{ border: 1px solid transparent;',
      );
    });

    it('applies the button color options to the stylesheet', function () {
      mockPlatform('ios');
      banner(
        branch,
        makeOptions({
          buttonBorderColor: '#111',
          buttonBackgroundColor: '#222',
          buttonFontColor: '#333',
          buttonBorderColorHover: '#444',
          buttonBackgroundColorHover: '#555',
          buttonFontColorHover: '#666',
        }),
        {},
        store,
      );
      const css = document.getElementById('branch-css').innerHTML;
      expect(css).toContain(
        '#branch-banner .button{ border: 1px solid #111; background: #222; color: #333;',
      );
      expect(css).toContain(
        '#branch-banner .button:hover {  border: 1px solid #444; background: #555; color: #666;}',
      );
    });

    it('uses the default button colors when none are given', function () {
      mockPlatform('ios');
      banner(branch, makeOptions(), {}, store);
      const css = document.getElementById('branch-css').innerHTML;
      expect(css).toContain(
        '#branch-banner .button{ border: 1px solid #ccc; background: #fff; color: #000;',
      );
    });

    it('omits the close button when disableHide is true', function () {
      mockPlatform('ios');
      banner(branch, makeOptions({ disableHide: true }), {}, store);
      expect(document.getElementById('branch-banner')).not.toBeNull();
      expect(document.getElementById('branch-banner-close')).toBeNull();
    });

    it('renders rating stars and a review count', function () {
      mockPlatform('ios');
      banner(branch, makeOptions({ rating: 3.5, reviewCount: 42 }), {}, store);
      const el = document.getElementById('branch-banner');
      expect(el.querySelectorAll('.stars > span.star').length).toBe(5);
      expect(el.querySelectorAll('.stars > span.star > span.full').length).toBe(
        3,
      );
      expect(el.querySelectorAll('.stars > span.star > span.half').length).toBe(
        1,
      );
      expect(el.querySelector('.review-count').textContent).toBe('42');
    });

    it('defaults linkData.channel to "app banner", mutating the caller object', function () {
      mockPlatform('ios');
      const linkData = { data: { foo: 'bar' } };
      banner(branch, makeOptions(), linkData, store);
      expect(linkData.channel).toBe('app banner');
    });

    it('keeps an explicit linkData.channel', function () {
      mockPlatform('ios');
      const linkData = { channel: 'mine' };
      banner(branch, makeOptions(), linkData, store);
      expect(linkData.channel).toBe('mine');
    });

    it('calls branch.deepview with linkData and options (deepview_type="banner")', function () {
      mockPlatform('android');
      const options = makeOptions({ make_new_link: true });
      const linkData = { data: { foo: 'bar' } };
      banner(branch, options, linkData, store);

      expect(branch.deepview).toHaveBeenCalledTimes(1);
      expect(branch.deepview).toHaveBeenCalledWith(linkData, options);
      // The options object passed in is mutated.
      expect(options.deepview_type).toBe('banner');
      expect(branch.deepview.mock.calls[0][1].make_new_link).toBe(true);
    });

    it('calls branch.deepviewCta when the mobile CTA is clicked', function () {
      mockPlatform('ios');
      banner(branch, makeOptions(), {}, store);
      const event = new MouseEvent('click', { cancelable: true });
      document.getElementById('branch-mobile-action').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(branch.deepviewCta).toHaveBeenCalledTimes(1);
    });
  });

  describe('open animation', function () {
    it('slides in from the top after animationDelay', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      document.body.style.marginTop = '10px';
      banner(branch, makeOptions({ position: 'top' }), {}, store);

      const el = document.getElementById('branch-banner');
      expect(el.style.top).toBe('-76px');
      expect(document.body.className).toBe(' branch-banner-is-active');
      expect(document.body.style.marginTop).toBe('86px');
      expect(publishedEvents(branch)).toEqual(['willShowBanner']);

      vi.advanceTimersByTime(banner_utils.animationDelay - 1);
      expect(el.style.top).toBe('-76px');

      vi.advanceTimersByTime(1);
      expect(el.style.top).toBe('0px');
      expect(publishedEvents(branch)).toEqual([
        'willShowBanner',
        'didShowBanner',
      ]);
    });

    it('slides in from the bottom and pushes body margin-bottom', function () {
      vi.useFakeTimers();
      mockPlatform('android');
      document.body.style.marginBottom = '4px';
      banner(branch, makeOptions({ position: 'bottom' }), {}, store);

      const el = document.getElementById('branch-banner');
      expect(el.style.bottom).toBe('-76px');
      expect(el.style.top).toBe('');
      expect(document.body.style.marginBottom).toBe('80px');
      expect(document.body.style.marginTop).toBe('');
      expect(document.getElementById('branch-css').innerHTML).toContain(
        'border-top: 1px solid #ddd;',
      );

      vi.advanceTimersByTime(banner_utils.animationDelay);
      expect(el.style.bottom).toBe('0px');
    });

    it('shows immediately with the immediate option', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      banner(branch, makeOptions({ immediate: true }), {}, store);
      expect(document.getElementById('branch-banner').style.top).toBe('0px');
      expect(publishedEvents(branch)).toEqual([
        'willShowBanner',
        'didShowBanner',
      ]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('does not position the banner or touch body margins for an unknown position', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      banner(branch, makeOptions({ position: 'middle' }), {}, store);
      const el = document.getElementById('branch-banner');
      vi.advanceTimersByTime(banner_utils.animationDelay);
      expect(el.style.top).toBe('');
      expect(el.style.bottom).toBe('');
      expect(document.body.style.marginTop).toBe('');
      expect(document.body.style.marginBottom).toBe('');
      expect(document.body.className).toBe(' branch-banner-is-active');
      expect(publishedEvents(branch)).toContain('didShowBanner');
    });
  });

  describe('closeBanner (returned function)', function () {
    it('animates out, restores body styles, removes elements, then calls back', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      document.body.style.marginTop = '10px';
      const close = banner(
        branch,
        makeOptions({ position: 'top', immediate: true }),
        {},
        store,
      );
      const el = document.getElementById('branch-banner');
      const callback = vi.fn();

      close(callback);
      expect(el.style.top).toBe('-76px');
      expect(store.get('hideBanner', true)).toBe(true);
      expect(document.body.style.marginTop).toBe('86px');

      vi.advanceTimersByTime(banner_utils.animationDelay);
      expect(document.body.style.marginTop).toBe('10px');
      expect(document.body.className).toBe(' ');
      expect(document.getElementById('branch-banner')).toBe(el);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(banner_utils.animationSpeed);
      expect(document.getElementById('branch-banner')).toBeNull();
      expect(document.getElementById('branch-css')).toBeNull();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('restores margin-bottom when closing a bottom banner', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      document.body.style.marginBottom = '0px';
      const close = banner(
        branch,
        makeOptions({ position: 'bottom', immediate: true }),
        {},
        store,
      );
      const el = document.getElementById('branch-banner');
      expect(document.body.style.marginBottom).toBe('76px');
      close(function () {});
      expect(el.style.bottom).toBe('-76px');
      vi.advanceTimersByTime(
        banner_utils.animationDelay + banner_utils.animationSpeed,
      );
      expect(document.body.style.marginBottom).toBe('0px');
      expect(document.getElementById('branch-banner')).toBeNull();
    });

    it('removes everything synchronously with { immediate: true }', function () {
      mockPlatform('ios');
      document.body.style.marginTop = '10px';
      const close = banner(
        branch,
        makeOptions({ position: 'top', immediate: true }),
        {},
        store,
      );
      const callback = vi.fn();
      close({ immediate: true }, callback);
      expect(document.getElementById('branch-banner')).toBeNull();
      expect(document.getElementById('branch-css')).toBeNull();
      expect(document.body.style.marginTop).toBe('10px');
      expect(document.body.className).toBe(' ');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('restores margin-bottom synchronously with { immediate: true } for a bottom banner', function () {
      mockPlatform('ios');
      const close = banner(
        branch,
        makeOptions({ position: 'bottom', immediate: true }),
        {},
        store,
      );
      expect(document.body.style.marginBottom).not.toBe('');
      close({ immediate: true }, function () {});
      // Restored to the inline value captured before rendering (none).
      expect(document.body.style.marginBottom).toBe('');
    });

    it('stores a hideBanner expiry timestamp when forgetHide is a number of days', function () {
      vi.useFakeTimers();
      const now = new Date(2026, 0, 10, 12, 0, 0);
      vi.setSystemTime(now);
      mockPlatform('ios');
      const close = banner(
        branch,
        makeOptions({ forgetHide: 3, immediate: true }),
        {},
        store,
      );
      close({ immediate: true }, function () {});

      const expected = new Date(2026, 0, 13, 12, 0, 0).getTime();
      // localStorage stringifies the number.
      expect(store.get('hideBanner', true)).toBe(String(expected));

      // Still hidden before the expiry...
      vi.setSystemTime(new Date(2026, 0, 13, 11, 59, 59));
      expect(banner(branch, makeOptions({ forgetHide: 3 }), {}, store)).toBe(
        null,
      );
      // ...and shown again once it has passed.
      vi.setSystemTime(new Date(2026, 0, 13, 12, 0, 0));
      expect(
        typeof banner(branch, makeOptions({ forgetHide: 3 }), {}, store),
      ).toBe('function');
    });

    it('stores hideBanner=true when forgetHide is boolean, which hides later banners', function () {
      mockPlatform('ios');
      const close = banner(branch, makeOptions({ immediate: true }), {}, store);
      close({ immediate: true }, function () {});
      expect(localStorage.getItem('BRANCH_WEBSDK_KEYhideBanner')).toBe('true');
      expect(banner(branch, makeOptions(), {}, store)).toBeNull();
    });

    it('treats a callback passed as the first argument as the callback', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      const close = banner(branch, makeOptions({ immediate: true }), {}, store);
      const callback = vi.fn();
      close(callback);
      vi.runAllTimers();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('throws when called without a callback', function () {
      mockPlatform('ios');
      const close = banner(branch, makeOptions({ immediate: true }), {}, store);
      // NOTE: possible bug: closeBanner calls callback() unconditionally
      // (src/banner/banner.js:56 and :61), so closing without a callback
      // throws a TypeError after the banner was already removed.
      expect(function () {
        close({ immediate: true });
      }).toThrow(TypeError);
      expect(document.getElementById('branch-banner')).toBeNull();
    });
  });

  describe('close button', function () {
    it('publishes willCloseBanner/didCloseBanner and removes the banner', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      banner(branch, makeOptions({ immediate: true }), {}, store);

      const event = new MouseEvent('click', { cancelable: true });
      document.getElementById('branch-banner-close').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(publishedEvents(branch)).toEqual([
        'willShowBanner',
        'didShowBanner',
        'willCloseBanner',
      ]);
      expect(store.get('hideBanner', true)).toBe(true);

      vi.advanceTimersByTime(
        banner_utils.animationDelay + banner_utils.animationSpeed,
      );
      expect(document.getElementById('branch-banner')).toBeNull();
      expect(publishedEvents(branch)).toEqual([
        'willShowBanner',
        'didShowBanner',
        'willCloseBanner',
        'didCloseBanner',
      ]);
    });

    it('treats an element with id branch-banner-modal-background as a close trigger', function () {
      vi.useFakeTimers();
      mockPlatform('ios');
      // banner_html never renders this element; any element with the id in
      // the banner's document is wired up.
      const modal = document.createElement('div');
      modal.id = 'branch-banner-modal-background';
      document.body.appendChild(modal);
      banner(branch, makeOptions({ immediate: true }), {}, store);

      const event = new MouseEvent('click', { cancelable: true });
      modal.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      vi.runAllTimers();
      expect(publishedEvents(branch)).toEqual([
        'willShowBanner',
        'didShowBanner',
        'willCloseBanner',
        'didCloseBanner',
      ]);
      expect(document.getElementById('branch-banner')).toBeNull();
    });
  });

  describe('iframe rendering', function () {
    it('renders the banner inside an iframe with the platform body class', async function () {
      mockPlatform('ios');
      document.body.style.marginTop = '0px';
      await renderIframeBanner(
        branch,
        makeOptions({ iframe: true, immediate: true, position: 'top' }),
        {},
        store,
      );

      const iframe = document.getElementById('branch-banner-iframe');
      expect(iframe.parentNode).toBe(document.body);
      expect(iframe.style.top).toBe('0px');
      const doc = iframe.contentWindow.document;
      expect(doc.body.className).toBe('branch-banner-ios');
      expect(doc.getElementById('branch-banner')).not.toBeNull();
      // Banner CSS goes inside the iframe; the iframe CSS goes in the page.
      expect(document.getElementById('branch-css')).toBeNull();
      expect(doc.getElementById('branch-css').innerHTML).toContain(
        'body { margin: 0; }',
      );
      const outerCss = document.getElementById('branch-iframe-css');
      expect(outerCss.parentNode).toBe(document.head);
      expect(outerCss.innerHTML).toContain(
        '#branch-banner-iframe { position: absolute; }',
      );
      expect(document.body.className).toBe(' branch-banner-is-active');
      expect(document.body.style.marginTop).toBe('76px');
    });

    it('uses fixed positioning for a sticky or bottom iframe banner', async function () {
      mockPlatform('android');
      await renderIframeBanner(
        branch,
        makeOptions({ iframe: true, immediate: true, mobileSticky: true }),
        {},
        store,
      );
      expect(document.getElementById('branch-iframe-css').innerHTML).toContain(
        '#branch-banner-iframe { position: fixed; }',
      );
      const doc = document.getElementById('branch-banner-iframe').contentWindow
        .document;
      expect(doc.body.className).toBe('branch-banner-android');
    });

    it('wires the CTA and close button inside the iframe document', async function () {
      mockPlatform('ios');
      await renderIframeBanner(
        branch,
        makeOptions({ iframe: true, immediate: true }),
        {},
        store,
      );
      const iframe = document.getElementById('branch-banner-iframe');
      const doc = iframe.contentWindow.document;

      doc
        .getElementById('branch-mobile-action')
        .dispatchEvent(new MouseEvent('click', { cancelable: true }));
      expect(branch.deepviewCta).toHaveBeenCalledTimes(1);

      vi.useFakeTimers();
      doc
        .getElementById('branch-banner-close')
        .dispatchEvent(new MouseEvent('click', { cancelable: true }));
      expect(iframe.style.top).toBe('-76px');
      vi.runAllTimers();
      expect(document.getElementById('branch-banner-iframe')).toBeNull();
      expect(publishedEvents(branch)).toContain('didCloseBanner');
      // NOTE: possible bug: closeBanner only removes the #branch-css found in
      // the top document (src/banner/banner.js:55,60); in iframe mode that is
      // null, and the #branch-iframe-css added to document.head is left behind.
      expect(document.getElementById('branch-iframe-css')).not.toBeNull();
    });

    it('throws if the returned close function runs before the iframe loads', function () {
      mockPlatform('ios');
      const close = banner(
        branch,
        makeOptions({ iframe: true, immediate: true }),
        {},
        store,
      );
      // NOTE: possible bug: `element` is only assigned once the iframe loads
      // (src/banner/banner.js:76), so closing earlier throws at
      // src/banner/banner.js:36 reading element.style.
      expect(function () {
        close({ immediate: true }, function () {});
      }).toThrow(TypeError);
    });
  });

  describe('through the public Branch API', function () {
    const requests = [];

    function initBranch() {
      const instance = new Branch();
      testUtils.captureRequests(instance._server, requests);
      instance.init(branch_sample_key);
      // _r
      requests[0].callback(null, browser_fingerprint_id);
      // v1/open
      requests[1].callback(null, {
        browser_fingerprint_id: browser_fingerprint_id,
        identity_id: identity_id,
        session_id: session_id,
      });
      return instance;
    }

    function respondToPending() {
      for (let i = 2; i < requests.length; i++) {
        if (!requests[i].answered) {
          requests[i].answered = true;
          requests[i].callback(null, {});
        }
      }
    }

    beforeEach(function () {
      requests.length = 0;
      vi.spyOn(console, 'warn').mockImplementation(function () {});
      vi.spyOn(console, 'info').mockImplementation(function () {});
    });

    it('renders via branch.banner() and closes via branch.closeBanner()', function () {
      mockPlatform('ios');
      const instance = initBranch();
      const events = [];
      instance.addListener(function (event) {
        events.push(event);
      });

      instance.banner(
        {
          iframe: false,
          immediate: true,
          title: 'Public',
          position: 'bottom',
          theme: 'light',
          make_new_link: true,
        },
        { data: { foo: 'bar' } },
      );

      const el = document.getElementById('branch-banner');
      expect(el.querySelector('.title').textContent).toBe('Public');
      // NOTE: possible bug: Branch.prototype.banner builds bannerOptions
      // without `theme` (src/branch.js banner(); src/branch/journeys.js after
      // the split), so the theme option is dropped on the public API.
      expect(el.querySelector('.content').className).toBe('content');
      expect(el.style.bottom).toBe('0px');
      expect(events).toEqual(['willShowBanner', 'didShowBanner']);

      const deepview = requests.find(function (r) {
        return r.resource.endpoint === '/v1/deepview';
      });
      expect(deepview).toBeTruthy();
      expect(JSON.parse(deepview.obj.data).foo).toBe('bar');
      expect(deepview.obj.channel).toBe('app banner');

      // The task queue blocks on the pending /v1/deepview (and the /v1/pageview
      // it releases); answer them so closeBanner() can run.
      respondToPending();

      vi.useFakeTimers();
      instance.closeBanner();
      vi.runAllTimers();
      expect(document.getElementById('branch-banner')).toBeNull();
      // The pageview response also publishes willNotShowJourney.
      expect(
        events.filter(function (event) {
          return /Banner$/.test(event);
        }),
      ).toEqual([
        'willShowBanner',
        'didShowBanner',
        'willCloseBanner',
        'didCloseBanner',
      ]);
      expect(localStorage.getItem('BRANCH_WEBSDK_KEYhideBanner')).toBe('true');
    });

    it('does not render on desktop via branch.banner()', function () {
      mockPlatform('desktop');
      const instance = initBranch();
      instance.banner({ iframe: false, immediate: true }, {});
      expect(document.getElementById('branch-banner')).toBeNull();
      expect(console.info).toHaveBeenCalledWith(
        'banner functionality is not supported on this platform',
      );
    });

    it('closeBanner() is a no-op when no banner was shown', function () {
      mockPlatform('ios');
      const instance = initBranch();
      const events = [];
      instance.addListener(function (event) {
        events.push(event);
      });
      instance.closeBanner();
      expect(events).toEqual([]);
    });
  });
});
