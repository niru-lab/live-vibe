import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type ProfileRole = 'guest' | 'venue_owner' | null;

const safeUsername = (user: User) => {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta = typeof meta.username === 'string' ? meta.username : undefined;
  const base =
    fromMeta ||
    (user.email ? user.email.split('@')[0] : undefined) ||
    'feyrn_user';
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20) || 'feyrn_user';
  return `${clean}_${user.id.slice(0, 4)}`;
};

const safeDisplayName = (user: User) => {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta =
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name);
  return fromMeta || (user.email ? user.email.split('@')[0] : 'Feyrn User');
};

/**
 * Ensures a profile row exists for the authenticated user (idempotent),
 * then returns the route the user should land on.
 */
export const resolvePostAuthRoute = async (user: User): Promise<string> => {
  const { data: existing } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();

  let profile = existing;

  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        username: safeUsername(user),
        display_name: safeDisplayName(user),
        role: null,
        onboarding_complete: false,
      })
      .select('role, onboarding_complete')
      .maybeSingle();

    if (created) {
      profile = created;
    } else {
      // Insert may have raced with a concurrent bootstrap — re-read.
      const { data: reread } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();
      profile = reread;
    }
  }

  const role = (profile?.role ?? null) as ProfileRole;

  if (!profile || !role) return '/role';
  if (!profile.onboarding_complete) {
    return role === 'venue_owner' ? '/onboarding-venue' : '/onboarding';
  }
  return role === 'venue_owner' ? '/events' : '/feed';
};
