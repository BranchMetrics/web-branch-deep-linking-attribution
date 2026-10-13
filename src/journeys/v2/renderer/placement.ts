import { dimensionCss, isFullPage } from './dimension.js';
import { setNonce } from './nonce.js';
import type { Dimension, RenderPayload } from './types.js';

const PAGE_STYLE_ID = 'branch-journey-page';
const ACTIVE_CLASS = 'branch-banner-is-active';
// v1's scroll-lock class; page code may rely on it.
const NO_SCROLL_CLASS = 'branch-banner-no-scroll';

type Push = NonNullable<RenderPayload['geometry']['push']>;

interface PageState {
  style: HTMLStyleElement;
  push?: Push;
  lockScroll: boolean;
}

export interface PlacementState {
  document: Document;
  page: PageState | null;
  parents: Array<{ el: HTMLElement; marginTop: string }>;
  observer?: ResizeObserver;
}

// The body push and scroll lock, in one <style> so teardown leaves nothing behind. A
// margin, not a spacer element, so it works with any body layout. !important beats page
// classes and later CSS-in-JS.
function pageCss(page: PageState, pushSize?: string) {
  const { push, lockScroll } = page;
  const declarations = [
    push && `transition: margin-${push.side} 0.25s ease;`,
    push && pushSize && `margin-${push.side}: ${pushSize} !important;`,
    lockScroll && 'overflow: hidden !important;',
  ].filter(Boolean);
  const body = `body { ${declarations.join(' ')} }`;
  // Overflow set on html stops body's from reaching the viewport.
  return lockScroll ? `html { overflow: hidden !important; } ${body}` : body;
}

// Banner height plus offset. The offset comes from the placement, not the banner's
// position, which the push itself can move.
function pushSize(height: string, offsetY?: Dimension): string {
  return offsetY?.value ? `calc(${height} + ${dimensionCss(offsetY)})` : height;
}

function injectorParents(
  doc: Document,
  payload: RenderPayload,
): PlacementState['parents'] {
  const selector = payload.placement.injectorSelector;
  if (!selector) {
    return [];
  }
  let injectors: Element[];
  try {
    injectors = Array.from(doc.querySelectorAll(selector));
  } catch (_e) {
    return [];
  }
  const fullPage = isFullPage(payload.placement);
  const pushed: PlacementState['parents'] = [];
  for (const injector of injectors) {
    const parent = injector.parentElement;
    if (!parent || pushed.some((p) => p.el === parent)) {
      continue;
    }
    // A full-page creative already covers fixed navs.
    if (
      fullPage &&
      (doc.defaultView as Window)
        .getComputedStyle(parent)
        .getPropertyValue('position') === 'fixed'
    ) {
      continue;
    }
    pushed.push({ el: parent, marginTop: parent.style.marginTop });
  }
  return pushed;
}

export function applyPlacement(
  payload: RenderPayload,
  banner: HTMLElement,
  opts: { document: Document; nonce?: string },
): PlacementState {
  const doc = opts.document;
  const state: PlacementState = { document: doc, page: null, parents: [] };
  const { push } = payload.geometry;
  const lockScroll =
    isFullPage(payload.placement) && payload.placement.sticky === 'fixed';
  // State is recorded step by step so a failure can undo what was applied.
  try {
    // Before the page style is added, so its computed-style reads don't force a restyle.
    state.parents = injectorParents(doc, payload);
    if (push || lockScroll) {
      const style = doc.createElement('style');
      style.id = PAGE_STYLE_ID;
      setNonce(style, opts.nonce);
      state.page = { style, push, lockScroll };
      doc.head.appendChild(style);
    }
    // Not payload: the observer would keep the creative's HTML and CSS alive.
    const { offsetY } = payload.placement;
    let lastHeight = '';
    const update = () => {
      // Read before writing to avoid extra layouts.
      const height = `${banner.offsetHeight}px`;
      // Rewriting the page style restyles the whole page; the observer's first
      // notification repeats the initial height.
      if (height === lastHeight) {
        return;
      }
      lastHeight = height;
      const page = state.page;
      if (page) {
        page.style.textContent = pageCss(page, pushSize(height, offsetY));
      }
      for (const { el } of state.parents) {
        el.style.marginTop = height;
      }
    };
    update();
    const Observer = (doc.defaultView as (Window & typeof globalThis) | null)
      ?.ResizeObserver;
    if (Observer && (push || state.parents.length > 0)) {
      state.observer = new Observer(update);
      state.observer.observe(banner);
    }
    if (lockScroll) {
      doc.body.classList.add(NO_SCROLL_CLASS);
    }
    doc.body.classList.add(ACTIVE_CLASS);
  } catch (e) {
    releasePlacement(state);
    throw e;
  }
  return state;
}

// Drops the body push during the exit; the rest waits for release.
export function collapsePush(state: PlacementState): void {
  state.observer?.disconnect();
  const page = state.page;
  if (page?.push) {
    page.style.textContent = pageCss(page);
  }
}

export function releasePlacement(state: PlacementState): void {
  state.observer?.disconnect();
  state.page?.style.remove();
  for (const { el, marginTop } of state.parents) {
    el.style.marginTop = marginTop;
  }
  state.document.body.classList.remove(ACTIVE_CLASS, NO_SCROLL_CLASS);
}
