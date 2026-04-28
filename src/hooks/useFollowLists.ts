import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface FollowProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_mutual?: boolean; // viewer follows this profile too
}

// Helper: returns set of profile ids the viewer follows
const useViewerFollowingIds = () => {
  const { data: myProfile } = useProfile();
  return useQuery({
    queryKey: ['viewer-following-ids', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return new Set<string>();
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', myProfile.id);
      if (error) throw error;
      return new Set((data || []).map((r) => r.following_id as string));
    },
    enabled: !!myProfile?.id,
  });
};

export const useFollowers = (profileId?: string) => {
  const { data: viewerFollowing } = useViewerFollowingIds();
  return useQuery({
    queryKey: ['followers-list', profileId, Array.from(viewerFollowing || []).sort().join(',')],
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

      const profiles = (data || []).map((item) => item.follower as unknown as FollowProfile);
      return profiles.map((p) => ({ ...p, is_mutual: viewerFollowing?.has(p.id) ?? false }));
    },
    enabled: !!profileId,
  });
};

export const useFollowing = (profileId?: string) => {
  const { data: viewerFollowing } = useViewerFollowingIds();
  return useQuery({
    queryKey: ['following-list', profileId, Array.from(viewerFollowing || []).sort().join(',')],
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

      const profiles = (data || []).map((item) => item.following as unknown as FollowProfile);
      return profiles.map((p) => ({ ...p, is_mutual: viewerFollowing?.has(p.id) ?? false }));
    },
    enabled: !!profileId,
  });
};

/**
 * Posts of the target user that have been liked by people the viewer also follows.
 * Returns posts with the list of mutual likers.
 */
export interface MutualLikedPost {
  post_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  likers: FollowProfile[];
}

export const useMutualLikedPosts = (targetProfileId?: string) => {
  const { data: myProfile } = useProfile();
  const { data: viewerFollowing } = useViewerFollowingIds();

  return useQuery({
    queryKey: ['mutual-liked-posts', targetProfileId, myProfile?.id, Array.from(viewerFollowing || []).sort().join(',')],
    queryFn: async (): Promise<MutualLikedPost[]> => {
      if (!targetProfileId || !myProfile?.id || !viewerFollowing || viewerFollowing.size === 0) return [];

      // Get target user's posts
      const { data: posts, error: postsErr } = await supabase
        .from('posts')
        .select('id, media_url, media_type, caption')
        .eq('author_id', targetProfileId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (postsErr) throw postsErr;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);
      const followingIds = Array.from(viewerFollowing);

      // Likes on those posts by people viewer follows
      const { data: likes, error: likesErr } = await supabase
        .from('likes')
        .select('post_id, user_id')
        .in('post_id', postIds)
        .in('user_id', followingIds);
      if (likesErr) throw likesErr;
      if (!likes || likes.length === 0) return [];

      const likerIds = Array.from(new Set(likes.map((l) => l.user_id)));
      const { data: likerProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', likerIds);
      if (profErr) throw profErr;

      const profileMap = new Map((likerProfiles || []).map((p) => [p.id, p as FollowProfile]));

      // Group likes by post
      const grouped = new Map<string, FollowProfile[]>();
      for (const l of likes) {
        const prof = profileMap.get(l.user_id);
        if (!prof) continue;
        if (!grouped.has(l.post_id)) grouped.set(l.post_id, []);
        grouped.get(l.post_id)!.push(prof);
      }

      return posts
        .filter((p) => grouped.has(p.id))
        .map((p) => ({
          post_id: p.id,
          media_url: p.media_url,
          media_type: p.media_type,
          caption: p.caption,
          likers: grouped.get(p.id)!,
        }));
    },
    enabled: !!targetProfileId && !!myProfile?.id,
  });
};
