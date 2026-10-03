import { utils } from '../utils.js';
import { safejson } from '../safejson.js';
import { session } from '../session.js';

export const session_data = /** @satisfies {Record<string, unknown>} */ ({
  // Removes PII when a user disables tracking
  cleanApplicationAndSessionStorage: function (branch) {
    if (branch) {
      // clears PII from global Branch object
      branch.device_fingerprint_id = null;
      branch.sessionLink = null;
      branch.session_id = null;
      branch.identity_id = null;
      branch.identity = null;
      branch.browser_fingerprint_id = null;

      if (branch._deepviewCta) {
        delete branch._deepviewCta;
      }
      if (branch._deepviewRequestForReplay) {
        delete branch._deepviewRequestForReplay;
      }
      branch._storage.remove('branch_view_enabled');
      const data = {};
      // Sets an empty object for branch_session and branch_session_first in local/sessionStorage
      session.set(branch._storage, data, true);
    }
    // a user will need to explicitly opt out from _s cookie
  },

  /**
   * @param {Object} data
   * @return {Object}
   */
  whiteListSessionData: function (data) {
    return {
      'data': data.data || '',
      'data_parsed': data.data_parsed || {},
      'has_app': utils.getBooleanOrNull(data.has_app),
      'identity': data.identity || null,
      'developer_identity': data.identity || null,
      'referring_identity': data.referring_identity || null,
      'referring_link': data.referring_link || null,
    };
  },

  /**
   * @param {Object} sessionData
   * @return {Object} retData
   */
  whiteListJourneysLanguageData: function (sessionData) {
    const re = /^\$journeys_\S+$/;
    let data = sessionData.data;
    const retData = {};

    if (!data) {
      return {};
    }

    switch (typeof data) {
      case 'string':
        try {
          data = safejson.parse(data);
        } catch (_e) {
          data = {};
        }
        break;
      case 'object':
        // do nothing:
        break;
      default:
        data = {};
        break;
    }

    Object.keys(data).forEach(function (key) {
      const found = re.test(key);
      if (found) {
        retData[key] = data[key];
      }
    });

    return retData;
  },
});
