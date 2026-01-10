import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Clock, Music, Volume2, VolumeX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PostWithAuthor } from '@/hooks/usePosts';

interface PostCardProps {
  post: PostWithAuthor;
  isLiked: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
}

export const PostCard = ({ post, isLiked, onLike }: PostCardProps) => {
  const author = post.author;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: de,
  });

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-play music when post is in view (TikTok-style)
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

  return (
    <article ref={cardRef} className="animate-fade-in overflow-hidden rounded-2xl border border-border/50 bg-card">
      {/* Hidden audio element for music */}
      {post.music_url && (
        <audio
          ref={audioRef}
          src={post.music_url}
          loop
          muted={isMuted}
          preload="metadata"
        />
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
            <span className="font-semibold text-foreground">
              {author?.display_name || 'Unbekannt'}
            </span>
            {author?.is_verified && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                ✓
              </Badge>
            )}
            {post.is_moment_x && (
              <Badge className="h-5 bg-gradient-to-r from-primary to-accent px-2 text-xs">
                Moment-X
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
            {post.location_name && (
              <>
                <span>•</span>
                <MapPin className="h-3 w-3" />
                <span>{post.location_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-muted">
        {post.media_type === 'video' ? (
          <video
            src={post.media_url}
            className="h-full w-full object-cover"
            controls
            playsInline
          />
        ) : (
          <img
            src={post.media_url}
            alt={post.caption || 'Post image'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Music overlay */}
        {post.music_url && post.music_title && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur">
              <Music className={cn("h-4 w-4 text-primary", isPlaying && "animate-pulse")} />
              <div className="max-w-[120px] overflow-hidden">
                <p className="truncate text-xs font-medium text-foreground">
                  {post.music_title}
                </p>
                {post.music_artist && (
                  <p className="truncate text-xs text-muted-foreground">
                    {post.music_artist}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Event badge overlay */}
        {post.event && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 backdrop-blur">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-sm font-medium text-foreground">
                {post.event.name}
              </span>
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
              className={cn(
                'h-5 w-5 transition-all',
                isLiked && 'fill-accent text-accent scale-110'
              )}
            />
            <span className={cn(isLiked && 'text-accent')}>
              {post.likes_count}
            </span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments_count}</span>
          </Button>
        </div>
        <Button variant="ghost" size="icon">
          <Share2 className="h-5 w-5" />
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
  );
};
