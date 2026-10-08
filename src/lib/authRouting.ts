import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type ProfileRole = 'guest' | 'venue_owner' | null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Single source of truth for where a signed-in user lands.
 * Profiles are created server-side by the signup trigger — the client only reads.
 */
export const resolvePostAuthRoute = async (user: User): Promise<string> => {
  let profile: { role: string | null; onboarding_complete: boolean | null } | null = null;
  for (let i = 0; i < 5 && !profile; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('role, onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle();
    profile = data;
    if (!profile) await sleep(400);
  }

  const role = (profile?.role ?? null) as ProfileRole;
  if (!profile || !role) return '/role';
  if (!profile.onboarding_complete) {
    return role === 'venue_owner' ? '/onboarding-venue' : '/onboarding';
  }
  return role === 'venue_owner' ? '/events' : '/feed';
};
