import { cleanCreativeHtml } from '../../../../src/journeys/v2/renderer/sanitize.js';

function clean(html) {
  const div = document.createElement('div');
  div.appendChild(cleanCreativeHtml(document, html));
  return div;
}
const attr = (html, selector, name) =>
  clean(html).querySelector(selector).getAttribute(name);

describe('journeys/v2 cleanCreativeHtml', () => {
  it('leaves ordinary creative markup unchanged', () => {
    const html =
      '<div id="branch-banner"><a class="branch-banner-close" href="#">x</a>' +
      '<img src="https://cdn.branch.io/a.png" alt="a">' +
      '<svg viewBox="0 0 10 10"><path d="M0 0"></path></svg></div>';
    const plain = document.createElement('div');
    plain.innerHTML = html;
    expect(clean(html).innerHTML).toBe(plain.innerHTML);
  });

  it('removes event handler attributes, whatever their case', () => {
    const div = clean(
      '<img id="i" src="x.png" onerror="alert(1)" OnLoad="alert(2)">' +
        '<button id="b" onclick="alert(3)">go</button>' +
        '<svg><circle id="c" onmouseover="alert(4)"></circle></svg>',
    );
    for (const el of div.querySelectorAll('*')) {
      expect([...el.attributes].map((a) => a.name)).not.toContainEqual(
        expect.stringMatching(/^on/i),
      );
    }
    expect(div.querySelector('#i').getAttribute('src')).toBe('x.png');
    expect(div.querySelector('#b').textContent).toBe('go');
  });

  it('removes script-capable and document-changing elements', () => {
    const div = clean(
      '<p id="keep">k</p><script>alert(1)</script><iframe src="https://x"></iframe>' +
        '<object data="x"></object><embed src="x"><base href="https://evil">' +
        '<form action="https://x"><input name="q"></form><meta http-equiv="refresh" content="0">' +
        '<link rel="stylesheet" href="x.css"><style>p{}</style>' +
        '<svg><script>alert(2)</script><a><animate attributeName="href" values="javascript:alert(3)"></animate>' +
        '<set attributeName="href" to="javascript:alert(4)"></set></a></svg>',
    );
    expect(
      div.querySelectorAll(
        'script, iframe, object, embed, base, form, input, meta, link, style, animate, set',
      ),
    ).toHaveLength(0);
    expect(div.querySelector('#keep').textContent).toBe('k');
  });

  it('removes javascript: URLs in every URL attribute, however disguised', () => {
    const cases = [
      '<a id="t" href="javascript:alert(1)">x</a>',
      '<a id="t" href="JaVaScRiPt:alert(1)">x</a>',
      '<a id="t" href="  javascript:alert(1)">x</a>',
      '<a id="t" href="\u0001java\tscript:alert(1)">x</a>',
      '<a id="t" href="java&#10;script:alert(1)">x</a>',
      '<a id="t" href="vbscript:x">x</a>',
      '<a id="t" href="data:text/html,<script>alert(1)</script>">x</a>',
      '<img id="t" src="javascript:alert(1)">',
      '<video id="t" poster="javascript:alert(1)"></video>',
      '<button id="t" formaction="javascript:alert(1)">x</button>',
    ];
    for (const html of cases) {
      const el = clean(html).querySelector('#t');
      expect(el, html).not.toBeNull();
      for (const name of ['href', 'src', 'poster', 'formaction']) {
        expect(el.hasAttribute(name), html).toBe(false);
      }
    }
  });

  it("removes an svg link's javascript: xlink:href and href", () => {
    const div = clean(
      '<svg><a id="x" xlink:href="javascript:alert(1)"><text>x</text></a>' +
        '<a id="h" href="javascript:alert(2)"><text>y</text></a>' +
        '<a id="ok" xlink:href="https://branch.io"><text>z</text></a></svg>',
    );
    expect(div.querySelector('#x').attributes).toHaveLength(1);
    expect(div.querySelector('#h').hasAttribute('href')).toBe(false);
    expect(div.querySelector('#ok').getAttribute('xlink:href')).toBe(
      'https://branch.io',
    );
  });

  it('keeps http, https, mailto, tel, sms, fragment and relative URLs', () => {
    for (const url of [
      'http://branch.io',
      'https://branch.io/a?b=c#d',
      'HTTPS://branch.io',
      'mailto:a@b.co',
      'tel:+15555550100',
      'sms:+15555550100',
      '#',
      '#top',
      '/path',
      'path/file.png',
      '//cdn.branch.io/a.png',
      '?q=1',
      '{{$journeys_desktop_qr_code}}',
    ]) {
      expect(attr(`<a id="t" href="${url}">x</a>`, '#t', 'href'), url).toBe(
        url,
      );
    }
  });

  // node-api fills the desktop QR code into an <img src>; an image can't run script.
  it('keeps a data:image URL on an img src only', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(attr(`<img id="t" src="${png}">`, '#t', 'src')).toBe(png);
    expect(
      clean(`<a id="t" href="${png}">x</a>`)
        .querySelector('#t')
        .hasAttribute('href'),
    ).toBe(false);
    expect(
      clean('<img id="t" src="data:text/html;base64,PHNjcmlwdD4=">')
        .querySelector('#t')
        .hasAttribute('src'),
    ).toBe(false);
  });

  it("doesn't run what it parses", () => {
    window.__ranCreative = false;
    cleanCreativeHtml(
      document,
      '<img src="x:" onerror="window.__ranCreative = true">',
    );
    expect(window.__ranCreative).toBe(false);
    delete window.__ranCreative;
  });
});
