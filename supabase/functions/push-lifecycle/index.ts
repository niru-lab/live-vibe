// Daily lifecycle push job (cron). Conservative by design:
// evaluates a small set of behaviour-based triggers and defers every
// delivery decision (opt-out, quiet hours, caps, dedupe) to _shared/push.ts.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PUSH_TRIGGERS, sendPush } from '../_shared/push.ts';
import { fcmConfigured } from '../_shared/fcm.ts';


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAY = 86_400_000;
const iso = (ms: number) => new Date(Date.now() - ms).toISOString();
/** One dedupe bucket per day, so a retry of the cron never double-sends. */
const dayBucket = () => new Date().toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const result: Record<string, number> = { traction: 0, reengagement: 0 };

  try {
    // ── Trigger: an event you host is gaining traction (venue owners) ──
    if (PUSH_TRIGGERS.event_gaining_traction) {
      const { data: recentRsvps } = await supabase
        .from('event_attendees')
        .select('event_id')
        .gte('created_at', iso(DAY));

      const counts = new Map<string, number>();
      for (const r of recentRsvps ?? []) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
      const hot = [...counts.entries()].filter(([, n]) => n >= 3).slice(0, 200);

      if (hot.length > 0) {
        const { data: events } = await supabase
          .from('events')
          .select('id, name, creator_id')
          .in('id', hot.map(([id]) => id));

        for (const [eventId, n] of hot) {
          const ev = events?.find((e: any) => e.id === eventId);
          if (!ev) continue;
          await sendPush(supabase, {
            profileId: ev.creator_id,
            category: 'event',
            triggerKey: 'event_gaining_traction',
            dedupeKey: `traction:${eventId}:${dayBucket()}`,
            title: `${n} neue Zusagen für „${ev.name}"`,
            body: 'Schau dir an, wie dein Event läuft.',
            url: `/events/${eventId}`,
          });
          result.traction++;
        }
      }
    }

    // ── Trigger: re-engagement for guests who posted once and went quiet ──
    if (PUSH_TRIGGERS.reengagement_inactive) {
      const { data: candidates } = await supabase
        .from('posts')
        .select('author_id, created_at')
        .gte('created_at', iso(14 * DAY))
        .lte('created_at', iso(7 * DAY))
        .limit(500);

      const authors = [...new Set((candidates ?? []).map((p: any) => p.author_id))];
      for (const authorId of authors) {
        // Still inactive? Any post in the last 7 days disqualifies.
        const { count: recent } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', authorId)
          .gte('created_at', iso(7 * DAY));
        if ((recent ?? 0) > 0) continue;

        const { data: prof } = await supabase
          .from('profiles')
          .select('role, city')
          .eq('id', authorId)
          .maybeSingle();
        if (!prof || prof.role === 'venue_owner') continue;

        await sendPush(supabase, {
          profileId: authorId,
          category: 'lifecycle',
          triggerKey: 'reengagement_inactive',
          dedupeKey: `reengage:${authorId}:${dayBucket()}`,
          title: prof.city ? `Was geht heute in ${prof.city}?` : 'Was geht heute bei dir?',
          body: 'Schau rein, wo gerade was läuft.',
          url: '/discover',
        });
        result.reengagement++;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('push-lifecycle error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
