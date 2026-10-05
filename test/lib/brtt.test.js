import { calculateBrtt } from '../../src/lib/brtt.js';

describe('lib/brtt', () => {
  it('returns the elapsed time since startTime as a string', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    expect(calculateBrtt(400)).toBe('600');
    vi.useRealTimers();
  });

  it('returns null for invalid startTime', () => {
    expect(calculateBrtt(null)).toBe(null);
    expect(calculateBrtt('not-a-number')).toBe(null);
    expect(calculateBrtt(undefined)).toBe(null);
  });
});
