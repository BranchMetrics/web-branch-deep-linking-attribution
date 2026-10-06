import { Branch, wrap, callback_params } from './core.js';
import { safejson } from '../core/safejson.js';
import { utils } from '../core/utils.js';
import { resources } from '../network/resources.js';
import { session } from '../core/session.js';

/**
 * @function Branch.data
 * @param callback - _optional_ - callback to read the
 * session data.
 *
 * Returns the same session information and any referring data, as
 * `Branch.init`, but does not require the `app_id`. This is meant to be called
 * after `Branch.init` has been called if you need the session information at a
 * later point.
 * If the Branch session has already been initialized, the callback will return
 * immediately, otherwise, it will return once Branch has been initialized.
 * ___
 */
Branch.prototype.data = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done) {
    const data = utils.whiteListSessionData(session.get(this._storage));
    data.referring_link = this._referringLink();
    data.data_parsed =
      data.data && data.data.length !== 0 ? safejson.parse(data.data) : {};
    done(null, data);
  },
);

/**
 * @function Branch.first
 * @param callback - _optional_ - callback to read the
 * session data.
 *
 * Returns the same session information and any referring data, as
 * `Branch.init` did when the app was first installed. This is meant to be called
 * after `Branch.init` has been called if you need the first session information at a
 * later point.
 * If the Branch session has already been initialized, the callback will return
 * immediately, otherwise, it will return once Branch has been initialized.
 *
 * ___
 *
 */
Branch.prototype.first = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done) {
    done(null, utils.whiteListSessionData(session.get(this._storage, true)));
  },
);

/**
 * @function Branch.setIdentity
 * @param identity - _required_ - a string uniquely identifying the user - often a user ID
 * or email address.
 * @param callback - _optional_ - callback that returns the user's
 * Branch identity id and unique link.
 *
 * **Formerly `identify()`**
 *
 * Sets the identity of a user and returns the data. To use this function, pass
 * a unique string that identifies the user - this could be an email address,
 * UUID, Facebook ID, etc.
 *
 * ##### Usage
 * ```js
 * branch.setIdentity(
 *     identity,
 *     callback (err, data)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message",
 *      {
 *           identity_id:             '12345', // Server-generated ID of the user identity, stored in `sessionStorage`.
 *           link:                    'url',   // New link to use (replaces old stored link), stored in `sessionStorage`.
 *           referring_data_parsed:    { },      // Returns the initial referring data for this identity, if exists, as a parsed object.
 *           referring_identity:      '12345'  // Returns the initial referring identity for this identity, if exists.
 *      }
 * );
 * ```
 * ___
 */
Branch.prototype.setIdentity = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done, identity: string) {
    const self = this;
    if (identity) {
      const data = {
        identity_id: self.identity_id,
        session_id: self.session_id,
        link: self.sessionLink,
        developer_identity: identity,
      };
      self.identity = identity;
      // store the identity
      session.patch(self._storage, { 'identity': identity }, true);
      done(null, data);
    } else {
      done(new Error(utils.message(utils.messages.missingIdentity)));
    }
  },
);

/**
 * @function Branch.logout
 * @param callback - _optional_
 *
 * Logs out the current session, replaces session IDs and identity IDs.
 *
 * ##### Usage
 * ```js
 * branch.logout(
 *     callback (err)
 * );
 * ```
 *
 * ##### Callback Format
 * ```js
 * callback(
 *      "Error message"
 * );
 * ```
 * ___
 *
 */
Branch.prototype.logout = wrap(callback_params.CALLBACK_ERR, function (done) {
  const self = this;
  const data = {
    'identity': null,
  };

  self.identity = null;
  // make sure to update both session and local. removeNull = true deletes, in particular,
  // identity instead of inserting null in storage.
  session.patch(
    self._storage,
    data,
    /* updateLocalStorage */ true,
    /* removeNull */ true,
  );

  done(null);
});

Branch.prototype.getBrowserFingerprintId = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done) {
    const permData = session.get(this._storage, true) || {};
    done(null, permData.browser_fingerprint_id || null);
  },
);

/**
 * @function Branch.crossPlatformIds
 * @param callback - _optional_ - callback to read CPIDs
 *
 * Returns CPIDs for current user.
 *
 * ##### Usage
 * ```js
 *  branch.crossPlatformIds(
 *     callback (err, data)
 * );
 * ```
 * ___
 *
 */
Branch.prototype.crossPlatformIds = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done) {
    this._api(
      resources.crossPlatformIds,
      {
        'user_data': safejson.stringify(utils.getUserData(this)),
      },
      function (err, data) {
        return done(err || null, data?.user_data || null);
      },
    );
  },
);

/**
 * @function Branch.lastAttributedTouchData
 * @param attribution_window - the number of days to look up attribution data for
 * @param callback - _optional_ - callback to read last attributed touch data
 *
 * Returns last attributed touch data for current user. Last attributed touch data has the information associated with that user's last viewed impression or clicked link.
 *
 * ##### Usage
 * ```js
 * branch.lastAttributedTouchData(
 *     attribution_window,
 *     callback (err, data)
 * );
 * ```
 * ___
 *
 */
Branch.prototype.lastAttributedTouchData = wrap(
  callback_params.CALLBACK_ERR_DATA,
  function (done, attribution_window: number) {
    attribution_window = utils.validateParameterType(
      attribution_window,
      'number',
    )
      ? attribution_window
      : null;
    const userData = utils.getUserData(this);
    utils.addPropertyIfNotNull(
      userData,
      'attribution_window',
      attribution_window,
    );
    this._api(
      resources.lastAttributedTouchData,
      {
        'user_data': safejson.stringify(userData),
      },
      function (err, data) {
        return done(err || null, data || null);
      },
    );
  },
);

/***
 * @function Branch.referringLink
 * @param withExtendedJourneysAssist - Boolean indicating whether or not to get ReferringLink for extended Journeys Assist scenario.defaults to false.
 * Gets the referring link from storage (session, local) wih link expiry applied if provided.
 */
Branch.prototype.referringLink = function (
  withExtendedJourneysAssist?: boolean,
) {
  return this._referringLink(withExtendedJourneysAssist);
};
