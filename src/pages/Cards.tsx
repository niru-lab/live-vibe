import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CardCard } from '@/components/cards/CardCard';
import { CardSendModal } from '@/components/cards/CardSendModal';
import { ReceivedCardItem } from '@/components/cards/ReceivedCardItem';
import {
  useCardAssignment,
  useReceivedCards,
  useUserCards,
  type AssignedCard,
} from '@/hooks/useCards';
import { FEYRN_CARDS_CONFIG } from '@/lib/cards';
import { useAuth } from '@/contexts/AuthContext';
import { PaperPlaneTilt, CaretLeft } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const Cards = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [sendOpen, setSendOpen] = useState(false);

  const { isLoading: loadingAssignment, error: assignmentError } = useCardAssignment();
  const { data: cards, isLoading } = useUserCards();
  const { data: received, isLoading: loadingReceived } = useReceivedCards();

  const selectedCards = useMemo<AssignedCard[]>(
    () => (cards ?? []).filter((c) => selected.includes(c.card_id)),
    [cards, selected],
  );

  const toggle = (cardId: string) => {
    setSelected((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : prev.length >= FEYRN_CARDS_CONFIG.maxCardsPerBatch
          ? prev
          : [...prev, cardId],
    );
  };

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-foreground">Feyrn Cards</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Melde dich an, um deine 20 Karten zu erhalten.
          </p>
          <Button className="mt-6 min-h-[44px]" onClick={() => navigate('/auth')}>
            Anmelden
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full glass-pill"
            onClick={() => navigate(-1)}
            aria-label="Zurück"
          >
            <CaretLeft weight="bold" className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Feyrn Cards</h1>
        </div>
        <p className="mt-1 pl-11 text-sm text-muted-foreground">
          Antworten bleiben privat — nur ihr beide seht sie.
        </p>

        {assignmentError && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Kartenzuweisung fehlgeschlagen. Bitte versuche es später erneut.
          </p>
        )}

        <div className="mt-5 space-y-3">
          {loadingReceived ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            received?.map((batch) => <ReceivedCardItem key={batch.id} batch={batch} />)
          )}
        </div>

        {loadingAssignment || isLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-[22px]" />
            ))}
          </div>
        ) : cards && cards.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 pb-28 sm:grid-cols-3">
            {cards.map((c) => (
              <CardCard
                key={c.card_id}
                prompt={c.card.prompt}
                category={c.card.category}
                selected={selected.includes(c.card_id)}
                onClick={() => toggle(c.card_id)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Noch keine Karten verfügbar.</p>
        )}
      </div>


      {selected.length > 0 && (
        <div
          className={cn(
            'fixed inset-x-4 z-40 mx-auto max-w-md rounded-2xl border border-border bg-card p-3 shadow-lg',
          )}
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 104px)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {selected.length}/{FEYRN_CARDS_CONFIG.maxCardsPerBatch} ausgewählt
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" className="min-h-[44px]" onClick={() => setSelected([])}>
                Zurücksetzen
              </Button>
              <Button className="min-h-[44px] gap-2" onClick={() => setSendOpen(true)}>
                <PaperPlaneTilt weight="bold" className="h-4 w-4" />
                Senden
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardSendModal
        open={sendOpen}
        onOpenChange={(open) => {
          setSendOpen(open);
          if (!open) setSelected([]);
        }}
        cards={selectedCards}
      />
    </AppLayout>
  );
};

export default Cards;
