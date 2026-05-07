import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Step {
  selector: string;
  path: string;
  icon: string;
  headline: string;
  body: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-testid="nav-feed"]',
    path: '/',
    icon: '⚡',
    headline: 'Dein Abend. In Echtzeit.',
    body: 'Sieh live was gerade passiert — Posts, Hotspots und Events direkt aus deiner Stadt.',
  },
  {
    selector: '[data-testid="nav-map"]',
    path: '/discover',
    icon: '🗺️',
    headline: 'Finde wo was los ist.',
    body: 'Die Stadtkarte zeigt dir live welche Venues brennen — und welche schlafen.',
  },
  {
    selector: '[data-testid="create-post-btn"]',
    path: '',
    icon: '🎉',
    headline: 'Zeig wo du feierst.',
    body: 'Poste deinen Moment. Deine Freunde sehen live wo der Abend startet.',
  },
  {
    selector: '[data-testid="nav-profile"]',
    path: '/profile',
    icon: '✨',
    headline: 'Dein Nightlife-Profil.',
    body: 'Badges, Punkte und deine Abende — alles an einem Ort.',
  },
];

const STORAGE_KEY = 'feyrn_onboarding_complete';

export default function OnboardingOverlay() {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    const t = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Find current step's element; retry until DOM mounts after route change
  useLayoutEffect(() => {
    if (!active) return;
    let cancelled = false;
    let attempts = 0;

    const measure = () => {
      if (cancelled) return false;
      const el = document.querySelector(STEPS[step].selector) as HTMLElement | null;
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
    const retry = setInterval(() => {
      attempts++;
      if (measure() || attempts > 30) clearInterval(retry);
    }, 100);

    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      cancelled = true;
      clearInterval(retry);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [active, step]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
    setActive(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) { finish(); return; }
    const nextStep = step + 1;
    const target = STEPS[nextStep];
    setRect(null);
    setStep(nextStep);
    if (target.path) navigate(target.path);
  };

  if (!active) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Spotlight rectangle (with padding)
  const PAD = 10;
  const sx = rect ? rect.left - PAD : 0;
  const sy = rect ? rect.top - PAD : 0;
  const sw = rect ? rect.width + PAD * 2 : 0;
  const sh = rect ? rect.height + PAD * 2 : 0;
  const radius = 18;

  // Tooltip placement: above target if target in lower half, else below
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const placeAbove = rect ? rect.top > vh / 2 : true;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: 16,
    right: 16,
    maxWidth: 420,
    margin: '0 auto',
    zIndex: 10001,
    padding: 22,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    color: '#fff',
    fontFamily: 'inherit',
    animation: 'feyrnTipIn 300ms ease-out both',
  };

  if (rect) {
    if (placeAbove) tooltipStyle.bottom = vh - sy + 16;
    else tooltipStyle.top = sy + sh + 16;
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.transform = 'translateY(-50%)';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Dim + blur backdrop with SVG mask cutout for spotlight */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'fixed',
          inset: 0,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <defs>
          <mask id="feyrn-spot-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect x={sx} y={sy} width={sw} height={sh} rx={radius} ry={radius} fill="black" />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#feyrn-spot-mask)"
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
            stroke="#7C3AED"
            strokeWidth={2}
            style={{ animation: 'feyrnSpotPulse 2s ease-in-out infinite' }}
          />
        )}
      </svg>

      {/* Skip top-right */}
      <button
        onClick={finish}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top) + 14px)',
          right: 16,
          zIndex: 10002,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          padding: '6px 10px',
        }}
      >
        Überspringen
      </button>

      {/* Tooltip card */}
      <div style={tooltipStyle} key={step}>
        <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 12 }}>{current.icon}</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.25,
            margin: 0,
            background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
          }}
        >
          {current.headline}
        </h2>
        <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.5 }}>
          {current.body}
        </p>

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === step ? 22 : 8,
                  height: 8,
                  borderRadius: 999,
                  background:
                    i === step
                      ? 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)'
                      : 'rgba(255,255,255,0.2)',
                  transition: 'width 250ms ease',
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            style={{
              padding: '10px 20px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.35)',
            }}
          >
            {isLast ? 'Feyrn starten →' : 'Weiter →'}
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {step + 1} / {STEPS.length}
        </div>
      </div>

      <style>{`
        @keyframes feyrnTipIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes feyrnSpotPulse {
          0%, 100% { stroke-opacity: 0.6; filter: drop-shadow(0 0 6px rgba(124,58,237,0.5)); }
          50% { stroke-opacity: 1; filter: drop-shadow(0 0 14px rgba(124,58,237,0.9)); }
        }
      `}</style>
    </div>
  );
}
