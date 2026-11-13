import {
  enter,
  exit,
  waitForAnimation,
} from '../../../../src/journeys/v2/renderer/animation.js';

const ANIMATION = {
  enterClass: 'branch-banner-enter',
  exitClass: 'branch-banner-exit',
  css: '',
};

function makeBanner(style = '') {
  const el = document.createElement('div');
  el.id = 'branch-banner';
  el.setAttribute('style', style);
  document.body.appendChild(el);
  return el;
}

describe('journeys/v2 animation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('settles after 20ms when there is nothing to wait for', () => {
    const done = vi.fn();
    waitForAnimation(null, done);
    vi.advanceTimersByTime(19);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('settles asynchronously in jsdom, which has no getAnimations', () => {
    const el = makeBanner('animation: x 1s ease both');
    const done = vi.fn();
    waitForAnimation(el, done);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(done).toHaveBeenCalledTimes(1);
  });

  function fakeAnimation(endTime) {
    let resolve;
    const finished = new Promise((r) => {
      resolve = r;
    });
    return {
      effect: { getComputedTiming: () => ({ endTime }) },
      finished,
      resolve,
    };
  }

  function withAnimations(el, animations) {
    el.getAnimations = vi.fn(() => animations);
    return el;
  }

  it('finishes once when every finite animation settles, ignoring infinite ones', async () => {
    const short = fakeAnimation(100);
    const long = fakeAnimation(250);
    const infinite = fakeAnimation(Infinity);
    const el = withAnimations(makeBanner(), [short, long, infinite]);
    const done = vi.fn();
    waitForAnimation(el, done);
    expect(el.getAnimations).toHaveBeenCalledWith();
    short.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).not.toHaveBeenCalled();
    long.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('settles on a cancelled (rejected) animation', async () => {
    const cancelled = fakeAnimation(100);
    cancelled.finished = Promise.reject(new Error('AbortError'));
    const done = vi.fn();
    waitForAnimation(withAnimations(makeBanner(), [cancelled]), done);
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('is async even when the animations have already finished', async () => {
    const finished = fakeAnimation(100);
    finished.resolve();
    const done = vi.fn();
    waitForAnimation(withAnimations(makeBanner(), [finished]), done);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('settles after 20ms when only infinite animations run', async () => {
    const done = vi.fn();
    waitForAnimation(
      withAnimations(makeBanner(), [fakeAnimation(Infinity)]),
      done,
    );
    await vi.advanceTimersByTimeAsync(19);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('falls back to the latest end time + 50ms when finished never resolves, and cancel silences it', async () => {
    const el = withAnimations(makeBanner(), [
      fakeAnimation(100),
      fakeAnimation(350),
    ]);
    const done = vi.fn();
    waitForAnimation(el, done);
    await vi.advanceTimersByTimeAsync(399);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledTimes(1);

    const animation = fakeAnimation(100);
    const silenced = vi.fn();
    waitForAnimation(
      withAnimations(makeBanner(), [animation]),
      silenced,
    ).cancel();
    animation.resolve();
    await vi.advanceTimersByTimeAsync(5000);
    expect(silenced).not.toHaveBeenCalled();
  });

  it('enter adds the enter class; disable_entry_animation forces animation:none and settles', () => {
    const el = makeBanner('animation: x 1s ease both');
    const done = vi.fn();
    enter(el, ANIMATION, true, done);
    expect(el.classList.contains('branch-banner-enter')).toBe(true);
    expect(el.style.getPropertyValue('animation')).toBe('none');
    vi.advanceTimersByTime(20);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("exit undoes a disabled entrance's inline animation, swaps classes and waits", () => {
    const el = makeBanner();
    enter(el, ANIMATION, true, () => {});
    vi.advanceTimersByTime(20);
    const done = vi.fn();
    exit(el, ANIMATION, false, done);
    expect(el.style.getPropertyValue('animation')).toBe('');
    expect(el.style.getPropertyValue('animation-name')).toBe('');
    expect(el.classList.contains('branch-banner-enter')).toBe(false);
    expect(el.classList.contains('branch-banner-exit')).toBe(true);
    vi.advanceTimersByTime(20);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('exit with disable_exit_animation finishes immediately', () => {
    const done = vi.fn();
    exit(makeBanner(), ANIMATION, true, done);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
