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
    include: ['test/golden/scenarios/**/*.golden.test.js'],
  },
});
