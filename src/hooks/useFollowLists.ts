import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FollowProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export const useFollowers = (profileId?: string) => {
  return useQuery({
    queryKey: ['followers-list', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', profileId);

      if (error) throw error;

      return (data || []).map((item) => item.follower as unknown as FollowProfile);
    },
    enabled: !!profileId,
  });
};

export const useFollowing = (profileId?: string) => {
  return useQuery({
    queryKey: ['following-list', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('follower_id', profileId);

      if (error) throw error;

      return (data || []).map((item) => item.following as unknown as FollowProfile);
    },
    enabled: !!profileId,
  });
};
