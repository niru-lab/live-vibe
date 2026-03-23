import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/onboarding', { replace: true });
    } else if (!loading && !user) {
      // Wait a moment for session to settle
      const t = setTimeout(() => navigate('/auth', { replace: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#08080f' }}>
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
    </div>
  );
}
