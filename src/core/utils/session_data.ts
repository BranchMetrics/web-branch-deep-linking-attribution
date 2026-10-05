import { session } from '../session.js';

export const session_data = {
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
      const data: Record<string, any> = {};
      // Sets an empty object for branch_session and branch_session_first in local/sessionStorage
      session.set(branch._storage, data, true);
    }
    // a user will need to explicitly opt out from _s cookie
  },
};
