import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: [
      'test/0_config.js',
      'test/0_jsonparse.js',
      'test/0_queue.js',
      'test/1_utils.js',
      'test/6_branch_new.js',
      'test/journeys_utils.js',
      'test/branch_view.js',
      // Not run: test/2_storage.js, test/3_api.js, test/6_branch.js,
      // test/7_integration.js and test/journeys.js. They were already excluded
      // from the mocha run and fail at load (they reference a removed
      // `BranchStorage` global and mocha-only hooks); revive them separately.
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['src/**'],
      exclude: ['src/onpage.js', 'src/7_initialization.js'],
    },
  },
});
