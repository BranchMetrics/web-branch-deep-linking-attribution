import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js'],
    // Golden traces run against the built bundle: see vitest.golden.config.mjs.
    exclude: [...configDefaults.exclude, 'test/golden/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['src/**'],
      exclude: ['src/snippet/onpage.js', 'src/index.js'],
    },
  },
});
