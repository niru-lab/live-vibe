import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';
import { walletCardState } from '@/lib/offers';

export type WalletItem = Database['public']['Functions']['my_deal_wallet']['Returns'][number];
export type RedeemResult = Database['public']['Functions']['redeem_deal']['Returns'][number];

const cacheKey = (profileId: string) => `feyrn.deal-wallet.${profileId}`;

function readCache(profileId: string): WalletItem[] | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(profileId));
    return raw ? (JSON.parse(raw) as WalletItem[]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The user's own deal tickets. Cached on the device so the QR codes still open
 * in a basement club without reception; the venue's scanner checks validity online.
 */
export const useDealWallet = (opts?: { /** Poll every few seconds while a QR is shown, so "Eingelöst" appears right after the scan. */ live?: boolean }) => {
  const { data: profile } = useProfile();
  const query = useQuery({
    queryKey: ['deal-wallet', profile?.id],
    enabled: !!profile?.id,
    networkMode: 'offlineFirst',
    staleTime: 30_000,
    refetchInterval: opts?.live ? 4_000 : 60_000,
    initialData: () => (profile?.id ? readCache(profile.id) : undefined),
    initialDataUpdatedAt: 0,
    queryFn: async (): Promise<WalletItem[]> => {
      const { data, error } = await supabase.rpc('my_deal_wallet');
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!profile?.id || !query.data || query.isPlaceholderData) return;
    try { localStorage.setItem(cacheKey(profile.id), JSON.stringify(query.data)); } catch { /* storage full */ }
  }, [profile?.id, query.data, query.isPlaceholderData]);

  return query;
};

/** Venues the signed-in user may scan deals for (owner or invited bar staff). */
export const useScanVenues = () => {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['scan-venues', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_scan_venues');
      if (error) throw error;
      return data ?? [];
    },
  });
};

/** Scan a QR token or type the 6-character backup code. Every attempt is logged server-side. */
export const useRedeemDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ venueId, code }: { venueId: string; code: string }): Promise<RedeemResult> => {
      const { data, error } = await supabase.rpc('redeem_deal', { _venue_id: venueId, _code: code });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as RedeemResult;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-offer-stats'] }),
  });
};

export const useVenueStaff = (venueId: string | undefined) =>
  useQuery({
    queryKey: ['venue-staff', venueId],
    enabled: !!venueId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_venue_staff', { _venue_id: venueId! });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useCreateStaffInvite = () =>
  useMutation({
    mutationFn: async (venueId: string) => {
      const { data, error } = await supabase.rpc('create_staff_invite', { _venue_id: venueId });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as { code: string; expires_at: string };
    },
  });

export const useRemoveStaff = (venueId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_venue_staff', { _venue_id: venueId!, _user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-staff', venueId] }),
  });
};

export const useAcceptStaffInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('accept_staff_invite', { _code: code });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as { venue_id: string; venue_name: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scan-venues'] }),
  });
};

/** Number of tickets that can still be used — for the profile tab label. */
export const useOpenDealsCount = () => {
  const { data } = useDealWallet();
  return (data ?? []).filter((i) => {
    const s = walletCardState(i);
    return s === 'ready' || s === 'upcoming';
  }).length;
};
