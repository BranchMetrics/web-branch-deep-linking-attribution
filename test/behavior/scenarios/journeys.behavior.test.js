import { API, KEY, UA } from '../fixtures.js';
import { createPage, nextPage, snap } from '../harness.js';

const journeyPage = (opts = {}) =>
  createPage({
    ua: UA.androidChrome,
    ...opts,
    routes: { '/v1/pageview': API.pageviewWithJourney(), ...opts.routes },
  });

/** Clicks an element inside the rendered Journey iframe, if it is there. */
const clickInJourney = (p, selector) =>
  p.record(`click ${selector}`, () => {
    const el = p.win.document
      .getElementById('branch-banner-iframe')
      ?.contentDocument.querySelector(selector);
    el?.click();
    return !!el;
  });

describe('behavior: journeys', () => {
  it('renders a top banner Journey', async () => {
    const p = journeyPage();
    p.listen();
    p.branch.init(KEY, p.cb('init'));
    await p.run(2000);
    await snap('journeys/render-top-banner', p);
  });

  it('no_journeys option', async () => {
    const p = journeyPage();
    p.listen();
    p.branch.init(KEY, { no_journeys: true }, p.cb('init'));
    await snap('journeys/no_journeys-option', p);
  });

  it('closeJourney', async () => {
    const p = journeyPage();
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    p.branch.closeJourney(p.cb('closeJourney'));
    await snap('journeys/closeJourney', p);
  });

  it('closeJourney when none is shown', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.closeJourney(p.cb('closeJourney'));
    await snap('journeys/closeJourney-none-shown', p);
  });

  it('a dismissed Journey stays dismissed on the next page', async () => {
    const first = journeyPage();
    first.branch.init(KEY);
    await first.run(2000);
    // closeJourney() alone stores no dismissal; the close button does.
    first.branch.closeJourney();
    clickInJourney(first, '.branch-banner-close');
    await first.finish();
    const p = nextPage(first, {
      ua: UA.androidChrome,
      routes: { '/v1/pageview': API.pageviewWithJourney() },
    });
    p.listen();
    p.branch.init(KEY, p.cb('init'));
    await snap('journeys/dismiss-persists-next-page', p);
  });

  it('clicking the close button inside the Journey', async () => {
    const p = journeyPage();
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    clickInJourney(p, '.branch-banner-close');
    await snap('journeys/close-button-click', p);
  });

  it('clicking the CTA inside the Journey', async () => {
    const p = journeyPage();
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    clickInJourney(p, '#branch-mobile-action');
    await snap('journeys/cta-click', p);
  });

  it('$journeys_cta replaces the CTA link', async () => {
    const p = journeyPage();
    p.listen();
    p.branch.setBranchViewData({
      data: { $journeys_cta: 'https://shop.example.com/cta' },
    });
    p.branch.init(KEY);
    await p.run(2000);
    clickInJourney(p, '#branch-mobile-action');
    await snap('journeys/journeys_cta-rewrite', p);
  });

  it('dismissRedirect sends the page on after a dismiss', async () => {
    const p = journeyPage({
      routes: {
        '/v1/pageview': API.pageviewWithJourney(
          {},
          { dismissRedirect: 'https://shop.example.com/after-dismiss' },
        ),
      },
    });
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    clickInJourney(p, '.branch-banner-continue');
    await snap('journeys/dismiss-redirect', p);
  });

  it('setBranchViewData before init', async () => {
    const p = journeyPage();
    p.branch.setBranchViewData(
      { data: { $deeplink_path: 'x' } },
      p.cb('setBranchViewData'),
    );
    p.branch.init(KEY, p.cb('init'));
    await p.run(2000);
    await snap('journeys/setBranchViewData-and-render', p);
  });

  it('_branch_view_id param forces test mode', async () => {
    const p = journeyPage({
      url: 'https://shop.example.com/p?_branch_view_id=jv2',
    });
    p.listen();
    p.branch.init(KEY, p.cb('init'));
    await p.run(2000);
    await snap('journeys/branch_view_id-param', p);
  });

  it('renderQueue and renderFinalize', async () => {
    const p = createPage();
    // Before init the queue rejects work (NO_CALLBACK throws).
    p.record('renderQueue-before-init', () =>
      p.branch.renderQueue(() => p.step('render before init')),
    );
    p.branch.init(KEY, { no_journeys: true }, p.cb('init'));
    // Queued behind init, which finalizes rendering when it succeeds.
    p.branch.renderQueue(() => p.step('render queued behind init'));
    await p.run(100);
    p.branch.renderQueue(() => p.step('render after finalize'));
    p.branch.renderFinalize(p.cb('renderFinalize'));
    await snap('journeys/renderQueue-renderFinalize', p);
  });

  it('desktop Journey', async () => {
    const p = journeyPage({ ua: UA.desktopChrome });
    p.listen();
    p.branch.init(KEY);
    await p.run(2000);
    await snap('journeys/render-desktop', p);
  });
});
