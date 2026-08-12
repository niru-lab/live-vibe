/**
 * Feyrn Cards — presentational card surfaces (hero + peek).
 * Visual only: no data fetching, no mutations.
 */
import { CircleDashed, CircleCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardCategory } from '@/lib/cards';

/** Shared category token table — single source of truth for card colors. */
export const CARD_DECK_TOKENS: Record<
  CardCategory,
  { front: string; middle: string; back: string; accent: string; label: string }
> = {
  normal: { front: '#7C3AED', middle: '#33203F', back: '#241830', accent: '#7C3AED', label: 'NORMAL' },
  deep: { front: '#3B82F6', middle: '#1E2C44', back: '#162031', accent: '#3B82F6', label: 'DEEP' },
  flirty: { front: '#EC4899', middle: '#3F2032', back: '#2E1726', accent: '#EC4899', label: 'FLIRTY' },
};

export const DECK_ACCENT = '#EC4899';

const META = 'rgba(255,255,255,0.68)';

const pad = (n: number) => String(n).padStart(2, '0');

interface FeyrnCardProps {
  prompt: string;
  category: CardCategory;
  position: number;
  total: number;
  sent: boolean;
}

/** The front (interactive) face of the stacked hero deck. */
export const FeyrnCard = ({ prompt, category, position, total, sent }: FeyrnCardProps) => {
  const tokens = CARD_DECK_TOKENS[category] ?? CARD_DECK_TOKENS.normal;
  const long = prompt.length > 90;

  return (
    <div
      role="group"
      aria-label={`${tokens.label}, Karte ${pad(position)} von ${total}, ${sent ? 'gesendet' : 'noch nicht gesendet'}`}
      className="flex min-h-[226px] flex-col justify-between rounded-[18px] p-4"
      style={{ backgroundColor: tokens.front }}
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded-[20px] px-[9px] py-1 text-[10px] font-semibold text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.16)', letterSpacing: '0.08em' }}
        >
          {tokens.label}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: META }}>
          {pad(position)} / {total}
        </span>
      </div>

      <p
        className="pr-2 font-medium text-white"
        style={{ fontSize: long ? '1.125rem' : '1.3125rem', lineHeight: 1.32 }}
      >
        {prompt}
      </p>

      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: META }}>
        {sent ? <CircleCheck size={13} /> : <CircleDashed size={13} />}
        {sent ? 'Gesendet' : 'Noch nicht gesendet'}
      </div>
    </div>
  );
};

interface PeekCardProps {
  prompt: string;
  category: CardCategory;
  sent: boolean;
  onClick: () => void;
}

export const PeekCard = ({ prompt, category, sent, onClick }: PeekCardProps) => {
  const tokens = CARD_DECK_TOKENS[category] ?? CARD_DECK_TOKENS.normal;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Zu Karte springen: ${prompt}`}
      className={cn(
        'relative flex min-h-[62px] flex-1 flex-col gap-1 overflow-hidden rounded-[12px] py-2 pl-3 pr-[9px] text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sent && 'opacity-50',
      )}
      style={{ backgroundColor: '#16161E' }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: tokens.accent }}
      />
      <span className="flex items-center justify-between">
        <span className="text-[9px] uppercase" style={{ color: '#6E6E7A', letterSpacing: '0.06em' }}>
          {tokens.label}
        </span>
        {sent && <Check size={11} color="#6E6E7A" />}
      </span>
      <span
        className="line-clamp-2 text-[11px]"
        style={{ color: sent ? '#8A8A95' : '#C8C8D2', lineHeight: 1.3 }}
      >
        {prompt}
      </span>
    </button>
  );
};
