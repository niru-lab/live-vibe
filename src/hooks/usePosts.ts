import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Post = Tables<'posts'>;
export type PostWithAuthor = Post & {
  author: Tables<'profiles'> | null;
  event?: Tables<'events'> | null;
  location?: Tables<'profiles'> | null;
};

export const usePosts = (city?: string) => {
  return useQuery({
    queryKey: ['posts', city],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*),
          event:events(*),
          location:profiles!posts_location_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PostWithAuthor[];
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (postData: Omit<TablesInsert<'posts'>, 'author_id'>) => {
      if (!profile) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...postData,
          author_id: profile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!profile) throw new Error('Not authenticated');
      
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: profile.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
  });
};

export const useUserLikes = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['likes', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', profile.id);
      
      if (error) throw error;
      return data.map(like => like.post_id);
    },
    enabled: !!profile,
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!profile) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', profile.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};
