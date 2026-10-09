import type { RenderAction } from './types.js';

const CONTROLS: Array<{
  selector: string;
  type: 'click' | 'touchmove';
  action: RenderAction;
}> = [
  { selector: '#branch-mobile-action', type: 'click', action: 'cta' },
  { selector: '.branch-banner-continue', type: 'click', action: 'continue' },
  { selector: '.branch-banner-close', type: 'click', action: 'close' },
  {
    selector: '.branch-banner-dismiss-background',
    type: 'click',
    action: 'background-click',
  },
  {
    selector: '.branch-banner-dismiss-background',
    type: 'touchmove',
    action: 'background-swipe',
  },
];

export function bindControls(
  root: ParentNode,
  onAction: (action: RenderAction) => void,
): () => void {
  const unbinders: Array<() => void> = [];
  for (const control of CONTROLS) {
    for (const el of Array.from(root.querySelectorAll(control.selector))) {
      const isClick = control.type === 'click';
      const listener = (event: Event) => {
        // Outside v1's iframe, an <a href="#"> control would navigate the host page.
        if (isClick) {
          event.preventDefault();
        }
        onAction(control.action);
      };
      el.addEventListener(control.type, listener, { passive: !isClick });
      unbinders.push(() => el.removeEventListener(control.type, listener));
    }
  }
  return () => {
    for (const unbind of unbinders) {
      unbind();
    }
  };
}
