import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VenueEventStatus = 'live' | 'today' | 'upcoming';

export interface VenueEvent {
  id: string;
  name: string;
  cover_image_url: string | null;
  location_name: string;
  city: string;
  address: string;
  starts_at: string;
  ends_at: string | null;
  category: string;
  status: VenueEventStatus;
}

export const resolveEventStatus = (startsAt: string, endsAt: string | null): VenueEventStatus => {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;
  if (start <= now && (end ? now <= end : new Date(startsAt).toDateString() === new Date().toDateString())) {
    return 'live';
  }
  if (start > now && new Date(startsAt).toDateString() === new Date().toDateString()) return 'today';
  return 'upcoming';
};

/**
 * Real venue → event relationship in this schema: `events.creator_id` is the
 * venue owner's profile (`venues.owner_profile_id`). There is no
 * `events.venue_id` column, so we never invent one.
 */
export const useVenueActiveEvent = (venueId: string | undefined, ownerProfileId: string | null | undefined) => {
  return useQuery({
    queryKey: ['venue-active-event', venueId, ownerProfileId],
    enabled: !!venueId && !!ownerProfileId,
    staleTime: 60_000,
    queryFn: async (): Promise<VenueEvent | null> => {
      if (!ownerProfileId) return null;
      const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('id,name,cover_image_url,location_name,city,address,starts_at,ends_at,category')
        .eq('creator_id', ownerProfileId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .gte('starts_at', since)
        .order('starts_at', { ascending: true })
        .limit(5);
      if (error) throw error;

      const now = Date.now();
      const rows = (data ?? []).filter((e) => {
        const end = e.ends_at ? new Date(e.ends_at).getTime() : null;
        return end ? end >= now : new Date(e.starts_at).getTime() >= now - 6 * 60 * 60 * 1000;
      });
      if (rows.length === 0) return null;

      const withStatus: VenueEvent[] = rows.map((e) => ({
        ...e,
        status: resolveEventStatus(e.starts_at, e.ends_at),
      }));
      return withStatus.find((e) => e.status === 'live') ?? withStatus[0];
    },
  });
};

export interface LinkedPost {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  event_id: string | null;
  venue_id: string | null;
  author: { username: string; display_name: string; avatar_url: string | null } | null;
}

/**
 * Posts genuinely linked to the venue (`posts.venue_id`) or to its current
 * event (`posts.event_id`). Event-linked posts rank first, deduplicated.
 */
export const useVenueLinkedPosts = (
  venueId: string | undefined,
  eventId: string | null | undefined,
  limit = 24,
) => {
  return useQuery({
    queryKey: ['venue-linked-posts', venueId, eventId, limit],
    enabled: !!venueId,
    staleTime: 30_000,
    queryFn: async (): Promise<LinkedPost[]> => {
      if (!venueId) return [];
      const filter = eventId ? `venue_id.eq.${venueId},event_id.eq.${eventId}` : `venue_id.eq.${venueId}`;

      const { data, error } = await supabase
        .from('posts')
        .select(
          'id,media_url,media_type,caption,created_at,event_id,venue_id,author:profiles!posts_author_id_fkey(username,display_name,avatar_url)',
        )
        .or(filter)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      const seen = new Set<string>();
      const rows = ((data ?? []) as unknown as LinkedPost[]).filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      if (!eventId) return rows;
      return [...rows].sort((a, b) => {
        const aEvent = a.event_id === eventId ? 1 : 0;
        const bEvent = b.event_id === eventId ? 1 : 0;
        if (aEvent !== bEvent) return bEvent - aEvent;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
  });
};

export const useVenueById = (venueId: string | undefined) => {
  return useQuery({
    queryKey: ['venue', venueId],
    enabled: !!venueId,
    queryFn: async () => {
      if (!venueId) return null;
      const { data, error } = await supabase.from('venues').select('*').eq('id', venueId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};
