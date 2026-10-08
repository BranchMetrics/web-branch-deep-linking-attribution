export type PlacementUnit =
  | 'px'
  | '%'
  | 'vh'
  | 'svh'
  | 'dvh'
  | 'vw'
  | 'svw'
  | 'em'
  | 'rem';

export interface Dimension {
  value: number;
  unit: PlacementUnit;
}

export interface RenderPayload {
  creative: {
    deviceType: 'mobile' | 'desktop';
    variant?: string;
    html: string;
    // As written for v1's iframe; the renderer adapts it to the shadow root.
    css: string;
    wcag: boolean;
  };
  placement: {
    sticky: 'absolute' | 'fixed';
    anchorY: 'top' | 'bottom';
    bannerHeight: Dimension;
    offsetY?: Dimension;
    isIntrinsic: boolean;
    injectorSelector?: string;
  };
  // #branch-banner's box (v1's iframe CSS). css is empty for intrinsic creatives.
  geometry: {
    css: string;
    zIndex: number;
    // The distance is measured: banner height plus placement.offsetY.
    push?: { side: 'top' | 'bottom' };
  };
  animation: { enterClass: string; exitClass: string; css: string };
  fonts: string[];
  ctaText: { hasApp?: string; noApp?: string };
}

export type Platform = 'ios' | 'android' | 'other';

export type RenderAction =
  | 'cta'
  | 'close'
  | 'continue'
  | 'background-click'
  | 'background-swipe';

export interface RenderOptions {
  document?: Document;
  /** Applied to every <style>/<link> the renderer creates. */
  nonce?: string;
  platform: Platform;
  hasApp: boolean;
  entryAnimationDisabled?: boolean;
  exitAnimationDisabled?: boolean;
  /** Not called once close() starts. */
  onAction(action: RenderAction): void;
  onShown?(): void;
  /** The host left the document out of band (e.g. an SPA replaced the body) while not
   * closing. Already torn down; close() and discard() are no-ops after it. */
  onRemoved?(): void;
}

export interface RenderedJourney {
  /** Not closed, and the host is still in the document. */
  isLive(): boolean;
  /** #branch-banner's rendered height in px. */
  bannerHeight(): number;
  /** False if already closing or closed. Before the entrance finishes, skips the exit animation. */
  close(onClosed?: () => void): boolean;
  /** Immediate teardown, no callbacks. */
  discard(): void;
}
