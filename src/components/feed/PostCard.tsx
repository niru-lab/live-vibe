import { useState } from 'react';
import { Heart, ChatCircle, DotsThreeVertical, Trash } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useDeletePost } from '@/hooks/usePosts';
import type { PostWithAuthor } from '@/hooks/usePosts';

interface PostCardProps {
  post: PostWithAuthor;
  isLiked: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  onDeleted?: () => void;
}

export const PostCard = ({ post, isLiked, onLike, onDeleted }: PostCardProps) => {
  const author = post.author;
  const { data: currentProfile } = useProfile();
  const deletePost = useDeletePost();
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: false,
    locale: de,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOwnPost = currentProfile?.id === post.author_id;

  // Derive title (first line of caption) + description (rest) from existing caption field
  const captionText = post.caption || '';
  const splitIdx = captionText.indexOf('\n');
  const titleText = splitIdx > -1 ? captionText.slice(0, splitIdx) : captionText;
  const descriptionText = splitIdx > -1 ? captionText.slice(splitIdx + 1).trim() : '';

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      setShowDeleteDialog(false);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <>
      <article
        className="animate-fade-in overflow-hidden w-full"
        style={{
          background: '#12121A',
          borderRadius: '18px',
          border: '0.5px solid #1e1e2e',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top row: image + content */}
        <div className="flex" style={{ minHeight: '230px' }}>
          {/* Left image */}
          <div
            style={{ width: '180px', height: '230px', flexShrink: 0 }}
            className="relative bg-[#0A0A0F] overflow-hidden"
          >
            {post.media_type === 'video' ? (
              <video
                src={post.media_url}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={post.media_url}
                alt={titleText || 'Post'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Right content */}
          <div
            className="flex flex-col justify-between"
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              padding: '16px 14px 14px',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
              <Avatar style={{ width: '20px', height: '20px' }} className="shrink-0">
                <AvatarImage src={author?.avatar_url || ''} alt={author?.display_name || ''} />
                <AvatarFallback className="text-[9px] bg-[#1e1e2e] text-[#9b9bb0]">
                  {author?.display_name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className="truncate"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#9b9bb0',
                  minWidth: 0,
                }}
              >
                {author?.username || author?.display_name || 'unbekannt'}
              </span>
              <span style={{ color: '#3a3a50', fontSize: '10px' }}>·</span>
              <span style={{ color: '#3a3a50', fontSize: '10px' }} className="shrink-0">
                {timeAgo}
              </span>

              {isOwnPost && (
                <div className="ml-auto shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 -m-1 text-[#4a4a5e] hover:text-[#9b9bb0]">
                        <DotsThreeVertical weight="bold" className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash weight="thin" className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Title */}
            {titleText && (
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#e8e4f0',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                  marginTop: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {titleText}
              </h3>
            )}

            {/* Description */}
            {descriptionText && (
              <p
                style={{
                  fontSize: '11px',
                  color: '#5a5a72',
                  lineHeight: 1.4,
                  marginTop: '4px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {descriptionText}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3" style={{ marginTop: '8px' }}>
              <button
                onClick={() => onLike(post.id, isLiked)}
                className="flex items-center gap-1"
                style={{
                  color: isLiked ? '#EC4899' : '#4a4a5e',
                  fontSize: '11px',
                }}
              >
                <Heart
                  weight={isLiked ? 'fill' : 'regular'}
                  style={{ width: '13px', height: '13px' }}
                  className={cn('transition-all', isLiked && 'scale-110')}
                />
                <span>{post.likes_count}</span>
              </button>
              <div
                className="flex items-center gap-1"
                style={{ color: '#4a4a5e', fontSize: '11px' }}
              >
                <ChatCircle weight="regular" style={{ width: '13px', height: '13px' }} />
                <span>{post.comments_count}</span>
              </div>

              {(post.event?.name || post.location_name) && (
                <span
                  className="truncate"
                  style={{
                    marginLeft: 'auto',
                    background: '#1a1025',
                    border: '0.5px solid #3d2a6e',
                    borderRadius: '20px',
                    padding: '3px 7px',
                    fontSize: '10px',
                    color: '#7C3AED',
                    maxWidth: '75px',
                  }}
                >
                  {post.event?.name || post.location_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Comment preview (placeholder — uses existing comments_count only; render mock previews when available) */}
        {post.comments_count > 0 && (
          <div
            style={{
              borderTop: '0.5px solid #1e1e2e',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#1e1e2e',
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: '11px', fontWeight: 500, color: '#9b9bb0' }}
                className="shrink-0"
              >
                {post.comments_count} {post.comments_count === 1 ? 'Kommentar' : 'Kommentare'}
              </span>
              <span
                style={{ fontSize: '11px', color: '#5a5a72' }}
                className="truncate"
              >
                · alle ansehen
              </span>
            </div>
          </div>
        )}
      </article>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beitrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Beitrag wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
