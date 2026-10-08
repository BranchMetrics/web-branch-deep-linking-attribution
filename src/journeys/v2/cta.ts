import { banner_utils } from '../../banner/banner-utils.js';
import type { Context } from '../../core/context.js';
import { installCtaScript } from '../cta-script.js';

export const NOOP = function () {};

interface CtaWait {
  cancel(): void;
}

// Settles once (callback, timeout or cancel), then leaves a no-op on the global.
export function awaitCta(
  callbackString: string,
  timeoutMs: number,
  onCta: (cta: unknown) => void,
): CtaWait {
  let settled = false;
  const settle = () => {
    settled = true;
    clearTimeout(timer);
    (window as any)[callbackString] = NOOP;
  };
  const timer = setTimeout(settle, timeoutMs);
  (window as any)[callbackString] = function (cta: unknown) {
    if (settled) {
      return;
    }
    settle();
    onCta(cta);
  };
  return { cancel: settle };
}

export interface CtaHandle {
  isReady(): boolean;
  run(): void;
  stop(): void;
}

export function startCta(
  cta: { script: string; callbackString: string },
  ctx: Pick<Context, 'nonce' | 'timeout'>,
): CtaHandle {
  let fn: unknown = null;
  // Registered before the script runs: it calls back synchronously.
  const wait = awaitCta(cta.callbackString, ctx.timeout, (handed) => {
    fn = handed;
  });
  let script: HTMLScriptElement;
  try {
    script = installCtaScript(ctx, cta.script);
  } catch (e) {
    // v1 takes over and registers its own callback; don't let our timeout clobber it.
    wait.cancel();
    throw e;
  }
  return {
    isReady: () => typeof fn === 'function',
    run: () => {
      if (typeof fn === 'function') {
        (fn as () => void)();
      }
    },
    stop: () => {
      wait.cancel();
      banner_utils.removeElement(script);
    },
  };
}
