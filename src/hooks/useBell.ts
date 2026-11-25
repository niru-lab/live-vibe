import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { registerForPush } from '@/lib/pushRegistration';

/**
 * Profile bell: notify me about every new post, story and deal of this account.
 * Only the subscriber can see their own bells (RLS); the target never learns who rang.
 */
export function useBell(targetProfileId: string | null | undefined) {
  const { data: me } = useProfile();
  const queryClient = useQueryClient();
  const key = ['bell', me?.id, targetProfileId];
  const canUse = !!me?.id && !!targetProfileId && me.id !== targetProfileId;

  const state = useQuery({
    queryKey: key,
    enabled: canUse,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_subscriptions')
        .select('target_id')
        .eq('subscriber_id', me!.id)
        .eq('target_id', targetProfileId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async (on: boolean) => {
      if (!canUse) throw new Error('not allowed');
      if (on) {
        const { error } = await supabase
          .from('profile_subscriptions')
          .insert({ subscriber_id: me!.id, target_id: targetProfileId! });
        if (error && error.code !== '23505') throw error; // already on
        // The user explicitly asked for notifications — the right moment for the OS prompt.
        await registerForPush(me!.id);
      } else {
        const { error } = await supabase
          .from('profile_subscriptions')
          .delete()
          .eq('subscriber_id', me!.id)
          .eq('target_id', targetProfileId!);
        if (error) throw error;
      }
      return on;
    },
    onMutate: async (on) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<boolean>(key);
      queryClient.setQueryData(key, on);
      return { previous };
    },
    onError: (_e, _on, ctx) => queryClient.setQueryData(key, ctx?.previous ?? false),
  });

  return { canUse, isOn: !!state.data, isLoading: state.isLoading, toggle };
}
