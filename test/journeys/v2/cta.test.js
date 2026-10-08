import { createContext } from '../../../src/core/context.js';
import { awaitCta, NOOP, startCta } from '../../../src/journeys/v2/cta.js';

const CB = 'branch_view_callback__9';
const ctx = Object.assign(createContext(), { nonce: 'n0nce', timeout: 5000 });
const failScriptInstall = () => {
  const append = document.body.appendChild.bind(document.body);
  return vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    if (node.tagName === 'SCRIPT') {
      throw new Error('script blocked');
    }
    return append(node);
  });
};

describe('journeys/v2 cta', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    delete window[CB];
    document.body.innerHTML = '';
  });

  it('hands over the cta once, then leaves a no-op on the global', () => {
    const onCta = vi.fn();
    awaitCta(CB, 5000, onCta);
    const cta = () => {};
    window[CB](cta);
    window[CB](() => {});
    expect(onCta).toHaveBeenCalledTimes(1);
    expect(onCta).toHaveBeenCalledWith(cta);
    expect(window[CB]).toBe(NOOP);
  });

  it('ignores a callback that arrives after the timeout or after cancel', () => {
    const late = vi.fn();
    awaitCta(CB, 5000, late);
    vi.advanceTimersByTime(5000);
    window[CB](() => {});
    expect(late).not.toHaveBeenCalled();

    const cancelled = vi.fn();
    awaitCta(CB, 5000, cancelled).cancel();
    window[CB](() => {});
    expect(cancelled).not.toHaveBeenCalled();
  });

  it("startCta cancels its wait when the script can't be installed, so v1's callback survives", () => {
    const spy = failScriptInstall();
    try {
      expect(() =>
        startCta({ script: 'void 0;', callbackString: CB }, ctx),
      ).toThrow('script blocked');
    } finally {
      spy.mockRestore();
    }
    // v1 takes over and registers its own callback; the cancelled wait's timer is gone.
    const v1Callback = vi.fn();
    window[CB] = v1Callback;
    vi.advanceTimersByTime(5000);
    expect(window[CB]).toBe(v1Callback);
  });

  it('startCta installs the nonce-tagged script, runs the cta only once ready, and stop cleans up', () => {
    const handle = startCta({ script: 'void 0;', callbackString: CB }, ctx);
    const script = document.getElementById('branch-journey-cta');
    expect(script.getAttribute('nonce')).toBe('n0nce');
    expect(handle.isReady()).toBe(false);
    expect(() => handle.run()).not.toThrow();
    const cta = vi.fn();
    window[CB](cta);
    expect(handle.isReady()).toBe(true);
    handle.run();
    expect(cta).toHaveBeenCalledTimes(1);
    handle.stop();
    expect(document.getElementById('branch-journey-cta')).toBeNull();
    expect(window[CB]).toBe(NOOP);
  });
});
