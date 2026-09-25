'use strict';

var sinon = require('sinon');

goog.require('journeys_css_animation');
goog.require('journeys_v2.animation');
goog.require('journeys_v2.animation.Animator');

describe('journeys_v2.animation.Animator', function () {
  const assert = testUtils.unplanned();
  var clock;
  var iframe;

  function ctx(overrides) {
    return Object.assign(
      {
        layout: { isFullPage: false, sticky: 'absolute' },
        options: {
          entryAnimationDisabled: false,
          exitAnimationDisabled: false,
        },
      },
      overrides || {},
    );
  }

  function mount(markup) {
    iframe.contentWindow.document.body.innerHTML = markup;
    return iframe.contentWindow.document.getElementById('branch-banner');
  }

  function animationend(el) {
    var e = el.ownerDocument.createEvent('Event');
    e.initEvent('animationend', true, true);
    el.dispatchEvent(e);
  }

  beforeEach(function () {
    clock = sinon.useFakeTimers();
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
  });

  afterEach(function () {
    clock.restore();
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    document.body.className = '';
    var css = document.getElementById('branch-banner-no-scroll-css');
    if (css) {
      css.parentNode.removeChild(css);
    }
  });

  describe('waitForAnimation', function () {
    it('settles quickly when there is nothing to wait for', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var done = sinon.spy();
      animator.waitForAnimation(null, done);
      animator.waitForAnimation(mount('<div id="branch-banner"></div>'), done);
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.callCount, 2);
    });

    it('resolves on animationend from the element itself, once, and cancels the fallback', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var root = mount('<div id="branch-banner"><span></span></div>');
      root.style.animation = 'x 1s';
      var done = sinon.spy();
      animator.waitForAnimation(root, done);
      animationend(root.firstChild);
      assert.strictEqual(
        done.called,
        false,
        'ignores a child animation ending',
      );
      animationend(root);
      assert.strictEqual(done.calledOnce, true);
      animationend(root);
      clock.tick(5000);
      assert.strictEqual(done.calledOnce, true);
    });

    it('falls back to the computed duration plus grace if animationend never fires', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var root = mount('<div id="branch-banner"></div>');
      root.style.animation = 'x 0.5s ease 0.1s';
      var done = sinon.spy();
      animator.waitForAnimation(root, done);
      clock.tick(600 + journeys_v2.animation.Animator.FALLBACK_GRACE_MS - 1);
      assert.strictEqual(done.called, false);
      clock.tick(1);
      assert.strictEqual(done.calledOnce, true);
    });

    it('cancel() silences a pending animationend-based wait', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var root = mount('<div id="branch-banner"></div>');
      root.style.animation = 'x 1s';
      var done = sinon.spy();
      var wait = animator.waitForAnimation(root, done);
      wait.cancel();
      animationend(root);
      clock.tick(5000);
      assert.strictEqual(done.called, false);
    });

    it('cancel() silences a pending no-animation settle timer', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var done = sinon.spy();
      var wait = animator.waitForAnimation(null, done);
      wait.cancel();
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.called, false);
    });

    it('cancel() after done has already fired is a no-op', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var done = sinon.spy();
      var wait = animator.waitForAnimation(null, done);
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.calledOnce, true);
      wait.cancel();
      assert.strictEqual(done.calledOnce, true);
    });
  });

  describe('enter', function () {
    it('marks the body active and reports done once the entrance animation actually finishes', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var root = mount('<div id="branch-banner"></div>');
      root.style.animation = 'x 10s';
      var done = sinon.spy();
      animator.enter(done);
      assert.ok(/branch-banner-is-active/.test(document.body.className));
      assert.strictEqual(done.called, false);
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(
        done.called,
        false,
        'still genuinely waiting on the entrance animation',
      );
      animationend(root);
      assert.strictEqual(done.calledOnce, true);
    });

    it('reports done after a short settle when there is no entrance animation to wait for', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      mount('<div id="branch-banner"></div>');
      var done = sinon.spy();
      animator.enter(done);
      assert.strictEqual(done.called, false);
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.calledOnce, true);
    });

    it('returns a cancel handle that silences the pending settle', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var done = sinon.spy();
      var wait = animator.enter(done);
      wait.cancel();
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.called, false);
    });

    it('locks page scroll only for full-page fixed creatives', function () {
      var animator1 = new journeys_v2.animation.Animator(ctx(), iframe);
      mount('<div id="branch-banner"></div>');
      animator1.enter(function () {});
      assert.strictEqual(
        /branch-banner-no-scroll/.test(document.body.className),
        false,
      );

      var animator2 = new journeys_v2.animation.Animator(
        ctx({ layout: { isFullPage: true, sticky: 'fixed' } }),
        iframe,
      );
      animator2.enter(function () {});
      assert.ok(/branch-banner-no-scroll/.test(document.body.className));
      assert.ok(document.getElementById('branch-banner-no-scroll-css'));
    });

    it('honors disable_entry_animation by turning the creative animation off', function () {
      var animator = new journeys_v2.animation.Animator(
        ctx({
          options: {
            entryAnimationDisabled: true,
            exitAnimationDisabled: false,
          },
        }),
        iframe,
      );
      var root = mount('<div id="branch-banner"></div>');
      root.style.animation = 'x 1s';
      var done = sinon.spy();
      animator.enter(done);
      assert.strictEqual(root.style.animation, 'none');
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.calledOnce, true);
    });
  });

  describe('exit', function () {
    it('adds the exit class, waits for the animation, then clears body classes', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var root = mount('<div id="branch-banner"></div>');
      document.body.className =
        'branch-banner-is-active branch-banner-no-scroll';
      var done = sinon.spy();
      animator.exit(done);
      assert.ok(/branch-banner-exit/.test(root.className));

      // exit keyframes come from the served css; simulate them via inline style after the class
      root.style.animation = 'branch-slide-out-top 0.25s';
      clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
      assert.strictEqual(done.calledOnce, true);
      assert.strictEqual(
        /branch-banner-is-active|branch-banner-no-scroll/.test(
          document.body.className,
        ),
        false,
      );
    });

    it('plays the exit animation even when only entry was disabled (not just exit)', function () {
      var css = document.createElement('style');
      css.innerHTML =
        '#branch-banner.branch-banner-exit { animation: exitAnim 2s; }';
      iframe.contentWindow.document.head.appendChild(css);

      var options = {
        entryAnimationDisabled: true,
        exitAnimationDisabled: false,
      };
      var animator = new journeys_v2.animation.Animator(
        ctx({ options }),
        iframe,
      );
      var root = mount('<div id="branch-banner"></div>');

      animator.enter(function () {});
      assert.strictEqual(root.style.animation, 'none');

      var done = sinon.spy();
      animator.exit(done);
      clock.tick(1000);
      assert.strictEqual(
        done.called,
        false,
        'still genuinely waiting on the exit animation, not the entry-disabled 0-duration fallback',
      );
      animationend(root);
      assert.strictEqual(done.calledOnce, true);
    });

    it('clears the entry-disable residue even when the browser serializes the shorthand expanded (Chrome)', function () {
      var css = document.createElement('style');
      css.innerHTML =
        '#branch-banner.branch-banner-exit { animation: exitAnim 2s; }';
      iframe.contentWindow.document.head.appendChild(css);

      var root = mount('<div id="branch-banner"></div>');
      var options = {
        entryAnimationDisabled: true,
        exitAnimationDisabled: false,
      };
      var animator = new journeys_v2.animation.Animator(
        ctx({ options }),
        iframe,
      );

      animator.enter(function () {});

      var proto = Object.getPrototypeOf(root.style);
      var original = Object.getOwnPropertyDescriptor(proto, 'animation');
      Object.defineProperty(root.style, 'animation', {
        configurable: true,
        get: function () {
          return 'auto ease 0s 1 normal none running none';
        },
        set: function (v) {
          original.set.call(this, v);
        },
      });

      var done = sinon.spy();
      animator.exit(done);
      clock.tick(1000);
      assert.strictEqual(
        done.called,
        false,
        'exit animation is playing, so the inline none was cleared',
      );
      animationend(root);
      assert.strictEqual(done.calledOnce, true);
    });

    it('waits for a long exit animation instead of the default settle', function () {
      var animator = new journeys_v2.animation.Animator(ctx(), iframe);
      var root = mount('<div id="branch-banner"></div>');
      root.style.animation = 'x 2s';
      var done = sinon.spy();
      animator.exit(done);
      clock.tick(1000);
      assert.strictEqual(done.called, false);
      animationend(root);
      assert.strictEqual(done.calledOnce, true);
    });

    it('skips the wait entirely when disable_exit_animation is set or there is no #branch-banner', function () {
      var animator = new journeys_v2.animation.Animator(
        ctx({
          options: {
            entryAnimationDisabled: false,
            exitAnimationDisabled: true,
          },
        }),
        iframe,
      );
      var root = mount('<div id="branch-banner"></div>');
      root.style.animation = 'x 2s';
      var done = sinon.spy();

      animator.exit(done);
      assert.strictEqual(done.calledOnce, true);
      assert.strictEqual(/branch-banner-exit/.test(root.className), false);

      mount('');
      animator.exit(done);
      assert.strictEqual(done.callCount, 2);
    });
  });
});
