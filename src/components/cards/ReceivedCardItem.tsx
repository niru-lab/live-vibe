import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsThree, Flag, Prohibit, Lock, CheckCircle } from '@phosphor-icons/react';
import { BlockSheet } from '@/components/safety/BlockSheet';
import { CardCard } from '@/components/cards/CardCard';
import { useCardAnswer, useCardReport, logCardInteraction, type ReceivedBatch } from '@/hooks/useCards';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { CARD_REPORT_REASONS, FEYRN_CARDS_CONFIG, type CardCategory } from '@/lib/cards';

export const ReceivedCardItem = ({ batch }: { batch: ReceivedBatch }) => {
  const { data: myProfile } = useProfile();
  const { toast } = useToast();
  const answer = useCardAnswer();
  const report = useCardReport();

  const [index, setIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const card = batch.cards[index];
  const answered = card ? batch.answeredCardIds.has(card.id) : false;

  if (!card) return null;

  const handleSkip = () => {
    void logCardInteraction(myProfile?.id, batch.id, 'skipped');
    setShowForm(false);
    setAnswerText('');
    setIndex((i) => (i + 1) % batch.cards.length);
  };

  const handleAnswer = () => {
    answer.mutate(
      { batchId: batch.id, cardId: card.id, answerText },
      {
        onSuccess: () => {
          toast({ title: 'Antwort gesendet', description: 'Nur ihr beide seht sie.' });
          setAnswerText('');
          setShowForm(false);
        },
        onError: (error: unknown) =>
          toast({
            title: 'Fehler',
            description: error instanceof Error ? error.message : 'Antwort fehlgeschlagen.',
            variant: 'destructive',
          }),
      },
    );
  };

  const handleReport = (reason: (typeof CARD_REPORT_REASONS)[number]['value']) => {
    report.mutate(
      { batchId: batch.id, reason },
      {
        onSuccess: () => toast({ title: 'Gemeldet', description: 'Danke für deinen Hinweis.' }),
        onError: (error: unknown) =>
          toast({
            title: 'Fehler',
            description: error instanceof Error ? error.message : 'Meldung fehlgeschlagen.',
            variant: 'destructive',
          }),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={batch.sender?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>
              {(batch.sender?.username ?? '??').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              @{batch.sender?.username ?? 'unbekannt'}
            </p>
            <p className="text-xs text-muted-foreground">
              {batch.cards.length > 1 ? `Karte ${index + 1} von ${batch.cards.length}` : '1 Karte'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Melden oder blockieren"
              className="h-11 w-11 rounded-full"
            >
              <DotsThree weight="bold" className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            {CARD_REPORT_REASONS.map((r) => (
              <DropdownMenuItem
                key={r.value}
                className="gap-2 cursor-pointer"
                onClick={() => handleReport(r.value)}
              >
                <Flag weight="bold" className="h-4 w-4" />
                {r.label}
              </DropdownMenuItem>
            ))}
            {batch.sender && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setBlockOpen(true)}
                >
                  <Prohibit weight="bold" className="h-4 w-4" />
                  Blockieren
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {batch.message && (
        <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{batch.message}</p>
      )}

      <CardCard prompt={card.prompt} category={card.category as CardCategory} compact />

      {answered ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle weight="fill" className="h-4 w-4 text-primary" />
          Beantwortet
        </p>
      ) : showForm ? (
        <div className="space-y-2">
          <Textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            maxLength={FEYRN_CARDS_CONFIG.maxAnswerLength}
            rows={3}
            placeholder="Deine Antwort…"
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock weight="fill" className="h-3 w-3" />
            Nur du und @{batch.sender?.username ?? 'die Person'} sehen diese Antwort.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleAnswer}
              disabled={answer.isPending || !answerText.trim()}
              className="min-h-[44px] flex-1"
            >
              {answer.isPending ? 'Senden…' : 'Antwort senden'}
            </Button>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setShowForm(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button className="min-h-[44px] flex-1" onClick={() => setShowForm(true)}>
            Antworten
          </Button>
          {batch.cards.length > 1 && (
            <Button variant="outline" className="min-h-[44px]" onClick={handleSkip}>
              Überspringen
            </Button>
          )}
        </div>
      )}

      {batch.sender && (
        <BlockSheet
          open={blockOpen}
          onOpenChange={setBlockOpen}
          target={{
            id: batch.sender.id,
            username: batch.sender.username,
            display_name: batch.sender.display_name,
            avatar_url: batch.sender.avatar_url,
          }}
        />
      )}
    </div>
  );
};
