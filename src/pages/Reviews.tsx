import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Star } from '@phosphor-icons/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewFlow } from '@/components/reviews/ReviewFlow';
import { useOpenReviews } from '@/hooks/useReviews';
import { maxPointsFor } from '@/lib/reviews';

/** Open review invitations as a card stack (deep link from the daily digest: /reviews). */
export default function Reviews() {
  const navigate = useNavigate();
  const { data: open, isLoading } = useOpenReviews();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState<{ reviewed: number; points: number } | null>(null);

  return (
    <AppLayout>
      <div className="mx-auto min-h-screen max-w-md px-4 pb-28" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <header className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill" onClick={() => navigate(-1)} aria-label="Zurück">
            <ArrowLeft weight="bold" className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Spots bewerten</h1>
            <p className="text-xs text-muted-foreground">Nur Orte, an denen du nachweislich warst</p>
          </div>
        </header>

        {isLoading && <Skeleton className="h-96 w-full rounded-3xl" />}

        {done ? (
          <div className="flex flex-col items-center rounded-3xl bg-[#FBEBDD]/70 px-6 py-12 text-center dark:bg-primary/10" data-testid="reviews-done">
            <CheckCircle weight="fill" className="h-16 w-16 text-primary" />
            <h2 className="mt-3 text-xl font-bold">{done.reviewed > 0 ? 'Danke für deine Bewertung!' : 'Alles erledigt'}</h2>
            {done.points > 0 && <p className="mt-1 text-3xl font-black text-primary">+{done.points} Punkte ✨</p>}
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">Deine Bewertung hilft anderen, den richtigen Spot für heute Nacht zu finden.</p>
            <Button className="mt-6 rounded-full px-8" onClick={() => navigate('/feed')}>Zum Feed</Button>
          </div>
        ) : !isLoading && (!open || open.length === 0) ? (
          <div className="flex flex-col items-center rounded-3xl border border-border/60 px-6 py-12 text-center" data-testid="reviews-empty">
            <Star weight="thin" className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-3 font-bold">Keine offenen Bewertungen</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Nach einem Abend kannst du die Spots bewerten, in denen du warst – z. B. wenn du dort einen Deal eingelöst oder vor Ort gepostet hast.
            </p>
          </div>
        ) : open && open.length > 0 && !started ? (
          <div className="rounded-3xl bg-[#FBEBDD]/70 p-6 text-center dark:bg-primary/10" data-testid="reviews-intro">
            <p className="text-4xl">🌙</p>
            <h2 className="mt-2 text-xl font-bold">
              {open.length === 1 ? 'Wie war dein Abend?' : `Du warst in ${open.length} Spots`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Dauert ca. 20 Sekunden pro Spot. Überspringen geht immer.</p>
            <p className="mt-4 text-2xl font-black text-primary">bis zu {maxPointsFor(open.length)} Punkte</p>
            <Button className="mt-5 w-full rounded-full" size="lg" onClick={() => setStarted(true)} data-testid="reviews-start">Los geht’s</Button>
          </div>
        ) : open && open.length > 0 ? (
          <ReviewFlow reviews={open} onDone={setDone} />
        ) : null}
      </div>
    </AppLayout>
  );
}
