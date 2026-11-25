/**
 * Feyrn Live Offers — shared types and deterministic status logic.
 * An offer is only "live" when its stored status allows publication AND the
 * current time is inside its validity window. Never trust labels alone.
 */

export type OfferType =
  | 'discount_percent'
  | 'fixed_price'
  | 'two_for_one'
  | 'free_entry'
  | 'special';

export type OfferStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'paused' | 'archived';

/** What the deal is for. 'alcohol' deals are always 18+ (enforced in the database). */
export type OfferCategory = 'food' | 'drinks' | 'alcohol' | 'entry' | 'other';

export const OFFER_CATEGORY_LABELS: Record<OfferCategory, string> = {
  drinks: 'Getränke (alkoholfrei)',
  alcohol: 'Getränke mit Alkohol',
  food: 'Essen',
  entry: 'Eintritt',
  other: 'Sonstiges',
};

export const OFFER_CATEGORY_EMOJI: Record<OfferCategory, string> = {
  drinks: '🥤', alcohol: '🍸', food: '🍔', entry: '🎟️', other: '✨',
};

/** Ticket colours per category (gradient from → to). */
export const OFFER_CATEGORY_COLORS: Record<OfferCategory, [string, string]> = {
  alcohol: ['#7C3AED', '#C026D3'],
  drinks: ['#0EA5E9', '#6366F1'],
  food: ['#F97316', '#EF4444'],
  entry: ['#EC4899', '#F43F5E'],
  other: ['#14B8A6', '#6366F1'],
};

export const OFFER_CATEGORY_OPTIONS = (Object.keys(OFFER_CATEGORY_LABELS) as OfferCategory[]).map((value) => ({
  value,
  label: OFFER_CATEGORY_LABELS[value],
  emoji: OFFER_CATEGORY_EMOJI[value],
}));

export const asCategory = (c: string | null | undefined): OfferCategory =>
  c && c in OFFER_CATEGORY_LABELS ? (c as OfferCategory) : 'other';

export interface VenueOffer {
  id: string;
  venue_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  offer_type: OfferType;
  display_text: string | null;
  starts_at: string;
  ends_at: string;
  status: OfferStatus;
  redemption_instruction: string | null;
  max_activations: number | null;
  category: OfferCategory;
  image_url: string | null;
  conditions: string | null;
  min_age: number | null;
  created_at: string;
  updated_at: string;
}

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  discount_percent: 'Rabatt in %',
  fixed_price: 'Festpreis',
  two_for_one: '2 für 1',
  free_entry: 'Freier Eintritt / Gästeliste',
  special: 'Venue-Special',
};

export const OFFER_TYPE_OPTIONS = (Object.keys(OFFER_TYPE_LABELS) as OfferType[]).map((value) => ({
  value,
  label: OFFER_TYPE_LABELS[value],
}));

/** Statuses in which an offer may be shown publicly (subject to time window). */
export const PUBLISHABLE_STATUSES: OfferStatus[] = ['scheduled', 'active'];

export type LiveOfferState = 'live' | 'scheduled' | 'expired' | 'inactive';

export const resolveOfferState = (offer: VenueOffer, now: Date = new Date()): LiveOfferState => {
  const t = now.getTime();
  const start = new Date(offer.starts_at).getTime();
  const end = new Date(offer.ends_at).getTime();
  if (!PUBLISHABLE_STATUSES.includes(offer.status)) return 'inactive';
  if (t > end) return 'expired';
  if (t < start) return 'scheduled';
  return 'live';
};

export const isOfferLive = (offer: VenueOffer, now: Date = new Date()) =>
  resolveOfferState(offer, now) === 'live';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatValidity = (offer: VenueOffer, now: Date = new Date()): string => {
  const state = resolveOfferState(offer, now);
  if (state === 'scheduled') return `Gültig ab ${fmt(offer.starts_at)}`;
  if (state === 'expired') return `Abgelaufen am ${fmt(offer.ends_at)}`;
  if (state === 'inactive') return 'Nicht veröffentlicht';
  const remainingMs = new Date(offer.ends_at).getTime() - now.getTime();
  const hours = Math.floor(remainingMs / 3_600_000);
  if (hours < 1) return `Endet in ${Math.max(1, Math.round(remainingMs / 60_000))} Min.`;
  if (hours < 24) return `Noch ${hours} Std. gültig`;
  return `Gültig bis ${fmt(offer.ends_at)}`;
};

/** Short badge text derived only from real offer data. */
export const offerBadgeText = (offer: VenueOffer): string => {
  if (offer.display_text?.trim()) return offer.display_text.trim();
  return OFFER_TYPE_LABELS[offer.offer_type];
};

export interface OfferDraft {
  title: string;
  description: string;
  offer_type: OfferType;
  display_text: string;
  starts_at: string;
  ends_at: string;
  redemption_instruction: string;
  max_activations: string;
  event_id: string | null;
  category: OfferCategory;
  image_url: string | null;
  conditions: string;
}

export const validateOfferDraft = (draft: OfferDraft, now: Date = new Date()): string[] => {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('Beschreib kurz, was es gibt (z. B. „auf alle Longdrinks“).');
  if (draft.conditions.length > 200) errors.push('Bedingungen dürfen höchstens 200 Zeichen haben.');
  if (!draft.offer_type) errors.push('Angebotstyp ist erforderlich.');
  if (!draft.starts_at || !draft.ends_at) errors.push('Gültigkeitszeitraum ist erforderlich.');
  if (draft.starts_at && draft.ends_at) {
    const s = new Date(draft.starts_at).getTime();
    const e = new Date(draft.ends_at).getTime();
    if (!(s < e)) errors.push('"Gültig von" muss vor "Gültig bis" liegen.');
    if (e <= now.getTime()) errors.push('Ein bereits abgelaufenes Angebot kann nicht veröffentlicht werden.');
  }
  if (draft.max_activations && Number(draft.max_activations) <= 0) {
    errors.push('Aktivierungslimit muss größer als 0 sein.');
  }
  return errors;
};

/** Suggested big ticket value per deal type (venue can overwrite it). */
export const DEFAULT_DISPLAY_TEXT: Record<OfferType, string> = {
  two_for_one: '2 FÜR 1',
  discount_percent: '-20 %',
  fixed_price: '5 €',
  free_entry: 'GRATIS',
  special: 'SPECIAL',
};

/**
 * "Heute Abend" preset: 20:00 → 02:00 next day.
 * Already past 20:00 → starts now. Between midnight and 02:00 → now until 02:00, at least 1 h.
 */
export const tonightWindow = (now: Date = new Date()): { start: Date; end: Date } => {
  const at = (base: Date, dayOffset: number, h: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, 0, 0, 0);
    return d;
  };
  const h = now.getHours();
  if (h < 2) {
    const end = at(now, 0, 2);
    return { start: now, end: end.getTime() - now.getTime() >= 3_600_000 ? end : new Date(now.getTime() + 3_600_000) };
  }
  const evening = at(now, 0, 20);
  return { start: now > evening ? now : evening, end: at(now, 1, 2) };
};

/** "K7Q4M2" → "K7Q-4M2" for reading out at the bar. */
export const formatShortCode = (code: string): string => {
  const c = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
};

export type WalletCardState = 'ready' | 'upcoming' | 'redeemed' | 'expired';

/** State of a wallet ticket for display; the server stays the authority when scanning. */
export const walletCardState = (
  item: { status: string; starts_at: string; ends_at: string },
  now: Date = new Date(),
): WalletCardState => {
  if (item.status === 'redeemed') return 'redeemed';
  const t = now.getTime();
  if (t >= new Date(item.ends_at).getTime()) return 'expired';
  if (t < new Date(item.starts_at).getTime()) return 'upcoming';
  return 'ready';
};

/** Human message for errors raised by claim_deal. */
export const claimErrorMessage = (message: string): string => {
  if (message.includes('deal_sold_out')) return 'Leider schon vergriffen 😕';
  if (message.includes('deal_expired')) return 'Der Deal ist schon abgelaufen.';
  if (message.includes('deal_age_restricted')) return 'Dieser Deal ist erst ab 18.';
  if (message.includes('deal_own_venue')) return 'Deals deines eigenen Spots kannst du nicht aktivieren.';
  return 'Konnte nicht aktiviert werden. Bitte versuch es nochmal.';
};
