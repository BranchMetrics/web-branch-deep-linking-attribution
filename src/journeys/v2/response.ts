import { applyCtaOverride } from '../cta-override.js';
import { buildJourneyLinkData } from '../link-data.js';
import { BANNER_PAYLOAD_VERSION, type JourneyPayload } from './payload.js';
import type { RenderPayload } from './renderer/index.js';

// banner_payload as the server sends it. The SDK adds view, cta.callbackString and
// linkData from its own request and the rest of the response.
export interface ServerBannerPayload {
  version: number;
  render: RenderPayload;
  dismissal: JourneyPayload['dismissal'];
  cta: { script: string };
}

export interface PageviewResponse {
  event_data?: {
    branch_view_data?: { id?: string; audience_rule_id?: string };
  };
  use_v2_renderer?: boolean;
  // v1's template; with banner_payload, also the fallback if v2 fails to render.
  template?: string;
  journey_link_data?: Record<string, any> | null;
  animationConfig?: Record<string, any> | null;
  // Only when the request asked for it and the server built one.
  banner_payload?: ServerBannerPayload;
}

// Null means render v1 from the template. A payload this request didn't ask for, or one
// without a render or CTA script, isn't used: v1 then runs the template's own script.
export function bannerPayloadFrom(
  response: PageviewResponse,
  requestData: { callback_string: string; banner_payload?: number },
  view: { templateId: string; audienceRuleId?: string },
  branch: any,
): JourneyPayload | null {
  const server = response.banner_payload;
  if (
    !server ||
    !requestData.banner_payload ||
    server.version !== BANNER_PAYLOAD_VERSION ||
    !server.render ||
    typeof server.cta?.script !== 'string'
  ) {
    return null;
  }
  return {
    render: server.render,
    // Journey reads its fields on every dismiss.
    dismissal: server.dismissal || {},
    cta: {
      script: applyCtaOverride(branch, server.cta.script),
      callbackString: requestData.callback_string,
    },
    view: { id: view.templateId, audienceRuleId: view.audienceRuleId },
    linkData: buildJourneyLinkData(view.templateId, response.journey_link_data),
  };
}
