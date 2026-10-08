import { scopeDocumentSelectors } from '../../../../src/journeys/v2/renderer/css-scope.js';

const HTML = '.branch-journey-html';
const BODY = '.branch-journey-root';

describe('journeys/v2 scopeDocumentSelectors', () => {
  it('maps html, :root and body type selectors onto the stand-in classes', () => {
    expect(scopeDocumentSelectors('body { margin: 0; }')).toBe(
      `${BODY} { margin: 0; }`,
    );
    expect(scopeDocumentSelectors('html{color:red}')).toBe(
      `${HTML}{color:red}`,
    );
    expect(scopeDocumentSelectors(':root { --x: 1; }')).toBe(
      `${HTML} { --x: 1; }`,
    );
    expect(scopeDocumentSelectors('BODY { margin: 0; }')).toBe(
      `${BODY} { margin: 0; }`,
    );
  });

  it('rewrites minified rules inside at-rule blocks and selector lists', () => {
    expect(
      scopeDocumentSelectors(
        '@media (max-width:480px){body{font-size:12px}}html,body{color:red}',
      ),
    ).toBe(
      `@media (max-width:480px){${BODY}{font-size:12px}}${HTML},${BODY}{color:red}`,
    );
    expect(
      scopeDocumentSelectors(
        '@supports (display:grid){@media print{body{x:1}}}',
      ),
    ).toBe(`@supports (display:grid){@media print{${BODY}{x:1}}}`);
  });

  it('rewrites compound and complex selectors', () => {
    expect(
      scopeDocumentSelectors('html body > div, body.x, :not(body) a {}'),
    ).toBe(`${HTML} ${BODY} > div, ${BODY}.x, :not(${BODY}) a {}`);
    expect(scopeDocumentSelectors('body #branch-banner{}')).toBe(
      `${BODY} #branch-banner{}`,
    );
  });

  it('leaves classes, ids and longer names that contain the words alone', () => {
    const css = '.body {} #html {} .x-body {} bodyx {} tbody {} [data-body] {}';
    expect(scopeDocumentSelectors(css)).toBe(css);
  });

  it('leaves declarations, at-rule preludes, keyframes, strings and comments alone', () => {
    const css =
      '#a { font-family: body; content: "body {"; }' +
      '@media screen and (min-width: 1px) {}' +
      '@keyframes body { from { opacity: 0 } to { opacity: 1 } }' +
      '/* body { } */ [title="html body"] {}';
    expect(scopeDocumentSelectors(css)).toBe(css);
  });
});
