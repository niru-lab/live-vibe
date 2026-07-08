import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents, useMyEvents } from '@/hooks/useEvents';
import { useMyRSVPs, useMyInvitations, useRespondToInvitation } from '@/hooks/useEventAttendees';
import { useMyUpcomingParticipations, useSetParticipation } from '@/hooks/useEventParticipation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Confetti,
  MagnifyingGlass,
  MapPin,
  CalendarBlank,
  Clock,
  CurrencyEur,
  MusicNote,
  Plus,
  Hourglass,
  CalendarStar,
} from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { format, isToday, isTomorrow, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CITIES = ['Stuttgart', 'Aalen', 'Frankfurt'];

type DateFilter = { key: string; label: string; date: Date | null };

function buildDateFilters(): DateFilter[] {
  const today = new Date();
  const filters: DateFilter[] = [
    { key: 'all', label: 'Alle Tage', date: null },
    { key: 'today', label: 'Heute', date: today },
    { key: 'tomorrow', label: 'Morgen', date: addDays(today, 1) },
  ];
  for (let i = 2; i <= 6; i++) {
    const d = addDays(today, i);
    filters.push({
      key: `d${i}`,
      label: format(d, 'EEE, d. MMM', { locale: de }),
      date: d,
    });
  }
  return filters;
}

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [dateKey, setDateKey] = useState<string>('all');
  const [city, setCity] = useState<string | null>(null);
  const [myEventsView, setMyEventsView] = useState<'zugesagt' | 'anstehend' | 'vergangen'>('anstehend');

  const dateFilters = useMemo(buildDateFilters, []);
  const activeDate = dateFilters.find((f) => f.key === dateKey)?.date ?? null;

  const { data: allEvents = [], isLoading: discoverLoading } = useEvents();
  const { data: myEvents, isLoading: myEventsLoading } = useMyEvents();
  const { data: myRSVPs, isLoading: rsvpsLoading } = useMyRSVPs();
  const { data: participations = [], isLoading: partLoading } = useMyUpcomingParticipations();
  const { data: invitations = [], isLoading: invitesLoading } = useMyInvitations();
  const setParticipation = useSetParticipation();
  const respondInvitation = useRespondToInvitation();

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e: any) => {
      if (search && !`${e.name} ${e.location_name ?? ''} ${e.city ?? ''}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (activeDate && !isSameDay(new Date(e.starts_at), activeDate)) return false;
      if (city) {
        const evCity = (e.city ?? '').toString().toLowerCase();
        if (evCity !== city.toLowerCase()) return false;
      }
      return true;
    });
  }, [allEvents, search, activeDate, city]);


  const pending = participations.filter((p: any) => p.status === 'requested');
  const accepted = participations.filter((p: any) => p.status === 'accepted');

  return (
    <AppLayout>
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Header */}
      <header className="px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
              <CalendarStar weight="fill" className="h-4 w-4 text-primary" />
            </div>
            <FeyrnLogo size="sm" />
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="px-5 pt-3">
        <div className="flex h-12 items-center gap-3 rounded-2xl bg-muted/60 px-4">
          <MagnifyingGlass weight="regular" className="h-5 w-5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Events suchen…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Date chips */}
      <ChipRow>
        {dateFilters.map((f) => (
          <Chip key={f.key} active={dateKey === f.key} onClick={() => setDateKey(f.key)}>
            {f.label}
          </Chip>
        ))}
      </ChipRow>

      {/* Genre chips */}
      <ChipRow>
        <Chip active={genre === null} onClick={() => setGenre(null)}>Genres</Chip>
        {GENRES.map((g) => (
          <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
            {g}
          </Chip>
        ))}
      </ChipRow>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-transparent border-b border-border rounded-none p-0 h-auto justify-start gap-6">
            <TabsTrigger value="discover" className="rounded-none bg-transparent px-0 py-3 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">
              Entdecken
            </TabsTrigger>
            <TabsTrigger value="requested" className="rounded-none bg-transparent px-0 py-3 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">
              Angefragt
              {(pending.length + invitations.length) > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground border-0">{pending.length + invitations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-events" className="rounded-none bg-transparent px-0 py-3 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">
              Meine
            </TabsTrigger>
          </TabsList>

          <div className="pt-5 pb-2" data-testid="events-list">
            {/* FAB */}
            <button
              data-testid="create-event-btn"
              onClick={() => navigate('/events/create')}
              className="fixed bottom-28 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition"
              aria-label="Event erstellen"
            >
              <Plus weight="bold" className="h-7 w-7" />
            </button>

            <TabsContent value="discover" className="mt-0 space-y-4">
              {discoverLoading ? (
                <EventListSkeleton />
              ) : filteredEvents.length === 0 ? (
                <EmptyState
                  title="Keine Events gefunden"
                  description="Passe deine Filter an oder versuche es später erneut."
                />
              ) : (
                filteredEvents.map((event: any) => (
                  <EventListCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
                ))
              )}
            </TabsContent>

            <TabsContent value="requested" className="mt-0 space-y-4">
              {!user ? (
                <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine Anfragen zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
              ) : partLoading || invitesLoading ? (
                <EventListSkeleton />
              ) : pending.length === 0 && invitations.length === 0 ? (
                <EmptyState title="Keine offenen Anfragen" description="Frag ein Event an oder warte auf Einladungen." onAction={() => setActiveTab('discover')} actionLabel="Events entdecken" />
              ) : (
                <>
                  {invitations.length > 0 && (
                    <section className="space-y-3">
                      <SectionLabel title={`Einladungen (${invitations.length})`} />
                      {invitations.map((inv: any) => (
                        <div key={inv.id} className="rounded-2xl border border-primary/40 bg-card overflow-hidden">
                          <EventListCard event={inv.event} onClick={() => navigate(`/events/${inv.event?.id}`)} />
                          <div className="flex gap-2 border-t border-border/50 px-3 py-2">
                            <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={() => respondInvitation.mutate({ attendeeId: inv.id, accept: false }, { onSuccess: () => toast.success('Einladung abgelehnt') })} disabled={respondInvitation.isPending}>
                              Ablehnen
                            </Button>
                            <Button size="sm" className="flex-1" onClick={() => respondInvitation.mutate({ attendeeId: inv.id, accept: true }, { onSuccess: () => toast.success('Du bist dabei! 🎉') })} disabled={respondInvitation.isPending}>
                              Annehmen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}

                  {pending.length > 0 && (
                    <section className="space-y-3">
                      <SectionLabel icon={<Hourglass weight="regular" className="h-4 w-4" />} title={`Ausstehend (${pending.length})`} />
                      {pending.map((p: any) => (
                        <div key={p.id} className="rounded-2xl border border-primary/30 bg-card overflow-hidden">
                          <EventListCard event={p.event} onClick={() => navigate(`/events/${p.event?.id}`)} pendingNote />
                          <div className="border-t border-border/50 px-4 py-2">
                            <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={() => setParticipation.mutate({ eventId: p.event.id, status: null }, { onSuccess: () => toast.success('Anfrage zurückgezogen') })} disabled={setParticipation.isPending}>
                              Zurückziehen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="my-events" className="mt-0 space-y-4">
              {!user ? (
                <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine Events zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
              ) : (myEventsLoading || rsvpsLoading) ? (
                <EventListSkeleton />
              ) : (
                (() => {
                  const now = Date.now();
                  const endedAt = (e: any) => new Date(e?.ends_at ?? new Date(new Date(e?.starts_at).getTime() + 6 * 3600 * 1000)).getTime();
                  const hosted = (myEvents ?? []).filter((e: any) => e);
                  const guestEvents = (myRSVPs ?? []).map((r: any) => r.event).filter(Boolean);

                  const anstehend = hosted.filter((e: any) => endedAt(e) >= now).sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
                  const zugesagt = guestEvents.filter((e: any) => endedAt(e) >= now).sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
                  const pastMap = new Map<string, any>();
                  [...hosted, ...guestEvents].filter((e: any) => endedAt(e) < now).forEach((e: any) => pastMap.set(e.id, e));
                  const vergangen = Array.from(pastMap.values()).sort((a: any, b: any) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

                  const list = myEventsView === 'zugesagt' ? zugesagt : myEventsView === 'anstehend' ? anstehend : vergangen;

                  if (hosted.length === 0 && guestEvents.length === 0) {
                    return <EmptyState title="Noch nichts hier" description="Erstelle ein Event oder sag bei einem zu." onAction={() => navigate('/events/create')} actionLabel="Event erstellen" />;
                  }

                  return (
                    <>
                      <div className="flex gap-2">
                        <button onClick={() => setMyEventsView('zugesagt')} className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition', myEventsView === 'zugesagt' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground')}>
                          Zugesagt ({zugesagt.length})
                        </button>
                        <button onClick={() => setMyEventsView('anstehend')} className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition', myEventsView === 'anstehend' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground')}>
                          Anstehend ({anstehend.length})
                        </button>
                        <button onClick={() => setMyEventsView('vergangen')} className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition', myEventsView === 'vergangen' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground')}>
                          Vergangen ({vergangen.length})
                        </button>
                      </div>
                      {list.length === 0 ? (
                        <EmptyState
                          title={myEventsView === 'zugesagt' ? 'Keine Zusagen' : myEventsView === 'anstehend' ? 'Keine anstehenden Events' : 'Keine vergangenen Events'}
                          description={myEventsView === 'zugesagt' ? 'Sobald ein Host dich bestätigt, erscheint das Event hier.' : myEventsView === 'anstehend' ? 'Erstelle dein nächstes Event.' : 'Deine vergangenen Events erscheinen hier.'}
                          onAction={myEventsView === 'anstehend' ? () => navigate('/events/create') : myEventsView === 'zugesagt' ? () => setActiveTab('discover') : undefined}
                          actionLabel={myEventsView === 'anstehend' ? 'Event erstellen' : myEventsView === 'zugesagt' ? 'Events entdecken' : undefined}
                        />
                      ) : (
                        list.map((event: any) => (
                          <EventListCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
                        ))
                      )}
                    </>
                  );
                })()
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}

/* ---------- Subcomponents ---------- */

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-3 min-w-min">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-2xl px-5 py-3 text-sm font-medium transition whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/60 text-foreground/80 hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      {icon}
      {title}
    </div>
  );
}

const categoryEmojis: Record<string, string> = { club: '🎧', house_party: '🏠', bar: '🍸', festival: '🎪', concert: '🎤', other: '✨' };

function EventListCard({ event, onClick, pendingNote = false }: { event: any; onClick: () => void; pendingNote?: boolean }) {
  if (!event) return null;
  const starts = new Date(event.starts_at);
  const dateLabel = isToday(starts)
    ? `Heute, ${format(starts, 'd. MMM', { locale: de })}`
    : isTomorrow(starts)
    ? `Morgen, ${format(starts, 'd. MMM', { locale: de })}`
    : format(starts, 'EEE, d. MMM', { locale: de });

  const genres: string[] = (event.music_genres ?? event.genres ?? []) as string[];
  const firstGenre = genres?.[0];

  return (
    <article
      onClick={onClick}
      data-testid="event-card"
      className="cursor-pointer overflow-hidden rounded-2xl bg-card border border-border/60 transition hover:border-primary/40"
    >
      <div className="relative aspect-[16/9] bg-muted">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-5xl">{categoryEmojis[event.category] || '🎉'}</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2.5">
        <h3 className="font-display text-lg font-bold text-foreground line-clamp-1">{event.name}</h3>
        {pendingNote && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Hourglass weight="regular" className="h-3 w-3 animate-pulse" /> Ausstehend — warte auf Bestätigung
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin weight="regular" className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{event.location_name || event.city || 'Unbekannt'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarBlank weight="regular" className="h-4 w-4 shrink-0" />
          <span>{dateLabel}</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <Clock weight="regular" className="h-4 w-4" />
            {format(starts, 'HH:mm')}
          </span>
          <span className="flex items-center gap-1.5">
            <CurrencyEur weight="regular" className="h-4 w-4" />
            {event.is_free ? 'Frei' : `€${event.entry_price ?? '–'}`}
          </span>
          {firstGenre && (
            <span className="flex items-center gap-1.5">
              <MusicNote weight="regular" className="h-4 w-4" />
              {firstGenre}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function EventListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border/60">
          <Skeleton className="aspect-[16/9] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps { title: string; description: string; onAction?: () => void; actionLabel?: string; }

function EmptyState({ title, description, onAction, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/60">
        <Confetti weight="regular" className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">{description}</p>
      {onAction && actionLabel && <Button onClick={onAction} variant="outline">{actionLabel}</Button>}
    </div>
  );
}
