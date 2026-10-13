import { type A11yHandle, installA11y, isModal } from './a11y.js';
import { enter, exit, type Wait } from './animation.js';
import { ensureFonts, removeFonts } from './fonts.js';
import { bindControls } from './interactions.js';
import { type Mounted, mount, watchRemoval } from './mount.js';
import {
  applyPlacement,
  collapsePush,
  type PlacementState,
  releasePlacement,
} from './placement.js';
import type {
  RenderAction,
  RenderedJourney,
  RenderOptions,
  RenderPayload,
} from './types.js';

// The only entry point for code outside renderer/ (enforced by check-cycles.mjs).
export { animationDurationMs } from './css-animation.js';
export { isFullPage, isRelative } from './dimension.js';
export {
  HOST_ID,
  supportsCssLayers,
  supportsShadowDom,
} from './mount.js';
export type {
  Dimension,
  PlacementUnit,
  Platform,
  RenderAction,
  RenderedJourney,
  RenderOptions,
  RenderPayload,
} from './types.js';

export function render(
  payload: RenderPayload,
  opts: RenderOptions,
): RenderedJourney {
  const doc = opts.document || document;
  let mounted: Mounted | null = null;
  let placement: PlacementState | null = null;
  let unbind: (() => void) | null = null;
  let a11y: A11yHandle | null = null;
  let enterWait: Wait | null = null;
  let exitWait: Wait | null = null;
  let fontLinks: HTMLLinkElement[] = [];
  let stopWatching: (() => void) | null = null;
  let closing = false;
  let closed = false;

  const teardown = () => {
    // First, so the host's own removal below isn't reported.
    stopWatching?.();
    stopWatching = null;
    unbind?.();
    unbind = null;
    a11y?.uninstall();
    a11y = null;
    if (placement) {
      releasePlacement(placement);
      placement = null;
    }
    mounted?.host.remove();
    removeFonts(fontLinks);
    fontLinks = [];
  };

  const report = (action: RenderAction) => {
    if (!closing) {
      opts.onAction(action);
    }
  };

  try {
    fontLinks = ensureFonts(payload.fonts, {
      document: doc,
      nonce: opts.nonce,
    });
    mounted = mount(payload, {
      document: doc,
      nonce: opts.nonce,
      platform: opts.platform,
      hasApp: opts.hasApp,
    });
    placement = applyPlacement(payload, mounted.banner, {
      document: doc,
      nonce: opts.nonce,
    });
    unbind = bindControls(mounted.root, report);
    // A closing journey is left to its exit, whose timer still finishes the close.
    stopWatching = watchRemoval(doc, mounted.host, () => {
      if (!closing) {
        discard();
        opts.onRemoved?.();
      }
    });
    if (payload.creative.wcag) {
      a11y = installA11y(mounted.root, {
        modal: isModal(payload, mounted.root),
        onEscape: () => report('close'),
      });
    }
    enterWait = enter(
      mounted.banner,
      payload.animation,
      !!opts.entryAnimationDisabled,
      () => {
        enterWait = null;
        a11y?.focusFirst();
        opts.onShown?.();
      },
    );
  } catch (e) {
    teardown();
    throw e;
  }

  const { banner, host } = mounted;
  const { animation } = payload;
  const stopEntering = () => {
    enterWait?.cancel();
    enterWait = null;
  };
  const discard = () => {
    closing = true;
    closed = true;
    stopEntering();
    exitWait?.cancel();
    exitWait = null;
    teardown();
  };

  return {
    isLive: () => !closed && doc.body.contains(host),
    bannerHeight: () => banner.offsetHeight,
    close(onClosed) {
      if (closing) {
        return false;
      }
      closing = true;
      // Mid-entrance the exit keyframes, which start from fully shown, would make the
      // banner jump into place first, so it goes at once instead.
      const skipExit = !!opts.exitAnimationDisabled || enterWait !== null;
      stopEntering();
      if (placement) {
        collapsePush(placement);
      }
      exitWait = exit(banner, animation, skipExit, () => {
        exitWait = null;
        closed = true;
        teardown();
        onClosed?.();
      });
      return true;
    },
    discard,
  };
}
