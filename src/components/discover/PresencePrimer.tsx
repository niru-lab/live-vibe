import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface PresencePrimerProps {
  open: boolean;
  onDecide: (granted: boolean) => void;
}

/** Asked once on Discover: count me anonymously when I'm at a live event. */
export const PresencePrimer = ({ open, onDecide }: PresencePrimerProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        role="dialog"
        aria-label="Vor Ort mitzählen"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="absolute inset-x-3 top-3 z-20 mx-auto max-w-md rounded-3xl border border-border/50 bg-card/90 p-4 backdrop-blur-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full glass-pill">
            <MapPin weight="fill" className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Zeigen, wo wirklich was los ist?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bist du bei einem Event, wird sein Kreis größer. Anonym, nur wenn die App offen ist – niemand sieht, dass du es bist.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 rounded-full" onClick={() => onDecide(true)}>Mitzählen</Button>
          <Button size="sm" variant="ghost" className="flex-1 rounded-full text-muted-foreground" onClick={() => onDecide(false)}>Nicht jetzt</Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
