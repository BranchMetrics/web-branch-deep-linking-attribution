import {
  animationDurationMs,
  timeValueMsAt,
} from '../../../../src/journeys/v2/renderer/css-animation.js';

describe('journeys/css-animation', () => {
  it('timeValueMsAt parses s and ms tokens by index', () => {
    expect(timeValueMsAt('0.25s ease 100ms', 0)).toBe(250);
    expect(timeValueMsAt('0.25s ease 100ms', 1)).toBe(100);
    expect(timeValueMsAt('ease', 0)).toBeNull();
    expect(timeValueMsAt(undefined, 0)).toBeNull();
    expect(timeValueMsAt('250ms', 0)).toBe(250);
    expect(timeValueMsAt('slide 0.4s ease 0.3s', 1)).toBe(300);
    expect(timeValueMsAt('-1s', 0)).toBe(-1000);
    expect(timeValueMsAt('0.4s', 1)).toBeNull();
    expect(timeValueMsAt('', 0)).toBeNull();
  });

  it('animationDurationMs adds duration and delay, 0 without animation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(animationDurationMs(el)).toBe(0);
    el.style.animation = 'x 0.25s ease 0.1s both';
    expect(animationDurationMs(el)).toBe(350);
    el.remove();
  });

  it('uses a real 0s longhand instead of falling back to the shorthand', () => {
    const fake = {
      ownerDocument: {
        defaultView: {
          getComputedStyle: () => ({
            animationDuration: '0s',
            animationDelay: '0.2s',
            animation: 'x 1s ease 0.5s',
          }),
        },
      },
    };
    expect(animationDurationMs(fake)).toBe(200);
  });
});
