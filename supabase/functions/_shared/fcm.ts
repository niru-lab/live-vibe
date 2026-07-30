// FCM HTTP v1 delivery (Legacy Server Key is deprecated/shut down).
// Requires ONE secret: FCM_SERVICE_ACCOUNT_JSON — the full service account
// JSON downloaded from Firebase Console → Project settings → Service accounts.

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function loadServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
    return sa;
  } catch {
    console.error('FCM_SERVICE_ACCOUNT_JSON is not valid JSON');
    return null;
  }
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(body);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Mints (and caches) an OAuth2 access token for the FCM v1 scope. */
async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64urlStr(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error('FCM token exchange failed', res.status, await res.text());
    return null;
  }
  const json = await res.json();
  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

export const fcmConfigured = () => loadServiceAccount() !== null;

export interface FcmMessage {
  token: string;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

export type FcmResult = { ok: true } | { ok: false; unregistered: boolean; error: string };

/** Sends one message via HTTP v1. Never throws. */
export async function sendFcm(msg: FcmMessage): Promise<FcmResult> {
  const sa = loadServiceAccount();
  if (!sa) return { ok: false, unregistered: false, error: 'no_service_account' };
  try {
    const accessToken = await getAccessToken(sa);
    if (!accessToken) return { ok: false, unregistered: false, error: 'no_access_token' };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: msg.token,
            notification: { title: msg.title, body: msg.body ?? '' },
            data: msg.data ?? {},
          },
        }),
      },
    );
    if (res.ok) return { ok: true };

    const text = await res.text();
    // 404 UNREGISTERED / 400 INVALID_ARGUMENT on token → token is dead.
    const unregistered = res.status === 404 || text.includes('UNREGISTERED') || text.includes('registration-token-not-registered');
    console.error('FCM v1 send failed', res.status, text);
    return { ok: false, unregistered, error: `http_${res.status}` };
  } catch (err) {
    console.error('FCM v1 send threw', err);
    return { ok: false, unregistered: false, error: 'exception' };
  }
}
