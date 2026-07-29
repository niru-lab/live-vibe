import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthRoute } from '@/lib/authRouting';

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (handled.current) return;
      handled.current = true;
      resolvePostAuthRoute(user)
        .then((route) => navigate(route, { replace: true }))
        .catch(() => navigate('/role', { replace: true }));
      return;
    }

    // No session yet — give Supabase a moment to process the URL fragment.
    const t = setTimeout(() => navigate('/welcome', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#08080f' }}>
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
    </div>
  );
}
