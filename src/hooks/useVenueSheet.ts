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
 * Deterministic split of a venue's relevant events into active / upcoming.
 * Active events (now between start and end) rank first, then the nearest
 * upcoming events chronologically. Ties break on event id for stability.
 */
export const getVenueEventState = (events: VenueEvent[], now: Date = new Date()) => {
  const currentTime = now.getTime();
  const byStart = (a: VenueEvent, b: VenueEvent) => {
    const diff = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  };

  const isActive = (e: VenueEvent) => {
    const start = new Date(e.starts_at).getTime();
    const end = e.ends_at ? new Date(e.ends_at).getTime() : start + 6 * 60 * 60 * 1000;
    return start <= currentTime && currentTime <= end;
  };

  const activeEvents = events.filter(isActive).sort(byStart);
  const upcomingEvents = events
    .filter((e) => new Date(e.starts_at).getTime() > currentTime)
    .sort(byStart);

  const allRelevantEvents = [...activeEvents, ...upcomingEvents];

  return {
    activeEvents,
    upcomingEvents,
    primaryEvent: allRelevantEvents[0] ?? null,
    allRelevantEvents,
  };
};

/**
 * Real venue → event relationship in this schema: `events.creator_id` is the
 * venue owner's profile (`venues.owner_profile_id`). There is no
 * `events.venue_id` column, so we never invent one.
 *
 * Returns ALL currently active and upcoming events – never `.single()` and
 * never `.limit(1)`.
 */
export const useVenueEvents = (venueId: string | undefined, ownerProfileId: string | null | undefined) => {
  return useQuery({
    queryKey: ['venue-events', venueId, ownerProfileId],
    enabled: !!venueId && !!ownerProfileId,
    staleTime: 60_000,
    queryFn: async (): Promise<VenueEvent[]> => {
      if (!ownerProfileId) return [];
      const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('id,name,cover_image_url,location_name,city,address,starts_at,ends_at,category')
        .eq('creator_id', ownerProfileId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .gte('starts_at', since)
        .order('starts_at', { ascending: true })
        .limit(50);
      if (error) throw error;

      const now = Date.now();
      // Keep only events that have not ended yet (active or upcoming).
      const rows = (data ?? []).filter((e) => {
        const end = e.ends_at ? new Date(e.ends_at).getTime() : null;
        return end ? end >= now : new Date(e.starts_at).getTime() >= now - 6 * 60 * 60 * 1000;
      });

      const withStatus: VenueEvent[] = rows.map((e) => ({
        ...e,
        status: resolveEventStatus(e.starts_at, e.ends_at),
      }));
      return getVenueEventState(withStatus).allRelevantEvents;
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

export type VenueProfileState = 'loading' | 'found' | 'not_found' | 'forbidden' | 'network_error' | 'error';

interface SupabaseLikeError {
  code?: string;
  message?: string;
  status?: number;
}

/** Distinguishes "no profile" from permission and network failures. */
export const classifyVenueError = (error: unknown): Exclude<VenueProfileState, 'loading' | 'found'> => {
  const err = (error ?? {}) as SupabaseLikeError;
  const code = err.code ?? '';
  const message = (err.message ?? '').toLowerCase();

  if (code === 'PGRST116' || message.includes('no rows')) return 'not_found';
  if (code === '42501' || code === 'PGRST301' || err.status === 401 || err.status === 403 ||
      message.includes('permission denied') || message.includes('row-level security') || message.includes('jwt')) {
    return 'forbidden';
  }
  if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('timeout') ||
      message.includes('load failed') || (typeof err.status === 'number' && err.status >= 500)) {
    return 'network_error';
  }
  return 'error';
};

export interface VenueProfileResult {
  state: VenueProfileState;
  /** Only set when state === 'found'. Never fabricated. */
  profile: Record<string, unknown> | null;
  /** True only when the venue row is linked to a real venue account (owner_profile_id). */
  isClaimed: boolean;
  refetch: () => void;
}

/**
 * Resolves whether a real venue profile row exists. A row missing the minimum
 * verified fields (id + name) is treated as "no profile" rather than rendering
 * placeholder data.
 */
export const useVenueProfile = (venueId: string | undefined): VenueProfileResult => {
  const query = useQuery({
    queryKey: ['venue-profile', venueId],
    enabled: !!venueId,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from('venues').select('*').eq('id', venueId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  let state: VenueProfileState = 'loading';
  if (!venueId) state = 'not_found';
  else if (query.isLoading || query.isPending) state = 'loading';
  else if (query.isError) state = classifyVenueError(query.error);
  else if (!query.data) state = 'not_found';
  else if (!(query.data as { id?: string; name?: string }).id || !(query.data as { name?: string }).name?.trim()) {
    state = 'not_found';
  } else state = 'found';

  return {
    state,
    profile: state === 'found' ? (query.data as Record<string, unknown>) : null,
    isClaimed:
      state === 'found' && !!(query.data as { owner_profile_id?: string | null } | null)?.owner_profile_id,
    refetch: () => void query.refetch(),
  };
};

