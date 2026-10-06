import { safejson } from '../core/safejson.js';

export interface JourneyStorage {
  get(key: string, local?: boolean): any;
  set(key: string, value: any, local?: boolean): void;
  remove(key: string, local?: boolean): void;
}

export const GLOBAL_DISMISS_KEY = 'globalJourneysDismiss';
export const VIEW_DISMISSALS_KEY = 'journeyDismissals';

export function addSecondsToNow(seconds: number): number {
  const currentDate = new Date();
  return currentDate.setSeconds(currentDate.getSeconds() + seconds);
}

// -1 means "forever" (stored as true); a number is seconds from now.
export function globalDismissDeadline(metadata: {
  globalDismissPeriod?: unknown;
}): true | number | undefined {
  const period = metadata.globalDismissPeriod;
  if (typeof period === 'number') {
    return period === -1 ? true : addSecondsToNow(period);
  }
  return undefined;
}

export function recordGlobalDismiss(
  storage: JourneyStorage,
  deadline: true | number | undefined,
): void {
  if (deadline !== undefined) {
    storage.set(GLOBAL_DISMISS_KEY, deadline, true);
  }
}

export function recordViewDismiss(
  storage: JourneyStorage,
  templateId: string,
  audienceRuleId: string | undefined,
): Record<string, { view_id: string; dismiss_time: number }> {
  const stored = storage.get(VIEW_DISMISSALS_KEY, true);
  const dismissals = stored ? safejson.parse(stored) : {};
  dismissals[audienceRuleId as string] = {
    view_id: templateId,
    dismiss_time: Date.now(),
  };
  storage.set(VIEW_DISMISSALS_KEY, safejson.stringify(dismissals), true);
  return dismissals;
}

export function isDismissedGlobally(storage: JourneyStorage): boolean {
  const deadline = storage.get(GLOBAL_DISMISS_KEY, true);
  if (deadline === true || deadline > Date.now()) {
    return true;
  }
  storage.remove(GLOBAL_DISMISS_KEY, true);
  return false;
}
