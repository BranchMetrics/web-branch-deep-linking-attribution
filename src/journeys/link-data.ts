import { merge, removePropertiesFromObject } from '../lib/objects.js';

// Keys stripped from journey_link_data before it is published to listeners.
export const FILTERED_LINK_KEYS = [
  'browser_fingerprint_id',
  'app_id',
  'source',
  'open_app',
  'link_click_id',
];

export interface JourneyLinkData {
  banner_id: string;
  journey_link_data?: Record<string, any>;
}

export function buildJourneyLinkData(
  templateId: string,
  raw: unknown,
): JourneyLinkData {
  const data: JourneyLinkData = { banner_id: templateId };
  if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
    const copy = merge({}, raw as Record<string, any>);
    removePropertiesFromObject(copy, FILTERED_LINK_KEYS);
    data.journey_link_data = copy;
  }
  return data;
}

export function showJourneyEventData(
  linkData: Record<string, any>,
  layout: {
    bannerHeight: string;
    isFullPage: boolean;
    position: string;
    sticky: string;
  },
): Record<string, any> {
  const eventData = Object.assign({}, linkData);
  eventData.bannerHeight = layout.bannerHeight;
  eventData.isFullPageBanner = layout.isFullPage;
  eventData.bannerPagePlacement = layout.position;
  eventData.isBannerInline = layout.sticky === 'absolute';
  eventData.isBannerSticky = layout.sticky === 'fixed';
  return eventData;
}
