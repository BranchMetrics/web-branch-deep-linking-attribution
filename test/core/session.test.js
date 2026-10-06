// Only src/core/session.js and src/core/utils.js are imported here (no
// src/core/storage.js), to confirm session.set can still reach
// utils.userPreferences and utils.extendedJourneysAssistExpiryTime now that
// it imports `utils` from src/core/state.js instead of src/core/utils.js.
import { session } from '../../src/core/session.js';
import { utils } from '../../src/core/utils.js';

describe('session (state leaf)', function () {
  const assert = testUtils.unplanned();

  it('writes referringLinkExpiry when enableExtendedJourneysAssist is set', function () {
    const originalEnabled = utils.userPreferences.enableExtendedJourneysAssist;
    const originalExpiry = utils.extendedJourneysAssistExpiryTime;
    utils.userPreferences.enableExtendedJourneysAssist = true;
    utils.extendedJourneysAssistExpiryTime = 1000;

    const stored = {};
    const storage = {
      set: function (key, value) {
        stored[key] = value;
      },
    };

    try {
      const before = Date.now();
      session.set(storage, { referring_link: 'https://bnc.lt/abc' }, true);
      const after = Date.now();

      const data = JSON.parse(stored['branch_session']);
      assert.ok(
        typeof data.referringLinkExpiry === 'number',
        'referringLinkExpiry is set',
      );
      assert.ok(
        data.referringLinkExpiry >= before + 1000 &&
          data.referringLinkExpiry <= after + 1000,
        'referringLinkExpiry reflects extendedJourneysAssistExpiryTime',
      );
    } finally {
      utils.userPreferences.enableExtendedJourneysAssist = originalEnabled;
      utils.extendedJourneysAssistExpiryTime = originalExpiry;
    }
  });
});
