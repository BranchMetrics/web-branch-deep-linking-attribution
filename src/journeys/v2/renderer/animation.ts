import type { RenderPayload } from './types.js';

const SETTLE_MS = 20;
const FALLBACK_GRACE_MS = 50;

export interface Wait {
  cancel(): void;
}

// Only animations that end: an infinite one (e.g. a pulsing CTA) would never settle.
function finiteAnimations(
  el: HTMLElement,
): Array<{ animation: Animation; endMs: number }> {
  if (typeof el.getAnimations !== 'function') {
    return [];
  }
  return el
    .getAnimations()
    .map((animation) => ({
      animation,
      endMs: animation.effect?.getComputedTiming().endTime,
    }))
    .filter(
      (a): a is { animation: Animation; endMs: number } =>
        typeof a.endMs === 'number' && Number.isFinite(a.endMs),
    );
}

// Calls done once, always asynchronously (callers assign the returned Wait first), when
// el's own animations finish. Call it right after the class change that starts them.
// With none it waits briefly so the browser paints.
export function waitForAnimation(
  el: HTMLElement | null,
  done: () => void,
): Wait {
  let over = false;
  const finish = () => {
    if (!over) {
      over = true;
      clearTimeout(timer);
      done();
    }
  };
  const animations = el ? finiteAnimations(el) : [];
  let timer: ReturnType<typeof setTimeout>;
  if (animations.length === 0) {
    timer = setTimeout(finish, SETTLE_MS);
  } else {
    // Background tabs may never resolve finished.
    const endMs = Math.max(...animations.map((a) => a.endMs));
    timer = setTimeout(finish, endMs + FALLBACK_GRACE_MS);
    Promise.allSettled(animations.map((a) => a.animation.finished)).then(
      finish,
    );
  }
  return {
    cancel() {
      over = true;
      clearTimeout(timer);
    },
  };
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
