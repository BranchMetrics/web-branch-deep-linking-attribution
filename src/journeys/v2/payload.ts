import type { JourneyLinkData } from '../link-data.js';
import type { RenderPayload } from './renderer/index.js';

// The banner_payload format this SDK reads.
export const BANNER_PAYLOAD_VERSION = 1;

// The server sends render, dismissal and cta.script; response.ts adds the rest.
export interface JourneyPayload {
  render: RenderPayload;
  view: { id: string; audienceRuleId?: string };
  // node-api's js-embed output, which holds the redirect logic.
  cta: { script: string; callbackString: string };
  dismissal: { globalPeriodSeconds?: number; redirectUrl?: string };
  linkData: JourneyLinkData;
}
