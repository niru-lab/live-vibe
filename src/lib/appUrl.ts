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

/**
 * Redirect target for OAuth popups/redirects.
 *
 * OAuth must return to the SAME origin the user is currently on — otherwise the
 * popup lands on a different origin, the opener can never read the result and
 * the flow fails with "Sign in was cancelled" (e.g. in the Lovable preview).
 * Only the native shell falls back to the configured production URL.
 */
export const oauthRedirectUrl = (path = '/'): string => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return `${CONFIGURED_SITE_URL ?? ''}${suffix}`;
  const { protocol } = window.location;
  const isNativeShell = protocol === 'capacitor:' || protocol === 'file:';
  if (isNativeShell && CONFIGURED_SITE_URL) return `${CONFIGURED_SITE_URL}${suffix}`;
  return `${window.location.origin}${suffix}`;
};
