import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Tables } from '@/integrations/supabase/types';

export type EventAttendee = Tables<'event_attendees'> & {
  profile: Tables<'profiles'> | null;
};

export type RSVPStatus = 'going' | 'interested' | 'not_going';

// Get all attendees for an event
export const useEventAttendees = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return { going: [], interested: [], total: 0 };

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          profile:profiles!event_attendees_user_id_fkey(*)
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      const going = data?.filter((a) => a.status === 'going') || [];
      const interested = data?.filter((a) => a.status === 'interested') || [];

      return {
        going,
        interested,
        total: going.length + interested.length,
        goingCount: going.length,
        interestedCount: interested.length,
      };
    },
    enabled: !!eventId,
  });
};

// Get current user's RSVP status for an event
export const useUserEventRSVP = (eventId: string | undefined) => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['user-event-rsvp', eventId, profile?.id],
    queryFn: async () => {
      if (!eventId || !profile) return null;

      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!profile,
  });
};

// RSVP to an event
export const useRSVP = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({
      eventId,
      status,
    }: {
      eventId: string;
      status: RSVPStatus | null;
    }) => {
      if (!profile) throw new Error('Not authenticated');

      // If status is null, remove RSVP
      if (status === null) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', profile.id);

        if (error) throw error;
        return null;
      }

      // Check if user already has an RSVP
      const { data: existing } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existing) {
        // Update existing RSVP
        const { data, error } = await supabase
          .from('event_attendees')
          .update({ status })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new RSVP
        const { data, error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: profile.id,
            status,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['event-attendees', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-event-rsvp', variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
    },
  });
};

// Get all events the user has RSVP'd to
export const useMyRSVPs = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['my-rsvps', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          event:events(
            *,
            creator:profiles!events_creator_id_fkey(*)
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
};

// Get friends attending an event
export const useFriendsAttending = (eventId: string | undefined) => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['friends-attending', eventId, profile?.id],
    queryFn: async () => {
      if (!eventId || !profile) return [];

      // Get users that the current user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profile.id);

      if (!following || following.length === 0) return [];

      const followingIds = following.map((f) => f.following_id);

      // Get attendees that are in the following list
      const { data: friendsAttending, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          profile:profiles!event_attendees_user_id_fkey(*)
        `)
        .eq('event_id', eventId)
        .eq('status', 'going')
        .in('user_id', followingIds);

      if (error) throw error;
      return friendsAttending || [];
    },
    enabled: !!eventId && !!profile,
  });
};
