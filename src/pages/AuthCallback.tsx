import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      supabase
        .from('profiles')
        .select('onboarding_complete, role')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          const role = data?.role as 'guest' | 'venue_owner' | null | undefined;
          if (!data || !data.onboarding_complete) {
            if (!role) {
              navigate('/role', { replace: true });
            } else {
              navigate(role === 'venue_owner' ? '/onboarding-venue' : '/onboarding', { replace: true });
            }
          } else {
            navigate(role === 'venue_owner' ? '/' : '/feed', { replace: true });
          }
        });
    } else if (!loading && !user) {
      // Wait a moment for session to settle
      const t = setTimeout(() => navigate('/welcome', { replace: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#08080f' }}>
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
    </div>
  );
}
