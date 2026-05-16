import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export type ParticipationStatus = 'interested' | 'requested' | 'accepted' | 'declined';

export const useMyParticipation = (eventId: string | undefined) => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['event-participation', eventId, profile?.id],
    queryFn: async () => {
      if (!eventId || !profile) return null;
      const { data, error } = await supabase
        .from('event_participants')
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

const invalidateAll = (qc: ReturnType<typeof useQueryClient>, eventId?: string) => {
  qc.invalidateQueries({ queryKey: ['event-participation', eventId] });
  qc.invalidateQueries({ queryKey: ['my-upcoming-participations'] });
  qc.invalidateQueries({ queryKey: ['event-participants', eventId] });
};

export const useSetParticipation = () => {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: ParticipationStatus | null }) => {
      if (!profile) throw new Error('Not authenticated');
      if (status === null) {
        const { error } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', profile.id);
        if (error) throw error;
        return null;
      }
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .maybeSingle();
      if (existing) {
        const { data, error } = await supabase
          .from('event_participants')
          .update({ status })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('event_participants')
        .insert({ event_id: eventId, user_id: profile.id, status })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => invalidateAll(qc, vars.eventId),
  });
};

export const useMyUpcomingParticipations = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['my-upcoming-participations', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('event_participants')
        .select(`*, event:events(*, creator:profiles!events_creator_id_fkey(*))`)
        .eq('user_id', profile.id)
        .in('status', ['requested', 'accepted'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      const now = Date.now();
      return (data || []).filter((r: any) => r.event && new Date(r.event.starts_at).getTime() > now - 3 * 3600 * 1000);
    },
    enabled: !!profile,
  });
};

export const useEventParticipants = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_participants')
        .select(`*, profile:profiles!event_participants_user_id_fkey(*)`)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
};

export const useHostDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ participantId, decision, eventId }: { participantId: string; decision: 'accepted' | 'declined'; eventId: string }) => {
      const { error } = await supabase
        .from('event_participants')
        .update({ status: decision })
        .eq('id', participantId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => invalidateAll(qc, vars.eventId),
  });
};
