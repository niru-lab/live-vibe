import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ALLOWED_PREFIXES = [
  '/auth',
  '/welcome',
  '/role',
  '/register',
  '/verify',
  '/onboarding',
  '/onboarding-venue',
  '/impressum',
  '/datenschutz',
  '/agb',
];

export const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkedFor, setCheckedFor] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (ALLOWED_PREFIXES.some((p) => location.pathname.startsWith(p))) return;
    if (checkedFor === user.id && location.pathname !== '/') return;

    const VENUE_HOME = '/events';

    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_complete, role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCheckedFor(user.id);
        const role = data?.role as 'guest' | 'venue_owner' | null | undefined;
        if (!data || !data.onboarding_complete) {
          if (!role) {
            navigate('/role', { replace: true });
          } else {
            navigate(role === 'venue_owner' ? '/onboarding-venue' : '/onboarding', { replace: true });
          }
        } else if (location.pathname === '/') {
          if (role === 'venue_owner') {
            navigate(VENUE_HOME, { replace: true });
          } else {
            navigate('/feed', { replace: true });
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading, location.pathname, navigate, checkedFor]);

  return null;
};
