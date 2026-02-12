import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { PostWithAuthor } from './usePosts';

/**
 * Loads the list of profile IDs that the current user follows.
 */
export const useMyFollowingIds = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['my-following-ids', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [] as string[];

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profile.id);

      if (error) throw error;
      return (data || []).map((f) => f.following_id);
    },
    enabled: !!profile?.id,
  });
};

function calculatePostScore(
  post: PostWithAuthor,
  followingIds: string[],
  locationCounts: Map<string, number>
): number {
  let score = 0;

  // 1. Recency – newer = higher (max 50, decays over ~50 hours)
  const minutesOld =
    (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60);
  score += Math.max(0, 50 - minutesOld / 60);

  // 2. Engagement
  score += (post.likes_count || 0) * 2;
  score += (post.comments_count || 0) * 3;

  // 3. Author popularity (capped at 30)
  const authorPoints = post.author?.social_cloud_points || 0;
  score += Math.min(30, authorPoints / 10);

  // 4. Follower boost
  if (post.author && followingIds.includes(post.author.id)) {
    score += 25;
  }

  // 5. Popular location bonus
  if (post.location_name) {
    const count = locationCounts.get(post.location_name.toLowerCase()) || 0;
    if (count >= 2) score += 15;
  }

  // 6. Moment-X bonus
  if (post.is_moment_x) score += 20;

  // 7. Music bonus
  if (post.music_url) score += 5;

  return score;
}

/**
 * Takes raw posts + follow data and returns them sorted by relevance score.
 */
export function useFeedAlgorithm(posts: PostWithAuthor[] | undefined) {
  const { data: followingIds = [] } = useMyFollowingIds();

  return useMemo(() => {
    if (!posts || posts.length === 0) return [];

    // Build location frequency map
    const locationCounts = new Map<string, number>();
    for (const post of posts) {
      if (post.location_name) {
        const key = post.location_name.toLowerCase();
        locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
      }
    }

    // Score and sort
    const scored = posts.map((post) => ({
      post,
      score: calculatePostScore(post, followingIds, locationCounts),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.post);
  }, [posts, followingIds]);
}
