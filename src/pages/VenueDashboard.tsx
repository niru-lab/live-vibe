import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowClockwise,
  ArrowLeft,
  ChartLineUp,
  ChatCircle,
  Eye,
  HandWaving,
  Heart,
  MapPin,
  Plus,
  ShareNetwork,
  Storefront,
  UsersThree,
} from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { useProfile } from '@/hooks/useProfile';
import {
  RANGE_LABELS,
  useOwnedVenue,
  useVenueIntelligence,
  type AnalyticsRange,
  type VenueEventPerf,
} from '@/hooks/useVenueIntelligence';
import { resolveVenueInsight } from '@/lib/venueInsights';
import { VenueFirstEventNudge } from '@/components/events/VenueFirstEventNudge';
import { VenueOffersSection } from '@/components/offers/VenueOffersSection';
import { track } from '@/lib/analytics';

type Tab = 'overview' | 'events' | 'content' | 'offers';
type Sort = 'upcoming' | 'newest' | 'rsvp' | 'engagement';

const KpiCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
      <Icon weight="regular" className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    {hint && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
  </div>
);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const eventStatus = (e: VenueEventPerf) => {
  const now = Date.now();
  const start = new Date(e.starts_at).getTime();
  const end = e.ends_at ? new Date(e.ends_at).getTime() : start + 6 * 3600000;
  if (now >= start && now < end) return 'Live';
  if (now < start) return 'Kommend';
  return 'Vorbei';
};

export default function VenueDashboard() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isVenue = profile?.role === 'venue_owner';

  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [tab, setTab] = useState<Tab>('overview');
  const [sort, setSort] = useState<Sort>('upcoming');

  const { overview, events, content, isLoading, isRefetching, refetch } = useVenueIntelligence(range);
  const { data: ownedVenue } = useOwnedVenue();

  useEffect(() => {
    if (profileLoading) return;
    if (!profile || !isVenue) navigate('/feed', { replace: true });
  }, [profileLoading, profile, isVenue, navigate]);

  useEffect(() => {
    if (isVenue) track('venue_dashboard_opened', { surface: 'venue_dashboard' });
  }, [isVenue]);

  const sortedEvents = useMemo(() => {
    const list = [...events];
    const now = Date.now();
    if (sort === 'upcoming') {
      return list.sort((a, b) => {
        const au = new Date(a.starts_at).getTime() >= now;
        const bu = new Date(b.starts_at).getTime() >= now;
        if (au !== bu) return au ? -1 : 1;
        return au
          ? new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
          : new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
      });
    }
    if (sort === 'newest') return list.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
    if (sort === 'rsvp') return list.sort((a, b) => b.going + b.interested - (a.going + a.interested));
    return list.sort((a, b) => b.likes + b.comments + b.posts - (a.likes + a.comments + a.posts));
  }, [events, sort]);

  const topEventId = sortedEvents[0]?.event_id;
  const insight = resolveVenueInsight(overview, topEventId);

  if (!isVenue) return null;

  if (isLoading || !overview) {
    return (
      <AppLayout>
        <div className="space-y-4 px-5 pt-10">
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }


  if (overview.total_events === 0) {
    return (
      <AppLayout>
        <div className="fixed inset-0 bg-background -z-10" />
        <VenueFirstEventNudge
          onCreate={() => {
            track('venue_create_event_clicked_from_dashboard', { surface: 'venue_dashboard' });
            navigate('/events/create?first=1');
          }}
          onExplore={() => navigate('/events')}
        />
      </AppLayout>
    );
  }

  const rsvpTotal = overview.going + overview.interested;
  const interactions = overview.post_likes + overview.post_comments;
  const showOffers = !!ownedVenue;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'events', label: 'Events' },
    { id: 'content', label: 'Content' },
    ...(showOffers ? [{ id: 'offers' as Tab, label: 'Angebote' }] : []),
  ];

  return (
    <AppLayout>
      <div className="fixed inset-0 bg-background -z-10" />

      <header className="px-5 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Zurück"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground"
            >
              <ArrowLeft weight="bold" className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
                <ChartLineUp weight="fill" className="h-4 w-4 text-primary" />
              </div>
              <FeyrnLogo size="sm" />
            </div>
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Aktualisieren"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground"
          >
            <ArrowClockwise weight="bold" className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="space-y-5 px-5 pb-28 pt-2">
        <section>
          <h1 className="text-xl font-bold text-foreground">Deine Performance</h1>
          <p className="text-sm text-muted-foreground">
            Zeitraum: {RANGE_LABELS[range]} · Werte werden beim Öffnen und per Aktualisieren geladen.
          </p>
        </section>

        <div className="flex gap-2" role="group" aria-label="Zeitraum">
          {(['7d', '30d', 'all'] as AnalyticsRange[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                track('venue_analytics_range_changed', { surface: 'venue_dashboard', range: r });
              }}
              aria-pressed={range === r}
              className={`rounded-full px-3 py-1.5 text-xs ${
                range === r ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'events') track('venue_event_performance_opened', { surface: 'venue_dashboard' });
                if (t.id === 'content') track('venue_content_performance_opened', { surface: 'venue_dashboard' });
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                tab === t.id ? 'bg-foreground text-background' : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <section className="grid grid-cols-2 gap-3">
              <KpiCard icon={Eye} label="Event-Aufrufe" value={overview.event_views} hint="Geöffnete Event-Details (nicht entdoppelt)" />
              <KpiCard icon={UsersThree} label="Zusagen" value={overview.going} hint={`${overview.interested} interessiert · Absicht, keine Anwesenheit`} />
              <KpiCard icon={MapPin} label="Karten-Öffnungen" value={overview.map_opens} hint="Marker auf der Karte geöffnet" />
              <KpiCard icon={Storefront} label="Profil-Aufrufe" value={overview.venue_profile_views} hint="Aufrufe deines Venue-Profils" />
              <KpiCard icon={HandWaving} label="Anfragen" value={overview.requests} hint="Gäste, die dabei sein wollen" />
              <KpiCard icon={ShareNetwork} label="Shares" value={overview.shares} hint="Erfasste Teilen-Aktionen (keine Attribution)" />
              <KpiCard icon={Heart} label="Interaktionen" value={interactions} hint={`${overview.post_likes} Likes · ${overview.post_comments} Kommentare`} />
              <KpiCard icon={ChatCircle} label="Verknüpfte Posts" value={overview.linked_posts} hint={`${overview.linked_creators} Creator`} />
            </section>

            {!ownedVenue && (
              <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-sm text-foreground">Kein Venue-Profil verknüpft.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Event-Zahlen siehst du bereits. Karten- und Profil-Kennzahlen sowie Angebote erscheinen, sobald ein Venue-Profil besteht.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Social Cloud Effekt</h2>
              {overview.linked_posts === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Noch keine öffentlichen Posts zu deinen Events. Teile dein Event oder lade Gäste zum Posten ein.
                </p>
              ) : (
                <ul className="space-y-1 text-xs text-foreground">
                  <li>{overview.linked_posts} öffentliche Posts zu deinen Events/deinem Spot</li>
                  <li>{overview.linked_creators} Creator haben deinen Spot gezeigt</li>
                  <li>{interactions} Interaktionen auf diesen Posts</li>
                  <li className="text-muted-foreground">Kein Kausalzusammenhang zu Zusagen — nur gemessene Werte.</li>
                </ul>
              )}
            </section>

            {overview.venue_follows > 0 && (
              <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-sm text-foreground">
                  <span className="text-lg font-bold">{overview.venue_follows}</span> neue Follower im Zeitraum
                </p>
              </section>
            )}

            {insight && (
              <section className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <p className="mb-3 text-sm text-foreground">{insight.text}</p>
                <Button
                  size="sm"
                  onClick={() => {
                    track('venue_insight_clicked', { surface: 'venue_dashboard', reason: insight.id });
                    navigate(insight.to);
                  }}
                >
                  {insight.cta}
                </Button>
              </section>
            )}

            {rsvpTotal === 0 && overview.event_views === 0 && (
              <p className="text-xs text-muted-foreground">
                Noch wenig Signale. Sobald Gäste dein Event öffnen, zusagen oder posten, erscheinen hier Zahlen.
              </p>
            )}
          </>
        )}

        {tab === 'events' && (
          <section className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                ['upcoming', 'Kommend'],
                ['newest', 'Neueste'],
                ['rsvp', 'Meiste Zusagen'],
                ['engagement', 'Meiste Interaktion'],
              ] as [Sort, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSort(id)}
                  aria-pressed={sort === id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] ${
                    sort === id ? 'bg-primary/20 text-primary' : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {sortedEvents.map((e) => (
              <button
                key={e.event_id}
                onClick={() => navigate(`/events/${e.event_id}`)}
                className="w-full rounded-2xl border border-border/60 bg-card/70 p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateLabel(e.starts_at)}
                      {e.city ? ` · ${e.city}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">
                    {eventStatus(e)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <span>{e.views} Aufrufe</span>
                  <span>{e.going} Zusagen</span>
                  <span>{e.interested} interessiert</span>
                  <span>{e.requests} Anfragen</span>
                  <span>{e.posts} Posts</span>
                  <span>{e.likes + e.comments} Interaktionen</span>
                  {e.shares > 0 && <span>{e.shares} Shares</span>}
                  {e.offer_activations > 0 && <span>{e.offer_activations} Angebot-Aktivierungen</span>}
                </div>
              </button>
            ))}
          </section>
        )}

        {tab === 'content' && (
          <section className="space-y-3">
            {content.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-sm text-foreground">Noch keine öffentlichen Posts zu deinen Events.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(topEventId ? `/events/${topEventId}` : '/events')}>
                  Event teilen
                </Button>
              </div>
            ) : (
              content.map((p) => (
                <div key={p.post_id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.media_type === 'video' ? (
                      <video src={p.media_url} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={p.media_url} alt="Post zu deinem Spot" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-foreground">
                      {p.event_name ? `Event: ${p.event_name}` : 'Venue-Post'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} ·{' '}
                      {p.likes} Likes · {p.comments} Kommentare
                      {p.views > 0 ? ` · ${p.views} Aufrufe` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'offers' && showOffers && <VenueOffersSection />}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            track('venue_create_event_clicked_from_dashboard', { surface: 'venue_dashboard' });
            navigate('/events/create');
          }}
        >
          <Plus weight="bold" className="mr-2 h-4 w-4" />
          Neues Event
        </Button>
      </main>
    </AppLayout>
  );
}
