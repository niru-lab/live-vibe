// Pure helpers for event cards on the Events screen (unit-tested).
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const DEFAULT_DURATION_MS = 6 * 3600 * 1000;

export const eventEnd = (e: { starts_at: string; ends_at?: string | null }) =>
  e.ends_at ? new Date(e.ends_at) : new Date(new Date(e.starts_at).getTime() + DEFAULT_DURATION_MS);

export const isEventLive = (e: { starts_at: string; ends_at?: string | null }, now: Date = new Date()) =>
  new Date(e.starts_at) <= now && now < eventEnd(e);

/** "Heute, 23:00" · "Morgen, 22:00" · "Fr., 28.11. · 22:00" */
export const eventTimeLabel = (startsAt: string, now: Date = new Date()) => {
  const d = new Date(startsAt);
  const time = format(d, 'HH:mm');
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return `Heute, ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Morgen, ${time}`;
  return `${format(d, 'EEE, dd.MM.', { locale: de })} · ${time}`;
};

/** Great-circle distance in km. */
export const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** "350 m" below 1 km, otherwise "1,2 km" (one decimal, German comma). */
export const formatDistance = (km: number) =>
  km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m` : `${km.toFixed(1).replace('.', ',')} km`;

/**
 * Distance label only for public events with coordinates and a known user position.
 * Private events never get one — their exact spot must not be inferable.
 */
export const eventDistanceLabel = (
  event: { latitude?: number | null; longitude?: number | null; visibility?: string | null },
  me: { lat: number; lng: number } | null | undefined,
): string | null => {
  if (!me || event.visibility !== 'public' || event.latitude == null || event.longitude == null) return null;
  return formatDistance(distanceKm(me, { lat: event.latitude, lng: event.longitude }));
};

/** Social line on the big card: going while live, otherwise going or interested — whichever says more. */
export const socialLine = (counts: { going: number; interested: number } | undefined, live: boolean): string | null => {
  if (!counts) return null;
  if (counts.going > 0 && (live || counts.going >= counts.interested)) return `${counts.going} ${counts.going === 1 ? 'ist' : 'sind'} dabei`;
  if (counts.interested > 0) return `${counts.interested} interessiert`;
  if (counts.going > 0) return `${counts.going} ${counts.going === 1 ? 'ist' : 'sind'} dabei`;
  return null;
};
