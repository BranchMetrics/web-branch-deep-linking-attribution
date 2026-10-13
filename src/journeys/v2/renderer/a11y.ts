import { isFullPage } from './dimension.js';
import type { RenderPayload } from './types.js';

const FOCUSABLE =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]';
// Where a modal's focus starts: the dialog itself, so screen readers announce its name
// and read its content before the controls (the builder's WCAG markup has one).
const DIALOG = '[role="dialog"], [role="alertdialog"]';

// Only modal creatives trap Tab; trapping inline banners fails WCAG 2.1.2.
export function isModal(payload: RenderPayload, root: ParentNode): boolean {
  return (
    (payload.creative.deviceType === 'desktop' &&
      payload.creative.variant === 'overlay') ||
    isFullPage(payload.placement) ||
    !!root.querySelector('.branch-banner-dismiss-background')
  );
}

export interface A11yHandle {
  focusFirst(): void;
  uninstall(): void;
}

export function installA11y(
  root: ShadowRoot,
  opts: { modal: boolean; onEscape(): void },
): A11yHandle {
  let returnTo: HTMLElement | null = null;
  const onFocusIn = (event: FocusEvent) => {
    const from = event.relatedTarget as HTMLElement | null;
    if (from && !root.contains(from)) {
      returnTo = from;
    }
  };
  const focusables = () =>
    Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (event.key === 'Escape' && opts.modal) {
      opts.onEscape();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key === 'Tab') {
      if (!opts.modal) {
        return;
      }
      const list = focusables();
      if (list.length === 0) {
        return;
      }
      // -1: focus is on something else inside, such as the dialog itself.
      const at = list.indexOf(target as HTMLElement);
      const next = event.shiftKey
        ? at <= 0 && list[list.length - 1]
        : (at === -1 || at === list.length - 1) && list[0];
      // focus() silently fails on hidden, disabled or tabindex-less role=button
      // elements; trapping then would leave Tab stuck.
      if (next) {
        next.focus();
        if (root.activeElement === next) {
          event.preventDefault();
        }
      }
      return;
    }
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      target &&
      target.getAttribute('role') === 'button' &&
      target.tagName !== 'BUTTON'
    ) {
      target.click();
      event.preventDefault();
    }
  };
  root.addEventListener('keydown', onKeyDown as EventListener);
  root.addEventListener('focusin', onFocusIn as EventListener);

  return {
    focusFirst() {
      if (!opts.modal) {
        return;
      }
      const target =
        root.querySelector<HTMLElement>(DIALOG) ||
        focusables()[0] ||
        root.querySelector<HTMLElement>('.branch-banner-content');
      if (!target) {
        return;
      }
      if (!target.hasAttribute('tabindex') && !target.matches(FOCUSABLE)) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
    },
    uninstall() {
      root.removeEventListener('keydown', onKeyDown as EventListener);
      root.removeEventListener('focusin', onFocusIn as EventListener);
      // Must run before the host is removed.
      if (root.activeElement && returnTo?.isConnected) {
        returnTo.focus();
      }
    },
  };
}
