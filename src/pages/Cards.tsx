import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CardDeck } from '@/components/cards/CardDeck';
import { CardSendModal } from '@/components/cards/CardSendModal';
import { ReceivedCardItem } from '@/components/cards/ReceivedCardItem';
import {
  useCardAssignment,
  useReceivedCards,
  useSentCards,
  useUserCards,
  type AssignedCard,
} from '@/hooks/useCards';
import { useAuth } from '@/contexts/AuthContext';
import { CaretLeft, DotsThree } from '@phosphor-icons/react';

const Cards = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sendCard, setSendCard] = useState<AssignedCard | null>(null);

  const { isLoading: loadingAssignment, error: assignmentError } = useCardAssignment();
  const { data: cards, isLoading } = useUserCards();
  const { data: received, isLoading: loadingReceived } = useReceivedCards();
  const { data: sentBatches } = useSentCards();

  const sentCardIds = useMemo(() => {
    const ids = new Set<string>();
    (sentBatches ?? []).forEach((b: any) =>
      (b.cards ?? []).forEach((c: any) => c?.id && ids.add(c.id)),
    );
    return ids;
  }, [sentBatches]);

  const total = cards?.length ?? 0;
  const sentCount = (cards ?? []).filter((c) => sentCardIds.has(c.card_id)).length;

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
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <div className="mx-auto w-full sm:max-w-[340px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Zurück"
                className="flex h-11 w-11 items-center justify-center rounded-full text-foreground"
              >
                <CaretLeft weight="bold" className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-[17px] font-medium text-foreground">Deine Karten</h1>
                <p className="text-xs" style={{ color: '#7A7A85' }}>
                  {sentCount} von {total || 20} gesendet
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Weitere Optionen"
              onClick={() => navigate('/profile')}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
                style={{ backgroundColor: '#1A1A22', color: '#9A9AA5' }}
              >
                <DotsThree weight="bold" className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>

        {assignmentError && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Kartenzuweisung fehlgeschlagen. Bitte versuche es später erneut.
          </p>
        )}

        {loadingAssignment || isLoading ? (
          <div className="mx-auto mt-6 w-full space-y-3 sm:max-w-[340px]">
            <Skeleton className="h-[226px] rounded-[18px]" />
            <Skeleton className="h-10 rounded-[10px]" />
          </div>
        ) : cards && cards.length > 0 ? (
          <CardDeck cards={cards} sentCardIds={sentCardIds} onSend={setSendCard} />
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Noch keine Karten verfügbar.</p>
        )}

        <div className="mx-auto mt-6 w-full space-y-3 sm:max-w-[340px]">
          {loadingReceived ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            received?.map((batch) => <ReceivedCardItem key={batch.id} batch={batch} />)
          )}
        </div>
      </div>

      <CardSendModal
        open={!!sendCard}
        onOpenChange={(open) => !open && setSendCard(null)}
        cards={sendCard ? [sendCard] : []}
      />
    </AppLayout>
  );
};

export default Cards;
