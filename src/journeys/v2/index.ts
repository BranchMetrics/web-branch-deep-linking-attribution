import { log } from '../../core/context.js';
import {
  type AdapterInput,
  type FallbackReason,
  toPayload,
} from './adapter.js';
import { Journey, type JourneyDeps, NOT_SHOWN_ERROR } from './journey.js';
import type { JourneyPayload } from './payload.js';
import { supportsCssLayers, supportsShadowDom } from './renderer/index.js';

type RenderDeps = Omit<JourneyDeps, 'onFinished'>;

const FALLBACK_INSTRUMENTATION_KEY = 'journey-v2-fallback';

let active: Journey | null = null;
let waiting: Array<() => void> = [];

// Sent with the next /v1/url request's instrumentation.
function recordFallback(branch: any, reason: FallbackReason): void {
  log(branch._ctx, `Journeys v2 fell back to v1: ${reason}`);
  branch._ctx.instrumentation[FALLBACK_INSTRUMENTATION_KEY] = reason;
}

// A journey whose host was removed out of band (SPA re-render) is discarded first, in
// case the renderer hasn't noticed yet. A closing one isn't: its exit still finishes the
// close, which sends the dismissal.
export function v2JourneyState(): 'none' | 'shown' | 'closing' {
  if (active && !active.isLive() && !active.isClosing()) {
    active.discard();
  }
  if (!active) {
    return 'none';
  }
  return active.isClosing() ? 'closing' : 'shown';
}

// Runs after the closing journey finishes, newest first so the latest pageview wins.
export function whenV2Closed(run: () => void): void {
  waiting.unshift(run);
}

function runWaiting(): void {
  const runs = waiting;
  waiting = [];
  if (runs.length > 0) {
    setTimeout(() => {
      for (const run of runs) {
        run();
      }
    }, 0);
  }
}

// Null (fallback recorded) means render with v1.
export function prepareV2(
  input: AdapterInput,
  branch: any,
): JourneyPayload | null {
  let reason: FallbackReason | null = null;
  if (!supportsShadowDom()) {
    reason = 'no-shadow-dom';
  } else if (!supportsCssLayers()) {
    reason = 'no-css-layers';
  } else {
    const result = toPayload(input, branch);
    if ('payload' in result) {
      return result.payload;
    }
    reason = result.fallback;
  }
  recordFallback(branch, reason);
  return null;
}

// False (fallback recorded) means render with v1. See Journey.show().
export function showV2(payload: JourneyPayload, deps: RenderDeps): boolean {
  const journey = new Journey(payload, {
    ...deps,
    onFinished: (finished) => {
      if (active === finished) {
        active = null;
        runWaiting();
      }
    },
  });
  active = journey;
  const handled = journey.show(payload);
  if (!handled) {
    recordFallback(deps.branch, 'render-error');
  }
  return handled;
}

export function closeV2Journey(
  callerBranch: any,
  cb: (err?: string) => void,
): void {
  if (v2JourneyState() === 'none') {
    cb(NOT_SHOWN_ERROR);
    return;
  }
  (active as Journey).closeFromApi(callerBranch, cb);
}

export function resetV2ForTests(): void {
  waiting = [];
  active?.discard();
  active = null;
}
