'use strict';
goog.provide('journeys_v2');

goog.require('banner_utils');
goog.require('journeys_analytics');
goog.require('journeys_dismissals');
goog.require('journeys_events');
goog.require('journeys_link_overrides');
goog.require('journeys_template');
goog.require('journeys_a11y');
goog.require('journeys_v2.animation.Animator');
goog.require('journeys_v2.context');
goog.require('journeys_v2.frame');
goog.require('journeys_v2.interactions');
goog.require('resources');
goog.require('utils');

/**
 * The currently active Journey instance.
 * @type {journeys_v2.Journey|null}
 */
journeys_v2.active = null;

/**
 * Class representing a single Journey banner lifecycle.
 */
journeys_v2.Journey = class {
  constructor(params, ctx) {
    this['ctx'] = ctx;
    this.placeholder = params['placeholder'];

    // Lifecycle State
    this.iframe = null;
    this.animator = null;
    this.pushedParents = [];
    this.cta = null;
    this.ctaWait = null;
    this.enterWait = null;

    // Flags
    this.loaded = false;
    this.shown = false;
    this.bound = false;
    this.closing = false;
  }

  /**
   * Initializes the DOM, iframe, and triggers the enter animation.
   */
  display() {
    const ctx = this['ctx'];
    try {
      this.ctaWait = journeys_v2.interactions.awaitCta(
        ctx['callbackString'],
        (cta) => {
          this.cta = cta;
        },
      );

      journeys_v2.frame.installCtaScript(ctx['template'].js);
      this.pushedParents = journeys_v2.frame.pushInjectorParents(ctx['layout']);

      this.iframe = journeys_v2.frame.createIframe();
      this.animator = new journeys_v2.animation.Animator(ctx, this.iframe);

      this.iframe.onload = () => this.onIframeLoad();
      document.body.prepend(this.iframe);
    } catch (_e) {
      this.discard();
      banner_utils.removeElement(this.placeholder);
    }
  }

  /**
   * Called when the iframe has finished loading in the DOM.
   */
  onIframeLoad() {
    const ctx = this['ctx'];
    try {
      const doc = journeys_v2.frame.mount(
        this.iframe,
        ctx['template'].bodyHtml,
        ctx['platform'],
      );

      journeys_a11y.install(doc);
      journeys_v2.frame.injectOuterCss(ctx['template'].iframeCss);
      journeys_v2.frame.injectInnerCss(this.iframe, ctx['template'].innerCss);
      journeys_v2.frame.fitContentHeight(this.iframe, ctx['layout']);
      journeys_v2.frame.hideShadowForTransparentContent(this.iframe);
      journeys_v2.frame.setCtaText(
        this.iframe,
        journeys_template.getCtaText(ctx['metadata'], ctx['hasApp']) ||
          (ctx['hasApp'] ? 'OPEN' : 'GET'),
      );

      journeys_events.publish(
        ctx['branch'],
        'willShowJourney',
        journeys_v2.context.showEventData(ctx),
      );

      this.enterWait = this.animator.enter(() => {
        this.shown = true;
        journeys_events.publish(
          ctx['branch'],
          'didShowJourney',
          ctx['linkData'],
        );
      });

      this.loaded = true;
      this.bindIfReady();

      if (utils.navigationTimingAPIEnabled) {
        utils.instrumentation['journey-load-time'] =
          utils.timeSinceNavigationStart();
      }
    } catch (_e) {
      this.discard();
    }
    banner_utils.removeElement(this.placeholder);
  }

  /**
   * Binds user interaction events once the layout is ready.
   */
  bindIfReady() {
    if (this.bound || !this.loaded) return;
    this.bound = true;

    journeys_v2.interactions.bind(this.iframe, {
      onCta: () => {
        if (!this.cta || this.closing) return;
        this.onCtaClick();
      },
      onDismiss: (eventName) => {
        if (this.closing) return;
        this.onDismiss(eventName);
      },
    });
  }

  onCtaClick() {
    const ctx = this['ctx'];
    journeys_events.publish(
      ctx['branch'],
      'didClickJourneyCTA',
      ctx['linkData'],
    );
    this.cta();
    this.close();
  }

  onDismiss(eventName) {
    const ctx = this['ctx'];
    journeys_events.publish(ctx['branch'], eventName, ctx['linkData']);
    if (ctx['testMode']) {
      this.close();
      return;
    }

    journeys_dismissals.recordGlobalDismiss(
      ctx['storage'],
      journeys_dismissals.globalDismissDeadline(ctx['metadata']),
    );
    journeys_dismissals.recordViewDismiss(
      ctx['storage'],
      ctx['templateId'],
      ctx['audienceRuleId'],
    );

    this.close(() => this.sendDismiss(eventName));
  }

  sendDismiss(eventName) {
    const ctx = this['ctx'];
    var requestData = journeys_analytics.getDismissRequestData(
      ctx['branchView'],
      utils.dismissEventToSourceMapping[eventName],
      ctx['linkData'],
      ctx['branch'],
    );

    ctx['branch']._api(resources.dismiss, requestData, (err, data) => {
      if (err) return;

      if (ctx['metadata']['dismissRedirect']) {
        window.location = ctx['metadata']['dismissRedirect'];
        return;
      }

      var eventData = data && data['event_data'];
      var branchViewData = eventData && eventData['branch_view_data'];
      if (
        !data ||
        typeof data !== 'object' ||
        !data['template'] ||
        !branchViewData
      ) {
        return;
      }

      if (ctx['branchView'].shouldDisplayJourney(data, null, false)) {
        ctx['branchView'].displayJourney(
          data['template'],
          requestData,
          requestData['branch_view_id'] || branchViewData['id'],
          branchViewData,
          false,
          data['journey_link_data'],
          ctx['branch'],
          ctx['options'],
        );
      }
    });
  }

  /**
   * Executes the exit animation and cleans up.
   */
  close(afterClose) {
    if (this.closing) return;
    this.closing = true;

    if (this.ctaWait) this.ctaWait.cancel();
    if (this.enterWait) this.enterWait.cancel();

    const ctx = this['ctx'];
    journeys_events.publish(ctx['branch'], 'willCloseJourney', ctx['linkData']);

    var finishTeardown = () => {
      journeys_v2.frame.teardown(this.iframe);
      journeys_v2.frame.resetInjectorParents(this.pushedParents);

      if (journeys_v2.active === this) {
        journeys_v2.active = null;
      }

      journeys_events.publish(
        ctx['branch'],
        'didCloseJourney',
        ctx['linkData'],
      );
      if (afterClose) afterClose();
    };

    if (this.animator) {
      this.animator.exit(finishTeardown);
    } else {
      finishTeardown();
    }
  }

  /**
   * Checks if the iframe is still attached to the document.
   */
  isLive() {
    return !!this.iframe && document.body.contains(this.iframe);
  }

  /**
   * Forcibly drops a journey whose DOM is already gone or failed unexpectedly.
   * No exit animation or close events, just releases state.
   */
  discard() {
    this.closing = true;
    if (this.ctaWait) this.ctaWait.cancel();
    if (this.enterWait) this.enterWait.cancel();

    journeys_v2.frame.teardown(this.iframe);
    journeys_v2.frame.resetInjectorParents(this.pushedParents);

    const activeClass = journeys_v2.animation.Animator
      ? journeys_v2.animation.Animator.ACTIVE_CLASS
      : 'branch-banner-is-active';
    const noScrollClass = journeys_v2.animation.Animator
      ? journeys_v2.animation.Animator.NO_SCROLL_CLASS
      : 'branch-banner-no-scroll';

    banner_utils.removeClass(document.body, activeClass);
    banner_utils.removeClass(document.body, noScrollClass);

    if (journeys_v2.active === this) {
      journeys_v2.active = null;
    }
  }
};

// ============================================================================
// GLOBAL MANAGER METHODS (Backward Compatibility)
// ============================================================================

/**
 * Initializes and displays a journey, discarding any currently active one.
 * @param {Object} params
 */
journeys_v2.displayJourney = function (params) {
  if (journeys_v2.active && !journeys_v2.active.isLive()) {
    journeys_v2.active.discard();
  }

  var html = params['html'];
  var placeholder = params['placeholder'];

  if (journeys_v2.active || !html) {
    banner_utils.removeElement(placeholder);
    return;
  }

  var ctx;
  try {
    params['html'] = journeys_link_overrides.applyCtaOverride(
      params['branch'],
      html,
    );
    ctx = journeys_v2.context.build(params);

    ctx['branchView'] = params['branchView'];
  } catch (_e) {
    banner_utils.removeElement(placeholder);
    return;
  }

  journeys_v2.active = new journeys_v2.Journey(params, ctx);
  journeys_v2.active.display();
};

/**
 * Closes the currently active journey.
 * Gated on `shown` so it can't close a journey before `didShowJourney` fires.
 */
journeys_v2.closeActiveJourney = function (callerBranch) {
  var active = journeys_v2.active;

  if (!active || !active.shown || active.closing) {
    return false;
  }

  if (!active.isLive()) {
    active.discard();
    return false;
  }

  const ctx = active['ctx'];
  journeys_events.publish(callerBranch, 'didCallJourneyClose', ctx['linkData']);
  active.close();

  return true;
};
