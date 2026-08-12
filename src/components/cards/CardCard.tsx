import { cn } from '@/lib/utils';
import { CARD_CATEGORY_LABELS, CARD_CATEGORY_STYLES, type CardCategory } from '@/lib/cards';
import { Check } from '@phosphor-icons/react';

interface CardCardProps {
  prompt: string;
  category: CardCategory;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const CardCard = ({ prompt, category, selected, onClick, compact }: CardCardProps) => {
  const styles = CARD_CATEGORY_STYLES[category] ?? CARD_CATEGORY_STYLES.normal;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={selected}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all',
        'min-h-[112px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        onClick && 'cursor-pointer hover:border-primary/40 active:scale-[0.99]',
        selected && 'border-primary ring-1 ring-primary',
        compact && 'min-h-[88px] p-3',
      )}
    >
      <span className={cn('absolute left-0 top-0 h-full w-1', styles.bar)} aria-hidden />

      <div className="flex items-center justify-between gap-2 pl-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', styles.badge)}>
          {CARD_CATEGORY_LABELS[category] ?? category}
        </span>
        {selected && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check weight="bold" className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <p
        className={cn(
          'mt-3 pl-2 font-medium leading-snug text-foreground',
          compact ? 'text-sm' : 'text-[15px]',
        )}
      >
        {prompt}
      </p>
    </button>
  );
};
