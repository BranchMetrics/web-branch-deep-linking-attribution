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
    html: string;
    // As written for v1's iframe; its html, :root and body rules match nothing in the
    // shadow root (see mount.ts).
    css: string;
  };
  // #branch-banner's box: v1's iframe CSS, property to value, in order. Empty for
  // intrinsic creatives, whose placement rule stays in the creative CSS as in v1.
  box: { style: Record<string, string> };
  page: {
    // The distance is measured: banner height plus offset.
    push?: { side: 'top' | 'bottom'; offset?: Dimension };
    lockScroll: boolean;
    shiftTopElements: boolean;
  };
  presentation: { fullPage: boolean; modal: boolean };
  animation: { enterClass: string; exitClass: string; css: string };
  fonts: Array<{ family: string; url: string }>;
  ctaText: { hasApp: string; noApp: string };
  // Only for willShowJourney's v1-era fields (bannerPagePlacement, isBannerInline,
  // isBannerSticky); the renderer ignores it. To go once page CSS variables replace them.
  showEvent: { position: 'top' | 'bottom'; sticky: 'absolute' | 'fixed' };
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
