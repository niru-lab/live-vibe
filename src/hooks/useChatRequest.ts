import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useEffect } from 'react';

export type ChatStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'declined';

export interface ChatRequestState {
  status: ChatStatus;
  requestId: string | null;
  mutualFollow: boolean;
}

export const useChatRequestStatus = (otherProfileId?: string) => {
  const { data: me } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-request', me?.id, otherProfileId],
    enabled: !!me?.id && !!otherProfileId,
    queryFn: async (): Promise<ChatRequestState> => {
      if (!me?.id || !otherProfileId) return { status: 'none', requestId: null, mutualFollow: false };

      const [{ data: req }, { data: f1 }, { data: f2 }] = await Promise.all([
        supabase
          .from('chat_requests' as any)
          .select('id, sender_id, recipient_id, status, created_at')
          .or(
            `and(sender_id.eq.${me.id},recipient_id.eq.${otherProfileId}),and(sender_id.eq.${otherProfileId},recipient_id.eq.${me.id})`,
          )
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('follows').select('id').eq('follower_id', me.id).eq('following_id', otherProfileId).maybeSingle(),
        supabase.from('follows').select('id').eq('follower_id', otherProfileId).eq('following_id', me.id).maybeSingle(),
      ]);

      const mutualFollow = !!f1 && !!f2;
      if (mutualFollow) return { status: 'accepted', requestId: (req as any)?.id ?? null, mutualFollow: true };

      if (!req) return { status: 'none', requestId: null, mutualFollow: false };
      const r = req as any;
      if (r.status === 'accepted') return { status: 'accepted', requestId: r.id, mutualFollow: false };
      if (r.status === 'declined') return { status: 'declined', requestId: r.id, mutualFollow: false };
      return {
        status: r.sender_id === me.id ? 'pending_outgoing' : 'pending_incoming',
        requestId: r.id,
        mutualFollow: false,
      };
    },
  });

  useEffect(() => {
    if (!me?.id || !otherProfileId) return;
    const channel = supabase
      .channel(`chat-req-${me.id}-${otherProfileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat-request', me.id, otherProfileId] });
        queryClient.invalidateQueries({ queryKey: ['chat-requests-all', me.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me?.id, otherProfileId, queryClient]);

  return query;
};

export const useAllChatRequests = () => {
  const { data: me } = useProfile();
  return useQuery({
    queryKey: ['chat-requests-all', me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      if (!me?.id) return [] as any[];
      const { data } = await supabase
        .from('chat_requests' as any)
        .select('*')
        .or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`);
      return (data ?? []) as any[];
    },
  });
};

export const useAcceptChatRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_requests' as any)
        .update({ status: 'accepted' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-request'] });
      qc.invalidateQueries({ queryKey: ['chat-requests-all'] });
      qc.invalidateQueries({ queryKey: ['direct-messages'] });
    },
  });
};

export const useDeclineChatRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_requests' as any)
        .update({ status: 'declined' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-request'] });
      qc.invalidateQueries({ queryKey: ['chat-requests-all'] });
      qc.invalidateQueries({ queryKey: ['direct-messages'] });
    },
  });
};

/** Ensure a chat_requests row exists between me -> other. Returns the effective status. */
export async function ensureChatRequest(
  meId: string,
  otherId: string,
): Promise<ChatStatus> {
  // mutual follow shortcut
  const [{ data: f1 }, { data: f2 }] = await Promise.all([
    supabase.from('follows').select('id').eq('follower_id', meId).eq('following_id', otherId).maybeSingle(),
    supabase.from('follows').select('id').eq('follower_id', otherId).eq('following_id', meId).maybeSingle(),
  ]);
  const mutual = !!f1 && !!f2;

  const { data: existing } = await supabase
    .from('chat_requests' as any)
    .select('id, sender_id, status')
    .or(`and(sender_id.eq.${meId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${meId})`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const r = existing as any;
    if (r.status === 'declined' && r.sender_id === meId) return 'declined';
    if (mutual && r.status !== 'accepted' && r.sender_id === meId) {
      await supabase.from('chat_requests' as any).update({ status: 'accepted' }).eq('id', r.id);
      return 'accepted';
    }
    return r.status === 'accepted'
      ? 'accepted'
      : r.sender_id === meId
        ? 'pending_outgoing'
        : 'pending_incoming';
  }

  await supabase
    .from('chat_requests' as any)
    .insert({ sender_id: meId, recipient_id: otherId, status: mutual ? 'accepted' : 'pending' });
  return mutual ? 'accepted' : 'pending_outgoing';
}
