import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type PushPreferences = Tables<'push_preferences'>;

export const usePushPreferences = (profileId?: string | null) =>
  useQuery({
    queryKey: ['push-preferences', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_preferences')
        .select('*')
        .eq('profile_id', profileId!)
        .maybeSingle();
      if (error) throw error;
      return data as PushPreferences | null;
    },
  });

export const useUpdatePushPreferences = (profileId?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: TablesUpdate<'push_preferences'>) => {
      if (!profileId) throw new Error('No profile');
      const { error } = await supabase
        .from('push_preferences')
        .upsert(
          { profile_id: profileId, ...updates, updated_at: new Date().toISOString() },
          { onConflict: 'profile_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push-preferences', profileId] }),
  });
};
