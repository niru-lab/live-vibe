import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { motion } from 'framer-motion';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/onboarding');
    }
  }, [user, loading, navigate]);

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) console.error('Google auth error:', error);
  };

  const handleApple = async () => {
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) console.error('Apple auth error:', error);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6" style={{ background: '#08080f' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex w-full max-w-[320px] flex-col items-center"
      >
        {/* Logo */}
        <div className="mb-3 flex items-center gap-2">
          <img src="/icon-192.png" alt="Feyrn" className="h-8 w-8 rounded-lg" />
          <FeyrnLogo size="lg" />
        </div>
        <p className="mb-6 text-sm" style={{ color: '#888888' }}>
          Wo die Party beginnt
        </p>

        {/* Badges */}
        <div className="mb-10 flex gap-2">
          {['Stuttgart', 'Echtzeit', 'Gen-Z'].map((label) => (
            <span
              key={label}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: 'rgba(127, 119, 221, 0.12)',
                color: '#9d97e8',
                border: '0.5px solid rgba(127, 119, 221, 0.25)',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Auth Buttons */}
        <button
          onClick={handleGoogle}
          className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#ffffff', color: '#1a1a1a' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Mit Google anmelden
        </button>

        <button
          onClick={handleApple}
          className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '0.5px solid #2a2a3a' }}
        >
          <svg width="16" height="18" viewBox="0 0 16 18" fill="white">
            <path d="M13.1 9.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.4 2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.04 1.4-.7 2.6-.7 1.2 0 1.6.7 2.6.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.1h.3zM11 3.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.7-.5 2.3-1.1z"/>
          </svg>
          Mit Apple anmelden
        </button>

        {/* Divider */}
        <div className="my-4 flex w-full items-center gap-3">
          <div className="h-px flex-1" style={{ background: '#2a2a3a' }} />
          <span className="text-xs" style={{ color: '#888888' }}>oder</span>
          <div className="h-px flex-1" style={{ background: '#2a2a3a' }} />
        </div>

        <button
          onClick={() => navigate('/register')}
          className="w-full rounded-xl px-4 py-3 text-sm transition-opacity hover:opacity-80"
          style={{ color: '#888888', border: '0.5px solid #2a2a3a' }}
        >
          Mit E-Mail oder Nummer
        </button>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px]" style={{ color: '#555' }}>
          Durch Anmelden stimmst du den{' '}
          <span style={{ color: '#9d97e8' }}>Nutzungsbedingungen</span> zu.
        </p>
      </motion.div>
    </div>
  );
}
