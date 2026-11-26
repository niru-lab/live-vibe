import { useNavigate } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { useOpenReviews } from '@/hooks/useReviews';
import { maxPointsFor } from '@/lib/reviews';

/** "Wie war's? N Spots bewerten" — shown in the feed and on the own profile while reviews are open. Hidden otherwise. */
export const OpenReviewsCard = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { data: open } = useOpenReviews();
  const n = open?.length ?? 0;
  if (n === 0) return null;
  const names = open!.slice(0, 2).map((o) => o.venue_name).join(', ') + (n > 2 ? ` +${n - 2}` : '');
  return (
    <button
      type="button"
      onClick={() => navigate('/reviews')}
      data-testid="open-reviews-card"
      className={`flex w-full items-center gap-3 rounded-3xl bg-[#FBEBDD] p-4 text-left transition active:scale-[0.99] dark:bg-primary/15 ${className ?? ''}`}
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-2xl">
        ⭐
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{n}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-foreground">
          {n === 1 ? 'Wie war’s? 1 Spot bewerten' : `Wie war’s? ${n} Spots bewerten`}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{names} · bis zu {maxPointsFor(n)} Punkte</span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <ArrowRight weight="bold" className="h-4 w-4" />
      </span>
    </button>
  );
};
