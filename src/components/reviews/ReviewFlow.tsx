import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkle, Storefront } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSkipReview, useSubmitReview, type OpenReview } from '@/hooks/useReviews';
import {
  PROOF_LABELS, REVIEW_CATEGORIES, REVIEW_POINTS, nightLabel, pointsForReview, ratingsComplete, type ReviewRatings,
} from '@/lib/reviews';
import { StarInput } from './StarRating';

interface ReviewFlowProps {
  reviews: OpenReview[];
  onDone: (summary: { reviewed: number; points: number }) => void;
}

/** One card per venue of the night: 5 star rows + optional text. Skip or send, then the next card. */
export const ReviewFlow = ({ reviews, onDone }: ReviewFlowProps) => {
  // Freeze the list at start so cards don't jump when the query refetches after each send.
  const [queue] = useState(() => reviews);
  const [index, setIndex] = useState(0);
  const [ratings, setRatings] = useState<Partial<ReviewRatings>>({});
  const [comment, setComment] = useState('');
  const [earned, setEarned] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [burst, setBurst] = useState<string | null>(null);
  const submit = useSubmitReview();
  const skip = useSkipReview();

  const current = queue[index];
  const points = pointsForReview(comment);
  const complete = ratingsComplete(ratings);
  const busy = submit.isPending || skip.isPending;
  const proof = current ? PROOF_LABELS[current.proof_type] : undefined;

  useEffect(() => { if (!burst) return; const t = setTimeout(() => setBurst(null), 1400); return () => clearTimeout(t); }, [burst]);

  const advance = (gained: number, bonus: number, didReview: boolean) => {
    const total = earned + gained + bonus;
    const count = reviewed + (didReview ? 1 : 0);
    setEarned(total);
    setReviewed(count);
    if (gained + bonus > 0) setBurst(bonus > 0 ? `+${gained + bonus} ✨ Nacht komplett 🌙` : `+${gained} ✨`);
    setRatings({});
    setComment('');
    if (index + 1 >= queue.length) onDone({ reviewed: count, points: total });
    else setIndex(index + 1);
  };

  const send = () => {
    if (!current || !ratingsComplete(ratings)) return;
    submit.mutate({ invitationId: current.invitation_id, ratings, comment }, {
      onSuccess: (r) => advance(r.points, r.nightBonus, true),
      onError: (e) => {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('review_closed')) { toast('Diese Bewertung ist schon abgeschlossen.'); advance(0, 0, false); }
        else toast.error('Konnte nicht gespeichert werden. Bitte versuch es nochmal.');
      },
    });
  };

  const skipCurrent = () => {
    if (!current) return;
    skip.mutate(current.invitation_id, {
      onSuccess: (r) => advance(0, r.nightBonus, false),
      onError: () => toast.error('Hat nicht geklappt. Bitte versuch es nochmal.'),
    });
  };

  const dots = useMemo(() => queue.map((q) => q.invitation_id), [queue]);
  if (!current) return null;

  return (
    <div className="relative" data-testid="review-flow">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden>
          {dots.map((id, i) => (
            <span key={id} className={i === index ? 'h-2 w-5 rounded-full bg-primary' : i < index ? 'h-2 w-2 rounded-full bg-primary/50' : 'h-2 w-2 rounded-full bg-muted'} />
          ))}
        </div>
        <span className="text-xs font-semibold text-muted-foreground" data-testid="review-progress">{index + 1} von {queue.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.invitation_id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22 }}
          className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
              {current.venue_image_url
                ? <img src={current.venue_image_url} alt="" className="h-full w-full object-cover" />
                : <Storefront weight="fill" className="h-6 w-6 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold" data-testid="review-venue-name">{current.venue_name}</h2>
              <p className="text-xs text-muted-foreground">
                {nightLabel(current.night)}{proof ? ` · ${proof.emoji} ${proof.label}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">+{points} Punkte</span>
          </div>

          <div className="mt-5 space-y-4">
            {REVIEW_CATEGORIES.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="shrink-0 text-sm font-semibold">{c.emoji} {c.label}</p>
                  <p className="min-w-0 truncate text-[11px] text-muted-foreground">{c.question}</p>
                </div>
                <StarInput
                  value={ratings[c.key] ?? 0}
                  onChange={(v) => setRatings((r) => ({ ...r, [c.key]: v }))}
                  label={c.label}
                  testId={`review-stars-${c.key}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, REVIEW_POINTS.maxComment))}
              placeholder="Was sollen andere wissen? (optional)"
              className="min-h-[80px] resize-none rounded-2xl"
              data-testid="review-comment"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{comment.trim().length >= REVIEW_POINTS.textMinChars ? '✓ +3 Punkte für deinen Text' : `+3 Punkte ab ${REVIEW_POINTS.textMinChars} Zeichen`}</span>
              <span>{comment.length}/{REVIEW_POINTS.maxComment}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={skipCurrent} disabled={busy} data-testid="review-skip">Überspringen</Button>
            <Button className="flex-[2] rounded-full" onClick={send} disabled={!complete || busy} data-testid="review-submit">
              {submit.isPending ? 'Wird gesendet…' : complete ? `Absenden · +${points}` : 'Alle 5 Sterne-Reihen ausfüllen'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {burst && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto w-fit rounded-full bg-primary px-5 py-2 text-lg font-black text-primary-foreground shadow-xl"
            data-testid="review-points-burst"
          >
            <Sparkle weight="fill" className="mr-1 inline h-5 w-5" />{burst}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Für jede Bewertung gibt es Social-Cloud-Punkte – unabhängig von der Note. Nur echte Besuche.
      </p>
    </div>
  );
};
