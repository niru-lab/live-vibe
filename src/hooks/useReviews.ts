import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReviewRatings } from '@/lib/reviews';

// Contract of drizzle/migrations/0008_venue_reviews.sql + 0009_review_reports_replies.sql. Keep generated types untouched.
export type OpenReview = {
  invitation_id: string; venue_id: string; venue_name: string;
  venue_image_url: string | null; night: string; proof_type: string; expires_at: string;
};
export type RatingSummary = {
  review_count: number; avg_overall: number | null; avg_music: number | null;
  avg_service: number | null; avg_drinks: number | null; avg_wait: number | null;
  dist_1: number; dist_2: number; dist_3: number; dist_4: number; dist_5: number;
};
export type PublicReview = {
  review_id: string; rating_overall: number; rating_music: number; rating_service: number;
  rating_drinks: number; rating_wait: number; comment: string | null; comment_hidden: boolean; proof_type: string;
  night: string; created_at: string; author_profile_id: string; author_username: string;
  author_display_name: string | null; author_avatar_url: string | null;
  reply_text: string | null; reply_at: string | null; can_reply: boolean;
};
export type AdminReview = {
  review_id: string; venue_id: string; venue_name: string; author_username: string; rating_overall: number;
  comment: string | null; comment_hidden: boolean; reply_text: string | null; status: string;
  guest_reports: number; venue_reports: number; created_at: string;
};
export type ReviewModerationAction = 'remove' | 'hide_text' | 'keep';
type ReviewFunctions = {
  my_open_reviews: { Args: Record<PropertyKey, never>; Returns: OpenReview[] };
  venue_rating_summary: { Args: { _venue_id: string }; Returns: RatingSummary[] };
  venue_reviews_list: { Args: { _venue_id: string; _limit?: number; _before?: string }; Returns: PublicReview[] };
  submit_venue_review: {
    Args: { _invitation_id: string; _overall: number; _music: number; _service: number; _drinks: number; _wait: number; _comment?: string | null };
    Returns: { review_id: string; points: number; night_bonus: number }[];
  };
  skip_venue_review: { Args: { _invitation_id: string }; Returns: number };
  reply_to_review: { Args: { _review_id: string; _text: string | null }; Returns: undefined };
  admin_reviews_by_ids: { Args: { _ids: string[] }; Returns: AdminReview[] };
  admin_moderate_review: { Args: { _review_id: string; _action: string; _reason?: string | null }; Returns: undefined };
};
type ReviewDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & ReviewFunctions;
  };
};
const reviewClient = supabase as SupabaseClient<ReviewDatabase>;

/** The user's open review invitations (proven visits, open 7 days). Server-side, so they survive reinstalls. */
export const useOpenReviews = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['open-reviews', profile?.id],
    enabled: !!profile?.id && profile.role !== 'venue_owner',
    staleTime: 60_000,
    queryFn: async (): Promise<OpenReview[]> => {
      const { data, error } = await reviewClient.rpc('my_open_reviews');
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
      const { data, error } = await reviewClient.rpc('submit_venue_review', {
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
      const { data, error } = await reviewClient.rpc('skip_venue_review', { _invitation_id: invitationId });
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
      if (!venueId) return null;
      const { data, error } = await reviewClient.rpc('venue_rating_summary', { _venue_id: venueId });
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
      if (!venueId) return [];
      const { data, error } = await reviewClient.rpc('venue_reviews_list', { _venue_id: venueId, _limit: limit });
      if (error) throw error;
      return data ?? [];
    },
  });

/** Venue owner/members reply publicly (once, editable; empty text deletes). Bar staff can't. */
export const useReplyToReview = (venueId: string | null | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, text }: { reviewId: string; text: string }) => {
      const { error } = await reviewClient.rpc('reply_to_review', { _review_id: reviewId, _text: text.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-reviews', venueId] }),
  });
};

/** Admin: reported reviews with guest/venue report counts. */
export const useAdminReviews = (ids: string[]) =>
  useQuery({
    queryKey: ['admin-reviews', ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<AdminReview[]> => {
      const { data, error } = await reviewClient.rpc('admin_reviews_by_ids', { _ids: ids });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useModerateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, action, reason }: { reviewId: string; action: ReviewModerationAction; reason?: string }) => {
      const { error } = await reviewClient.rpc('admin_moderate_review', { _review_id: reviewId, _action: action, _reason: reason ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
};
