import { useState, useRef, useEffect } from 'react';
import { Heart, ChatCircle, ShareNetwork, MapPin, Clock, MusicNote, SpeakerHigh, SpeakerX, DotsThreeVertical, Trash, Timer } from '@phosphor-icons/react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { BadgeDisplay } from '@/components/profile/BadgeDisplay';
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
    addSuffix: true,
    locale: de,
  });

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isOwnPost = currentProfile?.id === post.author_id;
  
  const getTimeRemaining = () => {
    if (!post.expires_at) return null;
    const expiresAt = new Date(post.expires_at);
    const now = new Date();
    const hoursLeft = differenceInHours(expiresAt, now);
    if (hoursLeft <= 0) return 'Läuft bald ab';
    if (hoursLeft === 1) return '1 Stunde';
    return `${hoursLeft} Stunden`;
  };

  const timeRemaining = getTimeRemaining();

  useEffect(() => {
    if (!post.music_url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          } else {
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [post.music_url]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

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
      <article ref={cardRef} className="animate-fade-in overflow-hidden rounded-2xl border border-border/50 bg-card">
        {post.music_url && (
          <audio ref={audioRef} src={post.music_url} loop muted={isMuted} preload="metadata" />
        )}

        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={author?.avatar_url || ''} alt={author?.display_name || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              {author?.display_name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-foreground">
                {author?.display_name || 'Unbekannt'}
              </span>
              {author?.social_cloud_points !== undefined && (
                <BadgeDisplay points={author.social_cloud_points} size="sm" />
              )}
              {author?.is_verified && (
                 <Badge variant="secondary" className="h-5 px-1.5 text-xs">✓</Badge>
              )}
              {post.is_moment_x && (
                <Badge className="h-5 bg-gradient-to-r from-primary to-accent px-2 text-xs">Moment-X</Badge>
              )}
              {post.expires_at && (
                <Badge variant="outline" className="h-5 gap-1 border-accent/50 px-2 text-xs text-accent">
                  <Timer weight="thin" className="h-3 w-3" />
                  {timeRemaining}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock weight="thin" className="h-3 w-3" />
              <span>{timeAgo}</span>
              {post.location_name && (
                <>
                  <span>•</span>
                  <MapPin weight="thin" className="h-3 w-3" />
                  <span>{post.location_name}</span>
                </>
              )}
            </div>
          </div>
          
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <DotsThreeVertical weight="thin" className="h-4 w-4" />
                </Button>
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
          )}
        </div>

        {/* Media */}
        <div className="relative aspect-square bg-muted">
          {post.media_type === 'video' ? (
            <video src={post.media_url} className="h-full w-full object-cover" controls playsInline />
          ) : (
            <img src={post.media_url} alt={post.caption || 'Post image'} className="h-full w-full object-cover" loading="lazy" />
          )}
          
          {post.music_url && post.music_title && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur">
                <MusicNote weight={isPlaying ? "fill" : "thin"} className={cn("h-4 w-4 text-primary", isPlaying && "animate-pulse")} />
                <div className="max-w-[120px] overflow-hidden">
                   <p className="truncate text-xs font-medium text-foreground">{post.music_title}</p>
                  {post.music_artist && (
                    <p className="truncate text-xs text-muted-foreground">{post.music_artist}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMute}>
                  {isMuted ? (
                    <SpeakerX weight="thin" className="h-3 w-3" />
                  ) : (
                    <SpeakerHigh weight="thin" className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {post.event && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 backdrop-blur">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="text-sm font-medium text-foreground">{post.event.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/50 p-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => onLike(post.id, isLiked)}
            >
              <Heart
                weight={isLiked ? 'fill' : 'thin'}
                className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isLiked ? 'text-red-400 scale-110' : 'text-foreground'
                )}
              />
              <span className={cn(isLiked && 'text-red-400')}>
                {post.likes_count}
              </span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChatCircle weight="thin" className="h-5 w-5" />
              <span>{post.comments_count}</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon">
            <ShareNetwork weight="thin" className="h-5 w-5" />
          </Button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="border-t border-border/50 px-4 py-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{author?.username} </span>
              {post.caption}
            </p>
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
