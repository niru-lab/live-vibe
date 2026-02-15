import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HIGH_FOLLOWER_THRESHOLD = 5000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // 1. Claim pending outbox events (batch of 50)
    const { data: events, error: fetchErr } = await supabase
      .from('outbox_events')
      .update({ status: 'processing', attempts: 1 })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)
      .select();

    if (fetchErr) throw fetchErr;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const evt of events) {
      try {
        switch (evt.event_type) {
          case 'post_created':
            await handlePostCreated(supabase, evt.payload);
            break;
          case 'like_added':
            await handleLikeAdded(supabase, evt.payload);
            break;
          case 'comment_added':
            await handleCommentAdded(supabase, evt.payload);
            break;
          case 'follow_added':
            await handleFollowAdded(supabase, evt.payload);
            break;
          case 'rsvp_changed':
            await handleRsvpChanged(supabase, evt.payload);
            break;
        }

        await supabase
          .from('outbox_events')
          .update({ status: 'done', processed_at: new Date().toISOString() })
          .eq('id', evt.id);

        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        const newAttempts = (evt.attempts || 0) + 1;
        await supabase
          .from('outbox_events')
          .update({
            status: newAttempts >= evt.max_attempts ? 'failed' : 'pending',
            attempts: newAttempts,
            error_message: msg,
          })
          .eq('id', evt.id);
      }
    }

    return new Response(JSON.stringify({ processed, total: events.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Outbox processor error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// ── HANDLERS ──────────────────────────────────────────────

async function handlePostCreated(supabase: any, payload: any) {
  const { post_id, author_id, post_type, city_id, latitude, longitude } = payload;

  // Points: +10 for posting
  await supabase.rpc('add_points', {
    p_profile_id: author_id,
    p_delta: 10,
    p_reason: 'post_created',
    p_ref_type: 'post',
    p_ref_id: post_id,
  });

  // Fanout-on-write: get followers count first
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', author_id);

  if ((count || 0) < HIGH_FOLLOWER_THRESHOLD) {
    // Standard fanout: insert timeline items for all followers
    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', author_id);

    if (followers && followers.length > 0) {
      // Calculate score
      const score = Date.now() / 1000; // Simple timestamp-based score

      const timelineRows = followers.map((f: any) => ({
        user_id: f.follower_id,
        post_id,
        score,
      }));

      // Batch insert (upsert to be idempotent)
      await supabase.from('timeline_items').upsert(timelineRows, {
        onConflict: 'user_id,post_id',
        ignoreDuplicates: true,
      });
    }

    // Also add to author's own timeline
    await supabase.from('timeline_items').upsert(
      { user_id: author_id, post_id, score: Date.now() / 1000 },
      { onConflict: 'user_id,post_id', ignoreDuplicates: true }
    );
  }

  // Hotspot update for moment_x posts
  if (post_type === 'moment_x' && latitude && longitude && city_id) {
    const cellId = latLngToCell(latitude, longitude);
    const now = new Date();
    const windowStart = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()
    ).toISOString();
    const windowEnd = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1
    ).toISOString();

    await supabase.from('hotspot_cells').upsert(
      {
        city_id,
        cell_id: cellId,
        window_start: windowStart,
        window_end: windowEnd,
        post_count: 1,
        engagement_score: 1,
        center_lat: latitude,
        center_lng: longitude,
      },
      { onConflict: 'city_id,cell_id,window_start' }
    );

    // Increment existing
    await supabase.rpc('increment_hotspot', {
      p_city_id: city_id,
      p_cell_id: cellId,
      p_window_start: windowStart,
    }).catch(() => {
      // RPC may not exist yet, the upsert above handles creation
    });
  }
}

async function handleLikeAdded(supabase: any, payload: any) {
  const { post_id, user_id } = payload;

  // Get post author
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', post_id)
    .single();

  if (post && post.author_id !== user_id) {
    // Points: +1 to post author
    await supabase.rpc('add_points', {
      p_profile_id: post.author_id,
      p_delta: 1,
      p_reason: 'like_received',
      p_ref_type: 'post',
      p_ref_id: post_id,
    });

    // Notification
    await supabase.from('notifications').insert({
      recipient_id: post.author_id,
      actor_id: user_id,
      type: 'like',
      ref_type: 'post',
      ref_id: post_id,
      title: 'Neuer Like',
      body: 'Jemand hat deinen Post geliked',
    });
  }
}

async function handleCommentAdded(supabase: any, payload: any) {
  const { post_id, user_id, comment_id } = payload;

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', post_id)
    .single();

  if (post && post.author_id !== user_id) {
    await supabase.rpc('add_points', {
      p_profile_id: post.author_id,
      p_delta: 2,
      p_reason: 'comment_received',
      p_ref_type: 'post',
      p_ref_id: post_id,
    });

    await supabase.from('notifications').insert({
      recipient_id: post.author_id,
      actor_id: user_id,
      type: 'comment',
      ref_type: 'post',
      ref_id: post_id,
      title: 'Neuer Kommentar',
      body: 'Jemand hat deinen Post kommentiert',
    });
  }
}

async function handleFollowAdded(supabase: any, payload: any) {
  const { follower_id, following_id } = payload;

  await supabase.rpc('add_points', {
    p_profile_id: following_id,
    p_delta: 5,
    p_reason: 'new_follower',
    p_ref_type: 'profile',
    p_ref_id: follower_id,
  });

  await supabase.from('notifications').insert({
    recipient_id: following_id,
    actor_id: follower_id,
    type: 'follow',
    ref_type: 'profile',
    ref_id: follower_id,
    title: 'Neuer Follower',
    body: 'Jemand folgt dir jetzt',
  });
}

async function handleRsvpChanged(supabase: any, payload: any) {
  const { event_id, user_id, status } = payload;

  if (status === 'accepted') {
    await supabase.rpc('add_points', {
      p_profile_id: user_id,
      p_delta: 3,
      p_reason: 'event_rsvp',
      p_ref_type: 'event',
      p_ref_id: event_id,
    });
  }

  // Notify event creator
  const { data: event } = await supabase
    .from('events')
    .select('creator_id')
    .eq('id', event_id)
    .single();

  if (event) {
    await supabase.from('notifications').insert({
      recipient_id: event.creator_id,
      actor_id: user_id,
      type: 'event_invite',
      ref_type: 'event',
      ref_id: event_id,
      title: 'RSVP Update',
      body: `Jemand hat mit "${status}" geantwortet`,
    });
  }
}

// Simple geohash-like cell ID (precision ~100m)
function latLngToCell(lat: number, lng: number): string {
  const latCell = Math.floor(lat * 100);
  const lngCell = Math.floor(lng * 100);
  return `${latCell}_${lngCell}`;
}
