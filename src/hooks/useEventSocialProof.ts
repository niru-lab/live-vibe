import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useHiddenUserIds } from '@/hooks/useBlockUser';

export interface FollowedAttendee {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export interface EventSocialProof {
  going: number;
  interested: number;
  postCount: number;
  /** Only people the current user already follows — never a public attendee directory. */
  followedGoing: FollowedAttendee[];
  /** A public event-linked post in the last 3 hours. */
  hasRecentActivity: boolean;
}

const EMPTY: EventSocialProof = {
  going: 0,
  interested: 0,
  postCount: 0,
  followedGoing: [],
  hasRecentActivity: false,
};

/**
 * Privacy-aware social proof for one event.
 *
 * - aggregate RSVP counts (intent, not presence)
 * - identities ONLY for profiles the viewer already follows
 * - blocked users are removed from every signal
 * - post counts come from real `posts.event_id` relations, never proximity
 */
export const useEventSocialProof = (eventId: string | undefined) => {
  const { data: profile } = useProfile();
  const { blocked } = useHiddenUserIds();
  const blockedKey = [...blocked].sort().join(',');

  return useQuery({
    queryKey: ['event-social-proof', eventId, profile?.id, blockedKey],
    queryFn: async (): Promise<EventSocialProof> => {
      if (!eventId) return EMPTY;

      const [rsvpRes, postRes] = await Promise.all([
        supabase.from('event_attendees').select('user_id,status').eq('event_id', eventId),
        supabase
          .from('posts')
          .select('id,author_id,created_at')
          .eq('event_id', eventId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (rsvpRes.error) throw rsvpRes.error;

      const rsvps = (rsvpRes.data ?? []).filter((r) => !blocked.has(r.user_id));
      const going = rsvps.filter((r) => r.status === 'going');
      const interested = rsvps.filter((r) => r.status === 'interested');

      const posts = (postRes.data ?? []).filter((p) => !blocked.has(p.author_id as string));
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      const hasRecentActivity = posts.some((p) => new Date(p.created_at as string).getTime() > threeHoursAgo);

      let followedGoing: FollowedAttendee[] = [];
      if (profile && going.length > 0) {
        const goingIds = going.map((g) => g.user_id);
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)
          .in('following_id', goingIds);
        const followedIds = (follows ?? []).map((f) => f.following_id as string);
        if (followedIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id,display_name,username,avatar_url')
            .in('id', followedIds.slice(0, 12));
          followedGoing = (profiles ?? []) as FollowedAttendee[];
        }
      }

      return {
        going: going.length,
        interested: interested.length,
        postCount: posts.length,
        followedGoing,
        hasRecentActivity,
      };
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
};
