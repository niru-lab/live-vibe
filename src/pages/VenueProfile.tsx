import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RsvpButtons } from '@/components/events/RsvpButtons';
import { useVenueActiveEvent, useVenueProfile, useVenueLinkedPosts } from '@/hooks/useVenueSheet';
import { VenueProfileFallback } from '@/components/maps/VenueProfileFallback';
import { useRsvpCounts } from '@/hooks/useEventAttendees';
import { track } from '@/lib/analytics';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowLeft, MapPin, Clock } from 'lucide-react';

export default function VenueProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { state: profileState, profile, isClaimed, refetch } = useVenueProfile(id);
  const venue = profile as
    | (Record<string, unknown> & {
        id: string;
        name: string;
        owner_profile_id?: string | null;
        image_url?: string | null;
        description?: string | null;
        address?: string | null;
        city?: string | null;
        category?: string | null;
        is_verified?: boolean | null;
      })
    | null;
  const { data: event } = useVenueActiveEvent(id, venue?.owner_profile_id);
  const { data: posts, isLoading: postsLoading } = useVenueLinkedPosts(id, event?.id ?? null, 30);
  const { data: counts } = useRsvpCounts(event?.id ? [event.id] : []);

  useEffect(() => {
    if (venue?.id) track('venue_profile_opened_from_map', { venueId: venue.id, surface: 'venue_profile' });
  }, [venue?.id]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex min-h-[44px] items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>

        {profileState !== 'found' && (
          <VenueProfileFallback
            state={profileState}
            hasEvent={!!event}
            hasPosts={(posts?.length ?? 0) > 0}
            onBackToEvent={event ? () => navigate(`/events/${event.id}`) : undefined}
            onViewPosts={undefined}
            onRetry={refetch}
          />
        )}


        {venue && (
          <>
            {venue.image_url && (
              <img
                src={venue.image_url}
                alt={venue.name}
                className="mb-4 h-44 w-full rounded-xl object-cover"
              />
            )}
            <h1 className="text-xl font-semibold text-foreground">{venue.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[venue.address, venue.city].filter(Boolean).join(', ') || venue.category}
            </p>
            {venue.description && <p className="mt-3 text-sm text-foreground">{venue.description}</p>}

            <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">{venue.category}</span>
              <span className="rounded-full bg-muted px-2 py-1">{posts?.length ?? 0} Posts</span>
              {venue.is_verified && <span className="rounded-full bg-primary/20 px-2 py-1 text-primary">Verifiziert</span>}
            </div>

            {event && (
              <section className="mt-6 rounded-xl border border-border/60 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      event.status === 'live'
                        ? 'animate-pulse bg-red-500 text-white'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {event.status === 'live' ? 'LIVE' : event.status === 'today' ? 'Heute' : 'Bald'}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">{event.name}</h2>
                </div>
                <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(event.starts_at), 'EEE, dd. MMM · HH:mm', { locale: de })} Uhr
                </p>
                <RsvpButtons eventId={event.id} surface="venue_profile" counts={counts?.[event.id]} />
                <Button
                  variant="outline"
                  className="mt-2 min-h-[44px] w-full"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  Event Details
                </Button>
              </section>
            )}

            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Posts</h2>
              {postsLoading && (
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              )}
              {!postsLoading && (posts?.length ?? 0) === 0 && (
                isClaimed ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Noch keine Posts von dieser Location.
                  </p>
                ) : (
                  <VenueProfileFallback
                    state="not_found"
                    hasEvent={!!event}
                    onBackToEvent={event ? () => navigate(`/events/${event.id}`) : undefined}
                  />
                )
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
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
