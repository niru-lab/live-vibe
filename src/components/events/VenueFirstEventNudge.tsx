import { motion } from 'framer-motion';
import { CalendarStar, Storefront, UsersThree, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface VenueFirstEventNudgeProps {
  onCreate: () => void;
  onExplore: () => void;
}

const BENEFITS = [
  { icon: Storefront, text: 'Dein Venue wird in Feed und Karte sichtbar' },
  { icon: UsersThree, text: 'Gäste können zusagen und dein Event teilen' },
  { icon: Sparkle, text: 'In unter 2 Minuten online — Details später ergänzbar' },
];

export const VenueFirstEventNudge = ({ onCreate, onExplore }: VenueFirstEventNudgeProps) => {
  return (
    <motion.section
      data-testid="venue-activation"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center px-5 py-12 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30"
      >
        <CalendarStar weight="fill" className="h-9 w-9 text-primary" />
      </motion.div>

      <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground">
        Dein erstes Event bringt dich auf die Karte
      </h1>
      <p className="mb-7 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Lege ein Event an — Name, Datum, Location reichen. Alles Weitere kannst du jederzeit
        nachtragen.
      </p>

      <ul className="mb-8 w-full max-w-xs space-y-3 text-left">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <Icon weight="regular" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">{text}</span>
          </li>
        ))}
      </ul>

      <Button
        data-testid="venue-activation-cta"
        onClick={onCreate}
        size="lg"
        className="h-12 w-full max-w-xs rounded-2xl text-base font-semibold"
      >
        Erstes Event erstellen
      </Button>
      <Button
        variant="ghost"
        onClick={onExplore}
        className="mt-2 w-full max-w-xs text-muted-foreground"
      >
        Erst umsehen
      </Button>
    </motion.section>
  );
};
