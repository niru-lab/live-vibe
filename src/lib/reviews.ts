// Venue reviews: categories, points and display helpers (pure, unit-tested).

export type ReviewCategory = 'overall' | 'music' | 'service' | 'drinks' | 'wait';

export const REVIEW_CATEGORIES: { key: ReviewCategory; label: string; emoji: string; question: string }[] = [
  { key: 'overall', label: 'Gesamt', emoji: '⭐', question: 'Wie war der Abend dort insgesamt?' },
  { key: 'music', label: 'Musik', emoji: '🎧', question: 'Passte die Musik?' },
  { key: 'service', label: 'Service', emoji: '🙋', question: 'Personal, Freundlichkeit, Tür' },
  { key: 'drinks', label: 'Getränke', emoji: '🍸', question: 'Qualität und Preis-Leistung' },
  { key: 'wait', label: 'Wartezeit', emoji: '⏱️', question: 'Einlass und Bar' },
];

export type ReviewRatings = Record<ReviewCategory, number>;

/** Same as the server: +5 per review, +3 with a text of at least 30 characters. Never depends on the stars. */
export const REVIEW_POINTS = { base: 5, text: 3, textMinChars: 30, nightBonus: 5, maxComment: 280 } as const;

export const pointsForReview = (comment: string): number =>
  REVIEW_POINTS.base + (comment.trim().length >= REVIEW_POINTS.textMinChars ? REVIEW_POINTS.text : 0);

/** "bis zu X Punkte" for n open venues of a night. */
export const maxPointsFor = (openCount: number): number =>
  openCount <= 0 ? 0 : openCount * (REVIEW_POINTS.base + REVIEW_POINTS.text) + REVIEW_POINTS.nightBonus;

export const ratingsComplete = (r: Partial<ReviewRatings>): r is ReviewRatings =>
  REVIEW_CATEGORIES.every(({ key }) => Number.isInteger(r[key]) && (r[key] as number) >= 1 && (r[key] as number) <= 5);

export const PROOF_LABELS: Record<string, { emoji: string; label: string }> = {
  deal: { emoji: '🎟️', label: 'Deal eingelöst' },
  onsite_post: { emoji: '📍', label: 'Vor Ort gepostet' },
  presence: { emoji: '📡', label: 'Vor Ort gewesen' },
};

/** "Fr., 28.11." for the night a review belongs to. */
export const nightLabel = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
};

/** "4,3" with German comma. */
export const formatRating = (v: number | null | undefined): string =>
  v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');

/** Share of each star value for the distribution bars (0–1). */
export const distributionShares = (dist: number[]): number[] => {
  const max = Math.max(...dist, 0);
  return dist.map((n) => (max === 0 ? 0 : n / max));
};

/** Averages are public only from this many reviews on (same rule as the server). */
export const MIN_REVIEWS_FOR_AVERAGE = 5;
