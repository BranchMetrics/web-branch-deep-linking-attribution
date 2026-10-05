import { createPage } from './harness.js';

describe('golden harness', () => {
  it('records the target of every way to navigate', async () => {
    const p = createPage();
    const w = p.win;
    w.location = 'https://a.example.com/1';
    w.location.href = 'https://a.example.com/2';
    w.location.assign('https://a.example.com/3');
    w.location.replace('https://a.example.com/4');
    w.top.location = 'https://a.example.com/5';
    w.eval('window.top.location = "/relative?x=1"');
    w.location.hash = 'frag';
    const navigations = p.trace
      .filter((e) => e.navigate)
      .map(({ navigate, replace }) =>
        replace ? `${navigate} (replace)` : navigate,
      );
    expect(navigations).toEqual([
      'https://a.example.com/1',
      'https://a.example.com/2',
      'https://a.example.com/3',
      'https://a.example.com/4 (replace)',
      'https://a.example.com/5',
      'https://shop.example.com/relative?x=1',
      'https://shop.example.com/product/42#frag',
    ]);
    expect((await p.finish()).location).toBe(
      'https://shop.example.com/product/42#frag',
    );
  });
});
