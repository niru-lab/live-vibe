import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useToast } from './use-toast';

/**
 * Phase 0 block hooks.
 * These handle client-side visibility only. Backend enforcement (RLS,
 * notification suppression, cascade cleanup) is deferred to Phase 1/2.
 */

/** IDs the current user has blocked (outgoing). */
export const useBlockedIds = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['blocks', 'outgoing', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', profile!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.blocked_id as string);
    },
    staleTime: 60_000,
  });
};

/** IDs who have blocked the current user (incoming). */
export const useBlockedByIds = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['blocks', 'incoming', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', profile!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.blocker_id as string);
    },
    staleTime: 60_000,
  });
};

/**
 * Union of both directions – the set to hide from any UI list.
 * Returns a Set for O(1) membership checks.
 */
export const useHiddenUserIds = (): { blocked: Set<string>; ready: boolean } => {
  const out = useBlockedIds();
  const inc = useBlockedByIds();
  const blocked = useMemo(() => {
    const s = new Set<string>();
    (out.data ?? []).forEach((id) => s.add(id));
    (inc.data ?? []).forEach((id) => s.add(id));
    return s;
  }, [out.data, inc.data]);
  return { blocked, ready: !out.isLoading && !inc.isLoading };
};

/** Is a specific profile hidden from the current user (either direction)? */
export const useIsBlockedEitherWay = (targetProfileId?: string | null) => {
  const { blocked, ready } = useHiddenUserIds();
  return { isBlocked: !!targetProfileId && blocked.has(targetProfileId), ready };
};

const BROAD_INVALIDATION_KEYS: string[] = [
  'blocks',
  'posts',
  'user-posts',
  'user-likes',
  'comments',
  'user-search',
  'notifications',
  'follow-stats',
  'followers',
  'following',
  'suggestions',
  'direct-messages',
  'dm-threads',
  'event-attendees',
  'event-participants',
  'room-members',
  'room-posts',
];

const invalidateAllBlockAffected = (qc: ReturnType<typeof useQueryClient>) => {
  BROAD_INVALIDATION_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
};

export const useBlockUser = () => {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!profile) throw new Error('Nicht angemeldet');
      if (profile.id === targetProfileId) throw new Error('Du kannst dich nicht selbst blockieren');
      const { error } = await supabase.from('blocks').insert({
        blocker_id: profile.id,
        blocked_id: targetProfileId,
      });
      if (error && !error.message.toLowerCase().includes('duplicate')) throw error;
    },
    onSuccess: () => {
      invalidateAllBlockAffected(qc);
      toast({ title: 'Nutzer blockiert', description: 'Du siehst keine Inhalte mehr von diesem Nutzer.' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Fehler', description: e.message });
    },
  });
};

export const useUnblockUser = () => {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!profile) throw new Error('Nicht angemeldet');
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', profile.id)
        .eq('blocked_id', targetProfileId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllBlockAffected(qc);
      toast({ title: 'Blockierung aufgehoben' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Fehler', description: e.message });
    },
  });
};

/** Blocked users with profile data for the management screen. */
export const useMyBlockedProfiles = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['blocks', 'profiles', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const ids = (data ?? []).map((r) => r.blocked_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r) => ({
        blocked_id: r.blocked_id as string,
        created_at: r.created_at as string,
        profile: map.get(r.blocked_id as string) ?? null,
      }));
    },
    staleTime: 30_000,
  });
};
