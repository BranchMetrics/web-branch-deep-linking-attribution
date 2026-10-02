import {
  allowed,
  BANNERS,
  DEVICE_TAGS,
  NO_BANNER,
  PAGES,
  SERIAL_LOADS,
} from './config.mjs';
import { expect, test } from './fixtures.mjs';

const round = (n) => Math.round(n * 1000) / 1000;

const title = (name, page) => (page === 'top' ? name : `${name}, ${page}`);

// Read by baseline-reporter.mjs and summary-reporter.mjs.
const record = (cls, [min, max]) =>
  test
    .info()
    .annotations.push(
      { type: 'cls', description: String(cls) },
      { type: 'allowed', description: `${round(min)}-${round(max)}` },
    );

for (const [page, host] of Object.entries(PAGES)) {
  test(title('sdk only', page), { tag: DEVICE_TAGS }, async ({ branch }) => {
    await branch.open(NO_BANNER, { host });
    await branch.waitForInit();
    const { cls } = await branch.layoutShifts();
    record(cls, [0, 0]);
    expect(cls).toBe(0);
  });
}

for (const { name, device, position, expected, serial } of BANNERS) {
  for (const [page, host] of Object.entries(PAGES))
    test(title(name, page), {
      tag: serial ? [`@${device}`, '@serial'] : `@${device}`,
    }, async ({ branch }) => {
      const loads = [];
      for (let i = 0; i < (serial ? SERIAL_LOADS : 1); i++) {
        await branch.open(name, { host });
        await branch.waitForBanner();
        const box = await branch.bannerBox();
        expect(box.position, 'banner position').toBe(position);
        const closedBy = await branch.closeBanner();
        loads.push({ ...(await branch.layoutShifts()), box, closedBy });
      }
      const byCls = loads.toSorted((a, b) => a.cls - b.cls);
      const { cls, target, box, closedBy } =
        byCls[Math.floor(byCls.length / 2)];
      const range = allowed(expected[page], { serial });
      record(cls, range);

      const all = serial
        ? ` (loads: ${loads.map((l) => round(l.cls)).join(', ')})`
        : '';
      console.log(
        `${device} | ${title(name, page)}: CLS ${round(cls)}${all} on ${target}, ` +
          `${box.width}x${box.height} ${position} banner, closed by ${closedBy}`,
      );
      const [min, max] = range;
      const message = `CLS ${round(cls)}, expected ${round(min)}-${round(max)}: update config.mjs if this change is intended`;
      expect(cls, message).toBeGreaterThanOrEqual(min);
      expect(cls, message).toBeLessThanOrEqual(max);
      for (const { afterClose } of loads)
        expect(afterClose, 'CLS after closing the banner').toBe(0);
    });
}
