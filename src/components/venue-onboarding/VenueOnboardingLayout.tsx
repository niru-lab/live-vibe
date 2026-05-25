import { ArrowLeft } from '@phosphor-icons/react';
import { ReactNode } from 'react';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  canProceed: boolean;
  saving?: boolean;
  isFinal?: boolean;
  ctaLabel?: string;
  onNext: () => void;
  onBack?: () => void;
  children: ReactNode;
}

export default function VenueOnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  canProceed,
  saving,
  isFinal,
  ctaLabel = 'Weiter',
  onNext,
  onBack,
  children,
}: Props) {
  const pct = Math.min(100, (step / totalSteps) * 100);
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: '#0A0A0F', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <button
            onClick={onBack}
            disabled={!onBack || step === 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-30"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)' }}
            aria-label="Zurück"
          >
            <ArrowLeft size={18} color="#fff" />
          </button>
          <div className="flex-1" style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
                transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 12px rgba(236, 72, 153, 0.4)',
              }}
            />
          </div>
          <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-32">
        <div
          style={{
            background: '#12121A',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            backdropFilter: 'blur(12px)',
            padding: 18,
          }}
        >
          <h1 className="mb-1" style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {title}
          </h1>
          <p className="mb-5" style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
            {subtitle}
          </p>
          {children}
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 px-5 pb-6 pt-3"
        style={{ background: 'linear-gradient(to top, #0A0A0F 60%, rgba(10,10,15,0))' }}
      >
        <button
          onClick={onNext}
          disabled={!canProceed || saving}
          className="w-full text-white font-semibold transition-all disabled:opacity-30"
          style={{
            height: 54,
            borderRadius: 9999,
            background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
            fontSize: 16,
            boxShadow: canProceed ? '0 8px 24px rgba(124, 58, 237, 0.35)' : 'none',
            animation: isFinal && canProceed ? 'feyrnVenuePulse 1.6s ease-in-out infinite' : undefined,
          }}
        >
          {saving ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            ctaLabel
          )}
        </button>
      </div>

      <style>{`
        @keyframes feyrnVenuePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(124,58,237,0.35); }
          50% { transform: scale(1.02); box-shadow: 0 12px 32px rgba(236,72,153,0.55); }
        }
      `}</style>
    </div>
  );
}
