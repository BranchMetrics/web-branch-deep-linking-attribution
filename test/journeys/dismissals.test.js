import { storage as storageModule } from '../../src/core/storage.js';
import {
  addSecondsToNow,
  globalDismissDeadline,
  isDismissedGlobally,
  recordGlobalDismiss,
  recordViewDismiss,
} from '../../src/journeys/dismissals.js';

describe('journeys/dismissals', () => {
  let store;
  beforeEach(() => {
    localStorage.clear();
    store = new storageModule.BranchStorage(['local']);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('addSecondsToNow returns a ms timestamp seconds from now', () => {
    expect(addSecondsToNow(60)).toBe(Date.now() + 60000);
  });

  it('globalDismissDeadline maps -1 to true, seconds to a timestamp, other values to undefined', () => {
    expect(globalDismissDeadline({ globalDismissPeriod: -1 })).toBe(true);
    expect(globalDismissDeadline({ globalDismissPeriod: 60 })).toBe(
      Date.parse('2026-01-15T12:01:00Z'),
    );
    expect(
      globalDismissDeadline({ globalDismissPeriod: '60' }),
    ).toBeUndefined();
    expect(globalDismissDeadline({})).toBeUndefined();
  });

  it('recordGlobalDismiss stores a deadline and isDismissedGlobally honours and expires it', () => {
    recordGlobalDismiss(store, undefined);
    expect(isDismissedGlobally(store)).toBe(false);
    recordGlobalDismiss(store, Date.now() + 1000);
    expect(isDismissedGlobally(store)).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(isDismissedGlobally(store)).toBe(false);
    expect(store.get('globalJourneysDismiss', true)).toBeFalsy();
  });

  it('recordViewDismiss merges dismissals keyed by audience rule', () => {
    recordViewDismiss(store, 'view-1', 'rule-1');
    const all = recordViewDismiss(store, 'view-2', 'rule-2');
    expect(all).toEqual({
      'rule-1': { view_id: 'view-1', dismiss_time: Date.now() },
      'rule-2': { view_id: 'view-2', dismiss_time: Date.now() },
    });
    expect(JSON.parse(store.get('journeyDismissals', true))).toEqual(all);
  });
});
