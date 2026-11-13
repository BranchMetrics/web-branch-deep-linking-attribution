import { log } from '../../core/context.js';
import { Journey, type JourneyDeps, NOT_SHOWN_ERROR } from './journey.js';
import { BANNER_PAYLOAD_VERSION, type JourneyPayload } from './payload.js';
import { supportsCssLayers, supportsShadowDom } from './renderer/index.js';

type RenderDeps = Omit<JourneyDeps, 'onFinished'>;

let active: Journey | null = null;
let waiting: Array<() => void> = [];

// Browsers that can't run v2 don't ask, so the server sends them only the template.
export function bannerPayloadVersion(): number | undefined {
  return supportsShadowDom() && supportsCssLayers()
    ? BANNER_PAYLOAD_VERSION
    : undefined;
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

// False (fallback logged) means render with v1. See Journey.show().
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
    log(deps.branch._ctx, 'Journeys v2 fell back to v1: render-error');
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
