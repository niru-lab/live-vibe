import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface Room {
  id: string;
  name: string;
  description: string | null;
  category: string;
  activity: string | null;
  location_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  hoster_id: string;
  visibility: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hoster?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  member_count?: number;
}

export interface RoomRecurringEvent {
  id: string;
  room_id: string;
  recurrence: string;
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  location_name: string | null;
  address: string | null;
  is_active: boolean;
}

export const useRooms = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, hoster:profiles!rooms_hoster_id_fkey(id, username, display_name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Room[];
    },
  });

  const { data: myRooms = [] } = useQuery({
    queryKey: ['my-rooms', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_members')
        .select('room_id, role, rooms:rooms!room_members_room_id_fkey(*, hoster:profiles!rooms_hoster_id_fkey(id, username, display_name, avatar_url))')
        .eq('user_id', profile!.id);
      if (error) throw error;
      return data?.map(d => ({ ...((d as any).rooms as Room), myRole: (d as any).role })) ?? [];
    },
  });

  const createRoom = useMutation({
    mutationFn: async (room: {
      name: string;
      description?: string;
      category: string;
      activity?: string;
      location_name?: string;
      address?: string;
      city?: string;
      visibility?: string;
      recurrence?: string;
      day_of_week?: number;
      time_of_day?: string;
    }) => {
      if (!profile?.id) throw new Error('Not logged in');
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: room.name,
          description: room.description || null,
          category: room.category,
          activity: room.activity || null,
          location_name: room.location_name || null,
          address: room.address || null,
          city: room.city || null,
          hoster_id: profile.id,
          visibility: room.visibility || 'public',
        })
        .select()
        .single();
      if (error) throw error;

      // Create recurring event if specified
      if (room.recurrence) {
        await supabase.from('room_recurring_events').insert({
          room_id: data.id,
          recurrence: room.recurrence,
          day_of_week: room.day_of_week ?? null,
          time_of_day: room.time_of_day || '18:00',
          location_name: room.location_name || null,
          address: room.address || null,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      toast.success('Room erstellt!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const joinRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!profile?.id) throw new Error('Not logged in');
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: profile.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      toast.success('Beigetreten!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!profile?.id) throw new Error('Not logged in');
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      toast.success('Verlassen');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { rooms, myRooms, isLoading, createRoom, joinRoom, leaveRoom };
};
