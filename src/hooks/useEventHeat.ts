import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HeatSignals } from '@/lib/eventHeat';

/** Aggregated RSVP / photo / nearby counts per event (server enforces visibility + nearby threshold). */
export function useEventHeat(eventIds: string[]) {
  const ids = [...new Set(eventIds)].sort();
  return useQuery({
    queryKey: ['event-heat', ids],
    enabled: ids.length > 0,
    refetchInterval: 120_000,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('event_heat', { _event_ids: ids });
      if (error) throw error;
      const map: Record<string, HeatSignals> = {};
      (data || []).forEach((row) => {
        map[row.event_id] = {
          going_count: row.going_count ?? 0,
          post_count: row.post_count ?? 0,
          onsite_post_count: row.onsite_post_count ?? 0,
          nearby_count: row.nearby_count ?? 0,
          nearby_going_count: row.nearby_going_count ?? undefined,
          nearby_walkin_count: row.nearby_walkin_count ?? undefined,
        };
      });
      return map;
    },
  });
}
