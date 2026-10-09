import type { Dimension, RenderPayload } from './types.js';

const RELATIVE_UNITS = ['vh', 'svh', 'dvh', '%'];

export function dimensionCss(d: Dimension): string {
  return `${d.value}${d.unit}`;
}

export function isRelative(d: Dimension): boolean {
  return RELATIVE_UNITS.indexOf(d.unit) !== -1;
}

export function isFullPage(placement: RenderPayload['placement']): boolean {
  return (
    isRelative(placement.bannerHeight) && placement.bannerHeight.value >= 100
  );
}
