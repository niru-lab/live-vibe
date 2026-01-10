import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface EventMessage {
  id: string;
  event_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  includes_address: boolean;
  is_read: boolean;
  created_at: string;
  event?: {
    id: string;
    name: string;
    address: string;
    location_name: string;
  };
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// Get messages for current user
export const useEventMessages = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['event-messages', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('event_messages')
        .select(`
          *,
          event:events(id, name, address, location_name),
          sender:profiles!event_messages_sender_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('recipient_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EventMessage[];
    },
    enabled: !!profile,
  });
};

// Get unread message count
export const useUnreadMessageCount = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['unread-messages-count', profile?.id],
    queryFn: async () => {
      if (!profile) return 0;

      const { count, error } = await supabase
        .from('event_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile,
  });
};

// Send message to attendee
export const useSendEventMessage = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({
      eventId,
      recipientId,
      content,
      includesAddress = false,
    }: {
      eventId: string;
      recipientId: string;
      content: string;
      includesAddress?: boolean;
    }) => {
      if (!profile) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('event_messages')
        .insert({
          event_id: eventId,
          sender_id: profile.id,
          recipient_id: recipientId,
          content,
          includes_address: includesAddress,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-messages'] });
    },
  });
};

// Mark message as read
export const useMarkMessageRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('event_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    },
  });
};

// Accept/Reject attendee
export const useHostAttendeeAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attendeeId,
      accepted,
      message,
    }: {
      attendeeId: string;
      accepted: boolean;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from('event_attendees')
        .update({
          host_accepted: accepted,
          host_message: message || null,
          host_responded_at: new Date().toISOString(),
        })
        .eq('id', attendeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees'] });
      queryClient.invalidateQueries({ queryKey: ['pending-attendees'] });
    },
  });
};

// Get pending attendees for host's events
export const usePendingAttendees = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['pending-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          profile:profiles!event_attendees_user_id_fkey(*)
        `)
        .eq('event_id', eventId)
        .is('host_accepted', null);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};

// Get accepted attendees for an event
export const useAcceptedAttendees = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['accepted-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          profile:profiles!event_attendees_user_id_fkey(*)
        `)
        .eq('event_id', eventId)
        .eq('host_accepted', true);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};
