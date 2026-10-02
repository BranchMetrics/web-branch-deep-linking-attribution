import { storage as branchStorage } from '../../src/core/storage.js';

const BRANCH_KEY_PREFIX = 'BRANCH_WEBSDK_KEY';
const ITEM_KEY = 'key';
const ITEM_KEY_UNSTORED = 'key unstored';
const ITEM_VALUE = 'value';

describe('session storage', function () {
  const storage = new branchStorage.BranchStorage(['session']);
  const assert = testUtils.unplanned();
  beforeEach(function () {
    storage.clear();
  });

  it('should set an item', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    assert.strictEqual(
      sessionStorage.getItem(BRANCH_KEY_PREFIX + ITEM_KEY),
      ITEM_VALUE,
      'key / vaue stored',
    );
  });

  it('should get stored item with key', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
  });

  it('should return null for an unstored item', function () {
    const item = storage.get(ITEM_KEY_UNSTORED);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should remove an item', function () {
    storage.set(ITEM_KEY, ITEM_VALUE, 'session');
    storage.remove(ITEM_KEY);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should clear all items', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    storage.clear();
    assert.deepEqual(sessionStorage.getItem(ITEM_KEY), null, 'Storage cleared');
  });
});

describe('local storage', function () {
  const storage = new branchStorage.BranchStorage(['local']);
  const assert = testUtils.unplanned();
  beforeEach(function () {
    storage.clear();
  });

  it('should set an item in localStorage', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    assert.strictEqual(
      localStorage.getItem(BRANCH_KEY_PREFIX + ITEM_KEY),
      ITEM_VALUE,
      'key / vaue stored',
    );
  });

  it('should get stored item with key', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
  });

  it('should return null for an unstored item', function () {
    const item = storage.get(ITEM_KEY_UNSTORED);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should remove an item', function () {
    storage.set(ITEM_KEY, ITEM_VALUE, 'session');
    storage.remove(ITEM_KEY);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should clear all items', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    storage.clear();
    assert.deepEqual(localStorage.getItem(ITEM_KEY), null, 'Storage cleared');
  });
});

describe('cookie storage', function () {
  const storage = new branchStorage.BranchStorage(['cookie']);
  const ITEM_KEY = 'branch_session';
  const ITEM_VALUE = 'test_val';
  const assert = testUtils.unplanned();

  // sets non-Branch cookies
  document.cookie = 'non_branch_cookie_1=abc';
  document.cookie = 'non_branch_cookie_2=def';
  document.cookie = 'non_branch_cookie_3=ghi';

  it('should get stored item with key', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(
      item,
      ITEM_VALUE,
      'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]',
    );
  });

  it('should return null for an un-stored item', function () {
    const item = storage.get('not_an_item');
    assert.strictEqual(item, null, 'returned null');
  });

  it('should remove a Branch cookie', function () {
    storage.remove(ITEM_KEY);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should remove a Branch cookie that is not branch_session or branch_session_first', function () {
    const cookieName = 'test_1';
    const cookieValue = '123';
    storage.set(cookieName, cookieValue);
    storage.remove(cookieName);
    const item = storage.get(cookieName);
    assert.strictEqual(item, null, ' returned null');
  });

  it('should clear all Branch cookies', function () {
    const testCookies = {
      'key_1': 'val_1',
      'branch_session': 'val_2',
      'branch_session_first': 'val_3',
    };
    for (const key in testCookies) {
      if (Object.prototype.hasOwnProperty.call(testCookies, key)) {
        storage.set(key, testCookies[key]);
      }
    }
    storage.clear();
    let item = null;
    for (const key in testCookies) {
      if (Object.prototype.hasOwnProperty.call(testCookies, key)) {
        item = storage.get(testCookies[key]);
        assert.strictEqual(item, null, ' returned null');
      }
    }
  });

  it('should return all Branch cookies', function () {
    const expected = {
      'key_1': 'val_1',
      'branch_session': 'val_2',
      'branch_session_first': 'val_3',
    };
    for (const key in expected) {
      if (Object.prototype.hasOwnProperty.call(expected, key)) {
        storage.set(key, expected[key]);
      }
    }
    const actual = storage.getAll();
    assert.strictEqual(
      Object.keys(expected).length,
      Object.keys(actual).length,
      'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]',
    );
    for (const key in actual) {
      if (Object.prototype.hasOwnProperty.call(actual, key)) {
        assert.strictEqual(
          actual[key],
          expected[key],
          ' correct value for key',
        );
      }
    }
    const nonBranchCookies = {
      'non_branch_cookie_1': 'abc',
      'non_branch_cookie_2': 'def',
      'non_branch_cookie_3': 'ghi',
    };
    for (const key in nonBranchCookies) {
      // check whether original Branch cookies are returned
      if (Object.prototype.hasOwnProperty.call(nonBranchCookies, key)) {
        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(actual, key),
          false,
          'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]',
        );
      }
    }
  });

  it('non-Branch cookies should remain after clearing storage', function () {
    storage.clear();
    const expected = {
      'non_branch_cookie_1': 'abc',
      'non_branch_cookie_2': 'def',
      'non_branch_cookie_3': 'ghi',
    };
    const cookiesArray = document.cookie.split(';');
    let cookiesFound = 0;
    for (let i = 0; i < cookiesArray.length; i++) {
      const cookie = cookiesArray[i].trim();
      const firstEqualSign = cookie.indexOf('=');
      const cookieName = cookie.substring(0, firstEqualSign);
      const cookieValue = cookie.substring(firstEqualSign + 1, cookie.length);
      if (
        Object.prototype.hasOwnProperty.call(expected, cookieName) &&
        expected[cookieName] === cookieValue
      ) {
        cookiesFound += 1;
      }
    }
    assert.strictEqual(
      3,
      cookiesFound,
      'Cookie not stored. [This may not work in some browsers with a file: URL, e.g. Chrome.]',
    );
  });
});

describe('pojo storage', function () {
  const storage = new branchStorage.BranchStorage(['pojo']);
  const assert = testUtils.unplanned();
  beforeEach(function () {
    storage.clear();
  });

  it('should set a temporary item', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    assert.strictEqual(
      storage._store[ITEM_KEY],
      ITEM_VALUE,
      'key / vaue stored',
    );
  });

  it('should get stored item with key', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, ITEM_VALUE, 'correct value with key');
  });

  it('should return null for an unstored item', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    const item = storage.get(ITEM_KEY_UNSTORED);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should remove an item', function () {
    storage.set(ITEM_KEY, ITEM_VALUE, 'session');
    storage.remove(ITEM_KEY);
    const item = storage.get(ITEM_KEY);
    assert.strictEqual(item, null, 'returned null');
  });

  it('should clear all items', function () {
    storage.set(ITEM_KEY, ITEM_VALUE);
    storage.clear();
    assert.deepEqual(storage._store[ITEM_KEY], null, 'Storage cleared');
  });
});
