import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: TablesUpdate<'profiles'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};

export const useProfileById = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!profileId,
  });
};

/** Own profile (read + update). */
export const useMyProfile = () => {
  const query = useProfile();
  const update = useUpdateProfile();
  return { ...query, update };
};

export type PublicProfile = { id: string; display_name: string | null; avatar_url: string | null; city: string | null; username: string | null };

/** One batched query for many profiles — avoids N+1. */
export const usePublicProfiles = (ids: string[]) => {
  const unique = Array.from(new Set(ids.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['public-profiles', unique],
    enabled: unique.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('public_profiles').select('*').in('id', unique);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.id, p as PublicProfile])) as Record<string, PublicProfile>;
    },
  });
};
