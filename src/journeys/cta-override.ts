export const JOURNEYS_CTA_KEY = '$journeys_cta';

export function getBranchViewDataItem(branch: any, key: string): any {
  const data = branch?._branchViewData?.data;
  return data ? data[key] : undefined;
}

// setBranchViewData({data: {$journeys_cta}}) overrides every redirect in node-api's CTA
// script. String surgery on the script, exactly as v1 has always done it.
export function applyCtaOverride(branch: any, html: string): string {
  try {
    const link = getBranchViewDataItem(branch, JOURNEYS_CTA_KEY);
    if (link && link.length > 0) {
      const replaced = html.replace(
        /validate[(].+[)];/g,
        'validate("' + link + '")',
      );
      return replaced.replace(
        'window.top.location.replace(',
        'window.top.location = ',
      );
    }
  } catch (_e) {
    return html;
  }
  return html;
}
