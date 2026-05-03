/**
 * FEYRN — Test Seed Users
 *
 * Erstellt/aktualisiert Test-User idempotent und gibt Sessions zurück.
 * Geschützt durch TEST_SEED_SECRET (x-seed-secret Header).
 *
 * POST body: { users: [{ email, password, username, displayName, age, profileType? }] }
 * Response:  { users: [{ email, userId, profileId, accessToken, refreshToken }] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seed-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SeedUser {
  email: string;
  password: string;
  username: string;
  displayName: string;
  age: number;
  profileType?: "user" | "eventer";
  city?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth gate
  const provided = req.headers.get("x-seed-secret");
  const expected = Deno.env.get("TEST_SEED_SECRET");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { users: SeedUser[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(body?.users) || body.users.length === 0) {
    return new Response(JSON.stringify({ error: "users[] required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: Array<{
    email: string;
    userId: string;
    profileId: string;
    accessToken: string;
    refreshToken: string;
  }> = [];

  for (const u of body.users) {
    // 1) Find or create auth user
    let userId: string | null = null;

    // listUsers (paginated) — small test pool, page 1 is fine
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) {
      return new Response(
        JSON.stringify({ error: "listUsers failed", detail: listErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const existing = list.users.find(
      (x) => x.email?.toLowerCase() === u.email.toLowerCase(),
    );

    if (existing) {
      userId = existing.id;
      // Ensure password + email confirmed
      await admin.auth.admin.updateUserById(userId, {
        password: u.password,
        email_confirm: true,
        user_metadata: { username: u.username, display_name: u.displayName },
      });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { username: u.username, display_name: u.displayName },
      });
      if (createErr || !created.user) {
        return new Response(
          JSON.stringify({
            error: "createUser failed",
            email: u.email,
            detail: createErr?.message,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userId = created.user.id;
    }

    // 2) Upsert profile (handle_new_user trigger creates a base row; we patch it)
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          username: u.username,
          display_name: u.displayName,
          age: u.age,
          profile_type: u.profileType ?? "user",
          city: u.city ?? "Stuttgart",
          onboarding_complete: true,
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single();

    if (profErr || !profile) {
      return new Response(
        JSON.stringify({
          error: "profile upsert failed",
          email: u.email,
          detail: profErr?.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Sign in with password to get a real session (access + refresh token)
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signIn, error: signErr } = await userClient.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });
    if (signErr || !signIn.session) {
      return new Response(
        JSON.stringify({
          error: "signIn failed",
          email: u.email,
          detail: signErr?.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    results.push({
      email: u.email,
      userId,
      profileId: profile.id,
      accessToken: signIn.session.access_token,
      refreshToken: signIn.session.refresh_token,
    });
  }

  // Auto-follow: ensure first user follows all others (test invite flow needs followers)
  if (results.length >= 2) {
    const follower = results[0];
    for (let i = 1; i < results.length; i++) {
      const following = results[i];
      const { data: existing } = await admin
        .from('follows')
        .select('id')
        .eq('follower_id', follower.profileId)
        .eq('following_id', following.profileId)
        .maybeSingle();
      if (!existing) {
        await admin.from('follows').insert({
          follower_id: follower.profileId,
          following_id: following.profileId,
        });
      }
    }
  }

  return new Response(JSON.stringify({ users: results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
