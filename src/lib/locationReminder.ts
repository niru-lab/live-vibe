// Location reminder for users who said "Nicht jetzt": shown in-app only (never push),
// when the app is opened a second time within an hour — a good sign someone is planning their night.
// Everything here stays on the device; nothing about app opens is sent to the server.

export const LOCATION_REMINDER = {
  /** Re-opening sooner than this is app switching, not a new open. */
  minOpenGapMs: 2 * 60 * 1000,
  /** A second open within this window triggers the reminder. */
  activeWindowMs: 60 * 60 * 1000,
  /** At most one reminder per this period. */
  cooldownMs: 7 * 24 * 60 * 60 * 1000,
  /** After this many "Nicht jetzt" no automatic reminders anymore. */
  maxDismissals: 3,
} as const;

export interface ReminderState {
  lastOpenAt: number | null;
  lastReminderAt: number | null;
  dismissals: number;
}

export const EMPTY_REMINDER_STATE: ReminderState = { lastOpenAt: null, lastReminderAt: null, dismissals: 0 };

/** Registers an app open. `secondOpenWithinWindow` is true when this open is the 2nd within the active window. */
export function registerOpen(state: ReminderState, now: number): { state: ReminderState; secondOpenWithinWindow: boolean } {
  const last = state.lastOpenAt;
  if (last !== null && now - last >= 0 && now - last < LOCATION_REMINDER.minOpenGapMs) {
    return { state, secondOpenWithinWindow: false };
  }
  const secondOpenWithinWindow = last !== null && now - last >= 0 && now - last <= LOCATION_REMINDER.activeWindowMs;
  return { state: { ...state, lastOpenAt: now }, secondOpenWithinWindow };
}

/** Whether the cooldown and the dismissal cap still allow a reminder. */
export function reminderAllowed(state: ReminderState, now: number): boolean {
  if (state.dismissals >= LOCATION_REMINDER.maxDismissals) return false;
  return state.lastReminderAt === null || now - state.lastReminderAt >= LOCATION_REMINDER.cooldownMs;
}

export function markReminderShown(state: ReminderState, now: number): ReminderState {
  return { ...state, lastReminderAt: now };
}

export function markReminderDismissed(state: ReminderState): ReminderState {
  return { ...state, dismissals: state.dismissals + 1 };
}

const storageKey = (userId: string) => `feyrn.location-reminder.${userId}`;

export function loadReminderState(userId: string): ReminderState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return EMPTY_REMINDER_STATE;
    const v = JSON.parse(raw) as Partial<ReminderState>;
    return {
      lastOpenAt: typeof v.lastOpenAt === 'number' ? v.lastOpenAt : null,
      lastReminderAt: typeof v.lastReminderAt === 'number' ? v.lastReminderAt : null,
      dismissals: typeof v.dismissals === 'number' ? v.dismissals : 0,
    };
  } catch {
    return EMPTY_REMINDER_STATE;
  }
}

export function saveReminderState(userId: string, state: ReminderState): void {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(state)); } catch { /* storage unavailable */ }
}
