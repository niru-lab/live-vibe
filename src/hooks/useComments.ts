import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

export interface CommentWithAuthor {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export const useComments = (postId?: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('id, post_id, user_id, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const userIds = Array.from(new Set((data || []).map((c) => c.user_id)));
      if (userIds.length === 0) return [];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      const map = new Map((authors || []).map((a) => [a.id, a]));
      return (data || []).map((c) => ({ ...c, author: (map.get(c.user_id) as any) || null }));
    },
    enabled: !!postId,
  });
};

export const useAddComment = () => {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!profile?.id) throw new Error('Nicht angemeldet');
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: profile.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['user-posts'] });
    },
    onError: (e: any) => toast({ title: 'Fehler', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
