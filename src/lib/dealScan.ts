// Pure helpers for the deal scanner (kept separate so they can be unit-tested).

export type ScanResultCode =
  | 'ok' | 'already_redeemed' | 'wrong_venue' | 'expired' | 'not_started' | 'cancelled' | 'not_found';

export const SCAN_MESSAGES: Record<ScanResultCode, { title: string; hint: string; ok: boolean }> = {
  ok: { title: 'Gültig ✅', hint: 'Deal ausgeben – ist jetzt verbraucht.', ok: true },
  already_redeemed: { title: 'Bereits eingelöst', hint: 'Dieser Code wurde schon gescannt (z. B. Screenshot).', ok: false },
  wrong_venue: { title: 'Falscher Spot', hint: 'Dieser Deal gehört zu einem anderen Spot.', ok: false },
  expired: { title: 'Abgelaufen', hint: 'Der Deal ist nicht mehr gültig.', ok: false },
  not_started: { title: 'Noch nicht gestartet', hint: 'Der Deal gilt erst später.', ok: false },
  cancelled: { title: 'Nicht aktiv', hint: 'Der Gast hat den Deal nicht mehr aktiv.', ok: false },
  not_found: { title: 'Unbekannter Code', hint: 'Code prüfen oder QR-Code nochmal scannen.', ok: false },
};

export const scanMessage = (result: string | null | undefined) =>
  SCAN_MESSAGES[(result as ScanResultCode) in SCAN_MESSAGES ? (result as ScanResultCode) : 'not_found'];

/**
 * What to send to the server for a scanned/typed value:
 * a 64-char hex QR token, or a 6-character backup code (dashes/spaces ignored). Anything else → null.
 */
export const normalizeScanInput = (raw: string): string | null => {
  const v = raw.trim().replace(/[\s-]/g, '');
  if (/^[0-9a-f]{64}$/i.test(v)) return v.toLowerCase();
  if (/^[A-Za-z0-9]{6}$/.test(v)) return v.toUpperCase();
  return null;
};

/** Same QR seen again within this window is ignored (camera keeps seeing it while the result is shown). */
export const RESCAN_COOLDOWN_MS = 4000;

export const shouldProcessScan = (
  value: string, last: { value: string; at: number } | null, now: number,
): boolean => !last || last.value !== value || now - last.at > RESCAN_COOLDOWN_MS;

/** Link a bar staff member opens to join a venue as scanner. */
export const staffInviteLink = (origin: string, code: string) => `${origin}/scan?invite=${encodeURIComponent(code)}`;
