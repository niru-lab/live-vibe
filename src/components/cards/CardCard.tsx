import { cn } from '@/lib/utils';
import { CARD_CATEGORY_STYLES, type CardCategory } from '@/lib/cards';
import { Check } from '@phosphor-icons/react';

interface CardCardProps {
  prompt: string;
  category: CardCategory;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

/** UNO-style playing card: colored frame, tilted white oval, centered prompt. */
export const CardCard = ({ prompt, category, selected, onClick, compact }: CardCardProps) => {
  const styles = CARD_CATEGORY_STYLES[category] ?? CARD_CATEGORY_STYLES.normal;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={selected}
      className={cn(
        'group relative aspect-[3/4] w-full overflow-hidden rounded-[22px] p-2 transition-all',
        'border border-border/60 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        styles.bar,
        onClick && 'cursor-pointer active:scale-[0.98]',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      {/* inner white deck face, rotated like an UNO oval */}
      <span
        aria-hidden
        className="absolute inset-[10%] rotate-[-18deg] rounded-[50%] bg-background/95 shadow-inner"
      />

      <span
        aria-hidden
        className={cn(
          'absolute left-3 top-2 text-[13px] font-black text-primary-foreground/90',
          compact && 'text-[11px]',
        )}
      >
        F
      </span>
      <span
        aria-hidden
        className={cn(
          'absolute bottom-2 right-3 rotate-180 text-[13px] font-black text-primary-foreground/90',
          compact && 'text-[11px]',
        )}
      >
        F
      </span>

      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background text-primary shadow">
          <Check weight="bold" className="h-3.5 w-3.5" />
        </span>
      )}

      <span className="relative z-10 flex h-full w-full items-center justify-center px-4">
        <span
          className={cn(
            'line-clamp-6 text-center font-semibold leading-snug text-foreground',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {prompt}
        </span>
      </span>
    </button>
  );
};
