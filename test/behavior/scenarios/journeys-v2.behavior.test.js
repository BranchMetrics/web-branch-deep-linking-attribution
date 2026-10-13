import { API, KEY, UA } from '../fixtures.js';
import { createPage, nextPage } from '../harness.js';

// v2 must match v1 but for what comparable() drops.

const pageview =
  (v2, extra = {}, metadata = {}, edit = (t) => t) =>
  (req) => {
    const res = API.pageviewWithJourney(extra, metadata)(req);
    res.body.template = edit(res.body.template);
    if (v2) {
      res.body.use_v2_renderer = true;
    }
    return res;
  };

const journeyPage = (v2, opts = {}) =>
  createPage({
    ua: UA.androidChrome,
    ...opts,
    routes: { '/v1/pageview': pageview(v2), ...opts.routes },
  });

const journeyRoot = (v2, p) =>
  v2
    ? p.win.document.getElementById('branch-journey-host')?.shadowRoot
    : p.win.document.getElementById('branch-banner-iframe')?.contentDocument;

const clickInJourney = (v2, p, selector) =>
  p.record(`click ${selector}`, () => {
    const el = journeyRoot(v2, p)?.querySelector(selector);
    el?.click();
    return !!el;
  });

const swipeInJourney = (v2, p, selector) =>
  p.record(`swipe ${selector}`, () => {
    const el = journeyRoot(v2, p)?.querySelector(selector);
    el?.dispatchEvent(new el.ownerDocument.defaultView.Event('touchmove'));
    return !!el;
  });

const withBackdrop = (t) =>
  t.replace(
    '<div id="branch-banner">',
    '<div class="branch-banner-dismiss-background"></div>$&',
  );

function comparable({ trace, storage, location }) {
  const events = trace
    .filter(
      (e) =>
        // v1's internal dismissal hook, which leaks to listeners.
        e.name !== 'branch_internal_event_didCloseJourney' &&
        // jsdom noise; the navigation itself is recorded as `navigate`.
        !e.jsdomError &&
        // v2 calls back after the close; the closeJourney test checks that.
        e.callback !== 'closeJourney',
    )
    .map(({ at, ...e }) => {
      if (e.name === 'willShowJourney') {
        // jsdom has no layout to measure.
        const { bannerHeight, ...data } = e.data;
        return { ...e, data };
      }
      return e;
    });
  return { events, storage, location };
}

async function expectParity(scenario) {
  const v1 = await (await scenario(false)).finish();
  const v2 = await (await scenario(true)).finish();
  expect(comparable(v2)).toEqual(comparable(v1));
  return { v1, v2 };
}

const names = (trace) => trace.filter((e) => e.event).map((e) => e.name);

describe('behavior: journeys v2 matches v1', () => {
  it('renders', async () => {
    const { v2 } = await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY, p.cb('init'));
      await p.run(2000);
      return p;
    });
    expect(v2.dom.body).toContain('id="branch-journey-host"');
    expect(v2.dom.iframes).toEqual([]);
  });

  it('desktop', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2, { ua: UA.desktopChrome });
      p.listen();
      p.branch.init(KEY);
      await p.run(2000);
      return p;
    });
  });

  it('with the entry animation disabled', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY, { disable_entry_animation: true });
      await p.run(2000);
      return p;
    });
  });

  it('closeJourney', async () => {
    const { v2 } = await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY);
      await p.run(2000);
      p.branch.closeJourney(p.cb('closeJourney'));
      return p;
    });
    const order = v2.trace
      .filter((e) => e.event || e.callback)
      .map((e) => e.name || e.callback);
    expect(order.slice(-2)).toEqual(['didCloseJourney', 'closeJourney']);
    expect(v2.dom.body).not.toContain('branch-journey-host');
  });

  it('a dismissal holding on the next page', async () => {
    await expectParity(async (v2) => {
      const first = journeyPage(v2);
      first.listen();
      first.branch.init(KEY);
      await first.run(2000);
      clickInJourney(v2, first, '.branch-banner-close');
      await first.finish();
      const p = nextPage(first, {
        ua: UA.androidChrome,
        routes: { '/v1/pageview': pageview(v2) },
      });
      p.listen();
      p.branch.init(KEY, p.cb('init'));
      return p;
    });
  });

  it('the close button', async () => {
    const { v2 } = await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY);
      await p.run(2000);
      clickInJourney(v2, p, '.branch-banner-close');
      return p;
    });
    expect(v2.trace.some((e) => e.path === '/v1/dismiss')).toBe(true);
  });

  it('the CTA', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY);
      await p.run(2000);
      clickInJourney(v2, p, '#branch-mobile-action');
      return p;
    });
  });

  for (const [name, act] of [
    ['a click on the backdrop', clickInJourney],
    ['a swipe on the backdrop', swipeInJourney],
  ]) {
    it(name, async () => {
      const { v2 } = await expectParity(async (v2) => {
        const p = journeyPage(v2, {
          routes: { '/v1/pageview': pageview(v2, {}, {}, withBackdrop) },
        });
        p.listen();
        p.branch.init(KEY);
        await p.run(2000);
        act(v2, p, '.branch-banner-dismiss-background');
        return p;
      });
      expect(v2.trace.some((e) => e.path === '/v1/dismiss')).toBe(true);
    });
  }

  it('with the exit animation disabled', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY, { disable_exit_animation: true });
      await p.run(2000);
      // v2 closes inside the click handler, v1 a task later; only the order is compared.
      p.step('click .branch-banner-close');
      journeyRoot(v2, p).querySelector('.branch-banner-close').click();
      return p;
    });
  });

  it('the CTA text when the visitor has the app', async () => {
    const { v2 } = await expectParity(async (v2) => {
      const p = journeyPage(v2, {
        routes: { '/v1/open': { body: API.openBody({ has_app: true }) } },
      });
      p.branch.init(KEY);
      await p.run(2000);
      p.record(
        'cta text',
        () =>
          journeyRoot(v2, p)?.getElementById('branch-mobile-action')
            ?.textContent,
      );
      return p;
    });
    expect(v2.trace).toContainEqual(
      expect.objectContaining({ 'cta text': 'OPEN' }),
    );
  });

  it('$journeys_cta replacing the CTA link', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.setBranchViewData({
        data: { $journeys_cta: 'https://shop.example.com/cta' },
      });
      p.branch.init(KEY);
      await p.run(2000);
      clickInJourney(v2, p, '#branch-mobile-action');
      return p;
    });
  });

  it('dismissRedirect', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2, {
        routes: {
          '/v1/pageview': pageview(
            v2,
            {},
            { dismissRedirect: 'https://shop.example.com/after-dismiss' },
          ),
        },
      });
      p.listen();
      p.branch.init(KEY);
      await p.run(2000);
      clickInJourney(v2, p, '.branch-banner-continue');
      return p;
    });
  });

  it('_branch_view_id test mode', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2, {
        url: 'https://shop.example.com/p?_branch_view_id=jv1',
      });
      p.listen();
      p.branch.init(KEY, p.cb('init'));
      await p.run(2000);
      return p;
    });
  });

  it('setBranchViewData before init', async () => {
    await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.branch.setBranchViewData(
        { data: { $deeplink_path: 'x' } },
        p.cb('setBranchViewData'),
      );
      p.branch.init(KEY, p.cb('init'));
      await p.run(2000);
      return p;
    });
  });

  it('a second pageview while the journey is up', async () => {
    const { v2 } = await expectParity(async (v2) => {
      const p = journeyPage(v2);
      p.listen();
      p.branch.init(KEY);
      await p.run(2000);
      p.branch.track('pageview');
      await p.run(2000);
      return p;
    });
    expect(names(v2.trace).filter((n) => n === 'willShowJourney')).toHaveLength(
      1,
    );
  });
});

describe('behavior: journeys v2', () => {
  const fallbackReason = (trace) => {
    const url = trace.find((e) => e.path === '/v1/url');
    return JSON.parse(url?.body.instrumentation ?? '{}')['journey-v2-fallback'];
  };

  async function showAndLink(p) {
    p.branch.init(KEY);
    await p.run(2000);
    p.branch.link({}, p.cb('link'));
    return p.finish();
  }

  it('falls back to v1 for a template it cannot adapt, and reports why', async () => {
    const withFontFace = (t) =>
      t.replace(
        '<style type="text/css" id="branch-css">',
        '$&@font-face { font-family: X; src: url(x.woff); }\n',
      );
    const result = await showAndLink(
      journeyPage(true, {
        routes: { '/v1/pageview': pageview(true, {}, {}, withFontFace) },
      }),
    );
    expect(result.dom.body).not.toContain('branch-journey-host');
    expect(result.dom.iframes.map((f) => f.id)).toEqual([
      'branch-banner-iframe',
    ]);
    expect(fallbackReason(result.trace)).toBe('font-face');
  });

  it('falls back to v1 in a browser without cascade layers', async () => {
    const result = await showAndLink(
      journeyPage(true, {
        before: (win) => {
          delete win.CSSLayerBlockRule;
        },
      }),
    );
    expect(result.dom.iframes.map((f) => f.id)).toEqual([
      'branch-banner-iframe',
    ]);
    expect(fallbackReason(result.trace)).toBe('no-css-layers');
  });

  it('reports no fallback when it renders', async () => {
    const result = await showAndLink(journeyPage(true));
    expect(result.dom.body).toContain('branch-journey-host');
    expect(fallbackReason(result.trace)).toBeUndefined();
  });

  it('falls back to v1 when the page breaks attachShadow', async () => {
    const result = await showAndLink(
      journeyPage(true, {
        before: (win) => {
          win.Element.prototype.attachShadow = () => {
            throw new Error('polyfilled');
          };
        },
      }),
    );
    expect(result.trace.filter((e) => e.uncaught)).toEqual([]);
    expect(result.dom.body).not.toContain('branch-journey-host');
    expect(result.dom.iframes.map((f) => f.id)).toEqual([
      'branch-banner-iframe',
    ]);
    expect(fallbackReason(result.trace)).toBe('render-error');
  });

  it('shows and closes on a page that extends Object and Array prototypes (Prototype, MooTools)', async () => {
    const p = journeyPage(true, {
      before: (win) => {
        win.Object.prototype.polluted = 'x';
        win.Array.prototype.polluted = () => {};
      },
    });
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    clickInJourney(true, p, '.branch-banner-close');
    const { trace, dom } = await p.finish();
    expect(trace.filter((e) => e.uncaught || e.console === 'error')).toEqual(
      [],
    );
    expect(names(trace)).toEqual([
      'willShowJourney',
      'didShowJourney',
      'didClickJourneyClose',
      'willCloseJourney',
      'didCloseJourney',
    ]);
    expect(trace.some((e) => e.path === '/v1/dismiss')).toBe(true);
    expect(dom.body).not.toContain('branch-journey-host');
  });

  it('shows the next pageview once a closing journey has finished', async () => {
    const p = journeyPage(true);
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    p.branch.closeJourney();
    p.branch.track('pageview');
    const { trace, dom } = await p.finish();
    expect(names(trace)).toEqual([
      'willShowJourney',
      'didShowJourney',
      'didCallJourneyClose',
      'willCloseJourney',
      'didCloseJourney',
      'willShowJourney',
      'didShowJourney',
    ]);
    expect(dom.body.match(/branch-journey-host/g)).toHaveLength(1);
  });

  it('shows again after the page removes it (SPA re-render), without a dismissal', async () => {
    const p = journeyPage(true);
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    p.win.document.body.innerHTML = '<main>re-rendered</main>';
    await p.run(100);
    p.branch.track('pageview');
    const { trace, dom } = await p.finish();
    expect(trace.some((e) => e.path === '/v1/dismiss')).toBe(false);
    expect(names(trace).filter((n) => n === 'didShowJourney')).toHaveLength(2);
    expect(dom.body.match(/branch-journey-host/g)).toHaveLength(1);
  });
});
