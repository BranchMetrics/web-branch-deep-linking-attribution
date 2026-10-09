import type { Context } from '../../core/context.js';
import { getPlatformByUserAgent } from '../../core/platform.js';
import { getEnv, navigationTimingAPIEnabled } from '../../env/env.js';
import { dismissEventToSourceMapping } from '../constants.js';
import {
  globalDismissDeadline,
  recordGlobalDismiss,
  recordViewDismiss,
} from '../dismissals.js';
import { buildDismissRequestData, sendDismiss } from '../dismiss-request.js';
import { showJourneyEventData } from '../link-data.js';
import { type CtaHandle, startCta } from './cta.js';
import type { JourneyPayload } from './payload.js';
import {
  isFullPage,
  type Platform,
  type RenderAction,
  type RenderedJourney,
  render,
} from './renderer/index.js';

const DISMISS_EVENTS: Record<Exclude<RenderAction, 'cta'>, string> = {
  close: 'didClickJourneyClose',
  continue: 'didClickJourneyContinue',
  'background-click': 'didClickJourneyBackgroundDismiss',
  'background-swipe': 'didScrollJourneyBackgroundDismiss',
};

function rendererPlatform(): Platform {
  const platform = getPlatformByUserAgent();
  if (platform === 'ios' || platform === 'ipad') {
    return 'ios';
  }
  return platform === 'android' ? 'android' : 'other';
}

export const NOT_SHOWN_ERROR = 'Journey already dismissed.';

export interface JourneyDeps {
  branch: any;
  branchView: any;
  hasApp: boolean;
  testMode: boolean;
  entryAnimationDisabled: boolean;
  exitAnimationDisabled: boolean;
  onFinished(journey: Journey): void;
}

// Maps the renderer's controls to Web SDK behavior (events, dismissals, CTA). Every
// close path goes through beginClose(), so a journey closes once.
export class Journey {
  private closing = false;
  private rendered: RenderedJourney | null = null;
  private cta: CtaHandle | null = null;
  private closeCallbacks: Array<(err?: string) => void> = [];

  private readonly view: JourneyPayload['view'];
  private readonly dismissal: JourneyPayload['dismissal'];
  private readonly linkData: JourneyPayload['linkData'];
  private readonly deps: JourneyDeps;

  constructor(payload: JourneyPayload, deps: JourneyDeps) {
    this.view = payload.view;
    this.dismissal = payload.dismissal;
    this.linkData = payload.linkData;
    this.deps = deps;
  }

  private get ctx(): Context {
    return this.deps.branch._ctx;
  }

  // False means use v1. Everything that can fail runs before the CTA script: v1 would run
  // it again and auto-open the app twice.
  show(payload: JourneyPayload): boolean {
    let showData: Record<string, any>;
    try {
      const { deps } = this;
      this.rendered = render(payload.render, {
        nonce: this.ctx.nonce,
        platform: rendererPlatform(),
        hasApp: deps.hasApp,
        entryAnimationDisabled: deps.entryAnimationDisabled,
        exitAnimationDisabled: deps.exitAnimationDisabled,
        onAction: (action) => {
          if (action === 'cta') {
            this.onCta();
          } else {
            this.onDismiss(DISMISS_EVENTS[action]);
          }
        },
        onShown: () => this.publish('didShowJourney'),
        onRemoved: () => this.discard(),
      });
      showData = this.showEventData(payload);
      if (navigationTimingAPIEnabled) {
        this.ctx.instrumentation['journey-load-time'] =
          getEnv().timeSinceNavigationStart();
      }
      // After mount: the script may auto-open the app.
      this.cta = startCta(payload.cta, this.ctx);
    } catch (_e) {
      this.discard();
      return false;
    }
    this.publish('willShowJourney', showData);
    return true;
  }

  isLive(): boolean {
    return !!this.rendered && this.rendered.isLive();
  }

  isClosing(): boolean {
    return this.closing;
  }

  // A journey still entering is on screen, so it closes like a shown one.
  closeFromApi(callerBranch: any, cb: (err?: string) => void): void {
    if (!this.isLive()) {
      cb(NOT_SHOWN_ERROR);
      return;
    }
    this.closeCallbacks.push(cb);
    if (!this.beginClose()) {
      return;
    }
    this.publish('didCallJourneyClose', undefined, callerBranch);
    this.runClose();
  }

  // Silent teardown: no close events; pending closeJourney callbacks get an error.
  discard(): void {
    this.closing = true;
    this.rendered?.discard();
    this.finish();
    for (const cb of this.takeCloseCallbacks()) {
      cb(NOT_SHOWN_ERROR);
    }
  }

  private finish(): void {
    this.cta?.stop();
    this.cta = null;
    this.deps.onFinished(this);
  }

  private takeCloseCallbacks(): Array<(err?: string) => void> {
    const callbacks = this.closeCallbacks;
    this.closeCallbacks = [];
    return callbacks;
  }

  private beginClose(): boolean {
    if (this.closing) {
      return false;
    }
    this.closing = true;
    return true;
  }

  private onCta(): void {
    if (!this.cta?.isReady() || !this.beginClose()) {
      return;
    }
    this.publish('didClickJourneyCTA');
    try {
      this.cta.run();
    } catch (_e) {
      // Still close if the CTA throws (e.g. blocked top navigation).
    }
    this.runClose();
  }

  private onDismiss(eventName: string): void {
    if (!this.beginClose()) {
      return;
    }
    this.publish(eventName);
    const { deps } = this;
    if (!deps.testMode) {
      try {
        recordGlobalDismiss(
          deps.branch._storage,
          globalDismissDeadline({
            globalDismissPeriod: this.dismissal.globalPeriodSeconds,
          }),
        );
        recordViewDismiss(
          deps.branch._storage,
          this.view.id,
          this.view.audienceRuleId,
        );
      } catch (_e) {
        // Storage can throw (quota, privacy mode); still close.
      }
    }

    this.runClose(eventName);
  }

  // eventName is set only for a user dismiss.
  private runClose(eventName?: string): void {
    this.publish('willCloseJourney');
    (this.rendered as RenderedJourney).close(() => this.finishClose(eventName));
  }

  private finishClose(eventName?: string): void {
    this.finish();
    this.publish('didCloseJourney');
    if (eventName && !this.deps.testMode) {
      const { branch, branchView } = this.deps;
      sendDismiss({
        branch,
        requestData: buildDismissRequestData({
          branch,
          branchView,
          source: dismissEventToSourceMapping[eventName],
          linkData: this.linkData,
        }),
        dismissRedirect: this.dismissal.redirectUrl,
      });
    }
    for (const cb of this.takeCloseCallbacks()) {
      cb();
    }
  }

  private linkDataCopy(): Record<string, any> {
    return JSON.parse(JSON.stringify(this.linkData));
  }

  // A throwing listener mustn't strand a half-closed journey that blocks later ones.
  private publish(
    event: string,
    data?: Record<string, any>,
    branch = this.deps.branch,
  ): void {
    try {
      branch._publishEvent(event, data || this.linkDataCopy());
    } catch (_e) {}
  }

  private showEventData(payload: JourneyPayload): Record<string, any> {
    const placement = payload.render.placement;
    return showJourneyEventData(this.linkDataCopy(), {
      // px, as v1 reported it, not the placement's own unit.
      bannerHeight: `${(this.rendered as RenderedJourney).bannerHeight()}px`,
      isFullPage: isFullPage(placement),
      position: placement.anchorY,
      sticky: placement.sticky,
    });
  }
}
