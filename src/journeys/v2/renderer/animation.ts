import { animationDurationMs } from './css-animation.js';
import type { RenderPayload } from './types.js';

const SETTLE_MS = 20;
const FALLBACK_GRACE_MS = 50;

export interface Wait {
  cancel(): void;
}

// Calls done once, on animationend or after the computed duration plus a grace period.
// With no animation it waits briefly so the browser paints.
export function waitForAnimation(
  el: HTMLElement | null,
  done: () => void,
): Wait {
  const ms = el ? animationDurationMs(el) : 0;
  if (!el || ms === 0) {
    const settle = setTimeout(done, SETTLE_MS);
    return { cancel: () => clearTimeout(settle) };
  }
  let finished = false;
  const stop = () => {
    if (finished) {
      return false;
    }
    finished = true;
    clearTimeout(timer);
    el.removeEventListener('animationend', finish);
    return true;
  };
  const finish = (event?: Event) => {
    if ((!event || event.target === el) && stop()) {
      done();
    }
  };
  el.addEventListener('animationend', finish);
  const timer = setTimeout(finish, ms + FALLBACK_GRACE_MS);
  return { cancel: stop };
}

export function enter(
  banner: HTMLElement,
  animation: RenderPayload['animation'],
  entryDisabled: boolean,
  done: () => void,
): Wait {
  banner.classList.add(animation.enterClass);
  if (entryDisabled) {
    // The backend also bakes the entrance into #branch-banner's CSS.
    banner.style.setProperty('animation', 'none');
  }
  return waitForAnimation(entryDisabled ? null : banner, done);
}

export function exit(
  banner: HTMLElement,
  animation: RenderPayload['animation'],
  exitDisabled: boolean,
  done: () => void,
): Wait {
  if (exitDisabled) {
    done();
    return { cancel() {} };
  }
  // Undo a disabled entrance's `animation: none`.
  banner.style.removeProperty('animation');
  banner.classList.remove(animation.enterClass);
  banner.classList.add(animation.exitClass);
  return waitForAnimation(banner, done);
}
