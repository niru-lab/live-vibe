import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from '@phosphor-icons/react';

export type LocationPromptVariant = 'start' | 'reminder' | 'post';

const COPY: Record<LocationPromptVariant, { title: string; body: string; accept: string; decline: string }> = {
  start: {
    title: 'Zeig, wo wirklich was los ist 📍',
    body: 'Bist du bei einem Event, wird sein Kreis auf der Karte größer. Anonym – wir speichern keine Koordinaten, nur die Anzahl, und erst ab 3 Leuten. Nur wenn die App offen ist. Jederzeit im Profil abschaltbar.',
    accept: 'Standort erlauben',
    decline: 'Nicht jetzt',
  },
  reminder: {
    title: 'Bist du unterwegs? 🌙',
    body: 'Aktiviere deinen Standort und sieh live, wo gerade was los ist. Anonym, nur wenn die App offen ist.',
    accept: 'Standort aktivieren',
    decline: 'Nicht jetzt',
  },
  post: {
    title: 'Als „Vor Ort“ posten? 📍',
    body: 'Mit Standort zählt dein Post als „Vor Ort“ und lässt den Spot auf der Karte heller leuchten. Ohne Standort wird er ganz normal geteilt.',
    accept: 'Standort aktivieren',
    decline: 'Ohne Standort posten',
  },
};

interface LocationPromptSheetProps {
  open: boolean;
  variant: LocationPromptVariant;
  busy?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/** Bottom sheet explaining the location opt-in. The OS prompt only appears after "accept". */
export const LocationPromptSheet = ({ open, variant, busy, onAccept, onDecline }: LocationPromptSheetProps) => {
  const copy = COPY[variant];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          data-testid={`location-prompt-${variant}`}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            className="w-full max-w-md rounded-3xl border border-border/50 bg-card/90 p-6 text-center backdrop-blur-xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full glass-pill">
              <MapPin weight="fill" className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{copy.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
            <button
              onClick={onAccept}
              disabled={busy}
              data-testid="location-prompt-accept"
              className="mt-6 w-full rounded-full py-3.5 font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }}
            >
              {copy.accept}
            </button>
            <button
              onClick={onDecline}
              disabled={busy}
              data-testid="location-prompt-decline"
              className="mt-2 w-full py-2 text-sm text-muted-foreground disabled:opacity-60"
            >
              {copy.decline}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
