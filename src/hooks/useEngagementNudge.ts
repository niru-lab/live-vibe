import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Prompt 6 — Engagement Nudge.
 *
 * Retention lever directly after the first post: new guests who only consume
 * get a small, concrete mission set (like / comment / follow). Once the loop is
 * closed the nudge disappears forever. Isolated + easily tunable / removable.
 */
export const ENGAGEMENT_DISMISS_KEY = 'feyrn:engagement-nudge-dismissed';

// Activation window — outside of it we never nag.
const MAX_ACCOUNT_AGE_MS = 21 * 24 * 60 * 60 * 1000;

export const GOALS = { likes: 3, comments: 1, follows: 3 } as const;

export interface EngagementProgress {
  likes: number;
  comments: number;
  follows: number;
  completed: number;
  total: number;
  isComplete: boolean;
}

interface EngagementNudgeState {
  eligible: boolean;
  progress?: EngagementProgress;
}

export const useEngagementNudge = () => {
  const { user, loading } = useAuth();

  const query = useQuery<EngagementNudgeState>({
    queryKey: ['engagement-nudge', user?.id],
    queryFn: async () => {
      if (!user) return { eligible: false };
      if (localStorage.getItem(ENGAGEMENT_DISMISS_KEY) === '1') return { eligible: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile || profile.role === 'venue_owner') return { eligible: false };

      const accountAge = Date.now() - new Date(profile.created_at).getTime();
      if (accountAge > MAX_ACCOUNT_AGE_MS) return { eligible: false };

      const [{ count: likes }, { count: comments }, { count: follows }] = await Promise.all([
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', profile.id),
      ]);

      const progress: EngagementProgress = {
        likes: Math.min(likes ?? 0, GOALS.likes),
        comments: Math.min(comments ?? 0, GOALS.comments),
        follows: Math.min(follows ?? 0, GOALS.follows),
        completed: 0,
        total: 3,
        isComplete: false,
      };

      progress.completed =
        (progress.likes >= GOALS.likes ? 1 : 0) +
        (progress.comments >= GOALS.comments ? 1 : 0) +
        (progress.follows >= GOALS.follows ? 1 : 0);
      progress.isComplete = progress.completed === progress.total;

      if (progress.isComplete) {
        // Loop closed — never show again on this device.
        localStorage.setItem(ENGAGEMENT_DISMISS_KEY, '1');
        return { eligible: false, progress };
      }

      return { eligible: true, progress };
    },
    enabled: !!user && !loading,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    isEligible: query.data?.eligible === true,
    progress: query.data?.progress,
    isLoading: loading || query.isLoading,
  };
};
