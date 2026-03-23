import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  canProceed: boolean;
  saving?: boolean;
  isOptional?: boolean;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  children: React.ReactNode;
  direction?: number;
}

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  canProceed,
  saving,
  isOptional,
  onNext,
  onBack,
  onSkip,
  children,
  direction = 1,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: '#08080f' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="w-16">
          {step > 1 && onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ border: '0.5px solid #2a2a3a' }}
            >
              <ArrowLeft size={18} color="#888" />
            </button>
          )}
        </div>
        <div />
        <div className="w-16 text-right">
          {isOptional && onSkip && (
            <button onClick={onSkip} className="text-xs" style={{ color: '#888' }}>
              Überspringen →
            </button>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 px-5 pt-4 pb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === step - 1 ? 24 : 8,
              background: i < step ? '#7F77DD' : i === step - 1 ? '#7F77DD' : '#2a2a3a',
              opacity: i < step - 1 ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <h1 className="mb-1 text-xl font-bold text-white">{title}</h1>
        <p className="mb-6 text-sm" style={{ color: '#888' }}>{subtitle}</p>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="flex items-center gap-3 px-6 pb-8 pt-4">
        <div className="flex-1" />
        <button
          onClick={onNext}
          disabled={!canProceed || saving}
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-opacity disabled:opacity-30"
          style={{ background: '#7F77DD', fontSize: 28 }}
        >
          {saving ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            '→'
          )}
        </button>
      </div>
    </div>
  );
}
