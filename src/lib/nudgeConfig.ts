/**
 * Central, tunable config + helpers for in-app activation nudges.
 * Keep all timing/suppression knobs here so behaviour can be tuned in one place.
 */

/** Delay after publishing before the "post was ignored" feeling is real. */
export const RESCUE_MIN_AGE_MS = 2 * 60 * 60 * 1000; // 2h
/** Only rescue early users — after this the moment has passed. */
export const RESCUE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7d

const SESSION_ACTIVITY_KEY = 'feyrn:session-exploring';

/** Mark that the user is self-propelled (exploring/following) in this session. */
export const markSessionExploring = () => {
  try {
    sessionStorage.setItem(SESSION_ACTIVITY_KEY, '1');
  } catch {
    /* storage unavailable — ignore */
  }
};

export const isSessionExploring = () => {
  try {
    return sessionStorage.getItem(SESSION_ACTIVITY_KEY) === '1';
  } catch {
    return false;
  }
};

export type NudgeEvent =
  | 'nudge_eligible'
  | 'nudge_shown'
  | 'nudge_dismissed'
  | 'nudge_cta_clicked';

/** High-level, privacy-safe instrumentation. No user content, no payloads. */
export const trackNudge = (event: NudgeEvent, nudge: string) => {
  if (import.meta.env.DEV) {
    console.info(`[nudge] ${event}`, { nudge });
  }
};
