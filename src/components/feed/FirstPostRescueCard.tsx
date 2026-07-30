import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Compass, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { trackNudge } from '@/lib/nudgeConfig';

interface FirstPostRescueCardProps {
  onExplore: () => void;
  onDismiss: () => void;
}

export const FirstPostRescueCard = ({ onExplore, onDismiss }: FirstPostRescueCardProps) => {
  useEffect(() => {
    trackNudge('nudge_shown', 'first_post_rescue');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative mb-3 rounded-[18px] border border-border bg-card/70 p-4 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Hinweis schließen"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X weight="bold" className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <Heart weight="fill" className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Dein Post braucht noch ein bisschen Liebe ❤️
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Folg ein paar Spots und Leuten aus deiner Stadt — dann passiert auch bei dir mehr.
          </p>
        </div>
      </div>

      <Button onClick={onExplore} size="sm" className="mt-3 w-full gap-2 rounded-full font-semibold">
        <Compass weight="fill" className="h-4 w-4" />
        Spots in deiner Stadt entdecken
      </Button>
    </motion.div>
  );
};
