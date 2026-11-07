// How "hot" an event bubble on the Discover map is.
// Grows with real signals only: RSVPs ("dabei"), photos posted there, and people nearby right now.

export const HEAT_WEIGHTS = {
  going: 1,       // each "dabei" RSVP
  post: 1,        // each photo tagged to the event / posted at its venue during it
  onsitePost: 2,  // extra on top of `post` when the photo was verified on site (≤ 200 m) → 3 total
  nearby: 2,      // each person within 200 m while the event is live
} as const;

/** Below this many people nearby, the nearby signal is ignored so no one can be singled out. */
export const NEARBY_MIN = 3;

export const PHASE_MULTIPLIER = { live: 1.5, tonight: 1.2, upcoming: 1, past: 0.4 } as const;
export type HeatPhase = keyof typeof PHASE_MULTIPLIER;

export interface HeatSignals {
  going_count: number;
  post_count: number;
  onsite_post_count: number;
  nearby_count: number;
}

const DEFAULT_DURATION_MS = 6 * 60 * 60 * 1000;
const TONIGHT_WINDOW_MS = 12 * 60 * 60 * 1000;

export function heatPhase(startsAt: string | Date, endsAt: string | Date | null | undefined, now: Date = new Date()): HeatPhase {
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + DEFAULT_DURATION_MS;
  const t = now.getTime();
  if (t > end) return 'past';
  if (t >= start) return 'live';
  if (start - t <= TONIGHT_WINDOW_MS) return 'tonight';
  return 'upcoming';
}

export function heatScore(signals: Partial<HeatSignals> | null | undefined, phase: HeatPhase): number {
  const going = Math.max(0, signals?.going_count ?? 0);
  const posts = Math.max(0, signals?.post_count ?? 0);
  const onsite = Math.max(0, signals?.onsite_post_count ?? 0);
  const rawNearby = Math.max(0, signals?.nearby_count ?? 0);
  const nearby = phase === 'live' && rawNearby >= NEARBY_MIN ? rawNearby : 0;
  const base =
    going * HEAT_WEIGHTS.going +
    posts * HEAT_WEIGHTS.post +
    onsite * HEAT_WEIGHTS.onsitePost +
    nearby * HEAT_WEIGHTS.nearby;
  return base * PHASE_MULTIPLIER[phase];
}

/** Pin diameter in px: 28 with no signals, growing up to 52. */
export function heatMarkerSize(score: number): number {
  return Math.round(28 + Math.min(24, Math.sqrt(Math.max(0, score)) * 4));
}
