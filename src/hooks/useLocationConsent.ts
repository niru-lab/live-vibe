import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkLocationPermission, deniedLocationHint, requestLocationPermission } from '@/lib/geo';

export const LOCATION_STATUS_KEY = 'location-status';

export interface LocationStatus {
  /** privacy_settings.location_enabled — the only switch the server obeys. */
  enabled: boolean;
  /** The user answered the location question at least once. */
  decided: boolean;
}

/**
 * Single entry point for the location opt-in (start sheet, reminders, post hint, privacy settings).
 * Server state is authoritative; turning it off wipes presence server-side immediately.
 */
export function useLocationConsent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: [LOCATION_STATUS_KEY, user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<LocationStatus> => {
      const { data, error } = await supabase.rpc('my_location_status');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { enabled: !!row?.enabled, decided: !!row?.decided };
    },
  });

  const save = useMutation({
    mutationFn: async ({ enabled, source }: { enabled: boolean; source: string }) => {
      const { error } = await supabase.rpc('set_location_enabled', { _enabled: enabled, _source: source });
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.setQueryData<LocationStatus>([LOCATION_STATUS_KEY, user?.id], { enabled, decided: true });
      queryClient.invalidateQueries({ queryKey: ['event-heat'] });
    },
  });

  /**
   * "Standort erlauben": asks the OS first, then stores the decision.
   * Returns true only if location is now on.
   */
  const enable = useCallback(async (source: string): Promise<boolean> => {
    // If the OS can't give us a location, the answer is still stored so the start sheet doesn't come back.
    const recordOff = (reason: string) => save.mutateAsync({ enabled: false, source: `${source}:${reason}` }).catch(() => undefined);
    const before = await checkLocationPermission();
    if (before === 'unavailable') {
      await recordOff('os_unavailable');
      toast.error('Dein Gerät stellt keinen Standort bereit.');
      return false;
    }
    if (before === 'denied') {
      await recordOff('os_blocked');
      toast.message('Standort ist blockiert', { description: deniedLocationHint(), duration: 8000 });
      return false;
    }
    const granted = before === 'granted' || (await requestLocationPermission());
    if (!granted) {
      await recordOff('os_denied');
      toast.message('Kein Standortzugriff', { description: deniedLocationHint(), duration: 8000 });
      return false;
    }
    try {
      await save.mutateAsync({ enabled: true, source });
      return true;
    } catch {
      toast.error('Konnte nicht gespeichert werden. Bitte versuch es nochmal.');
      return false;
    }
  }, [save]);

  /** "Nicht jetzt" / switch off. */
  const disable = useCallback(async (source: string): Promise<void> => {
    try {
      await save.mutateAsync({ enabled: false, source });
    } catch {
      toast.error('Konnte nicht gespeichert werden. Bitte versuch es nochmal.');
    }
  }, [save]);

  return {
    status: status.data,
    isLoading: status.isLoading,
    enabled: !!status.data?.enabled,
    decided: !!status.data?.decided,
    saving: save.isPending,
    enable,
    disable,
  };
}
