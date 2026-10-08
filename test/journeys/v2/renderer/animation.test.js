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

  it('finishes once on the element’s own animationend and ignores bubbling children', () => {
    const el = makeBanner('animation: x 1s ease both');
    const child = document.createElement('span');
    el.appendChild(child);
    const done = vi.fn();
    waitForAnimation(el, done);
    child.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(done).not.toHaveBeenCalled();
    el.dispatchEvent(new Event('animationend'));
    el.dispatchEvent(new Event('animationend'));
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('falls back to duration + 50ms when animationend never fires, and cancel silences it', () => {
    const el = makeBanner('animation: x 0.25s ease 0.1s both');
    const done = vi.fn();
    waitForAnimation(el, done);
    vi.advanceTimersByTime(399);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);

    const silenced = vi.fn();
    waitForAnimation(el, silenced).cancel();
    vi.advanceTimersByTime(5000);
    el.dispatchEvent(new Event('animationend'));
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
