import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Event = Tables<'events'>;
export type EventWithCreator = Event & {
  creator: Tables<'profiles'> | null;
};

interface EventFilters {
  city?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
}

export const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_creator_id_fkey(*)
        `)
        .eq('is_active', true)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true });

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category as 'club' | 'house_party' | 'bar' | 'festival' | 'concert' | 'other');
      }

      if (filters?.startDate) {
        query = query.gte('starts_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('starts_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as EventWithCreator[];
    },
  });
};

export const useEventById = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_creator_id_fkey(*)
        `)
        .eq('id', eventId)
        .maybeSingle();
      
      if (error) throw error;
      return data as EventWithCreator | null;
    },
    enabled: !!eventId,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (eventData: Omit<TablesInsert<'events'>, 'creator_id'>) => {
      if (!profile) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          creator_id: profile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useMyEvents = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['my-events', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', profile.id)
        .order('starts_at', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!profile,
  });
};
