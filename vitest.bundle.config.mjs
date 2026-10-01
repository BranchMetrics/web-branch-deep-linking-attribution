import { defineConfig } from 'vitest/config';

// Tests the built artifact rather than src/; run `pnpm run build` first.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/bundle-contract.js'],
  },
});
