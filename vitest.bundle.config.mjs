import { defineConfig } from 'vitest/config';

// Tests the built artifact rather than src/; run `npm run build` first.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/bundle-contract.js'],
  },
});
