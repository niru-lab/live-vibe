import { ShieldCheck, Star } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useVenueRating, useVenueReviews } from '@/hooks/useReviews';
import {
  MIN_REVIEWS_FOR_AVERAGE, PROOF_LABELS, REVIEW_CATEGORIES, distributionShares, formatRating, nightLabel,
} from '@/lib/reviews';
import { StarDisplay } from './StarRating';

/** Under the venue name: "⭐ 4,3 · 128 Bewertungen · ✓ Nur echte Besuche" (or "Neu" below 5 reviews). */
export const VenueRatingBadge = ({ venueId, onClick }: { venueId: string | null | undefined; onClick?: () => void }) => {
  const { data } = useVenueRating(venueId);
  if (!data) return null;
  const n = data.review_count ?? 0;
  return (
    <button type="button" onClick={onClick} className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm" data-testid="venue-rating-badge">
      {data.avg_overall != null ? (
        <span className="flex items-center gap-1 font-bold text-foreground">
          <Star weight="fill" className="h-4 w-4 text-amber-400" /> {formatRating(data.avg_overall)}
        </span>
      ) : (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Neu</span>
      )}
      <span className="text-muted-foreground">· {n} {n === 1 ? 'Bewertung' : 'Bewertungen'}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        · <ShieldCheck weight="fill" className="h-3.5 w-3.5 text-green-500" /> Nur echte Besuche
      </span>
    </button>
  );
};

/** "Bewertungen" tab: overall score, category bars, distribution, latest reviews, disclosure. Public. */
export const VenueReviewsPanel = ({ venueId }: { venueId: string | null | undefined }) => {
  const { data: summary, isLoading } = useVenueRating(venueId);
  const { data: reviews = [] } = useVenueReviews(venueId);
  if (isLoading) return <Skeleton className="h-48 w-full rounded-3xl" />;
  const n = summary?.review_count ?? 0;
  const hasAvg = summary?.avg_overall != null;
  const dist = summary ? [summary.dist_5, summary.dist_4, summary.dist_3, summary.dist_2, summary.dist_1] : [0, 0, 0, 0, 0];
  const shares = distributionShares(dist);
  const avgOf: Record<string, number | null | undefined> = {
    overall: summary?.avg_overall, music: summary?.avg_music, service: summary?.avg_service,
    drinks: summary?.avg_drinks, wait: summary?.avg_wait,
  };

  return (
    <div className="space-y-4" data-testid="venue-reviews-panel">
      <div className="rounded-3xl border border-border/60 bg-card p-5">
        {hasAvg ? (
          <div className="flex gap-5">
            <div className="flex shrink-0 flex-col items-center justify-center">
              <span className="text-5xl font-black leading-none">{formatRating(summary!.avg_overall)}</span>
              <StarDisplay value={summary!.avg_overall ?? 0} size={14} className="mt-1.5" />
              <span className="mt-1 text-xs text-muted-foreground">{n} Bewertungen</span>
            </div>
            <div className="flex-1 space-y-1">
              {dist.map((count, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="w-3">{5 - i}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${shares[i] * 100}%` }} />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="font-bold">Noch zu wenige Bewertungen</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Die Note erscheint ab {MIN_REVIEWS_FOR_AVERAGE} Bewertungen{n > 0 ? ` – bisher ${n}` : ''}. So kann kein Einzelner einen Spot kaputt- oder schönbewerten.
            </p>
          </div>
        )}

        {hasAvg && (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {REVIEW_CATEGORIES.filter((c) => c.key !== 'overall').map((c) => {
              const v = avgOf[c.key] ?? 0;
              return (
                <div key={c.key}>
                  <div className="flex justify-between text-xs">
                    <span>{c.emoji} {c.label}</span>
                    <span className="font-bold">{formatRating(v)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(v / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((r) => {
            const proof = PROOF_LABELS[r.proof_type];
            return (
              <article key={r.review_id} className="rounded-2xl border border-border/50 bg-card p-4" data-testid="venue-review">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.author_avatar_url || ''} />
                    <AvatarFallback className="text-xs">{(r.author_display_name || r.author_username || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.author_display_name || (r.author_username ? `@${r.author_username}` : 'Gast')}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {nightLabel(r.night)}{proof ? ` · ${proof.emoji} ${proof.label}` : ''}
                    </p>
                  </div>
                  <StarDisplay value={r.rating_overall} size={13} />
                </div>
                {r.comment && <p className="mt-2.5 whitespace-pre-wrap text-sm text-foreground/90">{r.comment}</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  🎧 {r.rating_music} · 🙋 {r.rating_service} · 🍸 {r.rating_drinks} · ⏱️ {r.rating_wait}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <p className="px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        Bewerten können nur Gäste mit nachgewiesenem Besuch (Deal eingelöst, vor Ort gepostet oder vor Ort gewesen) – keine Venues, keine Mitarbeiter.
        Für jede Bewertung gibt es Social-Cloud-Punkte, unabhängig von der Note. Neuere Bewertungen zählen stärker.
      </p>
    </div>
  );
};
