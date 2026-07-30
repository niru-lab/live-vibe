import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface VenueEventStats {
  id: string;
  name: string;
  startsAt: string;
  city: string | null;
  going: number;
  interested: number;
  requests: number;
  posts: number;
  likes: number;
  comments: number;
  /** Honest visibility proxy: every tracked interaction with the event. */
  reach: number;
}

export interface VenueAnalytics {
  isVenue: boolean;
  totals: {
    events: number;
    upcoming: number;
    going: number;
    interested: number;
    requests: number;
    posts: number;
    engagement: number;
    reach: number;
  };
  trend: {
    last7: number;
    prev7: number;
    /** Percentage change vs. previous 7 days, null when there is no baseline. */
    changePct: number | null;
  };
  events: VenueEventStats[];
  recent: { id: string; label: string; at: string }[];
}

const EMPTY: VenueAnalytics = {
  isVenue: false,
  totals: { events: 0, upcoming: 0, going: 0, interested: 0, requests: 0, posts: 0, engagement: 0, reach: 0 },
  trend: { last7: 0, prev7: 0, changePct: null },
  events: [],
  recent: [],
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Lean venue analytics: 4 batched queries (no per-event fetching).
 * Returns isVenue=false for every non-venue profile.
 */
export const useVenueAnalytics = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: ['venue-analytics', profile?.id],
    queryFn: async (): Promise<VenueAnalytics> => {
      if (!profile || profile.role !== 'venue_owner') return EMPTY;

      const { data: events, error } = await supabase
        .from('events')
        .select('id, name, starts_at, city, created_at')
        .eq('creator_id', profile.id)
        .is('deleted_at', null)
        .order('starts_at', { ascending: false });
      if (error) throw error;

      const ids = (events ?? []).map((e) => e.id);
      if (ids.length === 0) return { ...EMPTY, isVenue: true };

      const [attendeesRes, participantsRes, postsRes] = await Promise.all([
        supabase.from('event_attendees').select('event_id, status, created_at').in('event_id', ids),
        supabase.from('event_participants').select('event_id, status, created_at').in('event_id', ids),
        supabase
          .from('posts')
          .select('id, event_id, likes_count, comments_count, created_at')
          .in('event_id', ids)
          .is('deleted_at', null),
      ]);

      const attendees = attendeesRes.data ?? [];
      const participants = participantsRes.data ?? [];
      const posts = postsRes.data ?? [];

      const byId = new Map<string, VenueEventStats>();
      for (const e of events ?? []) {
        byId.set(e.id, {
          id: e.id,
          name: e.name,
          startsAt: e.starts_at,
          city: e.city,
          going: 0,
          interested: 0,
          requests: 0,
          posts: 0,
          likes: 0,
          comments: 0,
          reach: 0,
        });
      }

      for (const a of attendees) {
        const s = byId.get(a.event_id);
        if (!s) continue;
        if (a.status === 'going') s.going += 1;
        else if (a.status === 'interested') s.interested += 1;
      }
      for (const p of participants) {
        const s = byId.get(p.event_id);
        if (!s) continue;
        if (p.status === 'accepted') s.going += 1;
        else if (p.status === 'requested') s.requests += 1;
      }
      for (const post of posts) {
        const s = post.event_id ? byId.get(post.event_id) : undefined;
        if (!s) continue;
        s.posts += 1;
        s.likes += post.likes_count ?? 0;
        s.comments += post.comments_count ?? 0;
      }

      const list = Array.from(byId.values()).map((s) => ({
        ...s,
        reach: s.going + s.interested + s.requests + s.posts + s.likes + s.comments,
      }));

      const now = Date.now();
      const inWindow = (iso: string | null, from: number, to: number) => {
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return t >= from && t < to;
      };
      const activityDates = [
        ...attendees.map((a) => a.created_at),
        ...participants.map((p) => p.created_at),
        ...posts.map((p) => p.created_at),
      ];
      const last7 = activityDates.filter((d) => inWindow(d, now - 7 * DAY, now)).length;
      const prev7 = activityDates.filter((d) => inWindow(d, now - 14 * DAY, now - 7 * DAY)).length;

      const totals = list.reduce(
        (acc, s) => ({
          events: acc.events + 1,
          upcoming: acc.upcoming + (new Date(s.startsAt).getTime() >= now ? 1 : 0),
          going: acc.going + s.going,
          interested: acc.interested + s.interested,
          requests: acc.requests + s.requests,
          posts: acc.posts + s.posts,
          engagement: acc.engagement + s.likes + s.comments,
          reach: acc.reach + s.reach,
        }),
        { events: 0, upcoming: 0, going: 0, interested: 0, requests: 0, posts: 0, engagement: 0, reach: 0 },
      );

      const recent = [
        ...attendees.map((a) => ({
          id: `a-${a.event_id}-${a.created_at}`,
          label:
            (a.status === 'going' ? 'Zusage für ' : 'Interesse an ') +
            (byId.get(a.event_id)?.name ?? 'deinem Event'),
          at: a.created_at,
        })),
        ...participants.map((p) => ({
          id: `p-${p.event_id}-${p.created_at}`,
          label:
            (p.status === 'accepted' ? 'Teilnahme bestätigt: ' : 'Neue Anfrage für ') +
            (byId.get(p.event_id)?.name ?? 'deinem Event'),
          at: p.created_at,
        })),
        ...posts.map((p) => ({
          id: `po-${p.id}`,
          label: `Neuer Post zu ${(p.event_id && byId.get(p.event_id)?.name) || 'deinem Event'}`,
          at: p.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 6);

      return {
        isVenue: true,
        totals,
        trend: {
          last7,
          prev7,
          changePct: prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null,
        },
        events: list.sort((a, b) => b.reach - a.reach || new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
        recent,
      };
    },
    enabled: !!profile,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data,
    isLoading: profileLoading || query.isLoading,
    isVenue: profile?.role === 'venue_owner',
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};
