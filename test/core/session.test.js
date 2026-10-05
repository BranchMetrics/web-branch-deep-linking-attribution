// Only src/core/session.js and src/core/context.js are imported here (no
// src/core/storage.js), to confirm session.set reaches userPreferences and
// extendedJourneysAssistExpiryTime through the context on the storage owner.

import { createContext } from '../../src/core/context.js';
import { session } from '../../src/core/session.js';

describe('session (storage.ctx)', function () {
  const assert = testUtils.unplanned();

  function makeStorage(ctx) {
    const stored = {};
    return {
      ctx: ctx,
      stored: stored,
      set: function (key, value) {
        stored[key] = value;
      },
      remove: function (key) {
        delete stored[key];
      },
    };
  }

  it('writes referringLinkExpiry when enableExtendedJourneysAssist is set', function () {
    const ctx = createContext();
    ctx.userPreferences.enableExtendedJourneysAssist = true;
    ctx.extendedJourneysAssistExpiryTime = 1000;
    const storage = makeStorage(ctx);

    const before = Date.now();
    session.set(storage, { referring_link: 'https://bnc.lt/abc' }, true);
    const after = Date.now();

    const data = JSON.parse(storage.stored['branch_session']);
    assert.ok(
      typeof data.referringLinkExpiry === 'number',
      'referringLinkExpiry is set',
    );
    assert.ok(
      data.referringLinkExpiry >= before + 1000 &&
        data.referringLinkExpiry <= after + 1000,
      'referringLinkExpiry reflects extendedJourneysAssistExpiryTime',
    );
  });

  it('does not write referringLinkExpiry with the default context', function () {
    const storage = makeStorage(createContext());
    session.set(storage, { referring_link: 'https://bnc.lt/abc' }, true);
    const data = JSON.parse(storage.stored['branch_session']);
    assert.ok(!('referringLinkExpiry' in data), 'no referringLinkExpiry');
  });

  describe('cleanApplicationAndSessionStorage', function () {
    it('clears PII from the branch and empties both sessions', function () {
      const storage = makeStorage(createContext());
      storage.stored.branch_view_enabled = 'true';
      const branch = {
        _storage: storage,
        device_fingerprint_id: 'd',
        sessionLink: 'l',
        session_id: 's',
        identity_id: 'i',
        identity: 'u',
        browser_fingerprint_id: 'b',
        _deepviewCta: function () {},
        _deepviewRequestForReplay: function () {},
      };
      session.cleanApplicationAndSessionStorage(branch);
      [
        'device_fingerprint_id',
        'sessionLink',
        'session_id',
        'identity_id',
        'identity',
        'browser_fingerprint_id',
      ].forEach(function (key) {
        assert.strictEqual(branch[key], null, key + ' is cleared');
      });
      assert.ok(!('_deepviewCta' in branch), '_deepviewCta removed');
      assert.ok(
        !('_deepviewRequestForReplay' in branch),
        '_deepviewRequestForReplay removed',
      );
      assert.deepEqual(storage.stored, {
        branch_session: '{}',
        branch_session_first: '{}',
      });
    });

    it('does nothing without a branch', function () {
      session.cleanApplicationAndSessionStorage(null);
    });
  });
});
