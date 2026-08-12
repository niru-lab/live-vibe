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

/** active background / active text, dark + light. */
const ACTIVE: Record<DeckCategory, string> = {
  all: 'bg-[#2A2A35] text-white dark:bg-[#2A2A35] dark:text-white',
  normal: 'bg-[#7C3AED] text-white',
  deep: 'bg-[#3B82F6] text-white',
  flirty: 'bg-[#EC4899] text-white',
};

const INACTIVE = 'bg-[#16161E] text-[#8A8A95]';

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
            className={`flex min-h-[44px] flex-1 items-center justify-center py-[5px] text-[12px] ${
              active ? `${ACTIVE[cat]} font-medium` : `${INACTIVE} font-normal`
            } rounded-[9px] bg-clip-padding`}
            style={{
              // 34px visual height with a 44px touch target via transparent vertical padding
              backgroundClip: 'content-box',
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              height: 44,
            }}
          >
            {LABELS[cat]}
          </button>
        );
      })}
    </div>
  );
};
