import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readPosition } from '@/lib/geo';

const PING_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Opt-in, foreground-only "I'm nearby" signal for live events.
 * Runs only while `enabled` (privacy_settings.location_enabled) is true and stops at once when it turns off.
 * The position is sent once per ping and never stored — the server keeps only event, profile, time and RSVP flag.
 */
export function useEventPresence(enabled: boolean) {
  const queryClient = useQueryClient();

  const ping = useCallback(async () => {
    const pos = await readPosition();
    if (!pos) return;
    const { error } = await supabase.rpc('ping_event_presence', { _lat: pos.lat, _lng: pos.lng });
    if (!error) queryClient.invalidateQueries({ queryKey: ['event-heat'] });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;
    if (document.visibilityState === 'visible') ping();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') ping();
    }, PING_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, ping]);
}
