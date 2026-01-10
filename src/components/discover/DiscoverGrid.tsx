import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Users, Calendar, Play } from 'lucide-react';

export function DiscoverGrid() {
  const navigate = useNavigate();
  const { data: posts, isLoading: postsLoading } = usePosts();
  const { data: events, isLoading: eventsLoading } = useEvents();

  const isLoading = postsLoading || eventsLoading;

  // Combine posts and events into a single feed, sorted by date
  const combinedItems = [
    ...(posts?.map(post => ({ type: 'post' as const, data: post, date: new Date(post.created_at) })) || []),
    ...(events?.map(event => ({ type: 'event' as const, data: event, date: new Date(event.created_at) })) || []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  if (combinedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Noch kein Content</h2>
        <p className="max-w-xs text-muted-foreground">
          Sei der Erste und teile deine Party-Momente!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {combinedItems.map((item) => (
        <div
          key={`${item.type}-${item.data.id}`}
          className="group relative aspect-square cursor-pointer overflow-hidden bg-muted"
          onClick={() => {
            if (item.type === 'event') {
              navigate(`/events/${item.data.id}`);
            }
            // TODO: Navigate to post detail when implemented
          }}
        >
          {item.type === 'post' ? (
            <PostGridItem post={item.data} />
          ) : (
            <EventGridItem event={item.data} />
          )}
        </div>
      ))}
    </div>
  );
}

function PostGridItem({ post }: { post: any }) {
  return (
    <>
      {/* Media */}
      {post.media_url ? (
        post.media_type === 'video' ? (
          <div className="relative h-full w-full">
            <video
              src={post.media_url}
              className="h-full w-full object-cover"
              muted
            />
            <div className="absolute right-2 top-2">
              <Play className="h-4 w-4 fill-white text-white drop-shadow-lg" />
            </div>
          </div>
        ) : (
          <img
            src={post.media_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <span className="text-4xl">📸</span>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-1">
            <Heart className="h-5 w-5 fill-white" />
            <span className="font-semibold">{post.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-5 w-5 fill-white" />
            <span className="font-semibold">{post.comments_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Author Badge */}
      {post.author && (
        <div className="absolute bottom-2 left-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Avatar className="h-4 w-4">
              <AvatarImage src={post.author.avatar_url || ''} />
              <AvatarFallback className="text-[8px]">
                {post.author.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-white">
              @{post.author.username}
            </span>
          </div>
        </div>
      )}

      {/* Moment X Badge */}
      {post.is_moment_x && (
        <div className="absolute right-2 top-2">
          <Badge className="bg-gradient-to-r from-primary to-accent text-[10px] font-bold">
            X
          </Badge>
        </div>
      )}

      {/* Music Indicator */}
      {post.music_title && (
        <div className="absolute bottom-2 right-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-xs">🎵</span>
          </div>
        </div>
      )}
    </>
  );
}

function EventGridItem({ event }: { event: any }) {
  return (
    <>
      {/* Cover Image */}
      {event.cover_image_url ? (
        <img
          src={event.cover_image_url}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent">
          <span className="text-4xl">🎉</span>
        </div>
      )}

      {/* Event Badge */}
      <div className="absolute left-2 top-2">
        <Badge variant="secondary" className="bg-black/60 text-[10px] text-white backdrop-blur-sm">
          <Calendar className="mr-1 h-3 w-3" />
          EVENT
        </Badge>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="line-clamp-2 text-center text-sm font-bold text-white">
          {event.name}
        </span>
        <div className="mt-2 flex items-center gap-1 text-xs text-white/80">
          <Users className="h-3 w-3" />
          <span>{event.expected_attendees || '?'} erwartet</span>
        </div>
      </div>

      {/* Category Emoji */}
      <div className="absolute bottom-2 right-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-xs">
            {event.category === 'club' && '🎧'}
            {event.category === 'house_party' && '🏠'}
            {event.category === 'bar' && '🍸'}
            {event.category === 'festival' && '🎪'}
            {event.category === 'concert' && '🎤'}
            {event.category === 'other' && '✨'}
          </span>
        </div>
      </div>

      {/* Creator Info */}
      {event.creator && (
        <div className="absolute bottom-2 left-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Avatar className="h-4 w-4">
              <AvatarImage src={event.creator.avatar_url || ''} />
              <AvatarFallback className="text-[8px]">
                {event.creator.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-white">
              @{event.creator.username}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
