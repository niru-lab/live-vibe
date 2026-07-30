import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Rescue nudge state: guest users whose first post got no engagement within an
 * early activation window. Isolated + easily tunable / removable.
 */
import {
  RESCUE_MIN_AGE_MS as MIN_AGE_MS,
  RESCUE_MAX_AGE_MS as MAX_AGE_MS,
  isSessionExploring,
  trackNudge,
} from '@/lib/nudgeConfig';

export const RESCUE_DISMISS_KEY = 'feyrn:first-post-rescue-dismissed';

export const useFirstPostRescue = () => {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: ['first-post-rescue', user?.id],
    queryFn: async () => {
      if (!user) return { eligible: false };
      if (localStorage.getItem(RESCUE_DISMISS_KEY) === '1') return { eligible: false };
      // Don't interrupt healthy self-propelled behaviour in this session.
      if (isSessionExploring()) return { eligible: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, app_tour_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile || profile.role === 'venue_owner') return { eligible: false };

      // Oldest (= first) post of this guest, incl. denormalized engagement counters.
      const { data: firstPost } = await supabase
        .from('posts')
        .select('id, created_at, likes_count, comments_count')
        .eq('author_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!firstPost) return { eligible: false };

      const age = Date.now() - new Date(firstPost.created_at).getTime();
      if (age < MIN_AGE_MS || age > MAX_AGE_MS) return { eligible: false };
      if ((firstPost.likes_count ?? 0) + (firstPost.comments_count ?? 0) > 0) {
        return { eligible: false };
      }

      // Already naturally engaged (following people) → no nudge.
      const { count: followCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

      if ((followCount ?? 0) > 0) return { eligible: false };

      trackNudge('nudge_eligible', 'first_post_rescue');
      return { eligible: true };
    },
    enabled: !!user && !loading,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    isEligible: query.data?.eligible === true,
    isLoading: loading || query.isLoading,
  };
};
