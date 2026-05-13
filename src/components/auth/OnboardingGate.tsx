import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Routes that should NOT be gated (auth, onboarding itself, callback, public profile pages)
const ALLOWED_PREFIXES = [
  '/auth',
  '/register',
  '/verify',
  '/onboarding',
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

    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCheckedFor(user.id);
        if (!data || !data.onboarding_complete) {
          navigate('/onboarding', { replace: true });
        } else if (location.pathname === '/') {
          navigate('/feed', { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading, location.pathname, navigate, checkedFor]);

  return null;
};
