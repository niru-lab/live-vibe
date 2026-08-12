import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MagnifyingGlass, PaperPlaneTilt } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useHiddenUserIds } from '@/hooks/useBlockUser';
import { useToast } from '@/hooks/use-toast';
import { useCardSend, type AssignedCard } from '@/hooks/useCards';
import { FEYRN_CARDS_CONFIG } from '@/lib/cards';
import { cn } from '@/lib/utils';

interface CardSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: AssignedCard[];
  eventId?: string | null;
  venueId?: string | null;
}

interface Recipient {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export const CardSendModal = ({
  open,
  onOpenChange,
  cards,
  eventId,
  venueId,
}: CardSendModalProps) => {
  const { data: myProfile } = useProfile();
  const { blocked } = useHiddenUserIds();
  const { toast } = useToast();
  const send = useCardSend();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setRecipient(null);
      setMessage('');
    }
  }, [open]);

  const { data: results = [] } = useQuery({
    queryKey: ['card-recipient-search', debounced, myProfile?.id],
    enabled: open && debounced.length >= 1,
    queryFn: async (): Promise<Recipient[]> => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${debounced}%,display_name.ilike.%${debounced}%`)
        .limit(12);
      return (data ?? []).filter((p) => p.id !== myProfile?.id && !blocked.has(p.id));
    },
  });

  const cardIds = useMemo(() => cards.map((c) => c.card_id), [cards]);

  const handleSend = () => {
    if (!recipient) {
      toast({
        title: 'Empfänger fehlt',
        description: 'Bitte wähle aus, wer die Karten bekommen soll.',
        variant: 'destructive',
      });
      return;
    }

    send.mutate(
      { recipientId: recipient.id, cardIds, message, eventId, venueId },
      {
        onSuccess: () => {
          toast({
            title: 'Gesendet',
            description: `${cardIds.length === 1 ? 'Karte' : `${cardIds.length} Karten`} an @${recipient.username} gesendet.`,
          });
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          toast({
            title: 'Fehler',
            description:
              error instanceof Error ? error.message : 'Karte konnte nicht gesendet werden.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {cardIds.length > 1 ? `${cardIds.length} Karten senden` : 'Karte senden'}
          </DialogTitle>
          <DialogDescription>
            Antworten sind privat — nur du und die Person sehen sie. Maximal{' '}
            {FEYRN_CARDS_CONFIG.maxCardsPerBatch} Karten pro Sendung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-32 space-y-2 overflow-y-auto rounded-xl bg-muted/40 p-3">
            {cards.map((c) => (
              <p key={c.card_id} className="text-sm text-foreground">
                • {c.card.prompt}
              </p>
            ))}
          </div>

          {recipient ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={recipient.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{recipient.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">@{recipient.username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRecipient(null)}>
                Ändern
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="card-recipient" className="text-sm text-muted-foreground">
                Für wen sind diese Fragen?
              </label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="card-recipient"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Account suchen…"
                  className="pl-9"
                  maxLength={60}
                />
              </div>
              {results.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRecipient(r)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                        'min-h-[44px] hover:bg-muted',
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.avatar_url ?? undefined} alt="" />
                        <AvatarFallback>{r.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate text-sm">
                        <span className="font-medium">{r.display_name}</span>{' '}
                        <span className="text-muted-foreground">@{r.username}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="card-message" className="text-sm text-muted-foreground">
              Optionale Nachricht
            </label>
            <Textarea
              id="card-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="Kurz Hallo sagen…"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={send.isPending}
            className="min-h-[44px] w-full gap-2"
          >
            <PaperPlaneTilt weight="bold" className="h-4 w-4" />
            {send.isPending ? 'Wird gesendet…' : 'Jetzt senden'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
