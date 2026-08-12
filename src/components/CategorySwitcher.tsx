/**
 * Feyrn Cards — category stack switcher (presentational).
 * Segments are rendered only for categories that exist in the user's own set.
 */
import type { CardCategory } from '@/lib/cards';

export type DeckCategory = 'all' | CardCategory;

const LABELS: Record<DeckCategory, string> = {
  all: 'Alle',
  normal: 'Normal',
  deep: 'Deep',
  flirty: 'Flirty',
};

/** Active surface per category — light default, dark override. */
const ACTIVE: Record<DeckCategory, string> = {
  all: 'bg-[#E8D5C4] text-[#1A1208] dark:bg-[#2A2A35] dark:text-white',
  normal: 'bg-[#FF5C00] text-white dark:bg-[#7C3AED]',
  deep: 'bg-[#FF7A2E] text-white dark:bg-[#3B82F6]',
  flirty: 'bg-[#FF9F5C] text-white dark:bg-[#EC4899]',
};

const INACTIVE = 'bg-[#F5EBE2] text-[#8A7460] dark:bg-[#16161E] dark:text-[#8A8A95]';

interface CategorySwitcherProps {
  available: DeckCategory[];
  value: DeckCategory;
  onChange: (next: DeckCategory) => void;
}

export const CategorySwitcher = ({ available, value, onChange }: CategorySwitcherProps) => {
  if (available.length <= 1) return null;

  return (
    <div role="tablist" aria-label="Kartenkategorie" className="mb-[14px] flex gap-[6px]">
      {available.map((cat) => {
        const active = cat === value;
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(cat)}
            className="flex min-h-[44px] flex-1 items-center bg-transparent"
          >
            <span
              className={`flex h-[34px] w-full items-center justify-center rounded-[9px] text-[12px] ${
                active ? `${ACTIVE[cat]} font-medium` : `${INACTIVE} font-normal`
              }`}
            >
              {LABELS[cat]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
