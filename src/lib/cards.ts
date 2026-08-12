/**
 * Feyrn Cards — central config & types.
 * Point values and limits mirror the server-side source of truth
 * (`send_card_batch`, `assign_user_cards`, `award_social_cloud`).
 */

export const FEYRN_CARDS_CONFIG = {
  totalCards: 20,
  defaultDistribution: { normal: 10, deep: 6, flirty: 4 },
  allowFlirtyForAdultsOnly: true,
  maxCardsPerBatch: 5,
  maxSendsPerHour: 20,
  maxSendsPerDay: 50,
  maxAnswerLength: 500,
  minAnswerLength: 1,
} as const;

export type CardCategory = 'normal' | 'deep' | 'flirty';
export type CardSendStatus =
  | 'pending'
  | 'accepted'
  | 'answered'
  | 'skipped'
  | 'expired'
  | 'reported'
  | 'blocked';
export type AnswerVisibility = 'private' | 'shared_with_sender' | 'shared_as_post';
export type CardReportReason =
  | 'inappropriate'
  | 'harassment'
  | 'sexual'
  | 'hate_speech'
  | 'spam'
  | 'threat'
  | 'other';

export const CARD_CATEGORY_LABELS: Record<CardCategory, string> = {
  normal: 'Normal',
  deep: 'Deep',
  flirty: 'Flirty',
};

/** Semantic accent classes per category — no hardcoded colors. */
export const CARD_CATEGORY_STYLES: Record<CardCategory, { badge: string; bar: string }> = {
  normal: { badge: 'bg-primary/15 text-primary', bar: 'bg-primary' },
  deep: { badge: 'bg-accent/20 text-accent-foreground', bar: 'bg-accent' },
  flirty: { badge: 'bg-destructive/15 text-destructive', bar: 'bg-destructive' },
};

export const CARD_REPORT_REASONS: { value: CardReportReason; label: string }[] = [
  { value: 'inappropriate', label: 'Unangemessener Inhalt' },
  { value: 'harassment', label: 'Belästigung' },
  { value: 'sexual', label: 'Sexueller Inhalt' },
  { value: 'hate_speech', label: 'Hassrede' },
  { value: 'spam', label: 'Spam' },
  { value: 'threat', label: 'Bedrohung' },
  { value: 'other', label: 'Anderes' },
];
