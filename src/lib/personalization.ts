/**
 * Soft personalization scoring (city + genre).
 *
 * Rules:
 * - Additive, soft ranking only. Never a hard filter.
 * - Boosts are capped so no single preference dimension can dominate the feed.
 * - Missing metadata degrades gracefully to 0 bonus.
 */

export const PERSONALIZATION_WEIGHTS = {
  /** Bonus when the item's city matches a preferred city. */
  city: 22,
  /** Bonus per matching genre. */
  genrePerMatch: 9,
  /** Max total genre bonus (prevents genre tunnel-vision). */
  genreMax: 18,
  /** Hard cap over all personalization dimensions combined. */
  totalMax: 34,
  /** Small deterministic variation to preserve serendipity/variety. */
  serendipity: 6,
};

export const normalizeList = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v.length > 0),
    ),
  );
};

const cityMatches = (itemCity: string, preferred: string[]) =>
  preferred.some((c) => itemCity.includes(c) || c.includes(itemCity));

/** Stable pseudo-random value in [0, 1) derived from an id — keeps ordering stable per item. */
const stableNoise = (id: string): number => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

export interface GuestPreferences {
  cities: string[];
  genres: string[];
}

export interface PersonalizableItem {
  id?: string | null;
  city?: string | null;
  genres?: string[] | null;
}

/**
 * Returns the combined soft bonus for an item given the guest's preferences.
 * Returns 0 when the user has no preferences (default behaviour preserved).
 */
export function personalizationBoost(
  prefs: GuestPreferences,
  item: PersonalizableItem,
): number {
  const hasPrefs = prefs.cities.length > 0 || prefs.genres.length > 0;
  if (!hasPrefs) return 0;

  let bonus = 0;

  if (prefs.cities.length > 0 && item.city) {
    const city = item.city.trim().toLowerCase();
    if (city && cityMatches(city, prefs.cities)) bonus += PERSONALIZATION_WEIGHTS.city;
  }

  const itemGenres = normalizeList(item.genres);
  if (prefs.genres.length > 0 && itemGenres.length > 0) {
    const matches = itemGenres.filter((g) =>
      prefs.genres.some((p) => g === p || g.includes(p) || p.includes(g)),
    ).length;
    if (matches > 0) {
      bonus += Math.min(
        PERSONALIZATION_WEIGHTS.genreMax,
        matches * PERSONALIZATION_WEIGHTS.genrePerMatch,
      );
    }
  }

  bonus = Math.min(PERSONALIZATION_WEIGHTS.totalMax, bonus);

  // Serendipity: small stable variation so lists never feel repetitive.
  if (item.id) {
    bonus += stableNoise(item.id) * PERSONALIZATION_WEIGHTS.serendipity;
  }

  return bonus;
}
