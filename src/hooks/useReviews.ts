import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';
import type { ReviewRatings } from '@/lib/reviews';

type Fns = Database['public']['Functions'];
export type OpenReview = Fns['my_open_reviews']['Returns'][number];
export type RatingSummary = Fns['venue_rating_summary']['Returns'][number];
export type PublicReview = Fns['venue_reviews_list']['Returns'][number];

/** The user's open review invitations (proven visits, open 7 days). Server-side, so they survive reinstalls. */
export const useOpenReviews = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['open-reviews', profile?.id],
    enabled: !!profile?.id && profile.role !== 'venue_owner',
    staleTime: 60_000,
    queryFn: async (): Promise<OpenReview[]> => {
      const { data, error } = await supabase.rpc('my_open_reviews');
      if (error) throw error;
      return data ?? [];
    },
  });
};

const invalidateAfterReview = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['open-reviews'] });
  qc.invalidateQueries({ queryKey: ['venue-rating'] });
  qc.invalidateQueries({ queryKey: ['venue-reviews'] });
  qc.invalidateQueries({ queryKey: ['profile'] });
};

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, ratings, comment }: { invitationId: string; ratings: ReviewRatings; comment: string }) => {
      const { data, error } = await supabase.rpc('submit_venue_review', {
        _invitation_id: invitationId,
        _overall: ratings.overall,
        _music: ratings.music,
        _service: ratings.service,
        _drinks: ratings.drinks,
        _wait: ratings.wait,
        _comment: comment.trim() || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { points: row?.points ?? 0, nightBonus: row?.night_bonus ?? 0 };
    },
    onSuccess: () => invalidateAfterReview(qc),
  });
};

export const useSkipReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('skip_venue_review', { _invitation_id: invitationId });
      if (error) throw error;
      return { nightBonus: Number(data ?? 0) };
    },
    onSuccess: () => invalidateAfterReview(qc),
  });
};

export const useVenueRating = (venueId: string | null | undefined) =>
  useQuery({
    queryKey: ['venue-rating', venueId],
    enabled: !!venueId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<RatingSummary | null> => {
      const { data, error } = await supabase.rpc('venue_rating_summary', { _venue_id: venueId! });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) ?? null;
    },
  });

export const useVenueReviews = (venueId: string | null | undefined, limit = 20) =>
  useQuery({
    queryKey: ['venue-reviews', venueId, limit],
    enabled: !!venueId,
    staleTime: 60_000,
    queryFn: async (): Promise<PublicReview[]> => {
      const { data, error } = await supabase.rpc('venue_reviews_list', { _venue_id: venueId!, _limit: limit });
      if (error) throw error;
      return data ?? [];
    },
  });
