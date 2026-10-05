import { safejson } from './safejson.js';
import { utils } from './state.js';
import { decodeBFPs, encodeBFPs } from '../lib/encoding.js';
import { merge as mergeObjects } from '../lib/objects.js';
// Not referenced here: loads storage before session and utils, keeping the
// module order in build.min.js.
import './storage.js';

export const session = {};

/**
 * @param {Object} storage
 * @param {boolean=} first
 * @return {Object}
 */
session.get = function (storage, first) {
  const sessionString = first ? 'branch_session_first' : 'branch_session';
  try {
    const data = safejson.parse(storage.get(sessionString, first)) || null;
    return decodeBFPs(data);
  } catch (_e) {
    return null;
  }
};

/**
 * @param {Object} storage
 * @param {Object} data
 * @param {boolean=} first
 */
session.set = function (storage, data, first) {
  if (
    first &&
    data.referring_link &&
    utils.userPreferences.enableExtendedJourneysAssist
  ) {
    const now = new Date();
    data.referringLinkExpiry =
      now.getTime() + utils.extendedJourneysAssistExpiryTime;
  }
  data = encodeBFPs(data);
  storage.set('branch_session', safejson.serialize(data));
  if (first) {
    storage.set('branch_session_first', safejson.serialize(data), true);
  }
};

/**
 * @param {Object} storage
 * @param {Object} newData
 */
session.update = function (storage, newData) {
  if (!newData) {
    return;
  }
  const currentData = session.get(storage) || {};
  const data = safejson.serialize(
    encodeBFPs(mergeObjects(currentData, newData)),
  );
  storage.set('branch_session', data);
};

/**
 * Patches a field in localStorage or sessionStorage or both.
 * @param {Object} storage
 * @param {Object} data
 * @param {boolean=} updateLocalStorage
 * @param {boolean=} removeNull delete null or undefined entries instead of inserting
 */
session.patch = function (storage, data, updateLocalStorage, removeNull) {
  const merge = function (source, patch) {
    return encodeBFPs(mergeObjects(safejson.parse(source), patch, removeNull));
  };

  const session = storage.get('branch_session', false) || {};
  storage.set('branch_session', safejson.serialize(merge(session, data)));

  if (updateLocalStorage) {
    const sessionFirst = storage.get('branch_session_first', true) || {};
    storage.set(
      'branch_session_first',
      safejson.serialize(merge(sessionFirst, data)),
      true,
    );
  }
};
