import { banner_html } from '../../src/banner/banner_html.js';
import { createContext } from '../../src/core/context.js';

describe('banner_html.iframe', function () {
  afterEach(function () {
    const iframe = document.getElementById('branch-banner-iframe');
    if (iframe?.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  // src/ loads as strict-mode ES modules here, so this also catches writes to
  // getter-only properties such as document.head in the onload handler.
  it('populates the banner in the iframe once it loads', async function () {
    const iframe = await new Promise(function (resolve) {
      banner_html.iframe(
        {
          title: 'Title',
          description: 'Description',
          icon: '',
          openAppButtonText: 'Open',
          downloadAppButtonText: 'Download',
          position: 'top',
        },
        'open',
        resolve,
        createContext(),
      );
    });
    const doc = iframe.contentDocument;
    expect(doc.head).toBeTruthy();
    expect(doc.body.className).toMatch(/^branch-banner-/);
    expect(doc.getElementById('branch-banner')).toBeTruthy();
  });
});
