import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to INSERTs on `posts` and invalidates the React Query caches
 * used by the Feed and Discover pages so newly-published "I'm here now"
 * posts appear without a manual refresh.
 *
 * One shared channel per mount; torn down on unmount to avoid the classic
 * Realtime leak pattern that racks up bills.
 */
export function useLivePosts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('posts-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
