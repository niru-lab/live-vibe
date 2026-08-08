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
}

export const validateOfferDraft = (draft: OfferDraft, now: Date = new Date()): string[] => {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('Titel ist erforderlich.');
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
