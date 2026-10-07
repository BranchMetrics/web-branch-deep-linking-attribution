import { applyNonce, type Context } from '../core/context.js';

export const CTA_SCRIPT_ID = 'branch-journey-cta';

// Runs node-api's CTA script in the page so it can reach window[callback_string].
export function installCtaScript(
  ctx: Pick<Context, 'nonce'>,
  js: string,
): HTMLScriptElement {
  const script = document.createElement('script');
  script.id = CTA_SCRIPT_ID;
  applyNonce(ctx, script);
  script.innerHTML = js;
  document.body.appendChild(script);
  return script;
}
