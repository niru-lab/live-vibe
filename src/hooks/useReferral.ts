import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

const REF_STORAGE_KEY = 'feyrn_ref';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Builds the personal invite link for a profile. */
export const buildReferralUrl = (profileId?: string | null, path = '/') => {
  const base = `${window.location.origin}${path}`;
  if (!profileId) return base;
  const url = new URL(base);
  url.searchParams.set('ref', profileId);
  return url.toString();
};

/** Logs one share action (fire-and-forget, never blocks the share UX). */
export const logReferralShare = async (
  profileId: string | null | undefined,
  context: string,
  channel = 'link',
) => {
  if (!profileId) return;
  try {
    await supabase.from('referral_shares').insert({ profile_id: profileId, context, channel });
  } catch {
    /* analytics must never break the share flow */
  }
};

/**
 * Captures a ?ref=<profileId> param and attributes the signup once the
 * current user has a profile. Idempotent: unique constraint + local flag.
 */
export const useReferralCapture = () => {
  const { data: profile } = useProfile();
  const attempted = useRef(false);
  const queryClient = useQueryClient();

  // Capture as early as possible, even before login.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && UUID_RE.test(ref)) {
      try {
        localStorage.setItem(REF_STORAGE_KEY, ref);
      } catch { /* storage disabled */ }
    }
  }, []);

  useEffect(() => {
    if (!profile?.id || attempted.current) return;
    let ref: string | null = null;
    try {
      ref = localStorage.getItem(REF_STORAGE_KEY);
    } catch { /* storage disabled */ }
    if (!ref || !UUID_RE.test(ref) || ref === profile.id) return;
    attempted.current = true;

    (async () => {
      const { error } = await supabase
        .from('referrals')
        .insert({ referrer_profile_id: ref!, referred_profile_id: profile.id });
      // Duplicate / not allowed → nothing to retry, clear either way.
      try {
        localStorage.removeItem(REF_STORAGE_KEY);
      } catch { /* storage disabled */ }
      if (!error) queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    })();
  }, [profile?.id, queryClient]);
};

export interface ReferralStats {
  sharesCount: number;
  joinedCount: number;
}

export const useReferralStats = (profileId?: string | null) =>
  useQuery({
    queryKey: ['referral-stats', profileId],
    enabled: !!profileId,
    staleTime: 60_000,
    queryFn: async (): Promise<ReferralStats> => {
      const [shares, joined] = await Promise.all([
        supabase
          .from('referral_shares')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId!),
        supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_profile_id', profileId!),
      ]);
      return {
        sharesCount: shares.count ?? 0,
        joinedCount: joined.count ?? 0,
      };
    },
  });

export interface TopInviter {
  profile_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  joined_count: number;
}

/** Top inviters of the last 30 days. Degrades to [] when data is thin. */
export const useTopInviters = (enabled = true) =>
  useQuery({
    queryKey: ['top-inviters'],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TopInviter[]> => {
      const { data, error } = await supabase.rpc('top_inviters', { _limit: 5 });
      if (error) return [];
      return (data ?? []).map((r) => ({ ...r, joined_count: Number(r.joined_count) }));
    },
  });
