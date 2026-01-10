import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostWithAuthor } from './usePosts';

export const useUserPosts = (profileId?: string) => {
  return useQuery({
    queryKey: ['user-posts', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*),
          event:events(*),
          location:profiles!posts_location_id_fkey(*)
        `)
        .eq('author_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PostWithAuthor[];
    },
    enabled: !!profileId,
  });
};

export const useTaggedPosts = (profileId?: string) => {
  return useQuery({
    queryKey: ['tagged-posts', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      // For now, return posts where the user is tagged as location
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*),
          event:events(*),
          location:profiles!posts_location_id_fkey(*)
        `)
        .eq('location_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PostWithAuthor[];
    },
    enabled: !!profileId,
  });
};
