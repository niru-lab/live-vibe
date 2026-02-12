import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { useEvents } from '@/hooks/useEvents';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Users, Calendar, Play, MapPin, Music, CheckCircle2 } from 'lucide-react';
import type { FilterState } from './DiscoverFilters';

interface DiscoverGridProps {
  searchQuery?: string;
  filters?: FilterState;
}

export function DiscoverGrid({ searchQuery, filters }: DiscoverGridProps) {
  const navigate = useNavigate();
  const { data: rawPosts, isLoading: postsLoading } = usePosts();
  const rankedPosts = useFeedAlgorithm(rawPosts);
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: profile } = useProfile();

  const isLoading = postsLoading || eventsLoading;

  // Filter posts
  const filteredPosts = rankedPosts?.filter(post => {
    if (!searchQuery && !filters) return true;
    
    const query = searchQuery?.toLowerCase() || '';
    const matchesSearch = !searchQuery || (
      post.caption?.toLowerCase().includes(query) ||
      post.location_name?.toLowerCase().includes(query) ||
      post.author?.username?.toLowerCase().includes(query) ||
      post.author?.display_name?.toLowerCase().includes(query) ||
      post.city?.toLowerCase().includes(query)
    );

    return matchesSearch;
  }) || [];

  // Filter events
  const filteredEvents = events?.filter(event => {
    if (!searchQuery && !filters) return true;
    
    const query = searchQuery?.toLowerCase() || '';
    const matchesSearch = !searchQuery || (
      event.name.toLowerCase().includes(query) ||
      event.location_name.toLowerCase().includes(query) ||
      event.city.toLowerCase().includes(query)
    );

    // Apply time filter
    if (filters?.time) {
      const now = new Date();
      const eventDate = new Date(event.starts_at);
      
      if (filters.time === 'Jetzt') {
        const hoursAgo = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
        if (hoursAgo > 6 || hoursAgo < -1) return false;
      } else if (filters.time === 'Heute') {
        if (eventDate.toDateString() !== now.toDateString()) return false;
      } else if (filters.time === 'Wochenende') {
        const dayOfWeek = eventDate.getDay();
        if (dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0) return false;
      }
    }

    // Apply price filter
    if (filters?.price) {
      if (filters.price === 'Kostenlos' && !event.is_free) return false;
      if (filters.price === '< 10€' && (event.entry_price || 0) >= 10) return false;
      if (filters.price === '< 20€' && (event.entry_price || 0) >= 20) return false;
    }

    return matchesSearch;
  }) || [];

  // Combine and sort with algorithm prioritization
  const combinedItems = [
    ...filteredPosts.map(post => ({ 
      type: 'post' as const, 
      data: post, 
      date: new Date(post.created_at),
      priority: calculatePostPriority(post)
    })),
    ...filteredEvents.map(event => ({ 
      type: 'event' as const, 
      data: event, 
      date: new Date(event.created_at),
      priority: calculateEventPriority(event)
    })),
  ].sort((a, b) => b.priority - a.priority);

  // Priority calculation functions
  function calculatePostPriority(post: any): number {
    let priority = 0;
    const now = new Date();
    const postAge = (now.getTime() - new Date(post.created_at).getTime()) / (1000 * 60);
    
    // 1. Live posts (last 30min) → Top priority
    if (postAge < 30) priority += 100;
    else if (postAge < 60) priority += 50;
    
    // 2. Moment X posts get boost
    if (post.is_moment_x) priority += 30;
    
    // 3. Posts with music
    if (post.music_url) priority += 10;
    
    // 4. Engagement boost
    priority += (post.likes_count || 0) * 2;
    priority += (post.comments_count || 0) * 3;
    
    return priority;
  }

  function calculateEventPriority(event: any): number {
    let priority = 0;
    
    // Events with >50 expected attendees
    if ((event.expected_attendees || 0) > 50) priority += 80;
    else if ((event.expected_attendees || 0) > 20) priority += 40;
    
    // Free events get slight boost
    if (event.is_free) priority += 10;
    
    // Upcoming events today
    const eventDate = new Date(event.starts_at);
    const now = new Date();
    if (eventDate.toDateString() === now.toDateString()) priority += 60;
    
    return priority;
  }

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
        <h2 className="mb-2 text-xl font-semibold">Kein Content gefunden</h2>
        <p className="max-w-xs text-muted-foreground">
          {searchQuery ? 'Versuche andere Suchbegriffe' : 'Sei der Erste und teile deine Party-Momente!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {combinedItems.map((item) => (
        <GridItem
          key={`${item.type}-${item.data.id}`}
          item={item}
          onNavigate={navigate}
        />
      ))}
    </div>
  );
}

interface GridItemProps {
  item: { type: 'post' | 'event'; data: any; priority: number };
  onNavigate: (path: string) => void;
}

function GridItem({ item, onNavigate }: GridItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play music on hover (2 seconds)
  useEffect(() => {
    if (isHovered && item.type === 'post' && item.data.music_url) {
      audioRef.current = new Audio(item.data.music_url);
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
      
      const timeout = setTimeout(() => {
        audioRef.current?.pause();
      }, 2000);

      return () => {
        clearTimeout(timeout);
        audioRef.current?.pause();
      };
    }
  }, [isHovered, item]);

  const handleClick = () => {
    if (item.type === 'event') {
      onNavigate(`/events/${item.data.id}`);
    }
    // TODO: Post detail view
  };

  const handleProfileClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    onNavigate(`/profile/${username}`);
  };

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden bg-muted"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {item.type === 'post' ? (
        <PostGridItem 
          post={item.data} 
          isHovered={isHovered}
          onProfileClick={handleProfileClick}
        />
      ) : (
        <EventGridItem 
          event={item.data} 
          isHovered={isHovered}
          onProfileClick={handleProfileClick}
        />
      )}
    </div>
  );
}

interface PostGridItemProps {
  post: any;
  isHovered: boolean;
  onProfileClick: (e: React.MouseEvent, username: string) => void;
}

function PostGridItem({ post, isHovered, onProfileClick }: PostGridItemProps) {
  const isLive = () => {
    const postAge = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60);
    return postAge < 30 || post.is_moment_x;
  };

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
              loop
              playsInline
              {...(isHovered ? { autoPlay: true } : {})}
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

      {/* Live Tag or Engagement */}
      <div className="absolute right-1 top-1">
        {isLive() ? (
          <div className="flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 shadow-lg">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-[9px] font-bold text-white">LIVE</span>
          </div>
        ) : (post.likes_count || 0) > 0 ? (
          <div className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
            <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            <span className="text-[9px] font-semibold text-white">{post.likes_count}</span>
          </div>
        ) : null}
      </div>

      {/* Location Overlay */}
      {post.location_name && (
        <div className="absolute left-1 top-1">
          <div className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
            <MapPin className="h-2.5 w-2.5 text-primary" />
            <span className="max-w-[60px] truncate text-[9px] font-medium text-white">
              {post.location_name}
            </span>
          </div>
        </div>
      )}

      {/* Author with Profile Pic */}
      {post.author && (
        <div 
          className="absolute bottom-1 left-1 z-10"
          onClick={(e) => onProfileClick(e, post.author.username)}
        >
          <div className="flex items-center gap-1 rounded-full bg-black/70 pl-0.5 pr-2 py-0.5 backdrop-blur-sm transition-transform hover:scale-105">
            <Avatar className="h-5 w-5 border border-white/30">
              <AvatarImage src={post.author.avatar_url || ''} />
              <AvatarFallback className="text-[8px] bg-primary/30">
                {post.author.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-semibold text-white">
              @{post.author.username}
            </span>
          </div>
        </div>
      )}

      {/* Music Indicator with Animation */}
      {post.music_title && (
        <div className="absolute bottom-1 right-1">
          <div className={`flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm ${isHovered ? 'animate-pulse' : ''}`}>
            <Music className="h-3 w-3 text-green-400" />
            <span className="max-w-[50px] truncate text-[8px] text-white">
              {post.music_title}
            </span>
          </div>
        </div>
      )}

      {/* Hover Overlay with Actions */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4 text-white">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6" />
            <span className="text-xs font-semibold">{post.likes_count || 0}</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-semibold">{post.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </>
  );
}

interface EventGridItemProps {
  event: any;
  isHovered: boolean;
  onProfileClick: (e: React.MouseEvent, username: string) => void;
}

function EventGridItem({ event, isHovered, onProfileClick }: EventGridItemProps) {
  const attendeeCount = event.expected_attendees || 0;
  const isHot = attendeeCount > 50;

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

      {/* Event Type Badge */}
      <div className="absolute left-1 top-1">
        <Badge variant="secondary" className="bg-primary/90 text-[8px] text-primary-foreground backdrop-blur-sm px-1.5 py-0.5 gap-0.5">
          <Calendar className="h-2.5 w-2.5" />
          EVENT
        </Badge>
      </div>

      {/* Attendee Count with Hot Indicator */}
      <div className="absolute right-1 top-1">
        <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 backdrop-blur-sm ${isHot ? 'bg-green-500' : 'bg-black/70'}`}>
          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
          <span className="text-[9px] font-bold text-white">
            {attendeeCount}✓
          </span>
          {isHot && <span className="text-[9px]">🔥</span>}
        </div>
      </div>

      {/* Location Overlay */}
      <div className="absolute bottom-8 left-1 right-1">
        <div className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm w-fit max-w-full">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-primary" />
          <span className="truncate text-[9px] font-medium text-white">
            {event.location_name}
          </span>
        </div>
      </div>

      {/* Creator Info */}
      {event.creator && (
        <div 
          className="absolute bottom-1 left-1 z-10"
          onClick={(e) => onProfileClick(e, event.creator.username)}
        >
          <div className="flex items-center gap-1 rounded-full bg-black/70 pl-0.5 pr-2 py-0.5 backdrop-blur-sm transition-transform hover:scale-105">
            <Avatar className="h-5 w-5 border border-white/30">
              <AvatarImage src={event.creator.avatar_url || ''} />
              <AvatarFallback className="text-[8px] bg-primary/30">
                {event.creator.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-semibold text-white">
              @{event.creator.username}
            </span>
          </div>
        </div>
      )}

      {/* Category Emoji */}
      <div className="absolute bottom-1 right-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
          <span className="text-sm">
            {event.category === 'club' && '🎧'}
            {event.category === 'house_party' && '🏠'}
            {event.category === 'bar' && '🍸'}
            {event.category === 'festival' && '🎪'}
            {event.category === 'concert' && '🎤'}
            {event.category === 'other' && '✨'}
          </span>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <span className="line-clamp-2 text-center text-sm font-bold text-white">
          {event.name}
        </span>
        <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
          <Users className="h-3 w-3" />
          <span>{attendeeCount} zugesagt</span>
        </div>
        <Badge className="mt-2 bg-primary text-[10px]">
          Zusagen →
        </Badge>
      </div>
    </>
  );
}
