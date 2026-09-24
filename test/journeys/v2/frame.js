'use strict';

goog.require('journeys_v2.frame');
goog.require('utils');

describe('journeys_v2.frame', function () {
  const assert = testUtils.unplanned();
  var iframe;
  var hostNav;

  beforeEach(function () {
    iframe = journeys_v2.frame.createIframe();
    document.body.appendChild(iframe);
    hostNav = document.createElement('div');
    hostNav.innerHTML = '<div class="branch-journeys-top"></div>';
    document.body.appendChild(hostNav);
  });

  afterEach(function () {
    journeys_v2.frame.teardown(iframe);
    if (hostNav.parentNode) {
      hostNav.parentNode.removeChild(hostNav);
    }
    utils.nonce = '';
  });

  it('createIframe builds the hidden, non-scrolling, labelled #branch-banner-iframe', function () {
    assert.strictEqual(iframe.id, 'branch-banner-iframe');
    assert.strictEqual(iframe.getAttribute('src'), 'about:blank');
    assert.strictEqual(iframe.scrolling, 'no');
    assert.strictEqual(iframe.style.overflow, 'hidden');
    assert.strictEqual(
      iframe.getAttribute('aria-label'),
      'Branch Banner Frame',
    );
  });

  it('mount writes the creative into the iframe body with the platform class', function () {
    var doc = journeys_v2.frame.mount(
      iframe,
      '<div id="branch-banner">hi</div>',
      'android',
    );
    assert.strictEqual(doc.getElementById('branch-banner').textContent, 'hi');
    assert.strictEqual(doc.body.className, 'branch-banner-android');
    assert.strictEqual(
      journeys_v2.frame.mount(iframe, '', 'ipad').body.className,
      'branch-banner-ios',
    );
    assert.strictEqual(
      journeys_v2.frame.mount(iframe, '', 'desktop').body.className,
      'branch-banner-other',
    );
  });

  it('injectOuterCss puts the served css verbatim in the parent head, replacing any stale block', function () {
    journeys_v2.frame.injectOuterCss('body { margin-top: 1px; }');
    journeys_v2.frame.injectOuterCss('body { margin-top: 76px; }');
    var styles = document.head.querySelectorAll('#branch-iframe-css');
    assert.strictEqual(styles.length, 1);
    assert.strictEqual(styles[0].innerHTML, 'body { margin-top: 76px; }');
  });

  it('injectInnerCss puts the served css in the iframe head', function () {
    journeys_v2.frame.mount(iframe, '', 'ios');
    journeys_v2.frame.injectInnerCss(iframe, '#branch-banner { color: red; }');
    var style = iframe.contentWindow.document.head.querySelector('#branch-css');
    assert.strictEqual(style.innerHTML, '#branch-banner { color: red; }');
  });

  it('applies the CSP nonce to everything it creates', function () {
    utils.nonce = 'n0nce';
    var nonced = journeys_v2.frame.createIframe();
    assert.strictEqual(nonced.getAttribute('nonce'), 'n0nce');
    journeys_v2.frame.injectOuterCss('x');
    assert.strictEqual(
      document.getElementById('branch-iframe-css').getAttribute('nonce'),
      'n0nce',
    );
    journeys_v2.frame.installCtaScript('void 0;');
    assert.strictEqual(
      document.getElementById('branch-journey-cta').getAttribute('nonce'),
      'n0nce',
    );
  });

  it('installCtaScript appends the callback script to the parent body, and skips when absent', function () {
    journeys_v2.frame.installCtaScript(undefined);
    assert.strictEqual(document.getElementById('branch-journey-cta'), null);
    journeys_v2.frame.installCtaScript('window.__cta = 1;');
    var script = document.getElementById('branch-journey-cta');
    assert.strictEqual(script.parentNode, document.body);
    assert.strictEqual(script.innerHTML, 'window.__cta = 1;');
  });

  it('setCtaText updates the button text and aria-label, tolerating missing text or button', function () {
    journeys_v2.frame.mount(
      iframe,
      '<button id="branch-mobile-action">Get</button>',
      'ios',
    );
    journeys_v2.frame.setCtaText(iframe, undefined);
    var button = iframe.contentWindow.document.getElementById(
      'branch-mobile-action',
    );
    assert.strictEqual(button.innerHTML, 'Get');
    journeys_v2.frame.setCtaText(iframe, 'Open');
    assert.strictEqual(button.innerHTML, 'Open');
    assert.strictEqual(button.getAttribute('aria-label'), 'Open');
    journeys_v2.frame.mount(iframe, '', 'ios');
    journeys_v2.frame.setCtaText(iframe, 'Open');
  });

  it('pushInjectorParents shifts the parents of the injector elements and resetInjectorParents clears it', function () {
    var pushed = journeys_v2.frame.pushInjectorParents({
      injectorSelector: '.branch-journeys-top',
      bannerHeight: '76px',
      isFullPage: false,
    });
    assert.deepEqual(pushed, [hostNav]);
    assert.strictEqual(hostNav.style.marginTop, '76px');
    journeys_v2.frame.resetInjectorParents(pushed);
    assert.strictEqual(hostNav.style.marginTop, '');
  });

  it('pushInjectorParents is a no-op without a selector and skips fixed parents under a full-page creative', function () {
    assert.deepEqual(
      journeys_v2.frame.pushInjectorParents({
        injectorSelector: '',
        bannerHeight: '76px',
        isFullPage: false,
      }),
      [],
    );
    hostNav.style.position = 'fixed';
    var pushed = journeys_v2.frame.pushInjectorParents({
      injectorSelector: '.branch-journeys-top',
      bannerHeight: '100vh',
      isFullPage: true,
    });
    assert.deepEqual(pushed, []);
    assert.strictEqual(hostNav.style.marginTop, '');
  });

  describe('fitContentHeight', function () {
    function mountContent(withScrim) {
      journeys_v2.frame.mount(
        iframe,
        '<div id="branch-banner">' +
          (withScrim
            ? '<div class="branch-banner-dismiss-background"></div>'
            : '') +
          '<div class="branch-banner-content"></div></div>',
        'ios',
      );
      return iframe.contentWindow.document.getElementsByClassName(
        'branch-banner-content',
      )[0];
    }

    it('pins .branch-banner-content to the resolved height for a relative creative without a scrim', function () {
      var content = mountContent(false);
      journeys_v2.frame.fitContentHeight(iframe, {
        bannerHeight: '460px',
        isRelative: true,
        isDesktopOverlay: false,
      });
      assert.strictEqual(content.style.height, '460px');
    });

    it('leaves the content alone when a scrim is present, for pixel heights, and for desktop overlays', function () {
      var content = mountContent(true);
      journeys_v2.frame.fitContentHeight(iframe, {
        bannerHeight: '460px',
        isRelative: true,
        isDesktopOverlay: false,
      });
      assert.strictEqual(content.style.height, '');

      content = mountContent(false);
      journeys_v2.frame.fitContentHeight(iframe, {
        bannerHeight: '76px',
        isRelative: false,
        isDesktopOverlay: false,
      });
      assert.strictEqual(content.style.height, '');
      journeys_v2.frame.fitContentHeight(iframe, {
        bannerHeight: '460px',
        isRelative: true,
        isDesktopOverlay: true,
      });
      assert.strictEqual(content.style.height, '');
    });

    it('is a no-op when the creative has no content element', function () {
      journeys_v2.frame.mount(iframe, '<div id="branch-banner"></div>', 'ios');
      journeys_v2.frame.fitContentHeight(iframe, {
        bannerHeight: '460px',
        isRelative: true,
        isDesktopOverlay: false,
      });
    });
  });

  describe('hideShadowForTransparentContent', function () {
    function mountContentWithBackground(background) {
      journeys_v2.frame.mount(
        iframe,
        '<div id="branch-banner"><div class="branch-banner-content" style="background-color: ' +
          background +
          '"></div></div>',
        'ios',
      );
    }

    it('sets boxShadow to none when .branch-banner-content is fully transparent', function () {
      mountContentWithBackground('rgba(0, 0, 0, 0)');
      journeys_v2.frame.hideShadowForTransparentContent(iframe);
      assert.strictEqual(iframe.style.boxShadow, 'none');
    });

    it('leaves boxShadow alone when .branch-banner-content has an opaque or partial background', function () {
      mountContentWithBackground('rgba(255, 255, 255, 1)');
      journeys_v2.frame.hideShadowForTransparentContent(iframe);
      assert.notStrictEqual(iframe.style.boxShadow, 'none');
    });

    it('is a no-op when the creative has no content element', function () {
      journeys_v2.frame.mount(iframe, '<div id="branch-banner"></div>', 'ios');
      journeys_v2.frame.hideShadowForTransparentContent(iframe);
      assert.notStrictEqual(iframe.style.boxShadow, 'none');
    });
  });

  it('teardown removes the iframe, the outer css and the cta script', function () {
    journeys_v2.frame.injectOuterCss('x');
    journeys_v2.frame.installCtaScript('void 0;');
    journeys_v2.frame.teardown(iframe);
    assert.strictEqual(document.getElementById('branch-banner-iframe'), null);
    assert.strictEqual(document.getElementById('branch-iframe-css'), null);
    assert.strictEqual(document.getElementById('branch-journey-cta'), null);
    journeys_v2.frame.teardown(null);
  });
});
