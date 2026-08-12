import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardCard } from '@/components/cards/CardCard';
import { CardSendModal } from '@/components/cards/CardSendModal';
import { ReceivedCardItem } from '@/components/cards/ReceivedCardItem';
import {
  useCardAssignment,
  useReceivedCards,
  useUserCards,
  type AssignedCard,
} from '@/hooks/useCards';
import { FEYRN_CARDS_CONFIG, type CardCategory } from '@/lib/cards';
import { useAuth } from '@/contexts/AuthContext';
import { PaperPlaneTilt, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const FILTERS: { value: CardCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'normal', label: 'Normal' },
  { value: 'deep', label: 'Deep' },
  { value: 'flirty', label: 'Flirty' },
];

const Cards = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<CardCategory | 'all'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [sendOpen, setSendOpen] = useState(false);

  const { isLoading: loadingAssignment, error: assignmentError } = useCardAssignment();
  const { data: cards, isLoading } = useUserCards(filter === 'all' ? undefined : filter);
  const { data: received, isLoading: loadingReceived } = useReceivedCards();

  const allCards = useUserCards();
  const selectedCards = useMemo<AssignedCard[]>(
    () => (allCards.data ?? []).filter((c) => selected.includes(c.card_id)),
    [allCards.data, selected],
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
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <div className="flex items-center gap-2">
          <Sparkle weight="fill" className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Deine Feyrn Cards</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          20 Fragen, um jemanden wirklich kennenzulernen. Antworten bleiben privat.
        </p>

        <Tabs defaultValue="mine" className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mine" className="min-h-[44px]">
              Meine Karten
            </TabsTrigger>
            <TabsTrigger value="received" className="min-h-[44px]">
              Erhalten{received && received.length > 0 ? ` (${received.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={filter === f.value ? 'default' : 'outline'}
                  className="min-h-[38px] rounded-full"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {assignmentError && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Kartenzuweisung fehlgeschlagen. Bitte versuche es später erneut.
              </p>
            )}

            {loadingAssignment || isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : cards && cards.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pb-24 sm:grid-cols-2">
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
              <p className="text-sm text-muted-foreground">Keine Karten in dieser Kategorie.</p>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-4 space-y-3 pb-24">
            {loadingReceived ? (
              <>
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </>
            ) : received && received.length > 0 ? (
              received.map((batch) => <ReceivedCardItem key={batch.id} batch={batch} />)
            ) : (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Noch keine Karten erhalten.
              </p>
            )}
          </TabsContent>
        </Tabs>
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
