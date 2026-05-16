import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents, useMyEvents } from '@/hooks/useEvents';
import { useMyRSVPs } from '@/hooks/useEventAttendees';
import { useMyUpcomingParticipations, useSetParticipation } from '@/hooks/useEventParticipation';
import { useAuth } from '@/contexts/AuthContext';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Confetti, UserCheck, ChartBar, Eye, ShareNetwork, CalendarBlank, Plus, Hourglass, CheckCircle, MapPin } from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmV5cm4iLCJhIjoiY21tNjZrYm5xMGRwMTJwcnp5bmhwbGU2aSJ9.qvMwkRPWhHDXQYrsYpN2Yw';
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: myEvents, isLoading: myEventsLoading } = useMyEvents();
  const { data: myRSVPs, isLoading: rsvpsLoading } = useMyRSVPs();
  const { data: participations = [], isLoading: partLoading } = useMyUpcomingParticipations();
  const setParticipation = useSetParticipation();

  const pending = participations.filter((p: any) => p.status === 'requested');
  const accepted = participations.filter((p: any) => p.status === 'accepted');

  const mapPins = useMemo(() => accepted
    .map((p: any) => ({ id: p.event?.id, name: p.event?.name, lat: p.event?.latitude, lng: p.event?.longitude }))
    .filter((p: any) => p.lat && p.lng), [accepted]);

  const mapCenter = mapPins.length > 0
    ? { lat: mapPins.reduce((s: number, p: any) => s + p.lat, 0) / mapPins.length, lng: mapPins.reduce((s: number, p: any) => s + p.lng, 0) / mapPins.length }
    : { lat: 48.7758, lng: 9.1829 };


  return (
    <AppLayout>
      <div className="fixed inset-0 bg-background -z-10" />
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between p-4">
           <div className="flex items-center gap-2">
             <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
               <CalendarBlank weight="fill" className="h-4 w-4 text-primary" />
             </div>
             <FeyrnLogo size="sm" />
           </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill">
            <ChartBar weight="thin" className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="w-full bg-transparent border-b border-border rounded-none p-0 h-auto">
            <TabsTrigger value="upcoming" className="flex-1 rounded-none bg-transparent py-3 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">
              Anstehend
              {pending.length > 0 && (
                <Badge className="ml-1.5 h-5 w-5 rounded-full bg-primary p-0 text-xs text-primary-foreground border-0">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-rsvps" className="flex-1 rounded-none bg-transparent py-3 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">Zusagen</TabsTrigger>
            <TabsTrigger value="my-events" className="flex-1 rounded-none bg-transparent py-3 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">Meine</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="p-4" data-testid="events-list">
        <button
          data-testid="create-event-btn"
          onClick={() => navigate('/events/create')}
          className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition"
          aria-label="Event erstellen"
        >
          <Plus weight="bold" className="h-7 w-7" />
        </button>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="upcoming" className="mt-0 space-y-6">
            {!user ? (
              <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine anstehenden Events zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
            ) : partLoading ? <EventsSkeleton /> : (
              <>
                {mapPins.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-border/50">
                    <div className="h-48 w-full">
                      <Map
                        mapboxAccessToken={MAPBOX_TOKEN}
                        mapStyle={MAP_STYLE}
                        initialViewState={{ latitude: mapCenter.lat, longitude: mapCenter.lng, zoom: 11 }}
                        attributionControl={false}
                      >
                        {mapPins.map((p: any) => (
                          <Marker key={p.id} latitude={p.lat} longitude={p.lng} anchor="bottom" onClick={(e) => { e.originalEvent.stopPropagation(); navigate(`/events/${p.id}`); }}>
                            <div className="flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background cursor-pointer">
                              <MapPin weight="fill" className="h-4 w-4" />
                            </div>
                          </Marker>
                        ))}
                      </Map>
                    </div>
                  </div>
                )}

                {pending.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Hourglass weight="thin" className="h-4 w-4" /> Ausstehend ({pending.length})
                    </div>
                    {pending.map((p: any) => (
                      <div key={p.id} className="rounded-2xl border border-primary/30 bg-card p-4 space-y-3">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/events/${p.event?.id}`)}>
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                            {p.event?.cover_image_url ? <img src={p.event.cover_image_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">🎉</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{p.event?.name}</h3>
                            <p className="text-xs text-muted-foreground">{p.event?.starts_at && format(new Date(p.event.starts_at), 'EEE, d. MMM • HH:mm', { locale: de })}</p>
                            <p className="text-xs text-primary mt-0.5 flex items-center gap-1"><Hourglass weight="thin" className="h-3 w-3 animate-pulse" /> Ausstehend — warte auf Bestätigung</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={() => setParticipation.mutate({ eventId: p.event.id, status: null }, { onSuccess: () => toast.success('Anfrage zurückgezogen') })} disabled={setParticipation.isPending}>
                          Zurückziehen
                        </Button>
                      </div>
                    ))}
                  </section>
                )}

                {accepted.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <CheckCircle weight="thin" className="h-4 w-4 text-green-500" /> Zusagen ({accepted.length})
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {accepted.map((p: any) => (
                        <div key={p.id} data-testid="event-card">
                          <EventCard event={p.event} onClick={() => navigate(`/events/${p.event?.id}`)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {pending.length === 0 && accepted.length === 0 && (
                  <EmptyState title="Nichts Anstehendes" description="Stelle eine Anfrage zu einem Event und es erscheint hier." onAction={() => navigate('/discover')} actionLabel="Events entdecken" />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="my-rsvps" className="mt-0">
            {!user ? (
              <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine Zusagen zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
            ) : rsvpsLoading ? <EventsSkeleton /> : myRSVPs && myRSVPs.length > 0 ? (
              <div className="space-y-3">
                {myRSVPs.map((rsvp: any) => (
                  <div key={rsvp.id} onClick={() => navigate(`/events/${rsvp.event.id}`)} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:border-primary/50 transition">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      {rsvp.event.cover_image_url ? (
                        <img src={rsvp.event.cover_image_url} alt="" className="h-full w-full object-cover rounded-xl" />
                      ) : <span className="text-2xl">🎉</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{rsvp.event.name}</h3>
                      <p className="text-sm text-muted-foreground">{format(new Date(rsvp.event.starts_at), 'EEE, d. MMM • HH:mm', { locale: de })}</p>
                    </div>
                    <Badge variant={rsvp.status === 'going' ? 'default' : 'secondary'} className={rsvp.status === 'going' ? 'bg-green-500' : ''}>
                      <UserCheck weight="thin" className="mr-1 h-3 w-3" />
                      {rsvp.status === 'going' ? 'Zugesagt' : 'Interessiert'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Keine Zusagen" description="Du hast noch keinem Event zugesagt." onAction={() => setActiveTab('upcoming')} actionLabel="Events entdecken" />
            )}
          </TabsContent>

          <TabsContent value="my-events" className="mt-0">
            {!user ? (
              <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine Events zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
            ) : myEventsLoading ? <EventsSkeleton /> : myEvents && myEvents.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ChartBar weight="thin" className="h-5 w-5 text-primary" /> Dein Event-Dashboard
                  </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                     <div className="rounded-xl bg-background/50 p-3"><p className="text-xl font-bold text-primary">{myEvents.length}</p><p className="text-xs text-muted-foreground">Events</p></div>
                     <div className="rounded-xl bg-background/50 p-3"><p className="text-xl font-bold text-accent">--</p><p className="text-xs text-muted-foreground">Zusagen</p></div>
                     <div className="rounded-xl bg-background/50 p-3"><p className="text-xl font-bold text-green-500">--</p><p className="text-xs text-muted-foreground">Views</p></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {myEvents.map((event) => (
                    <div key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:border-primary/50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">{format(new Date(event.starts_at), 'EEE, d. MMM • HH:mm', { locale: de })}</p>
                        </div>
                        <Badge variant={event.is_active ? 'default' : 'secondary'}>{event.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><UserCheck weight="thin" className="h-4 w-4" /><span>-- zugesagt</span></div>
                        <div className="flex items-center gap-1"><Eye weight="thin" className="h-4 w-4" /><span>-- Views</span></div>
                        <div className="flex items-center gap-1"><ShareNetwork weight="thin" className="h-4 w-4" /><span>-- Shares</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Keine eigenen Events" description="Du hast noch keine Events erstellt." onAction={() => navigate('/events/create')} actionLabel="Erstes Event erstellen" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EventsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3"><Skeleton className="aspect-[16/9] w-full rounded-xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
      ))}
    </div>
  );
}

interface EmptyStateProps { title: string; description: string; onAction?: () => void; actionLabel?: string; }

function EmptyState({ title, description, onAction, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass">
        <Confetti weight="thin" className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">{description}</p>
      {onAction && actionLabel && <Button onClick={onAction} variant="outline">{actionLabel}</Button>}
    </div>
  );
}
