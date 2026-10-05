import { defineConfig } from 'vitest/config';

// Date#toString and friends depend on the host time zone.
process.env.TZ = 'UTC';

// Black-box golden traces of the built bundle. Snapshots come from
// origin/main (scripts/golden-baseline.sh) and must never be regenerated
// to make a refactor pass.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'test/golden/harness.test.js',
      'test/golden/scenarios/**/*.golden.test.js',
    ],
    // Never write a missing snapshot: a renamed or deleted scenario must
    // fail, not silently re-record. `-u` (golden-baseline.sh) overrides this.
    update: 'none',
  },
});
