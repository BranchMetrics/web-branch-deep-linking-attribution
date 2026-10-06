import {
  animationDurationMs,
  timeValueMsAt,
} from '../../src/journeys/css-animation.js';

describe('journeys/css-animation', () => {
  it('timeValueMsAt parses s and ms tokens by index', () => {
    expect(timeValueMsAt('0.25s ease 100ms', 0)).toBe(250);
    expect(timeValueMsAt('0.25s ease 100ms', 1)).toBe(100);
    expect(timeValueMsAt('ease', 0)).toBeNull();
    expect(timeValueMsAt(undefined, 0)).toBeNull();
  });

  it('animationDurationMs adds duration and delay, 0 without animation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(animationDurationMs(el)).toBe(0);
    el.style.animation = 'x 0.25s ease 0.1s both';
    expect(animationDurationMs(el)).toBe(350);
    el.remove();
  });
});
