import {
  installA11y,
  isModal,
} from '../../../../src/journeys/v2/renderer/a11y.js';
import { makeRenderPayload } from '../fixtures.js';

function shadow(html) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = html;
  return root;
}
const key = (el, k, shiftKey = false) => {
  const event = new KeyboardEvent('keydown', {
    key: k,
    shiftKey,
    bubbles: true,
    composed: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
  return event;
};
const BUTTONS =
  '<div id="a" role="button" tabindex="0">A</div><div id="b" role="button" tabindex="0">B</div>';

describe('journeys/v2 a11y', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('wraps Tab at the edges only for modal creatives', () => {
    const root = shadow(BUTTONS);
    installA11y(root, { modal: true });
    const b = root.getElementById('b');
    b.focus();
    expect(key(b, 'Tab').defaultPrevented).toBe(true);
    expect(root.activeElement || document.activeElement).toBe(
      root.getElementById('a'),
    );

    document.body.innerHTML = '';
    const inline = shadow(BUTTONS);
    installA11y(inline, { modal: false });
    const last = inline.getElementById('b');
    last.focus();
    expect(key(last, 'Tab').defaultPrevented).toBe(false);
  });

  it("lets Tab through when the wrap target can't take focus", () => {
    const root = shadow(
      '<div id="a" role="button">A</div><button id="b">B</button>',
    );
    installA11y(root, { modal: true });
    const b = root.getElementById('b');
    b.focus();
    expect(key(b, 'Tab').defaultPrevented).toBe(false);
  });

  it('activates role=button with Enter and Space, but leaves native buttons to the browser', () => {
    const root = shadow(`${BUTTONS}<button id="n">N</button>`);
    installA11y(root, { modal: false });
    const a = root.getElementById('a');
    const clicks = vi.fn();
    a.addEventListener('click', clicks);
    key(a, 'Enter');
    key(a, ' ');
    expect(clicks).toHaveBeenCalledTimes(2);
    const native = root.getElementById('n');
    const nativeClicks = vi.fn();
    native.addEventListener('click', nativeClicks);
    expect(key(native, ' ').defaultPrevented).toBe(false);
    expect(nativeClicks).not.toHaveBeenCalled();
  });

  const DIALOG = `<main id="d" role="dialog" aria-label="Banner" tabindex="-1">${BUTTONS}</main>`;

  it("starts a modal's focus on the dialog itself, so its name is announced first", () => {
    const root = shadow(DIALOG);
    installA11y(root, { modal: true, onEscape() {} }).focusFirst();
    expect(root.activeElement).toBe(root.getElementById('d'));
  });

  it('gives the dialog a tabindex when it has none, so it can take focus', () => {
    const root = shadow('<div id="d" role="dialog">x</div>');
    installA11y(root, { modal: true, onEscape() {} }).focusFirst();
    expect(root.getElementById('d').getAttribute('tabindex')).toBe('-1');
    expect(root.activeElement).toBe(root.getElementById('d'));
  });

  it('keeps Tab and Shift+Tab inside a modal when focus is on the dialog', () => {
    const root = shadow(DIALOG);
    installA11y(root, { modal: true, onEscape() {} }).focusFirst();
    const dialog = root.getElementById('d');
    expect(key(dialog, 'Tab', true).defaultPrevented).toBe(true);
    expect(root.activeElement).toBe(root.getElementById('b'));
    dialog.focus();
    expect(key(dialog, 'Tab').defaultPrevented).toBe(true);
    expect(root.activeElement).toBe(root.getElementById('a'));
  });

  it("keeps a modal's Escape from the page, but not an inline banner's", () => {
    const pageKeys = [];
    const onPageKey = (event) => pageKeys.push(event.key);
    document.addEventListener('keydown', onPageKey);
    try {
      const modal = shadow(DIALOG);
      installA11y(modal, { modal: true, onEscape() {} });
      key(modal.getElementById('a'), 'Escape');
      key(modal.getElementById('a'), 'x');
      expect(pageKeys).toEqual(['x']);

      document.body.innerHTML = '';
      const inline = shadow(DIALOG);
      installA11y(inline, { modal: false, onEscape() {} });
      key(inline.getElementById('a'), 'Escape');
      expect(pageKeys).toEqual(['x', 'Escape']);
    } finally {
      document.removeEventListener('keydown', onPageKey);
    }
  });

  it('closes a modal on Escape, but not an inline banner', () => {
    const onEscape = vi.fn();
    const root = shadow(DIALOG);
    installA11y(root, { modal: true, onEscape });
    expect(key(root.getElementById('a'), 'Escape').defaultPrevented).toBe(true);
    expect(onEscape).toHaveBeenCalledTimes(1);

    document.body.innerHTML = '';
    const inlineEscape = vi.fn();
    const inline = shadow(DIALOG);
    installA11y(inline, { modal: false, onEscape: inlineEscape });
    expect(key(inline.getElementById('a'), 'Escape').defaultPrevented).toBe(
      false,
    );
    expect(inlineEscape).not.toHaveBeenCalled();
  });

  it('focuses the first control on show and restores page focus on uninstall', () => {
    document.body.innerHTML = '<input id="page-input">';
    const input = document.getElementById('page-input');
    input.focus();
    const root = shadow(BUTTONS);
    const handle = installA11y(root, { modal: true });
    handle.focusFirst();
    expect(root.activeElement).toBe(root.getElementById('a'));
    handle.uninstall();
    expect(document.activeElement).toBe(input);
  });

  it('leaves focus on the page when an inline banner shows', () => {
    document.body.innerHTML = '<input id="page-input">';
    const input = document.getElementById('page-input');
    input.focus();
    const root = shadow(BUTTONS);
    installA11y(root, { modal: false }).focusFirst();
    expect(document.activeElement).toBe(input);
    expect(root.activeElement).toBeNull();
  });

  it('hands focus back to where it entered the journey from', () => {
    document.body.innerHTML =
      '<input id="mount-time"><input id="entered-from">';
    document.getElementById('mount-time').focus();
    const root = shadow(BUTTONS);
    const handle = installA11y(root, { modal: false });
    const from = document.getElementById('entered-from');
    from.focus();
    root.getElementById('a').focus();
    handle.uninstall();
    expect(document.activeElement).toBe(from);
  });

  it("doesn't pull focus back once the visitor has left the journey", () => {
    document.body.innerHTML = '<input id="page-input"><input id="elsewhere">';
    const input = document.getElementById('page-input');
    input.focus();
    const root = shadow(BUTTONS);
    const handle = installA11y(root, { modal: true });
    handle.focusFirst();
    const elsewhere = document.getElementById('elsewhere');
    elsewhere.focus();
    handle.uninstall();
    expect(document.activeElement).toBe(elsewhere);
  });

  it('does nothing when nothing is focusable', () => {
    const root = shadow('<p>text</p>');
    const handle = installA11y(root, { modal: true });
    expect(() => handle.focusFirst()).not.toThrow();
    expect(() => key(root.querySelector('p'), 'Tab')).not.toThrow();
  });

  it('isModal for overlays, full page and scrims only', () => {
    const scrim = shadow(
      '<div class="branch-banner-dismiss-background"></div>',
    );
    const plain = shadow('<div></div>');
    const partial = makeRenderPayload({
      placement: { bannerHeight: { value: 76, unit: 'px' } },
    });
    expect(isModal(partial, scrim)).toBe(true);
    expect(isModal(partial, plain)).toBe(false);
    expect(isModal(makeRenderPayload(), plain)).toBe(true);
    expect(
      isModal(
        makeRenderPayload({
          creative: { deviceType: 'desktop', variant: 'overlay' },
          placement: { bannerHeight: { value: 76, unit: 'px' } },
        }),
        plain,
      ),
    ).toBe(true);
  });
});
