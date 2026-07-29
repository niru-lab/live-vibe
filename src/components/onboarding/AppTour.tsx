import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Role = 'guest' | 'venue_owner';

interface TourStep {
  /** DOM selector to spotlight — omit for a centered welcome card */
  selector?: string;
  /** route to navigate to before showing this step */
  path?: string;
  icon: string;
  headline: string;
  body: string;
  emphasis?: boolean;
}

const GUEST_STEPS: TourStep[] = [
  {
    icon: '⚡',
    headline: 'Willkommen bei Feyrn.',
    body: 'Dein Nightlife in Echtzeit — sieh wo heute was geht, folge dem Vibe und zeig deine Nacht.',
  },
  {
    selector: '[data-testid="nav-feed"]',
    path: '/feed',
    icon: '🔥',
    headline: 'Der Feed zeigt das Jetzt.',
    body: 'Live-Posts aus deiner Stadt: welche Spots brennen und wo deine Leute gerade sind.',
  },
  {
    selector: '[data-testid="create-post-btn"]',
    icon: '🎉',
    headline: 'Zeig wo du feierst.',
    body: 'Ein Tap, ein Moment — deine Freunde sehen sofort, wo dein Abend startet.',
    emphasis: true,
  },
  {
    selector: '[data-testid="nav-map"]',
    path: '/discover',
    icon: '🗺️',
    headline: 'Entdecke Spots & Events.',
    body: 'Karte, Trends und Events — finde neue Läden bevor alle anderen davon reden.',
  },
  {
    selector: '[data-testid="nav-profile"]',
    path: '/profile',
    icon: '✨',
    headline: 'Dein Nightlife-Profil.',
    body: 'Badges, Punkte und deine Abende — deine Identität in der Szene.',
  },
];

const VENUE_STEPS: TourStep[] = [
  {
    icon: '🏛️',
    headline: 'Willkommen bei Feyrn Business.',
    body: 'Zeig deinen Laden dort, wo Gäste ihren Abend planen — live und lokal.',
  },
  {
    selector: '[data-testid="nav-events"]',
    path: '/events',
    icon: '📅',
    headline: 'Deine Event-Zentrale.',
    body: 'Hier verwaltest du deine Events, siehst Zusagen und behältst deine Präsenz im Blick.',
  },
  {
    selector: '[data-testid="create-post-btn"]',
    icon: '🚀',
    headline: 'Erstelle dein erstes Event.',
    body: 'Das wichtigste To-do: Event anlegen — so tauchst du bei Gästen im Feed und auf der Karte auf.',
    emphasis: true,
  },
  {
    selector: '[data-testid="nav-map"]',
    path: '/discover',
    icon: '🗺️',
    headline: 'So finden dich Gäste.',
    body: 'Auf Discover suchen Leute nach Spots und Events in ihrer Nähe — je aktiver du bist, desto sichtbarer.',
  },
  {
    selector: '[data-testid="nav-profile"]',
    path: '/profile',
    icon: '💎',
    headline: 'Dein Venue-Profil.',
    body: 'Name, Zeiten, Angebote — dein Auftritt für alle Gäste. Halt ihn aktuell.',
  },
];

const SESSION_DISMISS_KEY = 'feyrn_app_tour_dismissed_session';

export default function AppTour() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const bootedFor = useRef<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Boot: decide once per signed-in user whether the tour should run
  useEffect(() => {
    if (loading || !user) return;
    if (bootedFor.current === user.id) return;
    bootedFor.current = user.id;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role, onboarding_complete, app_tour_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      if (!data.onboarding_complete) return;
      if (data.app_tour_completed_at) return;
      // Isolated, non-authoritative guard against re-mount flicker within a session
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === user.id) return;

      setRole(data.role === 'venue_owner' ? 'venue_owner' : 'guest');
      setStep(0);
      setTimeout(() => {
        if (!cancelled) setActive(true);
      }, 400);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const steps = role === 'venue_owner' ? VENUE_STEPS : GUEST_STEPS;
  const current = steps[step];

  // Measure spotlight target; degrade gracefully to a centered card if missing
  useLayoutEffect(() => {
    if (!active || !current) return;
    if (!current.selector) {
      setRect(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const measure = () => {
      if (cancelled) return false;
      const el = document.querySelector(current.selector!) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect(r);
          return true;
        }
      }
      return false;
    };

    measure();
    const retry = window.setInterval(() => {
      attempts++;
      if (measure() || attempts > 25) window.clearInterval(retry);
    }, 100);

    const onReflow = () => measure();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      cancelled = true;
      window.clearInterval(retry);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [active, step, current]);

  useEffect(() => {
    if (active) cardRef.current?.focus();
  }, [active, step]);

  const persistHandled = useCallback(async () => {
    if (!user) return;
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, user.id);
    } catch {
      /* noop */
    }
    await supabase
      .from('profiles')
      .update({ app_tour_completed_at: new Date().toISOString() })
      .eq('user_id', user.id);
  }, [user]);

  const finish = useCallback(
    (navigateHome: boolean) => {
      setActive(false);
      setRect(null);
      void persistHandled();
      if (navigateHome) {
        navigate(role === 'venue_owner' ? '/events' : '/feed', { replace: true });
      }
    },
    [navigate, persistHandled, role],
  );

  const goTo = useCallback(
    (index: number) => {
      const target = steps[index];
      if (!target) return;
      setRect(null);
      setStep(index);
      if (target.path && target.path !== location.pathname) navigate(target.path);
    },
    [location.pathname, navigate, steps],
  );

  const next = () => (step >= steps.length - 1 ? finish(true) : goTo(step + 1));
  const back = () => step > 0 && goTo(step - 1);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish]);

  if (!active || !current) return null;

  const PAD = current.emphasis ? 14 : 10;
  const sx = rect ? rect.left - PAD : 0;
  const sy = rect ? rect.top - PAD : 0;
  const sw = rect ? rect.width + PAD * 2 : 0;
  const sh = rect ? rect.height + PAD * 2 : 0;
  const radius = 18;

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const placeAbove = rect ? rect.top > vh / 2 : true;
  const isLast = step === steps.length - 1;

  const cardPosition: React.CSSProperties = rect
    ? placeAbove
      ? { bottom: vh - sy + 16 }
      : { top: sy + sh + 16 }
    : { top: '50%', transform: 'translateY(-50%)' };

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label="App-Tour">
      <svg
        width="100%"
        height="100%"
        className="pointer-events-none fixed inset-0 backdrop-blur-[4px]"
      >
        <defs>
          <mask id="feyrn-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && <rect x={sx} y={sy} width={sw} height={sh} rx={radius} ry={radius} fill="black" />}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#feyrn-tour-mask)"
        />
        {rect && (
          <rect
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            rx={radius}
            ry={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={current.emphasis ? 3 : 2}
            style={{ animation: 'feyrnSpotPulse 2s ease-in-out infinite' }}
          />
        )}
      </svg>

      <button
        onClick={() => finish(false)}
        className="fixed right-4 z-[10002] rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        style={{ top: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        Überspringen
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          ref={cardRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="glass-pill fixed left-4 right-4 z-[10001] mx-auto max-w-[420px] rounded-3xl border border-white/10 bg-white/5 p-5 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.5)] outline-none backdrop-blur-xl"
          style={cardPosition}
        >
          <div className="mb-3 text-3xl leading-none">{current.icon}</div>
          <h2 className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-xl font-bold leading-tight tracking-tight text-transparent">
            {current.headline}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{current.body}</p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={
                    i === step
                      ? 'h-2 w-5 rounded-full bg-gradient-to-r from-primary to-pink-500 transition-all'
                      : 'h-2 w-2 rounded-full bg-white/20 transition-all'
                  }
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={back}
                  className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Zurück
                </button>
              )}
              <button
                onClick={next}
                className="rounded-full bg-gradient-to-r from-primary to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(236,72,153,0.35)] transition-transform active:scale-95"
              >
                {isLast ? (role === 'venue_owner' ? 'Los geht’s →' : 'Feyrn starten →') : 'Weiter →'}
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground/60">
            {step + 1} / {steps.length}
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes feyrnSpotPulse {
          0%, 100% { stroke-opacity: 0.6; filter: drop-shadow(0 0 6px hsl(var(--primary) / 0.5)); }
          50% { stroke-opacity: 1; filter: drop-shadow(0 0 16px hsl(var(--primary) / 0.9)); }
        }
      `}</style>
    </div>
  );
}
