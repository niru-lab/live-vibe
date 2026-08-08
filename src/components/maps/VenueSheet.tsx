import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RsvpButtons } from '@/components/events/RsvpButtons';
import { useVenueActiveEvent, useVenueLinkedPosts, useVenueProfile, type VenueEventStatus } from '@/hooks/useVenueSheet';
import { VenueProfileFallback } from '@/components/maps/VenueProfileFallback';
import { useRsvpCounts } from '@/hooks/useEventAttendees';
import { track } from '@/lib/analytics';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MapPin, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';

export interface SheetVenue {
  id: string;
  name: string;
  category: string;
  address?: string | null;
  city?: string | null;
  description?: string | null;
  image_url?: string | null;
  owner_profile_id?: string | null;
  is_verified?: boolean | null;
}

type TabKey = 'event' | 'posts' | 'profile';

const statusStyles: Record<VenueEventStatus, { label: string; className: string }> = {
  live: { label: 'LIVE', className: 'bg-red-500 text-white animate-pulse' },
  today: { label: 'Heute', className: 'bg-primary text-primary-foreground' },
  upcoming: { label: 'Bald', className: 'bg-muted text-muted-foreground' },
};

interface VenueSheetProps {
  venue: SheetVenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet for a venue marker. Event-first when an active/upcoming event
 * exists, otherwise the venue view. The map stays mounted behind it, so the
 * map context (center, zoom, filters) is preserved.
 */
export const VenueSheet = ({ venue, open, onOpenChange }: VenueSheetProps) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('event');

  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
  } = useVenueActiveEvent(venue?.id, venue?.owner_profile_id);
  const {
    data: posts,
    isLoading: postsLoading,
    isError: postsError,
  } = useVenueLinkedPosts(open ? venue?.id : undefined, event?.id ?? null, 12);
  const { data: counts } = useRsvpCounts(event?.id ? [event.id] : []);
  const { state: profileState, profile, refetch: refetchProfile } = useVenueProfile(open ? venue?.id : undefined);

  // Event-first only when there really is an event.
  useEffect(() => {
    if (!open) return;
    if (eventLoading) return;
    setTab(event ? 'event' : 'profile');
  }, [open, eventLoading, event?.id]);

  useEffect(() => {
    if (!open || !venue) return;
    track('venue_marker_opened', { venueId: venue.id, surface: 'map' });
  }, [open, venue?.id]);

  useEffect(() => {
    if (!open || !venue) return;
    if (tab === 'event' && event) track('venue_active_event_viewed', { venueId: venue.id, eventId: event.id, surface: 'map' });
    if (tab === 'posts') track('venue_live_posts_viewed', { venueId: venue.id, surface: 'map' });
  }, [tab, open, venue?.id, event?.id]);

  if (!venue) return null;

  const status = event ? statusStyles[event.status] : null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'event', label: 'Event' },
    { key: 'posts', label: 'Live Posts' },
    { key: 'profile', label: 'Profil' },
  ];

  const openVenueProfile = () => {
    if (profileState !== 'found') {
      setTab('profile');
      return;
    }
    track('venue_profile_opened_from_map', { venueId: venue.id, surface: 'map' });
    onOpenChange(false);
    navigate(`/venues/${venue.id}`);
  };

  const openEventDetail = () => {
    if (!event) return;
    track('event_detail_opened_from_map', { venueId: venue.id, eventId: event.id, surface: 'map' });
    onOpenChange(false);
    navigate(`/events/${event.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />

        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground">{venue.name}</h2>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[venue.address, venue.city].filter(Boolean).join(', ') || venue.category}
          </p>
        </div>

        <div className="mb-4 flex gap-4 border-b border-border/60">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-selected={tab === t.key}
              role="tab"
              className={`min-h-[44px] text-sm transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-primary font-semibold text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'event' && (
          <div className="space-y-3">
            {eventLoading && <Skeleton className="h-40 w-full rounded-xl" />}
            {eventError && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Event konnte nicht geladen werden.
              </p>
            )}
            {!eventLoading && !eventError && !event && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Aktuell kein Event an dieser Location.</p>
                <Button variant="outline" className="mt-3 min-h-[44px]" onClick={openVenueProfile}>
                  Venue ansehen
                </Button>
              </div>
            )}
            {event && (
              <>
                {event.cover_image_url && (
                  <img
                    src={event.cover_image_url}
                    alt={event.name}
                    loading="lazy"
                    className="h-36 w-full rounded-xl object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  {status && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                      {status.label}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{event.name}</h3>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(event.starts_at), 'EEE, dd. MMM · HH:mm', { locale: de })} Uhr
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {event.location_name}
                  {event.city ? `, ${event.city}` : ''}
                </p>

                <RsvpButtons eventId={event.id} surface="venue_sheet" counts={counts?.[event.id]} />

                <Button variant="outline" className="min-h-[44px] w-full gap-1" onClick={openEventDetail}>
                  Event Details <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {tab === 'posts' && (
          <div>
            {postsLoading && (
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            )}
            {postsError && (
              <p className="py-6 text-center text-sm text-muted-foreground">Posts konnten nicht geladen werden.</p>
            )}
            {!postsLoading && !postsError && (posts?.length ?? 0) === 0 && (
              <div className="py-10 text-center">
                <ImageIcon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Noch keine Posts von dieser Location.</p>
              </div>
            )}
            {!postsLoading && (posts?.length ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {posts!.map((post) => (
                  <div key={post.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} className="h-full w-full object-cover" muted />
                    ) : (
                      <img
                        src={post.media_url}
                        alt={post.caption || 'Venue Post'}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    {event && post.event_id === event.id && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        Event
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-3">
            {venue.image_url && (
              <img
                src={venue.image_url}
                alt={venue.name}
                loading="lazy"
                className="h-32 w-full rounded-xl object-cover"
              />
            )}
            <p className="text-sm text-foreground">{venue.name}</p>
            <p className="text-xs text-muted-foreground">
              {venue.description || 'Keine Beschreibung hinterlegt.'}
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5">{venue.category}</span>
              {event && <span className="rounded-full bg-muted px-2 py-0.5">1 Event geplant</span>}
              <span className="rounded-full bg-muted px-2 py-0.5">{posts?.length ?? 0} Posts</span>
            </div>
            <Button className="min-h-[44px] w-full gap-1" onClick={openVenueProfile}>
              Venue Profil öffnen <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
