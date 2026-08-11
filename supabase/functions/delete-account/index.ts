// Self-service account deletion. Deletes the *caller's* own account only.
// Auth is enforced by the platform (verify_jwt) plus an explicit token check.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    // 1. Purge all app-side personal data (security definer, service role only).
    const { error: purgeErr } = await admin.rpc("purge_user_data", { _user_id: user.id });
    if (purgeErr) {
      console.error("purge_user_data failed", purgeErr.message);
      return json({ error: "purge_failed" }, 500);
    }

    // 2. Delete the auth account itself.
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error("deleteUser failed", delErr.message);
      return json({ error: "auth_delete_failed" }, 500);
    }

    return json({ deleted: true });
  } catch (err) {
    console.error("delete-account error", err);
    return json({ error: "unexpected" }, 500);
  }
});
