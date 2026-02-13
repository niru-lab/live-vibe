import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export const useNotificationBadges = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const profileId = profile?.id;

  // Event attendee requests (for events I created) + my invitations
  const { data: eventBadge = 0 } = useQuery({
    queryKey: ['badge-events', profileId],
    queryFn: async () => {
      if (!profileId) return 0;

      // Count pending attendees for my events
      const { data: myEvents } = await supabase
        .from('events')
        .select('id')
        .eq('creator_id', profileId);

      let pendingCount = 0;
      if (myEvents?.length) {
        const eventIds = myEvents.map((e) => e.id);
        const { count } = await supabase
          .from('event_attendees')
          .select('id', { count: 'exact', head: true })
          .in('event_id', eventIds)
          .eq('status', 'interested')
          .is('host_accepted', null);
        pendingCount = count || 0;
      }

      // Count my pending invitations
      const { count: inviteCount } = await supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profileId)
        .eq('status', 'invited');

      return pendingCount + (inviteCount || 0);
    },
    enabled: !!profileId,
    refetchInterval: 30000,
  });

  // Unread messages
  const { data: messagesBadge = 0 } = useQuery({
    queryKey: ['badge-messages', profileId],
    queryFn: async () => {
      if (!profileId) return 0;
      const { count } = await supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', profileId)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!profileId,
    refetchInterval: 30000,
  });

  // Profile badge: recent likes + comments on my posts (last 24h)
  const { data: profileBadge = 0 } = useQuery({
    queryKey: ['badge-profile', profileId],
    queryFn: async () => {
      if (!profileId) return 0;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get my post IDs
      const { data: myPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', profileId);

      if (!myPosts?.length) return 0;
      const postIds = myPosts.map((p) => p.id);

      // Count recent likes on my posts (not by me)
      const { count: likesCount } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .in('post_id', postIds)
        .neq('user_id', profileId)
        .gte('created_at', since);

      // Count recent comments on my posts (not by me)
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .in('post_id', postIds)
        .neq('user_id', profileId)
        .gte('created_at', since);

      return (likesCount || 0) + (commentsCount || 0);
    },
    enabled: !!profileId,
    refetchInterval: 30000,
  });

  return { eventBadge, messagesBadge, profileBadge };
};
