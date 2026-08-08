import type { FilterState } from '@/components/discover/DiscoverFilters';

/**
 * Single source of truth for Discover filtering.
 *
 * The same filter object is applied to events, venues and posts so a selection
 * like "Hip-Hop" can never leak unrelated content:
 *  - events must carry the genre/category/time/price themselves
 *  - venues survive only if they host at least one matching event
 *  - posts survive only if they are linked (event_id / venue_id) to those
 */

export const norm = (s?: string | null) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[\s\-_.]/g, '')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss');

export interface FilterableEvent {
  id: string;
  name: string;
  description?: string | null;
  dresscode?: string | null;
  category: string;
  city?: string | null;
  location_name?: string | null;
  music_genres?: string[] | null;
  starts_at: string;
  ends_at?: string | null;
  is_free?: boolean | null;
  entry_price?: number | null;
  creator_id?: string | null;
}

export interface FilterableVenue {
  id: string;
  name: string;
  city?: string | null;
  category?: string | null;
  owner_profile_id?: string | null;
}

export interface FilterablePost {
  id: string;
  event_id?: string | null;
  venue_id?: string | null;
}

/** Filters that describe *content*, i.e. they constrain which events qualify. */
export const hasContentFilters = (f?: FilterState | null) =>
  !!(f && (f.music || f.vibes || f.time || f.price || f.category));

const matchesMusic = (event: FilterableEvent, music: string) => {
  const target = norm(music);
  const genres = (event.music_genres ?? []).map(norm);
  if (genres.some((g) => g === target || g.includes(target) || target.includes(g))) return true;
  // Fallback: genre named in the free-text fields of the event.
  return norm(`${event.name} ${event.description ?? ''}`).includes(target);
};

const matchesVibe = (event: FilterableEvent, vibe: string) => {
  const target = norm(vibe);
  return norm(
    `${event.name} ${event.description ?? ''} ${event.dresscode ?? ''} ${event.category}`,
  ).includes(target);
};

const matchesTime = (event: FilterableEvent, time: string) => {
  const now = new Date();
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 6 * 3600_000);
  switch (time) {
    case 'Jetzt':
      return start.getTime() <= now.getTime() + 3600_000 && end.getTime() >= now.getTime();
    case 'Heute':
      return start.toDateString() === now.toDateString();
    case 'Morgen': {
      const tomorrow = new Date(now.getTime() + 24 * 3600_000);
      return start.toDateString() === tomorrow.toDateString();
    }
    case 'Wochenende': {
      const d = start.getDay();
      return (d === 5 || d === 6 || d === 0) && start.getTime() >= now.getTime() - 12 * 3600_000;
    }
    default:
      return true;
  }
};

const matchesPrice = (event: FilterableEvent, price: string) => {
  if (price === 'Kostenlos') return !!event.is_free;
  const cap = price === '< 10€' ? 10 : price === '< 20€' ? 20 : price === '< 50€' ? 50 : null;
  if (cap === null) return true;
  if (event.is_free) return true;
  return (event.entry_price ?? 0) < cap;
};

/** Map of the UI category chips → event categories / venue categories. */
export const EVENT_CATEGORY_MAP: Record<string, string[]> = {
  Club: ['club'],
  Bar: ['bar'],
  Café: [],
  Events: [],
};

export const VENUE_CATEGORY_MAP: Record<string, string> = {
  Bar: 'bar',
  Club: 'club',
  Café: 'cafe',
  Events: 'event',
};

export function matchesEventFilters(event: FilterableEvent, f?: FilterState | null): boolean {
  if (!f) return true;
  if (f.city && f.city !== 'Alle' && norm(event.city) !== norm(f.city)) return false;
  if (f.category) {
    const allowed = EVENT_CATEGORY_MAP[f.category];
    if (allowed && allowed.length > 0 && !allowed.includes(event.category)) return false;
    if (f.category === 'Café') return false; // Cafés are venues, not events
  }
  if (f.music && !matchesMusic(event, f.music)) return false;
  if (f.vibes && !matchesVibe(event, f.vibes)) return false;
  if (f.time && !matchesTime(event, f.time)) return false;
  if (f.price && !matchesPrice(event, f.price)) return false;
  return true;
}

/**
 * A venue "hosts" an event when the event creator is the venue owner
 * (the only real relation in this schema) or the event location resolves to
 * the venue name. No invented venue_id on events.
 */
export function venueHostsEvent(venue: FilterableVenue, event: FilterableEvent): boolean {
  if (venue.owner_profile_id && event.creator_id && venue.owner_profile_id === event.creator_id) {
    return true;
  }
  const venueName = norm(venue.name);
  if (!venueName) return false;
  return norm(event.location_name) === venueName;
}

/** Venues that survive the current filter selection. */
export function filterVenues<V extends FilterableVenue>(
  venues: V[],
  matchingEvents: FilterableEvent[],
  f?: FilterState | null,
): V[] {
  if (!hasContentFilters(f)) return venues;
  // A pure category selection on a venue category (Bar/Club/Café) keeps venues
  // of that category even without an event.
  const venueCat = f?.category ? VENUE_CATEGORY_MAP[f.category] : null;
  const onlyCategory = !!f && !f.music && !f.vibes && !f.time && !f.price;
  if (onlyCategory && venueCat && venueCat !== 'event') {
    return venues.filter((v) => v.category === venueCat);
  }
  return venues.filter((v) => matchingEvents.some((e) => venueHostsEvent(v, e)));
}

/** Posts that survive: only those linked to a matching event or venue. */
export function filterPosts<P extends FilterablePost>(
  posts: P[],
  matchingEventIds: Set<string>,
  matchingVenueIds: Set<string>,
  f?: FilterState | null,
): P[] {
  if (!hasContentFilters(f)) return posts;
  return posts.filter(
    (p) =>
      (p.event_id && matchingEventIds.has(p.event_id)) ||
      (p.venue_id && matchingVenueIds.has(p.venue_id)),
  );
}
