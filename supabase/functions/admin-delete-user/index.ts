import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== Deno.env.get("TEST_SEED_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const { email } = await req.json();
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const user = data.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return new Response(JSON.stringify({ found: false }), { status: 404 });
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
  return new Response(JSON.stringify({ deleted: true, id: user.id, email: user.email }));
});
