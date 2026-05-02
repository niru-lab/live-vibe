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
        className="animate-fade-in overflow-hidden w-full bg-card border border-border"
        style={{
          borderRadius: '18px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top row: image + content */}
        <div className="flex" style={{ minHeight: '260px' }}>
          {/* Left image */}
          <div
            style={{ width: '220px', height: '260px', flexShrink: 0 }}
            className="relative bg-muted overflow-hidden"
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
                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                  {author?.display_name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className="truncate text-muted-foreground"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  minWidth: 0,
                }}
              >
                {author?.username || author?.display_name || 'unbekannt'}
              </span>
              <span className="text-muted-foreground/60" style={{ fontSize: '10px' }}>·</span>
              <span className="text-muted-foreground/60 shrink-0" style={{ fontSize: '10px' }}>
                {timeAgo}
              </span>

              {isOwnPost && (
                <div className="ml-auto shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 -m-1 text-muted-foreground/60 hover:text-muted-foreground">
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
                className="text-foreground"
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                  marginTop: '8px',
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
                className="text-muted-foreground"
                style={{
                  fontSize: '12px',
                  lineHeight: 1.45,
                  marginTop: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
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
                className={cn('flex items-center gap-1', isLiked ? 'text-pink-500' : 'text-muted-foreground/60')}
                style={{ fontSize: '11px' }}
              >
                <Heart
                  weight={isLiked ? 'fill' : 'regular'}
                  style={{ width: '13px', height: '13px' }}
                  className={cn('transition-all', isLiked && 'scale-110')}
                />
                <span>{post.likes_count}</span>
              </button>
              <div
                className="flex items-center gap-1 text-muted-foreground/60"
                style={{ fontSize: '11px' }}
              >
                <ChatCircle weight="regular" style={{ width: '13px', height: '13px' }} />
                <span>{post.comments_count}</span>
              </div>

              {(post.event?.name || post.location_name) && (
                <span
                  className="truncate bg-primary/10 border border-primary/30 text-primary"
                  style={{
                    marginLeft: 'auto',
                    borderRadius: '20px',
                    padding: '3px 7px',
                    fontSize: '10px',
                    maxWidth: '75px',
                  }}
                >
                  {post.event?.name || post.location_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Comment preview */}
        {post.comments_count > 0 && (
          <div
            className="border-t border-border"
            style={{
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <div
                className="bg-muted"
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
              <span
                className="shrink-0 text-muted-foreground"
                style={{ fontSize: '11px', fontWeight: 500 }}
              >
                {post.comments_count} {post.comments_count === 1 ? 'Kommentar' : 'Kommentare'}
              </span>
              <span
                className="truncate text-muted-foreground/60"
                style={{ fontSize: '11px' }}
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
