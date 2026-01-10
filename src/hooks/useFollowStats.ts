import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export const useFollowStats = (profileId?: string) => {
  return useQuery({
    queryKey: ['follow-stats', profileId],
    queryFn: async () => {
      if (!profileId) return { followers: 0, following: 0 };

      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', profileId),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', profileId),
      ]);

      return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      };
    },
    enabled: !!profileId,
  });
};

export const usePostsCount = (profileId?: string) => {
  return useQuery({
    queryKey: ['posts-count', profileId],
    queryFn: async () => {
      if (!profileId) return 0;

      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', profileId);

      return count || 0;
    },
    enabled: !!profileId,
  });
};

export const useIsFollowing = (targetProfileId?: string) => {
  const { data: myProfile } = useProfile();

  return useQuery({
    queryKey: ['is-following', myProfile?.id, targetProfileId],
    queryFn: async () => {
      if (!myProfile?.id || !targetProfileId) return false;

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', myProfile.id)
        .eq('following_id', targetProfileId)
        .maybeSingle();

      return !!data;
    },
    enabled: !!myProfile?.id && !!targetProfileId,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  const { data: myProfile } = useProfile();

  return useMutation({
    mutationFn: async ({ targetProfileId, isFollowing }: { targetProfileId: string; isFollowing: boolean }) => {
      if (!myProfile?.id) throw new Error('Not authenticated');

      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', myProfile.id)
          .eq('following_id', targetProfileId);
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: myProfile.id,
            following_id: targetProfileId,
          });
      }
    },
    onSuccess: (_, { targetProfileId }) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', myProfile?.id, targetProfileId] });
      queryClient.invalidateQueries({ queryKey: ['follow-stats'] });
    },
  });
};
