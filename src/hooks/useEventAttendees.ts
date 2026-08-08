import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { track, type RsvpSurface } from '@/lib/analytics';
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

/**
 * Batched RSVP counts for many events in a single query (no N+1 in lists/map).
 * Returns { [eventId]: { going, interested } }.
 */
export const useRsvpCounts = (eventIds: string[]) => {
  const key = [...new Set(eventIds)].sort();
  return useQuery({
    queryKey: ['rsvp-counts', key],
    queryFn: async () => {
      if (key.length === 0) return {} as Record<string, { going: number; interested: number }>;
      const { data, error } = await supabase
        .from('event_attendees')
        .select('event_id,status')
        .in('event_id', key);
      if (error) throw error;
      const map: Record<string, { going: number; interested: number }> = {};
      for (const id of key) map[id] = { going: 0, interested: 0 };
      for (const row of data || []) {
        const bucket = map[row.event_id];
        if (!bucket) continue;
        if (row.status === 'going') bucket.going += 1;
        else if (row.status === 'interested') bucket.interested += 1;
      }
      return map;
    },
    enabled: key.length > 0,
    staleTime: 30_000,
  });
};

/** Single source of truth for "my RSVP" across Feed, Map, Discovery and Detail. */
export const useMyRsvpMap = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['my-rsvp-map', profile?.id],
    queryFn: async () => {
      if (!profile) return {} as Record<string, RSVPStatus>;
      const { data, error } = await supabase
        .from('event_attendees')
        .select('event_id,status')
        .eq('user_id', profile.id);
      if (error) throw error;
      const map: Record<string, RSVPStatus> = {};
      for (const row of data || []) {
        if (row.status === 'going' || row.status === 'interested' || row.status === 'not_going') {
          map[row.event_id] = row.status as RSVPStatus;
        }
      }
      return map;
    },
    enabled: !!profile,
    staleTime: 30_000,
  });
};

// RSVP to an event — idempotent upsert on the UNIQUE(event_id, user_id) constraint.
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
      surface?: RsvpSurface;
    }) => {
      if (!profile) throw new Error('Not authenticated');

      if (status === null) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', profile.id);
        if (error) throw error;
        return null;
      }

      // Atomic absolute state write — safe to repeat, safe under concurrency.
      const { data, error } = await supabase
        .from('event_attendees')
        .upsert(
          { event_id: eventId, user_id: profile.id, status },
          { onConflict: 'event_id,user_id' },
        )
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ eventId, status, surface }) => {
      if (!profile) return;
      const mapKey = ['my-rsvp-map', profile.id];
      const rsvpKey = ['user-event-rsvp', eventId, profile.id];
      await queryClient.cancelQueries({ queryKey: mapKey });
      const previousMap = queryClient.getQueryData<Record<string, RSVPStatus>>(mapKey);
      const previousRsvp = queryClient.getQueryData(rsvpKey);
      const previousStatus = previousMap?.[eventId] ?? null;

      queryClient.setQueryData<Record<string, RSVPStatus>>(mapKey, (old) => {
        const next = { ...(old || {}) };
        if (status === null) delete next[eventId];
        else next[eventId] = status;
        return next;
      });
      queryClient.setQueryData(rsvpKey, (old: any) =>
        status === null ? null : { ...(old || {}), event_id: eventId, user_id: profile.id, status },
      );

      track('rsvp_cta_clicked', { eventId, status, previousStatus, surface });
      return { previousMap, previousRsvp, previousStatus, mapKey, rsvpKey };
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(context.mapKey, context.previousMap);
        queryClient.setQueryData(context.rsvpKey, context.previousRsvp);
      }
      track('rsvp_error', {
        eventId: variables.eventId,
        status: variables.status,
        surface: variables.surface,
        reason: (error as Error)?.message?.slice(0, 80),
      });
    },
    onSuccess: (_data, variables, context) => {
      const previousStatus = context?.previousStatus ?? null;
      if (variables.status === null) {
        track('rsvp_removed', { eventId: variables.eventId, previousStatus, surface: variables.surface });
      } else if (previousStatus && previousStatus !== variables.status) {
        track('rsvp_status_changed', {
          eventId: variables.eventId,
          status: variables.status,
          previousStatus,
          surface: variables.surface,
        });
      } else {
        track('rsvp_status_set', { eventId: variables.eventId, status: variables.status, surface: variables.surface });
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-event-rsvp', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-rsvp-map'] });
      queryClient.invalidateQueries({ queryKey: ['rsvp-counts'] });
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
        .neq('status', 'invited')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
};

// Get events the user has been invited to
export const useMyInvitations = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['my-invitations', profile?.id],
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
        .eq('status', 'invited')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
};

// Respond to an invitation
export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attendeeId, accept }: { attendeeId: string; accept: boolean }) => {
      const newStatus = accept ? 'going' : 'declined';
      const { error } = await supabase
        .from('event_attendees')
        .update({ status: newStatus })
        .eq('id', attendeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees'] });
    },
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
