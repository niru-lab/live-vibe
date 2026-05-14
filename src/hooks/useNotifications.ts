import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  ref_type: string | null;
  ref_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useNotifications = () => {
  const { data: profile } = useProfile();
  const profileId = profile?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', profileId],
    queryFn: async (): Promise<NotificationRow[]> => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)')
        .eq('recipient_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        // Fallback without join (FK may not be named)
        const { data: d2 } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', profileId)
          .order('created_at', { ascending: false })
          .limit(50);
        const rows = (d2 || []) as NotificationRow[];
        const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean))) as string[];
        if (actorIds.length) {
          const { data: actors } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', actorIds);
          const map = new Map((actors || []).map((a) => [a.id, a]));
          rows.forEach((r) => {
            r.actor = r.actor_id ? (map.get(r.actor_id) as any) ?? null : null;
          });
        }
        return rows;
      }
      return (data || []) as NotificationRow[];
    },
    enabled: !!profileId,
  });

  // Realtime
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel('notifications-' + profileId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profileId}` },
        () => qc.invalidateQueries({ queryKey: ['notifications', profileId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, qc]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!profileId) return;
      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', profileId).eq('is_read', false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', profileId] }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', profileId] }),
  });

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, isLoading: query.isLoading, markAllRead, markRead };
};
