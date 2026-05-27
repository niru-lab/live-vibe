import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Routes that should NOT be gated (auth, onboarding itself, callback, public profile pages)
const ALLOWED_PREFIXES = [
  '/auth',
  '/welcome',
  '/register',
  '/verify',
  '/onboarding',
  '/onboarding-venue',
];

export const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkedFor, setCheckedFor] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (ALLOWED_PREFIXES.some((p) => location.pathname.startsWith(p))) return;
    // Note: '/' is intentionally NOT excluded — logged-in users on '/' should be
    // redirected to /onboarding (if incomplete) or /feed (if complete).
    if (checkedFor === user.id && location.pathname !== '/') return;

    const VENUE_HOME = '/'; // later '/dashboard' once it exists

    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_complete, role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCheckedFor(user.id);
        const role = (data as any)?.role;
        if (!data || !data.onboarding_complete) {
          navigate(role === 'venue_owner' ? '/onboarding-venue' : '/onboarding', { replace: true });
        } else if (location.pathname === '/') {
          if (role === 'venue_owner') {
            if (VENUE_HOME !== '/') navigate(VENUE_HOME, { replace: true });
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
