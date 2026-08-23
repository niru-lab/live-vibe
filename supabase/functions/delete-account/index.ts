import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Session ungültig' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userId = user.id;
    const errors: string[] = [];

    // Delete post-media files
    try {
      const { data: postFiles } = await adminClient.storage
        .from('post-media').list(userId);
      if (postFiles && postFiles.length > 0) {
        await adminClient.storage.from('post-media')
          .remove(postFiles.map((f) => `${userId}/${f.name}`));
      }
    } catch (e) { errors.push(`post-media: ${e}`); }

    // Delete avatar files
    try {
      const { data: avatarFiles } = await adminClient.storage
        .from('avatars').list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        await adminClient.storage.from('avatars')
          .remove(avatarFiles.map((f) => `${userId}/${f.name}`));
      }
    } catch (e) { errors.push(`avatars: ${e}`); }

    // Delete push tokens
    try {
      await adminClient.from('push_tokens').delete().eq('user_id', userId);
    } catch (e) { errors.push(`push_tokens: ${e}`); }

    // Delete auth user — triggers all DB cascades
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Löschung fehlgeschlagen', detail: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, storageErrors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Interner Fehler', detail: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
