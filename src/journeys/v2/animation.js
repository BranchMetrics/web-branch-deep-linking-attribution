'use strict';

goog.provide('journeys_v2.animation');
goog.provide('journeys_v2.animation.Animator');

goog.require('journeys_css_animation');
goog.require('journeys_v2.frame');

/**
 * Class representing the animation lifecycle of a journey banner.
 */
journeys_v2.animation.Animator = class {
  /**
   * @param {Object} ctx The journey context.
   * @param {Element} iframe The journey iframe element.
   */
  constructor(ctx, iframe) {
    ctx = ctx || {};
    this.layout = ctx['layout'];
    this.options = ctx['options'] || {};
    this.iframe = iframe;
  }

  /**
   * Retrieves the root element to animate based on the animation surface configuration.
   *
   * @return {?Element}
   */
  getAnimationRoot() {
    if (!this.iframe) return null;

    const config = this.options['animationConfig'];
    const isIframeSurface = config && config['surface'] === 'IFRAME';

    if (isIframeSurface) return this.iframe;

    const win = this.iframe.contentWindow;
    const doc = win && win.document;
    if (!doc) return null;

    const bannerRoot = doc.getElementById(
      journeys_v2.animation.Animator.BANNER_ROOT_ID,
    );
    return bannerRoot || doc.querySelector('.branch-banner-content');
  }

  /**
   * Retrieves the appropriate animation class from the configuration.
   *
   * @param {boolean} isExit
   * @return {string}
   */
  getAnimationClass(isExit) {
    const config = this.options['animationConfig'];
    const classes = config && config['classes'];

    if (classes) {
      return isExit ? classes['exit'] : classes['enter'];
    }

    return isExit ? 'branch-banner-exit' : 'branch-banner-enter';
  }

  /**
   * Injects the generated CSS into the appropriate document.
   */
  injectAnimationCss() {
    const config = this.options['animationConfig'];
    if (!config || !config['generatedCss']) return;

    const isIframeSurface = config['surface'] === 'IFRAME';
    const win = this.iframe && this.iframe.contentWindow;
    const targetDoc = isIframeSurface ? document : win && win.document;

    if (!targetDoc || !targetDoc.head) return;

    // Prevent duplicate injections.
    if (
      targetDoc.getElementById(journeys_v2.animation.Animator.ANIMATION_CSS_ID)
    )
      return;

    targetDoc.head.appendChild(
      journeys_v2.frame.styleElement(
        targetDoc,
        journeys_v2.animation.Animator.ANIMATION_CSS_ID,
        config['generatedCss'],
      ),
    );
  }

  /**
   * Calls done() once after animationend on the element or after its
   * computed duration plus a grace period, whichever comes first.
   *
   * @param {?Element} element
   * @param {function()} done
   * @return {{cancel: function()}}
   */
  waitForAnimation(element, done) {
    let finished = false;
    const ms = element ? journeys_css_animation.durationMs(element) : 0;

    // No animation. Give the browser a chance to paint first.
    if (ms === 0) {
      const settleTimer = setTimeout(
        done,
        journeys_v2.animation.Animator.SETTLE_MS,
      );
      return { cancel: () => clearTimeout(settleTimer) };
    }

    let timer;
    const onEnd = (e) => {
      if (e && e.target !== element) return;
      if (finished) return;

      finished = true;
      clearTimeout(timer);
      element.removeEventListener('animationend', onEnd);
      done();
    };

    element.addEventListener('animationend', onEnd);
    timer = setTimeout(
      onEnd,
      ms + journeys_v2.animation.Animator.FALLBACK_GRACE_MS,
    );

    return {
      cancel: () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        element.removeEventListener('animationend', onEnd);
      },
    };
  }

  /**
   * Ensures the no-scroll CSS exists in the parent document.
   */
  ensureNoScrollCss() {
    if (
      document.getElementById(journeys_v2.animation.Animator.NO_SCROLL_CSS_ID)
    )
      return;

    const css = `.${journeys_v2.animation.Animator.NO_SCROLL_CLASS} { overflow: hidden; }`;
    document.head.appendChild(
      journeys_v2.frame.styleElement(
        document,
        journeys_v2.animation.Animator.NO_SCROLL_CSS_ID,
        css,
      ),
    );
  }

  /**
   * Calls done() once the entrance animation finishes.
   *
   * @param {function()} done
   * @return {{cancel: function()}}
   */
  enter(done) {
    document.body.classList.add(journeys_v2.animation.Animator.ACTIVE_CLASS);

    const layout = this.layout;
    if (layout && layout['isFullPage'] && layout['sticky'] === 'fixed') {
      this.ensureNoScrollCss();
      document.body.classList.add(
        journeys_v2.animation.Animator.NO_SCROLL_CLASS,
      );
    }

    this.injectAnimationCss();
    const root = this.getAnimationRoot();

    if (root) {
      root.classList.add(this.getAnimationClass(false));

      const options = this.options;
      if (options && options['entryAnimationDisabled']) {
        root.style.animation = 'none';
      }
    }

    return this.waitForAnimation(root, done);
  }

  /**
   * Calls done() once the exit animation finishes and body classes are cleared.
   *
   * @param {function()} done
   * @return {?{cancel: function()}}
   */
  exit(done) {
    const finish = () => {
      document.body.classList.remove(
        journeys_v2.animation.Animator.ACTIVE_CLASS,
        journeys_v2.animation.Animator.NO_SCROLL_CLASS,
      );
      done();
    };

    const root = this.getAnimationRoot();
    const options = this.options;

    if (!root || (options && options['exitAnimationDisabled'])) {
      finish();
      return null;
    }

    if (options && options['entryAnimationDisabled']) {
      root.style.animation = '';
    }

    root.classList.add(this.getAnimationClass(true));

    return this.waitForAnimation(root, finish);
  }
};

// Attach constants directly to the class constructor to emulate static fields
journeys_v2.animation.Animator.BANNER_ROOT_ID = 'branch-banner';
journeys_v2.animation.Animator.ACTIVE_CLASS = 'branch-banner-is-active';
journeys_v2.animation.Animator.NO_SCROLL_CLASS = 'branch-banner-no-scroll';
journeys_v2.animation.Animator.NO_SCROLL_CSS_ID = 'branch-banner-no-scroll-css';
journeys_v2.animation.Animator.ANIMATION_CSS_ID = 'branch-banner-animation-css';
journeys_v2.animation.Animator.SETTLE_MS = 20;
journeys_v2.animation.Animator.FALLBACK_GRACE_MS = 50;
