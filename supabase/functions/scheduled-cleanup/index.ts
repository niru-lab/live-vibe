import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const results: Record<string, any> = {};

  try {
    // 1. Delete expired Moment X posts
    const { data: expiredPosts, error: expErr } = await supabase
      .from('posts')
      .delete()
      .eq('post_type', 'moment_x')
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .select('id');

    results.expired_moment_x = expiredPosts?.length || 0;
    if (expErr) console.error('Moment X cleanup error:', expErr);

    // 2. Also clean up any other expired posts (legacy)
    const { data: legacyExpired } = await supabase
      .from('posts')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .select('id');

    results.expired_legacy = legacyExpired?.length || 0;

    // 3. Clean old hotspot windows (older than 24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: oldHotspots } = await supabase
      .from('hotspot_cells')
      .delete()
      .lt('window_end', cutoff)
      .select('id');

    results.old_hotspots = oldHotspots?.length || 0;

    // 4. Clean processed outbox events older than 7 days
    const outboxCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldOutbox } = await supabase
      .from('outbox_events')
      .delete()
      .eq('status', 'done')
      .lt('processed_at', outboxCutoff)
      .select('id');

    results.old_outbox = oldOutbox?.length || 0;

    // 5. Clean old notifications (older than 90 days)
    const notifCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldNotifs } = await supabase
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', notifCutoff)
      .select('id');

    results.old_notifications = oldNotifs?.length || 0;

    console.log('Cleanup results:', results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    console.error('Cleanup error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
