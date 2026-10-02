import { defineConfig } from '@playwright/test';
import { DEVICES } from './test/perf/config.mjs';

// Phases are separate runs (run.mjs), not project dependencies, so a failure
// in one doesn't skip the other.
const serial = process.env.PERF_PHASE === 'serial';
const tagged = (tag) => `(?=.*@${tag}(\\s|$))`;

export default defineConfig({
  testDir: 'test/perf',
  testMatch: process.env.PERF_RECORD ? 'record.spec.mjs' : 'cls.spec.mjs',
  outputDir: `test-results/${serial ? 'serial' : 'parallel'}`,
  fullyParallel: true,
  workers: serial ? 1 : undefined,
  reporter: [
    ['list', { printSteps: false }],
    ['./test/perf/summary-reporter.mjs'],
  ],
  // Layout-shift entries are Chromium-only.
  use: { browserName: 'chromium' },
  projects: Object.entries(DEVICES).map(([device, use]) => ({
    name: device,
    use: { ...use, device },
    grep: new RegExp(tagged(device) + (serial ? tagged('serial') : '')),
    grepInvert: serial ? undefined : /@serial/,
  })),
});
