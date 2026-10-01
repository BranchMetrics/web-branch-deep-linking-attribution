import { banner_html } from '../src/4_banner_html.js';

describe('banner_html.iframe', function () {
  afterEach(function () {
    var iframe = document.getElementById('branch-banner-iframe');
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  // src/ loads as strict-mode ES modules here, so this also catches writes to
  // getter-only properties such as document.head in the onload handler.
  it('populates the banner in the iframe once it loads', async function () {
    var iframe = await new Promise(function (resolve) {
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
      );
    });
    var doc = iframe.contentDocument;
    expect(doc.head).toBeTruthy();
    expect(doc.body.className).toMatch(/^branch-banner-/);
    expect(doc.getElementById('branch-banner')).toBeTruthy();
  });
});
