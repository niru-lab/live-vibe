import { useQuery } from '@tanstack/react-query';
import { readPosition } from '@/lib/geo';
import { useLocationConsent } from '@/hooks/useLocationConsent';

/**
 * The user's position for distance labels — only with location opt-in.
 * Read once and reused for 5 minutes; never stored or sent anywhere.
 */
export function useMyPosition() {
  const { enabled } = useLocationConsent();
  return useQuery({
    queryKey: ['my-position'],
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    queryFn: () => readPosition(),
  });
}
