import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CONSENT_KEY = 'feyrn.presence.consent';
const PING_INTERVAL_MS = 5 * 60 * 1000;

export type PresenceConsent = 'granted' | 'declined' | null;

function readConsent(): PresenceConsent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

async function currentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') return null;
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
    if (!('geolocation' in navigator)) return null;
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
      );
    });
  } catch {
    return null;
  }
}

/**
 * Opt-in, foreground-only "I'm nearby" signal for live events.
 * The position is sent once per ping and never stored — the server only keeps an anonymous count per event.
 */
export function useEventPresence(enabled: boolean) {
  const [consent, setConsent] = useState<PresenceConsent>(readConsent);
  const queryClient = useQueryClient();

  const ping = useCallback(async () => {
    const pos = await currentPosition();
    if (!pos) return;
    const { error } = await supabase.rpc('ping_event_presence', { _lat: pos.lat, _lng: pos.lng });
    if (!error) queryClient.invalidateQueries({ queryKey: ['event-heat'] });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled || consent !== 'granted') return;
    ping();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') ping();
    }, PING_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, consent, ping]);

  const decide = useCallback(async (granted: boolean) => {
    try { localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'declined'); } catch { /* ignore */ }
    setConsent(granted ? 'granted' : 'declined');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_consents').insert({
        user_id: user.id, consent_type: 'presence_location', granted, version: '1',
      });
    }
  }, []);

  return { consent, decide };
}
