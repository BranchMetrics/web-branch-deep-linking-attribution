import { devices } from '@playwright/test';

export const DEVICES = {
  // Android, since field CLS only comes from Chromium browsers.
  mobile: {
    ...devices['Pixel 7'],
    // With mobile emulation every shift counts as recent input, so CLS reads
    // 0. Size, user agent and touch still apply.
    isMobile: false,
  },
  desktop: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
  },
};

export const DEVICE_TAGS = Object.keys(DEVICES).map((d) => `@${d}`);

export const PAGES = {
  top: {},
  scrolled: { scroll: '400' },
};

export const BANNERS = [
  {
    name: 'legacy standard top',
    device: 'mobile',
    position: 'top',
    serial: true,
    expected: { top: 0.096, scrolled: 0.084 },
  },
  {
    name: 'v2 standard top',
    device: 'mobile',
    position: 'top',
    expected: { top: 0.081, scrolled: 0.084 },
  },
  {
    name: 'legacy full page',
    device: 'mobile',
    position: 'full page',
    serial: true,
    expected: { top: 1.16, scrolled: 1.18 },
  },
  {
    name: 'v2 full page',
    device: 'mobile',
    position: 'full page',
    expected: { top: 0.551, scrolled: 0.881 },
  },
  {
    name: 'legacy desktop center',
    device: 'desktop',
    position: 'center',
    expected: { top: 0.368, scrolled: 0.368 },
  },
  {
    name: 'v2 desktop center',
    device: 'desktop',
    position: 'center',
    expected: { top: 0, scrolled: 0 },
  },
  {
    name: 'legacy desktop corner',
    device: 'desktop',
    position: 'corner',
    expected: { top: 0.244, scrolled: 0.244 },
  },
  {
    name: 'v2 desktop corner',
    device: 'desktop',
    position: 'corner',
    expected: { top: 0, scrolled: 0 },
  },
];

// `serial` banners vary with machine load, so they take the median of
// SERIAL_LOADS loads and a wider band. Everything else is deterministic.
export const SERIAL_LOADS = 3;

// How far measured CLS may drift from `expected`, either side: a fraction of
// `expected`, but never less than an absolute floor so small values aren't
// held to a band narrower than measurement noise.
export const TOLERANCE = {
  deterministic: { fraction: 0.02, floor: 0.003 },
  serial: { fraction: 0.1, floor: 0.01 },
};

export function allowed(expected, { serial = false } = {}) {
  if (expected === 0) return [0, 0];
  const { fraction, floor } = TOLERANCE[serial ? 'serial' : 'deterministic'];
  const tolerance = Math.max(floor, expected * fraction);
  return [expected - tolerance, expected + tolerance];
}

// The SDK-only fixture is derived from these recordings.
export const NO_BANNER = 'no banner';
export const NO_BANNER_SOURCE = {
  mobile: 'v2 standard top',
  desktop: 'v2 desktop center',
};

export function fixtureName(banner, mode) {
  return `${banner.replace(/ /g, '-')}.${mode}`;
}
