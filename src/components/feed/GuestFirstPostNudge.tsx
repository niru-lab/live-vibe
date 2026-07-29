import { motion } from 'framer-motion';
import { Confetti, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface GuestFirstPostNudgeProps {
  onStart: () => void;
  onExplore: () => void;
}

export const GuestFirstPostNudge = ({ onStart, onExplore }: GuestFirstPostNudgeProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center px-2 py-14 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30"
      >
        <Confetti weight="fill" className="h-9 w-9 text-primary" />
      </motion.div>

      <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground">
        Du wirst den Spot setzen 🎉
      </h1>
      <p className="mb-7 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Ein Foto, ein Tap — und deine Leute sehen, wo dein Abend läuft. Dein erster Post bringt dich
        auf die Karte.
      </p>

      <Button
        onClick={onStart}
        size="lg"
        className="h-12 w-full max-w-xs gap-2 rounded-full text-base font-semibold shadow-[0_8px_28px_hsl(var(--primary)/0.35)]"
      >
        <Sparkle weight="fill" className="h-5 w-5" />
        Los geht’s!
      </Button>

      <button
        type="button"
        onClick={onExplore}
        className="mt-3 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Erst mal umsehen
      </button>
    </motion.section>
  );
};
