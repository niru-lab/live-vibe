import { CalendarBlank, Clock, Heart, MapPin, Users } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRsvpMap, useRSVP } from '@/hooks/useEventAttendees';
import { useToast } from '@/hooks/use-toast';
import { eventDistanceLabel, eventTimeLabel, isEventLive, socialLine } from '@/lib/eventCard';
import { cn } from '@/lib/utils';

const categoryEmojis: Record<string, string> = { club: '🎧', house_party: '🏠', bar: '🍸', festival: '🎪', concert: '🎤', sport: '⚽', other: '✨' };

export interface EventCardData {
  id: string;
  name: string;
  starts_at: string;
  ends_at?: string | null;
  cover_image_url?: string | null;
  location_name?: string | null;
  city?: string | null;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  visibility?: string | null;
}

/** Cover image, or a warm category gradient when the event has none. */
export const EventCover = ({ event, className }: { event: EventCardData; className?: string }) =>
  event.cover_image_url ? (
    <img src={event.cover_image_url} alt="" className={cn('h-full w-full object-cover', className)} loading="lazy" />
  ) : (
    <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a1a3a] via-[#5b2a6e] to-[#eb6a2e]', className)}>
      <span className="text-5xl opacity-90">{categoryEmojis[event.category ?? ''] || '🎉'}</span>
    </div>
  );

interface EventHeroCardProps {
  event: EventCardData;
  counts?: { going: number; interested: number };
  myPosition?: { lat: number; lng: number } | null;
}

/** "Entdecken" card: big photo, title on the image, live badge, heart = interested, time pill. */
export const EventHeroCard = ({ event, counts, myPosition }: EventHeroCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myRsvps } = useMyRsvpMap();
  const rsvp = useRSVP();
  const live = isEventLive(event);
  const status = myRsvps?.[event.id] ?? null;
  const saved = status === 'interested' || status === 'going';
  const distance = eventDistanceLabel(event, myPosition);
  const social = socialLine(counts, live);
  const place = event.location_name || event.city || 'Unbekannt';

  const toggleHeart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate(`/auth?redirect=${encodeURIComponent('/events')}`); return; }
    // "going" already implies interest — the heart never downgrades a Zusage.
    if (status === 'going') { toast({ title: 'Du bist schon dabei ✓' }); return; }
    try {
      await rsvp.mutateAsync({ eventId: event.id, status: status === 'interested' ? null : 'interested', surface: 'events' });
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Konnte nicht gespeichert werden.' });
    }
  };

  return (
    <article
      onClick={() => navigate(`/events/${event.id}`)}
      data-testid="event-card"
      className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-[28px] bg-muted shadow-sm transition active:scale-[0.99]"
    >
      <EventCover event={event} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      {live && (
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md" data-testid="event-live-badge">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]" /> Live
        </span>
      )}

      <button
        type="button"
        onClick={toggleHeart}
        disabled={rsvp.isPending}
        aria-pressed={saved}
        aria-label={saved ? 'Gemerkt' : 'Merken'}
        data-testid="event-heart"
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-white transition active:scale-90"
      >
        <Heart weight={saved ? 'fill' : 'bold'} className={cn('h-7 w-7 drop-shadow', saved && 'text-primary')} />
      </button>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 font-display text-2xl font-extrabold leading-tight drop-shadow">{event.name}</h3>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm text-white/90">
              <MapPin weight="bold" className="h-4 w-4 shrink-0" />
              <span className="truncate">{place}{distance ? ` · ${distance}` : ''}</span>
            </p>
            {social && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/90">
                <Users weight="bold" className="h-4 w-4 shrink-0" /> {social}
              </p>
            )}
          </div>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
              live ? 'bg-black/45 text-white backdrop-blur-md' : 'bg-[#FBEBDD] text-[#2b1a12]',
            )}
          >
            {live ? <Clock weight="bold" className="h-4 w-4" /> : <CalendarBlank weight="bold" className="h-4 w-4" />}
            {eventTimeLabel(event.starts_at)}
          </span>
        </div>
      </div>
    </article>
  );
};
