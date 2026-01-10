import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { EventWithCreator } from '@/hooks/useEvents';

const categoryEmojis: Record<string, string> = {
  club: '🎧',
  house_party: '🏠',
  bar: '🍸',
  festival: '🎪',
  concert: '🎤',
  other: '✨',
};

interface EventCardProps {
  event: EventWithCreator;
  onClick: () => void;
}

export const EventCard = ({ event, onClick }: EventCardProps) => {
  const startsAt = new Date(event.starts_at);
  const isToday = new Date().toDateString() === startsAt.toDateString();
  const isSoon = startsAt.getTime() - Date.now() < 3 * 60 * 60 * 1000; // Within 3 hours

  return (
    <article
      onClick={onClick}
      className="group animate-fade-in cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-glow"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] bg-muted">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-5xl">
              {categoryEmojis[event.category] || '🎉'}
            </span>
          </div>
        )}

        {/* Live badge */}
        {isSoon && (
          <div className="absolute left-3 top-3">
            <Badge className="bg-accent/90 backdrop-blur">
              <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
              {isToday ? 'Heute' : 'Bald'}
            </Badge>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute right-3 top-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            {event.is_free ? 'Kostenlos' : `${event.entry_price}€`}
          </Badge>
        </div>

        {/* Category */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className="border-white/30 bg-background/60 backdrop-blur">
            {categoryEmojis[event.category]} {event.category.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-2 font-display text-lg font-bold text-foreground line-clamp-1">
          {event.name}
        </h3>

        <div className="mb-3 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {format(startsAt, 'EEEE, d. MMMM', { locale: de })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{format(startsAt, 'HH:mm', { locale: de })} Uhr</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="line-clamp-1">{event.location_name}, {event.city}</span>
          </div>
          {event.expected_attendees && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>~{event.expected_attendees} erwartet</span>
            </div>
          )}
        </div>

        {/* Creator */}
        {event.creator && (
          <div className="flex items-center gap-2 border-t border-border/50 pt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.creator.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {event.creator.display_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              von <span className="font-medium text-foreground">{event.creator.display_name}</span>
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
