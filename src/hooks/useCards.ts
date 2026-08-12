import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { FEYRN_CARDS_CONFIG, type CardCategory, type CardReportReason } from '@/lib/cards';

export interface PoolCard {
  id: string;
  prompt: string;
  category: CardCategory;
}

export interface AssignedCard {
  card_id: string;
  position: number;
  card: PoolCard;
}

/**
 * Ensures the signed-in user owns exactly 20 permanently assigned cards.
 * `assign_user_cards` is idempotent server-side, so re-running is safe.
 */
export const useCardAssignment = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['card-assignment', profile?.id],
    enabled: !!profile?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('user_card_sets')
        .select('id')
        .eq('profile_id', profile!.id)
        .maybeSingle();

      if (existing) return existing.id as string;

      const { data, error } = await supabase.rpc('assign_user_cards', { _assignment_version: 'v1' });
      if (error) throw error;
      return data as string;
    },
  });
};

/** The user's own 20 cards, optionally filtered by category. */
export const useUserCards = (category?: CardCategory) => {
  const { data: profile } = useProfile();
  const { data: setId } = useCardAssignment();

  return useQuery({
    queryKey: ['user-cards', profile?.id, setId, category ?? 'all'],
    enabled: !!profile?.id && !!setId,
    queryFn: async (): Promise<AssignedCard[]> => {
      const { data, error } = await supabase
        .from('user_card_assignments')
        .select('card_id, position, card_pool!inner(id, prompt, category)')
        .eq('profile_id', profile!.id)
        .order('position', { ascending: true });

      if (error) throw error;

      return (data ?? [])
        .map((row: any) => ({
          card_id: row.card_id,
          position: row.position,
          card: row.card_pool as PoolCard,
        }))
        .filter((row) => !category || row.card.category === category);
    },
  });
};

interface SendInput {
  recipientId: string;
  cardIds: string[];
  message?: string;
  eventId?: string | null;
  venueId?: string | null;
}

/** Sends 1–5 cards. Rate limits, blocks and ownership are enforced server-side. */
export const useCardSend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientId, cardIds, message, eventId, venueId }: SendInput) => {
      if (cardIds.length === 0) throw new Error('Bitte wähle mindestens eine Karte.');
      if (cardIds.length > FEYRN_CARDS_CONFIG.maxCardsPerBatch) {
        throw new Error(`Maximal ${FEYRN_CARDS_CONFIG.maxCardsPerBatch} Karten pro Sendung.`);
      }

      const { data, error } = await supabase.rpc('send_card_batch', {
        _recipient_id: recipientId,
        _card_ids: cardIds,
        _message: message?.trim() || null,
        _event_id: eventId ?? null,
        _venue_id: venueId ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
    },
  });
};

export interface ReceivedBatch {
  id: string;
  sender_id: string;
  status: string;
  message: string | null;
  sent_at: string;
  sender: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
  cards: PoolCard[];
  answeredCardIds: Set<string>;
}

const BATCH_SELECT = `
  id, sender_id, recipient_id, status, message, sent_at,
  card_send_items(card_id, card_pool(id, prompt, category)),
  card_answers(card_id, answer_text)
`;

export const useReceivedCards = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['received-cards', profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<ReceivedBatch[]> => {
      const { data, error } = await supabase
        .from('card_send_batches')
        .select(BATCH_SELECT)
        .eq('recipient_id', profile!.id)
        .not('status', 'in', '("blocked","reported")')
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const senderIds = Array.from(new Set((data ?? []).map((b: any) => b.sender_id)));
      const senders = senderIds.length
        ? (
            await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .in('id', senderIds)
          ).data ?? []
        : [];
      const senderMap = new Map(senders.map((s: any) => [s.id, s]));

      return (data ?? []).map((b: any) => ({
        id: b.id,
        sender_id: b.sender_id,
        status: b.status,
        message: b.message,
        sent_at: b.sent_at,
        sender: senderMap.get(b.sender_id) ?? null,
        cards: (b.card_send_items ?? []).map((i: any) => i.card_pool as PoolCard),
        answeredCardIds: new Set<string>((b.card_answers ?? []).map((a: any) => a.card_id)),
      }));
    },
  });
};

/** Batches the user sent, including answers once the recipient replied. */
export const useSentCards = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['sent-cards', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_send_batches')
        .select(BATCH_SELECT)
        .eq('sender_id', profile!.id)
        .order('sent_at', { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((data ?? []).map((b: any) => b.recipient_id)));
      const people = ids.length
        ? (
            await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .in('id', ids)
          ).data ?? []
        : [];
      const map = new Map(people.map((p: any) => [p.id, p]));

      return (data ?? []).map((b: any) => ({
        id: b.id,
        status: b.status,
        sent_at: b.sent_at,
        message: b.message,
        recipient: map.get(b.recipient_id) ?? null,
        cards: (b.card_send_items ?? []).map((i: any) => i.card_pool as PoolCard),
        answers: (b.card_answers ?? []) as { card_id: string; answer_text: string }[],
      }));
    },
  });
};

export const useCardAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      cardId,
      answerText,
    }: {
      batchId: string;
      cardId: string;
      answerText: string;
    }) => {
      const text = answerText.trim();
      if (text.length < FEYRN_CARDS_CONFIG.minAnswerLength) {
        throw new Error('Bitte schreibe eine Antwort.');
      }
      if (text.length > FEYRN_CARDS_CONFIG.maxAnswerLength) {
        throw new Error(`Maximal ${FEYRN_CARDS_CONFIG.maxAnswerLength} Zeichen.`);
      }

      const { data, error } = await supabase.rpc('answer_card', {
        _batch_id: batchId,
        _card_id: cardId,
        _answer_text: text,
        _visibility: 'private',
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
    },
  });
};

export const useCardReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      reason,
      details,
    }: {
      batchId: string;
      reason: CardReportReason;
      details?: string;
    }) => {
      const { error } = await supabase.rpc('report_card_batch', {
        _batch_id: batchId,
        _reason: reason,
        _details: details?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['received-cards'] }),
  });
};

/** Fire-and-forget interaction log (ids only, never answer content). */
export const logCardInteraction = async (
  profileId: string | undefined,
  batchId: string | null,
  action: 'opened' | 'accepted' | 'skipped',
) => {
  if (!profileId) return;
  await supabase
    .from('card_interactions')
    .insert({ profile_id: profileId, batch_id: batchId, action })
    .then(undefined, () => undefined);
};
