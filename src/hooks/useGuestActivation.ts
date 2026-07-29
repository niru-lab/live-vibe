import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Guest activation state: true only for guest users who handled the app tour
 * and have not created a single post yet. Isolated so it is easy to remove.
 */
export const useGuestActivation = () => {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: ['guest-activation', user?.id],
    queryFn: async () => {
      if (!user) return { eligible: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, app_tour_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return { eligible: false };
      if (profile.role === 'venue_owner') return { eligible: false };
      if (!profile.app_tour_completed_at) return { eligible: false };

      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .is('deleted_at', null);

      return { eligible: (count ?? 0) === 0 };
    },
    enabled: !!user && !loading,
    staleTime: 30_000,
  });

  return {
    isEligible: query.data?.eligible === true,
    isLoading: loading || query.isLoading,
  };
};
