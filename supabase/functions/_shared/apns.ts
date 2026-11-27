// Direct APNs delivery for iOS. @capacitor/push-notifications hands us the raw APNs device token
// on iOS, which FCM can't address — so iOS goes straight to Apple, Android stays on FCM.
// Secrets (Lovable Cloud → Secrets):
//   APNS_KEY_P8     contents of the AuthKey_XXXX.p8 file (incl. BEGIN/END lines)
//   APNS_KEY_ID     10-char key id
//   APNS_TEAM_ID    10-char Apple team id
//   APNS_BUNDLE_ID  optional, defaults to de.feyrn.app

interface ApnsConfig { keyP8: string; keyId: string; teamId: string; bundleId: string }

function loadConfig(): ApnsConfig | null {
  const keyP8 = Deno.env.get('APNS_KEY_P8');
  const keyId = Deno.env.get('APNS_KEY_ID');
  const teamId = Deno.env.get('APNS_TEAM_ID');
  if (!keyP8 || !keyId || !teamId) return null;
  return { keyP8, keyId, teamId, bundleId: Deno.env.get('APNS_BUNDLE_ID') || 'de.feyrn.app' };
}

export const apnsConfigured = () => loadConfig() !== null;

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

let cachedJwt: { jwt: string; issuedAt: number } | null = null;

/** Provider token (ES256). Apple accepts it for 60 min and rejects refreshing more than every 20 min. */
export async function apnsJwt(cfg: ApnsConfig, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  if (cachedJwt && nowSec - cachedJwt.issuedAt < 50 * 60) return cachedJwt.jwt;
  const unsigned = `${b64urlStr(JSON.stringify({ alg: 'ES256', kid: cfg.keyId }))}.${b64urlStr(JSON.stringify({ iss: cfg.teamId, iat: nowSec }))}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToPkcs8(cfg.keyP8), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  // WebCrypto returns raw r||s (64 bytes) — exactly the JWS ES256 format.
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned)));
  cachedJwt = { jwt: `${unsigned}.${b64url(sig)}`, issuedAt: nowSec };
  return cachedJwt.jwt;
}

export interface ApnsMessage { token: string; title: string; body?: string; data?: Record<string, string> }
export type ApnsResult = { ok: true } | { ok: false; unregistered: boolean; error: string };

async function post(host: string, cfg: ApnsConfig, msg: ApnsMessage): Promise<{ status: number; reason: string }> {
  const res = await fetch(`https://${host}/3/device/${msg.token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${await apnsJwt(cfg)}`,
      'apns-topic': cfg.bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      aps: { alert: { title: msg.title, body: msg.body ?? '' }, sound: 'default' },
      ...(msg.data ?? {}),
    }),
  });
  if (res.ok) return { status: res.status, reason: '' };
  let reason = '';
  try { reason = (await res.json()).reason ?? ''; } catch { /* empty body */ }
  return { status: res.status, reason };
}

/** Sends one alert. Production first (TestFlight/App Store); Xcode debug builds have sandbox tokens. Never throws. */
export async function sendApns(msg: ApnsMessage): Promise<ApnsResult> {
  const cfg = loadConfig();
  if (!cfg) return { ok: false, unregistered: false, error: 'no_apns_key' };
  try {
    let r = await post('api.push.apple.com', cfg, msg);
    if (r.status === 400 && r.reason === 'BadDeviceToken') r = await post('api.sandbox.push.apple.com', cfg, msg);
    if (r.status >= 200 && r.status < 300) return { ok: true };
    const unregistered = r.status === 410 || r.reason === 'BadDeviceToken' || r.reason === 'Unregistered';
    console.error('APNs send failed', r.status, r.reason);
    return { ok: false, unregistered, error: `apns_${r.status}_${r.reason}` };
  } catch (err) {
    console.error('APNs send threw', err);
    return { ok: false, unregistered: false, error: 'exception' };
  }
}
