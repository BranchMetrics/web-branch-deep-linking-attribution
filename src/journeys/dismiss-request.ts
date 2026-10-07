import { getEnv } from '../env/env.js';
import { decodeSymbols } from '../lib/encoding.js';
import { addPropertyIfNotNull } from '../lib/objects.js';
import { resources } from '../network/resources.js';
import { getPageviewMetadata } from './pageview-metadata.js';

export function buildDismissRequestData(args: {
  branch: any;
  branchView: any;
  source: string | undefined;
  linkData: { journey_link_data?: Record<string, any> } | null;
}): Record<string, any> {
  const { branch, branchView, source, linkData } = args;
  const metadata: Record<string, any> = {};
  const hostedDeeplinkData = getEnv().hostedDeepLinkData();
  if (hostedDeeplinkData && Object.keys(hostedDeeplinkData).length > 0) {
    metadata.hosted_deeplink_data = hostedDeeplinkData;
  }
  const requestData = branchView._getPageviewRequestData(
    getPageviewMetadata(null, metadata, branch._ctx),
    null,
    branch,
    true,
  );
  const jld = linkData?.journey_link_data;
  if (jld) {
    addPropertyIfNotNull(requestData, 'journey_id', jld.journey_id);
    addPropertyIfNotNull(
      requestData,
      'journey_name',
      decodeSymbols(jld.journey_name),
    );
    addPropertyIfNotNull(requestData, 'view_id', jld.view_id);
    addPropertyIfNotNull(
      requestData,
      'view_name',
      decodeSymbols(jld.view_name),
    );
    addPropertyIfNotNull(requestData, 'channel', decodeSymbols(jld.channel));
    addPropertyIfNotNull(requestData, 'campaign', decodeSymbols(jld.campaign));
    try {
      addPropertyIfNotNull(requestData, 'tags', JSON.stringify(jld.tags));
    } catch (_e) {
      requestData.tags = JSON.stringify([]);
    }
  }
  addPropertyIfNotNull(requestData, 'dismissal_source', source);
  return requestData;
}

// The response body is ignored: node-api's /v1/dismiss always answers 200 {}
// since it stopped returning follow-up journeys (branch-backend #7501).
export function sendDismiss(args: {
  branch: any;
  requestData: Record<string, any>;
  dismissRedirect?: string;
}): void {
  const { branch, requestData, dismissRedirect } = args;
  branch._api(resources.dismiss, requestData, function (err) {
    if (!err && dismissRedirect) {
      (window as any).location = dismissRedirect;
    }
  });
}
