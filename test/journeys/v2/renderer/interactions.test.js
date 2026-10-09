import { bindControls } from '../../../../src/journeys/v2/renderer/interactions.js';

describe('journeys/v2/renderer interactions', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('reports each control as an action, and unbinding stops them', () => {
    document.body.innerHTML =
      '<div id="branch-mobile-action"></div><div class="branch-banner-close"></div>' +
      '<div class="branch-banner-continue"></div><div class="branch-banner-dismiss-background"></div>';
    const actions = [];
    const unbind = bindControls(document, (a) => actions.push(a));
    document.getElementById('branch-mobile-action').click();
    document.querySelector('.branch-banner-close').click();
    document.querySelector('.branch-banner-continue').click();
    const bg = document.querySelector('.branch-banner-dismiss-background');
    bg.click();
    bg.dispatchEvent(new Event('touchmove'));
    expect(actions).toEqual([
      'cta',
      'close',
      'continue',
      'background-click',
      'background-swipe',
    ]);
    unbind();
    document.getElementById('branch-mobile-action').click();
    expect(actions).toHaveLength(5);
  });

  it('binds touchmove as passive so the swipe never blocks scrolling', () => {
    document.body.innerHTML =
      '<div class="branch-banner-dismiss-background"></div>';
    const bg = document.querySelector('.branch-banner-dismiss-background');
    const add = vi.spyOn(bg, 'addEventListener');
    const remove = vi.spyOn(bg, 'removeEventListener');
    const unbind = bindControls(document, () => {});
    const touch = add.mock.calls.find(([type]) => type === 'touchmove');
    expect(touch[2]).toEqual({ passive: true });
    unbind();
    expect(remove).toHaveBeenCalledWith('touchmove', touch[1]);
  });

  it('cancels a link control so it cannot navigate the host page', () => {
    document.body.innerHTML =
      '<a id="branch-mobile-action" href="#">Get</a><a class="branch-banner-close" href="#">x</a>';
    const actions = [];
    bindControls(document, (a) => actions.push(a));
    for (const el of document.querySelectorAll('a')) {
      const click = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
    }
    expect(actions).toEqual(['cta', 'close']);
  });

  it('is fine with creatives that lack some controls', () => {
    expect(() => bindControls(document, () => {})()).not.toThrow();
  });
});
