import { ArrowRight } from '@phosphor-icons/react';

interface EventsPromoCardProps {
  title: string;
  subtitle: string;
  onClick: () => void;
  testId?: string;
}

/** Soft peach banner with confetti at the end of an event list ("Noch mehr Events? Entdecke die Karte!"). */
export const EventsPromoCard = ({ title, subtitle, onClick, testId }: EventsPromoCardProps) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    className="flex w-full items-center gap-4 rounded-3xl bg-[#FBEBDD] p-4 text-left transition active:scale-[0.99] dark:bg-primary/15"
  >
    <span className="flex h-14 w-14 shrink-0 items-center justify-center text-4xl" aria-hidden>🎉</span>
    <span className="min-w-0 flex-1">
      <span className="block font-bold text-foreground">{title}</span>
      <span className="block text-sm text-muted-foreground">{subtitle}</span>
    </span>
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <ArrowRight weight="bold" className="h-5 w-5" />
    </span>
  </button>
);
