import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowClockwise,
  ArrowLeft,
  CalendarStar,
  ChartLineUp,
  Eye,
  HandWaving,
  Heart,
  Plus,
  UsersThree,
} from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { useVenueAnalytics } from '@/hooks/useVenueAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { VenueFirstEventNudge } from '@/components/events/VenueFirstEventNudge';
import { VenueOffersSection } from '@/components/offers/VenueOffersSection';

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

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'gerade eben';
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} Tg.`;
};

export default function VenueDashboard() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data, isLoading, isRefetching, refetch } = useVenueAnalytics();

  const isVenue = profile?.role === 'venue_owner';

  useEffect(() => {
    if (!profileLoading && profile && !isVenue) {
      navigate('/feed', { replace: true });
    }
  }, [profileLoading, profile, isVenue, navigate]);

  if (isLoading || !data) {
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

  if (!isVenue) return null;

  const { totals, trend, events, recent } = data;

  if (totals.events === 0) {
    return (
      <AppLayout>
        <div className="fixed inset-0 bg-background -z-10" />
        <VenueFirstEventNudge
          onCreate={() => navigate('/events/create?first=1')}
          onExplore={() => navigate('/events')}
        />
      </AppLayout>
    );
  }

  const trendLabel =
    trend.changePct === null
      ? trend.last7 > 0
        ? 'Erste Aktivität in dieser Woche'
        : 'Noch keine Aktivität diese Woche'
      : `${trend.changePct >= 0 ? '+' : ''}${trend.changePct}% vs. Vorwoche`;

  const nextStep =
    totals.upcoming === 0
      ? { text: 'Lege dein nächstes Event an, damit Gäste dich wiederfinden.', cta: 'Event erstellen', to: '/events/create' }
      : totals.going + totals.interested === 0
        ? { text: 'Teile dein Event, um die ersten Zusagen zu bekommen.', cta: 'Event ansehen', to: `/events/${events[0]?.id ?? ''}` }
        : { text: 'Läuft. Halte Details aktuell und poste vor dem Event.', cta: 'Event ansehen', to: `/events/${events[0]?.id ?? ''}` };

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
          <p className="text-sm text-muted-foreground">{trendLabel}</p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <KpiCard icon={Eye} label="Reichweite" value={totals.reach} hint="Alle erfassten Interaktionen mit deinen Events" />
          <KpiCard icon={UsersThree} label="Zusagen" value={totals.going} hint={`${totals.interested} interessiert`} />
          <KpiCard icon={HandWaving} label="Anfragen" value={totals.requests} hint="Gäste, die dabei sein wollen" />
          <KpiCard icon={Heart} label="Engagement" value={totals.engagement} hint={`${totals.posts} Posts zu deinen Events`} />
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
          <p className="mb-1 text-xs text-muted-foreground">Diese Woche</p>
          <p className="text-sm text-foreground">
            <span className="text-lg font-bold">{trend.last7}</span> Interaktionen
            <span className="text-muted-foreground"> (Vorwoche: {trend.prev7})</span>
          </p>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <p className="mb-3 text-sm text-foreground">{nextStep.text}</p>
          <Button size="sm" onClick={() => navigate(nextStep.to)}>
            {nextStep.cta}
          </Button>
        </section>

        <VenueOffersSection />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Events</h2>
          {events.map((e) => (
            <button
              key={e.id}
              onClick={() => navigate(`/events/${e.id}`)}
              className="w-full rounded-2xl border border-border/60 bg-card/70 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.startsAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                    {e.city ? ` · ${e.city}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">
                  {e.reach} Reichweite
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
                <span>{e.going} Zusagen</span>
                <span>{e.interested} interessiert</span>
                <span>{e.likes + e.comments} Engagement</span>
              </div>
            </button>
          ))}
        </section>

        {recent.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Letzte Aktivität</h2>
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                <span className="truncate text-xs text-foreground">{r.label}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{relative(r.at)}</span>
              </div>
            ))}
          </section>
        )}

        <Button variant="outline" className="w-full" onClick={() => navigate('/events/create')}>
          <Plus weight="bold" className="mr-2 h-4 w-4" />
          Neues Event
        </Button>
      </main>
    </AppLayout>
  );
}
