/**
 * Canonical public app URL.
 *
 * On the web this is simply the current origin. Inside the Capacitor native
 * shell the origin is `capacitor://localhost` / `http://localhost`, which is
 * not a valid redirect target for Supabase auth emails or share links — so we
 * fall back to the configured production site URL.
 */
const CONFIGURED_SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');

const isNativeOrigin = () => {
  if (typeof window === 'undefined') return true;
  const { protocol, hostname } = window.location;
  return protocol === 'capacitor:' || protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
};

export const getSiteUrl = (): string => {
  if (typeof window === 'undefined') return CONFIGURED_SITE_URL ?? '';
  if (isNativeOrigin() && CONFIGURED_SITE_URL) return CONFIGURED_SITE_URL;
  if (import.meta.env.DEV) return window.location.origin;
  return CONFIGURED_SITE_URL || window.location.origin;
};

/** Absolute URL for a path, safe for auth redirects and sharing. */
export const appUrl = (path = '/'): string =>
  `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
