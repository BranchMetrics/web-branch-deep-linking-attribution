import { utils } from '../utils.js';
import { formatMessage } from '../../lib/messages.js';

export const messages = {
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
    const msg = formatMessage(message, params, failCode, failDetails);
    if (utils.debug && console) {
      console.log(msg);
    }
    return msg;
  },
};
