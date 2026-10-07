export const messages = {
  missingParam: 'API request $1 missing parameter $2',
  invalidType: 'API request $1, parameter $2 is not $3',
  nonInit: 'Branch SDK not initialized',
  initPending:
    'Branch SDK initialization pending' +
    ' and a Branch method was called outside of the queue order',
  initFailed:
    'Branch SDK initialization failed, so further methods cannot be called',
  timeout: 'Request timed out',
  blockedByClient: 'Request blocked by client, probably adblock',
  trackingDisabled:
    'Requested operation cannot be completed since tracking is disabled',
  deepviewNotCalled:
    'Cannot call Deepview CTA, please call branch.deepview() first',
  missingIdentity:
    'setIdentity - required argument identity should have a non-null value',
};

/**
 * @param message
 * @param params
 * @param failCode
 * @param failDetails
 */
export function formatMessage(
  message: string,
  params?: any[],
  failCode?: number,
  failDetails?: string,
) {
  let msg = message.replace(/\$(\d)/g, function (_, place) {
    return params[parseInt(place, 10) - 1];
  });
  if (failCode) {
    msg += '\n Failure Code:' + failCode;
  }
  if (failDetails) {
    msg += '\n Failure Details:' + failDetails;
  }
  return msg;
}
