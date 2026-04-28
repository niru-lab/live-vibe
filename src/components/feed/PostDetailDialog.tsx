import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ChatCircle, PaperPlaneTilt, Trash } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments';
import { useProfile } from '@/hooks/useProfile';
import type { PostWithAuthor } from '@/hooks/usePosts';

interface PostDetailDialogProps {
  post: PostWithAuthor | null;
  isLiked: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  onClose: () => void;
}

export const PostDetailDialog = ({ post, isLiked, onLike, onClose }: PostDetailDialogProps) => {
  const open = !!post;
  const { data: comments = [], isLoading } = useComments(post?.id);
  const { data: myProfile } = useProfile();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!post || !text.trim()) return;
    await addComment.mutateAsync({ postId: post.id, content: text.trim() });
    setText('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-lg h-[calc(100dvh-24px)] max-h-[640px] p-0 rounded-3xl border-white/10 bg-[#0A0A0F] overflow-hidden flex flex-col gap-0">
        {post && (
          <>
            <DialogTitle className="sr-only">Beitrag von {post.author?.display_name || post.author?.username || 'Nutzer'}</DialogTitle>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 pr-12 border-b border-white/[0.06] shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author?.avatar_url || ''} />
                <AvatarFallback className="bg-[#1e1e2e] text-xs text-white">
                  {post.author?.display_name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{post.author?.display_name}</p>
                <p className="text-xs text-[#9b9bb0] truncate">@{post.author?.username}</p>
              </div>
            </div>

            {/* Media */}
            <div className="relative bg-black w-full shrink-0 flex items-center justify-center max-h-[30dvh]">
              {post.media_type === 'video' ? (
                <video src={post.media_url} className="w-full max-h-[30dvh] object-contain" controls playsInline />
              ) : (
                <img src={post.media_url} alt={post.caption || ''} className="w-full max-h-[30dvh] object-contain" />
              )}
            </div>

            {/* Caption + actions */}
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
              {post.caption && (
                <p className="text-sm text-white/90 whitespace-pre-wrap mb-3">{post.caption}</p>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onLike(post.id, isLiked)}
                  className="flex items-center gap-1.5"
                  style={{ color: isLiked ? '#EC4899' : '#9b9bb0' }}
                >
                  <Heart weight={isLiked ? 'fill' : 'regular'} className={cn('h-5 w-5 transition-all', isLiked && 'scale-110')} />
                  <span className="text-sm font-medium">{post.likes_count}</span>
                </button>
                <div className="flex items-center gap-1.5 text-[#9b9bb0]">
                  <ChatCircle weight="regular" className="h-5 w-5" />
                  <span className="text-sm font-medium">{comments.length || post.comments_count}</span>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
              {isLoading ? (
                <p className="text-xs text-[#9b9bb0] text-center py-4">Lade Kommentare…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-[#9b9bb0] text-center py-4">Noch keine Kommentare. Sei der oder die Erste!</p>
              ) : (
                comments.map((c) => {
                  const isOwn = c.user_id === myProfile?.id;
                  return (
                    <div key={c.id} className="flex items-start gap-2 group">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={c.author?.avatar_url || ''} />
                        <AvatarFallback className="bg-[#1e1e2e] text-[10px] text-white">
                          {c.author?.display_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">
                          <span className="font-semibold text-white">{c.author?.username || c.author?.display_name || 'Nutzer'}</span>
                          <span className="text-white/90 ml-1.5 break-words">{c.content}</span>
                        </p>
                        <p className="text-[10px] text-[#5a5a72] mt-0.5">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => deleteComment.mutate({ commentId: c.id, postId: post.id })}
                          className="opacity-0 group-hover:opacity-100 text-[#5a5a72] hover:text-destructive transition-opacity p-1"
                          aria-label="Kommentar löschen"
                        >
                          <Trash weight="thin" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] p-3 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Kommentar hinzufügen…"
                className="flex-1 bg-[#12121A] border border-white/[0.08] rounded-full px-4 py-2 text-sm text-white placeholder:text-[#5a5a72] focus:outline-none focus:border-primary/50"
                disabled={addComment.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || addComment.isPending}
                className="h-9 w-9 rounded-full bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40 flex items-center justify-center transition-colors"
                aria-label="Senden"
              >
                <PaperPlaneTilt weight="fill" className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
