import { safejson } from '../core/safejson.js';

export interface JourneyStorage {
  get(key: string, local?: boolean): any;
  set(key: string, value: any, local?: boolean): void;
  remove(key: string, local?: boolean): void;
}

export const GLOBAL_DISMISS_KEY = 'globalJourneysDismiss';
export const VIEW_DISMISSALS_KEY = 'journeyDismissals';

// Keyed by audience rule ID.
type ViewDismissals = Record<string, { view_id: string; dismiss_time: number }>;

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
): ViewDismissals {
  const stored = storage.get(VIEW_DISMISSALS_KEY, true);
  const dismissals = stored ? safejson.parse(stored) : {};
  dismissals[audienceRuleId as string] = {
    view_id: templateId,
    dismiss_time: Date.now(),
  };
  storage.set(VIEW_DISMISSALS_KEY, safejson.stringify(dismissals), true);
  return dismissals;
}

function readDismissals(value: unknown): ViewDismissals {
  try {
    return (typeof value === 'string' && safejson.parse(value)) || {};
  } catch (_e) {
    return {};
  }
}

// Whether the view, or its audience rule, was dismissed after a request carrying
// `sent` (its journey_dismissals) was built. The server answering that request
// couldn't apply the dismissal.
export function dismissedSince(
  storage: JourneyStorage,
  sent: unknown,
  viewId: string | undefined,
  audienceRuleId: string | undefined,
): boolean {
  const before = readDismissals(sent);
  const now = readDismissals(storage.get(VIEW_DISMISSALS_KEY, true));
  return Object.keys(now).some((rule) => {
    const entry = now[rule];
    return (
      !!entry &&
      ((!!audienceRuleId && rule === audienceRuleId) ||
        (!!viewId && entry.view_id === viewId)) &&
      before[rule]?.dismiss_time !== entry.dismiss_time
    );
  });
}

export function isDismissedGlobally(storage: JourneyStorage): boolean {
  const deadline = storage.get(GLOBAL_DISMISS_KEY, true);
  if (deadline === true || deadline > Date.now()) {
    return true;
  }
  storage.remove(GLOBAL_DISMISS_KEY, true);
  return false;
}
