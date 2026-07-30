// Shared push delivery guardrails (MVP).
// Every push goes through `sendPush()` — never insert into push_sends directly.
// All caps live here so they are easy to audit and tune.

export type PushCategory = 'social' | 'event' | 'lifecycle';

/** Conservative defaults. Tune here — no other file hardcodes limits. */
export const PUSH_CAPS = {
  global: { hour: 1, day: 3, week: 8 },
  perCategory: {
    social: { day: 2, week: 6 },
    event: { day: 1, week: 4 },
    lifecycle: { day: 1, week: 1 },
  },
} as const;

/** Which triggers are live. Flip to false to disable a trigger without a code change elsewhere. */
export const PUSH_TRIGGERS = {
  comment_on_your_post: true,
  event_gaining_traction: true,
  reengagement_inactive: true,
} as const;

export interface PushRequest {
  profileId: string;
  category: PushCategory;
  /** Stable trigger name for auditing, e.g. "comment_on_your_post". */
  triggerKey: string;
  /** Must be unique per logical event, e.g. `comment:<comment_id>`. */
  dedupeKey: string;
  title: string;
  body?: string;
  url?: string;
  /** Urgent pushes ignore quiet hours. Default false. */
  urgent?: boolean;
}

type PushStatus =
  | 'delivered'
  | 'skipped_duplicate'
  | 'skipped_opted_out'
  | 'skipped_quiet_hours'
  | 'skipped_cap'
  | 'skipped_no_token'
  | 'skipped_no_provider';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/** Local hour for a timezone, falling back to UTC on invalid tz strings. */
function localHour(timezone: string): number {
  try {
    return Number(
      new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: timezone })
        .format(new Date()),
    );
  } catch {
    return new Date().getUTCHours();
  }
}

/** Handles wrap-around windows like 23 → 9. */
export function inQuietHours(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

async function countSince(supabase: any, profileId: string, since: string, category?: string) {
  let q = supabase
    .from('push_sends')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('status', 'delivered')
    .gte('created_at', since);
  if (category) q = q.eq('category', category);
  const { count } = await q;
  return count ?? 0;
}

/**
 * Evaluates prefs, quiet hours, dedupe and frequency caps, then delivers.
 * Always records the outcome in push_sends so decisions stay auditable.
 * Never throws — a failed push must not break the calling trigger.
 */
export async function sendPush(supabase: any, req: PushRequest): Promise<PushStatus> {
  const record = async (status: PushStatus) => {
    await supabase.from('push_sends').insert({
      profile_id: req.profileId,
      category: req.category,
      trigger_key: req.triggerKey,
      dedupe_key: req.dedupeKey,
      title: req.title,
      body: req.body ?? null,
      url: req.url ?? null,
      status,
    });
    return status;
  };

  try {
    // 1. Dedupe — same logical event never pushes twice.
    const { data: existing } = await supabase
      .from('push_sends')
      .select('id')
      .eq('dedupe_key', req.dedupeKey)
      .maybeSingle();
    if (existing) return 'skipped_duplicate';

    // 2. Preferences / opt-out.
    const { data: prefs } = await supabase
      .from('push_preferences')
      .select('*')
      .eq('profile_id', req.profileId)
      .maybeSingle();
    const p = prefs ?? {
      enabled: true, social_enabled: true, event_enabled: true, lifecycle_enabled: true,
      quiet_hours_start: 23, quiet_hours_end: 9, timezone: 'Europe/Berlin',
    };
    const categoryEnabled =
      req.category === 'social' ? p.social_enabled
        : req.category === 'event' ? p.event_enabled
          : p.lifecycle_enabled;
    if (!p.enabled || !categoryEnabled) return await record('skipped_opted_out');

    // 3. Quiet hours (non-urgent only) — skip rather than queue noise for later.
    if (!req.urgent && inQuietHours(localHour(p.timezone), p.quiet_hours_start, p.quiet_hours_end)) {
      return await record('skipped_quiet_hours');
    }

    // 4. Layered frequency caps: hour → day → week, then per category.
    const [h, d, w, cd, cw] = await Promise.all([
      countSince(supabase, req.profileId, hoursAgo(1)),
      countSince(supabase, req.profileId, hoursAgo(24)),
      countSince(supabase, req.profileId, hoursAgo(24 * 7)),
      countSince(supabase, req.profileId, hoursAgo(24), req.category),
      countSince(supabase, req.profileId, hoursAgo(24 * 7), req.category),
    ]);
    const cat = PUSH_CAPS.perCategory[req.category];
    if (
      h >= PUSH_CAPS.global.hour || d >= PUSH_CAPS.global.day || w >= PUSH_CAPS.global.week ||
      cd >= cat.day || cw >= cat.week
    ) {
      return await record('skipped_cap');
    }

    // 5. Device tokens.
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('profile_id', req.profileId);
    if (!tokens || tokens.length === 0) return await record('skipped_no_token');

    // 6. Delivery via FCM HTTP v1 (Legacy Server Key is dead). Without a
    //    service account we record the decision honestly instead of pretending.
    if (!fcmConfigured()) return await record('skipped_no_provider');

    const results = await Promise.all(
      tokens.map((t: any) =>
        sendFcm({
          token: t.token,
          title: req.title,
          body: req.body,
          data: { url: req.url ?? '/', category: req.category, trigger: req.triggerKey },
        }).then((r) => ({ token: t.token, r })),
      ),
    );

    // Prune dead tokens so caps and counts stay honest.
    const dead = results.filter((x) => !x.r.ok && (x.r as any).unregistered).map((x) => x.token);
    if (dead.length > 0) {
      await supabase.from('push_tokens').delete().in('token', dead);
    }

    const delivered = results.some((x) => x.r.ok);
    return await record(delivered ? 'delivered' : 'skipped_no_token');

  } catch (err) {
    console.error('sendPush failed', req.triggerKey, err);
    return 'skipped_no_provider';
  }
}
