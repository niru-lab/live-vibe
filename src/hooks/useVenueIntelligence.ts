import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export type AnalyticsRange = '7d' | '30d' | 'all';

export const RANGE_LABELS: Record<AnalyticsRange, string> = {
  '7d': '7 Tage',
  '30d': '30 Tage',
  all: 'Gesamt',
};

const sinceFor = (range: AnalyticsRange): string | null => {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : 30;
  return new Date(Date.now() - days * 86400000).toISOString();
};

export interface VenueOverview {
  event_views: number;
  map_opens: number;
  venue_profile_views: number;
  shares: number;
  going: number;
  interested: number;
  requests: number;
  linked_posts: number;
  linked_creators: number;
  post_likes: number;
  post_comments: number;
  venue_follows: number;
  offer_impressions: number;
  offer_activations: number;
  total_events: number;
  upcoming_events: number;
}

export interface VenueEventPerf {
  event_id: string;
  name: string;
  starts_at: string;
  ends_at: string | null;
  city: string | null;
  views: number;
  shares: number;
  going: number;
  interested: number;
  requests: number;
  posts: number;
  likes: number;
  comments: number;
  offer_activations: number;
}

export interface VenueContentPerf {
  post_id: string;
  created_at: string;
  media_url: string;
  media_type: string;
  event_id: string | null;
  event_name: string | null;
  venue_id: string | null;
  likes: number;
  comments: number;
  views: number;
}

const num = (v: unknown) => Number(v ?? 0);

/**
 * All venue metrics come from three security-definer aggregates that scope
 * themselves to the caller's own venues/events — no client-side ownership
 * filtering, no raw log access, one query per section (no N+1).
 */
export const useVenueIntelligence = (range: AnalyticsRange) => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isVenue = profile?.role === 'venue_owner';
  const since = sinceFor(range);

  const overview = useQuery({
    queryKey: ['venue-overview', profile?.id, range],
    enabled: !!profile && isVenue,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueOverview> => {
      const { data, error } = await (supabase.rpc as any)('venue_analytics_overview', { _since: since });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) ?? {};
      return {
        event_views: num(row.event_views),
        map_opens: num(row.map_opens),
        venue_profile_views: num(row.venue_profile_views),
        shares: num(row.shares),
        going: num(row.going),
        interested: num(row.interested),
        requests: num(row.requests),
        linked_posts: num(row.linked_posts),
        linked_creators: num(row.linked_creators),
        post_likes: num(row.post_likes),
        post_comments: num(row.post_comments),
        venue_follows: num(row.venue_follows),
        offer_impressions: num(row.offer_impressions),
        offer_activations: num(row.offer_activations),
        total_events: num(row.total_events),
        upcoming_events: num(row.upcoming_events),
      };
    },
  });

  const events = useQuery({
    queryKey: ['venue-event-performance', profile?.id, range],
    enabled: !!profile && isVenue,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueEventPerf[]> => {
      const { data, error } = await (supabase.rpc as any)('venue_event_performance', { _since: since, _limit: 50, _offset: 0 });
      if (error) throw error;
      return ((data as any[]) ?? []).map((r) => ({
        event_id: r.event_id,
        name: r.name,
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        city: r.city,
        views: num(r.views),
        shares: num(r.shares),
        going: num(r.going),
        interested: num(r.interested),
        requests: num(r.requests),
        posts: num(r.posts),
        likes: num(r.likes),
        comments: num(r.comments),
        offer_activations: num(r.offer_activations),
      }));
    },
  });

  const content = useQuery({
    queryKey: ['venue-content-performance', profile?.id, range],
    enabled: !!profile && isVenue,
    staleTime: 30_000,
    queryFn: async (): Promise<VenueContentPerf[]> => {
      const { data, error } = await (supabase.rpc as any)('venue_content_performance', { _since: since, _limit: 30, _offset: 0 });
      if (error) throw error;
      return ((data as any[]) ?? []).map((r) => ({
        post_id: r.post_id,
        created_at: r.created_at,
        media_url: r.media_url,
        media_type: r.media_type,
        event_id: r.event_id,
        event_name: r.event_name,
        venue_id: r.venue_id,
        likes: num(r.likes),
        comments: num(r.comments),
        views: num(r.views),
      }));
    },
  });

  return {
    isVenue,
    overview: overview.data,
    events: events.data ?? [],
    content: content.data ?? [],
    isLoading: profileLoading || overview.isLoading || events.isLoading,
    isRefetching: overview.isRefetching || events.isRefetching || content.isRefetching,
    refetch: () => {
      overview.refetch();
      events.refetch();
      content.refetch();
    },
  };
};

/** Does this owner have at least one venue row (needed for venue-level metrics)? */
export const useOwnedVenue = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['owned-venue', profile?.id],
    enabled: !!profile?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('owner_profile_id', profile!.id)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
};
