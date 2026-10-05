import { utils } from '../utils.js';

export const messages = {
  messages: {
    missingParam: 'API request $1 missing parameter $2',
    invalidType: 'API request $1, parameter $2 is not $3',
    nonInit: 'Branch SDK not initialized',
    initPending:
      'Branch SDK initialization pending' +
      ' and a Branch method was called outside of the queue order',
    initFailed:
      'Branch SDK initialization failed, so further methods cannot be called',
    existingInit: 'Branch SDK already initialized',
    missingAppId: 'Missing Branch app ID',
    callBranchInitFirst: 'Branch.init must be called first',
    timeout: 'Request timed out',
    blockedByClient: 'Request blocked by client, probably adblock',
    missingUrl: 'Required argument: URL, is missing',
    trackingDisabled:
      'Requested operation cannot be completed since tracking is disabled',
    deepviewNotCalled:
      'Cannot call Deepview CTA, please call branch.deepview() first',
    missingIdentity:
      'setIdentity - required argument identity should have a non-null value',
  },

  /**
   * @param message
   * @param params
   * @param failCode
   * @param failDetails
   */
  message: function (
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
    if (utils.debug && console) {
      console.log(msg);
    }
    return msg;
  },
};
