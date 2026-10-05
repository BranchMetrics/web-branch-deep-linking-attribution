import { defineConfig } from 'vitest/config';

// Date#toString and friends depend on the host time zone.
process.env.TZ = 'UTC';

// Black-box behavior traces of the built bundle. Snapshots come from
// origin/main (scripts/behavior-baseline.sh) and must never be regenerated
// to make a refactor pass.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'test/behavior/harness.test.js',
      'test/behavior/scenarios/**/*.behavior.test.js',
    ],
    // Never write a missing snapshot: a renamed or deleted scenario must
    // fail, not silently re-record. `-u` (behavior-baseline.sh) overrides this.
    update: 'none',
  },
});
