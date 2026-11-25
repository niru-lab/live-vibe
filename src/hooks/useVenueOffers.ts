import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { isOfferLive, PUBLISHABLE_STATUSES, type OfferStatus, type VenueOffer } from '@/lib/offers';

const OFFER_COLUMNS =
  'id,venue_id,event_id,title,description,offer_type,display_text,starts_at,ends_at,status,redemption_instruction,max_activations,category,image_url,conditions,min_age,created_at,updated_at';

/** The venue owned by the signed-in profile, if any. */
export const useMyVenue = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['my-venue', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_profile_id', profile!.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

/** The (first) venue owned by a given profile — for showing its deals on the owner's account profile. */
export const useVenueByOwner = (ownerProfileId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['venue-by-owner', ownerProfileId],
    enabled: !!ownerProfileId && enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id,name')
        .eq('owner_profile_id', ownerProfileId!)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/** Publicly visible offers of a venue, filtered to the live validity window. */
export const useVenueLiveOffers = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ['venue-live-offers', venueId],
    enabled: !!venueId,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueOffer[]> => {
      const { data, error } = await supabase
        .from('venue_offers')
        .select(OFFER_COLUMNS)
        .eq('venue_id', venueId!)
        .in('status', PUBLISHABLE_STATUSES)
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as VenueOffer[]).filter((o) => isOfferLive(o));
    },
  });
};

/** Live offers attached to one specific event. */
export const useEventLiveOffers = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event-live-offers', eventId],
    enabled: !!eventId,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueOffer[]> => {
      const { data, error } = await supabase
        .from('venue_offers')
        .select(OFFER_COLUMNS)
        .eq('event_id', eventId!)
        .in('status', PUBLISHABLE_STATUSES)
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as VenueOffer[]).filter((o) => isOfferLive(o));
    },
  });
};

/** All offers of the owner's own venue (any status) for management surfaces. */
export const useManagedOffers = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ['managed-offers', venueId],
    enabled: !!venueId,
    queryFn: async (): Promise<VenueOffer[]> => {
      const { data, error } = await supabase
        .from('venue_offers')
        .select(OFFER_COLUMNS)
        .eq('venue_id', venueId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VenueOffer[];
    },
  });
};

export interface OfferStatRow {
  offer_id: string;
  title: string;
  event_id: string | null;
  starts_at: string;
  ends_at: string;
  status: OfferStatus;
  /** Activated tickets (still open + redeemed). */
  activations: number;
  /** Scanned at the venue. */
  redemptions: number;
  /** Scans that were rejected (already used, expired, …). */
  failed_scans: number;
  max_activations: number | null;
}

/** Aggregate activation counts for the owner's own venue. No user data. */
export const useVenueOfferStats = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ['venue-offer-stats', venueId],
    enabled: !!venueId,
    queryFn: async (): Promise<OfferStatRow[]> => {
      const { data, error } = await supabase.rpc('venue_offer_stats', { _venue_id: venueId! });
      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          offer_id: String(row.offer_id),
          title: String(row.title),
          event_id: (row.event_id as string | null) ?? null,
          starts_at: String(row.starts_at),
          ends_at: String(row.ends_at),
          status: row.status as OfferStatus,
          activations: Number(row.activations ?? 0),
          redemptions: Number(row.redemptions ?? 0),
          failed_scans: Number(row.failed_scans ?? 0),
          max_activations: row.max_activations == null ? null : Number(row.max_activations),
        };
      });
    },
  });
};

type OfferInput = {
  venue_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  offer_type: VenueOffer['offer_type'];
  display_text: string | null;
  starts_at: string;
  ends_at: string;
  status: OfferStatus;
  redemption_instruction: string | null;
  max_activations: number | null;
  category: VenueOffer['category'];
  image_url: string | null;
  conditions: string | null;
};

const invalidateOffers = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['managed-offers'] });
  qc.invalidateQueries({ queryKey: ['venue-live-offers'] });
  qc.invalidateQueries({ queryKey: ['event-live-offers'] });
  qc.invalidateQueries({ queryKey: ['venue-offer-stats'] });
};

export const useCreateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OfferInput) => {
      const { data, error } = await supabase.from('venue_offers').insert(input).select(OFFER_COLUMNS).single();
      if (error) throw error;
      return data as VenueOffer;
    },
    onSuccess: () => invalidateOffers(qc),
  });
};

export const useUpdateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<OfferInput> }) => {
      const { data, error } = await supabase
        .from('venue_offers')
        .update(patch)
        .eq('id', id)
        .select(OFFER_COLUMNS)
        .single();
      if (error) throw error;
      return data as VenueOffer;
    },
    onSuccess: () => invalidateOffers(qc),
  });
};

export const useDeleteOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('venue_offers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateOffers(qc),
  });
};

export type MyActivationStatus = 'active' | 'cancelled' | 'redeemed';

/** The signed-in user's own activation state for a set of offers. */
export const useMyOfferActivations = (offerIds: string[]) => {
  const { data: profile } = useProfile();
  const key = [...offerIds].sort().join(',');
  return useQuery({
    queryKey: ['my-offer-activations', profile?.id, key],
    enabled: !!profile?.id && offerIds.length > 0,
    queryFn: async (): Promise<Record<string, MyActivationStatus>> => {
      const { data, error } = await supabase
        .from('offer_activations')
        .select('offer_id,status')
        .eq('profile_id', profile!.id)
        .in('offer_id', offerIds);
      if (error) throw error;
      const map: Record<string, MyActivationStatus> = {};
      for (const row of data ?? []) map[row.offer_id] = row.status as MyActivationStatus;
      return map;
    },
  });
};

/**
 * "Deal aktivieren": server checks window, age, contingent and 1× per user,
 * then returns the ticket's QR token + backup code. Repeated taps return the same ticket.
 */
export const useActivateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase.rpc('claim_deal', { _offer_id: offerId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { offerId, ...row } as { offerId: string; activation_id: string; claim_token: string; short_code: string; status: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-offer-activations'] });
      qc.invalidateQueries({ queryKey: ['deal-wallet'] });
      qc.invalidateQueries({ queryKey: ['offers-remaining'] });
      qc.invalidateQueries({ queryKey: ['venue-offer-stats'] });
    },
  });
};

/** Remaining contingent per offer ("nur noch 12"); null = unlimited. */
export const useOffersRemaining = (offerIds: string[]) => {
  const key = [...offerIds].sort().join(',');
  return useQuery({
    queryKey: ['offers-remaining', key],
    enabled: offerIds.length > 0,
    staleTime: 20_000,
    queryFn: async (): Promise<Record<string, number | null>> => {
      const { data, error } = await supabase.rpc('offers_remaining', { _offer_ids: offerIds });
      if (error) throw error;
      const map: Record<string, number | null> = {};
      for (const row of data ?? []) map[row.offer_id] = row.remaining ?? null;
      return map;
    },
  });
};

/** A venue's deals for its public "Deals" tab: running now or starting within 12 h. */
export const useVenueDeals = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ['venue-live-offers', 'deals-tab', venueId],
    enabled: !!venueId,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueOffer[]> => {
      const now = Date.now();
      const { data, error } = await supabase
        .from('venue_offers')
        .select(OFFER_COLUMNS)
        .eq('venue_id', venueId!)
        .in('status', PUBLISHABLE_STATUSES)
        .gt('ends_at', new Date(now).toISOString())
        .lte('starts_at', new Date(now + 12 * 3_600_000).toISOString())
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as VenueOffer[];
    },
  });
};

/** Running deals of venues the user follows, for the feed strip. */
export const useFeedLiveDeals = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['venue-live-offers', 'feed', profile?.id],
    enabled: !!profile?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<VenueOffer[]> => {
      const { data, error } = await supabase.rpc('feed_live_deals');
      if (error) throw error;
      return (data ?? []) as unknown as VenueOffer[];
    },
  });
};
