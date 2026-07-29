import { useMemo } from 'react';
import { useProfile } from './useProfile';

/**
 * Guest city preferences from onboarding (profiles.cities, legacy fallback: profiles.city).
 * Returns an empty list for venue owners and for users without preferences, so all
 * consumers can treat "no preference" as "keep default behaviour".
 */
export const useCityPreferences = () => {
  const { data: profile } = useProfile();

  return useMemo(() => {
    if (!profile) return { cities: [] as string[], hasPreferences: false };
    if (profile.role === 'venue_owner') return { cities: [] as string[], hasPreferences: false };

    const raw = [
      ...((profile.cities as string[] | null) ?? []),
      ...(profile.city ? [profile.city] : []),
    ];
    const cities = Array.from(
      new Set(raw.filter(Boolean).map((c) => c.trim().toLowerCase()).filter((c) => c.length > 0)),
    );

    return { cities, hasPreferences: cities.length > 0 };
  }, [profile]);
};
