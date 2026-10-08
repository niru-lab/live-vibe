import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Post = Tables<'posts'>;
export type PostWithAuthor = Post & {
  author: Tables<'profiles'> | null;
  event?: Tables<'events'> | null;
  location?: Tables<'profiles'> | null;
  posted_as_venue?: { id: string; name: string; is_verified: boolean } | null;
};

export const usePosts = (city?: string) => {
  return useQuery({
    queryKey: ['posts', city],
    queryFn: async () => {
      // Fetch caller's blocks (both directions) so blocked users' posts disappear
      const { data: { user } } = await supabase.auth.getUser();
      let hiddenIds: string[] = [];
      if (user) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (myProfile) {
          const { data: blocks } = await supabase
            .from('blocks')
            .select('blocker_id, blocked_id')
            .or(`blocker_id.eq.${myProfile.id},blocked_id.eq.${myProfile.id}`);
          hiddenIds = (blocks ?? [])
            .map((b) => (b.blocker_id === myProfile.id ? b.blocked_id : b.blocker_id))
            .filter(Boolean) as string[];
        }
      }

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
      if (hiddenIds.length > 0) {
        query = query.not('author_id', 'in', `(${hiddenIds.join(',')})`);
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
      queryClient.invalidateQueries({ queryKey: ['engagement-nudge'] });
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

export type FeedMode = 'all' | 'city' | 'onsite';
const PAGE_SIZE = 20;

/** Paged feed (cursor = created_at). Authors come in the same query (one join, no N+1). */
export const useInfinitePosts = (opts: { city?: string; mode: FeedMode; myCity?: string | null }) => {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite', opts.city ?? null, opts.mode, opts.myCity ?? null],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*),
          event:events(*),
          location:profiles!posts_location_id_fkey(*),
          posted_as_venue:venues!posts_posted_as_venue_id_fkey(id, name, is_verified)
        `)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) query = query.lt('created_at', pageParam);
      const city = opts.mode === 'city' ? opts.myCity : opts.city;
      if (city) query = query.ilike('city', `%${city}%`);
      if (opts.mode === 'onsite') query = query.eq('on_site_verified', true);
      // Blocked users are filtered server-side by the posts policy (can_see_user).
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PostWithAuthor[];
    },
    getNextPageParam: (last) => (last.length === PAGE_SIZE ? last[last.length - 1].created_at : null),
  });
};
