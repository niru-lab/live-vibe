import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useCityPreferences } from './useCityPreferences';
import { normalizeList, type GuestPreferences } from '@/lib/personalization';

/**
 * Guest personalization preferences (cities + music genres) from onboarding/profile.
 * Venue owners and users without preferences get empty lists, so consumers can
 * treat "no preference" as "keep default ranking".
 */
export const useGuestPreferences = (): GuestPreferences & { hasPreferences: boolean } => {
  const { data: profile } = useProfile();
  const { cities } = useCityPreferences();

  return useMemo(() => {
    const isVenue = profile?.role === 'venue_owner';
    const genres = isVenue ? [] : normalizeList(profile?.music_genres);
    return {
      cities,
      genres,
      hasPreferences: cities.length > 0 || genres.length > 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, cities.join('|')]);
};
