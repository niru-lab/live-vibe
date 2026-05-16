import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useEffect } from 'react';

export type DMStatus = 'pending' | 'accepted' | 'declined';

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  status: DMStatus;
  is_read: boolean;
  created_at: string;
  responded_at: string | null;
  sender?: { id: string; username: string; display_name: string; avatar_url: string | null };
  recipient?: { id: string; username: string; display_name: string; avatar_url: string | null };
}

export const useDirectMessages = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['direct-messages', profile?.id],
    queryFn: async (): Promise<DirectMessage[]> => {
      if (!profile?.id) return [];
      const { data: msgs, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });
      if (error || !msgs) return [];

      const ids = Array.from(new Set(msgs.flatMap((m) => [m.sender_id, m.recipient_id])));
      if (ids.length === 0) return msgs as any;

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', ids);

      const profMap = new Map((profs || []).map((p) => [p.id, p]));
      return msgs.map((m) => ({
        ...m,
        sender: profMap.get(m.sender_id),
        recipient: profMap.get(m.recipient_id),
      })) as any;
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`dm-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['direct-messages', profile.id] });
        queryClient.invalidateQueries({ queryKey: ['unread-dm-count', profile.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient]);

  return query;
};

export const useUnreadDMCount = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['unread-dm-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count } = await supabase
        .from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!profile?.id,
  });
};

export const useSendDM = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { ensureChatRequest } = await import('./useChatRequest');
      const status = await ensureChatRequest(profile.id, recipientId);
      if (status === 'declined') throw new Error('Anfrage wurde abgelehnt');
      if (status === 'pending_incoming') throw new Error('Du musst die Anfrage erst annehmen');
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: profile.id, recipient_id: recipientId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-request'] });
      queryClient.invalidateQueries({ queryKey: ['chat-requests-all'] });
    },
  });
};

/** Group flat DMs by conversation partner (one row per partner, latest message). */
export interface Conversation {
  otherId: string;
  other?: DirectMessage['sender'];
  lastMessage: DirectMessage;
  unread: boolean;
}

export const useConversations = () => {
  const { data: profile } = useProfile();
  const dms = useDirectMessages();
  const conversations: Conversation[] = (() => {
    if (!profile?.id || !dms.data) return [];
    const map = new Map<string, Conversation>();
    for (const m of dms.data) {
      const otherId = m.sender_id === profile.id ? m.recipient_id : m.sender_id;
      const other = m.sender_id === profile.id ? m.recipient : m.sender;
      const existing = map.get(otherId);
      const isIncomingUnread = m.recipient_id === profile.id && !m.is_read;
      if (!existing) {
        map.set(otherId, { otherId, other, lastMessage: m, unread: isIncomingUnread });
      } else if (new Date(m.created_at).getTime() > new Date(existing.lastMessage.created_at).getTime()) {
        map.set(otherId, { otherId, other: other ?? existing.other, lastMessage: m, unread: isIncomingUnread || existing.unread });
      } else if (isIncomingUnread) {
        existing.unread = true;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
    );
  })();
  return { data: conversations, isLoading: dms.isLoading };
};

export const useRespondDM = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('direct_messages')
        .update({ status, responded_at: new Date().toISOString(), is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-dm-count'] });
    },
  });
};

export const useDeleteDM = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('direct_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-dm-count'] });
    },
  });
};

export const useMarkDMRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('direct_messages').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-dm-count'] });
    },
  });
};

export const useBlockUser = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('blocks').insert({ blocker_id: profile.id, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-search'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    },
  });
};
