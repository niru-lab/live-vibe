/**
 * Feyrn Cards — stacked deck with action row and peek row.
 * Presentational: deck index is local state, sending is delegated upwards.
 */
import { useEffect, useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import { CARD_DECK_TOKENS, DECK_ACCENT, FeyrnCard, PeekCard } from '@/components/cards/FeyrnCard';
import type { AssignedCard } from '@/hooks/useCards';
import type { CardCategory } from '@/lib/cards';

interface CardDeckProps {
  cards: AssignedCard[];
  sentCardIds: Set<string>;
  onSend: (card: AssignedCard) => void;
}

export const CardDeck = ({ cards, sentCardIds, onSend }: CardDeckProps) => {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  // Start on the first unsent card once the deck is available.
  useEffect(() => {
    if (cards.length === 0) return;
    const first = cards.findIndex((c) => !sentCardIds.has(c.card_id));
    setIndex(first === -1 ? 0 : first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  if (cards.length === 0) return null;

  const total = cards.length;
  const sentCount = cards.filter((c) => sentCardIds.has(c.card_id)).length;
  const current = cards[index % total];
  const tokens = CARD_DECK_TOKENS[current.card.category as CardCategory] ?? CARD_DECK_TOKENS.normal;
  const peeks = [cards[(index + 1) % total], cards[(index + 2) % total]];

  const goTo = (next: number) => {
    setIndex(((next % total) + total) % total);
    setTick((t) => t + 1);
  };

  return (
    <div className="mx-auto w-full sm:max-w-[340px]">
      <div className="mt-3 h-[3px] w-full rounded-[2px]" style={{ backgroundColor: '#1A1A22' }}>
        <div
          className="h-full rounded-[2px] transition-all"
          style={{ width: `${(sentCount / total) * 100}%`, backgroundColor: DECK_ACCENT }}
        />
      </div>

      <div className="relative mt-5 pb-4">
        <div
          aria-hidden
          className="absolute bottom-0 left-[30px] right-[30px] top-[16px] rounded-[18px]"
          style={{ backgroundColor: tokens.back }}
        />
        <div
          aria-hidden
          className="absolute bottom-2 left-4 right-4 top-[8px] rounded-[18px]"
          style={{ backgroundColor: tokens.middle }}
        />
        <div key={tick} className="relative animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none">
          <FeyrnCard
            prompt={current.card.prompt}
            category={current.card.category as CardCategory}
            position={current.position}
            total={total}
            sent={sentCardIds.has(current.card_id)}
          />
        </div>
      </div>

      <div className="mb-4 mt-[18px] flex gap-2">
        <button
          type="button"
          aria-label="Karte senden"
          onClick={() => onSend(current)}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] text-[13px] font-medium text-white"
          style={{ backgroundColor: DECK_ACCENT }}
        >
          <Send size={15} />
          Senden
        </button>
        <button
          type="button"
          aria-label="Nächste Karte"
          onClick={() => goTo(index + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: '#16161E', color: '#9A9AA5' }}
        >
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="flex gap-2">
        {peeks.map((c, i) => (
          <PeekCard
            key={`${c.card_id}-${i}`}
            prompt={c.card.prompt}
            category={c.card.category as CardCategory}
            sent={sentCardIds.has(c.card_id)}
            onClick={() => goTo(index + 1 + i)}
          />
        ))}
      </div>
    </div>
  );
};
