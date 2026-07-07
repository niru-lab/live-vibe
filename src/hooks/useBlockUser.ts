import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useToast } from './use-toast';

export const useBlockedIds = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['blocks', profile?.id],
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
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
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
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
