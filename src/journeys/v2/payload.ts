import type { JourneyLinkData } from '../link-data.js';
import type { RenderPayload } from './renderer/index.js';

// What the backend should eventually send; adapter.ts builds it until then.
export interface JourneyPayload {
  render: RenderPayload;
  view: { id: string; audienceRuleId?: string };
  // node-api's js-embed output, which holds the redirect logic.
  cta: { script: string; callbackString: string };
  dismissal: { globalPeriodSeconds?: number; redirectUrl?: string };
  linkData: JourneyLinkData;
}
