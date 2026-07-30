import { useMemo } from 'react';
import { useGuestPreferences } from './useGuestPreferences';
import { personalizationBoost } from '@/lib/personalization';

/**
 * Soft personalization re-ranking for event lists.
 *
 * Baseline stays time-based (soonest first). Personalization only adds a capped
 * bonus, so matching events surface earlier without filtering anything out.
 * Users without preferences (and venue owners) get the unchanged chronological order.
 */
export function useEventRanking<T extends { id: string; city?: string | null; starts_at: string; music_genres?: string[] | null }>(
  events: T[] | undefined,
): T[] {
  const { cities, genres, hasPreferences } = useGuestPreferences();

  return useMemo(() => {
    const list = events ?? [];
    if (!hasPreferences || list.length === 0) return list;

    const now = Date.now();
    const scored = list.map((event, index) => {
      const hoursUntil = Math.max(0, (new Date(event.starts_at).getTime() - now) / 3600000);
      // Time baseline dominates: ~1 point per hour of waiting, capped at 2 weeks out.
      const baseline = -Math.min(hoursUntil, 336);
      const boost = personalizationBoost(
        { cities, genres },
        { id: event.id, city: event.city, genres: event.music_genres ?? [] },
      );
      return { event, score: baseline + boost, index };
    });

    scored.sort((a, b) => (b.score - a.score) || (a.index - b.index));
    return scored.map((s) => s.event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, hasPreferences, cities.join('|'), genres.join('|')]);
}
