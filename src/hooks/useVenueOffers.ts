import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { isOfferLive, PUBLISHABLE_STATUSES, type OfferStatus, type VenueOffer } from '@/lib/offers';

const OFFER_COLUMNS =
  'id,venue_id,event_id,title,description,offer_type,display_text,starts_at,ends_at,status,redemption_instruction,max_activations,created_at,updated_at';

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
  activations: number;
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

/** The signed-in user's own activation state for a set of offers. */
export const useMyOfferActivations = (offerIds: string[]) => {
  const { data: profile } = useProfile();
  const key = [...offerIds].sort().join(',');
  return useQuery({
    queryKey: ['my-offer-activations', profile?.id, key],
    enabled: !!profile?.id && offerIds.length > 0,
    queryFn: async (): Promise<Record<string, 'active' | 'cancelled'>> => {
      const { data, error } = await supabase
        .from('offer_activations')
        .select('offer_id,status')
        .eq('profile_id', profile!.id)
        .in('offer_id', offerIds);
      if (error) throw error;
      const map: Record<string, 'active' | 'cancelled'> = {};
      for (const row of data ?? []) map[row.offer_id] = row.status as 'active' | 'cancelled';
      return map;
    },
  });
};

/** Idempotent activation: repeated clicks never create duplicates. */
export const useActivateOffer = () => {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async (offerId: string) => {
      if (!profile?.id) throw new Error('not_authenticated');
      const { error } = await supabase
        .from('offer_activations')
        .upsert(
          { offer_id: offerId, profile_id: profile.id, status: 'active' },
          { onConflict: 'offer_id,profile_id' },
        );
      if (error) throw error;
      return offerId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-offer-activations'] });
      qc.invalidateQueries({ queryKey: ['venue-offer-stats'] });
    },
  });
};
