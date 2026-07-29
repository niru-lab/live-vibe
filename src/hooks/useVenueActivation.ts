import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Venue activation state: true only for venue owners who handled the app tour
 * and have not created a single event yet. Isolated so it is easy to remove.
 */
export const useVenueActivation = () => {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: ['venue-activation', user?.id],
    queryFn: async () => {
      if (!user) return { eligible: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, app_tour_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return { eligible: false };
      if (profile.role !== 'venue_owner') return { eligible: false };
      if (!profile.app_tour_completed_at) return { eligible: false };

      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', profile.id)
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
